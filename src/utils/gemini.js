const MOCK_KEY = 'DEMO_MOCK_GEMINI_KEY';

export const getGeminiApiKey = () => {
  const saved = localStorage.getItem('salesmate_gemini_api_key');
  return saved || MOCK_KEY;
};

export const setGeminiApiKey = (key) => {
  if (key) {
    localStorage.setItem('salesmate_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('salesmate_gemini_api_key');
  }
};

export const isGeminiActive = () => {
  return !!getGeminiApiKey();
};

const getSimulatedResponse = (prompt, systemInstruction, returnJson = false) => {
  const isArabic = /[\u0600-\u06FF]/.test(prompt) || prompt.toLowerCase().includes('arabic') || prompt.includes('العربية') || (systemInstruction && /[\u0600-\u06FF]/.test(systemInstruction));
  
  // JSON format requested (For CRM WhatsApp Chat Analysis or Social Creator Studio)
  if (returnJson) {
    // 1. Social Content Studio campaign JSON
    if (prompt.includes('pdfTitle') || prompt.includes('calendar') || prompt.includes('videoScript') || prompt.includes('Campaign') || prompt.includes('Generate') || prompt.includes('generate')) {
      const isERP = prompt.includes('erp') || prompt.includes('برنامج') || prompt.includes('نظام') || prompt.includes('software');
      
      const responseData = {
        titleAr: isERP ? "نظام إدارة المبيعات والمؤسسات السحابي" : "حزمة خدمات زيادة المبيعات والتسويق",
        titleEn: isERP ? "Enterprise Cloud ERP System" : "Sales & Marketing Growth Package",
        subtitleAr: isERP ? "حلول متكاملة لأتمتة المبيعات وتوفير 30% من المصاريف" : "خصم خاص 10% لفترة محدودة جداً لزيادة صفقاتك",
        subtitleEn: isERP ? "Complete automation to save 30% operational costs" : "Exclusive 10% discount to boost your deal velocity",
        ctaAr: "احصل على استشارة وسعر خاص اليوم",
        ctaEn: "Claim Special Offer & Demo Today",
        videoScript: `[سيناريو ريلز إعلاني]
1. لقطة سريعة للمشكلة والتحدي الذي يواجه رجال المبيعات والشركات.
2. صوت المذيع: "هل تعاني من ضياع العملاء وعدم تنظيم متابعة الصفقات؟"
3. لقطة لعرض الميزات والنتائج الفورية والمبيعات المتضاعفة.
4. صوت المذيع: "نقدم لكم المنصة الذكية المتكاملة بخصم خاص اليوم. تواصل معنا فوراً!"`,
        videoScriptEn: `[Reels Video Script]
1. Fast-paced hook showing sales chaos and lost follow-ups.
2. Voiceover: "Struggling to follow up and close pending deals on time?"
3. Show clean dashboard, instant WhatsApp generation, and ROI analytics.
4. Voiceover: "Try AdToDeal AI today with a special limited-time promo code!"`,
        pdfTitle: isERP ? "كتيب النظام الإداري والسحابي" : "الملف التعريفي بحلول زيادة المبيعات",
        pdfTitleEn: isERP ? "Enterprise ERP System Guide" : "Sales Growth Solutions Booklet",
        pdfDeveloper: "AdToDeal Solutions",
        pdfDeveloperEn: "AdToDeal Solutions",
        pdfDescription: "حلول مبيعات وتطور متكاملة تساعد الشركات والأفراد على أتمتة الرسائل والمتابعات وتوليد صفقات ناجحة.",
        pdfDescriptionEn: "All-in-one growth ecosystem designed to help sales teams and businesses automate follow-ups and close deals faster.",
        pdfSpecs: [
          { label: "نوع الخدمة", val: "منصة سحابية متكاملة الذكاء الاصطناعي" },
          { label: "التوافق", val: "الواتساب، الموبايل، الحاسوب، والمتصفحات" },
          { label: "الضمان", val: "دعم فني 24/7 وتحديثات مستمرة" },
          { label: "التفعيل", val: "فوري وبدون تعقيدات تقنية" }
        ],
        pdfSpecsEn: [
          { label: "Service Type", val: "AI-Powered Sales & CRM Ecosystem" },
          { label: "Compatibility", val: "WhatsApp Web, Mobile, Desktop" },
          { label: "Support", val: "24/7 Priority Support & Updates" },
          { label: "Activation", val: "Instant activation, zero code setup" }
        ],
        pdfAmenities: [
          "توليد رسائل الواتساب مجهزة تلقائياً",
          "مساعد الذكاء الاصطناعي 24/7 لحل الاعتراضات",
          "نظام إدارة صفقات Kanban مخصص",
          "تقارير وإحصائيات دقيقة للإيرادات"
        ],
        pdfAmenitiesEn: [
          "Prefilled 1-click WhatsApp Message Builder",
          "24/7 AI Objection Handler & Pitch Copilot",
          "Customizable Sales Kanban Pipeline",
          "Real-time ROI & Sales Revenue Analytics"
        ],
        pdfPaymentPlan: [
          { step: "عند بدء الاستخدام", pct: "0%", desc: "تجربة مجانية وبدون بطاقة ائتمان" },
          { step: "الباقة الشهرية", pct: "100%", desc: "اشتراك ميسر بدعم كامل" }
        ],
        pdfPaymentPlanEn: [
          { step: "On Signup", pct: "0%", desc: "Free trial, no credit card needed" },
          { step: "Monthly Subscription", pct: "100%", desc: "Affordable plan with full support" }
        ],
        calendar: [
          { day: "الأحد", platform: "Instagram", topic: "فيديو توضيحي: كيف توفر 15 ساعة أسبوعياً في متابعة العملاء" },
          { day: "الثلاثاء", platform: "TikTok", topic: "أهم 3 أخطاء تسبب ضياع الصفقات والمبيعات وطريقة حلها" },
          { day: "الخميس", platform: "WhatsApp", topic: "رسالة إرسال العرض الخاص والخصم الحصري" }
        ],
        calendarEn: [
          { day: "Sunday", platform: "Instagram", topic: "Demo Reel: Save 15 hours weekly on client follow-ups" },
          { day: "Tuesday", platform: "TikTok", topic: "3 deal-closing mistakes to avoid in your sales pipeline" },
          { day: "Thursday", platform: "WhatsApp", topic: "Promo blast template for interested leads" }
        ]
      };
      
      return JSON.stringify(responseData);
    }

    // 2. CRM WhatsApp Chat extraction JSON
    if (prompt.includes('phone') || prompt.includes('email') || prompt.includes('service') || prompt.includes('budget') || prompt.includes('suggestions')) {
      const responseData = {
        name: isArabic ? "أحمد السعيد" : "Ahmad Al-Saeed",
        phone: "+966501234567",
        email: "ahmad@example.com",
        service: isArabic ? "نظام إداري وسحابي للمؤسسات" : "Enterprise Cloud ERP System",
        budget: 85000,
        interestLevel: "High",
        suggestions: isArabic
          ? "• أرسل للعميل العرض الفني والتنفيذي بالواتساب.\n• أرسل له مقارنة الأسعار وخيارات الدفع الميسرة.\n• حدد موعد اتصال أو اجتماع غداً في تمام الساعة 5 مساءً."
          : "• Send the proposal brochure via WhatsApp.\n• Share the payment options comparison list.\n• Schedule a follow-up call tomorrow at 5 PM."
      };
      return JSON.stringify(responseData);
    }
  }

  // 1. Objection Handler Prompts
  if (prompt.includes('objection') || prompt.includes('Objection') || prompt.includes('اعتراض') || systemInstruction.includes('objection')) {
    const isPrice = prompt.includes('expensive') || prompt.includes('Price') || prompt.includes('سعر') || prompt.includes('السعر');
    const isThink = prompt.includes('think') || prompt.includes('consult') || prompt.includes('تفكير') || prompt.includes('شريكي');
    
    if (isPrice) {
      return isArabic
        ? `✨ **صيغة معالجة اعتراض السعر المرتفع:**

"أهلاً بك يا سيد أحمد، أتفهم تماماً أن السعر يمثل جانباً هاماً في قرارك. لكن بخصوص هذا العرض تحديداً، القيمة الاستثمارية والنتائج الحقيقية للخدمة تعوض التكلفة وتوفر لك ما لا يقل عن 25% من المصاريف التشغيلية شهرياً. بالإضافة إلى ذلك، نحن نقدم اليوم خطة سداد ميسرة جداً لتقليل العبء المالي. 

ما رأيك لو نقوم بجدولة اتصال سريع غداً لنطلعك على تفاصيل خطة السداد المناسبة لتدفقاتك النقدية؟"`
        : `✨ **Objection Handling (Price too High):**

"Hello Ahmad, I completely understand that price is a major factor in your decision. However, the operational savings and direct revenue boost generated by our solution deliver a rapid ROI, saving you at least 25% monthly. Furthermore, we offer flexible payment structures.

Would you be open for a brief call tomorrow to explore a custom payment plan that aligns with your cash flow?"`;
    }
    
    if (isThink) {
      return isArabic
        ? `✨ **صيغة معالجة اعتراض (أحتاج للتفكير / استشارة الشركاء):**

"أتفهم قرارك تماماً يا سيد أحمد، فقرار الشراء والتعاقد هو قرار استراتيجي مهم. لمساعدتك أنت وشركائك في اتخاذ القرار الأنسب، يسعدني تزويدك بملف الجدوى التفصيلي ومقارنة المواصفات عبر الواتساب لتستعرضوها معاً. 

ما هي النقاط المحددة التي ترغب في مراجعتها لكي أوفّر لك كافة البيانات الدقيقة لتسهيل نقاشكم؟"`
        : `✨ **Objection Handling (Need time to think/consult):**

"I completely respect that, Ahmad. Contracting is an important business decision. To assist you and your partners, I would be glad to share our detailed comparison guide and ROI summary via WhatsApp.

What specific points would you like to review so I can provide the exact data to support your decision?"`;
    }
    
    // Default fallback objection
    return isArabic
      ? `✨ **صيغة معالجة الاعتراض والتأجيل:**

"وجهة نظر محترمة يا سيد أحمد، ولكن عند حسابها تجارياً: التأجيل يعطل الفرص التنافسية والعائد السريع. بينما التعاقد الآن -خاصة مع عروضنا والتسهيلات المقدمة- يتيح لك بدء جني الأرباح فوراً وزيادة سرعة مبيعاتك.

ما رأيك لو نراجع مقارنة مالية سريعة غداً توضح العائد المتوقع لنشاطك التجاري؟"`
      : `✨ **Objection Handling (Hesitation / Delaying Decision):**

"I appreciate your perspective, Ahmad. However, delay means postponed growth and missed sales momentum. Contracting now - with our special terms - enables you to generate returns immediately.

Would you like to review a quick financial calculation tomorrow showing your projected monthly sales boost?"`;
  }

  // 2. Cold Call Scripts
  if (prompt.includes('script') || prompt.includes('Script') || prompt.includes('سيناريو') || systemInstruction.includes('script')) {
    return isArabic
      ? `### 📞 سيناريو المكالمة الهاتفية المقترح للمتابعة:

**المرحلة الأولى: التحية وبناء الألفة والتذكير**
"السلام عليكم سيد أحمد، أتمنى أن تكون بصحة جيدة. معك [اسمك] من فريق مبيعات أد تو ديل. تواصلت معك سابقاً بخصوص العرض المتميز لشراكتنا وتطوير مبيعاتك..."

**المرحلة الثانية: خطاف التغذية الراجعة والاستكشاف**
"أردت الاطمئنان ما إذا كان لديك الوقت لمراجعة الملف والميزات التي أرسلتها لك عبر الواتساب؟ وما هي أكثر النقاط التي نالت إعجابك واهتمامك؟"

**المرحلة الثالثة: خطاف الاستعجال والعرض الحصري**
"أردت إبلاغك أيضاً أننا أطلقنا اليوم عرضاً خاصاً لفترة محدودة يشمل خصماً وخدمات إضافية مجانية. هل يناسبك حجز موعد اجتماع سريع غداً لمناقشة التفاصيل؟"`
      : `### 📞 Suggested Cold Call Script for Follow-up:

**Stage 1: Greeting, Rapport & Reminder**
"Hello Ahmad, I hope you are having a wonderful day. This is [Your Name] from the sales team. I am following up on the proposal we discussed earlier..."

**Stage 2: Feedback Hook**
"I wanted to check if you had a chance to review the presentation materials I shared on WhatsApp? Which features did you find most relevant to your goals?"

**Stage 3: Urgency Hook & Call to Action**
"Also, we just launched a limited-time bonus promo this week. Would tomorrow morning work for a brief 10-minute call to finalize the package?"`;
  }

  // 3. Summarize Leads
  if (prompt.includes('Summarize') || prompt.includes('summarize') || prompt.includes('لخص') || prompt.includes('تلخيص')) {
    return isArabic
      ? `📝 **ملخص حالة العميل والخطوة القادمة:**

- **اسم العميل:** أحمد السعيد
- **الخدمة/المنتج المهتم به:** نظام إداري وسحابي للمؤسسات
- **الميزانية المتاحة:** 85,000 ريال
- **الحالة الحالية:** مهتم (الاهتمام عالي)
- **ملاحظات المتابعة:** يفضل التواصل عبر الواتساب بدلاً من المكالمات خلال ساعات العمل الرسمية.

💡 **الخطوة القادمة المقترحة:** 
أرسل له ملف تفاصيل خطة السداد المرنة عبر الواتساب، وركز على توضيح قيمة القسط المنخفض لتشجيعه على التوقيع المبدئي.`
      : `📝 **Lead Notes Summary & Next Best Action:**

- **Client Name:** Ahmad Al-Saeed
- **Interested Service:** Enterprise Cloud ERP System
- **Available Budget:** $85,000
- **Current Status:** Interested (High Interest Level)
- **Agent Notes:** Prefers WhatsApp messages over direct calls during business hours.

💡 **Suggested Next Action:**
Send the flexible payment schedule PDF on WhatsApp and highlight the low monthly installments to secure commitment.`;
  }

  // 4. Default Assistant Response
  return isArabic
    ? `أهلاً بك! بصفتي مساعد المبيعات الذكي لك، قمت بتحليل استفسارك وأقترح عليك الإجراءات التالية لتعزيز مبيعاتك:

1. **التواصل الفوري:** أرسل رسالة تذكير مخصصة للعميل عبر الواتساب تتضمن ميزات العرض الحالية.
2. **الرد على الاستفسارات:** ركز على إبراز قيمة الخدمة وتوفير الوقت والتكاليف التنافسية.
3. **تحديد موعد إغلاق:** اقترح على العميل موعداً لمكالمة أو اجتماع لحسم الصفقة وإرسال نموذج التعاقد.

هل تود أن أصيغ لك رسالة واتساب مخصصة لهذا العميل الآن؟`
    : `Hello! As your AI Sales Copilot, I analyzed your request and recommend the following actions:

1. **Immediate Outreach:** Send a prefilled personalized WhatsApp follow-up framing your value offer.
2. **Addressing Doubts:** Emphasize rapid ROI, operational time savings, and flexible payment terms.
3. **Closing Call to Action:** Offer two specific time slots tomorrow for a brief call to finalize terms.

Would you like me to draft a custom WhatsApp message or call script for this client?`;
};

export const callGeminiApi = async (prompt, systemInstruction = '', returnJson = false) => {
  const apiKey = getGeminiApiKey();

  // If using demo key, use instant offline simulated intelligence
  if (apiKey === MOCK_KEY || !apiKey) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getSimulatedResponse(prompt, systemInstruction, returnJson));
      }, 500);
    });
  }

  // Live Gemini 1.5 Flash REST Call
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction || `You are an expert AI Sales Assistant and CRM copilot. Help salespeople follow up with leads, handle price objections, write personalized WhatsApp messages, generate video scripts for Reels/TikTok, and close deals faster across any industry or business domain. Always respond in the language used by the user.`
          }
        ]
      }
    };

    if (returnJson) {
      requestBody.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("No response content received from Gemini API.");
    }

    return resultText;
  } catch (error) {
    console.warn("Gemini API call failed, falling back to simulated response:", error);
    return getSimulatedResponse(prompt, systemInstruction, returnJson);
  }
};
