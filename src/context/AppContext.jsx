import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, authRedirectTo } from '../lib/supabase';
import { migrateUserStorage, userKey } from '../utils/userStorage';

const AppContext = createContext();

const DEFAULT_PROFILE = { agencyName: '', phone: '', name: '', email: '' };

/**
 * Session user → the shape the app has always consumed.
 *
 * `role` comes from `app_metadata`, which is signed into the JWT and writable
 * only with the service-role key. `user_metadata` is self-writable by any
 * signed-in browser, so it must never decide authorization. The old rule
 * (`email.includes('admin')`) handed the admin panel to anyone who could type
 * an email address.
 */
const mapUser = (sessionUser) => {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    role: sessionUser.app_metadata?.role === 'admin' ? 'admin' : 'salesperson',
    name: sessionUser.user_metadata?.name || '',
  };
};

const authFailure = (error) => ({
  ok: false,
  code: error?.code || 'unknown_error',
  status: error?.status,
  message: error?.message || '',
});

const NOT_CONFIGURED = { ok: false, code: 'not_configured', message: 'Supabase is not configured' };

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  /**
   * CRITICAL. Session restore is asynchronous: on the first paint after a
   * refresh there is no user yet. Without this flag `RequireAuth` reads
   * `!user` and bounces every signed-in visitor to the landing page before the
   * session comes back.
   */
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    // Unconfigured deploys never load a session, so `authLoading` already
    // initialises to false — nothing to await, nothing to unset here.
    if (!supabase) return undefined;

    let active = true;
    const applySession = (session) => {
      const nextUser = mapUser(session?.user);
      if (nextUser) migrateUserStorage(nextUser.id, nextUser.email);
      setUser(nextUser);
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.warn('[auth] session restore failed:', error.message);
        applySession(data?.session);
      })
      .catch((err) => {
        // A rejected promise here (bad URL, offline, blocked storage) must still
        // clear the flag. Leaving it set parks the whole app on the loader.
        console.warn('[auth] session restore threw:', err?.message || err);
        if (active) applySession(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    // Fires on sign-in, sign-out, token refresh and cross-tab changes.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      applySession(session);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Per-user preferences. Still localStorage, keyed by `user.id`.
  //
  // `plan` is NOT here any more. It used to be `salesmate_plan`, which meant
  // localStorage.setItem('salesmate_plan', 'Growth') unlocked every paid
  // feature. It now comes from the `subscriptions` table, below.
  // ---------------------------------------------------------------------------
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  // Which account the three states above were loaded for. The persist effects
  // below refuse to write until it matches the active user, otherwise the
  // outgoing user's plan lands under the incoming user's key.
  const [loadedUid, setLoadedUid] = useState(null);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setOnboarded(false);
      setProfile(DEFAULT_PROFILE);
      setLoadedUid(null);
      return;
    }
    setOnboarded(localStorage.getItem(userKey('salesmate_onboarded_', uid)) === 'true');
    const savedProfile = localStorage.getItem(userKey('salesmate_profile_', uid));
    setProfile(savedProfile
      ? JSON.parse(savedProfile)
      : { ...DEFAULT_PROFILE, email: user.email || '', name: user.name || '' });
    setLoadedUid(uid);
  }, [user]);

  const canPersist = Boolean(user?.id) && loadedUid === user?.id;

  // True between "session arrived" and "this account's state is in memory".
  // Guards must wait on it before reading `onboarded`, which still holds the
  // previous account's value during that window.
  const userDataLoading = Boolean(user?.id) && loadedUid !== user.id;

  useEffect(() => {
    if (!canPersist) return;
    localStorage.setItem(userKey('salesmate_onboarded_', user.id), String(onboarded));
  }, [onboarded, canPersist, user?.id]);

  useEffect(() => {
    if (!canPersist) return;
    localStorage.setItem(userKey('salesmate_profile_', user.id), JSON.stringify(profile));
  }, [profile, canPersist, user?.id]);

  // ---------------------------------------------------------------------------
  // Organization membership. Every row in the database carries an org_id, so
  // nothing can be written until this resolves.
  // ---------------------------------------------------------------------------
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState(null);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setOrg(null);
      setOrgError(null);
      return undefined;
    }

    let active = true;
    setOrgLoading(true);
    setOrgError(null);

    supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn('[org] membership lookup failed:', error.message);
          setOrgError(error.message);
          setOrg(null);
          return;
        }
        // No membership means the sign-up trigger never ran for this account —
        // it will see an empty app and every write will fail RLS. Surface it
        // rather than letting the user type into a void.
        if (!data) setOrgError('no_membership');
        setOrg(data ? { id: data.org_id, role: data.role } : null);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('[org] membership lookup threw:', err?.message || err);
        setOrgError(err?.message || 'lookup_failed');
      })
      .finally(() => {
        if (active) setOrgLoading(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  // ---------------------------------------------------------------------------
  // Entitlements. The plan and its feature matrix come from the server; the
  // client only renders them. Postgres enforces the same rules through RLS, so
  // tampering with anything here changes what is drawn, never what is allowed.
  // ---------------------------------------------------------------------------
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState({});
  const [entitlementsLoading, setEntitlementsLoading] = useState(false);

  useEffect(() => {
    if (!supabase || !org?.id) {
      setSubscription(null);
      setFeatures({});
      return undefined;
    }

    let active = true;
    setEntitlementsLoading(true);

    supabase
      .from('subscriptions')
      .select('plan_code, status, current_period_end')
      .eq('org_id', org.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          if (error) console.warn('[billing] subscription lookup failed:', error.message);
          setSubscription(null);
          setFeatures({});
          return;
        }
        setSubscription(data);

        const { data: rows, error: featureError } = await supabase
          .from('plan_features')
          .select('feature_key, enabled, limit_value')
          .eq('plan_code', data.plan_code);

        if (!active) return;
        if (featureError) {
          console.warn('[billing] feature matrix failed:', featureError.message);
          setFeatures({});
          return;
        }
        setFeatures(Object.fromEntries(
          (rows || []).map((r) => [r.feature_key, { enabled: r.enabled, limit: r.limit_value }])
        ));
      })
      .catch((err) => {
        if (active) console.warn('[billing] entitlements threw:', err?.message || err);
      })
      .finally(() => {
        if (active) setEntitlementsLoading(false);
      });

    return () => { active = false; };
  }, [org?.id]);

  // An expired or unpaid subscription entitles nothing, matching org_has_feature().
  const subscriptionActive = Boolean(
    subscription
    && ['trialing', 'active'].includes(subscription.status)
    && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())
  );

  const plan = subscriptionActive ? subscription.plan_code : 'Trial';

  // ---------------------------------------------------------------------------
  // Theme and currency are device-level, not account-level.
  // ---------------------------------------------------------------------------
  const [theme, setTheme] = useState(() => localStorage.getItem('salesmate_theme') || 'dark');

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    localStorage.setItem('salesmate_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [selectedCurrency, setSelectedCurrency] = useState('SAR');
  const [detectedCountry, setDetectedCountry] = useState('المملكة العربية السعودية 🇸🇦');
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsDetecting(true);
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          const countryName = data.country_name;
          const countryFlag = data.country_emoji || '';
          setDetectedCountry(`${countryName} ${countryFlag}`);

          if (countryCode === 'SA') setSelectedCurrency('SAR');
          else if (countryCode === 'AE') setSelectedCurrency('AED');
          else if (countryCode === 'EG') setSelectedCurrency('EGP');
          else if (countryCode === 'JO') setSelectedCurrency('JOD');
          else setSelectedCurrency('USD');
        } else {
          throw new Error('Fallback to timezone');
        }
      } catch {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.includes('Riyadh') || tz.includes('Qatar') || tz.includes('Kuwait')) {
          setSelectedCurrency('SAR');
          setDetectedCountry('المملكة العربية السعودية 🇸🇦');
        } else if (tz.includes('Dubai')) {
          setSelectedCurrency('AED');
          setDetectedCountry('الإمارات العربية المتحدة 🇦🇪');
        } else if (tz.includes('Cairo')) {
          setSelectedCurrency('EGP');
          setDetectedCountry('جمهورية مصر العربية 🇪🇬');
        } else if (tz.includes('Amman')) {
          setSelectedCurrency('JOD');
          setDetectedCountry('الأردن 🇯🇴');
        } else {
          setSelectedCurrency('USD');
          setDetectedCountry('دولي 🇺🇸');
        }
      } finally {
        setIsDetecting(false);
      }
    };
    detectLocation();
  }, []);

  // ---------------------------------------------------------------------------
  // Auth actions. All async, all return a result object — never a bare `true`.
  // ---------------------------------------------------------------------------
  const signIn = useCallback(async (email, password) => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return authFailure(error);
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email, password, name = '') => {
    if (!supabase) return NOT_CONFIGURED;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirectTo,
        data: name ? { name } : undefined,
      },
    });
    if (error) return authFailure(error);
    // With email confirmation enabled the user exists but has no session yet.
    return { ok: true, needsConfirmation: !data?.session };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      return { ok: true };
    }
    const { error } = await supabase.auth.signOut();
    // Drop the local session either way: a network failure here must not leave
    // the UI showing an account the user asked to leave.
    setUser(null);
    if (error) return authFailure(error);
    return { ok: true };
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTo,
    });
    if (error) return authFailure(error);
    return { ok: true };
  }, []);

  // ---------------------------------------------------------------------------
  // Plan gating.
  //
  // This decides what to RENDER. It is not the security boundary — RLS is. The
  // entitlement rules are no longer hardcoded here; they come from
  // `plan_features`, so changing what a tier includes is a database update, not
  // a redeploy.
  // ---------------------------------------------------------------------------
  const validateFeatureAccess = (featureKey) => {
    if (user?.role === 'admin') return true;
    if (featureKey === 'admin') return false;

    // While the matrix is in flight, deny. Granting by default would flash paid
    // pages open on every load.
    const feature = features[featureKey];
    if (!feature) return false;
    return feature.enabled;
  };

  const aiCountKey = () => userKey('salesmate_ai_query_count_', user?.id);

  /**
   * Client-side counter, and it is only a courtesy: it lives in localStorage and
   * can be reset from the console. Phase 5 moves metering into a Postgres
   * transaction taken before the model call.
   */
  const aiQueryLimit = features.aiQueries?.limit ?? null;

  const checkAILimit = () => {
    if (aiQueryLimit === null) return { allowed: true };
    const count = Number(localStorage.getItem(aiCountKey()) || 0);
    if (count >= aiQueryLimit) return { allowed: false, count, limit: aiQueryLimit };
    return { allowed: true, count, limit: aiQueryLimit };
  };

  const incrementAICount = () => {
    if (aiQueryLimit === null) return;
    const count = Number(localStorage.getItem(aiCountKey()) || 0);
    localStorage.setItem(aiCountKey(), (count + 1).toString());
  };

  const resetAICount = () => {
    localStorage.setItem(aiCountKey(), '0');
  };

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      user,
      authLoading,
      userDataLoading,
      authConfigured: isSupabaseConfigured,
      orgId: org?.id || null,
      orgRole: org?.role || null,
      orgLoading,
      orgError,
      signIn,
      signUp,
      signOut,
      resetPassword,
      onboarded,
      setOnboarded,
      // `plan` is read-only. `setPlan` is deliberately absent from this object:
      // any surviving exploit site fails at destructuring instead of silently
      // granting a paid tier. The server owns this value.
      plan,
      subscription,
      subscriptionActive,
      entitlementsLoading,
      profile,
      setProfile,
      selectedCurrency,
      setSelectedCurrency,
      detectedCountry,
      setDetectedCountry,
      isDetecting,
      validateFeatureAccess,
      checkAILimit,
      incrementAICount,
      resetAICount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
