import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Lock, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { usePlanCatalog, CURRENCY_META } from '../lib/usePlanCatalog';

export default function UpgradePaywall({ requiredPlan, featureNameAr, featureNameEn }) {
  const { isRTL } = useLanguage();
  const { selectedCurrency } = useApp();
  const { priceFor, loading: pricesLoading } = usePlanCatalog();

  // Upgrading happens on the subscriptions page. This component must never
  // grant a plan itself — the previous version called setPlan() straight from
  // an unverified window postMessage, which was a free-upgrade exploit.
  const goToSubscriptions = () => {
    window.location.hash = '/subscriptions';
  };

  /**
   * The price comes from `plan_prices`, the same row the subscriptions page
   * reads. This used to be a hardcoded if/else per currency that also assumed
   * "anything not Growth costs the Pro price" — so a Basic paywall quoted Pro
   * money, and any price change had to be made in two files or they diverged.
   */
  const getUpgradePrice = () => {
    const amount = priceFor(requiredPlan, selectedCurrency);
    if (amount === null) return pricesLoading ? '…' : '—';
    const meta = CURRENCY_META[selectedCurrency] || CURRENCY_META.SAR;
    const symbol = isRTL ? meta.symbolAr : meta.symbolEn;
    const perMonth = isRTL ? 'شهرياً' : 'month';
    return `${amount.toLocaleString('en-US')} ${symbol} / ${perMonth}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem 1rem'
    }} className="fade-in">
      <div className="card" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'rgba(17, 24, 39, 0.9)',
        border: '2px solid rgba(245, 158, 11, 0.25)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Background Gradients */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-20%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          
          {/* Lock Icon */}
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '50%',
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
            marginBottom: '1.5rem',
            animation: 'pulse 2s infinite'
          }}>
            <Lock size={36} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--text-main)' }}>
            {isRTL ? "ميزة مقفلة في باقتك الحالية" : "Feature Locked on Current Plan"}
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 2rem' }}>
            {isRTL 
              ? `لاستخدام ميزة "${featureNameAr || 'الخدمات الذكية'}"، يرجى ترقية اشتراكك إلى باقة ${requiredPlan === 'Growth' ? 'النمو والريادة (Growth)' : 'الاحترافية (Pro)'}.`
              : `To unlock and access the "${featureNameEn || 'Smart Feature'}" module, please upgrade your subscription to the ${requiredPlan} Plan.`
            }
          </p>

          {/* Pricing Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--card-border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'start'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>
                  {isRTL ? "الترقية المطلوبة:" : "REQUIRED TIER:"}
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={16} />
                  {requiredPlan === 'Growth' ? (isRTL ? "خطة النمو والريادة" : "Growth Plan") : (isRTL ? "الخطة الاحترافية" : "Pro Plan")}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{getUpgradePrice()}</span>
              </div>
            </div>
          </div>

          {/* Upgrade action — routes to the subscriptions page */}
          <button
            onClick={goToSubscriptions}
            className="btn btn-primary upgrade-cta"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '1rem',
              borderRadius: '2rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}
          >
            <span>{isRTL ? "عرض الباقات والترقية" : "View Plans & Upgrade"}</span>
            <ArrowUpRight size={18} />
          </button>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <AlertCircle size={12} />
            <span>{isRTL ? "الترقية تتم من صفحة الاشتراكات" : "Upgrades are completed on the subscriptions page."}</span>
          </div>

        </div>

        <style>{`
          .upgrade-cta:hover {
            transform: translateY(-1px);
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          }
        `}</style>
      </div>
    </div>
  );
}
