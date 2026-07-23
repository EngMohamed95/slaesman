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
      const isDubai = prompt.includes('dubai') || prompt.includes('دبي') || prompt.includes('villa') || prompt.includes('فيلا');
      const isNarjis = prompt.includes('narjis') || prompt.includes('نرجس') || prompt.includes('10%') || prompt.includes('خصم');
      
      const responseData = {
        titleAr: isDubai ? "فلل دبي هيلز الفاخرة" : isNarjis ? "عروض مشروع النرجس العقاري" : "مشروع الياسمين السكني",
        titleEn: isDubai ? "Dubai Hills Golf Villas" : isNarjis ? "Al-Narjis Special Promo" : "Al-Yasmin Smart Towers",
        subtitleAr: isDubai ? "عيش الفخامة والرفاهية بجوار ملعب الغولف" : isNarjis ? "خصم خاص 10% لفترة محدودة جداً" : "امتلك شقتك الذكية بتقسيط مريح على 7 سنوات",
        subtitleEn: isDubai ? "Experience luxury living next to the golf course" : isNarjis ? "Exclusive 10% discount for a limited time" : "Own your smart apartment with 7-year payment plans",
        ctaAr: isDubai ? "احجز موعد الزيارة الآن" : "سجل اهتمامك للحصول على الخصم",
        ctaEn: isDubai ? "Book Private Tour" : "Register to Claim Offer",
        videoScript: `[سيناريو ريلز]
1. لقطة لملعب الغولف الفسيح والفلل الفاخرة.
2. صوت المذيع: "هل تبحث عن منزل يعكس أسلوب حياتك الراقي؟"
3. لقطة للتصاميم الداخلية الإيطالية والحدائق الخاصة.
4. صوت المذيع: "نقدم لكم فلل دبي هيلز بإطلالات ساحرة ومرافق عالمية. احجز جولتك اليوم!"`,
        videoScriptEn: `[Reels Video Script]
1. Wide shot of the golf course and luxury villas.
2. Voiceover: "Looking for a home that defines premium living?"
3. Close-up of the Italian architecture and private pool.
4. Voiceover: "Welcome to Dubai Hills Villas. Contact us to schedule a tour today."`,
        pdfTitle: isDubai ? "كتيب فلل دبي هيلز السكني" : "كتيب عروض النرجس الخاصة",
        pdfTitleEn: isDubai ? "Dubai Hills Golf Villas Guide" : "Al-Narjis Residence Booklet",
        pdfDeveloper: isDubai ? "إعمار العقارية" : "النخبة للتطوير العقاري",
        pdfDeveloperEn: isDubai ? "Emaar Properties" : "Elite Developers",
        pdfDescription: isDubai ? "مجموعة حصرية من الفلل الفاخرة التي توفر بيئة عائلية مثالية ومناظر خضراء مذهلة." : "مشروع سكني متكامل يقدم شققاً عصرية بأسعار استثنائية مع خصومات حصرية للمشترين الأوائل.",
        pdfDescriptionEn: isDubai ? "An exclusive cluster of signature villas offering absolute privacy and beautiful green landscapes." : "A modern residential community offering premium apartments with special launching discounts.",
        pdfSpecs: [
          { label: "الموقع", val: isDubai ? "دبي هيلز إستيت" : "الرياض - النرجس" },
          { label: "نوع الوحدات", val: isDubai ? "فلل مستقلة 4-6 غرف" : "شقق 3 غرف وبنتهاوس" },
          { label: "الضمان", val: "15 سنة على الهيكل والتسريبات" },
          { label: "التسليم", val: "جاهز للسكن / قيد الإنشاء" }
        ],
        pdfSpecsEn: [
          { label: "Location", val: isDubai ? "Dubai Hills Estate" : "Riyadh - Al-Narjis" },
          { label: "Unit Types", val: isDubai ? "Standalone 4-6 BR Villas" : "3 BR Apartments" },
          { label: "Warranty", val: "15 Years structural warranty" },
          { label: "Delivery", val: "Ready to move / Under construction" }
        ],
        pdfAmenities: isDubai 
          ? ["ملعب غولف عالمي 18 حفرة", "حدائق ومسارات ركض خاصة", "نادٍ صحي وسبا فاخر", "حراسة أمنية ذكية 24/7"]
          : ["مسبح عائلي دافئ", "مركز لياقة بدنية مجهز", "مواقف قبو مغطاة لكل شقة", "منطقة ألعاب أطفال مؤمنة"],
        pdfAmenitiesEn: isDubai
          ? ["18-hole championship golf course", "Private parks and running tracks", "Luxury clubhouse & spa", "24/7 smart security access"]
          : ["Heated family swimming pool", "Equipped fitness center", "Dedicated basement parking lots", "Safe children play zone"],
        pdfPaymentPlan: [
          { step: "عند الحجز والتعاقد", pct: "10%", desc: "عربون تأكيد حجز الوحدة" },
          { step: "أثناء البناء / الدفعة الثانية", pct: "20%", desc: "موزعة حسب نسب الإنجاز" },
          { step: "عند الاستلام وطوال 7 سنوات", pct: "70%", desc: "أقساط سنوية مريحة بدون فوائد" }
        ],
        pdfPaymentPlanEn: [
          { step: "Upon Booking", pct: "10%", desc: "Reservation deposit payment" },
          { step: "During Construction", pct: "20%", desc: "Linked to build milestones" },
          { step: "On Handover & 7 Years", pct: "70%", desc: "Interest-free yearly installments" }
        ],
        calendar: [
          { day: "الأحد", platform: "Instagram", topic: "فيديو جولة داخلية في الفلل الجديدة وإبراز الإطلالات" },
          { day: "الثلاثاء", platform: "TikTok", topic: "نصائح لاختيار العقار المناسب للاستثمار العائلي" },
          { day: "الخميس", platform: "WhatsApp", topic: "منشور العرض الخاص وخطة الدفع الميسرة" }
        ],
        calendarEn: [
          { day: "Sunday", platform: "Instagram", topic: "Interior design tour video of the show villa" },
          { day: "Tuesday", platform: "TikTok", topic: "Tips on choosing high-yield family real estate" },
          { day: "Thursday", platform: "WhatsApp", topic: "Special promo payment plan details layout sheet" }
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
        service: isArabic ? "شقة 3 غرف في وسط الرياض" : "3-Bedroom Apartment in Downtown Riyadh",
        budget: 850000,
        interestLevel: "High",
        suggestions: isArabic
          ? "• أرسل للعميل بروشور شقة وسط الرياض بالواتساب.\n• أرسل له مقارنة الأسعار وخطة التقسيط على 7 سنوات.\n• حدد موعد اتصال هاتفي غداً في تمام الساعة 5 مساءً."
          : "• Send the Downtown Riyadh brochure via WhatsApp.\n• Share the 7-year installment comparisons list.\n• Schedule a follow-up call tomorrow at 5 PM."
      };
      return JSON.stringify(responseData);
    }
  }

  // 1. Objection Handler Prompts
  if (prompt.includes('objection') || prompt.includes('Objection') || prompt.includes('اعتراض') || systemInstruction.includes('objection')) {
    const isPrice = prompt.includes('expensive') || prompt.includes('Price') || prompt.includes('سعر') || prompt.includes('السعر');
    const isThink = prompt.includes('think') || prompt.includes('consult') || prompt.includes('تفكير') || prompt.includes('شريكي');
    const isLocation = prompt.includes('location') || prompt.includes('far') || prompt.includes('موقع') || prompt.includes('بعيد');
    
    if (isPrice) {
      return isArabic
        ? `✨ **صيغة معالجة اعتراض السعر المرتفع:**

"أهلاً بك يا سيد أحمد، أتفهم تماماً أن السعر يمثل جانباً هاماً في قرارك. لكن بخصوص هذا المشروع تحديداً، القيمة الاستثمارية للمتر هنا هي الأعلى نمواً في الرياض نظراً لقربها من البنية التحتية الجديدة ومحطة المترو. بالإضافة إلى ذلك، نحن نقدم اليوم خطة سداد ميسرة جداً تمتد لـ 7 سنوات بدون فوائد، مما يجعل الدفعة الشهرية مريحة للغاية وتقلل العبء المالي. 

ما رأيك لو نقوم بجدولة اتصال سريع غداً لنطلعك على تفاصيل خطة السداد المناسبة لتدفقاتك النقدية؟"`
        : `✨ **Objection Handling (Price too High):**

"Hello Ahmad, I completely understand that price is a major factor in your decision. However, in this specific project, the investment value per meter is the fastest growing in Riyadh due to its proximity to the new infrastructure and Metro station. Furthermore, we are offering a flexible 7-year payment plan with zero interest, making the monthly installments very manageable.

Would you be open for a brief call tomorrow to explore a custom payment structure that aligns with your cash flows?"`;
    }
    
    if (isThink) {
      return isArabic
        ? `✨ **صيغة معالجة اعتراض (أحتاج للتفكير / استشارة شريكي):**

"أتفهم قرارك تماماً يا سيد أحمد، فقرار الشراء العقاري هو قرار استراتيجي وكبير. لمساعدتك أنت وشريكك في اتخاذ القرار الأنسب، يسعدني تزويدك بملف الجدوى الاستثمارية الشامل والمخططات الهندسية التفصيلية عبر الواتساب لتستعرضوها معاً. 

ما هي النقاط المحددة التي ترغب في مراجعتها مع شريكك لكي أوفّر لك تفاصيل قانونية أو فنية دقيقة عنها لتسهيل نقاشكم؟"`
        : `✨ **Objection Handling (Need time to think/consult):**

"I completely respect that, Ahmad. Purchasing real estate is a major strategic decision. To assist you and your partner in reviewing the options, I would be glad to share our comprehensive investment yield study and floor plans via WhatsApp.

What specific areas or concerns would you like to review with your partner so I can provide the exact legal or technical data to help in your discussion?"`;
    }
    
    if (isLocation) {
      return isArabic
        ? `✨ **صيغة معالجة اعتراض (الموقع بعيد جداً):**

"ملاحظتك في مكانها يا سيد أحمد، قد يبدو الموقع بعيداً عن وسط المدينة الحالي. ولكن الاستثمار العقاري الناجح يعتمد على الشراء في مناطق النمو المستقبلية قبل اكتمال الخدمات وارتفاع الأسعار. هذا الموقع يقع مباشرة في مسار التوسع العمراني المعتمد، وخلال عامين فقط عند اكتمال الخدمات سيرتفع سعر المتر بنسبة لا تقل عن 35%. الشراء الآن هو الفرصة الحقيقية لتحقيق عوائد رأسمالية ممتازة.

هل يناسبك القيام بزيارة ميدانية سريعة للموقع غداً لنريك التطورات الفعلية على الأرض؟"`
        : `✨ **Objection Handling (Location is too far):**

"That's a very valid point, Ahmad. It might seem far from the current city center. However, successful real estate investment relies on buying in future growth zones before infrastructure is completed and prices skyrocket. This location is directly in the path of approved urban expansion, and in just two years, property value is projected to rise by at least 35%. 

Would you be available for a brief site visit tomorrow so we can show you the actual construction progress on the ground?"`;
    }
    
    // Default rent fallback objection
    return isArabic
      ? `✨ **صيغة معالجة اعتراض (الإيجار أفضل من الشراء حالياً):**

"وجهة نظر محترمة يا سيد أحمد، ولكن عند حسابها استثمارياً: الإيجار هو مصروف شهري مستمر يذهب بالكامل دون استعادة أي جزء منه. بينما الشراء -خاصة مع خطط الدفع الميسرة التي نقدمها وبدون دفعة أولى ضخمة- يتيح لك تحويل قيمة الإيجار إلى أقساط تبني لك أصل عقاري ملكك يرتفع سعره سنوياً. أنت تدفع لنفسك ولعائلتك بدلاً من الدفع للمؤجر.

ما رأيك لو نراجع مقارنة مالية سريعة غداً توضح الفرق بين الإيجار والشراء لهذا العقار؟"`
      : `✨ **Objection Handling (Renting is better):**

"I appreciate your perspective, Ahmad. However, looking at it financially: rent is a recurring cost with zero return. On the other hand, buying - especially with our flexible zero-interest plans - turns those monthly outlays into equity in a valuable property that appreciates yearly. You are paying towards your own asset instead of the landlord's.

Would you like to review a quick financial comparison tomorrow showing the savings of owning vs renting this property?"`;
  }

  // 2. Cold Call Scripts
  if (prompt.includes('script') || prompt.includes('Script') || prompt.includes('سيناريو') || systemInstruction.includes('script')) {
    return isArabic
      ? `### 📞 سيناريو المكالمة الهاتفية المقترح للمتابعة:

**المرحلة الأولى: التحية وبناء الألفة والتذكير**
"السلام عليكم سيد أحمد، أتمنى أن تكون بصحة جيدة. معك [اسمك] من شركة المبيعات العقارية. تواصلت معك سابقاً بخصوص شقتنا المميزة ذات الثلاث غرف في وسط الرياض..."

**المرحلة الثانية: خطاف التغذية الراجعة والاستكشاف**
"أردت الاطمئنان ما إذا كان لديك الوقت لمراجعة بروشور المشروع والأسعار التي أرسلتها لك عبر الواتساب؟ وما هي أكثر الميزات التي نالت إعجابك في تصميم الشقة وموقعها؟"

**المرحلة الثالثة: خطاف الاستعجال والعرض الحصري**
"أردت إبلاغك أيضاً أننا أطلقنا اليوم عرضاً خاصاً لفترة محدودة يشمل خصماً 5% على الدفعة الأولى مع إمكانية تقسيط الدفعة بشكل مريح جداً. الوحدات المميزة تنفد سريعاً، هل يناسبك حجز موعد زيارة للموقع غداً لمعاينة الشقة على الطبيعة؟"`
      : `### 📞 Suggested Cold Call Script for Follow-up:

**Stage 1: Greeting, Rapport & Reminder**
"Hello Ahmad, I hope you are having a wonderful day. This is [Your Name] from the Real Estate sales team. I am following up on the 3-Bedroom apartment in Downtown Riyadh we discussed earlier..."

**Stage 2: Feedback Hook**
"I wanted to check if you had a chance to review the project brochures and layouts I shared on WhatsApp? Which features did you find most appealing for your family?"

**Stage 3: Urgency Hook & Call to Action**
"Also, I wanted to let you know that we just launched a limited-time offer this week with a 5% discount on the down payment. Premium units are selling fast. Would tomorrow morning work for a quick site visit to view the unit in person?"`;
  }

  // 3. Summarize Leads
  if (prompt.includes('Summarize') || prompt.includes('summarize') || prompt.includes('لخص') || prompt.includes('تلخيص')) {
    return isArabic
      ? `📝 **ملخص حالة العميل والخطوة القادمة:**

- **اسم العميل:** أحمد السعيد
- **العقار المهتم به:** شقة 3 غرف في وسط الرياض
- **الميزانية المتاحة:** 850,000 ريال
- **الحالة الحالية:** مهتم (الاهتمام عالي)
- **ملاحظات المتابعة:** يفضل التواصل عبر الواتساب بدلاً من المكالمات خلال ساعات العمل الرسمية.

💡 **الخطوة القادمة المقترحة:** 
أرسل له ملف تفاصيل خطة السداد المرنة عبر الواتساب، وركز على توضيح قيمة القسط الشهري المنخفض لتشجيعه على اتخاذ قرار الحجز المبدئي.`
      : `📝 **Lead Notes Summary & Next Best Action:**

- **Client Name:** Ahmad Al-Saeed
- **Interested Service:** 3-Bedroom Apartment in Downtown Riyadh
- **Available Budget:** $850,000
- **Current Status:** Interested (High Interest Level)
- **Agent Notes:** Prefers WhatsApp messages over direct calls during business hours.

💡 **Suggested Next Step:**
Send him the detailed flexible payment plan via WhatsApp, emphasizing the low monthly installment rate to encourage him to book a viewing.`;
  }

  // 4. Chat Analysis
  if (prompt.includes('chatAnalysis') || prompt.includes('transcript') || prompt.includes('Transcript') || prompt.includes('محادثة') || prompt.includes('تحليل')) {
    return isArabic
      ? `📝 **نتائج تحليل المحادثة بالذكاء الاصطناعي:**
- **اسم العميل المستخلص:** أحمد السعيد
- **الخدمة المطلوبة:** شقة 3 غرف
- **الميزانية المقدرة:** 850,000 ريال
- **الهاتف المستخلص:** +966501234567
- **تقييم المساعد الذكي:** العميل مهتم جداً ويبحث عن تفاصيل خطط السداد.

💬 **الرد المقترح لإرساله للعميل:**
"أهلاً بك يا سيد أحمد، يسعدنا جداً اهتمامك بمشروع شقق وسط الرياض. نوفر لك خيارات سداد مرنة تمتد لـ 7 سنوات وبقسط شهري ميسر. هل يناسبك اتصال سريع غداً لمناقشة التفاصيل؟"`
      : `📝 **AI Conversation Analysis Results:**
- **Client Name:** Ahmad Al-Saeed
- **Target Property:** 3-Bedroom Apartment
- **Budget:** $850,000
- **Phone Number:** +966501234567
- **AI Evaluation:** Lead is highly interested and actively looking for payment plans.

💬 **Suggested Follow-up Message:**
"Hi Ahmad, thank you for your interest in our Downtown Riyadh apartments. We offer flexible payment plans up to 7 years with low installments. Would tomorrow work for a quick call to discuss?"`;
  }

  // 5. SWOT and general strategic reports
  if (prompt.includes('SWOT') || prompt.includes('Strategic') || prompt.includes('تقرير') || prompt.includes('التحليل')) {
    return isArabic 
      ? `## 📊 التقرير الاستراتيجي الذكي للمبيعات (وضع المحاكاة والتجربة)

### 1. نظرة عامة على الأداء
ميزانية المبيعات النشطة قوية جداً وتبلغ **13,800,000 ريال**. معدل التحويل الحالي هو **16%**، وهو معدل جيد ولكنه بحاجة للتطوير من خلال تسريع التواصل مع العملاء الجدد.

### 2. نقاط الاختناق في قمع المبيعات
- عدد كبير من العملاء في مرحلة **"مهتم"** دون اتخاذ إجراءات واضحة.
- هناك تأخر في التواصل مع العملاء ذوي الميزانيات المرتفعة.

### 3. تحليل SWOT
| نقاط القوة (Strengths) | نقاط الضعف (Weaknesses) |
| :--- | :--- |
| • ميزانية صفقات عالية جداً (فيلا دبي هيلز)<br>• التنوع في قنوات جلب العملاء | • تأخير المتابعة لبعض العملاء الجدد<br>• معدل تحويل منخفض نسبياً (16%) |
| **الفرص (Opportunities)** | **التهديدات (Threats)** |
| • استغلال منصة إنستغرام لزيادة المبيعات<br>• تفعيل حملات الواتساب الجماعية للعملاء المهتمين | • خسارة العملاء لصالح المنافسين بسبب بطء الرد<br>• تراكم المهام غير المكتملة |

### 4. توصيات عملية وخطوات قادمة
- 📞 **تواصل فوراً مع سارة كونر** لإتمام صفقة الفيلا الفاخرة (4.2 مليون).
- 💬 **أرسل رسالة تذكير لأحمد السعيد** بخصوص خطط الدفع لشقة وسط الرياض.`
      : `## 📊 AI Strategic Sales Report (Simulation Mode)

### 1. Performance Overview
Active sales pipeline is very strong, totaling **$13,800,000**. The current conversion rate is **16%**, which is healthy but needs improvement by speed-up follow-ups.

### 2. Funnel Bottlenecks
- Too many leads in "Interested" stage without clear next steps.
- Delay in contacting high-value deals.

### 3. SWOT Analysis
| Strengths | Weaknesses |
| :--- | :--- |
| • High budget deals available (Dubai Hills Villa)<br>• Diverse lead generation channels | • Slow follow-ups on some new leads<br>• Relatively low conversion rate (16%) |
| **Opportunities** | **Threats** |
| • Leveraging Instagram campaigns for more leads<br>• Running bulk WhatsApp follow-ups | • Losing leads to competitors due to slow response<br>• Accumulating uncompleted tasks |

### 4. Actionable Next Steps
- 📞 **Call Sarah Connor immediately** to close the Luxury Villa deal ($4.2M).
- 💬 **Send WhatsApp payment plans to Ahmad Al-Saeed** for the 3-Bedroom apartment.`;
  }

  // Floating assistant default responses
  if (prompt.includes('active') || prompt.includes('صفقاتي') || prompt.includes('النشطة')) {
    return isArabic
      ? "أهلاً بك! لديك حالياً 5 صفقات نشطة في النظام بإجمالي قيمة 13.8 مليون ريال. الصفقات الأكثر أهمية هي صفقة سارة كونر (قريب من الاتفاق) وأحمد السعيد (مهتم). أنصحك بجدولة متابعة معهما اليوم."
      : "Hello! You have 5 active deals in your CRM with a total pipeline value of $13.8M. The most promising deals are Sarah Connor (Close to Deal) and Ahmad Al-Saeed (Interested). I suggest reaching out to them today.";
  }

  if (prompt.includes('tip') || prompt.includes('نصيحة')) {
    return isArabic
      ? "نصيحة اليوم 💡: العميل يشتري دائماً بالاستناد إلى العاطفة أولاً ثم يبرر ذلك بالمنطق. ركز على كيف سيشعر العميل بالراحة أو التميز عند امتلاك العقار بدلاً من التركيز فقط على الأرقام الفنية للمشروع."
      : "Sales Tip of the Day 💡: Clients buy on emotion first, then justify with logic. Focus on how the client will feel secure or prestigious owning the property, rather than just technical specifications.";
  }

  if (prompt.includes('highest') || prompt.includes('أعلى')) {
    return isArabic
      ? "صاحب الميزانية الأعلى في نظامك هي سارة كونر بميزانية قدرها 4,200,000 ريال لفيلا فاخرة في دبي هيلز. حالتها الحالية هي 'قريب من إتمام الصفقة' وهي بانتظار مسودة العقد اليوم."
      : "The lead with the highest budget in your CRM is Sarah Connor with a budget of $4,200,000 for a Luxury Villa in Dubai Hills. Her status is 'Close to Deal' and she is waiting for the sales contract today.";
  }

  return isArabic
    ? "أهلاً بك! هذا رد محاكاة تجريبي لأن مفتاح Gemini المدخل غير صالح. لتفعيل الإجابات الحقيقية الذكية من جوجل، يرجى تزويدنا بمفتاح API صحيح يبدأ بـ AIzaSy من منصة Google AI Studio."
    : "Hello! This is a mock simulation response because the entered Gemini API key is not valid. To enable live AI intelligence, please enter a valid API key starting with AIzaSy from Google AI Studio.";
};

export const callGeminiApi = async (prompt, systemInstruction = '', returnJson = false) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('API Key is missing');
  }

  // Proactive Fallback: If it's a mock token or doesn't start with AIzaSy, use Simulation Mode directly
  if (!apiKey.startsWith('AIzaSy')) {
    return getSimulatedResponse(prompt, systemInstruction, returnJson);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        {
          text: systemInstruction
        }
      ]
    };
  }

  if (returnJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text.trim();
  } catch (err) {
    console.warn("Gemini API direct call failed, falling back to simulated mode.", err);
    // If anything fails (like a network issue or key error), return the simulated response
    return getSimulatedResponse(prompt, systemInstruction, returnJson);
  }
};
