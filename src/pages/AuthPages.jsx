import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0, marginInlineEnd: '0.5rem' }} xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.62-2.85c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.62 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPages({ mode, setPage }) {
  const { t, isRTL } = useLanguage();
  const { login, register } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [chosenPlan, setChosenPlan] = useState('Trial'); // Default to Trial plan
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Poll for official Google API load
  React.useEffect(() => {
    const checkGoogleSdk = () => {
      if (window.google && window.google.accounts) {
        setGoogleLoaded(true);
      }
    };
    const timer = setInterval(checkGoogleSdk, 300);
    return () => clearInterval(timer);
  }, []);

  const handleCredentialResponse = (response) => {
    try {
      const jwtToken = response.credential;
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const emailVal = payload.email;
      if (emailVal) {
        if (isRegister) {
          register(emailVal, 'google-oauth', chosenPlan);
          setPage('onboarding');
        } else {
          login(emailVal, 'google-oauth');
          setPage('dashboard');
        }
      }
    } catch (err) {
      console.error("Error parsing Google credentials", err);
      setError(isRTL ? "فشل التحقق من حساب Google" : "Google credentials validation failed.");
    }
  };

  // Mount real Google button
  React.useEffect(() => {
    if (googleLoaded && document.getElementById('googleButtonContainer')) {
      try {
        const savedClientId = localStorage.getItem('salesmate_google_client_id') || '533191763459-98dvum3hqjvcdf6psq2c264dhq44ase5.apps.googleusercontent.com';
        window.google.accounts.id.initialize({
          client_id: savedClientId,
          callback: handleCredentialResponse
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById('googleButtonContainer'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: 396,
            text: isRegister ? 'signup_with' : 'signin_with',
            locale: isRTL ? 'ar' : 'en' 
          }
        );
      } catch (e) {
        console.error("Google button render error:", e);
      }
    }
  }, [googleLoaded, isRegister, chosenPlan, isRTL]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isRTL ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please fill all fields');
      return;
    }

    if (isRegister) {
      register(email, password, chosenPlan);
      setPage('onboarding');
    } else {
      login(email, password);
      setPage('dashboard');
    }
  };

  const handleGoogleSignIn = () => {
    // Open a styled mock Google accounts OAuth chooser popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '',
      'GoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no`
    );

    if (!popup) {
      alert(isRTL ? "الرجاء تمكين النوافذ المنبثقة لتسجيل الدخول عبر جوجل" : "Please enable popups to sign in with Google.");
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Sign in with Google</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', 'Roboto', sans-serif; background: #fff; margin: 0; padding: 20px; text-align: center; color: #202124; direction: ${isRTL ? 'rtl' : 'ltr'}; }
            .header { margin-top: 20px; }
            .logo { height: 28px; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
            .subtitle { font-size: 14px; color: #5f6368; margin-bottom: 24px; }
            .accounts-list { border: 1px solid #dadce0; border-radius: 8px; max-width: 380px; margin: 0 auto; overflow: hidden; text-align: ${isRTL ? 'right' : 'left'}; }
            .account-row { display: flex; align-items: center; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid #dadce0; transition: background 0.2s; }
            .account-row:last-child { border-bottom: none; }
            .account-row:hover { background: #f8f9fa; }
            .avatar { width: 32px; height: 32px; border-radius: 50%; background: #e8f0fe; color: #1a73e8; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-inline-end: 12px; }
            .details { flex: 1; }
            .name { font-size: 14px; font-weight: 700; }
            .email { font-size: 12px; color: #5f6368; }
            .custom-input { margin: 24px auto; max-width: 380px; text-align: ${isRTL ? 'right' : 'left'}; }
            .custom-input label { display: block; font-size: 12px; font-weight: 700; color: #5f6368; margin-bottom: 6px; }
            .custom-input input { width: 100%; padding: 10px; border: 1px solid #dadce0; border-radius: 4px; box-sizing: border-box; font-family: inherit; font-size: 13px; }
            .submit-btn { width: 100%; padding: 12px; background: #1a73e8; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; margin-top: 12px; font-family: inherit; }
            .submit-btn:hover { background: #1557b0; }
          </style>
        </head>
        <body>
          <div class="header">
            <svg viewBox="0 0 24 24" width="28" height="28" class="logo" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.62-2.85c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.62 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div class="title">${isRTL ? "اختر حساباً" : "Choose an account"}</div>
            <div class="subtitle">${isRTL ? "للمتابعة إلى أد تو ديل AI" : "to continue to AdToDeal AI"}</div>
          </div>

          <div class="accounts-list">
            <div class="account-row" onclick="selectAccount('عبد الله محمد', 'abdullah.mohammad@gmail.com')">
              <div class="avatar">ع</div>
              <div class="details">
                <div class="name">عبد الله محمد</div>
                <div class="email">abdullah.mohammad@gmail.com</div>
              </div>
            </div>
            <div class="account-row" onclick="selectAccount('Sarah Connor', 'sarah.connor@gmail.com')">
              <div class="avatar">S</div>
              <div class="details">
                <div class="name">Sarah Connor</div>
                <div class="email">sarah.connor@gmail.com</div>
              </div>
            </div>
          </div>

          <div class="custom-input">
            <label>${isRTL ? "أو سجل بحساب جوجل آخر" : "Or sign in with another Google account"}</label>
            <input type="email" id="customEmail" placeholder="email@gmail.com" value="user.saas@gmail.com" />
            <button class="submit-btn" onclick="submitCustomAccount()">${isRTL ? "متابعة" : "Continue"}</button>
          </div>

          <script>
            function selectAccount(name, email) {
              window.opener.postMessage({ type: 'GOOGLE_SIGN_IN_SUCCESS', name, email }, '*');
              window.close();
            }
            function submitCustomAccount() {
              const email = document.getElementById('customEmail').value;
              if (email) {
                const name = email.split('@')[0];
                selectAccount(name, email);
              }
            }
          </script>
        </body>
      </html>
    `);

    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_SIGN_IN_SUCCESS') {
        const { email } = event.data;
        if (isRegister) {
          register(email, 'google-oauth', chosenPlan);
          setPage('onboarding');
        } else {
          login(email, 'google-oauth');
          setPage('dashboard');
        }
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
  };

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
            {isRegister ? t('navRegister') : t('navLogin')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {isRegister 
              ? (isRTL ? "أنشئ حسابك التجريبي المجاني لمدة شهر وابدأ اليوم" : "Create your 1-month free trial account and start today.")
              : (isRTL ? "مرحباً بك مجدداً في لوحة تحكمك" : "Welcome back to your workspace.")}
          </p>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'start' }}>
              {isRTL ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
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
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingInlineStart: '2.5rem', fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} 
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isRegister ? t('navRegister') : t('navLogin')}
          </button>
        </form>



        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
          <span style={{ padding: '0 0.75rem' }}>{isRTL ? "أو سجل بواسطة" : "OR CONTINUE WITH"}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
        </div>

        {/* Google OAuth Button */}
        {googleLoaded ? (
          <div style={{ width: '100%' }}>
            <div 
              id="googleButtonContainer" 
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '0.5rem',
                minHeight: '44px' 
              }}
            />
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginTop: '0.5rem',
                textAlign: 'center',
                width: '100%'
              }}
            >
              {isRTL ? "⚠️ هل واجهت مشكلة؟ اضغط هنا للدخول السريع بالمحاكاة" : "⚠️ Facing Google login issues? Click here to bypass via simulation"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--card-border)'
            }}
          >
            <GoogleIcon />
            <span>{isRTL ? "تسجيل الدخول بواسطة Google (تجريبي)" : "Sign in with Google (Simulation)"}</span>
          </button>
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
            }}
            style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            {isRegister ? t('navLogin') : t('navRegister')}
          </button>
        </div>
      </div>
    </div>
  );
}
