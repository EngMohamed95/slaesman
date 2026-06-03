import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Search, Filter, MessageCircle, Phone, Eye, Trash2 } from 'lucide-react';

export default function CRMPage({ setPage, setSelectedLeadId }) {
  const { leads, addLead, deleteLead } = useCRM();
  const { t, isRTL } = useLanguage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Add Lead Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState('Facebook Lead');
  const [newService, setNewService] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newExpectedValue, setNewExpectedValue] = useState('');
  const [newInterestLevel, setNewInterestLevel] = useState('Medium');
  const [newStatus, setNewStatus] = useState('New');
  const [newNotes, setNewNotes] = useState('');

  // Extract unique sources for filters
  const uniqueSources = [...new Set(leads.map(l => l.source))];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      alert(isRTL ? 'الرجاء إدخال الاسم ورقم الهاتف على الأقل' : 'Please input at least Name and Phone');
      return;
    }

    addLead({
      name: newName,
      nameAr: newName,
      phone: newPhone,
      email: newEmail,
      source: newSource,
      sourceAr: newSource,
      service: newService,
      serviceAr: newService,
      budget: Number(newBudget) || 0,
      expectedValue: Number(newExpectedValue) || 0,
      interestLevel: newInterestLevel,
      status: newStatus,
      statusAr: isRTL ? 'جديد' : newStatus, // Fallback conversion logic
      lastContact: new Date().toISOString().split('T')[0],
      nextFollowUp: '',
      notes: newNotes,
      notesAr: newNotes
    });

    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewService('');
    setNewBudget('');
    setNewExpectedValue('');
    setNewNotes('');
    setShowAddModal(false);
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const query = search.toLowerCase();
    const matchesSearch = 
      lead.name.toLowerCase().includes(query) ||
      (lead.nameAr && lead.nameAr.toLowerCase().includes(query)) ||
      lead.phone.includes(query) ||
      lead.email.toLowerCase().includes(query);

    const matchesStatus = statusFilter === '' || lead.status === statusFilter;
    const matchesSource = sourceFilter === '' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('navCRM')}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {isRTL ? "إدارة وتصنيف بيانات عملائك ومتابعة صفقاتك." : "Track and manage your leads list and pipelines."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {t('addLead')}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingInlineStart: '2.5rem' }}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('filterStatus')}</option>
            {['New', 'Contacted', 'Interested', 'Needs Follow-up', 'No Response', 'Postponed', 'Close to Deal', 'Won', 'Lost', 'Not Interested'].map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">{t('filterSource')}</option>
            {uniqueSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('phone')} / {t('email')}</th>
                <th>{t('source')}</th>
                <th>{t('budget')}</th>
                <th>{t('status')}</th>
                <th>{t('interestLevel')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {isRTL ? "لم يتم العثور على عملاء يطابقون خيارات البحث." : "No leads found matching current criteria."}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{isRTL ? lead.nameAr : lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRTL ? lead.serviceAr : lead.service}</div>
                    </td>
                    <td>
                      <div>{lead.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td>{isRTL ? (lead.sourceAr || lead.source) : lead.source}</td>
                    <td>
                      {isRTL ? `${lead.budget.toLocaleString()} ريال` : `$${lead.budget.toLocaleString()}`}
                    </td>
                    <td>
                      <span className={`badge badge-${lead.status.toLowerCase().replace(' ', '')}`}>
                        {isRTL ? lead.statusAr : lead.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: lead.interestLevel === 'High' ? 'var(--danger)' : lead.interestLevel === 'Medium' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        {isRTL ? lead.interestLevelAr : lead.interestLevel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setPage('leadDetails');
                          }}
                          title={t('leadDetails')}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', color: 'var(--secondary)' }}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setPage('whatsapp');
                          }}
                          title={t('whatsappQuickMsg')}
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', color: 'var(--danger)' }}
                          onClick={() => {
                            if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this lead?')) {
                              deleteLead(lead.id);
                            }
                          }}
                          title={t('deleteLead')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal Overlay */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem' }}>{t('addLead')}</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('name')}</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('phone')}</label>
                  <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} required placeholder="+9665..." />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('email')}</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('source')}</label>
                  <select value={newSource} onChange={e => setNewSource(e.target.value)}>
                    <option value="Facebook Lead">{isRTL ? "إعلان فيسبوك" : "Facebook Lead"}</option>
                    <option value="Instagram Ad">{isRTL ? "إعلان إنستغرام" : "Instagram Ad"}</option>
                    <option value="TikTok Campaign">{isRTL ? "حملة تيك توك" : "TikTok Campaign"}</option>
                    <option value="Google Search">{isRTL ? "بحث جوجل" : "Google Search"}</option>
                    <option value="Referral">{isRTL ? "توصية / صديق" : "Referral"}</option>
                    <option value="Direct Visit">{isRTL ? "زيارة مباشرة" : "Direct Visit"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('interestedService')}</label>
                <input type="text" value={newService} onChange={e => setNewService(e.target.value)} placeholder="e.g. 3-Bedroom Villa in Yas Island" />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('budget')}</label>
                  <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('expectedDealValue')}</label>
                  <input type="number" value={newExpectedValue} onChange={e => setNewExpectedValue(e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('interestLevel')}</label>
                  <select value={newInterestLevel} onChange={e => setNewInterestLevel(e.target.value)}>
                    <option value="High">{isRTL ? "عالي" : "High"}</option>
                    <option value="Medium">{isRTL ? "متوسط" : "Medium"}</option>
                    <option value="Low">{isRTL ? "منخفض" : "Low"}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('status')}</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {['New', 'Contacted', 'Interested', 'Needs Follow-up', 'No Response', 'Postponed', 'Close to Deal', 'Won', 'Lost', 'Not Interested'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('notes')}</label>
                <textarea rows="3" value={newNotes} onChange={e => setNewNotes(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button type="submit" className="btn btn-primary">
                  {isRTL ? "حفظ وإضافة" : "Save & Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
