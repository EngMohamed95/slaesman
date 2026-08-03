import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, ArrowLeft, AlertTriangle, MailCheck } from 'lucide-react';

/**
 * Supabase error codes → a sentence the user can act on.
 *
 * The old screen could not fail: it accepted any email with any password. Every
 * branch here is a real server verdict, so the message must say which one.
 */
const ERROR_MESSAGES = {
  invalid_credentials: {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    en: 'Incorrect email or password.',
  },
  email_not_confirmed: {
    ar: 'لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد المرسلة إليك.',
    en: 'Your email is not confirmed yet. Open the confirmation link we sent you.',
  },
  user_already_exists: {
    ar: 'هذا البريد مسجّل بالفعل. سجّل الدخول بدلاً من إنشاء حساب.',
    en: 'This email is already registered. Sign in instead.',
  },
  email_exists: {
    ar: 'هذا البريد مسجّل بالفعل. سجّل الدخول بدلاً من إنشاء حساب.',
    en: 'This email is already registered. Sign in instead.',
  },
  weak_password: {
    ar: 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع أرقام ورموز.',
    en: 'Password is too weak. Use at least 8 characters with numbers and symbols.',
  },
  validation_failed: {
    ar: 'تحقق من صيغة البريد الإلكتروني وكلمة المرور.',
    en: 'Check the email and password format.',
  },
  over_email_send_rate_limit: {
    ar: 'تم إرسال رسائل كثيرة. انتظر دقيقة ثم أعد المحاولة.',
    en: 'Too many emails sent. Wait a minute and try again.',
  },
  over_request_rate_limit: {
    ar: 'محاولات كثيرة جداً. انتظر قليلاً ثم أعد المحاولة.',
    en: 'Too many attempts. Please wait and try again.',
  },
  signup_disabled: {
    ar: 'التسجيل الذاتي معطّل حالياً. تواصل مع الدعم لفتح حساب.',
    en: 'Self sign-up is disabled. Contact support to get an account.',
  },
  not_configured: {
    ar: 'خدمة الحسابات غير مهيأة على هذه النسخة. راجع إعدادات النشر.',
    en: 'The accounts service is not configured on this deployment.',
  },
};

const describeError = (result, isRTL) => {
  const known = ERROR_MESSAGES[result.code];
  if (known) return isRTL ? known.ar : known.en;

  // Supabase surfaces transport failures as a bare "Failed to fetch", which
  // reads like a bug in the app rather than a connectivity problem.
  if (/fetch|network|timeout/i.test(result.message || '')) {
    return isRTL
      ? 'تعذّر الوصول إلى الخادم. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.'
      : 'Could not reach the server. Check your connection and try again.';
  }

  if (result.message) return result.message;
  return isRTL ? 'تعذّر إتمام العملية. حاول مرة أخرى.' : 'Something went wrong. Please try again.';
};

export default function AuthPages({ mode, setPage }) {
  const { isRTL } = useLanguage();
  const { signIn, signUp, resetPassword, authConfigured } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Google sign-in is intentionally absent. The previous implementation decoded
  // the Google ID token in the browser and trusted its claims, and shipped a
  // simulated account chooser that logged in via an unchecked postMessage. Both
  // were auth bypasses. Supabase OAuth providers can be added on top of the
  // client in src/lib/supabase.js once the provider is configured server-side.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!email || !password) {
      setError(isRTL ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please fill all fields');
      return;
    }

    setSubmitting(true);
    const result = isRegister
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      setError(describeError(result, isRTL));
      return;
    }

    if (isRegister && result.needsConfirmation) {
      // No session yet — sending them into the app would show a signed-out shell.
      setNotice(isRTL
        ? 'أرسلنا رابط تأكيد إلى بريدك. افتحه لتفعيل الحساب ثم سجّل الدخول.'
        : 'We sent a confirmation link to your email. Open it to activate your account, then sign in.');
      setPassword('');
      setIsRegister(false);
      return;
    }

    // Deliberately no navigation here. The session lands via onAuthStateChange
    // and `RedirectIfAuthed` (which wraps this route) sends the user to
    // /onboarding or /dashboard. Navigating from here as well raced that guard,
    // and the guard won — new accounts skipped onboarding entirely.
  };

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');
    if (!email) {
      setError(isRTL ? 'أدخل بريدك الإلكتروني أولاً' : 'Enter your email address first');
      return;
    }
    setSubmitting(true);
    const result = await resetPassword(email.trim());
    setSubmitting(false);
    if (!result.ok) {
      setError(describeError(result, isRTL));
      return;
    }
    setNotice(isRTL
      ? 'إن كان البريد مسجّلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.'
      : 'If that email is registered, a password reset link is on its way.');
  };

  const submitLabel = isRegister
    ? (isRTL ? 'إنشاء حساب' : 'Create account')
    : (isRTL ? 'تسجيل الدخول' : 'Sign in');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--bg-darker)'
    }} className="fade-in">
      <button
        onClick={() => setPage('landing')}
        style={{
          position: 'absolute',
          top: '2rem',
          insetInlineStart: '2rem',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1rem',
          zIndex: 10
        }}
      >
        <ArrowLeft size={16} /> {isRTL ? "الرجوع للرئيسية" : "Back to Home"}
      </button>

      <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '1rem', background: 'var(--primary-glow)', marginBottom: '0.75rem' }}>
            <Sparkles style={{ color: 'var(--secondary)' }} size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            {submitLabel}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {isRegister
              ? (isRTL ? "أنشئ حسابك التجريبي المجاني لمدة شهر وابدأ اليوم" : "Create your 1-month free trial account and start today.")
              : (isRTL ? "مرحباً بك مجدداً في لوحة تحكمك" : "Welcome back to your workspace.")}
          </p>
        </div>

        {!authConfigured && (
          <div style={{
            background: 'var(--danger-glow)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            textAlign: 'start',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <span>
              {isRTL
                ? 'خدمة الحسابات غير مهيأة: أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env.local ثم أعد تشغيل الخادم.'
                : 'Accounts are not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.'}
            </span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--danger-glow)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        {notice && (
          <div style={{
            background: 'var(--success-glow)',
            color: 'var(--success)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            textAlign: 'start',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start'
          }}>
            <MailCheck size={16} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'start' }}>
              {isRTL ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingInlineStart: '2.5rem', fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'start' }}>
              {isRTL ? "كلمة المرور" : "Password"}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingInlineStart: '2.5rem', fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }}
              />
            </div>
            {isRegister && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.4rem 0 0', textAlign: 'start' }}>
                {isRTL ? '8 أحرف على الأقل.' : 'At least 8 characters.'}
              </p>
            )}
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !authConfigured}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9rem',
              marginTop: '0.25rem',
              opacity: (submitting || !authConfigured) ? 0.6 : 1,
              cursor: (submitting || !authConfigured) ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting
              ? (isRTL ? 'جارٍ المعالجة…' : 'Working…')
              : submitLabel}
          </button>
        </form>

        {!isRegister && (
          <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={submitting || !authConfigured}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
            >
              {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegister
              ? (isRTL ? "لديك حساب بالفعل؟ " : "Already have an account? ")
              : (isRTL ? "ليس لديك حساب بعد؟ " : "Don't have an account yet? ")}
          </span>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setNotice('');
            }}
            style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            {isRegister
              ? (isRTL ? 'تسجيل الدخول' : 'Sign in')
              : (isRTL ? 'إنشاء حساب' : 'Create account')}
          </button>
        </div>
      </div>
    </div>
  );
}
