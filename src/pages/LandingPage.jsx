import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, CheckCircle2, ShieldAlert, ArrowRight, 
  MessageSquare, Users, BarChart3, Megaphone, Check 
} from 'lucide-react';

export default function LandingPage({ setPage }) {
  const { t, isRTL } = useLanguage();
  const { user } = useApp();

  return (
    <div className="landing-page fade-in" style={{ background: 'var(--bg-darker)', minHeight: '100vh', color: 'white' }}>
      {/* Landing Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--secondary)' }} />
          <span>{t('appName')}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
              {t('navDashboard')} <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setPage('login')}>{t('navLogin')}</button>
              <button className="btn btn-primary" onClick={() => setPage('register')}>{t('navRegister')}</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '6rem 2rem 4rem',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          background: 'var(--primary-glow)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '2rem'
        }}>
          <Sparkles size={16} />
          {isRTL ? "تم إطلاقه حديثاً للوسطاء العقاريين" : "Newly Launched for Real Estate Agents"}
        </div>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #ffffff, #c7d2fe, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t('tagline')}
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-muted)',
          marginBottom: '2.5rem',
          maxWidth: '650px',
          marginInline: 'auto'
        }}>
          {t('taglineDesc')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => setPage('register')}>
            {isRTL ? "ابدأ تجربة مجانية الآن" : "Start Free Trial Now"}
          </button>
          <button className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => {
            const pricing = document.getElementById('pricing-sec');
            if (pricing) pricing.scrollIntoView({ behavior: 'smooth' });
          }}>
            {isRTL ? "عرض الأسعار" : "View Pricing"}
          </button>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section style={{
        padding: '5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem'
      }} className="grid-2">
        <div className="card" style={{ borderColor: 'var(--danger-glow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)', marginBottom: '1.5rem' }}>
            <ShieldAlert size={28} />
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isRTL ? "المشكلة الكبرى في المبيعات" : "The Sales Leak Problem"}</h3>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, listStyle: 'none' }}>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</span>
              <span>{isRTL ? "نسيان متابعة العملاء بعد الاتصال الأول" : "Forgetting to follow up after the first contact."}</span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</span>
              <span>{isRTL ? "إضاعة الساعات في كتابة رسائل الواتساب الفردية" : "Wasting hours drafting individual WhatsApp messages."}</span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</span>
              <span>{isRTL ? "صعوبة إنشاء أفكار محتوى لشبكات التواصل بانتظام" : "Struggling to create regular social media content."}</span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</span>
              <span>{isRTL ? "ضياع بيانات العملاء بين النوتات وتطبيقات الدردشة" : "Losing track of lead details between notes and chat apps."}</span>
            </li>
          </ul>
        </div>

        <div className="card" style={{ borderColor: 'var(--success-glow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={28} />
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isRTL ? "الحل مع سيلز ميت AI" : "The SalesMate AI Solution"}</h3>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, listStyle: 'none' }}>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              <span>{isRTL ? "تنبيهات وتذكيرات ذكية للمتابعة اليومية" : "Smart reminders & notifications for daily follow-ups."}</span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              <span>{isRTL ? "توليد رسائل واتساب مخصصة جاهزة للإرسال الفوري" : "Prefilled customized WhatsApp templates ready in one click."}</span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              <span>{isRTL ? "صناعة نصوص منشورات وفيديوهات قصيرة ممتازة بلمح البصر" : "Instant templates for high-quality social posts & Reels scripts."}</span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              <span>{isRTL ? "نظام إدارة متكامل يربط بين معلومات العميل وأدائه" : "Unified CRM that ties leads directly to campaign insights."}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Previews / Features Showcase */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>
            {isRTL ? "ألقِ نظرة داخل مساعدك الجديد" : "Take a Look Inside Your New Assistant"}
          </h2>
          
          <div className="grid-3">
            <div className="card">
              <Users style={{ color: 'var(--secondary)', marginBottom: '1rem' }} size={32} />
              <h4>{isRTL ? "CRM شخصي فائق السرعة" : "Personal Ultra-Fast CRM"}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isRTL ? "قم بإضافة العملاء وتصنيفهم ومتابعة ميزانياتهم وحالاتهم بسهولة عبر الجوال أو الحاسوب." : "Add leads, track their budgets, capture their consent, and advance them through pipeline stages."}
              </p>
            </div>
            <div className="card">
              <MessageSquare style={{ color: 'var(--primary)', marginBottom: '1rem' }} size={32} />
              <h4>{isRTL ? "مولد الرسائل الذكي" : "Prefilled WhatsApp Creator"}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isRTL ? "اختر قالب الرسالة، وسيقوم الذكاء الاصطناعي بدمج اسم العميل وتفاصيله وفتح الواتساب لإرسالها فوراً." : "Select template, the system formats it with lead metadata and launches custom pre-filled chat link."}
              </p>
            </div>
            <div className="card">
              <Megaphone style={{ color: 'var(--accent)', marginBottom: '1rem' }} size={32} />
              <h4>{isRTL ? "طلب حملات تسويقية بلمسة" : "Direct Ad Campaign Briefs"}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isRTL ? "أرسل تفاصيل وميزانية عرضك العقاري، وسيتولى فريقنا الاحترافي تشغيل إعلانات ممولة لك على الفور." : "Submit budget and offer briefs. Our marketing specialists launch and run customized high-converting ads for you."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-sec" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>{t('billingTitle')}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '4rem' }}>{t('billingSubtitle')}</p>

        <div className="grid-3">
          {/* Basic */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: 'var(--text-muted)' }}>{t('planBasic')}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
                {isRTL ? "99 ريال" : "$29"} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('priceMonth')}</span>
              </div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresCRM')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresReminders')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresAILimited')}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => setPage('register')}>{isRTL ? "ابدأ الآن" : "Get Started"}</button>
          </div>

          {/* Pro */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'var(--primary)' }}>
            <div>
              <div style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                alignSelf: 'flex-start',
                display: 'inline-block',
                marginBottom: '1rem'
              }}>
                {isRTL ? "الأكثر شعبية" : "Most Popular"}
              </div>
              <h3>{t('planPro')}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
                {isRTL ? "199 ريال" : "$59"} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('priceMonth')}</span>
              </div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresCRM')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresReminders')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresAIFull')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresSocial')}</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setPage('register')}>{isRTL ? "اشترك الآن" : "Choose Pro"}</button>
          </div>

          {/* Growth */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: 'var(--secondary)' }}>{t('planGrowth')}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
                {isRTL ? "399 ريال" : "$119"} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{t('priceMonth')}</span>
              </div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresCRM')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresAIFull')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresSocial')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresCampaigns')}</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--success)' }} /> {t('featuresSupport')}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => setPage('register')}>{isRTL ? "تواصل معنا" : "Choose Growth"}</button>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '4rem 2rem',
        borderTop: '1px solid var(--card-border)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <p>© 2026 SalesMate AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
