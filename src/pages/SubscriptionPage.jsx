import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import {
  Check, Sparkles, CreditCard, RefreshCw, Globe, ChevronDown, X, Info
} from 'lucide-react';
import { usePlanCatalog, CURRENCY_META } from '../lib/usePlanCatalog';

// Prices are no longer here. They were duplicated in UpgradePaywall, so the two
// could quote different numbers for the same plan. Both now read `plan_prices`
// through usePlanCatalog(); only display metadata stays client-side.
const CURRENCIES = Object.fromEntries(
  Object.entries(CURRENCY_META).map(([id, meta]) => [id, { id, ...meta }])
);

export default function SubscriptionPage() {
  const { t, isRTL } = useLanguage();
  const {
    plan,
    subscription,
    selectedCurrency, setSelectedCurrency,
    detectedCountry, setDetectedCountry,
    isDetecting
  } = useApp();

  // Was the string "30 days remaining", shown no matter how much time was left.
  // Computed in an effect rather than during render: reading the clock while
  // rendering makes the component impure.
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    const end = subscription?.current_period_end;
    setDaysRemaining(end
      ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000))
      : null);
  }, [subscription?.current_period_end]);

  const { priceFor, loading: pricesLoading, error: pricesError } = usePlanCatalog();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  // Checkout modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  // Deliberately no card fields and no simulated gateway. The previous
  // version collected real card numbers into React state, played a fake
  // 3D-Secure animation, then granted the plan client-side via setPlan() —
  // including from an unverified postMessage sent by a hand-written PayPal
  // popup. Plans are granted by the server once billing is wired up.

  // Pricing metadata
  const currencyInfo = CURRENCIES[selectedCurrency] || CURRENCIES.SAR;
  const symbol = isRTL ? currencyInfo.symbolAr : currencyInfo.symbolEn;

  const plans = [
    {
      id: 'Basic',
      name: t('planBasic'),
      price: priceFor('Basic', selectedCurrency),
      features: [
        t('featuresCRM'),
        t('featuresReminders'),
        t('featuresAIFull'),
        isRTL ? "متابعة وإدارة العملاء بالكامل" : "Full client follow-up & management"
      ]
    },
    {
      id: 'Pro',
      name: t('planPro'),
      price: priceFor('Pro', selectedCurrency),
      features: [
        t('featuresCRM'),
        t('featuresReminders'),
        t('featuresAIFull'),
        isRTL ? "صانع المحتوى (جدولة وتوليد منشورات أسبوعية)" : "Social Content Creator (Weekly post generation)"
      ],
      popular: true
    },
    {
      id: 'Growth',
      name: t('planGrowth'),
      price: priceFor('Growth', selectedCurrency),
      features: [
        isRTL ? "نظام إدارة علاقات العملاء CRM كامل" : "Full premium CRM suite",
        t('featuresAIFull'),
        isRTL ? "صانع المحتوى (جدولة وتوليد منشورات أسبوعية)" : "Social Content Creator (Weekly post generation)",
        isRTL ? "إرسال طلبات الحملات الإعلانية الممولة" : "Sponsored advertising campaign requests",
        t('featuresSupport')
      ]
    }
  ];

  return (
    <div className="fade-in">
      
      {/* Dynamic Geolocation Country Bar */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--card-border)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'start' }}>
          <Globe size={16} style={{ color: 'var(--secondary)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isRTL ? "تم الكشف التلقائي عن موقعك:" : "Automatically detected location:"}{' '}
            <strong style={{ color: '#fff' }}>{detectedCountry}</strong>
          </span>
          {isDetecting && (
            <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <RefreshCw size={10} className="spin-animation" />
              {isRTL ? "جاري التحديث..." : "Locating..."}
            </span>
          )}
        </div>

        {/* Currency Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderRadius: '0.5rem'
            }}
          >
            <span>{currencyInfo.flag}</span>
            <strong>{isRTL ? currencyInfo.nameAr : currencyInfo.nameEn} ({symbol})</strong>
            <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>

          {currencyDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: isRTL ? '0' : 'auto',
              left: isRTL ? 'auto' : '0',
              background: '#1e1b4b',
              border: '1px solid var(--card-border)',
              borderRadius: '0.5rem',
              zIndex: 10,
              minWidth: '180px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '0.25rem'
            }}>
              {Object.values(CURRENCIES).map(curr => (
                <button
                  key={curr.id}
                  onClick={() => {
                    setSelectedCurrency(curr.id);
                    setCurrencyDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: selectedCurrency === curr.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    textAlign: 'start',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    borderRadius: '0.35rem'
                  }}
                >
                  <span style={{ display: 'flex', gap: '0.35rem' }}>
                    <span>{curr.flag}</span>
                    <span>{isRTL ? curr.nameAr : curr.nameEn}</span>
                  </span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>
                    {isRTL ? curr.symbolAr : curr.symbolEn}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Free Trial Banner */}
      {plan === 'Trial' && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1.5px dashed rgba(59, 130, 246, 0.4)',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          textAlign: 'start',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.05)'
        }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              padding: '0.5rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                {isRTL ? "أنت حالياً تستخدم النسخة التجريبية المجانية" : "You are currently on the Free Trial"}
              </h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {isRTL 
                  ? "اشتراكك التجريبي صالح لمدة 30 يوماً. يمكنك الترقية إلى أي باقة مدفوعة أدناه للاستفادة الكاملة وبدون انقطاع."
                  : "Your trial subscription is valid for 30 days. You can upgrade to any paid tier below to get full, uninterrupted access."}
              </p>
            </div>
          </div>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            {daysRemaining === null
              ? (isRTL ? 'نشطة' : 'Active')
              : (isRTL ? `متبقي ${daysRemaining} يوماً` : `${daysRemaining} days remaining`)}
          </div>
        </div>
      )}

      {/* Pricing Header Title */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800 }}>
          {isRTL ? "أسعار بسيطة وشفافة للجميع" : t('billingTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
          {isRTL ? "اختر الخطة المناسبة لحجم عملاءك وأهدافك التسويقية" : t('billingSubtitle')}
        </p>
      </div>

      {pricesError && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto 1.5rem',
          background: 'var(--danger-glow)',
          color: 'var(--danger)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          textAlign: 'start'
        }}>
          {isRTL
            ? 'تعذّر تحميل قائمة الأسعار من الخادم، لذلك تظهر الأسعار كـ«—». حدّث الصفحة.'
            : 'Could not load the price list from the server, so prices show as “—”. Please refresh.'}
        </div>
      )}

      {/* Plan Card Grid */}
      <div className="grid-3" style={{ maxWidth: '1000px', margin: '0 auto', gap: '1.5rem' }}>
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
                position: 'relative',
                transition: 'all 0.3s'
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
                  gap: '0.25rem',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)'
                }}>
                  <Sparkles size={12} /> {isRTL ? "الأكثر شعبية" : "Most Popular"}
                </div>
              )}

              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, textAlign: 'start' }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1.5rem 0', justifyContent: 'flex-start' }}>
                  {/* Prices come from the server; never invent one locally as a
                      fallback, or the page can quote a figure billing will not
                      honour. */}
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {p.price === null ? (pricesLoading ? '…' : '—') : p.price.toLocaleString('en-US')}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)', marginInlineStart: '0.25rem' }}>{symbol}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginInlineStart: '0.25rem' }}>/{t('priceMonth')}</span>
                </div>

                <div style={{ height: '1px', background: 'var(--card-border)', marginBottom: '1.5rem' }} />

                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'start' }}>
                  {p.features.map((feature, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      <Check size={14} style={{ color: 'var(--success)', minWidth: '14px' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                {isCurrent ? (
                  <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default', opacity: 0.8 }} disabled>
                    {t('currentPlan')}
                  </button>
                ) : (
                  <button 
                    className={`btn ${p.popular || p.id === 'Growth' ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ width: '100%', fontWeight: 'bold' }}
                    onClick={() => {
                      setCheckoutPlan(p);
                      setShowCheckoutModal(true);
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

      {/* ======================================================== */}
      {/* CHECKOUT — no gateway is connected yet                   */}
      {/* ======================================================== */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.25s'
        }}>
          <div className="card" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowCheckoutModal(false)}
              aria-label={isRTL ? 'إغلاق' : 'Close'}
              style={{
                position: 'absolute',
                top: '1rem',
                insetInlineEnd: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              display: 'inline-flex',
              padding: '0.9rem',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              marginBottom: '1rem'
            }}>
              <CreditCard size={30} style={{ color: 'var(--secondary)' }} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
              {isRTL ? 'الدفع الإلكتروني قيد التفعيل' : 'Online payment is being activated'}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              {isRTL
                ? 'لم يتم ربط بوابة الدفع بعد. لتفعيل هذه الباقة على حسابك، تواصل مع إدارة المنصة وسيتم تفعيلها يدوياً.'
                : 'The payment gateway is not connected yet. To activate this plan on your account, contact the platform administrators and it will be enabled manually.'}
            </p>

            {checkoutPlan && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {isRTL ? 'الباقة المطلوبة' : 'Selected plan'}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {checkoutPlan.name} — {checkoutPlan.price} {symbol}
                </span>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              textAlign: 'start',
              marginBottom: '1.25rem'
            }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <span>
                {isRTL
                  ? 'لن نطلب بيانات بطاقتك داخل هذه الصفحة. عند تفعيل الدفع ستُحوَّل إلى صفحة بوابة الدفع المعتمدة.'
                  : 'We will never ask for card details on this page. Once billing is live you will be redirected to the payment provider.'}
              </span>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontWeight: 'bold' }}
              onClick={() => setShowCheckoutModal(false)}
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
