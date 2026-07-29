import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { useApp } from '../context/AppContext';
import UpgradePaywall from '../components/UpgradePaywall';
import { 
  Megaphone, Calendar, Send, CheckCircle2, MessageSquare, 
  Database, FileSpreadsheet, Layers, Smartphone, Eye, Layout
} from 'lucide-react';

// Custom SVG Brand Icons
const MetaLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M16.5 6C14.28 6 12.4 7.23 11.23 9C10.05 7.23 8.18 6 6 6 2.69 6 0 8.69 0 12s2.69 6 6 6c2.18 0 4.05-1.23 5.23-3 1.17 1.77 3.05 3 5.27 3 3.31 0 6-2.69 6-6s-2.69-6-6-6zm-10.5 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm10.5 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" 
      fill="#FFFFFF"
    />
  </svg>
);

const SnapchatLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 3.5c-1.93 0-3.33 1.38-3.85 3.09-.64-.17-1.33.08-1.74.57-.42.5-.47 1.24-.16 1.79.09.16.23.3.38.39-.1.88-.19 1.83-.19 2.66 0 1.9.72 2.94 1.86 3.42-.16.4-.38.86-.38 1.32 0 1 .74 1.8 1.74 1.8 1.13 0 1.95-.62 2.19-1.55.37.07.72.07 1.09.07s.72 0 1.09-.07c.24.93 1.06 1.55 2.19 1.55 1 0 1.74-.8 1.74-1.8 0-.46-.22-.92-.38-1.32 1.14-.48 1.86-1.52 1.86-3.42 0-.83-.09-1.78-.19-2.66.15-.09.29-.23.38-.39.31-.55.26-1.29-.16-1.79-.41-.49-1.1-.74-1.74-.57-.52-1.71-1.92-3.09-3.85-3.09z" 
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TikTokLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M11.53.02C12.84 0 14 .88 14 2.16c.01 1.7 1.05 3.19 2.6 3.73v3.13c-1.25-.13-2.44-.73-3.32-1.68v7.24a5.55 5.55 0 0 1-5.55 5.55 5.55 5.55 0 0 1-5.55-5.55c0-3.07 2.49-5.55 5.55-5.55.51 0 1 .07 1.47.2V12.3a2.76 2.76 0 0 0-1.47-.41c-1.54 0-2.77 1.24-2.77 2.78s1.24 2.77 2.77 2.77 2.78-1.24 2.78-2.77V.02h2.06z" 
      fill="#00f2fe"
      transform="translate(-1, -1)"
    />
    <path 
      d="M11.53.02C12.84 0 14 .88 14 2.16c.01 1.7 1.05 3.19 2.6 3.73v3.13c-1.25-.13-2.44-.73-3.32-1.68v7.24a5.55 5.55 0 0 1-5.55 5.55 5.55 5.55 0 0 1-5.55-5.55c0-3.07 2.49-5.55 5.55-5.55.51 0 1 .07 1.47.2V12.3a2.76 2.76 0 0 0-1.47-.41c-1.54 0-2.77 1.24-2.77 2.78s1.24 2.77 2.77 2.77 2.78-1.24 2.78-2.77V.02h2.06z" 
      fill="#fe0979"
      transform="translate(1, 1)"
    />
    <path 
      d="M11.53.02C12.84 0 14 .88 14 2.16c.01 1.7 1.05 3.19 2.6 3.73v3.13c-1.25-.13-2.44-.73-3.32-1.68v7.24a5.55 5.55 0 0 1-5.55 5.55 5.55 5.55 0 0 1-5.55-5.55c0-3.07 2.49-5.55 5.55-5.55.51 0 1 .07 1.47.2V12.3a2.76 2.76 0 0 0-1.47-.41c-1.54 0-2.77 1.24-2.77 2.78s1.24 2.77 2.77 2.77 2.78-1.24 2.78-2.77V.02h2.06z" 
      fill="#FFFFFF"
    />
  </svg>
);

const GoogleLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function CampaignRequestPage() {
  const { t, isRTL } = useLanguage();
  const { campaignRequests, addCampaignRequest } = useCRM();
  const { validateFeatureAccess, selectedCurrency } = useApp();

  const getServiceFeeText = () => {
    if (selectedCurrency === 'SAR') return isRTL ? '999 ريال سعودي' : '999 SAR';
    if (selectedCurrency === 'AED') return isRTL ? '999 درهم إماراتي' : '999 AED';
    if (selectedCurrency === 'EGP') return isRTL ? '13,000 جنيه مصري' : '13,000 EGP';
    if (selectedCurrency === 'JOD') return isRTL ? '190 دينار أردني' : '190 JOD';
    return isRTL ? '270 دولار أمريكي' : '$270';
  };
  const feeText = getServiceFeeText();

  if (!validateFeatureAccess('campaigns')) {
    return (
      <UpgradePaywall 
        requiredPlan="Growth" 
        featureNameAr="طلب تمويل وإطلاق الحملات الإعلانية" 
        featureNameEn="AI Sponsored Ad Campaign Request" 
      />
    );
  }

  // Selected advertising platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Meta']); // Meta, Snapchat, TikTok, Google
  // Lead Delivery Destination
  const [deliveryDestination, setDeliveryDestination] = useState('whatsapp'); // whatsapp, crm, excel

  // Ad Creative parameters
  const [adTitle, setAdTitle] = useState(isRTL ? 'فيلا فاخرة بمشروع الياسمين' : 'Luxury Villa at Al-Yasmin');
  const [adBadge, setAdBadge] = useState(isRTL ? 'عرض محدود' : 'Limited Offer');
  const [adCTA, setAdCTA] = useState(isRTL ? 'احجز موعداً للمعاينة' : 'Book Viewings Now');
  const [adGradient, setAdGradient] = useState('theme-indigo'); // theme-indigo, theme-neon, theme-sunset, theme-gold
  const [adFormat, setAdFormat] = useState('post'); // post (1:1) vs story (9:16)

  // Standard Parameters
  const [budget, setBudget] = useState('500');
  const [duration, setDuration] = useState('10');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('25-45');
  const [interests, setInterests] = useState('');
  const [language, setLanguage] = useState(isRTL ? 'ar' : 'en');
  const [offerDetails, setOfferDetails] = useState('');
  const [notes, setNotes] = useState('');

  const [submitted, setSubmitted] = useState(false);

  // Sync offerDetails input to ad mockup main info automatically
  useEffect(() => {
    if (offerDetails.trim() && offerDetails.length < 50) {
      setAdTitle(offerDetails);
    }
  }, [offerDetails]);

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(p => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!city || !offerDetails) {
      alert(isRTL ? 'الرجاء ملء الحقول المطلوبة (المدينة وتفاصيل العرض)' : 'Please fill required fields (City & Offer Details)');
      return;
    }

    addCampaignRequest({
      platform: selectedPlatforms.join(', '),
      goal: deliveryDestination === 'whatsapp' ? 'WhatsApp Leads' : 'CRM & Excel Leads',
      deliveryDestination,
      budget: Number(budget),
      city,
      age,
      interests,
      duration: Number(duration),
      language,
      offerDetails,
      notes,
      adTitle,
      adBadge,
      adCTA,
      adGradientStyle: adGradient,
      adFormat
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

  // Static configs
  const PLATFORMS = [
    { 
      id: 'Meta', 
      nameAr: 'فيسبوك + إنستغرام', 
      nameEn: 'Facebook + Instagram', 
      icon: (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <img src="https://img.icons8.com/color/48/facebook-new.png" style={{ width: '18px', height: '18px' }} alt="Facebook" />
          <img src="https://img.icons8.com/color/48/instagram-new.png" style={{ width: '18px', height: '18px' }} alt="Instagram" />
        </div>
      )
    },
    { 
      id: 'Snapchat', 
      nameAr: 'سناب شات', 
      nameEn: 'Snapchat', 
      icon: <img src="https://img.icons8.com/color/48/snapchat.png" style={{ width: '18px', height: '18px', borderRadius: '3px' }} alt="Snapchat" /> 
    },
    { 
      id: 'TikTok', 
      nameAr: 'تيك توك', 
      nameEn: 'TikTok', 
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} alt="TikTok" /> 
    },
    { 
      id: 'Google', 
      nameAr: 'إعلانات جوجل', 
      nameEn: 'Google Search/Maps', 
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg" style={{ width: '18px', height: '18px' }} alt="Google Ads" /> 
    }
  ];

  const DESTINATIONS = [
    { 
      id: 'whatsapp', 
      titleAr: 'محادثات واتساب مباشر', 
      titleEn: 'Direct WhatsApp', 
      descAr: 'الرسائل تصل مبيعاتك فورياً كدردشة واتساب', 
      descEn: 'Leads open WhatsApp text directly', 
      color: '#25D366', 
      icon: <MessageSquare size={20} /> 
    },
    { 
      id: 'crm_excel', 
      titleAr: 'حملة ليدز (قاعدة بيانات الـ CRM + إكسيل)', 
      titleEn: 'Lead Gen Campaign (CRM + Excel)', 
      descAr: 'تسجيل العملاء تلقائياً في قاعدة البيانات وتصدير ملف Excel للتحميل', 
      descEn: 'Leads saved in CRM database and exportable to Excel files', 
      color: '#6366f1', 
      icon: <Database size={20} /> 
    }
  ];

  const THEMES = [
    { id: 'theme-indigo', nameAr: 'إنديغو ملكي', nameEn: 'Royal Indigo', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)', text: '#818cf8' },
    { id: 'theme-neon', nameAr: 'نيون أزرق', nameEn: 'Cyan Neon', value: 'linear-gradient(135deg, #020617 0%, #082f49 50%, #064e3b 100%)', text: '#06b6d4' },
    { id: 'theme-sunset', nameAr: 'غروب الشمس', nameEn: 'Sunset Glow', value: 'linear-gradient(135deg, #1c0a00 0%, #3b0764 50%, #581c87 100%)', text: '#f97316' },
    { id: 'theme-gold', nameAr: 'ذهبي كلاسيك', nameEn: 'Classic Gold', value: 'linear-gradient(135deg, #1e1b4b 0%, #171717 50%, #451a03 100%)', text: '#f59e0b' }
  ];

  const activeThemeVal = THEMES.find(t => t.id === adGradient)?.value || THEMES[0].value;
  const activeThemeColor = THEMES.find(t => t.id === adGradient)?.text || THEMES[0].text;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Megaphone style={{ color: 'var(--secondary)' }} /> {t('campaignTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('campaignSubtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }} className="grid-responsive">
        
        {/* Left Column: Form & Dynamic Creative Sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Request Form */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', textAlign: 'start' }}>
              {isRTL ? "موجز وتفاصيل الحملة المطلوبة" : "Configure Campaign Brief"}
            </h3>

            {/* Service Fee Notice */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              textAlign: 'start'
            }}>
              <Megaphone size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  {isRTL ? "خدمة إطلاق الحملات الممولة المعتمدة" : "Certified Ad Launch Service"}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {isRTL 
                    ? `سيتواصل معك خبير إعلانات (Media Buyer) معتمد ومتخصص في مجالك لإعداد وإطلاق حملتك. رسوم الخدمة هي ${feeText} لكل حملة.` 
                    : `A certified Media Buyer specialized in your industry will contact you to set up and launch your campaign. Service fee: ${feeText} per campaign.`}
                </p>
              </div>
            </div>

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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* PLATFORMS VISUAL SELECTION GRID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-main)', textAlign: 'start' }}>
                  {isRTL ? "اختر منصات الإعلان المستهدفة:" : "Select Advertising Platforms:"}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {PLATFORMS.map((plat) => {
                    const isSelected = selectedPlatforms.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handlePlatformToggle(plat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '0.75rem',
                          border: isSelected ? '2px solid var(--secondary)' : '1px solid var(--card-border)',
                          background: isSelected 
                            ? 'var(--secondary-glow)' 
                            : 'var(--card-bg)',
                          cursor: 'pointer',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none',
                          transition: 'all 0.2s',
                          color: isSelected ? 'var(--text-main)' : 'var(--text-muted)'
                        }}
                      >
                        {plat.icon}
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {isRTL ? plat.nameAr : plat.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DELIVERY CHANNELS VISUAL SELECTOR */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-main)', textAlign: 'start' }}>
                  {isRTL ? "مكان استقبال العملاء وتوجيه الرسائل:" : "Lead Delivery Destination:"}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {DESTINATIONS.map((dest) => {
                    const isSelected = deliveryDestination === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setDeliveryDestination(dest.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          border: isSelected ? `2px solid ${dest.color}` : '1px solid var(--card-border)',
                          background: isSelected 
                            ? `${dest.color}15` 
                            : 'var(--card-bg)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          boxShadow: isSelected ? `0 0 15px ${dest.color}25` : 'none'
                        }}
                      >
                        <div style={{
                          color: isSelected ? dest.color : 'var(--text-muted)',
                          marginBottom: '0.5rem',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.2s'
                        }}>
                          {dest.icon}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                          {isRTL ? dest.titleAr : dest.titleEn}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          {isRTL ? dest.descAr : dest.descEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUDGET & TARGETING PANEL */}
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                    {isRTL ? "الميزانية الكلية ($)" : "Total Budget ($)"}
                  </label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} required min="50" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                    {isRTL ? "مدة الحملة (أيام)" : "Duration (Days)"}
                  </label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="1" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                    {isRTL ? "اللغة المستهدفة" : "Ad Language"}
                  </label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%' }}>
                    <option value="ar">العربية (Arabic)</option>
                    <option value="en">English (الانجليزية)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                    {isRTL ? "المدن والمناطق المستهدفة" : "Target Cities / Areas"} *
                  </label>
                  <input 
                    type="text" 
                    placeholder={isRTL ? "مثال: الرياض وجدة" : "e.g., Riyadh & Jeddah"} 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                    {isRTL ? "الفئات العمرية" : "Target Age Group"}
                  </label>
                  <select value={age} onChange={e => setAge(e.target.value)} style={{ width: '100%' }}>
                    <option value="21-35">21-35</option>
                    <option value="25-45">25-45</option>
                    <option value="35-60">35-60</option>
                    <option value="21-65+">21-65+</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {isRTL ? "اهتمامات الفئة المستهدفة" : "Target Interests"}
                </label>
                <input 
                  type="text" 
                  placeholder={isRTL ? "مثال: الاستثمار العقاري، الفلل الفاخرة" : "e.g., Property investors, luxury villa hunters"} 
                  value={interests} 
                  onChange={e => setInterests(e.target.value)} 
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {isRTL ? "تفاصيل ومزايا العرض العقاري" : "Special Offer Details"} *
                </label>
                <textarea 
                  rows="3" 
                  placeholder={isRTL ? "اكتب تفاصيل العقار، المساحات، خطط السداد أو الخصومات الحالية..." : "Describe the pricing details, layouts, location advantages, or payment structure..."}
                  value={offerDetails}
                  onChange={e => setOfferDetails(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {isRTL ? "تعليمات إضافية للمصممين" : "Additional Instructions for Campaign Designers"}
                </label>
                <textarea 
                  rows="2" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>
                <Send size={16} /> {t('submitBrief')}
              </button>
            </form>
          </div>

          {/* DYNAMIC CREATIVE MOCKUP SANDBOX CARD */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layout size={18} style={{ color: 'var(--secondary)' }} />
              {isRTL ? "تخصيص وتصميم مظهر الإعلان المقترح" : "Customize Ad Creative Mockup"}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="grid-responsive">
              
              {/* Creative Customizer Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: 'start' }}>
                    {isRTL ? "عنوان الإعلان (Headline):" : "Ad Title / Headline:"}
                  </label>
                  <input 
                    type="text" 
                    value={adTitle} 
                    onChange={e => setAdTitle(e.target.value)} 
                    style={{ fontSize: '0.85rem', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: 'start' }}>
                      {isRTL ? "العلامة المميزة (Badge):" : "Badge label:"}
                    </label>
                    <input 
                      type="text" 
                      value={adBadge} 
                      onChange={e => setAdBadge(e.target.value)} 
                      style={{ fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: 'start' }}>
                      {isRTL ? "نص زر الإجراء (CTA):" : "CTA Button text:"}
                    </label>
                    <input 
                      type="text" 
                      value={adCTA} 
                      onChange={e => setAdCTA(e.target.value)} 
                      style={{ fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Color gradients theme */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'start' }}>
                    {isRTL ? "النمط اللوني لخلفية الإعلان:" : "Ad Graphic Theme Gradients:"}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        className="btn"
                        onClick={() => setAdGradient(theme.id)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          background: adGradient === theme.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                          border: adGradient === theme.id ? '1px solid var(--secondary)' : '1px solid var(--card-border)',
                          color: '#fff',
                          borderRadius: '0.5rem'
                        }}
                      >
                        {isRTL ? theme.nameAr : theme.nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect ratio format controls */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'start' }}>
                    {isRTL ? "صيغة مقاس الإعلان:" : "Graphic Ratio Format:"}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAdFormat('post')}
                      className={`btn ${adFormat === 'post' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.4rem' }}
                    >
                      <Layout size={12} />
                      {isRTL ? "بوست مربع (1:1)" : "Square Post (1:1)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdFormat('story')}
                      className={`btn ${adFormat === 'story' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.4rem' }}
                    >
                      <Smartphone size={12} />
                      {isRTL ? "ستوري طولي (9:16)" : "Story/Reels (9:16)"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Real-time Rendered Visual Ad Card */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', minHeight: '260px' }}>
                <div style={{
                  width: '100%',
                  maxWidth: adFormat === 'post' ? '220px' : '170px',
                  aspectRatio: adFormat === 'post' ? '1/1' : '9/16',
                  background: activeThemeVal,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  textAlign: 'start'
                }}>
                  {/* Subtle color glow backplate */}
                  <div style={{
                    position: 'absolute',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: activeThemeColor + '20',
                    filter: 'blur(20px)',
                    top: '10%',
                    left: '10%'
                  }} />

                  {/* Header: Platform selected and Badge logo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {selectedPlatforms.map(platId => (
                        <span key={platId} style={{ 
                          width: '18px', 
                          height: '18px', 
                          background: 'rgba(255,255,255,0.1)', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.5rem'
                        }}>
                          {PLATFORMS.find(p => p.id === platId)?.icon}
                        </span>
                      ))}
                    </div>
                    {adBadge && (
                      <span style={{
                        background: `${activeThemeColor}20`,
                        border: `1px solid ${activeThemeColor}`,
                        borderRadius: '999px',
                        padding: '0.1rem 0.4rem',
                        fontSize: '0.5rem',
                        fontWeight: 'bold',
                        color: activeThemeColor
                      }}>
                        {adBadge}
                      </span>
                    )}
                  </div>

                  {/* Graphic body details */}
                  <div style={{ zIndex: 2 }}>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                      {adTitle}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                      {offerDetails || (isRTL ? "تفاصيل العرض العقاري ستظهر هنا..." : "Offer details description...")}
                    </p>
                  </div>

                  {/* CTA Action button with delivery destination sync */}
                  <div style={{ zIndex: 2 }}>
                    <div style={{
                      width: '100%',
                      background: activeThemeColor,
                      color: '#fff',
                      borderRadius: '0.25rem',
                      padding: '0.35rem',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      boxShadow: `0 4px 8px ${activeThemeColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}>
                      {deliveryDestination === 'whatsapp' && <MessageSquare size={10} />}
                      {deliveryDestination === 'crm' && <Database size={10} />}
                      {deliveryDestination === 'excel' && <FileSpreadsheet size={10} />}
                      <span>{adCTA}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Active requests Log */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: 'var(--secondary)' }} />
            {t('campaignsHistory')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '720px' }}>
            {campaignRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {isRTL ? "لا توجد طلبات حملات سابقة." : "No campaign history."}
              </div>
            ) : (
              campaignRequests.map((req) => (
                <div 
                  key={req.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--card-border)',
                    textAlign: 'start'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#a5b4fc' }}>
                        {req.platform}
                      </span>
                    </div>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <div>
                      <strong>{isRTL ? "الميزانية: " : "Budget: "}</strong>
                      <span style={{ color: 'var(--text-main)' }}>${req.budget}</span>
                    </div>
                    <div>
                      <strong>{isRTL ? "المدة: " : "Duration: "}</strong>
                      <span style={{ color: 'var(--text-main)' }}>{req.duration} {isRTL ? "أيام" : "days"}</span>
                    </div>
                    <div>
                      <strong>{isRTL ? "الوجهة: " : "Delivery: "}</strong>
                      <span style={{ color: 'var(--secondary)', textTransform: 'capitalize' }}>
                        {req.goal || req.deliveryDestination || 'whatsapp'}
                      </span>
                    </div>
                    <div>
                      <strong>{isRTL ? "التاريخ: " : "Date: "}</strong>
                      <span>{req.date}</span>
                    </div>
                  </div>

                  {/* Mockup thumbnail label if configured */}
                  {req.adTitle && (
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderLeft: '2px solid var(--secondary)',
                      borderRight: isRTL ? '2px solid var(--secondary)' : undefined,
                      marginBottom: '0.75rem',
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={10} />
                        {isRTL ? "تصميم الإعلان المرفق:" : "Attached Creative Setup:"}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{req.adTitle}</div>
                    </div>
                  )}

                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {req.offerDetails}
                  </p>

                  {req.notes && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      *{isRTL ? "ملاحظات: " : "Notes: "}{req.notes}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
