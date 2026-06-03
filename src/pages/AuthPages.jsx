import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function AuthPages({ mode, setPage }) {
  const { t, isRTL } = useLanguage();
  const { login, register } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isRTL ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please fill all fields');
      return;
    }

    if (isRegister) {
      register(email, password);
      setPage('onboarding'); // Go to onboarding
    } else {
      login(email, password);
      setPage('dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
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
          fontSize: '1rem'
        }}
      >
        <ArrowLeft size={16} /> {isRTL ? "الرجوع للرئيسية" : "Back to Home"}
      </button>

      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '1rem', background: 'var(--primary-glow)', marginBottom: '1rem' }}>
            <Sparkles style={{ color: 'var(--secondary)' }} size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            {isRegister ? t('navRegister') : t('navLogin')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {isRegister 
              ? (isRTL ? "ابدأ إدارة عملائك وتنمية مبيعاتك بالذكاء الاصطناعي" : "Start managing your leads with AI intelligence.")
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {isRTL ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingInlineStart: '2.5rem' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {isRTL ? "كلمة المرور" : "Password"}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingInlineStart: '2.5rem' }} 
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '0.85rem' }}>
            {isRegister ? t('navRegister') : t('navLogin')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
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
