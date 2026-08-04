import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import {
  getWhatsAppAccount,
  connectWhatsAppAccount,
  disconnectWhatsAppAccount,
  describeWhatsAppError,
} from '../utils/whatsapp';
import { Settings, Save, User, Globe, MessageSquare, Key, PhoneCall, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { t, isRTL, lang, setLang } = useLanguage();
  const { profile, setProfile, theme, setTheme } = useApp();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [agency, setAgency] = useState(profile.agencyName);
  const [whatsapp, setWhatsapp] = useState(profile.phone);

  // WhatsApp Cloud API connection.
  //
  // The token is deliberately NOT seeded from anywhere and is never written
  // anywhere: it exists in this state only long enough to be posted to
  // whatsapp-connect, which verifies it against Graph and puts it in Vault.
  // What comes back — and what the badge below reflects — is the number Meta
  // confirmed, not the fact that two inputs are non-empty.
  const [waAccount, setWaAccount] = useState(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [waBusy, setWaBusy] = useState(false);
  const [waError, setWaError] = useState('');

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getWhatsAppAccount().then((account) => {
      if (!active) return;
      setWaAccount(account);
      setWaLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({
      name,
      email,
      agencyName: agency,
      phone: whatsapp
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleConnectWhatsApp = async () => {
    setWaError('');
    setWaBusy(true);
    try {
      const result = await connectWhatsAppAccount({
        phoneNumberId: waPhoneId,
        wabaId: waWabaId,
        accessToken: waToken,
      });
      setWaAccount({
        phone_number_id: waPhoneId.trim(),
        waba_id: waWabaId.trim() || null,
        display_phone_number: result?.displayPhoneNumber ?? null,
        verified_name: result?.verifiedName ?? null,
        connected_at: new Date().toISOString(),
      });
      // Out of the browser the moment the server has it.
      setWaToken('');
    } catch (error) {
      setWaError(describeWhatsAppError(error, isRTL));
    } finally {
      setWaBusy(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    const warning = isRTL
      ? 'سيتم فصل الرقم وحذف التوكن. سجل الرسائل السابق يبقى كما هو. متابعة؟'
      : 'This disconnects the number and deletes the token. The message history is kept. Continue?';
    if (!confirm(warning)) return;
    setWaError('');
    setWaBusy(true);
    try {
      await disconnectWhatsAppAccount();
      setWaAccount(null);
      setWaPhoneId('');
      setWaWabaId('');
      setWaToken('');
    } catch (error) {
      setWaError(describeWhatsAppError(error, isRTL));
    } finally {
      setWaBusy(false);
    }
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

            {!waLoading && !waAccount && (
              <>
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
                      autoComplete="off"
                      value={waToken}
                      onChange={e => setWaToken(e.target.value)}
                      style={{ paddingInlineStart: '2.25rem', flex: 1 }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem 0 0', textAlign: 'start' }}>
                    {isRTL
                      ? 'يُرسل مرة واحدة إلى الخادم ويُحفظ مشفّراً هناك. لا يُخزَّن في المتصفح ولا يُعاد عرضه.'
                      : 'Sent to the server once and stored encrypted there. It is not kept in the browser and is never shown again.'}
                  </p>
                </div>

                {/* type="button": this card sits inside the profile form, and a
                    submit here would save the profile instead of connecting. */}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={waBusy || !waPhoneId.trim() || !waToken.trim()}
                  onClick={handleConnectWhatsApp}
                  style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}
                >
                  <MessageSquare size={16} />
                  {waBusy
                    ? (isRTL ? 'جارٍ التحقق…' : 'Verifying…')
                    : (isRTL ? 'ربط الرقم' : 'Connect number')}
                </button>
              </>
            )}

            {waError && (
              <div style={{
                background: 'var(--danger-glow, rgba(239,68,68,0.12))',
                color: 'var(--danger)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                textAlign: 'start',
                lineHeight: 1.6
              }}>
                {waError}
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: waAccount ? 'var(--success-glow)' : 'rgba(255,255,255,0.03)',
              color: waAccount ? 'var(--success)' : 'var(--text-muted)',
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
                background: waAccount ? 'var(--success)' : 'var(--text-muted)'
              }} />
              <span>
                {waLoading
                  ? (isRTL ? 'جارٍ التحقق من الربط…' : 'Checking connection…')
                  : waAccount
                    ? (isRTL
                        ? `متصل بالرقم ${waAccount.display_phone_number || waAccount.phone_number_id}${waAccount.verified_name ? ` — ${waAccount.verified_name}` : ''}`
                        : `Connected as ${waAccount.display_phone_number || waAccount.phone_number_id}${waAccount.verified_name ? ` — ${waAccount.verified_name}` : ''}`)
                    : (isRTL ? "غير مفعل (يتم الفتح المباشر عبر تطبيق/ويب الواتساب)" : "Not Configured (Uses Direct WhatsApp Web/App Bridge)")
                }
              </span>
            </div>

            {waAccount && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={waBusy}
                onClick={handleDisconnectWhatsApp}
                style={{ alignSelf: 'flex-start', color: 'var(--danger)' }}
              >
                {waBusy
                  ? (isRTL ? 'جارٍ…' : 'Working…')
                  : (isRTL ? 'فصل الرقم' : 'Disconnect number')}
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
          <Save size={16} /> {t('saveSettings')}
        </button>
      </form>
    </div>
  );
}
