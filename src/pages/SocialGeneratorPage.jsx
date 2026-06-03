import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Calendar, FileText, Compass, Check } from 'lucide-react';

export default function SocialGeneratorPage() {
  const { t, isRTL } = useLanguage();
  
  const [platform, setPlatform] = useState('Instagram');
  const [industry, setIndustry] = useState('Real Estate');
  const [audience, setAudience] = useState('Investors');
  const [tone, setTone] = useState('Professional');
  const [focus, setFocus] = useState('Investment Tips'); // Investment tips, Buying guide, Area comparison, Payment plans
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = () => {
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      let data = {};
      if (isRTL) {
        data = {
          postIdeas: [
            { id: 1, title: 'نصيحة اليوم: عائد الاستثمار العقاري', content: 'قبل أن تشتري أي عقار بغرض الاستثمار، احرص على حساب صافي عائد الإيجار بعد خصم رسوم الخدمات والصيانة. العائد الجيد يتراوح بين 6% إلى 8% سنوياً في الرياض حالياً.' },
            { id: 2, title: 'مقارنة بين الشمال والشرق في الرياض', content: 'أيهما أفضل للشراء الآن؟ نقارن في هذا المنشور بين نمو الأسعار في حي الياسمين (شمال الرياض) وحي النرجس، من حيث الخدمات والمستقبل الاستثماري.' },
            { id: 3, title: 'أكبر 3 أخطاء يقع فيها مشتري العقار الأول', content: '1. عدم تحديد ميزانية واضحة تشمل الرسوم الإضافية.\n2. إهمال معاينة الموقع في أوقات مختلفة.\n3. التسرع دون مراجعة بنود خطة السداد.' }
          ],
          script: `[سيناريو ريلز/تيك توك - مدة 45 ثانية]\n\n[المشهد: تبدأ الفيديو وأنت تمسك بمفاتيح وتقف أمام بناية حديثة]\nالصوت: "عايز تشتري شقة ومحتار بين الكاش والتقسيط؟ خليني أقولك سر..."\n[المشهد: تنتقل الكاميرا للداخل لمشاهدة الغرف المضيئة]\nالصوت: "الكثير بيعتقد إن الكاش أفضل عشان الخصم. بس الحقيقة، في ظل التضخم الحالي، الاحتفاظ بالكاش واستخدام خطط السداد طويلة المدى بدون فوائد بيحافظ على سيولتك وبيزيد من قيمة أصولك بدون فوائد بنكية!"\n[المشهد: تنهي الفيديو بابتسامة وتوجيه دعوة للإجراء]\nالصوت: "عايز تعرف أفضل خطط سداد حالياً في الرياض؟ أرسل كلمة 'خطة' في الخاص وحبعتلك الكتالوج فوراً!"`,
          calendar: [
            { day: 'الأحد', platform: 'Instagram/LinkedIn', topic: 'منشور مقارنة أسعار العقار في أحياء الرياض الجديدة + تحليل العوائد.' },
            { day: 'الثلاثاء', platform: 'Snapchat/TikTok', topic: 'فيديو ريلز قصير: نصائح لتجنب أخطاء كتابة العقود.' },
            { day: 'الخميس', platform: 'WhatsApp Status', topic: 'صورة حية من موقع البناء لمشروعنا الجديد مع تفاصيل الحجز.' }
          ]
        };
      } else {
        data = {
          postIdeas: [
            { id: 1, title: 'ROI Calculation Secrets', content: 'Before buying any investment property, ensure you calculate the NET rental yield (rental income minus maintenance and fees). A healthy yield in Riyadh right now is between 6% to 8% annually.' },
            { id: 2, title: 'Area Spotlight: North vs East Riyadh', content: 'Where should you invest today? We compare price growth trends in Al-Yasmin vs Al-Narjis, highlighting amenities, transit connections, and capital appreciation potential.' },
            { id: 3, title: 'Top 3 Buyer Mistakes to Avoid', content: '1. Not budgeting for hidden costs (brokerage, registration).\n2. Skipping site viewings during different times of the day.\n3. Signing without reviewing developer default terms.' }
          ],
          script: `[Reels / TikTok Script - 45 seconds]\n\n[Visual: You standing in front of a luxury apartment building, holding keycard]\nAudio: "Thinking about buying but stuck between paying cash or installments? Here is the truth..."\n[Visual: Cut to smooth shots of the modern living room]\nAudio: "While cash gives discounts, in today's market, retaining your liquidity and utilizing developer 0% interest payment plans lets your money work elsewhere while your asset appreciates."\n[Visual: Close up, friendly smile]\nAudio: "Want a list of Riyadh projects offering 7-year payment plans? DM me 'PLANS' and I'll send them instantly!"`,
          calendar: [
            { day: 'Sunday', platform: 'Instagram/LinkedIn', topic: 'Price trends comparison in top emerging districts + yield maps.' },
            { day: 'Tuesday', platform: 'Snapchat/TikTok', topic: 'Short video script: 3 red flags in a real estate contract.' },
            { day: 'Thursday', platform: 'WhatsApp Status', topic: 'Live construction progress picture + limited unit inventory alert.' }
          ]
        };
      }

      setResult(data);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--secondary)' }} /> {t('socialTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('socialSubtitle')}</p>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Column: Form Brief */}
        <div className="card" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>{isRTL ? "مواصفات المحتوى المطلوب" : "Content Brief Details"}</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              {t('platform')}
            </label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok / Snapchat</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              {t('targetAudience')}
            </label>
            <select value={audience} onChange={e => setAudience(e.target.value)}>
              <option value="Investors">{isRTL ? "مستثمرون عقاريون" : "Real Estate Investors"}</option>
              <option value="First-time Buyers">{isRTL ? "مشتري المسكن الأول" : "First-time Home Buyers"}</option>
              <option value="Luxury Clients">{isRTL ? "عملاء العقار الفاخر" : "Luxury Hunters"}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              {t('tone')}
            </label>
            <select value={tone} onChange={e => setTone(e.target.value)}>
              <option value="Professional">{isRTL ? "احترافي وموثوق" : "Professional & Expert"}</option>
              <option value="Friendly">{isRTL ? "ودي وقريب" : "Friendly & Engaging"}</option>
              <option value="Persuasive">{isRTL ? "حماسي ومقنع" : "Persuasive & Sales-driven"}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              {isRTL ? "موضوع التركيز" : "Focus Topic"}
            </label>
            <select value={focus} onChange={e => setFocus(e.target.value)}>
              <option value="Investment Tips">{isRTL ? "نصائح استثمارية" : "Investment Tips"}</option>
              <option value="Buying Mistakes">{isRTL ? "أخطاء الشراء الشائعة" : "Common Buyer Mistakes"}</option>
              <option value="Area Comparison">{isRTL ? "مقارنة بين المناطق" : "Area Comparisons"}</option>
              <option value="Payment Plans">{isRTL ? "شرح خطط السداد" : "Payment Plan Structures"}</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ marginTop: '0.5rem' }}>
            <Sparkles size={16} /> {loading ? (isRTL ? 'جاري التحضير...' : 'Creating...') : t('generateContent')}
          </button>
        </div>

        {/* Right Column: Generated output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading && (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
              {isRTL ? "يقوم الذكاء الاصطناعي بتحليل الاتجاهات وصياغة المحتوى..." : "AI Content Creator is crafting ideas..."}
            </div>
          )}

          {!loading && !result && (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)', textAlign: 'center' }}>
              {isRTL ? "اختر منصة وموضوع المحتوى المناسبين واضغط على توليد." : "Fill the brief requirements and generate your content schedule."}
            </div>
          )}

          {result && (
            <>
              {/* Post Ideas */}
              <div className="card">
                <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: 'var(--secondary)' }} />
                  {t('postIdeas')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {result.postIdeas.map(post => (
                    <div key={post.id} style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                      <h4 style={{ margin: '0 0 0.5rem', color: '#a5b4fc' }}>{post.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reels Script */}
              <div className="card">
                <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={18} style={{ color: 'var(--primary)' }} />
                  {t('reelsScript')}
                </h3>
                <pre style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--card-border)',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>{result.script}</pre>
              </div>

              {/* Content Calendar */}
              <div className="card">
                <h3 style={{ margin: '0 0 1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: 'var(--accent)' }} />
                  {t('contentCalendar')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.calendar.map((cal, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)' }}>
                      <div style={{ width: '80px', fontWeight: 'bold', color: 'var(--accent)' }}>{cal.day}</div>
                      <div style={{ width: '130px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cal.platform}</div>
                      <div style={{ flex: 1, fontSize: '0.9rem' }}>{cal.topic}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
