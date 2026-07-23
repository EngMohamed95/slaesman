import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import UpgradePaywall from '../components/UpgradePaywall';
import { isGeminiActive, callGeminiApi } from '../utils/gemini';
import { 
  Sparkles, Calendar, FileText, Compass, Send, 
  Paperclip, X, Download, Play, Square, Image, FileDown, Check 
} from 'lucide-react';

const INITIAL_CONTENT = {
  imageTitle: "شقة أحلامك في وسط الرياض",
  imageTitleEn: "Your Dream Apartment in Downtown Riyadh",
  imageBody: "3 غرف نوم | خطط سداد ممتدة على 7 سنوات بدون فوائد",
  imageBodyEn: "3 Bedrooms | 7-Year interest-free payment plans",
  imageCTA: "احجز زيارتك الآن",
  imageCTAEn: "Book Your Visit Now",
  imageBadge: "عرض محدود",
  imageBadgeEn: "Limited Offer",
  
  videoTitle: "مشروع الياسمين السكني",
  videoTitleEn: "Al-Yasmin Residential Project",
  videoScriptText: `[سيناريو ريلز/تيك توك - مدة 45 ثانية]

[المشهد 1: تبدأ الكاميرا بلقطة جوية لمبنى فاخر حديث]
الصوت: "هل تبحث عن سكن يجمع بين الهدوء ووسط الرياض؟"

[المشهد 2: لقطة سريعة لغرفة المعيشة الفسيحة ذات النوافذ الكبيرة]
الصوت: "مرحباً بك في مشروع الياسمين. شقق 3 غرف بتوزيع ذكي وتشطيبات فاخرة."

[المشهد 3: مقطع للمندوب يبتسم ويوضح خطط الدفع]
الصوت: "والأفضل؟ يمكنك الشراء بدفعة أولى 10% فقط وتقسيط الباقي على 7 سنوات بدون فوائد."

[المشهد 4: شاشة ختامية مع معلومات التواصل]
الصوت: "لا تفوت الفرصة، تواصل معنا اليوم بالضغط على الرابط في البايو!"`,
  videoScriptTextEn: `[Reels/TikTok Script - 45 Seconds]

[Scene 1: Aerial view of modern luxury building]
Audio: "Looking for a home that combines peace with city center convenience?"

[Scene 2: Quick cut to spacious living room with large glass windows]
Audio: "Welcome to Al-Yasmin Towers. Premium 3-bedroom layouts with floor-to-ceiling glass."

[Scene 3: Sales agent pointing to a flexible financing chart]
Audio: "The best part? Reserve with a 10% down payment and split the rest over 7 interest-free years."

[Scene 4: Closing slide with contact details]
Audio: "Units are selling fast. Click the link in bio to book your tour today!"`,
  
  pdfTitle: "مشروع النخبة السكني - الدليل التعريفي",
  pdfTitleEn: "Elite Residence Project - Buyer's Guide",
  pdfDeveloper: "إيليت العقارية",
  pdfDeveloperEn: "Elite Properties",
  pdfDescription: "يقع مشروع النخبة في أرقى مناطق شمال الرياض، ويتميز بتصاميم عصرية ومرافق متكاملة تضمن الرفاهية والراحة لجميع أفراد الأسرة.",
  pdfDescriptionEn: "Situated in the prime district of North Riyadh, Elite Residence provides state-of-the-art architectures and premium facilities ensuring luxury living for your family.",
  pdfSpecs: [
    { label: "الموقع", val: "شمال الرياض - النرجس" },
    { label: "نوع الوحدات", val: "شقق فاخرة وبنتهاوس" },
    { label: "فترة الضمان", val: "10 سنوات على الهيكل الإنشائي" },
    { label: "موعد التسليم", val: "الربع الرابع من 2027" }
  ],
  pdfSpecsEn: [
    { label: "Location", val: "North Riyadh - Al-Narjis" },
    { label: "Unit Types", val: "Luxury Apartments & Penthouses" },
    { label: "Warranty", val: "10 Years on structural works" },
    { label: "Delivery Date", val: "Q4 2027" }
  ],
  pdfAmenities: [
    "صالة ألعاب رياضية مجهزة بالكامل",
    "مسبح مغطى خاص بالبناية",
    "نظام حراسة وكاميرات مراقبة 24/7",
    "مواقف سيارات أرضية خاصة بكل شقة",
    "منطقة ألعاب أطفال مؤمنة"
  ],
  pdfAmenitiesEn: [
    "Fully equipped fitness gymnasium",
    "Private indoor swimming pool",
    "24/7 smart security & CCTV surveillance",
    "Dedicated underground parking lots",
    "Safe kids playground zone"
  ],
  pdfPaymentPlan: [
    { step: "الدفعة الأولى", pct: "10%", desc: "عند حجز الوحدة وكتابة العقد" },
    { step: "الدفعة الثانية", pct: "10%", desc: "بعد 6 أشهر من الحجز" },
    { step: "أقساط شهرية", pct: "80%", desc: "على مدار 7 سنوات بدون فوائد" }
  ],
  pdfPaymentPlanEn: [
    { step: "Down Payment", pct: "10%", desc: "Upon reservation and contract signature" },
    { step: "Second Payment", pct: "10%", desc: "6 months after booking" },
    { step: "Monthly Installments", pct: "80%", desc: "Distributed over 7 interest-free years" }
  ],
  
  calendar: [
    { day: "الأحد", platform: "Instagram/LinkedIn", topic: "مقارنة أسعار العقار وعائد الاستثمار في الرياض" },
    { day: "الثلاثاء", platform: "TikTok/Snapchat", topic: "فيديو ريلز: نصائح لتجنب أخطاء الشراء العقاري" },
    { day: "الخميس", platform: "WhatsApp Status", topic: "تصميم صورة العرض المحدود لخطط التقسيط" }
  ],
  calendarEn: [
    { day: "Sunday", platform: "Instagram/LinkedIn", topic: "Real estate price comparisons & yields inside Riyadh" },
    { day: "Tuesday", platform: "TikTok/Snapchat", topic: "Short Video: How to calculate net yields & avoid hidden fees" },
    { day: "Thursday", platform: "WhatsApp Status", topic: "Limited installment promotion image overlay" }
  ]
};

