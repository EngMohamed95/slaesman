import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { 
  Check, Sparkles, CreditCard, ShieldCheck, Lock, 
  RefreshCw, Globe, ChevronDown, CheckCircle2, X, Info
} from 'lucide-react';

const CURRENCIES = {
  SAR: { 
    id: 'SAR',
    symbolAr: 'ريال', 
    symbolEn: 'SAR', 
    flag: '🇸🇦', 
    nameAr: 'ريال سعودي', 
    nameEn: 'Saudi Riyal', 
    prices: { Basic: 99, Pro: 199, Growth: 399 } 
  },
  USD: { 
    id: 'USD',
    symbolAr: '$', 
    symbolEn: '$', 
    flag: '🇺🇸', 
    nameAr: 'دولار أمريكي', 
    nameEn: 'US Dollar', 
    prices: { Basic: 27, Pro: 53, Growth: 107 } 
  },
  AED: { 
    id: 'AED',
    symbolAr: 'درهم', 
    symbolEn: 'AED', 
    flag: '🇦🇪', 
    nameAr: 'درهم إماراتي', 
    nameEn: 'UAE Dirham', 
    prices: { Basic: 97, Pro: 195, Growth: 390 } 
  },
  EGP: { 
    id: 'EGP',
    symbolAr: 'جنيه', 
    symbolEn: 'EGP', 
    flag: '🇪🇬', 
    nameAr: 'جنيه مصري', 
    nameEn: 'Egyptian Pound', 
    prices: { Basic: 1290, Pro: 2590, Growth: 5190 } 
  },
  JOD: { 
    id: 'JOD',
    symbolAr: 'دينار', 
    symbolEn: 'JOD', 
    flag: '🇯🇴', 
    nameAr: 'دينار أردني', 
    nameEn: 'Jordanian Dinar', 
    prices: { Basic: 19, Pro: 38, Growth: 76 } 
  }
};

