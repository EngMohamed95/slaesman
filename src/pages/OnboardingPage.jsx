import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Sparkles, Building, Target, HeartHandshake, Check } from 'lucide-react';

export default function OnboardingPage({ setPage }) {
  const { t, isRTL } = useLanguage();
  const { setOnboarded } = useApp();
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('residential'); // residential, commercial, investment
  const [audience, setAudience] = useState('first-time'); // first-time, luxury, investors
  const [tone, setTone] = useState('professional'); // professional, friendly, persuasive

  const handleFinish = () => {
    setOnboarded(true);
    setPage('dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-darker)'
    }} className="fade-in">
      <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--card-border)',
            zIndex: 1,
            transform: 'translateY(-50%)'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
            height: '2px',
            background: 'var(--primary)',
            zIndex: 2,
            transform: 'translateY(-50%)',
            transition: 'width 0.3s ease'
          }} />
          
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: step >= s ? 'var(--primary)' : 'var(--bg-darker)',
                border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--card-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                fontWeight: 'bold',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{t('onboardingTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('onboardingSubtitle')}</p>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} style={{ color: 'var(--secondary)' }} />
              {t('step1')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              {isRTL ? "اختر القطاع العقاري الرئيسي الذي تركز عليه حالياً:" : "Select your primary focus domain in real estate:"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'residential', title: isRTL ? 'عقارات سكنية' : 'Residential Properties', desc: isRTL ? 'شقق، فلل، تاون هاوس للعائلات' : 'Apartments, villas, and townhouses for individuals and families.' },
                { id: 'commercial', title: isRTL ? 'عقارات تجارية' : 'Commercial Properties', desc: isRTL ? 'مكاتب، محلات تجارية، مستودعات' : 'Offices, showrooms, warehouses, and corporate spaces.' },
                { id: 'investment', title: isRTL ? 'مشاريع استثمارية' : 'Investment Properties', desc: isRTL ? 'عقارات قيد الإنشاء، عوائد إيجار مرتفعة' : 'Off-plan developments, high-yield opportunities, and lands.' }
              ].map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setDomain(opt.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${domain === opt.id ? 'var(--primary)' : 'var(--card-border)'}`,
                    background: domain === opt.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.25rem', color: domain === opt.id ? 'white' : 'inherit' }}>{opt.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} style={{ color: 'var(--secondary)' }} />
              {t('step2')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              {isRTL ? "من هو جمهورك الإعلاني والبيعي المستهدف؟" : "Who is your primary target buyer or lead profile?"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'first-time', title: isRTL ? 'مشتري المسكن الأول' : 'First-time Home Buyers', desc: isRTL ? 'يبحثون عن تسهيلات سكنية وحلول تمويلية' : 'Looking for affordable entry-level homes and long term payment plans.' },
                { id: 'luxury', title: isRTL ? 'مشتري العقارات الفاخرة' : 'Luxury Seekers', desc: isRTL ? 'يبحثون عن الجودة العالية، الخصوصية والمواقع المميزة' : 'High-income individuals looking for premium locations, design and privacy.' },
                { id: 'investors', title: isRTL ? 'المستثمرون العقاريون' : 'Real Estate Investors', desc: isRTL ? 'يركزون على العائد الاستثماري ونسب زيادة رأس المال' : 'Focused strictly on rental yields, ROI, and capital appreciation rates.' }
              ].map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setAudience(opt.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${audience === opt.id ? 'var(--primary)' : 'var(--card-border)'}`,
                    background: audience === opt.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.25rem', color: audience === opt.id ? 'white' : 'inherit' }}>{opt.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={20} style={{ color: 'var(--secondary)' }} />
              {t('step3')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              {isRTL ? "اختر نبرة الصوت وشخصية مساعد المبيعات الذكي الخاص بك:" : "Choose the tone and voice style for your AI assistant:"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'professional', title: isRTL ? 'رسمي واحترافي' : 'Professional & Advisory', desc: isRTL ? 'نبرة مبنية على الأرقام، البيانات، والتحليل العقاري الموثوق' : 'Data-backed, facts, and advisory approach to build trust.' },
                { id: 'friendly', title: isRTL ? 'ودي ومرحب' : 'Friendly & Supportive', desc: isRTL ? 'نبرة ودية سهلة الفهم تبني علاقة سريعة وقوية مع العميل' : 'Approachable, warm, and highly focused on solving client struggles.' },
                { id: 'persuasive', title: isRTL ? 'مقنع ومحفز للصفقات' : 'Persuasive & Sales-driven', desc: isRTL ? 'يركز على ندرة العروض، الفرص الاستثمارية الحالية وخلق الحماس' : 'Urgency-focused, highlighting best deals, and driving action.' }
              ].map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setTone(opt.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${tone === opt.id ? 'var(--primary)' : 'var(--card-border)'}`,
                    background: tone === opt.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.25rem', color: tone === opt.id ? 'white' : 'inherit' }}>{opt.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              {t('prevStep')}
            </button>
          ) : <div />}

          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {t('nextStep')}
            </button>
          ) : (
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)', boxShadow: 'none' }} onClick={handleFinish}>
              {t('finishSetup')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
