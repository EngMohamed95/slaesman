import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { ShieldCheck, Users, Megaphone, DollarSign, Settings2, CheckCircle, RefreshCw, Key, Sparkles, Globe, Save } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '../utils/gemini';

export default function AdminPanelPage() {
  const { t, isRTL } = useLanguage();
  const { campaignRequests, updateCampaignStatus } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState('briefs'); // briefs, users, templates, settings
  const [prompts, setPrompts] = useState([
    { id: 1, title: 'Objection Handler Default prompt', text: 'Act as an expert real estate sales coach. Solve objection: {objection}...' },
    { id: 2, title: 'WhatsApp Template compiler prompt', text: 'Create direct conversational WhatsApp messages incorporating lead: {name}...' }
  ]);

  const [geminiKey, setGeminiKeyVal] = useState(getGeminiApiKey());
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('salesmate_google_client_id') || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setGeminiApiKey(geminiKey);
    if (googleClientId.trim()) {
      localStorage.setItem('salesmate_google_client_id', googleClientId.trim());
    } else {
      localStorage.removeItem('salesmate_google_client_id');
    }
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
    }, 3000);
  };

  const mockUsers = [
    { id: 'u1', name: 'Salma Al-Harbi', email: 'salma@adtodeal.com', plan: 'Pro', registeredDate: '2026-05-10', paymentDate: '2026-07-10', paymentMethod: 'Visa', amount: '199 SAR', status: 'Active' },
    { id: 'u2', name: 'Khalid Mansour', email: 'khalid@example.com', plan: 'Growth', registeredDate: '2026-05-24', paymentDate: '2026-07-24', paymentMethod: 'PayPal', amount: '399 SAR', status: 'Active' },
    { id: 'u3', name: 'Noura Salem', email: 'noura.s@example.com', plan: 'Basic', registeredDate: '2026-06-01', paymentDate: '2026-07-01', paymentMethod: 'PayPal', amount: '99 SAR', status: 'Active' },
    { id: 'u4', name: 'Ahmad Al-Saeed', email: 'ahmad.saeed@gmail.com', plan: 'Pro', registeredDate: '2026-07-12', paymentDate: '2026-07-12', paymentMethod: 'PayPal', amount: '199 SAR', status: 'Active' },
    { id: 'u5', name: 'John Doe', email: 'john.doe@apple.com', plan: 'Growth', registeredDate: '2026-07-15', paymentDate: '2026-07-15', paymentMethod: 'Visa', amount: '$107', status: 'Active' },
    { id: 'u6', name: 'Fatima Al-Shammeri', email: 'f.shammeri@domain.sa', plan: 'Basic', registeredDate: '2026-06-20', paymentDate: '2026-06-20', paymentMethod: 'Mada', amount: '99 SAR', status: 'Cancelled' }
  ];

  const handleStatusChange = (id, newStatus, newStatusAr) => {
    updateCampaignStatus(id, newStatus, newStatusAr);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck style={{ color: 'var(--secondary)' }} /> {t('navAdmin')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('adminSubtitle')}</p>
      </div>

      {/* Admin stats dashboard */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('totalRegisteredUsers')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{mockUsers.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--secondary-glow)', color: 'var(--secondary)' }}>
            <Megaphone size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('activeBriefs')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {campaignRequests.filter(c => c.status === 'Pending Review' || c.status === 'Active & Delivering').length}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--success-glow)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('mrr')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {isRTL ? "697 ريال" : "$207"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
          {[
            { id: 'briefs', label: t('briefList') },
            { id: 'users', label: t('userList') },
            { id: 'templates', label: isRTL ? 'إدارة قوالب الذكاء الاصطناعي' : 'AI Prompt Templates' },
            { id: 'settings', label: isRTL ? 'إعدادات النظام والربط' : 'System & AI Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeSubTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeSubTab === tab.id ? '#818cf8' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div style={{ padding: '1.5rem' }}>
          {activeSubTab === 'briefs' && (
            <>
              {/* Desktop Campaign Briefs Table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th>{isRTL ? 'التاريخ والمنصة' : 'Date & Platform'}</th>
                      <th>{isRTL ? 'تفاصيل العرض' : 'Offer Details'}</th>
                      <th>{isRTL ? 'الميزانية / المدة' : 'Budget / Days'}</th>
                      <th>{t('status')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{req.platform}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.date} • {req.city}</div>
                        </td>
                        <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                          <div>{req.offerDetails}</div>
                          {req.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {isRTL ? 'ملاحظات: ' : 'Notes: '}{req.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>${req.budget}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.duration} {isRTL ? 'أيام' : 'days'}</div>
                        </td>
                        <td>
                          <span className={`badge`} style={{
                            background: req.status === 'Active & Delivering' ? 'var(--success-glow)' : 'var(--accent-glow)',
                            color: req.status === 'Active & Delivering' ? 'var(--success)' : 'var(--accent)'
                          }}>
                            {isRTL ? req.statusAr : req.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {req.status === 'Pending Review' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--success)' }}
                                onClick={() => handleStatusChange(req.id, 'Active & Delivering', 'نشطة وتجلب عملاء')}
                              >
                                {t('approveBrief')}
                              </button>
                            )}
                            {req.status === 'Active & Delivering' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                                onClick={() => handleStatusChange(req.id, 'Completed', 'مكتملة')}
                              >
                                {t('markCompleted')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Campaign Briefs Cards */}
              <div className="mobile-only-flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                {campaignRequests.map((req) => (
                  <div key={req.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{req.platform}</div>
                      <span className={`badge`} style={{
                        background: req.status === 'Active & Delivering' ? 'var(--success-glow)' : 'var(--accent-glow)',
                        color: req.status === 'Active & Delivering' ? 'var(--success)' : 'var(--accent)'
                      }}>
                        {isRTL ? req.statusAr : req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{req.date} • {req.city}</div>
                    <div style={{ fontSize: '0.85rem' }}>{req.offerDetails}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <span>{isRTL ? 'الميزانية:' : 'Budget:'} <strong>${req.budget}</strong></span>
                      <span>{isRTL ? 'المدة:' : 'Duration:'} <strong>{req.duration} {isRTL ? 'أيام' : 'days'}</strong></span>
                    </div>
                    {req.status === 'Pending Review' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.25rem' }}
                        onClick={() => handleStatusChange(req.id, 'Active & Delivering', 'نشطة وتجلب عملاء')}
                      >
                        {t('approveBrief')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSubTab === 'users' && (
            <>
              {/* Desktop Users Table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '900px' }}>
                  <thead>
                    <tr>
                      <th>{t('name')}</th>
                      <th>{t('email')}</th>
                      <th>{isRTL ? 'خطة الاشتراك' : 'Subscription Tier'}</th>
                      <th>{isRTL ? 'الحالة' : 'Status'}</th>
                      <th>{isRTL ? 'طريقة الدفع' : 'Payment Method'}</th>
                      <th>{isRTL ? 'تاريخ الدفع' : 'Payment Date'}</th>
                      <th>{isRTL ? 'المبلغ المدفوع' : 'Amount Paid'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map(user => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 'bold' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className="badge" style={{ 
                            fontWeight: 'bold',
                            background: user.plan === 'Growth' ? 'var(--secondary-glow)' : user.plan === 'Pro' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                            color: user.plan === 'Growth' ? 'var(--secondary)' : user.plan === 'Pro' ? 'var(--primary)' : 'var(--text-muted)'
                          }}>
                            {user.plan}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: user.status === 'Active' ? 'var(--success-glow)' : 'var(--danger-glow)',
                            color: user.status === 'Active' ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {user.status === 'Active' ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'ملغي' : 'Cancelled')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{user.paymentMethod}</td>
                        <td>{user.paymentDate}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{user.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Users Cards */}
              <div className="mobile-only-flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                {mockUsers.map(user => (
                  <div key={user.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{user.name}</div>
                      <span className="badge" style={{ 
                        background: user.plan === 'Growth' ? 'var(--secondary-glow)' : user.plan === 'Pro' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                        color: user.plan === 'Growth' ? 'var(--secondary)' : user.plan === 'Pro' ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {user.plan}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <span>{user.paymentMethod} • {user.paymentDate}</span>
                      <strong style={{ color: 'var(--text-main)' }}>{user.amount}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSubTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {prompts.map((prompt) => (
                <div key={prompt.id} style={{ background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, color: '#a5b4fc' }}>{prompt.title}</h4>
                    <Settings2 size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <textarea 
                    rows="3" 
                    value={prompt.text} 
                    onChange={(e) => {
                      setPrompts(prompts.map(p => p.id === prompt.id ? { ...p, text: e.target.value } : p));
                    }}
                    style={{ fontSize: '0.9rem', lineHeight: 1.5 }}
                  />
                </div>
              ))}
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert(isRTL ? 'تم حفظ قوالب التوليد بنجاح!' : 'AI prompts configurations saved!')}>
                {isRTL ? "حفظ القوالب" : "Save Prompt Templates"}
              </button>
            </div>
          )}

          {activeSubTab === 'settings' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {settingsSaved && (
                <div style={{
                  background: 'var(--success-glow)',
                  color: 'var(--success)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  {isRTL ? "تم حفظ الإعدادات بنجاح!" : "Configuration settings saved successfully!"}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Gemini API Section */}
                <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', textAlign: 'start' }}>
                    {isRTL 
                      ? "لربط البرنامج بنظام ذكاء اصطناعي حقيقي وتفعيل صانع المحتوى ومحلل المحادثات بالكامل، يرجى إدخال مفتاح API الخاص بـ Google Gemini أدناه. يمكنك الحصول على مفتاح مجاني من خلال منصة Google AI Studio."
                      : "To connect the application to a live AI model for real-time copy generation, chat transcripts analysis, and brochure creation, enter your Google Gemini API Key below. Obtain a free key from Google AI Studio."
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
                        style={{ paddingInlineStart: '2.25rem', flex: 1, color: 'var(--text-main)' }}
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
                    alignSelf: 'flex-start',
                    marginTop: '0.75rem',
                    width: 'fit-content'
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

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'start', marginTop: '0.5rem' }}>
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

                {/* Google Client ID Section */}
                <div style={{ paddingBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-main)', textAlign: 'start' }}>
                    {isRTL ? "ربط تسجيل الدخول بجوجل (Google Sign-In OAuth)" : "Google Sign-In OAuth Setup"}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', textAlign: 'start' }}>
                    {isRTL 
                      ? "لتفعيل الدخول الفعلي بحسابات Google لمستخدمي منصتك (SaaS)، يرجى إدخال معرّف العميل (Google Client ID) الخاص بمشروعك في Google Cloud Console."
                      : "To enable real Google account logins for your platform users (SaaS), configure your OAuth 2.0 Client ID generated from Google Cloud Console."
                    }
                  </p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                      {isRTL ? "معرف عميل جوجل (Google Client ID)" : "Google OAuth Client ID"}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                      <Globe size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.75rem', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="xxxxxxxx.apps.googleusercontent.com" 
                        value={googleClientId} 
                        onChange={e => setGoogleClientId(e.target.value)} 
                        style={{ paddingInlineStart: '2.25rem', flex: 1, color: 'var(--text-main)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
                <Save size={16} /> {isRTL ? "حفظ الإعدادات" : "Save Settings"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
