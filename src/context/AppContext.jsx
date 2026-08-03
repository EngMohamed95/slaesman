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
  // Per-user state. Still localStorage until Phase 4, but keyed by `user.id`.
  // ---------------------------------------------------------------------------
  const [plan, setPlan] = useState('Trial');
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  // Which account the three states above were loaded for. The persist effects
  // below refuse to write until it matches the active user, otherwise the
  // outgoing user's plan lands under the incoming user's key.
  const [loadedUid, setLoadedUid] = useState(null);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setPlan('Trial');
      setOnboarded(false);
      setProfile(DEFAULT_PROFILE);
      setLoadedUid(null);
      return;
    }
    setPlan(localStorage.getItem(userKey('salesmate_plan_', uid)) || 'Trial');
    setOnboarded(localStorage.getItem(userKey('salesmate_onboarded_', uid)) === 'true');
    const savedProfile = localStorage.getItem(userKey('salesmate_profile_', uid));
    setProfile(savedProfile
      ? JSON.parse(savedProfile)
      : { ...DEFAULT_PROFILE, email: user.email || '', name: user.name || '' });
    setLoadedUid(uid);
  }, [user]);

  const canPersist = Boolean(user?.id) && loadedUid === user?.id;

  // True between "session arrived" and "this account's state is in memory".
  // Guards must wait on it before reading `onboarded` or `plan`, which still
  // hold the previous account's values during that window.
  const userDataLoading = Boolean(user?.id) && loadedUid !== user.id;

  useEffect(() => {
    if (!canPersist) return;
    localStorage.setItem(userKey('salesmate_plan_', user.id), plan);
  }, [plan, canPersist, user?.id]);

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
  // Plan gating. Still client-side and still bypassable — the server takes this
  // over in Phase 7.
  // ---------------------------------------------------------------------------
  const validateFeatureAccess = (featureKey) => {
    if (user?.role === 'admin') return true;
    if (featureKey === 'admin') return false;

    const basicPages = ['dashboard', 'crm', 'tasks', 'aiAssistant', 'whatsapp', 'reports', 'settings'];

    if (plan === 'Basic') return basicPages.includes(featureKey);
    if (plan === 'Pro') return featureKey !== 'campaigns';
    if (plan === 'Growth') return true;
    if (plan === 'Trial') return basicPages.includes(featureKey);

    return true;
  };

  const aiCountKey = () => userKey('salesmate_ai_query_count_', user?.id);

  const checkAILimit = () => {
    if (plan !== 'Basic') return { allowed: true };
    const count = Number(localStorage.getItem(aiCountKey()) || 0);
    if (count >= 3) return { allowed: false, count };
    return { allowed: true, count };
  };

  const incrementAICount = () => {
    if (plan !== 'Basic') return;
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
      plan,
      setPlan,
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
