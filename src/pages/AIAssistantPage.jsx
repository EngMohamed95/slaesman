import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { Sparkles, MessageSquare, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export default function AIAssistantPage() {
  const { t, isRTL } = useLanguage();
  const { leads } = useCRM();

  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [activeTab, setActiveTab] = useState('objections'); // objections, scripts, summarize
  const [selectedObjection, setSelectedObjection] = useState('price'); // price, think, location, rent
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleGenerate = () => {
    if (!selectedLead) return;
    setLoading(true);
    setAiOutput('');

    setTimeout(() => {
      let result = '';
      const leadName = isRTL ? selectedLead.nameAr : selectedLead.name;
      const leadService = isRTL ? selectedLead.serviceAr : selectedLead.service;

      if (activeTab === 'objections') {
        if (selectedObjection === 'price') {
          result = isRTL 
            ? `مرحباً ${leadName}، أتفهم تماماً أن السعر يمثل جانباً رئيسياً في قراركم. ولكن أود الإشارة إلى أن هذا العقار في ${leadService} يتميز بمعدل نمو سنوي متوقع يصل إلى 12%، بالإضافة إلى خطة السداد المرنة الممتدة على 7 سنوات بدون فوائد، مما يجعله استثماراً آمناً يقلل العبء المالي الشهري مقارنة بالمشاريع الجاهزة.`
            : `Hello ${leadName}, I completely understand that pricing is a major factor in your decision. However, I'd love to highlight that this property in ${leadService} offers a strong 12% projected annual appreciation rate. Combined with the 7-year interest-free installment plan, this significantly lowers your monthly cash outlays compared to completed secondary market units.`;
        } else if (selectedObjection === 'think') {
          result = isRTL
            ? `أهلاً بك سيد ${leadName}. أقدر جداً رغبتك في دراسة القرار مع العائلة والاستشارة. الاستثمار العقاري قرار كبير، ولذلك أقترح أن نحدد مكالمة سريعة مدتها 10 دقائق غداً للإجابة على أي استفسارات تقنية أو مالية قد تهم شريكك لضمان اتخاذكم القرار الأنسب.`
            : `Hi ${leadName}. I completely value your decision to review and consult your partner. Purchasing property is a major step. To help make this easier, I'd suggest a brief 10-minute session tomorrow to address any technical or financing queries your partner might have.`;
        } else if (selectedObjection === 'location') {
          result = isRTL
            ? `مرحباً ${leadName}. أتفهم تحفظك بخصوص المسافة. ولكن يجدر بالذكر أن هذا المشروع متصل مباشرة بالطريق الدائري الجديد ومحطة المترو المزمع تدشينها العام المقبل، مما سيسهل الوصول إلى مركز المدينة خلال 15 دقيقة فقط، فضلاً عن أن أسعار المتر الحالية في هذه المنطقة أقل بـ 30% من وسط المدينة.`
            : `Hello ${leadName}. I understand your initial concerns about distance. However, this project is situated right along the new ring road expansion and next year's metro transit line, ensuring transit to city center in under 15 minutes, while current price per sqm is 30% lower than prime central Riyadh.`;
        } else {
          result = isRTL
            ? `مرحباً ${leadName}. الإيجار يبدو خياراً مريحاً على المدى القصير، ولكن من الناحية المالية، فإن دفعات الإيجار السنوية هي مصاريف غير مستردة. بموجب خطة دفع المطور الحالية، يمكنك دفع نفس القسط الشهري تقريباً لتمتلك أصل عقاري يرتفع ثمنه سنوياً ويكون ملكاً لك بالكامل.`
            : `Hello ${leadName}. Renting seems convenient in the short run, but rental payments are non-recoverable expense. Under the developer's current incentive scheme, your monthly mortgage or installment would be almost equivalent to rent, building equity in an asset you own.`;
        }
      } else if (activeTab === 'scripts') {
        result = isRTL
          ? `[سيناريو مكالمة المتابعة مع ${leadName}]\n\n1. الترحيب والتهيئة: "أهلاً سيد ${leadName}، معك أحمد من إيليت العقارية. أتمنى أنك تقضي يوماً سعيداً."\n2. التذكير بالمعاينة: "أردت فقط الاطمئنان على رأيك بعد زيارتنا بالأمس لـ ${leadService}؟ هل كان التوزيع الداخلي والموقع مناسبين لتوقعاتك؟"\n3. تقديم العرض المحدود: "تلقينا تحديثاً من المطور اليوم بوجود خصم إضافي 3% على الدفعات الأولى هذا الأسبوع فقط. أردت إخبارك أولاً لحجز الميزة."`
          : `[Follow-up Call Script for ${leadName}]\n\n1. Greeting & Rapport: "Hi ${leadName}, this is Sarah from Elite Properties. Hope you are having a wonderful day."\n2. Viewing Feedback Hook: "I wanted to check on your thoughts regarding the ${leadService} we viewed yesterday. Did the layout and project amenities align with your family goals?"\n3. Urgency Hook: "The developer just announced a 3% early-bird discount on down payments valid until this Sunday. I wanted to make sure you get the priority access."`;
      } else {
        const leadNotes = isRTL ? (selectedLead.notesAr || selectedLead.notes) : selectedLead.notes;
        result = isRTL
          ? `[ملخص ملخص ملاحظات العميل ${leadName}]\n\n- المصدر: ${selectedLead.sourceAr || selectedLead.source}\n- الميزانية المحددة: ${selectedLead.budget.toLocaleString()} ريال\n- خلاصة الموقف: العميل يبدي اهتماماً كبيراً بمواصفات العقار ولكنه قلق بشأن شروط الدفع وجدول التسليم.\n- التوصية البيعية: تقديم خيار الدفع المؤجل أو تمديد فترات الأقساط لحسم الصفقة.`
          : `[AI Lead Summary for ${leadName}]\n\n- Source: ${selectedLead.source}\n- Target Budget: $${selectedLead.budget.toLocaleString()}\n- Current Status: Interested in layouts but highly sensitive to payment structures and delivery dates.\n- Recommended Action: Provide custom deferred payment templates to close the agreement.`;
      }

      setAiOutput(result);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--secondary)' }} /> {t('aiAssistantTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('aiSubtitle')}</p>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem' }}>
        
        {/* Left Column: Generator Inputs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              {isRTL ? "اختر العميل المستهدف" : "Select Target Lead"}
            </label>
            <select value={selectedLeadId} onChange={e => {
              setSelectedLeadId(e.target.value);
              setAiOutput('');
            }}>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{isRTL ? lead.nameAr : lead.name}</option>
              ))}
            </select>
          </div>

          {/* Mode Switch tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
            {[
              { id: 'objections', label: t('objectionHandler') },
              { id: 'scripts', label: t('callScriptGen') },
              { id: 'summarize', label: isRTL ? 'تلخيص الملاحظات' : 'Summarize Notes' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setAiOutput('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 0.5rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub options if objections */}
          {activeTab === 'objections' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                {t('selectObjection')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'price', label: t('objectionPrice') },
                  { id: 'think', label: t('objectionThink') },
                  { id: 'location', label: t('objectionLocation') },
                  { id: 'rent', label: t('objectionRent') }
                ].map(obj => (
                  <label key={obj.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: selectedObjection === obj.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${selectedObjection === obj.id ? 'var(--primary)' : 'var(--card-border)'}`,
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input 
                      type="radio" 
                      name="objection" 
                      checked={selectedObjection === obj.id} 
                      onChange={() => setSelectedObjection(obj.id)} 
                      style={{ display: 'none' }}
                    />
                    <span>{obj.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !selectedLeadId} style={{ marginTop: '0.5rem' }}>
            <Sparkles size={16} /> {loading ? (isRTL ? 'جاري التوليد...' : 'Generating...') : (isRTL ? 'توليد الاستجابة' : 'Generate')}
          </button>
        </div>

        {/* Right Column: AI Output */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
            {activeTab === 'objections' ? t('aiResponse') : activeTab === 'scripts' ? t('aiScript') : (isRTL ? 'ملخص العميل' : 'AI Summary')}
          </h3>
          
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div className="fade-in">{isRTL ? "يقوم الذكاء الاصطناعي بتحليل البيانات..." : "AI Assistant is thinking..."}</div>
            </div>
          ) : aiOutput ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{
                background: 'rgba(255,255,255,0.01)',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--card-border)',
                lineHeight: 1.7,
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-main)'
              }}>
                {aiOutput}
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(aiOutput);
                    alert(isRTL ? 'تم النسخ للحافظة!' : 'Copied to clipboard!');
                  }}
                >
                  {isRTL ? "نسخ الرد" : "Copy to Clipboard"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              {isRTL ? "اختر العميل واضغط على زر توليد لبدء العمل." : "Configure options and click Generate to see insights."}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