export default function SubscriptionPage() {
  const { t, isRTL } = useLanguage();
  const { 
    plan, setPlan, 
    selectedCurrency, setSelectedCurrency, 
    detectedCountry, setDetectedCountry, 
    isDetecting 
  } = useApp();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  // Checkout modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  
  // Checkout form inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, apple, mada, paypal
  const [focusedField, setFocusedField] = useState(''); // 'cvv' will trigger card flip

  // Payment process states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [processStep, setProcessStep] = useState(0);

  // Express action mock triggers
  const [appleProcessing, setAppleProcessing] = useState(false);


  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (value.length <= 5) {
      setCardExpiry(value);
    }
  };

  // Format CVV (max 3 digits)
  const handleCVVChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardCVV(value);
    }
  };

  // Auto detect Card Branding Logo
  const getCardType = (number) => {
    const cleanNum = number.replace(/\s/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (cleanNum.startsWith('5')) return 'Mastercard';
    if (cleanNum.startsWith('9') || cleanNum.startsWith('6')) return 'Mada';
    return 'CreditCard';
  };

  // Trigger Mock Payment processing
  const handlePaySubmit = (e) => {
    e?.preventDefault();
    if (paymentMethod === 'card' || paymentMethod === 'mada') {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCVV) {
        alert(isRTL ? 'الرجاء تعبئة كافة تفاصيل البطاقة المصرفية' : 'Please fill all credit card fields');
        return;
      }
    }

    setPaymentProcessing(true);
    setProcessStep(0);

    const steps = [
      isRTL ? "جاري تشفير تفاصيل الدفع..." : "Encrypting checkout payload...",
      isRTL ? "جاري الاتصال بالبنك المصدر للبطاقة..." : "Contacting issuing gateway server...",
      isRTL ? "التحقق من الرصيد والتحقق الثنائي..." : "Authorizing 3D-Secure tokens...",
      isRTL ? "جاري معالجة وتوثيق العملية الفنية..." : "Finalizing subscription transaction..."
    ];

    // Cycle through banking loader steps
    const interval = setInterval(() => {
      setProcessStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          // Complete payment
          setTimeout(() => {
            setPaymentProcessing(false);
            setPaymentSuccess(true);
            setTransactionId('TXN-' + Math.floor(10000000 + Math.random() * 90000000));
            setPlan(checkoutPlan.id);
          }, 600);
          return prev;
        }
      });
    }, 850);
  };

  // Mock Express checkout for Apple Pay / PayPal
  const handleExpressPay = (method) => {
    setAppleProcessing(true);
    setTimeout(() => {
      setAppleProcessing(false);
      setPaymentSuccess(true);
      setTransactionId('TXN-EXP-' + Math.floor(10000000 + Math.random() * 90000000));
      setPlan(checkoutPlan.id);
    }, 2000);
  };

  // Pricing metadata
  const currencyInfo = CURRENCIES[selectedCurrency] || CURRENCIES.SAR;
  const symbol = isRTL ? currencyInfo.symbolAr : currencyInfo.symbolEn;

  const plans = [
    {
      id: 'Basic',
      name: t('planBasic'),
      price: currencyInfo.prices.Basic,
      features: [
        t('featuresCRM'),
        t('featuresReminders'),
        isRTL ? "توليد ذكاء اصطناعي محدود (20 شهرياً)" : "Limited AI generation (20/mo)"
      ]
    },
    {
      id: 'Pro',
      name: t('planPro'),
      price: currencyInfo.prices.Pro,
      features: [
        t('featuresCRM'),
        t('featuresReminders'),
        isRTL ? "مساعد شخصي ذكي غير محدود 24/7" : "Unlimited personal AI assistant 24/7",
        isRTL ? "جدولة وصناعة محتوى تواصل اجتماعي أسبوعي" : "Weekly social content generation & schedules"
      ],
      popular: true
    },
    {
      id: 'Growth',
      name: t('planGrowth'),
      price: currencyInfo.prices.Growth,
      features: [
        isRTL ? "نظام إدارة علاقات العملاء CRM كامل" : "Full premium CRM suite",
        isRTL ? "مساعد شخصي ذكي غير محدود 24/7" : "Unlimited personal AI assistant 24/7",
        isRTL ? "جدولة وصناعة محتوى تواصل اجتماعي أسبوعي" : "Weekly social content generation & schedules",
        isRTL ? "إمكانية إرسال طلبات الحملات الإعلانية" : "Sponsored advertising request capabilities",
        isRTL ? "دعم فني ذو أولوية عبر الواتساب" : "Priority WhatsApp customer support"
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

      {/* Pricing Header Title */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800 }}>
          {isRTL ? "أسعار بسيطة وشفافة للجميع" : t('billingTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
          {isRTL ? "اختر الخطة المناسبة لحجم عملاءك وأهدافك التسويقية" : t('billingSubtitle')}
        </p>
      </div>

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
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{p.price}</span>
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
                      setCardNumber('');
                      setCardHolder('');
                      setCardExpiry('');
                      setCardCVV('');
                      setPaymentSuccess(false);
                      setPaymentMethod('card');
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
      {/* GLASSMORPHIC INTERACTIVE CHECKOUT MODAL GATEWAY */}
      {/* ======================================================== */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.25s'
        }}>
          
          {/* Modal Container Card */}
          <div className="card" style={{
            width: '100%',
            maxWidth: '720px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            overflow: 'hidden'
          }}>
            
            {/* Close Button */}
            <button 
              onClick={() => {
                if (!paymentProcessing) {
                  setShowCheckoutModal(false);
                }
              }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: isRTL ? 'auto' : '1.25rem',
                left: isRTL ? '1.25rem' : 'auto',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
              disabled={paymentProcessing}
            >
              <X size={16} />
            </button>

            {/* PROCESSING OVERLAY SCREEN */}
            {paymentProcessing && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.95)',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                padding: '2rem'
              }}>
                <div className="loader-spinner" style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(255,255,255,0.05)',
                  borderTopColor: 'var(--secondary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)' }}>
                  <Lock size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    SECURE 3D-GATEWAY AUTHORIZATION
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                    {isRTL ? "جاري معالجة الدفع الآمن..." : "Processing secure payment..."}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {
                      [
                        isRTL ? "جاري تشفير تفاصيل الدفع..." : "Encrypting checkout payload...",
                        isRTL ? "جاري الاتصال بالبنك المصدر للبطاقة..." : "Contacting issuing gateway server...",
                        isRTL ? "التحقق من الرصيد والتحقق الثنائي..." : "Authorizing 3D-Secure tokens...",
                        isRTL ? "جاري معالجة وتوثيق العملية الفنية..." : "Finalizing subscription transaction..."
                      ][processStep]
                    }
                  </p>
                </div>
              </div>
            )}

            {/* EXPRESS APPLE/GOOGLE CHECKOUT LOADER SCREEN */}
            {appleProcessing && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.95)',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
                padding: '2rem'
              }}>
                <Smartphone size={40} style={{ color: paymentMethod === 'apple' ? '#fff' : '#4285f4', animation: 'bounce 1.5s infinite' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                    {paymentMethod === 'apple' 
                      ? (isRTL ? "تأكيد الدفع عبر Apple Pay..." : "Confirming Apple Pay...")
                      : (isRTL ? "تأكيد الدفع عبر PayPal..." : "Confirming PayPal Express...")
                    }
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isRTL ? "برجاء تأكيد الهوية بالبصمة أو الرقم السري بجهازك..." : "Please confirm transaction on your client device..."}
                  </p>
                </div>
              </div>
            )}

            {/* PAYMENT SUCCESS RECEIPT SCREEN */}
            {paymentSuccess && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.5rem',
                textAlign: 'center',
                animation: 'slideUp 0.3s'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--success-glow)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <CheckCircle2 size={36} />
                </div>

                <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.35rem', fontWeight: 800 }}>
                  {isRTL ? "تم الدفع وتفعيل الاشتراك بنجاح!" : "Payment Successfully Processed!"}
                </h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {isRTL 
                    ? `مرحباً بك في الخطة الجديدة! تم تغيير باقتك إلى ${checkoutPlan.name}.` 
                    : `Congratulations! Your workspace has been updated to ${checkoutPlan.name}.`}
                </p>

                {/* Styled Ticket Receipt */}
                <div style={{
                  width: '100%',
                  maxWidth: '360px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  textAlign: 'start',
                  fontSize: '0.8rem',
                  lineHeight: 1.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRTL ? 'رقم المعاملة (Txn ID):' : 'Transaction ID:'}</span>
                    <strong style={{ color: '#fff' }}>{transactionId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRTL ? 'الخطة المفعلة:' : 'Subscribed Plan:'}</span>
                    <strong style={{ color: 'var(--secondary)' }}>{checkoutPlan.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRTL ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                    <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{paymentMethod}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRTL ? 'المبلغ المدفوع الكلي:' : 'Total Charged:'}</span>
                    <strong style={{ color: 'var(--success)', fontSize: '0.95rem' }}>{checkoutPlan.price} {symbol}</strong>
                  </div>
                </div>

                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', maxWidth: '240px', fontWeight: 'bold' }}
                >
                  {isRTL ? "بدء استخدام الباقة الجديدة" : "Start Using New Plan"}
                </button>
              </div>
            )}

            {/* NORMAL CHECKOUT FORM AND VISUAL CARD CONTAINER */}
            {!paymentSuccess && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-responsive">
                
                {/* Visual Order Summary & Method Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'start' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {isRTL ? "موجز الفاتورة" : "Order Invoice"}
                    </span>
                    <h3 style={{ margin: '0.25rem 0', color: '#fff', fontSize: '1.25rem', fontWeight: 800 }}>
                      {checkoutPlan?.name} {isRTL ? "السنوية" : "Billing Details"}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {isRTL ? "رسوم الخدمة وتنشيط الذكاء الاصطناعي" : "SaaS service access credentials activation"}
                    </p>
                  </div>

                  {/* Pricing Total Details */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isRTL ? "الاشتراك الشهري:" : "Monthly rate:"}</span>
                      <span>{checkoutPlan?.price} {symbol}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isRTL ? "ضرائب ورسوم الدفع:" : "Taxes & transaction fees:"}</span>
                      <span style={{ color: 'var(--success)' }}>{isRTL ? "مجاني" : "0.00"}</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.75rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <span style={{ color: '#fff' }}>{isRTL ? "المجموع الكلي:" : "Total Amount:"}</span>
                      <span style={{ color: 'var(--secondary)' }}>{checkoutPlan?.price} {symbol}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector Tab buttons */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {isRTL ? "اختر طريقة الدفع المفضلة:" : "Select Payment Gateway Channel:"}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.5rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <CreditCard size={12} />
                        <span>Visa / MC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mada')}
                        className={`btn ${paymentMethod === 'mada' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.5rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.65rem', color: paymentMethod === 'mada' ? '#fff' : '#10b981' }}>MADA</span>
                        <span>{isRTL ? "مدى" : "Mada"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('apple')}
                        className={`btn ${paymentMethod === 'apple' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.5rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <Smartphone size={12} />
                        <span>Apple Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`btn ${paymentMethod === 'paypal' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.5rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <span style={{ fontWeight: 'bold', color: '#ffb703', fontStyle: 'italic', fontSize: '0.7rem' }}>Pay</span>
                        <span>Pal</span>
                      </button>
                    </div>
                  </div>

                  {/* Gateway Trust Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {isRTL 
                        ? "الدفع مشفر وآمن 256-بت. تلتزم البوابة بمعايير أمان البطاقات العالمية PCI-DSS." 
                        : "SSL Secure Encrypted 256-bit connection. PCI-DSS compliance standards active."}
                    </span>
                  </div>

                </div>

                {/* Right Column: Interactive Card & Input Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* EXPRESS CHECKOUT WIDGETS (For Apple Pay & PayPal) */}
                  {(paymentMethod === 'apple' || paymentMethod === 'paypal') ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: '0.75rem',
                      padding: '2rem',
                      border: '1px solid var(--card-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
                        <Lock size={12} />
                        <span>{isRTL ? "بوابة الدفع السريع الآمنة" : "Express Checkout Portal"}</span>
                      </div>

                      {paymentMethod === 'apple' ? (
                        <button
                          type="button"
                          onClick={() => handleExpressPay('apple')}
                          style={{
                            background: '#000',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            width: '100%',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                        >
                          <Smartphone size={16} />
                          <span>Pay with  Pay</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExpressPay('paypal')}
                          style={{
                            background: '#ffc72c',
                            color: '#003087',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            width: '100%',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 4px 12px rgba(255, 199, 44, 0.2)'
                          }}
                        >
                          <span style={{ fontStyle: 'italic', fontWeight: 800 }}>PayPal</span>
                          <span>Express</span>
                        </button>
                      )}

                      <p style={{ margin: '1rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {isRTL 
                          ? "سيتم استدعاء واجهة الدفع من جهازك فوراً بمجرد النقر" 
                          : "Native biometric or password confirmation window triggers on click"}
                      </p>
                    </div>
                  ) : (
                    /* CREDIT CARD FORM & 3D GRAPHIC PREVIEW */
                    <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'start' }}>
                      
                      {/* 3D CREDIT CARD GRAPHIC WRAPPER */}
                      <div style={{
                        perspective: '1000px',
                        width: '100%',
                        height: '140px',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: focusedField === 'cvv' ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}>
                          
                          {/* CARD FRONT SIDE */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: paymentMethod === 'mada' 
                              ? 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)'
                              : 'linear-gradient(135deg, #4f46e5 0%, #311042 100%)',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            backfaceVisibility: 'hidden',
                            boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {/* Chip & Brand */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {/* Gold Chip Mock */}
                              <div style={{
                                width: '28px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                borderRadius: '4px'
                              }} />
                              
                              {/* Logo brand label */}
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', letterSpacing: '0.05em' }}>
                                {getCardType(cardNumber)}
                              </span>
                            </div>

                            {/* Card digits display */}
                            <div style={{
                              fontSize: '1.05rem',
                              fontWeight: 'bold',
                              color: '#fff',
                              letterSpacing: '0.12em',
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              margin: '0.5rem 0'
                            }}>
                              {cardNumber || '•••• •••• •••• ••••'}
                            </div>

                            {/* Holder & Expiry details */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                              <div style={{ textAlign: 'start' }}>
                                <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>CARDHOLDER</div>
                                <div style={{ fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                  {cardHolder || 'FULL NAME'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'end' }}>
                                <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>EXPIRES</div>
                                <div style={{ fontWeight: 'bold', color: '#fff' }}>{cardExpiry || 'MM/YY'}</div>
                              </div>
                            </div>
                          </div>

                          {/* CARD BACK SIDE */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: paymentMethod === 'mada'
                              ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
                              : 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                            borderRadius: '0.75rem',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '1rem 0'
                          }}>
                            {/* Magnetic strip */}
                            <div style={{ width: '100%', height: '24px', background: '#000' }} />
                            
                            {/* CVV panel */}
                            <div style={{ padding: '0 1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginInlineEnd: '0.5rem' }}>CVV CODE</div>
                              <div style={{
                                width: '60px',
                                height: '24px',
                                background: '#fff',
                                color: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                borderRadius: '3px',
                                fontFamily: 'monospace'
                              }}>
                                {cardCVV || '•••'}
                              </div>
                            </div>

                            {/* Back Signature text info */}
                            <div style={{ padding: '0 1rem', fontSize: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                              {isRTL ? "توقيع المالك المعتمد - غير قابل للتحويل" : "AUTHORIZED SIGNATURE - NOT TRANSFERABLE"}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* TEXT FIELD INPUTS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            {isRTL ? "اسم حامل البطاقة (بالإنجليزية):" : "Cardholder Name:"}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. SALMA AL HARBI"
                            value={cardHolder}
                            onChange={e => setCardHolder(e.target.value.toUpperCase())}
                            onFocus={() => setFocusedField('holder')}
                            onBlur={() => setFocusedField('')}
                            required
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            {isRTL ? "رقم البطاقة المصرفية:" : "Card Number:"}
                          </label>
                          <input
                            type="text"
                            placeholder="4000 1234 5678 9010"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            onFocus={() => setFocusedField('number')}
                            onBlur={() => setFocusedField('')}
                            required
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', width: '100%', fontFamily: 'monospace' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                              {isRTL ? "تاريخ الانتهاء:" : "Expiry Date:"}
                            </label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              onFocus={() => setFocusedField('expiry')}
                              onBlur={() => setFocusedField('')}
                              required
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', width: '100%', textAlign: 'center' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                              {isRTL ? "رمز الأمان (CVV):" : "Security Code (CVV):"}
                            </label>
                            <input
                              type="password"
                              placeholder="123"
                              value={cardCVV}
                              onChange={handleCVVChange}
                              onFocus={() => setFocusedField('cvv')}
                              onBlur={() => setFocusedField('')}
                              required
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', width: '100%', textAlign: 'center', fontFamily: 'monospace' }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          fontWeight: 'bold',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.65rem'
                        }}
                      >
                        <Lock size={12} />
                        <span>
                          {isRTL ? `تأكيد ودفع ${checkoutPlan?.price} ${symbol}` : `Pay ${checkoutPlan?.price} ${symbol} Securely`}
                        </span>
                      </button>
                    </form>
                  )}

                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
