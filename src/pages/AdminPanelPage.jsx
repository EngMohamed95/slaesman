import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { supabase } from '../lib/supabase';
import { createAccount, describeAdminError } from '../utils/adminUsers';
import { ShieldCheck, Users, Megaphone, DollarSign, Settings2, Save, UserPlus, RefreshCw } from 'lucide-react';

/**
 * Staff-set passwords are typed once and read to the customer, so they must not
 * be guessable. Ambiguous glyphs (O/0, I/l/1) are excluded — they get misread
 * over the phone and produce support tickets, not security.
 */
const generatePassword = () => {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#%^*_-+='];
  const all = sets.join('');
  const rand = (max) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const chars = sets.map(set => set[rand(set.length)]);
  while (chars.length < 20) chars.push(all[rand(all.length)]);
  // Without the shuffle the first four characters always follow the set order.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

const EMPTY_FORM = { email: '', password: '', fullName: '', agencyName: '', phone: '', planCode: '' };

export default function AdminPanelPage() {
  const { t, isRTL } = useLanguage();
  const { campaignRequests, updateCampaignStatus } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState('briefs'); // briefs, users, templates, settings
  const [prompts, setPrompts] = useState([
    { id: 1, title: 'Objection Handler Default prompt', text: 'Act as an expert real estate sales coach. Solve objection: {objection}...' },
    { id: 2, title: 'WhatsApp Template compiler prompt', text: 'Create direct conversational WhatsApp messages incorporating lead: {name}...' }
  ]);

  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
    }, 3000);
  };

  /**
   * Real accounts, read from `profiles` (admin-only RLS policy).
   *
   * This replaced six invented customers that were rendered as production data
   * and fed the "total registered users" tile. Plan / payment-method / amount
   * columns are gone with them: there is no subscription table yet, so every
   * value in them was fiction. They come back in Phase 7 from `subscriptions`.
   */
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState(null);

  useEffect(() => {
    if (!supabase) { setAccountsLoading(false); return undefined; }
    let active = true;
    supabase
      .from('profiles')
      .select('id, full_name, email, agency_name, phone, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAccountsError(error.message);
        else setAccounts(data || []);
      })
      .catch((err) => { if (active) setAccountsError(err?.message || 'load_failed'); })
      .finally(() => { if (active) setAccountsLoading(false); });
    return () => { active = false; };
  }, []);

  /**
   * Account creation. The browser has no service-role key and never will, so
   * this posts to the `admin-users` Edge Function, which re-checks the caller's
   * platform-admin claim server-side. The button below is a convenience, not
   * the control: hiding it would gate nothing.
   */
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [created, setCreated] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase
      .from('plans')
      .select('code, name_en, name_ar')
      .order('rank')
      .then(({ data }) => { if (active) setPlans(data || []); });
    return () => { active = false; };
  }, []);

  const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreated(null);
    setCreating(true);
    try {
      const result = await createAccount(form);
      // Keep the password on screen: it is hashed server-side the moment it
      // lands, so this render is the only chance to hand it to the customer.
      setCreated({ ...result, password: form.password });
      setForm(EMPTY_FORM);
      setAccounts(prev => [{
        id: result.id,
        full_name: form.fullName || null,
        email: result.email,
        agency_name: form.agencyName || null,
        phone: form.phone || null,
        created_at: new Date().toISOString(),
      }, ...prev]);
    } catch (err) {
      setCreateError(describeAdminError(err, isRTL));
    } finally {
      setCreating(false);
    }
  };

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
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {accountsLoading ? '…' : accounts.length}
            </div>
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
            {/* Was the string literal "697 ريال". There is no billing data to
                compute this from until Phase 7 creates `subscriptions`. */}
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>—</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'بانتظار ربط الفوترة' : 'Awaiting billing integration'}
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
              <form
                onSubmit={handleCreateAccount}
                style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', textAlign: 'start' }}>
                  <UserPlus size={16} style={{ color: 'var(--primary)' }} />
                  {isRTL ? 'إنشاء حساب جديد' : 'Create a new account'}
                </h4>

                <div className="grid-3" style={{ gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="you@example.com"
                      autoComplete="off"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                      {isRTL ? 'كلمة المرور *' : 'Password *'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        required
                        minLength={8}
                        value={form.password}
                        onChange={setField('password')}
                        autoComplete="off"
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setForm(prev => ({ ...prev, password: generatePassword() }))}
                        title={isRTL ? 'توليد كلمة مرور قوية' : 'Generate a strong password'}
                        style={{ padding: '0 0.75rem' }}
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                      {isRTL ? 'الباقة' : 'Plan'}
                    </label>
                    <select value={form.planCode} onChange={setField('planCode')} style={{ width: '100%' }}>
                      <option value="">{isRTL ? 'بدون باقة' : 'No plan'}</option>
                      {plans.map(plan => (
                        <option key={plan.code} value={plan.code}>
                          {isRTL ? plan.name_ar : plan.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                      {t('name')}
                    </label>
                    <input type="text" value={form.fullName} onChange={setField('fullName')} style={{ width: '100%' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                      {isRTL ? 'الجهة' : 'Agency'}
                    </label>
                    <input type="text" value={form.agencyName} onChange={setField('agencyName')} style={{ width: '100%' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                      {isRTL ? 'الجوال' : 'Phone'}
                    </label>
                    <input type="tel" value={form.phone} onChange={setField('phone')} style={{ width: '100%' }} />
                  </div>
                </div>

                {createError && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'start' }}>{createError}</div>
                )}

                {created && (
                  <div style={{
                    background: 'var(--success-glow)',
                    color: 'var(--success)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    textAlign: 'start',
                    lineHeight: 1.9,
                  }}>
                    <div style={{ fontWeight: 700 }}>
                      {isRTL ? 'تم إنشاء الحساب' : 'Account created'}
                    </div>
                    <div style={{ fontFamily: 'monospace' }}>{created.email}</div>
                    <div style={{ fontFamily: 'monospace' }}>{created.password}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {isRTL
                        ? 'انسخ كلمة المرور الآن — تُخزَّن مجزّأة ولا يمكن عرضها مرة أخرى.'
                        : 'Copy the password now — it is stored hashed and cannot be shown again.'}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                  style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', opacity: creating ? 0.6 : 1 }}
                >
                  <UserPlus size={16} />
                  {creating
                    ? (isRTL ? 'جارٍ الإنشاء…' : 'Creating…')
                    : (isRTL ? 'إنشاء الحساب' : 'Create account')}
                </button>
              </form>

              {accountsLoading && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>…</div>
              )}

              {accountsError && (
                <div style={{ padding: '1rem', color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'start' }}>
                  {isRTL ? 'تعذّر تحميل الحسابات: ' : 'Could not load accounts: '}{accountsError}
                </div>
              )}

              {!accountsLoading && !accountsError && accounts.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {isRTL ? 'لا توجد حسابات مسجّلة بعد.' : 'No accounts registered yet.'}
                </div>
              )}

              {!accountsLoading && accounts.length > 0 && (
                <>
                  {/* Desktop Users Table */}
                  <div className="desktop-only" style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '720px' }}>
                      <thead>
                        <tr>
                          <th>{t('name')}</th>
                          <th>{t('email')}</th>
                          <th>{isRTL ? 'الجهة' : 'Agency'}</th>
                          <th>{isRTL ? 'الجوال' : 'Phone'}</th>
                          <th>{isRTL ? 'تاريخ التسجيل' : 'Registered'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map(account => (
                          <tr key={account.id}>
                            <td style={{ fontWeight: 'bold' }}>{account.full_name || '—'}</td>
                            <td>{account.email || '—'}</td>
                            <td>{account.agency_name || '—'}</td>
                            <td>{account.phone || '—'}</td>
                            <td>{account.created_at ? account.created_at.split('T')[0] : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Users Cards */}
                  <div className="mobile-only-flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                    {accounts.map(account => (
                      <div key={account.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{account.full_name || '—'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{account.email || '—'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {account.agency_name || '—'} • {account.created_at ? account.created_at.split('T')[0] : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                {/* Credential fields removed.
                    The Gemini key was typed here and kept in localStorage,
                    then sent from the browser in a query string â€” readable by
                    anyone with devtools, and usable by any signed-in account.
                    It now lives in the ai-proxy function's secrets. The Google
                    Client ID belonged to the deleted fake OAuth flow; real
                    providers are configured in the Supabase dashboard. */}
                <div style={{ paddingBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-main)', textAlign: 'start' }}>
                    {isRTL ? "بيانات الاعتماد تُدار على الخادم" : "Credentials are managed on the server"}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'start', lineHeight: 1.8 }}>
                    {isRTL
                      ? "مفتاح Gemini يُضبط كسرّ في دالة ai-proxy على Supabase، ومزوّدو تسجيل الدخول يُضبطون من لوحة Supabase. لم تعد أي مفاتيح تُخزَّن في المتصفح."
                      : "The Gemini key is a secret on the ai-proxy Supabase function, and sign-in providers are configured in the Supabase dashboard. No keys are stored in the browser any more."}
                  </p>
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
