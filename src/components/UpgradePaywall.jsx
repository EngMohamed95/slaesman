import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Lock, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

const PayPalIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0, fill: '#003087', marginInlineEnd: '0.4rem' }} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.07 6.47c-.24-1.37-.92-2.45-2.02-3.23C16.85 2.37 15.17 2 13.08 2H5.74c-.41 0-.76.3-.82.7L2.46 18.25c-.05.3.17.57.48.57h4.08l1.18-7.5c.06-.41.41-.7.82-.7h1.66c3.48 0 5.86-1.7 6.54-5.06.31-1.57.17-2.73-.65-3.09z" fill="#003087"/>
    <path d="M16.92 11.23c-.32 1.57-1.48 2.65-3.13 2.65h-2.18l-.94 6c-.05.3.17.57.48.57h3.38c.41 0 .76-.3.82-.7l.95-6.07c.06-.41.41-.7.82-.7h.35c3.21 0 5.4-1.57 6.02-4.66.19-.94.13-1.74-.22-2.38-.56 2.87-2.67 4.59-6.35 4.59z" fill="#0079C1"/>
  </svg>
);

export default function UpgradePaywall({ requiredPlan, featureNameAr, featureNameEn }) {
  const { isRTL } = useLanguage();
  const { setPlan, selectedCurrency } = useApp();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Set prices dynamically based on currency
  const getUpgradePrice = () => {
    if (selectedCurrency === 'SAR') {
      return requiredPlan === 'Growth' ? '399 ريال / شهرياً' : '199 ريال / شهرياً';
    }
    if (selectedCurrency === 'AED') {
      return requiredPlan === 'Growth' ? '390 درهم / شهرياً' : '195 درهم / شهرياً';
    }
    if (selectedCurrency === 'EGP') {
      return requiredPlan === 'Growth' ? '5,190 جنيه / شهرياً' : '2,590 جنيه / شهرياً';
    }
    if (selectedCurrency === 'JOD') {
      return requiredPlan === 'Growth' ? '76 دينار / شهرياً' : '38 دينار / شهرياً';
    }
    return requiredPlan === 'Growth' ? '$107 / month' : '$53 / month';
  };

  const handlePayPalCheckout = () => {
    setProcessing(true);
    
    // Open a styled mock PayPal subscription login popup window
    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '',
      'PayPalCheckout',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no`
    );

    if (!popup) {
      alert(isRTL ? "الرجاء تمكين النوافذ المنبثقة لإتمام الدفع عبر PayPal" : "Please enable popups to complete PayPal checkout.");
      setProcessing(false);
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>PayPal Checkout</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', 'Roboto', sans-serif; background: #f5f7fa; margin: 0; padding: 20px; text-align: center; color: #2c2e2f; direction: ${isRTL ? 'rtl' : 'ltr'}; }
            .container { background: #fff; border: 1px solid #e3e5e6; border-radius: 12px; max-width: 420px; margin: 20px auto; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .logo { height: 28px; margin-bottom: 20px; }
            .price-badge { background: #f0f4f9; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 18px; color: #003087; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
            .input-group { text-align: ${isRTL ? 'right' : 'left'}; margin-bottom: 16px; }
            .input-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #6c7378; }
            .input-group input { width: 100%; padding: 10px; border: 1px solid #c5d0d6; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
            .pay-btn { width: 100%; padding: 14px; background: #ffc439; color: #003087; border: none; border-radius: 24px; font-weight: 700; cursor: pointer; font-size: 15px; margin-top: 10px; font-family: inherit; transition: background 0.2s; }
            .pay-btn:hover { background: #f2ba36; }
            .cancel-link { display: inline-block; margin-top: 15px; font-size: 13px; color: #0079c1; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <svg viewBox="0 0 24 24" width="32" height="32" class="logo" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.07 6.47c-.24-1.37-.92-2.45-2.02-3.23C16.85 2.37 15.17 2 13.08 2H5.74c-.41 0-.76.3-.82.7L2.46 18.25c-.05.3.17.57.48.57h4.08l1.18-7.5c.06-.41.41-.7.82-.7h1.66c3.48 0 5.86-1.7 6.54-5.06.31-1.57.17-2.73-.65-3.09z" fill="#003087"/>
              <path d="M16.92 11.23c-.32 1.57-1.48 2.65-3.13 2.65h-2.18l-.94 6c-.05.3.17.57.48.57h3.38c.41 0 .76-.3.82-.7l.95-6.07c.06-.41.41-.7.82-.7h.35c3.21 0 5.4-1.57 6.02-4.66.19-.94.13-1.74-.22-2.38-.56 2.87-2.67 4.59-6.35 4.59z" fill="#0079C1"/>
            </svg>
            <div class="title">${isRTL ? "تسجيل الدخول للدفع بأمان" : "Log in to PayPal to complete checkout"}</div>
            
            <div class="price-badge">
              ${isRTL ? "مجموع قيمة الفاتورة:" : "Subscription Price:"} ${getUpgradePrice()}
            </div>

            <div class="input-group">
              <label>${isRTL ? "البريد الإلكتروني لحساب PayPal" : "PayPal Email Address"}</label>
              <input type="email" id="email" placeholder="sandbox.buyer@paypal.com" value="sandbox.buyer@paypal.com" required />
            </div>

            <div class="input-group">
              <label>${isRTL ? "كلمة المرور" : "PayPal Password"}</label>
              <input type="password" id="pass" placeholder="••••••••" value="sandbox12345" required />
            </div>

            <button class="pay-btn" onclick="approvePayment()">${isRTL ? "الموافقة والاشتراك الآن" : "Agree & Subscribe"}</button>
            <a href="#" class="cancel-link" onclick="window.close()">${isRTL ? "إلغاء والعودة للموقع" : "Cancel and return to SalesMate"}</a>
          </div>

          <script>
            function approvePayment() {
              window.opener.postMessage({ type: 'PAYPAL_CHECKOUT_APPROVED' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);

    const handleMessage = (event) => {
      if (event.data?.type === 'PAYPAL_CHECKOUT_APPROVED') {
        setPlan(requiredPlan);
        setSuccess(true);
        setProcessing(false);
        
        // Show success alert and reload to trigger render
        setTimeout(() => {
          alert(isRTL 
            ? "تهانينا! تم استلام دفعة PayPal بنجاح وترقية باقتك فوراً. تم فتح جميع ميزات الصفحة!" 
            : "Congratulations! PayPal payment approved. Your account has been upgraded, and page access is unlocked!"
          );
          window.location.reload();
        }, 300);
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
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

          {/* PayPal Pay Action Button */}
          <button
            onClick={handlePayPalCheckout}
            disabled={processing}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: '2rem',
              background: '#ffc439',
              border: 'none',
              cursor: processing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(255, 196, 57, 0.3)',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#003087',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
            className="paypal-pay-btn"
          >
            <PayPalIcon />
            <span>{processing ? (isRTL ? "جاري معالجة PayPal..." : "Redirecting to PayPal...") : (isRTL ? "ترقية فورية بواسطة PayPal" : "Instant Upgrade via PayPal")}</span>
          </button>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <AlertCircle size={12} />
            <span>{isRTL ? "معالجة مشفرة وآمنة بنسبة 100%" : "Encrypted SSL processing. 100% secure."}</span>
          </div>

        </div>

        <style>{`
          .paypal-pay-btn:hover {
            transform: translateY(-1px);
            background: #f2ba36 !important;
            box-shadow: 0 6px 20px rgba(255, 196, 57, 0.45) !important;
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
