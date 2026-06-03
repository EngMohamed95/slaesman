import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, Calendar, Mail, Phone, DollarSign, 
  MessageSquare, Edit3, Trash2, HeartHandshake, CheckCircle2 
} from 'lucide-react';

export default function LeadDetailsPage({ leadId, setPage }) {
  const { leads, updateLead, deleteLead } = useCRM();
  const { t, isRTL } = useLanguage();
  
  const lead = leads.find(l => l.id === leadId);

  if (!lead) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>{isRTL ? "لم يتم العثور على العميل" : "Lead not found"}</h3>
        <button className="btn btn-secondary" onClick={() => setPage('crm')}>{t('navCRM')}</button>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email);
  const [status, setStatus] = useState(lead.status);
  const [budget, setBudget] = useState(lead.budget);
  const [expectedValue, setExpectedValue] = useState(lead.expectedValue || 0);
  const [interestLevel, setInterestLevel] = useState(lead.interestLevel);
  const [nextFollowUp, setNextFollowUp] = useState(lead.nextFollowUp || '');
  const [notes, setNotes] = useState(isRTL ? (lead.notesAr || lead.notes) : lead.notes);
  const [service, setService] = useState(isRTL ? (lead.serviceAr || lead.service) : lead.service);

  // Consent levels
  const [whatsappAllowed, setWhatsappAllowed] = useState(lead.consent?.whatsapp !== false);
  const [callsAllowed, setCallsAllowed] = useState(lead.consent?.calls !== false);
  const [marketingAllowed, setMarketingAllowed] = useState(lead.consent?.marketing !== false);
  const [unsubscribed, setUnsubscribed] = useState(lead.consent?.unsubscribed === true);
  const [doNotContact, setDoNotContact] = useState(lead.consent?.doNotContact === true);

  const handleSave = () => {
    updateLead(lead.id, {
      name,
      nameAr: name,
      phone,
      email,
      status,
      statusAr: isRTL ? status : lead.statusAr, // Fallback placeholder
      budget: Number(budget),
      expectedValue: Number(expectedValue),
      interestLevel,
      nextFollowUp,
      notes: isRTL ? lead.notes : notes,
      notesAr: isRTL ? notes : lead.notesAr,
      service: isRTL ? lead.service : service,
      serviceAr: isRTL ? service : lead.serviceAr,
      consent: {
        whatsapp: whatsappAllowed,
        calls: callsAllowed,
        marketing: marketingAllowed,
        unsubscribed,
        doNotContact
      }
    });
    setIsEditing(false);
  };

  const handleRemove = () => {
    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العميل نهائياً؟' : 'Are you sure you want to delete this lead?')) {
      deleteLead(lead.id);
      setPage('crm');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setPage('crm')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> {isRTL ? "الرجوع للعملاء" : "Back to Leads"}
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 size={16} /> {isEditing ? (isRTL ? "إلغاء التعديل" : "Cancel") : (isRTL ? "تعديل البيانات" : "Edit")}
          </button>
          <button className="btn btn-danger" onClick={handleRemove}>
            <Trash2 size={16} /> {t('deleteLead')}
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Details & Edit Forms */}
        <div className="card">
          <h2 style={{ margin: '0 0 1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            {isEditing ? (isRTL ? "تعديل الملف الشخصي" : "Edit Lead Details") : (isRTL ? lead.nameAr : lead.name)}
          </h2>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('name')}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('phone')}</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('email')}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('status')}</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {['New', 'Contacted', 'Interested', 'Needs Follow-up', 'No Response', 'Postponed', 'Close to Deal', 'Won', 'Lost', 'Not Interested'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('interestedService')}</label>
                <input type="text" value={service} onChange={e => setService(e.target.value)} />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('budget')}</label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('expectedDealValue')}</label>
                  <input type="number" value={expectedValue} onChange={e => setExpectedValue(e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('interestLevel')}</label>
                  <select value={interestLevel} onChange={e => setInterestLevel(e.target.value)}>
                    <option value="High">{isRTL ? "عالي" : "High"}</option>
                    <option value="Medium">{isRTL ? "متوسط" : "Medium"}</option>
                    <option value="Low">{isRTL ? "منخفض" : "Low"}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('nextFollowUp')}</label>
                  <input type="date" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('notes')}</label>
                <textarea rows="4" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
              </div>

              <button className="btn btn-primary" onClick={handleSave}>{t('saveChanges')}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('phone')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Phone size={14} /> {lead.phone}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('email')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Mail size={14} /> {lead.email || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('status')}</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span className={`badge badge-${lead.status.toLowerCase().replace(' ', '')}`}>
                      {isRTL ? lead.statusAr : lead.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('interestLevel')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    {isRTL ? lead.interestLevelAr : lead.interestLevel}
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('budget')}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.25rem' }}>
                    {isRTL ? `${lead.budget.toLocaleString()} ريال` : `$${lead.budget.toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('expectedDealValue')}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>
                    {isRTL ? `${lead.expectedValue?.toLocaleString()} ريال` : `$${lead.expectedValue?.toLocaleString()}`}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('interestedService')}</div>
                <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>
                  {isRTL ? lead.serviceAr : lead.service}
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('lastContact')}</div>
                  <div style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>{lead.lastContact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('nextFollowUp')}</div>
                  <div style={{ fontSize: '0.95rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} style={{ color: 'var(--accent)' }} /> {lead.nextFollowUp || (isRTL ? 'لم يتم التحديد' : 'Not Scheduled')}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('notes')}</div>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--card-border)',
                  lineHeight: 1.6,
                  fontSize: '0.9rem'
                }}>
                  {isRTL ? (lead.notesAr || lead.notes) : (lead.notes || 'No notes.')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Consent Compliance & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions Panel */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>{isRTL ? "إجراءات التواصل السريع" : "Quick Communication"}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
                onClick={() => setPage('whatsapp')}
              >
                <MessageSquare size={16} /> {t('whatsappQuickMsg')}
              </button>
              <a 
                href={`tel:${lead.phone}`}
                className="btn btn-secondary" 
                style={{ width: '100%', textDecoration: 'none' }}
              >
                <Phone size={16} /> {t('callLead')}
              </a>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <HeartHandshake style={{ color: 'var(--secondary)' }} size={20} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('consentStatus')}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={whatsappAllowed} 
                  onChange={e => {
                    setWhatsappAllowed(e.target.checked);
                    updateLead(lead.id, { consent: { ...lead.consent, whatsapp: e.target.checked } });
                  }} 
                  style={{ width: '1.1rem', height: '1.1rem' }} 
                />
                <span>{t('whatsappAllowed')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={callsAllowed} 
                  onChange={e => {
                    setCallsAllowed(e.target.checked);
                    updateLead(lead.id, { consent: { ...lead.consent, calls: e.target.checked } });
                  }} 
                  style={{ width: '1.1rem', height: '1.1rem' }} 
                />
                <span>{t('callsAllowed')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={marketingAllowed} 
                  onChange={e => {
                    setMarketingAllowed(e.target.checked);
                    updateLead(lead.id, { consent: { ...lead.consent, marketing: e.target.checked } });
                  }} 
                  style={{ width: '1.1rem', height: '1.1rem' }} 
                />
                <span>{t('marketingAllowed')}</span>
              </label>

              <div style={{ height: '1px', background: 'var(--card-border)', margin: '0.5rem 0' }} />

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: unsubscribed ? 'var(--danger)' : 'inherit', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={unsubscribed} 
                  onChange={e => {
                    setUnsubscribed(e.target.checked);
                    updateLead(lead.id, { consent: { ...lead.consent, unsubscribed: e.target.checked } });
                  }} 
                  style={{ width: '1.1rem', height: '1.1rem' }} 
                />
                <span>{t('unsubscribed')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: doNotContact ? 'var(--danger)' : 'inherit', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={doNotContact} 
                  onChange={e => {
                    setDoNotContact(e.target.checked);
                    updateLead(lead.id, { consent: { ...lead.consent, doNotContact: e.target.checked } });
                  }} 
                  style={{ width: '1.1rem', height: '1.1rem' }} 
                />
                <span>{t('doNotContact')}</span>
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
