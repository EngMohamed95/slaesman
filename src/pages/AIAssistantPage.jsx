import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { useApp } from '../context/AppContext';
import { isGeminiActive, callGeminiApi } from '../utils/gemini';
import { useAIConversations } from '../utils/aiConversations';
import { parseChatToMessages } from '../utils/chatParser';
import { Sparkles, MessageSquare, ShieldAlert, FileText, CheckCircle2, Plus, Trash2 } from 'lucide-react';

// Helper to parse pasted chat text into structured message bubble objects

// Helper parser to extract details for the custom AI response
const analyzeChatContent = (text, isRTL) => {
  let name = '';
  let phone = '';
  let service = '';
  let budget = '';

  const phoneMatch = text.match(/(?:\+?|00)?\d{9,14}/);
  if (phoneMatch) phone = phoneMatch[0];

  const namePatterns = [
    /(?:العميل|المشتري|المستعلم|الاسم|Name|Customer|Client)\s*[:\-]\s*([^\n\r]+)/i,
    /(?:معك|معاك|اسمي|أنا)\s+([^\n\r]+)/
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }

  const propertyKeywords = [
    { ar: 'شقة', en: 'Apartment' },
    { ar: 'فيلا', en: 'Villa' },
    { ar: 'تاون هاوس', en: 'Townhouse' },
    { ar: 'بنتهاوس', en: 'Penthouse' },
    { ar: 'أرض', en: 'Land' },
    { ar: 'مكتب', en: 'Office' }
  ];
  for (const keyword of propertyKeywords) {
    const regex = new RegExp(`(${keyword.ar}|${keyword.en})[^\\n\\r,]*`, 'i');
    const match = text.match(regex);
    if (match) {
      service = match[0].trim();
      break;
    }
  }

  const budgetMatch = text.match(/(?:ميزانية|الميزانية|ميزانيتي|السعر|budget|max price|around)\s*(?:هي|تكون|is)?\s*(\d+[\d,]*\s*(?:مليون|ألف|k|m|million|sar|usd)?)/i);
  if (budgetMatch) {
    let rawBudget = budgetMatch[1].replace(/,/g, '').trim();
    budget = rawBudget;
    if (budget.includes('مليون') || budget.toLowerCase().includes('m')) {
      const num = parseFloat(budget);
      if (!isNaN(num)) budget = (num * 1000000).toString();
    } else if (budget.includes('ألف') || budget.toLowerCase().includes('k')) {
      const num = parseFloat(budget);
      if (!isNaN(num)) budget = (num * 1000).toString();
    }
  }

  if (!name) name = isRTL ? 'عميل واتساب جديد' : 'New WhatsApp Lead';
  if (!phone) phone = '+966500000000';
  if (!service) service = isRTL ? 'عقار غير محدد بعد' : 'Unspecified Property';
  if (!budget) budget = '0';

  return { name, phone, service, budget };
};

