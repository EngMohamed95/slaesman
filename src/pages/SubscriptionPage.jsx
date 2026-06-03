import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Check, Sparkles } from 'lucide-react';

export default function SubscriptionPage() {
  const { t, isRTL } = useLanguage();
  const { plan, setPlan } = useApp();

  const plans = [
    {
      id: 'Basic',
      name: t('planBasic'),
      price: isRTL ? '99 ريال' : '$29',
      features: [
        t('featuresCRM'),
        t('featuresReminders'),
        t('featuresAILimited')
      ]
    },
    {
      id: 'Pro',
      name: t('planPro'),
      price: isRTL ? '199 ريال' : '$59',
      features: [
        t('featuresCRM'),
        t('featuresReminders'),
        t('featuresAIFull'),
        t('featuresSocial')
      ],
      popular: true
    },
    {
      id: 'Growth',
      name: t('planGrowth'),
      price: isRTL ? '399 ريال' : '$119',
      features: [
        t('featuresCRM'),
        t('featuresAIFull'),
        t('featuresSocial'),
        t('featuresCampaigns'),
        t('featuresSupport')
      ]
    }
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('billingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>{t('billingSubtitle')}</p>
      </div>

      <div className="grid-3" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {plans.map((p) => {
          const isCurrent = plan === p.id;
          return (
            <div 
              key={p.id} 
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isCurrent ? 'var(--primary)' : p.popular ? 'rgba(79, 70, 229, 0.4)' : 'var(--card-border)',
                background: isCurrent ? 'rgba(79, 70, 229, 0.05)' : 'var(--card-bg)',
                transform: p.popular ? 'scale(1.02)' : 'none',
                position: 'relative'
              }}
            >
              {p.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  insetInlineStart: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Sparkles size={12} /> {isRTL ? "الأكثر شعبية" : "Most Popular"}
                </div>
              )}

              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1.5rem 0' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>{p.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('priceMonth')}</span>
                </div>

                <div style={{ height: '1px', background: 'var(--card-border)', marginBottom: '1.5rem' }} />

                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {p.features.map((feature, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <Check size={16} style={{ color: 'var(--success)' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                {isCurrent ? (
                  <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default' }} disabled>
                    {t('currentPlan')}
                  </button>
                ) : (
                  <button 
                    className={`btn ${p.popular || p.id === 'Growth' ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ width: '100%' }}
                    onClick={() => {
                      setPlan(p.id);
                      alert(isRTL ? `تم تغيير خطتك الاشتراكية بنجاح إلى ${p.name}!` : `Subscription upgraded successfully to ${p.name}!`);
                    }}
                  >
                    {t('upgrade')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
