import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { getGeminiApiKey, setGeminiApiKey } from '../utils/gemini';
import { Settings, Save, User, Globe, MessageSquare, Key, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { t, isRTL, lang, setLang } = useLanguage();
  const { profile, setProfile } = useApp();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [agency, setAgency] = useState(profile.agencyName);
  const [whatsapp, setWhatsapp] = useState(profile.phone);
  const [geminiKey, setGeminiKeyVal] = useState(getGeminiApiKey());
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({
      name,
      email,
      agencyName: agency,
      phone: whatsapp
    });
    setGeminiApiKey(geminiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings style={{ color: 'var(--secondary)' }} /> {t('settingsTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          {isRTL ? "قم بتعديل وتحديث معلومات حسابك وإعدادات المساعد الذكي." : "Manage your personal profile, languages and system default properties."}
        </p>
      </div>

      {saved && (
        <div style={{
          background: 'var(--success-glow)',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          {isRTL ? "تم حفظ الإعدادات بنجاح!" : "Configuration settings saved successfully!"}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Profile Settings */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} style={{ color: 'var(--secondary)' }} />
            {t('profileSettings')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{isRTL ? "الاسم الكامل" : "Full Name"}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{t('companyName')}</label>
                <input type="text" value={agency} onChange={e => setAgency(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{t('whatsappNumber')}</label>
                <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* System Language Preference */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} style={{ color: 'var(--primary)' }} />
            {t('defaultLang')}
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { id: 'en', name: t('langEn') },
              { id: 'ar', name: t('langAr') }
            ].map((l) => (
              <button
                type="button"
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`btn ${lang === l.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.75rem 2rem', boxShadow: 'none' }}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Google Gemini AI Settings Card */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
            {isRTL ? "إعدادات المساعد الذكي AI" : "AI Assistant Integration"}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'start' }}>
              {isRTL 
                ? "لربط البرنامج بنظام ذكاء اصطناعي حقيقي وتفعيل صانع المحتوى ومحلل المحادثات بالكامل، يرجى إدخال مفتاح API الخاص بـ Google Gemini أدناه. يمكنك الحصول على مفتاح مجاني تماماً من خلال منصة Google AI Studio."
                : "To connect the application to a live AI model for real-time copy generation, chat transcripts analysis, and brochure creation, enter your Google Gemini API Key below. You can obtain a free key from Google AI Studio."
              }
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                {isRTL ? "مفتاح Google Gemini API Key" : "Google Gemini API Key"}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.75rem', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="AIzaSy..." 
                  value={geminiKey} 
                  onChange={e => setGeminiKeyVal(e.target.value)} 
                  style={{ paddingInlineStart: '2.25rem', flex: 1 }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: geminiKey ? 'var(--success-glow)' : 'var(--danger-glow)',
              color: geminiKey ? 'var(--success)' : 'var(--danger)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              alignSelf: 'flex-start'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: geminiKey ? 'var(--success)' : 'var(--danger)'
              }} />
              <span>
                {geminiKey 
                  ? (isRTL ? "مفتاح الـ API مضاف (البرنامج متصل بالذكاء الاصطناعي)" : "API Key Added (AI Assistant Active)")
                  : (isRTL ? "غير متصل (يعمل بوضع المحاكاة التجريبي)" : "Disconnected (Running in Mock Simulation Mode)")
                }
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'start' }}>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: 'var(--secondary)', textDecoration: 'underline' }}
              >
                {isRTL ? "احصل على مفتاح API مجاني من Google AI Studio" : "Get a free Gemini API Key from Google AI Studio"}
              </a>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
          <Save size={16} /> {t('saveSettings')}
        </button>
      </form>
    </div>
  );
}