export default function AIAssistantPage() {
  const { t, isRTL } = useLanguage();
  const { leads } = useCRM();
  const { checkAILimit, incrementAICount, user } = useApp();
  const {
    conversations,
    activeConversation,
    messages: sharedMessages,
    setMessages: setSharedMessages,
    selectConversation,
    newConversation,
    deleteConversation
  } = useAIConversations(user?.id || 'default', isRTL ? 'ar' : 'en');

  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [activeTab, setActiveTab] = useState('objections'); // objections, scripts, summarize
  const [selectedObjection, setSelectedObjection] = useState('price'); // price, think, location, rent
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Chat Analysis states
  const [pastedChatText, setPastedChatText] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedTask, setSelectedTask] = useState('reply'); // reply, requirements, nextsteps

  // Parse chat messages in real time
  useEffect(() => {
    setChatMessages(parseChatToMessages(pastedChatText));
  }, [pastedChatText]);

  useEffect(() => {
    if (!aiOutput) return;
    setSharedMessages(previous => {
      if (previous.at(-1)?.text === aiOutput) return previous;
      return [...previous, {
        id: `page-${Date.now()}`,
        sender: 'ai',
        text: aiOutput,
        createdAt: new Date().toISOString(),
        source: 'assistant-page'
      }];
    });
    // aiOutput is the event being archived; shared storage updates separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiOutput]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleGenerate = async () => {
    if (activeTab !== 'chatAnalysis' && !selectedLead) return;

    const limit = checkAILimit();
    if (!limit.allowed) {
      setAiOutput(isRTL 
        ? "🚨 لقد استنفدت الحد المسموح به للحساب المجاني (3 عمليات توليد بالذكاء الاصطناعي).\n\nيرجى الترقية إلى الباقة الاحترافية (Pro) أو باقة النمو (Growth) للحصول على عمليات توليد غير محدودة وبدون قيود!"
        : "🚨 You have reached the limit of the free tier (3 AI generations).\n\nPlease upgrade to the Pro or Growth plan to get unlimited, unrestricted AI generations!"
      );
      return;
    }

    setLoading(true);
    setAiOutput('');

    if (isGeminiActive()) {
      try {
        let prompt = '';
        let systemInstruction = 'You are an expert sales assistant, specializing in real estate and customer service. Respond clearly and professionally in the language of the query/client (Arabic or English).';

        if (activeTab === 'chatAnalysis') {
          if (!pastedChatText.trim()) {
            setAiOutput(isRTL ? "الرجاء إدخال نص المحادثة للبدء." : "Please enter conversation transcript.");
            setLoading(false);
            return;
          }

          if (selectedTask === 'reply') {
            prompt = `Analyze the following WhatsApp chat transcript and write a highly professional, polite, and persuasive follow-up response to the client. Keep the response formatted as a ready-to-copy text message.\n\nTranscript:\n${pastedChatText}`;
          } else if (selectedTask === 'requirements') {
            prompt = `Analyze this WhatsApp chat transcript. Extract:
1. Client Name
2. Target Property type or service
3. Budget mentioned
4. Extracted contact numbers/emails
5. A brief summary evaluation of their interest.
Return the output as a structured list in Arabic if query/chat is in Arabic, else in English.\n\nTranscript:\n${pastedChatText}`;
          } else {
            prompt = `Suggest a detailed step-by-step action plan to follow up with the client based on this WhatsApp chat transcript.\n\nTranscript:\n${pastedChatText}`;
          }
        } else {
          const leadName = isRTL ? (selectedLead.nameAr || selectedLead.name) : selectedLead.name;
          const leadService = isRTL ? (selectedLead.serviceAr || selectedLead.service) : selectedLead.service;
          const leadNotes = isRTL ? (selectedLead.notesAr || selectedLead.notes) : selectedLead.notes;

          if (activeTab === 'objections') {
            systemInstruction = 'You are a real estate sales closer and negotiations coach. Write a persuasive response for the salesperson to handle a specific client objection.';
            prompt = `Draft a direct, professional, and convincing response for salesperson to address a client's objection.
Client Name: ${leadName}
Target Property/Service: ${leadService}
Client's Objection: ${selectedObjection === 'price' ? 'Price is too expensive' : selectedObjection === 'think' ? 'Needs time to think / consult partner' : selectedObjection === 'location' ? 'Location is too far' : 'Renting is better than buying right now'}
Respond in the language matching the client's name/objection details (Arabic if name has Arabic letters, else English).`;
          } else if (activeTab === 'scripts') {
            systemInstruction = 'You are an expert cold call scriptwriter for real estate sales.';
            prompt = `Write an interactive follow-up phone call script for the sales agent to contact this lead. Include three stages: Greeting & Rapport, Feedback Hook, and Urgency Hook.
Client Name: ${leadName}
Target Property/Service: ${leadService}
Lead Notes: ${leadNotes}
Respond in the language matching the client's name (Arabic if name has Arabic letters, else English).`;
          } else {
            prompt = `Summarize the sales notes for the following lead and suggest a custom next best action step to close the deal.
Client Name: ${leadName}
Target Property/Service: ${leadService}
Lead Notes: ${leadNotes}
Current Status: ${selectedLead.status}
Respond in the language matching the client's name (Arabic if name has Arabic letters, else English).`;
          }
        }

        const responseText = await callGeminiApi(prompt, systemInstruction);
        setAiOutput(responseText);
        incrementAICount();
        setLoading(false);
        return;
      } catch (err) {
        console.error('Gemini assistant generation failed, falling back:', err);
      }
    }

    setTimeout(() => {
      let result = '';

      if (activeTab === 'chatAnalysis') {
        if (!pastedChatText.trim()) {
          result = isRTL 
            ? "الرجاء إدخال أو لصف محادثة العميل الخارجية أولاً للبدء بالتحليل." 
            : "Please enter or paste the external customer conversation transcript first to start the analysis.";
          setAiOutput(result);
          setLoading(false);
          return;
        }

        const info = analyzeChatContent(pastedChatText, isRTL);
        const nameVal = info.name;
        const serviceVal = info.service;
        const budgetVal = Number(info.budget) > 0 ? Number(info.budget).toLocaleString() : '';

        if (selectedTask === 'reply') {
          result = isRTL
            ? `أهلاً بك سيد ${nameVal}، يسعدنا جداً اهتمامكم بـ ${serviceVal}. ${budgetVal ? `بخصوص ميزانيتكم المحددة بـ ${budgetVal} ريال، يسعدنا إبلاغكم بتوفر خيارات سداد مرنة تمتد على 7 سنوات بقسط شهري مخفض وبدون فوائد.` : 'يسعدنا إرسال التفاصيل والكتيب التعريفي والمخططات الكاملة عبر الواتساب لتستعرضها مع العائلة.'} هل يناسبك تحديد موعد اتصال سريع غداً لمناقشة التفاصيل؟`
            : `Hello Mr ${nameVal}, thank you for your interest in ${serviceVal}. ${budgetVal ? `Regarding your budget of $${budgetVal}, we are pleased to inform you that we have customized payment plans extending over 7 years with reduced monthly installments.` : 'We would be glad to share the project brochures and floor plans via WhatsApp for your review.'} Would tomorrow morning work for a quick follow-up call?`;
        } else if (selectedTask === 'requirements') {
          result = isRTL
            ? `[تقرير متطلبات العميل بالذكاء الاصطناعي]
- اسم العميل المستخلص: ${nameVal}
- العقار المستهدف: ${serviceVal}
- الميزانية المذكورة: ${budgetVal ? `${budgetVal} ريال` : 'غير محددة بدقة في المحادثة'}
- الهاتف المستخلص: ${info.phone}
- تقييم المساعد الذكي: العميل يبدي اهتماماً كبيراً بالموقع ويفضل المراسلة الكتابية. ميزانيته ممتازة ومناسبة للمشروع.`
            : `[AI Customer Requirements Report]
- Client Name: ${nameVal}
- Target Property: ${serviceVal}
- Budget Mentioned: ${budgetVal ? `$${budgetVal}` : 'Not clearly specified'}
- Extracted Phone: ${info.phone}
- AI Evaluation: Client shows high interest in location and layout specifics. Highly responsive to text messages. Good budget fit.`;
        } else {
          result = isRTL
            ? `[خطة عمل ومتابعة العميل المقترحة]
1. إرسال الكتيب التعريفي والمخططات لـ ${serviceVal} عبر الواتساب فوراً.
2. إعداد مقترح مالي يعكس ميزانية العميل (${budgetVal ? `${budgetVal} ريال` : 'العقار غير محدد'}).
3. تجنب إجراء مكالمة هاتفية مباشرة والاكتفاء بالتواصل الكتابي عبر الواتساب بناءً على طبيعة استفساراته.
4. إرسال رابط موقع المعاينة لتمكين العميل من زيارة موقع المشروع.`
            : `[Proposed Client Action Plan]
1. Dispatch property layouts and PDF brochures for ${serviceVal} via WhatsApp immediately.
2. Prepare a tailored financial pricing proposal reflecting budget (${budgetVal ? `$${budgetVal}` : 'not specified'}).
3. Connect via text follow-up instead of direct calls based on text pattern responses.
4. Deliver GPS layout coordinates to schedule a site visit next Saturday.`;
        }
      } else {
        const leadName = isRTL ? selectedLead.nameAr : selectedLead.name;
        const leadService = isRTL ? selectedLead.serviceAr : selectedLead.service;

        if (activeTab === 'objections') {
          if (selectedObjection === 'price') {
            result = isRTL 
              ? `مرحباً ${leadName}، أتفهم تماماً أن السعر يمثل جانباً رئيسياً في قراركم. ولكن أود الإشارة إلى أن هذا العقار في ${leadService} يتميز بمعدل نمو سنوي متوقع يصل إلى 12%، بالإضافة إلى خطة السداد المرنة الممتدة على 7 سنوات بدون فوائد، مما يجعله استثماراً امنأ يقلل العبء المالي الشهري مقارنة بالمشاريع الجاهزة.`
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
            ? `[ملخص ملاحظات العميل ${leadName}]\n\n- المصدر: ${selectedLead.sourceAr || selectedLead.source}\n- الميزانية المحددة: ${selectedLead.budget.toLocaleString()} ريال\n- خلاصة الموقف: العميل يبدي اهتماماً كبيراً بمواصفات العقار ولكنه قلق بشأن شروط الدفع وجدول التسليم.\n- التوصية البيعية: تقديم خيار الدفع المؤجب أو تمديد فترات الأقساط لحسم الصفقة.`
            : `[AI Lead Summary for ${leadName}]\n\n- Source: ${selectedLead.source}\n- Target Budget: $${selectedLead.budget.toLocaleString()}\n- Current Status: Interested in layouts but highly sensitive to payment structures and delivery dates.\n- Recommended Action: Provide custom deferred payment templates to close the agreement.`;
        }
      }

      setAiOutput(result);
      incrementAICount();
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

      <div className="card" style={{ marginBottom: '1rem', padding: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <strong>{isRTL ? 'سجل محادثات المساعد' : 'Assistant conversation history'}</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {isRTL ? 'متزامن فورًا مع أيقونة المساعد أسفل الشاشة' : 'Synced instantly with the floating assistant'}
            </div>
          </div>
          <button className="btn btn-primary" onClick={newConversation} style={{ padding: '0.45rem 0.7rem', fontSize: '0.75rem' }}>
            <Plus size={14} /> {isRTL ? 'محادثة جديدة' : 'New chat'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, .8fr) minmax(0, 2.2fr)', gap: '0.75rem', minHeight: 220 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 270, overflowY: 'auto' }}>
            {conversations.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                style={{
                  border: `1px solid ${activeConversation?.id === conversation.id ? 'var(--primary)' : 'var(--card-border)'}`,
                  background: activeConversation?.id === conversation.id ? 'var(--primary-glow)' : 'rgba(255,255,255,.02)',
                  color: 'var(--text-main)',
                  borderRadius: '0.55rem',
                  padding: '0.65rem',
                  cursor: 'pointer',
                  textAlign: 'start'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <strong style={{ fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conversation.title}</strong>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={event => { event.stopPropagation(); deleteConversation(conversation.id); }}
                    onKeyDown={event => { if (event.key === 'Enter') deleteConversation(conversation.id); }}
                    style={{ color: 'var(--danger)', flexShrink: 0 }}
                  ><Trash2 size={12} /></span>
                </div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conversation.summary}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(conversation.updatedAt).toLocaleString(isRTL ? 'ar-EG' : undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </button>
            ))}
          </div>
          <div style={{ background: 'var(--bg-darker)', borderRadius: '0.65rem', border: '1px solid var(--card-border)', padding: '0.75rem', maxHeight: 270, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {sharedMessages.map(message => (
              <div key={message.id} style={{ alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ 
                  padding: '0.55rem 0.7rem', 
                  borderRadius: '0.65rem', 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.76rem', 
                  lineHeight: 1.5, 
                  background: message.sender === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                  color: message.sender === 'user' ? '#fff' : 'var(--text-main)',
                  border: message.sender === 'user' ? 'none' : '1px solid var(--card-border)'
                }}>
                  {message.text}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2, textAlign: message.sender === 'user' ? 'right' : 'left' }}>
                  {new Date(message.createdAt || activeConversation?.updatedAt).toLocaleString(isRTL ? 'ar-EG' : undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem' }}>
        
        {/* Left Column: Generator Inputs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab !== 'chatAnalysis' && (
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
          )}

          {/* Mode Switch tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
            {[
              { id: 'objections', label: t('objectionHandler') },
              { id: 'scripts', label: t('callScriptGen') },
              { id: 'summarize', label: isRTL ? 'تلخيص الملاحظات' : 'Summarize Notes' },
              { id: 'chatAnalysis', label: t('chatAnalysisTab') }
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

          {/* Sub options if Chat Analysis */}
          {activeTab === 'chatAnalysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <style>{`
                @keyframes pulse {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(79, 70, 229, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                }
              `}</style>
              
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                {t('chatAnalysisTab')}
              </label>
              
              {/* ChatGPT styled bubbles thread preview */}
              <div style={{
                background: 'var(--bg-darker)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {chatMessages.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem 0.5rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    gap: '0.4rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      background: 'var(--primary-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      animation: 'pulse 2s infinite'
                    }}>
                      <Sparkles size={14} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', lineHeight: 1.3 }}>
                      {isRTL 
                        ? "أدخل أو الصق نص محادثة العميل بالأسفل لعرض المحادثة هنا."
                        : "Paste customer chat text below to render bubbles here."}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.sender === 'agent' ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <span style={{ 
                        fontSize: '0.65rem', 
                        color: 'var(--text-muted)', 
                        marginBottom: '0.1rem',
                        marginInlineStart: msg.sender === 'agent' ? '0' : '0.25rem',
                        marginInlineEnd: msg.sender === 'agent' ? '0.25rem' : '0'
                      }}>
                        {msg.senderName}
                      </span>
                      <div style={{
                        maxWidth: '85%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.6rem',
                        fontSize: '0.8rem',
                        lineHeight: 1.35,
                        textAlign: 'start',
                        whiteSpace: 'pre-wrap',
                        background: msg.sender === 'agent' 
                          ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' 
                          : 'var(--card-bg)',
                        color: msg.sender === 'agent' ? '#fff' : 'var(--text-main)',
                        border: msg.sender === 'agent' ? 'none' : '1px solid var(--card-border)',
                        borderBottomRightRadius: msg.sender === 'agent' ? '2px' : '0.6rem',
                        borderBottomLeftRadius: msg.sender === 'agent' ? '0.6rem' : '2px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <textarea
                rows="4"
                placeholder={t('chatAnalysisDesc')}
                value={pastedChatText}
                onChange={e => setPastedChatText(e.target.value)}
                style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', textAlign: 'start' }}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {t('selectAnalysisQuestion')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    { id: 'reply', label: t('askReply') },
                    { id: 'requirements', label: t('askRequirements') },
                    { id: 'nextsteps', label: t('askNextSteps') }
                  ].map(task => (
                    <label key={task.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: selectedTask === task.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${selectedTask === task.id ? 'var(--primary)' : 'var(--card-border)'}`,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'start'
                    }}>
                      <input 
                        type="radio" 
                        name="analysisTask" 
                        checked={selectedTask === task.id} 
                        onChange={() => setSelectedTask(task.id)} 
                        style={{ display: 'none' }}
                      />
                      <span>{task.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || (activeTab !== 'chatAnalysis' && !selectedLeadId)} style={{ marginTop: '0.5rem' }}>
            <Sparkles size={16} /> {loading ? (isRTL ? 'جاري التوليد...' : 'Generating...') : (isRTL ? 'توليد الاستجابة' : 'Generate')}
          </button>
        </div>

        {/* Right Column: AI Output */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
            {activeTab === 'objections' ? t('aiResponse') : activeTab === 'scripts' ? t('aiScript') : activeTab === 'chatAnalysis' ? (isRTL ? 'تحليل المساعد الذكي للمحادثة' : 'AI Conversation Insights') : (isRTL ? 'ملخص العميل' : 'AI Summary')}
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
