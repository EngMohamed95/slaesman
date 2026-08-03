import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock } from 'lucide-react';

export function NotAuthorized() {
  const { isRTL } = useLanguage();
  return (
    <div className="fade-in" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div style={{
        display: 'inline-flex',
        padding: '1rem',
        borderRadius: '50%',
        background: 'var(--danger-glow)',
        color: 'var(--danger)',
        marginBottom: '1.25rem'
      }}>
        <Lock size={32} />
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
        {isRTL ? 'لا تملك صلاحية الوصول' : 'You do not have access'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
        {isRTL
          ? 'هذه الصفحة مخصصة لإدارة المنصة فقط.'
          : 'This page is restricted to platform administrators.'}
      </p>
    </div>
  );
}

/** Shown while the Supabase session is being restored. */
function AuthLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
      …
    </div>
  );
}

/**
 * Blocks the authenticated shell for signed-out visitors.
 *
 * `authLoading` is load-bearing: restoring a Supabase session is asynchronous,
 * so on the first paint after a refresh `user` is still null. Redirecting then
 * would throw every signed-in user back to the landing page on every reload.
 */
export function RequireAuth() {
  const { user, authLoading } = useApp();
  if (authLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/landing" replace />;
  return <Outlet />;
}

/**
 * Keeps a signed-in user off the login/register screens. Signing in again from
 * an active session is never what the user meant, and it re-runs the redirect
 * dance for nothing.
 */
export function RedirectIfAuthed({ children }) {
  const { user, authLoading, userDataLoading, onboarded } = useApp();
  if (authLoading || userDataLoading) return <AuthLoading />;
  // This guard, not AuthPages, owns the post-sign-in destination. Letting the
  // page navigate too created a race the guard always won, which sent brand new
  // accounts straight past onboarding. `userDataLoading` is what makes reading
  // `onboarded` safe here: without it the flag still holds the previous
  // account's value on the first render and existing users get re-onboarded.
  if (user) return <Navigate to={onboarded ? '/dashboard' : '/onboarding'} replace />;
  return children;
}

/**
 * Role gate. This keeps the wrong people out of the page; it is not a security
 * boundary — the data behind it has to be protected server-side.
 */
export function RequireRole({ role }) {
  const { user, authLoading } = useApp();
  if (authLoading) return <AuthLoading />;
  if (user?.role !== role) return <NotAuthorized />;
  return <Outlet />;
}
