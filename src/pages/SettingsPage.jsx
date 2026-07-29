import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { getWhatsAppConfig, setWhatsAppConfig } from '../utils/whatsapp';
import { Settings, Save, User, Globe, MessageSquare, Key, PhoneCall, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { t, isRTL, lang, setLang } = useLanguage();
  const { profile, setProfile, theme, setTheme } = useApp();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [agency, setAgency] = useState(profile.agencyName);
  const [whatsapp, setWhatsapp] = useState(profile.phone);
  
  // Real Meta WhatsApp Business Cloud API States
  const [waPhoneId, setWaPhoneId] = useState(() => getWhatsAppConfig().phoneNumberId);
  const [waToken, setWaToken] = useState(() => getWhatsAppConfig().accessToken);
  const [waWabaId, setWaWabaId] = useState(() => getWhatsAppConfig().wabaId);

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({
      name,
      email,
      agencyName: agency,
      phone: whatsapp
    });
    setWhatsAppConfig({
      phoneNumberId: waPhoneId,
      accessToken: waToken,
      wabaId: waWabaId
    });
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

        {/* Theme Preference (Dark / Light) */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sun size={18} style={{ color: 'var(--accent)' }} />
            {isRTL ? "مظهر النظام (الوضع الليلي والنهاري)" : "Appearance Theme (Dark / Light)"}
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { id: 'dark', label: isRTL ? 'الوضع الليلي (Dark Mode 🌙)' : 'Dark Mode 🌙', icon: <Moon size={16} /> },
              { id: 'light', label: isRTL ? 'الوضع النهاري (Light Mode ☀️)' : 'Light Mode ☀️', icon: <Sun size={16} /> }
            ].map((tItem) => (
              <button
                key={tItem.id}
                type="button"
                className={`btn ${theme === tItem.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTheme(tItem.id)}
                style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {tItem.icon}
                <span>{tItem.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real Meta WhatsApp Business Cloud API Settings Card */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} style={{ color: '#25D366' }} />
            {isRTL ? "ربط واتساب الأصلي المباشر (Official Meta WhatsApp Cloud API)" : "Official Meta WhatsApp Cloud API"}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'start' }}>
              {isRTL 
                ? "لإرسال واستقبال رسائل الواتساب الفعلية آلياً إلى هواتف العملاء عبر الإنترنت، يرجى إدخال بيانات حساب Meta Developers الخاص بشركتك."
                : "To send and receive live WhatsApp messages directly to clients' phones over the internet, configure your Meta Developers WhatsApp Cloud API credentials."
              }
            </p>

            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {isRTL ? "معرف رقم الهاتف (Phone Number ID)" : "Phone Number ID"}
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 10492837492019" 
                  value={waPhoneId} 
                  onChange={e => setWaPhoneId(e.target.value)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {isRTL ? "معرف حساب الواتساب (WABA ID)" : "WhatsApp Business Account ID"}
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 983749201920" 
                  value={waWabaId} 
                  onChange={e => setWaWabaId(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                {isRTL ? "رمز الدخول الدائم (Permanent Access Token)" : "Meta Permanent Access Token"}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.75rem', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="EAAG..." 
                  value={waToken} 
                  onChange={e => setWaToken(e.target.value)} 
                  style={{ paddingInlineStart: '2.25rem', flex: 1 }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: (waPhoneId && waToken) ? 'var(--success-glow)' : 'rgba(255,255,255,0.03)',
              color: (waPhoneId && waToken) ? 'var(--success)' : 'var(--text-muted)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              alignSelf: 'flex-start',
              border: '1px solid var(--card-border)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: (waPhoneId && waToken) ? 'var(--success)' : 'var(--text-muted)'
              }} />
              <span>
                {(waPhoneId && waToken)
                  ? (isRTL ? "API الواتساب الحقيقي مفعل ومتصل" : "Real Meta WhatsApp API Connected & Active")
                  : (isRTL ? "غير مفعل (يتم الفتح المباشر عبر تطبيق/ويب الواتساب)" : "Not Configured (Uses Direct WhatsApp Web/App Bridge)")
                }
              </span>
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
