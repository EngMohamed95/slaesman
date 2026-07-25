import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, CheckCircle2, ShieldAlert, ArrowRight, 
  MessageSquare, Users, BarChart3, Megaphone, Check, Globe,
  Calendar, Zap, ChevronDown, ChevronUp, Star, TrendingUp,
  Bot, Video, Layers, Smartphone, Target, DollarSign, Clock,
  ShieldCheck, Play, Copy, ExternalLink, Sliders, ArrowUpRight,
  Sun, Moon
} from 'lucide-react';

const CURRENCIES = {
  SAR: { symbolAr: 'ريال', symbolEn: 'SAR', flag: '🇸🇦', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', prices: { Basic: 99, Pro: 199, Growth: 399 } },
  USD: { symbolAr: '$', symbolEn: 'USD', flag: '🇺🇸', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', prices: { Basic: 27, Pro: 53, Growth: 107 } },
  AED: { symbolAr: 'درهم', symbolEn: 'AED', flag: '🇦🇪', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', prices: { Basic: 97, Pro: 195, Growth: 390 } },
  EGP: { symbolAr: 'جنيه', symbolEn: 'EGP', flag: '🇪🇬', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', prices: { Basic: 1290, Pro: 2590, Growth: 5190 } },
  JOD: { symbolAr: 'دينار', symbolEn: 'JOD', flag: '🇯🇴', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar', prices: { Basic: 19, Pro: 38, Growth: 76 } }
};

export default function LandingPage({ setPage }) {
  const { t, lang, toggleLanguage, isRTL } = useLanguage();
  const { user, selectedCurrency, setSelectedCurrency, detectedCountry, theme, toggleTheme } = useApp();

  // State for Interactive Feature Demo Showcase
  const [activeDemoTab, setActiveDemoTab] = useState('crm');

  // State for Interactive ROI Calculator
  const [monthlyLeads, setMonthlyLeads] = useState(60);
  const [avgCommission, setAvgCommission] = useState(25000);

  // State for Live AI Generator Playground
  const [selectedPlaygroundPrompt, setSelectedPlaygroundPrompt] = useState('objection');
  const [isGeneratingPlayground, setIsGeneratingPlayground] = useState(false);
  const [playgroundOutput, setPlaygroundOutput] = useState('');

  // State for FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const currencyInfo = CURRENCIES[selectedCurrency] || CURRENCIES.SAR;
  const symbol = isRTL ? currencyInfo.symbolAr : currencyInfo.symbolEn;

  // ROI Math
  const hoursSavedPerWeek = Math.round(monthlyLeads * 0.3);
  const extraClosedDeals = Math.max(1, Math.round(monthlyLeads * 0.1));
  const estimatedExtraRevenue = extraClosedDeals * avgCommission;

  // Playground presets
  const playgroundScenarios = {
    objection: {
      titleAr: "الرد على اعتراض: العقار أعلى من ميزانيتي",
      titleEn: "Objection Response: Over Budget",
      promptAr: "كيف أرد على عميل مهتم بفيلا في الرياض لكنه متردد ويقول السعر مرتفع مقارنة بميزانيته؟",
      outputAr: `أهلاً بك يا أبا فهد، أقدر حرصك على الميزانية. 
الميزة في هذا العقار أنه يقع في حي واعد يشهد رخص بناء تجارية جديدة ومخطط مترو قريب، مما يعني أن قيمته الاستثمارية ترتفع سنوياً بنسبة لا تقل عن 12-15%.
كذلك، المالك مستعد لتقديم تيسيرات في دفعة المقدم وتقسيط باقي المبلغ على دفعتين. هل نحدد موعد غداً لمراجعة خيارات التمويل المتاحة وتثبيت السعر الحالي قبل التحديث؟`
    },
    whatsapp: {
      titleAr: "رسالة واتساب: إعادة تنشيط عميل غير متجاوب",
      titleEn: "WhatsApp: Reactivate Cold Lead",
      promptAr: "صياغة رسالة واتساب قصيرة جداً لعميل انقطع عن الرد منذ 5 أيام بخصوص شقة فندقية",
      outputAr: `مرحباً أستاذ خالد 👋
أحببت تذكيرك بالفرصة الاستثمارية لشقة المارينا الفندقية. 
تلقينا اليوم إشعاراً بتحديث خطة السداد إلى 5 سنوات بدون فوائد.
هل ينسبك مراجعة التفاصيل المحدثة اليوم؟ 📲`
    },
    reels: {
      titleAr: "سكربت ريلز 15 ثانية: تسويق بنتهاوس فاخر",
      titleEn: "15s Reels Script: Luxury Penthouse",
      promptAr: "كتابة سيناريو ريلز سريع وجذاب لعرض بنتهاوس مع مسبح خاص",
      outputAr: `🎬 [مشهد 1 - 0-3 ثواني]: فتح باب الأسانسير البانورامي وموسيقى هادئة.
🗣️ هوك الصوت: "تخيل أن هذا هو المنظر الذي تستيقظ عليه كل صباح في قلب العاصمة!"
🎬 [مشهد 2 - 3-10 ثواني]: لقطات سريعة للمسبح الخاص والإضاءة الخافتة بالمساء.
🗣️ الصوت: "بنتهاوس 400م بمسبح خاص، وتشطيب فندقي بالكامل بدون عمولة."
🎬 [مشهد 3 - 10-15 ثواني]: نص على الشاشة 📲 "اضغط على الرابط بالبايو لمعاينة الموقع فوراً".`
    }
  };

  const handleRunPlayground = (key) => {
    setSelectedPlaygroundPrompt(key);
    setIsGeneratingPlayground(true);
    setPlaygroundOutput('');
    setTimeout(() => {
      setPlaygroundOutput(playgroundScenarios[key].outputAr);
      setIsGeneratingPlayground(false);
    }, 600);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page fade-in" style={{ background: 'var(--bg-darker)', minHeight: '100vh', color: 'var(--text-main)', overflowX: 'hidden' }}>
      
      {/* Dynamic Background Glow Orbs */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '10%',
        left: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* 1. Header Navigation */}
      <header className="landing-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: 'rgba(7, 10, 19, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setPage('landing')}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(79, 70, 229, 0.4)'
            }}>
              <Sparkles style={{ color: 'white' }} size={22} />
            </div>
            <div>
              <span className="landing-logo-text" style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 30%, #c7d2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AdToDeal AI
              </span>
              <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '-3px' }}>
                {isRTL ? "نظام مبيعات العقارات الذكي" : "AI Real Estate Sales Ecosystem"}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="desktop-only">
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              {isRTL ? "المميزات" : "Features"}
            </button>
            <button onClick={() => scrollToSection('demo')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              {isRTL ? "المعاينة الحية" : "Live Demo"}
            </button>
            <button onClick={() => scrollToSection('calculator')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              {isRTL ? "حاسبة الأرباح" : "ROI Calculator"}
            </button>
            <button onClick={() => scrollToSection('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              {isRTL ? "الأسعار" : "Pricing"}
            </button>
            <button onClick={() => scrollToSection('faq')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              {isRTL ? "الأسئلة الشائعة" : "FAQ"}
            </button>
          </div>

          {/* Controls & Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Currency Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', borderRadius: '0.5rem', padding: '0.2rem 0.5rem' }}>
              <Globe size={14} style={{ color: 'var(--secondary)' }} />
              <select 
                value={selectedCurrency} 
                onChange={(e) => setSelectedCurrency(e.target.value)}
                style={{ background: 'none', border: 'none', padding: '0.2rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', width: 'auto' }}
              >
                {Object.keys(CURRENCIES).map(curr => (
                  <option key={curr} value={curr}>
                    {CURRENCIES[curr].flag} {curr}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switch */}
            <button 
              onClick={toggleLanguage} 
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              {theme === 'dark' ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#4f46e5' }} />}
            </button>

            {/* User Auth state buttons */}
            {user ? (
              <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
                {t('navDashboard')} <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => setPage('login')} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  {t('navLogin')}
                </button>
                <button className="btn btn-primary" onClick={() => setPage('register')} style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>
                  {isRTL ? "تجربة مجانية" : "Free Trial"}
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        padding: '5rem 1.5rem 4rem',
        maxWidth: '1100px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Top Feature Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.5rem 1.2rem',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(6,182,212,0.15))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.875rem',
          fontWeight: 700,
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(79, 70, 229, 0.15)'
        }}>
          <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
          <span>{isRTL ? "المنصة رقم #1 لإدارة ومبيعات العقارات بالذكاء الاصطناعي" : "The #1 AI Real Estate Sales & CRM Platform"}</span>
          <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>v2.4</span>
        </div>

        {/* Main Headline */}
        <h1 className="hero-headline" style={{
          fontSize: '3.6rem',
          fontWeight: 900,
          lineHeight: 1.2,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #ffffff 20%, #c7d2fe 60%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isRTL 
            ? "ضاعف صفقاتك العقارية وأغلق العملاء بسرعة 3X باستخدام الذكاء الاصطناعي"
            : "Triple Your Real Estate Deals & Close Clients Faster with AI"}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-muted)',
          marginBottom: '2.5rem',
          maxWidth: '820px',
          marginInline: 'auto',
          lineHeight: 1.7
        }}>
          {isRTL 
            ? "نظام متكامل يجمع بين إدارة العملاء (CRM)، توليد رسائل الواتساب الفورية، صانع محتوى السوشيال ميديا والريلز، ومساعد المبيعات الذكي 24/7 للرد على جميع الاعتراضات."
            : "An all-in-one ecosystem combining Lead Pipeline Management, Instant Prefilled WhatsApp Generator, Viral Social Media Creator, and 24/7 AI Sales Copilot."}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <button 
            className="btn btn-primary glow-box" 
            style={{ padding: '1rem 2.25rem', fontSize: '1.15rem', borderRadius: '0.75rem', fontWeight: 800 }} 
            onClick={() => setPage('register')}
          >
            <Zap size={20} />
            {isRTL ? "ابدأ تجربتك المجانية الآن" : "Start Free Trial Now"}
          </button>
          
          <button 
            className="btn btn-secondary" 
            style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '0.75rem' }} 
            onClick={() => scrollToSection('demo')}
          >
            <Play size={18} style={{ color: 'var(--secondary)' }} />
            {isRTL ? "شاهد المعاينة الحية" : "Watch Interactive Demo"}
          </button>
        </div>

        {/* Trust Badges Ribbon */}
        <div className="trust-ribbon" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.5rem 2rem',
          borderRadius: '1rem',
          background: 'rgba(17, 24, 39, 0.5)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <TrendingUp size={24} style={{ color: 'var(--success)' }} />
            <div style={{ textAlign: 'start' }}>
              <div className="trust-ribbon-num" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>+350%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "سرعة الاستجابة للعملاء" : "Faster Lead Response"}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <Users size={24} style={{ color: 'var(--secondary)' }} />
            <div style={{ textAlign: 'start' }}>
              <div className="trust-ribbon-num" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>+25,000</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "عميل مُدار بنجاح" : "Leads Managed Daily"}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <Clock size={24} style={{ color: 'var(--accent)' }} />
            <div style={{ textAlign: 'start' }}>
              <div className="trust-ribbon-num" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>15+ {isRTL ? "ساعة" : "hrs"}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "توفير أسبوعي في العمل المكتبي" : "Weekly Hours Saved"}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <Star size={24} style={{ color: '#f59e0b' }} />
            <div style={{ textAlign: 'start' }}>
              <div className="trust-ribbon-num" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>4.9 / 5.0</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "تقييم الشركات العقارية" : "Brokers Satisfaction"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Product Demo Showcase */}
      <section id="demo" style={{ padding: '5rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-new" style={{ marginBottom: '1rem', padding: '0.4rem 1rem' }}>
            {isRTL ? "تجربة واجهة النظام المباشرة" : "Interactive System Preview"}
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            {isRTL ? "استكشف قوة AdToDeal AI في مكان واحد" : "Experience the Power of AdToDeal AI"}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            {isRTL ? "تنقل بين التبويبات التالية للاطلاع على شاشات النظام الحقيقية وآلية عملها الفائقة." : "Click below to preview real system screens and intuitive workflows."}
          </p>
        </div>

        {/* Demo Tab Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button 
            className={`landing-tab-btn ${activeDemoTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('crm')}
          >
            <Users size={18} />
            <span>{isRTL ? "1. إدارة العملاء CRM" : "1. Lead CRM Pipeline"}</span>
          </button>
          
          <button 
            className={`landing-tab-btn ${activeDemoTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('whatsapp')}
          >
            <MessageSquare size={18} />
            <span>{isRTL ? "2. مولد الواتساب الفوري" : "2. Instant WhatsApp Generator"}</span>
          </button>

          <button 
            className={`landing-tab-btn ${activeDemoTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('ai')}
          >
            <Bot size={18} />
            <span>{isRTL ? "3. مساعد المبيعات 24/7" : "3. 24/7 AI Sales Assistant"}</span>
          </button>

          <button 
            className={`landing-tab-btn ${activeDemoTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('social')}
          >
            <Video size={18} />
            <span>{isRTL ? "4. صانع محتوى الريلز" : "4. Social Content Creator"}</span>
          </button>

          <button 
            className={`landing-tab-btn ${activeDemoTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveDemoTab('campaigns')}
          >
            <Megaphone size={18} />
            <span>{isRTL ? "5. طلب إعلانات ممولة" : "5. Sponsored Campaigns Brief"}</span>
          </button>
        </div>

        {/* Demo Display Screen Container */}
        <div className="glass-panel demo-screen-container" style={{ padding: '2rem', borderRadius: '1.25rem', border: '1px solid var(--card-border)' }}>
          
          {/* TAB 1: CRM Preview */}
          {activeDemoTab === 'crm' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>{isRTL ? "لوحة تتبع العملاء العقارية (Pipeline Kanban)" : "Real Estate Deals Pipeline"}</h3>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{isRTL ? "تتبع حالة كل عميل وميزانيته ومستويات اهتمامه بسهولة" : "Track lead stages, budgets, and priority scores"}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-new">+12 {isRTL ? "عملاء هذا اليوم" : "Leads Today"}</span>
                  <span className="badge badge-won">{isRTL ? "إجمالي القيمة: 1.2M ريال" : "Pipeline: 1.2M SAR"}</span>
                </div>
              </div>

              {/* Kanban Column Preview */}
              <div className="grid-4" style={{ gap: '1rem' }}>
                {/* Col 1 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{isRTL ? "عملاء جُدد (3)" : "New Leads (3)"}</strong>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🆕</span>
                  </div>
                  <div className="card" style={{ padding: '0.85rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>أحمد الدوسري</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ميزانية: 2.5M ريال • فيلا بالرياض</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-new" style={{ fontSize: '0.65rem' }}>Meta Ads</span>
                      <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>⭐ 92%</span>
                    </div>
                  </div>
                </div>

                {/* Col 2 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#818cf8' }}>{isRTL ? "تم التواصل (4)" : "Contacted (4)"}</strong>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>📞</span>
                  </div>
                  <div className="card" style={{ padding: '0.85rem', marginBottom: '0.75rem', fontSize: '0.85rem', borderInlineStart: '3px solid #818cf8' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>سارة العتيبي</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ميزانية: 1.8M ريال • شقة تمليك</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-contacted" style={{ fontSize: '0.65rem' }}>WhatsApp</span>
                      <span style={{ color: '#10b981', fontSize: '0.7rem' }}>تم التجاوب</span>
                    </div>
                  </div>
                </div>

                {/* Col 3 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>{isRTL ? "تقديم عرض (2)" : "Proposal Sent (2)"}</strong>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>📑</span>
                  </div>
                  <div className="card" style={{ padding: '0.85rem', marginBottom: '0.75rem', fontSize: '0.85rem', borderInlineStart: '3px solid var(--accent)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>شركة الأمل العقارية</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>عرض شراء أرض تجارية</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-followup" style={{ fontSize: '0.65rem' }}>موعد معاينة</span>
                      <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>هام جداً</span>
                    </div>
                  </div>
                </div>

                {/* Col 4 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--success)' }}>{isRTL ? "تم إغلاق الصفقة 🎉" : "Closed Won 🎉"}</strong>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>✅</span>
                  </div>
                  <div className="card" style={{ padding: '0.85rem', marginBottom: '0.75rem', fontSize: '0.85rem', borderInlineStart: '3px solid var(--success)', background: 'rgba(16,185,129,0.05)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>م. فهد الخالدي</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>بيع شاليه جدة • عمولة 45k</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-won" style={{ fontSize: '0.65rem' }}>تم التوقيع</span>
                      <span style={{ color: 'var(--success)', fontSize: '0.7rem' }}>ناجحة</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WhatsApp Generator */}
          {activeDemoTab === 'whatsapp' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2">
                <div>
                  <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>{isRTL ? "مولد الرسائل ورابط الواتساب الفوري" : "Prefilled WhatsApp Message Builder"}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {isRTL ? "اختر اسم العميل ونوع العرض، وسيقوم الذكاء الاصطناعي بدمج التفاصيل وصياغة الرسالة المناسبة وفتح تطبيق الواتساب مباشرة بلمسة واحدة بدون الحاجة لكتابة حرف واحد!" : "Select lead and template, the system formats custom ready-to-send messages with lead parameters."}
                  </p>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{isRTL ? "العميل المستهدف:" : "Target Lead:"}</div>
                    <div style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--secondary)' }}>عبدالله الشهري (فيلا النرجس - 2.8M)</div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{isRTL ? "قالب الرسالة المناسب:" : "Selected Template:"}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ background: 'var(--primary)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>متابعة بعد المعاينة الاولى</span>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>عرض التخفيض الحصري</span>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>تحديد موعد التوقيع</span>
                    </div>
                  </div>
                </div>

                {/* Chat Preview */}
                <div style={{ background: '#0b141a', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #1f2c34', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #1f2c34', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                      WA
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>عبدالله الشهري</div>
                      <div style={{ fontSize: '0.7rem', color: '#25d366' }}>متصل الآن (جاهز لاستلام الرسالة)</div>
                    </div>
                  </div>

                  <div style={{ background: '#005c4b', color: 'white', padding: '1rem', borderRadius: '0.75rem 0.75rem 0 0.75rem', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {isRTL ? "مرحباً أستاذ عبدالله 👋، بناءً على معاينتك لـ فيلا النرجس اليوم، أود إفادتك بأن المالك وافق على إمكانية تقسيط الدفعة الثانية بعد 6 أشهر. هل تود أن نجهز عقد رغبة الشراء اليوم؟" : "Hello Mr. Abdullah 👋, following up on your viewing of the Al-Narjis villa today..."}
                  </div>

                  <button className="btn" style={{ width: '100%', background: '#25d366', color: 'black', fontWeight: 800, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <ExternalLink size={18} />
                    {isRTL ? "إرسال مباشر عبر تطبيق الواتساب" : "Send Directly via WhatsApp"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI Assistant */}
          {activeDemoTab === 'ai' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2">
                <div>
                  <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>{isRTL ? "مساعد الذكاء الاصطناعي المتخصص في العقارات" : "24/7 AI Real Estate Sales Copilot"}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {isRTL ? "لا تحتار مجدداً في التعامل مع ردود العملاء الصعبة. اسأل المساعد عن أي سيناريو وسيقوم فوراً بتحليل الاعتراض وكتابة الرد المقنع." : "Ask the AI copilot how to handle objections, analyze deal terms, or write property pitches."}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid var(--primary-glow)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      💡 {isRTL ? "العميل يرى أن العمولة 2.5% مرتفعة، كيف أقنعه؟" : "Client says commission is too high, how to convince them?"}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      💡 {isRTL ? "اقترح علي أفكار لعرض شقة فندقية على مستثمر خليجي" : "Pitch ideas for hotel apartment to GCC investor"}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      💡 {isRTL ? "كيف أتصفح العقارات الأنسب لميزانية 1.5M؟" : "Match properties for 1.5M budget"}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--card-bg)', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                    <Sparkles style={{ color: 'var(--secondary)' }} size={20} />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{isRTL ? "استجابة الذكاء الاصطناعي الذكية" : "AI Sales Copilot Output"}</strong>
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
                    {isRTL ? `للرد على اعتراض نسبة العمولة:
"أفهمك أستاذي الكريم، العمولة ليست مجرد رسوم، بل هي ضمان لاتمام الفحص القانوني للعقار، وتفاوضنا لك لخصم 50 ألف ريال من السعر الأصلي، بالإضافة إلى إنهاء إجراءات الإفراغ العقاري عبر منصة إحكام بدون عناء."` : "Handling commission objection effectively..."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Social Content */}
          {activeDemoTab === 'social' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2">
                <div>
                  <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>{isRTL ? "مولد محتوى الريلز والفيديوهات العقارية" : "Viral Reels & Social Post Generator"}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {isRTL ? "قم بصناعة منشورات انستغرام، تيك توك، وسكربتات ريلز قصيرة تحقق انتشاراً واسعاً وادمج الهاشتاجات الأكثر بحثاً بلمح البصر." : "Generate high-converting video scripts, captions, and hashtag bundles tailored to your property."}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="badge badge-new">Instagram Reels</span>
                    <span className="badge badge-contacted">TikTok Video</span>
                    <span className="badge badge-followup">Snapchat Ads</span>
                  </div>
                </div>

                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', fontSize: '0.875rem' }}>
                  <div style={{ color: 'var(--secondary)', fontWeight: 800, marginBottom: '0.5rem' }}>🎬 {isRTL ? "سكربت ريلز جاهز للتصوير (15 ثانية):" : "Generated 15s Script:"}</div>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-main)', marginBottom: '1rem' }}>
                    "{isRTL ? "قبل لا تشتري أرض بالرياض.. 3 أخطاء شائعة تكلفك آلاف الريالات! شاهد الفيديو للنهاية" : "3 real estate mistakes to avoid when buying a villa!"}"
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    #عقارات_الرياض #فلل_للبيع #استثمار_عقاري #ريلز
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Campaign Requests */}
          {activeDemoTab === 'campaigns' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2">
                <div>
                  <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>{isRTL ? "طلب حملة إعلانية ممولة مباشرة" : "Direct Sponsored Ad Campaigns"}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {isRTL ? "أرسل تفاصيل مشروعك العقاري وميزانيتك الإعلانية، وسيتولى فريقنا الخبير إطلاق إعلانات مستهدفة لك على سناب شات، ميت، وتيك توك واستلام العملاء مباشرة داخل الـ CRM." : "Submit ad brief and budget; our marketing team executes high-performing targeted ad campaigns."}
                  </p>

                  <ul style={{ paddingInlineStart: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>{isRTL ? "ربط تلقائي بالعملاء الجدد المستهدفين" : "Automatic lead routing to your CRM"}</li>
                    <li>{isRTL ? "استهداف جغرافي دقيق للمشترين والمستثمرين" : "Precise hyper-local buyer targeting"}</li>
                    <li>{isRTL ? "تقارير أداء ومعدل تكلفة العميل (CPL)" : "Transparent CPL performance tracking"}</li>
                  </ul>
                </div>

                <div className="card" style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.3)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{isRTL ? "حملة إعلانات فلل حطين" : "Hittin Villas Campaign"}</span>
                    <span className="badge badge-won">{isRTL ? "نشطة الآن" : "Active"}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>الميزانية: 3,000 ريال • المنصة: Snapchat & Meta</div>
                    <div>العملاء المحققون: 84 عميل محتمل جاد</div>
                    <div>متوسط تكلفة العميل: 35.7 ريال</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 4. Problem & Solution Comparison Section */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
            {isRTL ? "لماذا يحتاج كل وسيط عقاري إلى AdToDeal AI؟" : "Why Modern Real Estate Brokers Need AdToDeal AI"}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            {isRTL ? "فرق شاسع بين طريقة العمل التقليدية الضائعة، وبين النظام الذكي المؤتمت بالكامل." : "Compare traditional manual chaos with an organized AI automated engine."}
          </p>
        </div>

        <div className="grid-2" style={{ gap: '2.5rem' }}>
          {/* Traditional Way */}
          <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)', marginBottom: '1.5rem' }}>
              <ShieldAlert size={28} />
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{isRTL ? "الطريقة التقليدية (ضياع الصفقات)" : "Traditional Manual Sales"}</h3>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.1rem' }}>✕</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "نسيان متابعة 60% من العملاء الجدد بسبب التشتت بين نوتات الجوال والورق" : "Forgetting 60% of new lead follow-ups due to notes chaos"}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.1rem' }}>✕</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "إضاعة ساعات يومياً في كتابة وتنسيق كل رسالة واتساب يدوياً" : "Wasting hours typing every single WhatsApp message from scratch"}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.1rem' }}>✕</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "الارتباك وعدم معرفة الرد المناسب عند اعتراض العميل على السعر" : "Struggling to answer tough price objections effectively"}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.1rem' }}>✕</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "صعوبة إيجاد أفكار منشورات وفيديوهات ريلز متجددة بانتظام" : "Lack of consistent content & viral Reels video scripts"}</span>
              </li>
            </ul>
          </div>

          {/* AdToDeal AI Way */}
          <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={28} />
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{isRTL ? "مع نظام AdToDeal AI (منظومة كاملة)" : "With AdToDeal AI Platform"}</h3>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "تنبيهات وتذكيرات ذكية تلقائية تمنع ضياع أي صفقة محتملة" : "Automated smart reminders that ensure 100% follow-up rate"}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "توليد روابط رسائل الواتساب مجهزة مسبقاً باسم العميل بلمحة عين" : "Instant prefilled WhatsApp templates with customized metadata"}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "مساعد الذكاء الاصطناعي يجهز لك أفضل الحجج والردود الفورية 24/7" : "24/7 AI copilot generating instant bulletproof objection scripts"}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}>{isRTL ? "مولد محتوى ريلز وسوشيال ميديا متكامل يجذب آلاف المشترين المستهدفين" : "Automated social content generator creating viral scripts daily"}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Comprehensive Feature Grid (All 8 Core System Features) */}
      <section id="features" style={{ padding: '6rem 1.5rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="badge badge-contacted" style={{ marginBottom: '1rem', padding: '0.4rem 1rem' }}>
              {isRTL ? "منظومة متكاملة 8 في 1" : "8-in-1 Complete Solution"}
            </div>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
              {isRTL ? "كافة الأدوات التي تحتاجه لتصدر سوق العقارات" : "Everything You Need to Master Real Estate Sales"}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto' }}>
              {isRTL ? "تم تصميم كل ممتازة بعناية تامة لتلبية احتياجات المسوقين والشركات العقارية في السعودية والخليج ومصر." : "Built specifically for modern real estate professionals in Middle East markets."}
            </p>
          </div>

          <div className="grid-4" style={{ gap: '1.75rem' }}>
            
            {/* Feature 1 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <Users size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "1. نظام إدارة العملاء CRM" : "1. Smart Real Estate CRM"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "إضافة العملاء، متابعة الميزانيات، تسجيل الموافقة والتواصل، وتصنيف الصفقات حسب مراحل البيع بسهولة وسرعة فائقة." : "Track client status, budget ranges, consent logs, and lead scores across Kanban pipelines."}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366' }}>
                <MessageSquare size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "2. مولد الواتساب الفوري" : "2. Instant WhatsApp Link Builder"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "روابط واتساب مجهزة مسبقاً باسم العميل والعرض، تفتح في تطبيق الواتساب مباشرة بلمسة واحدة بدون كتابة." : "One-click pre-filled WhatsApp links embedding lead metadata into customizable templates."}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                <Bot size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "3. مساعد المبيعات الذكي 24/7" : "3. 24/7 AI Sales Copilot"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "حل اعتراضات العملاء الصعبة، صياغة عروض الأسعار المقنعة، ومطابقة متطلبات المشترين في ثوانٍ معدودة." : "Instant AI consultation for price objections, pitch drafting, and closing strategies."}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Video size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "4. صانع محتوى الريلز والسوشيال" : "4. Reels & Social Post Creator"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "توليد سكربتات فيديوهات تيك توك وانستغرام قصيرة، بوستات تسويقية، والهاشتاجات الأكثر انتشاراً بلمح البصر." : "Generate viral video scripts, Instagram captions, and hashtag bundles for properties."}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                <Megaphone size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "5. طلب إعلانات ممولة مباشرة" : "5. Direct Sponsored Ad Briefs"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "أرسل تفاصيل مشروعك وميزانيتك الإعلانية، وسيتولى فريقنا الاحترافي تشغيل إعلانات موجهة على مبيتا وسناب وشات." : "Submit advertising briefs; expert performance marketers launch targeted lead ads for you."}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <Calendar size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "6. جدولة المهام والمتابعة الذكية" : "6. Smart Tasks & Follow-up"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "تذكيرات يومية آليّة بمواعيد الاتصال والمعاينات العقارية تضمن عدم إغفال أي عميل مهتم." : "Never miss a deal with automated daily call schedules, viewing reminders, and status tags."}
              </p>
            </div>

            {/* Feature 7 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <BarChart3 size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "7. تقارير وأداء المبيعات" : "7. Analytics & Revenue Forecast"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "رسومات بيانية تفاعلية لقياس مصادر العملاء الأكثر ربحية، معدلات الإغلاق، وتصدير التقارير بضغطة زر." : "Real-time revenue metrics, lead conversion distribution, and downloadable PDF/CSV reports."}
              </p>
            </div>

            {/* Feature 8 */}
            <div className="card feature-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Globe size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{isRTL ? "8. تسعير متعدد العملات تلقائياً" : "8. Auto Geolocation Pricing"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {isRTL ? "تحديد بلد الزائر تلقائياً وعرض الباقات بالريال السعودي، الدرهم، الجنيه المصري، الدينار، أو الدولار." : "Automatic IP-based location detector adjusting subscription plans to local currencies seamlessly."}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Interactive ROI & Time Saved Calculator */}
      <section id="calculator" style={{ padding: '6rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="glass-panel glow-box" style={{ padding: '3rem 2rem', borderRadius: '1.5rem', border: '1px solid rgba(79,70,229,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge badge-won" style={{ marginBottom: '1rem', padding: '0.4rem 1rem' }}>
              {isRTL ? "حاسبة العائد الاستثماري التفاعلية" : "Interactive ROI Calculator"}
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {isRTL ? "كم ستوفر وتكسب باستخدام AdToDeal AI؟" : "How Much Will You Save & Earn?"}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              {isRTL ? "حرك المؤشرات أدناه لتري النتيجة الحية المتوقعة لنشاطك العقاري" : "Adjust sliders to estimate your weekly saved hours and potential extra income."}
            </p>
          </div>

          <div className="grid-2" style={{ gap: '3rem', alignItems: 'center' }}>
            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  <span>{isRTL ? "عدد العملاء المحتملين شهرياً:" : "Monthly New Leads:"}</span>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>{monthlyLeads} {isRTL ? "عميل" : "leads"}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="300" 
                  step="5" 
                  value={monthlyLeads} 
                  onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                  className="custom-range-slider"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  <span>{isRTL ? "متوسط قيمة عمولتك في الصفقة:" : "Avg Commission / Deal:"}</span>
                  <span style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{avgCommission.toLocaleString()} {symbol}</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="100000" 
                  step="2500" 
                  value={avgCommission} 
                  onChange={(e) => setAvgCommission(Number(e.target.value))}
                  className="custom-range-slider"
                />
              </div>
            </div>

            {/* Dynamic Results Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(6,182,212,0.15))', borderColor: 'var(--primary)', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>
                {isRTL ? "التوفير والنمو المتوقع سنوياً" : "Estimated Annual Growth"}
              </div>

              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.5rem 0' }}>
                +{estimatedExtraRevenue.toLocaleString()} <span style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>{symbol}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {isRTL ? `(بإغلاق حوالي ${extraClosedDeals} صفقات إضافية بفضل المتابعة الذكية)` : `(Closing ~${extraClosedDeals} additional deals per year)`}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{hoursSavedPerWeek} {isRTL ? "ساعة" : "hrs"}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "توفير أسبوعي" : "Saved / Week"}</div>
                </div>

                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>3X</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "سرعة إغلاق الصفقات" : "Faster Deal Closing"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Live Playground / Interactive AI Test */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            {isRTL ? "جرب الذكاء الاصطناعي الآن بنفسك ⚡" : "Try the Live AI Playground Now"}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            {isRTL ? "اختر أحد السيناريوهات وشاهد الرد الاحترافي المولد فوراً أمامك" : "Pick a scenario and test simulated generation in real-time."}
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {Object.keys(playgroundScenarios).map((key) => (
              <button 
                key={key}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.85rem',
                  borderColor: selectedPlaygroundPrompt === key ? 'var(--primary)' : 'var(--card-border)',
                  background: selectedPlaygroundPrompt === key ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)'
                }}
                onClick={() => handleRunPlayground(key)}
              >
                {isRTL ? playgroundScenarios[key].titleAr : playgroundScenarios[key].titleEn}
              </button>
            ))}
          </div>

          {/* Playground Box */}
          <div className="playground-box" style={{ background: 'var(--bg-darker)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>{isRTL ? "السؤال / التوجيه:" : "Prompt:"}</strong> {playgroundScenarios[selectedPlaygroundPrompt].promptAr}
            </div>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem', minHeight: '120px' }}>
              {isGeneratingPlayground ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                  <Sparkles size={18} className="float-item" />
                  <span>{isRTL ? "جاري التوليد بواسطة مساعد AdToDeal AI..." : "Generating intelligent response..."}</span>
                </div>
              ) : (
                <div className="playground-output" style={{ whiteSpace: 'pre-line', fontSize: '0.925rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
                  {playgroundOutput || playgroundScenarios[selectedPlaygroundPrompt].outputAr}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Pricing Section with Dynamic Country Geolocation Badge */}
      <section id="pricing" style={{ padding: '6rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{t('billingTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('billingSubtitle')}</p>
        </div>

        {/* Geolocation Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.875rem',
          color: 'var(--secondary)',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '999px',
          padding: '0.4rem 1.4rem',
          width: 'max-content',
          margin: '0 auto 3rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <Globe size={16} />
          <span>
            {isRTL ? "موقعك المكتشف حالياً: " : "Detected country: "} <strong>{detectedCountry}</strong> {isRTL ? "- أسعار بالعملة المحلية تلقائياً" : "- prices displayed in your currency"}
          </span>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid-3" style={{ gap: '2rem' }}>
          
          {/* Basic */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
            <div>
              <h3 style={{ color: 'var(--text-muted)', textAlign: 'start', marginTop: 0 }}>{t('planBasic')}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1.25rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem', color: 'var(--text-main)' }}>
                <span>{currencyInfo.prices.Basic}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{symbol}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('priceMonth')}</span>
              </div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', textAlign: 'start', color: 'var(--text-main)' }}>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {t('featuresCRM')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {t('featuresReminders')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "توليد بالذكاء الاصطناعي محدود (20 شهرياً)" : "Limited AI generation (20/mo)"}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "مولد روابط الواتساب الفورية" : "Instant WhatsApp Link Creator"}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%', padding: '0.85rem' }} onClick={() => setPage('register')}>
              {isRTL ? "ابدأ التجربة المجانية" : "Get Started"}
            </button>
          </div>

          {/* Pro (Highlighted) */}
          <div className="card glow-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem', borderColor: 'var(--primary)', background: 'linear-gradient(180deg, rgba(79,70,229,0.12), var(--card-bg))', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '-14px',
              insetInlineStart: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white',
              padding: '0.35rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
              whiteSpace: 'nowrap'
            }}>
              ⭐ {isRTL ? "الباقة الأكثر اختياراً للوسطاء" : "Most Popular Choice"}
            </div>

            <div>
              <h3 style={{ textAlign: 'start', marginTop: '0.5rem', fontSize: '1.4rem', color: 'var(--text-main)' }}>{t('planPro')}</h3>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, margin: '1.25rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem', color: 'var(--text-main)' }}>
                <span>{currencyInfo.prices.Pro}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{symbol}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('priceMonth')}</span>
              </div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', textAlign: 'start', color: 'var(--text-main)' }}>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {t('featuresCRM')}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {t('featuresReminders')}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "مساعد شخصي ذكي غير محدود 24/7" : "Unlimited personal 24/7 AI Sales Copilot"}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "صانع محتوى السوشيال ميديا وريلز الفيديو" : "Social media & Reels video content creator"}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "تخزين كامل للعملاء وتحليلات الأداء" : "Full client storage & analytics reports"}</li>
              </ul>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '2rem', width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 800 }} onClick={() => setPage('register')}>
              {isRTL ? "اشترك في باقة Pro الآن" : "Choose Pro Plan"}
            </button>
          </div>

          {/* Growth */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
            <div>
              <h3 style={{ color: 'var(--secondary)', textAlign: 'start', marginTop: 0 }}>{t('planGrowth')}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1.25rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem', color: 'var(--text-main)' }}>
                <span>{currencyInfo.prices.Growth}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{symbol}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('priceMonth')}</span>
              </div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', textAlign: 'start', color: 'var(--text-main)' }}>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "منظومة CRM كاملة للفرق والشركات" : "Full team CRM suite"}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "ذكاء اصطناعي فائق السرعة غير محدود" : "Unlimited high-priority AI engine"}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "إمكانية تقديم طلبات إعلانات ممولة" : "Sponsored ads management request feature"}</li>
                <li style={{ display: 'flex', gap: '0.6rem' }}><Check size={18} style={{ color: 'var(--success)' }} /> {isRTL ? "مدير حساب خاص ودعم أولوية بالواتساب" : "Dedicated account manager & priority WhatsApp support"}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%', padding: '0.85rem' }} onClick={() => setPage('register')}>
              {isRTL ? "اختر باقة النمو" : "Choose Growth"}
            </button>
          </div>

        </div>
      </section>

      {/* 9. FAQ Accordion Section */}
      <section id="faq" style={{ padding: '5rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {isRTL ? "الأسئلة الشائعة والمتكررة" : "Frequently Asked Questions"}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            {isRTL ? "إجابات شفافة ومباشرة على كل ما يدور في ذهنك حول النظام." : "Clear answers to all your system questions."}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              qAr: "هل أحتاج إلى أي خبرة تقنية لاستخدام النظام؟",
              qEn: "Do I need technical skills to use the platform?",
              aAr: "لا على الإطلاق! تم تصميم AdToDeal AI ليكون أسهل من استخدام تطبيق الواتساب، ويمكنك البدء في إضافة العملاء وإرسال الرسائل خلال أقل من دقيقتين.",
              aEn: "Not at all! Designed to be simpler than WhatsApp. Get started in under 2 minutes."
            },
            {
              qAr: "كيف يعمل مولد رسائل الواتساب الذكي؟",
              qEn: "How does the WhatsApp generator work?",
              aAr: "بمجرد تحديد اسم العميل ونوع العرض، يدمج النظام التفاصيل تلقائياً وينشئ رابطاً مخصصاً يفتح تطبيق الواتساب الرسمي على جوالك دون الحاجة لحفظ الرقم في جهات الاتصال.",
              aEn: "It formats lead name and metadata into pre-filled template links opening official WhatsApp without saving numbers."
            },
            {
              qAr: "هل يمكنني تجربة المنصة مجاناً قبل الاشتراك؟",
              qEn: "Can I try the platform for free before subscribing?",
              aAr: "نعم! نوفر تجربة مجانية تتيح لك تجربة إضافة العملاء وتوليد الرسائل والمساعد الذكي بدون الحاجة لبطاقة ائتمانية.",
              aEn: "Yes! Start your free trial with zero credit card required."
            },
            {
              qAr: "كيف يتم تحويل العملات تلقائياً؟",
              qEn: "How does auto currency detection work?",
              aAr: "يتعرف النظام تلقائياً على دولتك (مثل السعودية، الإمارات، مصر، الأردن) عبر عنوان IP، ويعرض الباقات بالعملة المحلية المناسبة، مع إمكانية التغيير اليدوي في أي وقت.",
              aEn: "Our geolocation engine auto-detects your country and sets local currency (SAR, AED, EGP, JOD, USD)."
            },
            {
              qAr: "ما هو دور خدمة طلب الإعلانات الممولة؟",
              qEn: "What is the Sponsored Campaigns feature?",
              aAr: "تتيح لك باقة النمو إرسال تفاصيل عروضك العقارية وميزانيتك الإعلانية، ليقوم خبراء التسويق لدينا بتشغيل إعلانات موجهة لك وجلب العملاء مباشرة لـ CRM الخاص بك.",
              aEn: "Growth plan users can submit campaign briefs; our specialists run targeted ads delivering leads into your CRM."
            }
          ].map((faq, idx) => (
            <div key={idx} className="faq-accordion-item">
              <button 
                className="faq-accordion-btn"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'start'
                }}
              >
                <span>{isRTL ? faq.qAr : faq.qEn}</span>
                {openFaqIndex === idx ? <ChevronUp size={20} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />}
              </button>

              {openFaqIndex === idx && (
                <div style={{ padding: '0 1.5rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                  {isRTL ? faq.aAr : faq.aEn}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10. Final Call to Action */}
      <section style={{ padding: '6rem 1.5rem', textAlign: 'center', position: 'relative' }}>
        <div className="glass-panel glow-box" style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '4rem 2rem',
          borderRadius: '2rem',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.25), rgba(6,182,212,0.25))',
          border: '1px solid var(--primary)'
        }}>
          <Sparkles size={40} style={{ color: 'var(--secondary)', marginBottom: '1rem' }} className="float-item" />
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>
            {isRTL ? "جاهز لمضاعفة مبيعاتك العقارية من اليوم؟" : "Ready to Supercharge Your Sales Today?"}
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '650px', marginInline: 'auto' }}>
            {isRTL ? "انضم إلى مئات الوسطاء العقاريين الذين يعتمدون على AdToDeal AI يومياً لإدارة العملاء وإغلاق الصفقات بسرعة." : "Join hundreds of top real estate agents closing deals 3X faster with AI."}
          </p>

          <button 
            className="btn btn-primary" 
            style={{ padding: '1.1rem 2.75rem', fontSize: '1.25rem', borderRadius: '0.85rem', fontWeight: 800, boxShadow: '0 8px 30px rgba(79, 70, 229, 0.5)' }}
            onClick={() => setPage('register')}
          >
            {isRTL ? "ابدأ التجربة المجانية الفورية 🚀" : "Start Free Trial Now 🚀"}
          </button>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="landing-footer" style={{
        borderTop: '1px solid var(--card-border)',
        padding: '3rem 1.5rem 2rem',
        background: 'rgba(7, 10, 19, 0.95)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ color: 'var(--secondary)' }} size={20} />
            <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>AdToDeal AI</strong>
            <span>— {isRTL ? "نظام إدارة المبيعات والعقارات بالذكاء الاصطناعي" : "AI Sales Platform"}</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{isRTL ? "المميزات" : "Features"}</button>
            <button onClick={() => scrollToSection('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{isRTL ? "الأسعار" : "Pricing"}</button>
            <button onClick={() => scrollToSection('faq')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{isRTL ? "الأسئلة الشائعة" : "FAQ"}</button>
          </div>

          <div>
            © {new Date().getFullYear()} AdToDeal AI. {isRTL ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </div>
        </div>
      </footer>

    </div>
  );
}
