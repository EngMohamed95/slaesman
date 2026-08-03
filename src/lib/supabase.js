import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The app ships without credentials baked in. When they are missing we do NOT
 * fall back to a mock session — that is exactly the auth bypass Phase 0 deleted.
 * Instead `supabase` stays null and every auth entry point reports a
 * configuration error, so a misconfigured deploy fails loudly and closed.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // MANDATORY, not a preference. The implicit flow returns the session as
        // `#access_token=…`, which collides with HashRouter's `#/route` and gets
        // eaten before supabase-js can read it. PKCE returns `?code=…` instead.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'adtodeal_auth',
      },
    })
  : null;

/** Redirect target for email confirmation / password recovery links. */
export const authRedirectTo = `${window.location.origin}${window.location.pathname}#/login`;
