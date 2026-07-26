import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { ShieldCheck, Users, Megaphone, DollarSign, Settings2, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminPanelPage() {
  const { t, isRTL } = useLanguage();
  const { campaignRequests, updateCampaignStatus } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState('briefs'); // briefs, users, templates
  const [prompts, setPrompts] = useState([
    { id: 1, title: 'Objection Handler Default prompt', text: 'Act as an expert real estate sales coach. Solve objection: {objection}...' },
    { id: 2, title: 'WhatsApp Template compiler prompt', text: 'Create direct conversational WhatsApp messages incorporating lead: {name}...' }
  ]);

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
            { id: 'templates', label: isRTL ? 'إدارة قوالب الذكاء الاصطناعي' : 'AI Prompt Templates' }
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
        </div>
      </div>
    </div>
  );
}
