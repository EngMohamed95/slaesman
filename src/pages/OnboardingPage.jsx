import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Sparkles, Building2, Target, HeartHandshake, Check, Briefcase } from 'lucide-react';

export default function OnboardingPage({ setPage }) {
  const { t, isRTL } = useLanguage();
  const { setOnboarded } = useApp();
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('b2b'); // b2b, retail, services, general
  const [audience, setAudience] = useState('business'); // business, consumers, high-net-worth
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
              <Briefcase size={20} style={{ color: 'var(--secondary)' }} />
              {t('step1')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              {isRTL ? "اختر المجال التجاري والمبيعات الرئيسي لعملك:" : "Select your primary sales domain & industry:"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'b2b', title: isRTL ? 'خدمات واستشارات الشركات (B2B)' : 'Corporate Services & SaaS (B2B)', desc: isRTL ? 'أنظمة، استشارات قانونية ومالية، تسويق، وتوريدات' : 'Enterprise software, consulting, legal, and corporate deals.' },
                { id: 'retail', title: isRTL ? 'منتجات وتجارة إلكترونية' : 'Products & E-Commerce', desc: isRTL ? 'بيع المنتجات، البضائع بالجملة والتجزئة' : 'Physical products, wholesale goods, and online retail.' },
                { id: 'services', title: isRTL ? 'خدمات مباشرة وعقارات' : 'Direct Sales & Real Estate', desc: isRTL ? 'عقارات، سيارات، استشارات مباشرة، وتدريب' : 'High-ticket deals, automotive, real estate, and direct sales.' },
                { id: 'general', title: isRTL ? 'المبيعات العامة والشاملة' : 'General Sales & Growth', desc: isRTL ? 'أي نشاط تجاري يهدف لمتابعة العملاء وزيادة المبيعات' : 'Any sales activity focused on client follow-up and deal closing.' }
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
              {isRTL ? "من هو جمهورك المستهدف في المبيعات؟" : "Who is your primary target buyer or client profile?"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'business', title: isRTL ? 'أصحاب الشركات والمؤسسات' : 'Business Owners & Executives', desc: isRTL ? 'يبحثون عن زيادة الكفاءة، تقليل التكاليف وتطوير العمل' : 'Looking for operational ROI, efficiency, and revenue growth.' },
                { id: 'consumers', title: isRTL ? 'المستهلكون والأفراد' : 'Direct End Consumers', desc: isRTL ? 'يبحثون عن عروض ممتازة وسهولة في التواصل والشراء' : 'Looking for great deals, quick response, and clear pricing.' },
                { id: 'high-net-worth', title: isRTL ? 'المستثمرون وكبار العملاء' : 'Investors & High Net-Worth Clients', desc: isRTL ? 'يركزون على جودة الخدمة والعوائد العالية والأمان' : 'Focused on high returns, top-tier service, and strategic value.' }
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
              {isRTL ? "اختر نبرة الصوت وشخصية مساعد المبيعات الذكي الخاص بك:" : "Choose the personality & tone for your AI sales assistant:"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'professional', title: isRTL ? 'احترافي ومباشر' : 'Professional & Direct', desc: isRTL ? 'يعتمد على الأرقام، الميزات، والحجج القوية' : 'Focuses on facts, numbers, structured arguments, and clarity.' },
                { id: 'friendly', title: isRTL ? 'ودود وقريب للعميل' : 'Friendly & Consultative', desc: isRTL ? 'يبني الألفة ويسأل أسئلة ذكية لفهم احتياجات العميل' : 'Builds rapport, asks engaging questions, and listens to client needs.' },
                { id: 'persuasive', title: isRTL ? 'مُقنع وحماسي للإغلاق' : 'High-Energy & Persuasive', desc: isRTL ? 'يركز على خلق الاستعجال، العروض الحصرية وإغلاق الصفقات' : 'Creates urgency, highlights limited offers, and drives deal closing.' }
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

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              {t('prevStep')}
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {t('nextStep')}
            </button>
          ) : (
            <button className="btn btn-primary glow-box" onClick={handleFinish}>
              <Sparkles size={16} />
              {t('finishSetup')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