export default function SocialGeneratorPage() {
  const { t, isRTL } = useLanguage();
  const { validateFeatureAccess } = useApp();

  if (!validateFeatureAccess('socialCreator')) {
    return (
      <UpgradePaywall 
        requiredPlan="Pro" 
        featureNameAr="استوديو صناعة المحتوى العقاري" 
        featureNameEn="AI Real Estate Content Studio" 
      />
    );
  }

  // Active view states
  const [activeTab, setActiveTab] = useState('image'); // image, video, pdf, calendar
  const [imageFormat, setImageFormat] = useState('post'); // post (1:1), story (9:16)
  const [videoFormat, setVideoFormat] = useState('story'); // post (1:1), story (9:16)
  const [pdfPage, setPdfPage] = useState(1); // 1: Cover, 2: Specs, 3: Pricing

  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: isRTL 
        ? "أهلاً بك في استوديو المحتوى العقاري الذكي! 🎨\n\nيمكنك إرفاق ملف مواصفات المشروع بالأسفل، أو الدردشة معي مباشرة لتحديد تفاصيل المحتوى والأسلوب، وسأقوم بتوليد الصور والسيناريوهات والبروشورات بصيغة PDF فوراً."
        : "Welcome to the AI Real Estate Content Studio! 🎨\n\nUpload your project specification documents below, or chat with me to outline your concepts. I will instantly build custom social designs, scripts, and PDF brochures for you."
    }
  ]);

  // Content states
  const [loadingOutput, setLoadingOutput] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(INITIAL_CONTENT);

  // Video Caption player simulation
  const [isPlaying, setIsPlaying] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Dynamic Captions list based on current video
  const videoCaptions = isRTL ? [
    "هل تبحث عن سكن يجمع بين الهدوء ووسط الرياض؟",
    "مرحباً بك في مشروعنا العقاري الجديد.",
    "شقق وفلل بتصميم عصري وتشطيبات فاخرة جداً.",
    "بدفعة أولى ميسرة وأقساط ممتدة تصل لـ 7 سنوات.",
    "تواصل معنا اليوم أو اضغط الرابط أسفل لمزيد من التفاصيل!"
  ] : [
    "Looking for a home that combines peace with convenience?",
    "Welcome to our premium residential project.",
    "Luxury layout designs with high-end modern finishings.",
    "Secure today with flexible payments over 7 interest-free years.",
    "Contact us today or click the link below for more details!"
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Video captions player interval loop
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCaptionIndex(prev => (prev + 1) % videoCaptions.length);
      }, 2500);
    } else {
      clearInterval(interval);
      setCaptionIndex(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoCaptions]);

  // Helper: update outputs based on chat prompt keywords
  const updateGeneratedContent = (keyword) => {
    const isAr = isRTL;
    
    // Al-Narjis 10% promo
    if (keyword.includes('نرجس') || keyword.includes('narjis') || keyword.includes('10%') || keyword.includes('خصم')) {
      setGeneratedContent({
        ...INITIAL_CONTENT,
        imageTitle: "مشروع النرجس السكني - عرض خاص",
        imageTitleEn: "Al-Narjis Residence - Special Offer",
        imageBody: "خصم فوري 10% على الدفعات الأولى هذا الأسبوع فقط",
        imageBodyEn: "Instant 10% discount on initial bookings this week only",
        imageBadge: "خصم 10%",
        imageBadgeEn: "10% OFF",
        
        videoTitle: "خصومات مشروع النرجس",
        videoTitleEn: "Al-Narjis Project Discounts",
        videoScriptText: isAr 
          ? `[سيناريو ريلز/تيك توك - عرض خصم 10% النرجس]\n\n[المشهد 1: لقطة مقربة للمندوب يحمل لافتة خصم 10%]\nالصوت: "عايز توفر 10% من قيمة شقتك الجديدة؟ اسمع العرض ده..."\n\n[المشهد 2: جولة سريعة داخل شقق العرض المجهزة]\nالصوت: "أطلقنا عرضاً خاصاً في حي النرجس شمال الرياض. خصم 10% على الوحدات المتبقية."\n\n[المشهد 3: لقطة لمواقف السيارات والمرافق]\nالصوت: "العرض ساري حتى نهاية الأسبوع فقط. لا تضيع فرصة العمر."\n\n[المشهد 4: دعوة للتواصل]\nالصوت: "ارسل رسالة خاصة واحجز موعد المعاينة الآن!"`
          : `[Reels/TikTok Script - Al-Narjis 10% Promo]\n\n[Scene 1: Close up of agent holding a 10% discount banner]\nAudio: "Want to save 10% instantly on your next home? Listen to this..."\n\n[Scene 2: Quick tour inside Al-Narjis show apartment]\nAudio: "We just launched a limited promo in Al-Narjis, North Riyadh: 10% off on all remaining apartments."\n\n[Scene 3: View of building lobby and amenities]\nAudio: "This is valid until this Sunday. Secure your flat today."\n\n[Scene 4: Call to action]\nAudio: "DM us '10' and our agent will send pricing schedules immediately!"`,
          
        pdfTitle: "كتيب عرض مشروع النرجس - خصم 10%",
        pdfTitleEn: "Al-Narjis Special Offer Brochure - 10% Off",
        pdfDescription: "تفاصيل العرض الخاص وحسابات التوفير لمشروع النرجس السكني شمال الرياض بخصم 10% لفترة محدودة.",
        pdfDescriptionEn: "Special incentive details and payment breakdown for Al-Narjis Residence in North Riyadh with a 10% immediate discount.",
        pdfSpecs: [
          { label: "الموقع", val: "الرياض - حي النرجس" },
          { label: "نسبة الخصم", val: "10% على الدفعة الأولى" },
          { label: "الوحدات المشمولة", val: "شقق 3 غرف وصالات" },
          { label: "تاريخ انتهاء العرض", val: "نهاية هذا الأسبوع" }
        ],
        pdfSpecsEn: [
          { label: "Location", val: "Riyadh - Al-Narjis" },
          { label: "Discount", val: "10% on Down Payment" },
          { label: "Eligible Units", val: "3-Bedroom Apartments" },
          { label: "Expiry Date", val: "End of this week" }
        ]
      });
    }
    // Al-Yasmin Towers
    else if (keyword.includes('ياسمين') || keyword.includes('yasmin') || keyword.includes('تقسيط') || keyword.includes('installments')) {
      setGeneratedContent({
        ...INITIAL_CONTENT,
        imageTitle: "شقق الياسمين بالتقسيط المريح",
        imageTitleEn: "Al-Yasmin Apartments on Installments",
        imageBody: "دفعة حجز 10% وتقسيط الباقي على 7 سنوات بدون فوائد",
        imageBodyEn: "10% booking payment and split the rest over 7 interest-free years",
        imageBadge: "تقسيط مريح",
        imageBadgeEn: "7-Year Plan",
        
        pdfTitle: "كتيب خطة سداد مشروع الياسمين",
        pdfTitleEn: "Al-Yasmin Financing & Floor Plans",
        pdfDescription: "الملف الكامل لمخططات شقق الياسمين والجدول المالي للأقساط الممتدة على 7 سنوات بدون فوائد."
      });
    }
    // Dubai Hills luxury villas
    else if (keyword.includes('دبي') || keyword.includes('dubai') || keyword.includes('فيلا') || keyword.includes('villa')) {
      setGeneratedContent({
        ...INITIAL_CONTENT,
        imageTitle: "Luxury Villas in Dubai Hills",
        imageTitleEn: "Luxury Villas in Dubai Hills",
        imageBody: "Exclusive payment plan on golf course view villas",
        imageBodyEn: "Exclusive payment plan on golf course view villas",
        imageBadge: "Elite Luxury",
        imageBadgeEn: "Elite Luxury",
        
        videoTitle: "فلل دبي هيلز الفاخرة",
        videoTitleEn: "Dubai Hills Premium Villas Tour",
        videoScriptText: isAr 
          ? `[سيناريو ريلز/تيك توك - فلل دبي هيلز]\n\n[المشهد 1: تصوير جوي رائع لملعب الغولف وفلل دبي هيلز]\nالصوت: "هل تبحث عن أعلى درجات الفخامة في دبي؟ مرحباً بك في دبي هيلز..."\n\n[المشهد 2: تصوير للمسبح اللامتناهي والحديقة الخلفية للفيلا]\nالصوت: "فلل مستقلة بتصاميم إيطالية فاخرة وإطلالات مباشرة على ملعب الغولف العالمي."\n\n[المشهد 3: مقطع داخلي للمطبخ الإيطالي المفتوح والدرج الرخامي]\nالصوت: "تشطيبات فاخرة، مساحات واسعة، وخطة دفع ميسرة من المطور مباشرة."\n\n[المشهد 4: دعوة للتواصل بالإنستغرام]\nالصوت: "تواصل معي اليوم للحصول على كتيّب الأسعار وتفاصيل الحجز!"`
          : `[Reels/TikTok Script - Dubai Hills Premium Villas]\n\n[Scene 1: Breathtaking drone shot of Dubai Hills golf course and villas]\nAudio: "Looking for prime luxury in Dubai? Welcome to Dubai Hills..."\n\n[Scene 2: Cut to private infinity pool and landscaped garden]\nAudio: "Standalone villas featuring bespoke Italian architecture and panoramic golf course views."\n\n[Scene 3: View of internal double-height ceiling and marble staircase]\nAudio: "World-class materials, spacious bedrooms, and direct developer interest-free plans."\n\n[Scene 4: Outro call to action]\nAudio: "Send a private message to schedule a private viewing today!"`,
          
        pdfTitle: "كتيب فلل دبي هيلز الفاخرة",
        pdfTitleEn: "Dubai Hills Luxury Golf Villas Catalog",
        pdfDescription: "كتالوج المواصفات، المخططات الهندسية، والعوائد الاستثمارية لفلل دبي هيلز الفاخرة المطلة على الجولف.",
        pdfDescriptionEn: "Complete specification manual, layout blueprints, and projected rental yields for Dubai Hills Golf Villas.",
        pdfSpecs: [
          { label: "الموقع", val: "دبي - دبي هيلز" },
          { label: "المساحة", val: "تبدأ من 4,500 قدم مربع" },
          { label: "العائد المتوقع", val: "8% سنوياً" },
          { label: "التسليم", val: "جاهز للتسليم / قيد الإنشاء" }
        ],
        pdfSpecsEn: [
          { label: "Location", val: "Dubai - Dubai Hills" },
          { label: "Sizes", val: "Starting from 4,500 sqft" },
          { label: "Projected ROI", val: "8% Annually" },
          { label: "Status", val: "Ready & Under Construction" }
        ]
      });
    }
    // File upload fallback custom name
    else {
      setGeneratedContent({
        ...INITIAL_CONTENT,
        imageTitle: isAr ? `مشروع ${keyword} السكني` : `${keyword} Residence Project`,
        imageBody: isAr ? `مستخلص من ملف البيانات المرفق \`${keyword}\`` : `Generated from the attached specs file: \`${keyword}\``,
        pdfTitle: isAr ? `كتيب معلومات مشروع ${keyword}` : `${keyword} Project Specifications PDF`
      });
    }
  };

  const generateCampaignWithGemini = async (userPrompt, fileText = '') => {
    try {
      const systemInstruction = `You are a real estate creative director and marketing copywriter. Based on the user's input/chat prompt, you must generate a complete social media campaign. Return ONLY a valid JSON object matching the following structure:
{
  "imageTitle": "short catchy title in Arabic (max 5 words)",
  "imageTitleEn": "short catchy title in English (max 5 words)",
  "imageBody": "description & details in Arabic (max 12 words)",
  "imageBodyEn": "description & details in English (max 12 words)",
  "imageCTA": "call to action in Arabic (max 3 words)",
  "imageCTAEn": "call to action in English (max 3 words)",
  "imageBadge": "short badge like 'خصم 10%' or 'تقسيط مريح'",
  "imageBadgeEn": "short badge like '10% OFF' or 'Easy Plan'",
  "videoTitle": "video title in Arabic",
  "videoTitleEn": "video title in English",
  "videoScriptText": "a Reels/TikTok script in Arabic format (Scenes + Audio)",
  "videoScriptTextEn": "a Reels/TikTok script in English format (Scenes + Audio)",
  "pdfTitle": "PDF brochure title in Arabic",
  "pdfTitleEn": "PDF brochure title in English",
  "pdfDeveloper": "developer name in Arabic",
  "pdfDeveloperEn": "developer name in English",
  "pdfDescription": "brochure description in Arabic",
  "pdfDescriptionEn": "brochure description in English",
  "pdfSpecs": [
    {"label": "الموقع", "val": "value"},
    {"label": "المساحة", "val": "value"},
    {"label": "تاريخ التسليم", "val": "value"},
    {"label": "خطة السداد", "val": "value"}
  ],
  "pdfSpecsEn": [
    {"label": "Location", "val": "value"},
    {"label": "Size", "val": "value"},
    {"label": "Delivery Date", "val": "value"},
    {"label": "Payment Plan", "val": "value"}
  ],
  "pdfAmenities": [
    "amenity 1 in Arabic",
    "amenity 2 in Arabic",
    "amenity 3 in Arabic",
    "amenity 4 in Arabic",
    "amenity 5 in Arabic"
  ],
  "pdfAmenitiesEn": [
    "amenity 1 in English",
    "amenity 2 in English",
    "amenity 3 in English",
    "amenity 4 in English",
    "amenity 5 in English"
  ],
  "pdfPaymentPlan": [
    {"step": "الدفعة الأولى", "pct": "value", "desc": "value"},
    {"step": "الدفعة الثانية", "pct": "value", "desc": "value"},
    {"step": "عند التسليم", "pct": "value", "desc": "value"}
  ],
  "pdfPaymentPlanEn": [
    {"step": "Down Payment", "pct": "value", "desc": "value"},
    {"step": "Second Installment", "pct": "value", "desc": "value"},
    {"step": "On Handover", "pct": "value", "desc": "value"}
  ],
  "calendar": [
    {"day": "الأحد", "platform": "Instagram", "topic": "topic in Arabic"},
    {"day": "الثلاثاء", "platform": "TikTok", "topic": "topic in Arabic"},
    {"day": "الخميس", "platform": "WhatsApp", "topic": "topic in Arabic"}
  ],
  "calendarEn": [
    {"day": "Sunday", "platform": "Instagram", "topic": "topic in English"},
    {"day": "Tuesday", "platform": "TikTok", "topic": "topic in English"},
    {"day": "Thursday", "platform": "WhatsApp", "topic": "topic in English"}
  ]
}`;
      
      let fullPrompt = `Generate a campaign for this request: "${userPrompt}".`;
      if (fileText) {
        fullPrompt += `\nHere are the project details from the uploaded document:\n${fileText}`;
      }

      const responseText = await callGeminiApi(fullPrompt, systemInstruction, true);
      const data = JSON.parse(responseText);
      
      setGeneratedContent(data);

      const replyText = isRTL 
        ? `ممتاز! قمت بتحليل تفاصيل طلبك وتوليد تصاميم وصور جديدة، بالإضافة لسيناريو فيديو كامل وبروشور PDF للعملاء، وتقويم نشر مخصص للحملة. يمكنك استعراضها وتصديرها الآن من اللوحة الجانبية.`
        : `Excellent! I have compiled your request and generated custom social post graphics, TikTok/Reels video scripts, printable client PDF specifications, and a target publishing calendar. Review the tabs on the right side.`;

      setChatHistory(prev => [...prev, { sender: 'ai', text: replyText }]);
      setLoadingOutput(false);
      return true;
    } catch (err) {
      console.error('Gemini content studio failed:', err);
      return false;
    }
  };

  // Chat message submit handler
  const handleChatSubmit = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setLoadingOutput(true);

    if (isGeminiActive()) {
      const success = await generateCampaignWithGemini(userText);
      if (success) return;
    }

    setTimeout(() => {
      // Analyze input keywords
      const query = userText.toLowerCase();
      let replyText = '';
      
      if (query.includes('نرجس') || query.includes('narjis') || query.includes('خصم') || query.includes('10%')) {
        replyText = isRTL 
          ? "بالتأكيد! قمت بتحديث التصاميم العقارية وسيناريو الفيديو وكتيب الـ PDF بناءً على خصومات مشروع النرجس (خصم 10%). يمكنك معاينتها وتحميلها الآن من اللوحة الجانبية."
          : "Understood! I have updated the visual designs, Reels video script, and client PDF booklet specifically targeting the Al-Narjis 10% discount campaign. You can review them in the right panel.";
        updateGeneratedContent('narjis');
      } else if (query.includes('ياسمين') || query.includes('yasmin') || query.includes('تقسيط') || query.includes('قسط')) {
        replyText = isRTL 
          ? "حسناً! قمت بإعادة صياغة المحتوى الفني والسيناريو والكتيب لعرض شقق الياسمين بالتقسيط المريح على 7 سنوات بدون فوائد. تفضل بمراجعة التبويبات بالجانب الأيمن."
          : "Done! I have refactored the image layout, reels teleprompter text, and PDF brochure to emphasize Al-Yasmin's 7-year flexible payment plans. Check the outputs panel.";
      } else if (query.includes('دبي') || query.includes('dubai') || query.includes('فيلا') || query.includes('villa')) {
        replyText = isRTL 
          ? "ممتاز! قمت بتحميل بيانات فلل دبي هيلز الفاخرة وتوليد تصاميم منشورات وسيناريو فيديو تعريفي لملعب الغولف، بالإضافة لبروشور PDF كامل للعملاء جاهز للتحميل."
          : "Excellent! I have compiled the luxury Dubai Hills Golf Villas catalog, updated the Reels preview script, and built a premium downloadable client PDF brochure.";
        updateGeneratedContent('dubai');
      } else {
        replyText = isRTL
          ? `حسناً، قمت بتحليل طلبك: "${userText}" وقمت بتحديث تصاميم الصور، نصوص السيناريوهات، وكتيب البروشور PDF العقاري بناءً على ذلك باللوحة الجانبية.`
          : `Got it! I have processed your input: "${userText}" and dynamically updated the image layouts, video script directions, and client PDF brochure structures on the right.`;
        updateGeneratedContent(userText);
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: replyText }]);
      setLoadingOutput(false);
    }, 1200);
  };

  // Drag and drop / File upload trigger
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameClean = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
    setChatHistory(prev => [...prev, { 
      sender: 'user', 
      text: isRTL ? `📎 قمت بتحميل ملف البيانات: \`${file.name}\`` : `📎 Uploaded project specifications file: \`${file.name}\`` 
    }]);
    
    setLoadingOutput(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileText = event.target.result;

      if (isGeminiActive()) {
        const success = await generateCampaignWithGemini(`Campaign from spec sheet ${file.name}`, fileText);
        if (success) return;
      }

      setTimeout(() => {
        const aiReply = isRTL
          ? `تم استلام وتحليل ملف مواصفات المشروع \`${file.name}\` بنجاح! 
لقد استخلصت تفاصيل الخدمة وقمت بتوليد التصاميم الإعلانية، سيناريو الفيديو للريلز، وكتيب البروشور الـ PDF المخصص للمبيعات. يمكنك استعراضها وتحميلها من التبويبات باليمين.`
          : `Specifications file \`${file.name}\` has been parsed successfully!
I have extracted project highlights and generated target social designs, a reels script, and a downloadable PDF sales brochure. Feel free to inspect and export them in the right column.`;
        
        setChatHistory(prev => [...prev, { sender: 'ai', text: aiReply }]);
        updateGeneratedContent(fileNameClean);
        setLoadingOutput(false);
      }, 1500);
    };
    reader.readAsText(file);
  };

  // Canvas Image Exporter
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = imageFormat === 'post' ? 800 : 800;
    canvas.height = imageFormat === 'post' ? 800 : 1422;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Circle
    ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 3, 0, Math.PI * 2);
    ctx.fill();

    // Secondary decorative glow ring
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // App Branding Header
    ctx.fillStyle = '#06b6d4';
    ctx.font = '800 24px Cairo, Arial';
    ctx.textAlign = 'center';
    ctx.fillText("SALESMATE AI - CONTENT STUDIO", canvas.width / 2, 80);

    // Badge Pill
    const badgeText = isRTL ? generatedContent.imageBadge : generatedContent.imageBadgeEn;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.fillRect(canvas.width / 2 - 100, 140, 200, 45);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width / 2 - 100, 140, 200, 45);
    
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px Cairo, Arial';
    ctx.fillText(badgeText, canvas.width / 2, 170);

    // Title
    const titleText = isRTL ? generatedContent.imageTitle : generatedContent.imageTitleEn;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Cairo, Arial';
    ctx.fillText(titleText, canvas.width / 2, canvas.height / 2 - 40);

    // Subtitle
    const bodyText = isRTL ? generatedContent.imageBody : generatedContent.imageBodyEn;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Cairo, Arial';
    
    // Simple wrap text logic for subtitle if it's long
    if (bodyText.length > 35) {
      const parts = bodyText.split('|');
      if (parts.length > 1) {
        ctx.fillText(parts[0].trim(), canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(parts[1].trim(), canvas.width / 2, canvas.height / 2 + 70);
      } else {
        ctx.fillText(bodyText, canvas.width / 2, canvas.height / 2 + 30);
      }
    } else {
      ctx.fillText(bodyText, canvas.width / 2, canvas.height / 2 + 30);
    }

    // Call To Action button
    const ctaText = isRTL ? generatedContent.imageCTA : generatedContent.imageCTAEn;
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height - 150, 300, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Cairo, Arial';
    ctx.fillText(ctaText, canvas.width / 2, canvas.height - 112);

    // Trigger File Download
    const link = document.createElement('a');
    link.download = `salesmate_${imageFormat}_design.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Video Script TXT Exporter
  const handleDownloadScript = () => {
    const textContent = isRTL ? generatedContent.videoScriptText : generatedContent.videoScriptTextEn;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `video_script_${generatedContent.videoTitle.replace(/\s+/g, '_')}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // PDF Booklet simulated printer/downloader
  const handleDownloadPDF = () => {
    const isAr = isRTL;
    const docTitle = isAr ? generatedContent.pdfTitle : generatedContent.pdfTitleEn;
    const dev = isAr ? generatedContent.pdfDeveloper : generatedContent.pdfDeveloperEn;
    const desc = isAr ? generatedContent.pdfDescription : generatedContent.pdfDescriptionEn;
    const specs = isAr ? generatedContent.pdfSpecs : generatedContent.pdfSpecsEn;
    const amenities = isAr ? generatedContent.pdfAmenities : generatedContent.pdfAmenitiesEn;
    const payment = isAr ? generatedContent.pdfPaymentPlan : generatedContent.pdfPaymentPlanEn;

    let content = `========================================================\n`;
    content += `         PROPOSAL DOCUMENT: ${docTitle.toUpperCase()}\n`;
    content += `========================================================\n\n`;
    content += `DEVELOPER / AGENT: ${dev}\n`;
    content += `DATE: ${new Date().toLocaleDateString()}\n\n`;
    content += `SUMMARY DESCRIPTION:\n${desc}\n\n`;
    
    content += `TECHNICAL SPECIFICATIONS:\n`;
    specs.forEach(s => {
      content += `- ${s.label}: ${s.val}\n`;
    });
    
    content += `\nKEY AMENITIES:\n`;
    amenities.forEach(a => {
      content += `[x] ${a}\n`;
    });

    content += `\nPAYMENT AND INSTALLMENTS STRUCTURE:\n`;
    payment.forEach(p => {
      content += `- ${p.step}: ${p.pct} - ${p.desc}\n`;
    });
    
    content += `\n========================================================\n`;
    content += `           GENERATE VIA SALESMATE CONTENT STUDIO        \n`;
    content += `========================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `brochure_${docTitle.replace(/\s+/g, '_')}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    alert(isAr ? 'تم تنزيل كتيب البروشور كملف مستند مخصص للعملاء!' : 'Client Brochure PDF/Text booklet downloaded successfully!');
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--secondary)' }} /> 
          {isRTL ? "استوديو صناعة المحتوى بالذكاء الاصطناعي" : t('socialStudioTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          {isRTL ? "دردش مع المساعد الذكي، ارفع بيانات المشروع، وولد تصاميم الصور والفيديوهات والبروشورات لعملائك فوراً." : t('socialStudioSubtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }} className="grid-responsive">
        
        {/* Left Column: Conversational Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Chat Container Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
              <Compass size={16} style={{ color: 'var(--secondary)' }} />
              {isRTL ? "محادثة مساعد المحتوى الذكي" : t('chatWithAI')}
            </h3>

            {/* Messages Thread bubbles */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingRight: '0.25rem',
              marginBottom: '1rem'
            }}>
              {chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {msg.sender === 'user' ? (isRTL ? 'أنت' : 'You') : (isRTL ? 'مساعد المحتوى' : 'AI Assistant')}
                  </span>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'start',
                    background: msg.sender === 'user' 
                      ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' 
                      : 'rgba(255,255,255,0.04)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                    borderBottomRightRadius: msg.sender === 'user' ? '2px' : '0.75rem',
                    borderBottomLeftRadius: msg.sender === 'user' ? '0.75rem' : '2px',
                    border: msg.sender !== 'user' ? '1px solid var(--card-border)' : 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggested prompts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem', textAlign: 'start' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isRTL ? "أفكار مقترحة سريعة للتوجيه:" : t('suggestedQuestions')}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {[
                  { labelAr: "خصم 10% بمشروع النرجس", labelEn: "10% off at Al-Narjis", query: "صمم منشور لخصم 10% بمشروع النرجس" },
                  { labelAr: "شقق الياسمين بالتقسيط", labelEn: "Al-Yasmin installments", query: "اكتب اسكريبت فيديو عن شقق الياسمين بالتقسيط" },
                  { labelAr: "فلل دبي هيلز الفاخرة", labelEn: "Dubai Hills Premium Villas", query: "أنشئ بروشور لفلل دبي هيلز الفاخرة" }
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap', borderRadius: '9999px' }}
                    onClick={() => {
                      setChatInput(prompt.query);
                    }}
                  >
                    {isRTL ? prompt.labelAr : prompt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload Widget */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--card-border)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                {isRTL ? "إرفاق ملف مواصفات المشروع/الخدمة (.txt)" : t('uploadSpecs')}
              </span>
              <input 
                type="file" 
                accept=".txt,.json,.doc,.docx"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }} 
              />
              <button 
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={12} />
                {isRTL ? "رفع ملف" : "Browse"}
              </button>
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder={isRTL ? "اكتب توجيهاتك لصانع المحتوى هنا..." : "Type custom instructions for AI content creator..."}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                <Send size={16} />
              </button>
            </form>

          </div>
        </div>

        {/* Right Column: Creative Outputs Studio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Creative Studio Tabs Header */}
          <div className="card" style={{ padding: '0.5rem', display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
            {[
              { id: 'image', label: isRTL ? 'تصميم صورة (بوست/ستوري)' : t('tabImage'), icon: <Image size={15} /> },
              { id: 'video', label: isRTL ? 'فيديو وسيناريوهات' : t('tabVideo'), icon: <Compass size={15} /> },
              { id: 'pdf', label: isRTL ? 'بروشور PDF للعملاء' : t('tabPDF'), icon: <FileText size={15} /> },
              { id: 'calendar', label: isRTL ? 'تقويم النشر الأسبوعي' : t('tabCalendar'), icon: <Calendar size={15} /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  boxShadow: activeTab === tab.id ? undefined : 'none'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {loadingOutput ? (
              <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="loader-spinner" style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: 'var(--secondary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {isRTL ? "يقوم المساعد الذكي بتحديث التصاميم والمخرجات..." : "Updating assets in Content Studio..."}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. IMAGE DESIGN PREVIEW TAB */}
                {activeTab === 'image' && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image size={16} style={{ color: 'var(--secondary)' }} />
                        {isRTL ? "معاينة تصميم المنشور الاجتماعي" : t('draftPost')}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                        <button 
                          className="btn" 
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: imageFormat === 'post' ? 'var(--primary)' : 'transparent',
                            color: '#fff'
                          }}
                          onClick={() => setImageFormat('post')}
                        >
                          {isRTL ? "مربع (1:1)" : "Post (1:1)"}
                        </button>
                        <button 
                          className="btn" 
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: imageFormat === 'story' ? 'var(--primary)' : 'transparent',
                            color: '#fff'
                          }}
                          onClick={() => setImageFormat('story')}
                        >
                          {isRTL ? "قصة (9:16)" : "Story (9:16)"}
                        </button>
                      </div>
                    </div>

                    {/* Canvas/Styled Preview Card wrapper */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem' }}>
                      
                      {/* Interactive CSS Design Board Mockup */}
                      <div style={{
                        width: '100%',
                        maxWidth: imageFormat === 'post' ? '300px' : '230px',
                        aspectRatio: imageFormat === 'post' ? '1/1' : '9/16',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        textAlign: 'start'
                      }}>
                        {/* Decorative circle glow */}
                        <div style={{
                          position: 'absolute',
                          width: '150px',
                          height: '150px',
                          borderRadius: '50%',
                          background: 'rgba(6, 182, 212, 0.1)',
                          filter: 'blur(30px)',
                          top: '10%',
                          left: '10%'
                        }} />
                        
                        {/* Branding Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                          <span style={{ fontSize: '0.6rem', color: 'var(--secondary)', fontWeight: 800, letterSpacing: '0.05em' }}>
                            SALESMATE AI
                          </span>
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '999px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.55rem',
                            fontWeight: 'bold',
                            color: '#f59e0b'
                          }}>
                            {isRTL ? generatedContent.imageBadge : generatedContent.imageBadgeEn}
                          </span>
                        </div>

                        {/* Title and body info */}
                        <div style={{ zIndex: 2, marginY: 'auto' }}>
                          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                            {isRTL ? generatedContent.imageTitle : generatedContent.imageTitleEn}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.4 }}>
                            {isRTL ? generatedContent.imageBody : generatedContent.imageBodyEn}
                          </p>
                        </div>

                        {/* Call to Action Button mockup */}
                        <div style={{ zIndex: 2 }}>
                          <div style={{
                            width: '100%',
                            background: '#4f46e5',
                            color: '#fff',
                            borderRadius: '0.35rem',
                            padding: '0.45rem',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                          }}>
                            {isRTL ? generatedContent.imageCTA : generatedContent.imageCTAEn}
                          </div>
                        </div>

                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={handleDownloadImage} style={{ width: '100%' }}>
                        <Download size={14} />
                        {isRTL ? "تحميل التصميم الفني (PNG)" : t('downloadDesign')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. VIDEO SCRIPT & TELEPROMPTER TAB */}
                {activeTab === 'video' && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Compass size={16} style={{ color: 'var(--primary)' }} />
                        {isRTL ? "معاينة سيناريو وتلقين الفيديو" : t('videoScript')}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                        <button 
                          className="btn" 
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: videoFormat === 'post' ? 'var(--primary)' : 'transparent',
                            color: '#fff'
                          }}
                          onClick={() => setVideoFormat('post')}
                        >
                          {isRTL ? "مربع (1:1)" : "Square (1:1)"}
                        </button>
                        <button 
                          className="btn" 
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: videoFormat === 'story' ? 'var(--primary)' : 'transparent',
                            color: '#fff'
                          }}
                          onClick={() => setVideoFormat('story')}
                        >
                          {isRTL ? "ريلز/قصة (9:16)" : "Reels (9:16)"}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }} className="grid-responsive">
                      
                      {/* Video Player cover mockup */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '100%',
                          maxWidth: videoFormat === 'post' ? '220px' : '170px',
                          aspectRatio: videoFormat === 'post' ? '1/1' : '9/16',
                          background: '#111827',
                          border: '2px solid rgba(255,255,255,0.1)',
                          borderRadius: '0.75rem',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
                        }}>
                          {/* Mock background vector image/glow */}
                          <div style={{
                            position: 'absolute',
                            width: '120%',
                            height: '120%',
                            background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, rgba(6,182,212,0.1) 60%, #111827 100%)',
                            zIndex: 1
                          }} />

                          {/* Play/Pause Button */}
                          <button 
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={{
                              width: '3.5rem',
                              height: '3.5rem',
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)',
                              border: '2px solid #fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              cursor: 'pointer',
                              zIndex: 3,
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {isPlaying ? (
                              <div style={{ width: '12px', height: '18px', borderLeft: '4px solid #fff', borderRight: '4px solid #fff', display: 'flex' }} />
                            ) : (
                              <Play size={20} style={{ marginInlineStart: '4px' }} />
                            )}
                          </button>

                          {/* Live captions subtitle overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: '10%',
                            left: '5%',
                            right: '5%',
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '0.35rem',
                            color: '#fff',
                            fontSize: '0.75rem',
                            lineHeight: 1.3,
                            textAlign: 'center',
                            zIndex: 3
                          }}>
                            {isPlaying ? videoCaptions[captionIndex] : (isRTL ? "اضغط تشغيل لتشغيل التلقين التجريبي" : "Click Play to preview teleprompter")}
                          </div>

                          {/* Phone overlay details */}
                          <div style={{ position: 'absolute', left: '10px', bottom: '10px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#fff' }}>@SalesMateAI</span>
                            <span style={{ fontSize: '0.55rem', color: '#9ca3af' }}>{isRTL ? "موسيقى ترويجية عقارية" : "Real estate background audio"}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {isPlaying ? (isRTL ? "🔴 جار تشغيل معاينة الفيديو" : "🔴 Playing simulated video") : (isRTL ? "الفيديو متوقف" : "Video player paused")}
                        </span>
                      </div>

                      {/* Video Script directions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'start' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {isRTL ? "نص وسيناريو المشاهد بالتفصيل:" : "Detailed Audio/Visual Cues"}
                        </label>
                        <textarea
                          rows="8"
                          readOnly
                          value={isRTL ? generatedContent.videoScriptText : generatedContent.videoScriptTextEn}
                          style={{
                            fontSize: '0.8rem',
                            lineHeight: 1.6,
                            fontFamily: 'inherit',
                            background: 'rgba(0,0,0,0.2)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-main)',
                            padding: '0.75rem'
                          }}
                        />
                      </div>

                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={handleDownloadScript} style={{ flex: 1 }}>
                        {isRTL ? "تحميل سيناريو الفيديو (TXT)" : t('downloadScript')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. CLIENT PDF BROCHURE TAB */}
                {activeTab === 'pdf' && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} style={{ color: 'var(--secondary)' }} />
                        {isRTL ? "معاينة كتيب الـ PDF للعميل" : t('pdfBooklet')}
                      </h3>
                      
                      {/* Document Page Browser Navigation */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[
                          { page: 1, label: isRTL ? "الغلاف" : "Cover" },
                          { page: 2, label: isRTL ? "المواصفات والميزات" : "Specs" },
                          { page: 3, label: isRTL ? "خطة السداد" : "Financing" }
                        ].map(p => (
                          <button
                            key={p.page}
                            type="button"
                            className="btn"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              background: pdfPage === p.page ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                              color: '#fff',
                              border: '1px solid var(--card-border)'
                            }}
                            onClick={() => setPdfPage(p.page)}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PDF page content rendering */}
                    <div style={{
                      background: 'white',
                      color: '#1f2937',
                      borderRadius: '0.75rem',
                      padding: '2rem 1.5rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                      minHeight: '280px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textAlign: 'start',
                      fontFamily: 'Cairo, sans-serif'
                    }}>
                      
                      {/* PAGE 1: COVER */}
                      {pdfPage === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', flex: 1 }}>
                          <div style={{ borderBottom: '2px solid #4f46e5', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4f46e5', letterSpacing: '0.1em' }}>
                              SALESMATE REAL ESTATE MARKETING
                            </span>
                            <h2 style={{ margin: '0.5rem 0 0', color: '#111827', fontSize: '1.4rem', fontWeight: 800 }}>
                              {isRTL ? generatedContent.pdfTitle : generatedContent.pdfTitleEn}
                            </h2>
                          </div>

                          <div style={{ marginY: 'auto', padding: '0.5rem 0' }}>
                            <p style={{ color: '#4b5563', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                              {isRTL ? generatedContent.pdfDescription : generatedContent.pdfDescriptionEn}
                            </p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            <div>
                              <strong>{isRTL ? "المطور عقاري:" : "Developer:"}</strong> {isRTL ? generatedContent.pdfDeveloper : generatedContent.pdfDeveloperEn}
                            </div>
                            <div>
                              <strong>{isRTL ? "تاريخ الإصدار:" : "Date:"}</strong> {new Date().toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PAGE 2: SPECS AND AMENITIES */}
                      {pdfPage === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 700 }}>
                              {isRTL ? "المواصفات الفنية للوحدات:" : "Technical Specifications"}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              {(isRTL ? generatedContent.pdfSpecs : generatedContent.pdfSpecsEn).map((s, idx) => (
                                <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', gap: '0.25rem' }}>
                                  <span style={{ color: '#6b7280', fontWeight: 'bold' }}>{s.label}:</span>
                                  <span style={{ color: '#1f2937' }}>{s.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 700 }}>
                              {isRTL ? "الميزات والخدمات المرفقة:" : "Amenities & Lifestyle Facilities"}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                              {(isRTL ? generatedContent.pdfAmenities : generatedContent.pdfAmenitiesEn).map((a, idx) => (
                                <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#374151' }}>
                                  <span style={{ color: '#10b981', display: 'flex' }}><Check size={12} strokeWidth={3} /></span>
                                  <span>{a}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PAGE 3: PAYMENT PLANS */}
                      {pdfPage === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 700 }}>
                            {isRTL ? "الهيكل المالي وجدول خطة السداد:" : "Flexible Payment Schedule"}
                          </h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                              <tr style={{ background: '#f3f4f6', textAlign: 'start' }}>
                                <th style={{ padding: '0.4rem', border: '1px solid #e5e7eb', color: '#374151' }}>{isRTL ? "المرحلة" : "Milestone"}</th>
                                <th style={{ padding: '0.4rem', border: '1px solid #e5e7eb', color: '#374151' }}>{isRTL ? "النسبة" : "Percentage"}</th>
                                <th style={{ padding: '0.4rem', border: '1px solid #e5e7eb', color: '#374151' }}>{isRTL ? "الوصف" : "Details"}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(isRTL ? generatedContent.pdfPaymentPlan : generatedContent.pdfPaymentPlanEn).map((p, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: '0.4rem', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#111827' }}>{p.step}</td>
                                  <td style={{ padding: '0.4rem', border: '1px solid #e5e7eb', color: '#4f46e5', fontWeight: 'bold' }}>{p.pct}</td>
                                  <td style={{ padding: '0.4rem', border: '1px solid #e5e7eb', color: '#4b5563' }}>{p.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.35rem', padding: '0.5rem', fontSize: '0.7rem', color: '#1e40af', marginTop: '0.5rem' }}>
                            {isRTL 
                              ? "ملاحظة: تتوفر خيارات مرنة لتعديل الدفعات بناءً على الاتفاق الفردي للعميل مع إدارة المبيعات."
                              : "Note: Custom installment restructuring is available based on individual purchase agreements."}
                          </div>
                        </div>
                      )}

                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={handleDownloadPDF} style={{ width: '100%' }}>
                        <FileDown size={14} />
                        {isRTL ? "تنزيل كتيب البروشور PDF" : t('downloadPDF')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. WEEKLY PUBLISH CALENDAR TAB */}
                {activeTab === 'calendar' && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: 'var(--accent)' }} />
                        {isRTL ? "تقويم النشر وجدولة المحتوى الأسبوعي" : t('contentCalendar')}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(isRTL ? generatedContent.calendar : generatedContent.calendarEn).map((cal, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem', 
                            padding: '0.75rem 1rem', 
                            borderRadius: '0.5rem', 
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid var(--card-border)',
                            textAlign: 'start'
                          }}
                        >
                          <div style={{ width: '80px', fontWeight: 'bold', color: 'var(--accent)' }}>{cal.day}</div>
                          <div style={{ width: '130px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <Square size={10} style={{ fill: 'var(--text-muted)' }} />
                            <span>{cal.platform}</span>
                          </div>
                          <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-main)' }}>{cal.topic}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
