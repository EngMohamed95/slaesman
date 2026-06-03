import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { Megaphone, Calendar, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CampaignRequestPage() {
  const { t, isRTL } = useLanguage();
  const { campaignRequests, addCampaignRequest } = useCRM();

  // Form State
  const [platform, setPlatform] = useState('Facebook, Instagram');
  const [goal, setGoal] = useState('WhatsApp Leads');
  const [budget, setBudget] = useState('500');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('25-45');
  const [interests, setInterests] = useState('');
  const [duration, setDuration] = useState('10');
  const [language, setLanguage] = useState(isRTL ? 'ar' : 'en');
  const [offerDetails, setOfferDetails] = useState('');
  const [notes, setNotes] = useState('');

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!city || !offerDetails) {
      alert(isRTL ? 'الرجاء ملء الحقول المطلوبة (المدينة وتفاصيل العرض)' : 'Please fill required fields (City & Offer Details)');
      return;
    }

    addCampaignRequest({
      platform,
      goal,
      budget: Number(budget),
      city,
      age,
      interests,
      duration: Number(duration),
      language,
      offerDetails,
      notes
    });

    setSubmitted(true);
    setCity('');
    setOfferDetails('');
    setNotes('');
    setInterests('');

    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Megaphone style={{ color: 'var(--secondary)' }} /> {t('campaignTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('campaignSubtitle')}</p>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Column: Form brief */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            {isRTL ? "موجز وتفاصيل الحملة المطلوبة" : "Configure Campaign Brief"}
          </h3>

          {submitted && (
            <div style={{
              background: 'var(--success-glow)',
              color: 'var(--success)',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>
                {isRTL 
                  ? "تم تقديم طلبك بنجاح! سيقوم فريق المبيعات والمراجعة بمطابقة الميزانية والموافقة عليها خلال ساعة." 
                  : "Campaign request submitted! Our marketing specialists will review and activate it within 1 hour."}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {t('platformSelect')}
                </label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}>
                  <option value="Facebook, Instagram">Facebook + Instagram</option>
                  <option value="Snapchat">Snapchat</option>
                  <option value="TikTok">TikTok Campaign</option>
                  <option value="Google Ads">Google Search / Map</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {t('campaignGoal')}
                </label>
                <select value={goal} onChange={e => setGoal(e.target.value)}>
                  <option value="WhatsApp Leads">{isRTL ? "عملاء واتساب" : "WhatsApp Leads"}</option>
                  <option value="Direct Calls">{isRTL ? "اتصالات مباشرة" : "Direct Phone Calls"}</option>
                  <option value="Lead Generation Form">{isRTL ? "تعبئة نموذج بيانات" : "Lead Generation Forms"}</option>
                  <option value="Website Visits">{isRTL ? "زيارات للموقع العقاري" : "Website Traffic"}</option>
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "الميزانية الكلية ($)" : "Total Budget ($)"}
                </label>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)} required min="50" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "مدة الحملة (أيام)" : "Duration (Days)"}
                </label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="1" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "اللغة المستهدفة" : "Ad Language"}
                </label>
                <select value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English (الانجليزية)</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "المدن والمناطق المستهدفة" : "Target Cities / Areas"} *
                </label>
                <input 
                  type="text" 
                  placeholder={isRTL ? "مثال: الرياض وجدة" : "e.g., Riyadh & Jeddah"} 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "الفئات العمرية" : "Target Age Group"}
                </label>
                <select value={age} onChange={e => setAge(e.target.value)}>
                  <option value="21-35">21-35</option>
                  <option value="25-45">25-45</option>
                  <option value="35-60">35-60</option>
                  <option value="21-65+">21-65+</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                {isRTL ? "اهتمامات الفئة المستهدفة" : "Target Interests"}
              </label>
              <input 
                type="text" 
                placeholder={isRTL ? "مثال: الاستثمار العقاري، الفلل الفاخرة" : "e.g., Property investors, luxury villa hunters"} 
                value={interests} 
                onChange={e => setInterests(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                {isRTL ? "تفاصيل ومزايا العرض العقاري" : "Special Offer Details"} *
              </label>
              <textarea 
                rows="3" 
                placeholder={isRTL ? "اكتب تفاصيل العقار، المساحات، خطط السداد أو الخصومات الحالية..." : "Describe the pricing details, layouts, location advantages, or payment structure..."}
                value={offerDetails}
                onChange={e => setOfferDetails(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                {isRTL ? "تعليمات إضافية للمصممين" : "Additional Instructions for Campaign Designers"}
              </label>
              <textarea 
                rows="2" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Send size={16} /> {t('submitBrief')}
            </button>
          </form>
        </div>

        {/* Right Column: History List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0 }}>{t('campaignsHistory')}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '550px' }}>
            {campaignRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {isRTL ? "لا توجد طلبات حملات سابقة." : "No campaign history."}
              </div>
            ) : (
              campaignRequests.map((req) => (
                <div 
                  key={req.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#a5b4fc' }}>{req.platform}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      background: req.status === 'Active & Delivering' ? 'var(--success-glow)' : 'var(--accent-glow)',
                      color: req.status === 'Active & Delivering' ? 'var(--success)' : 'var(--accent)'
                    }}>
                      {isRTL ? (req.statusAr || req.status) : req.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>{isRTL ? `الميزانية: $${req.budget}` : `Budget: $${req.budget}`}</span>
                    <span>{req.date}</span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {req.offerDetails}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
