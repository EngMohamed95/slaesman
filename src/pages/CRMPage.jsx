import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { isGeminiActive, callGeminiApi } from '../utils/gemini';
import { Plus, Search, Filter, MessageCircle, Phone, Eye, Trash2, Sparkles, Smartphone, X, RefreshCw } from 'lucide-react';

// Mock contacts for MacBook / phone address book fallback
const MOCK_CONTACTS = [
  { name: 'عبد الرحمن الدوسري', nameEn: 'Abdulrahman Al-Dawsari', phone: '+966509876543', email: 'a.dawsari@icloud.com', company: 'الرياض المحدودة' },
  { name: 'سارة العتيبي', nameEn: 'Sarah Al-Otaibi', phone: '+966551122334', email: 'sarah.o@gmail.com', company: 'جدة العقارية' },
  { name: 'خالد الحربي', nameEn: 'Khaled Al-Harbi', phone: '+966567788990', email: 'k.harbi@outlook.com', company: 'مستثمر مستقل' },
  { name: 'فاطمة الشمري', nameEn: 'Fatima Al-Shammeri', phone: '+966543210987', email: 'f.shammeri@domain.sa', company: 'الفهد للإنشاءات' },
  { name: 'John Doe', nameEn: 'John Doe', phone: '+15550199', email: 'john.doe@apple.com', company: 'Apple Inc.' },
  { name: 'ريم القحطاني', nameEn: 'Reem Al-Qahtani', phone: '+966532223344', email: 'reem.q@yandex.com', company: 'النهدي للتطوير' },
  { name: 'محمد الصالح', nameEn: 'Mohammad Al-Saleh', phone: '+971501234567', email: 'm.saleh@realestate.ae', company: 'دبي عقار' }
];

const MOCK_WHATSAPP_CHATS = [
  {
    id: 'w1',
    name: 'أحمد السعيد',
    phone: '+966501234567',
    lastMsg: 'عاوز أعرف أسعار شقق 3 غرف وتفاصيل التقسيط',
    time: '12:30 م',
    messages: [
      { sender: 'customer', text: 'أهلاً بك، شوفت إعلانكم على إنستغرام بخصوص شقق وسط الرياض.' },
      { sender: 'agent', text: 'مرحباً بك يا فندم! نعم متوفرة شقق فاخرة 3 غرف في قلب الرياض.' },
      { sender: 'customer', text: 'ممتاز، عاوز أعرف الأسعار وطرق السداد، ميزانيتي في حدود 850 ألف ريال.' },
      { sender: 'agent', text: 'ميزانيتكم ممتازة وتناسب خياراتنا. نوفر تقسيط على 7 سنوات بدون فوائد.' },
      { sender: 'customer', text: 'عاوز أعرف تفاصيل التقسيط والأسعار بالضبط.' }
    ]
  },
  {
    id: 'w2',
    name: 'خالد الحربي',
    phone: '+966559876543',
    lastMsg: 'هل المشروع جاهز للسكن ولا قيد الإنشاء؟ وموقعه وين بالظبط؟',
    time: '11:15 ص',
    messages: [
      { sender: 'customer', text: 'السلام عليكم، بخصوص مشروع فلل الياسمين.' },
      { sender: 'agent', text: 'وعليكم السلام ورحمة الله وبركاته. تفضل يا فندم.' },
      { sender: 'customer', text: 'هل المشروع جاهز للسكن ولا قيد الإنشاء؟ وموقعه وين بالظبط؟ ميزانيتي في حدود 2.5 مليون ريال.' }
    ]
  },
  {
    id: 'w3',
    name: 'سارة العتيبي',
    phone: '+966561122334',
    lastMsg: 'الميزانية المتاحة معي هي 1.2 مليون كحد أقصى، هل عندكم شقة تناسبني؟',
    time: 'أمس',
    messages: [
      { sender: 'customer', text: 'مرحبا، أبحث عن شقة في النرجس.' },
      { sender: 'agent', text: 'أهلاً بك يا سارة. نعم لدينا شقق 3 غرف فاخرة في النرجس.' },
      { sender: 'customer', text: 'الميزانية المتاحة معي هي 1.2 مليون كحد أقصى، هل عندكم شقة تناسبني؟' }
    ]
  },
  {
    id: 'w4',
    name: 'John Doe',
    phone: '+15550199',
    lastMsg: 'I am looking for a penthouse in Riyadh with a private pool',
    time: '21/07/2026',
    messages: [
      { sender: 'customer', text: 'Hello, do you have any penthouses available?' },
      { sender: 'agent', text: 'Hi! Yes, we have premium penthouses in central Riyadh.' },
      { sender: 'customer', text: 'Awesome. I am looking for one with a private pool, budget is around 4.5 million SAR.' }
    ]
  }
];

// Helper to parse pasted chat text into structured message bubble objects
const parseChatToMessages = (text) => {
  if (!text) return [];
  const lines = text.split('\n');
  const messages = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let sender = 'customer';
    let cleanLine = trimmed.replace(/^\[[^\]]+\]\s*/, ''); // strip timestamps like [20/06/2026, 14:15]

    // Match Name: Message or Name - Message
    const colonIndex = cleanLine.indexOf(':');
    const hyphenIndex = cleanLine.indexOf(' - ');
    let senderName = '';
    let messageText = cleanLine;

    if (colonIndex > 0) {
      senderName = cleanLine.substring(0, colonIndex).trim();
      messageText = cleanLine.substring(colonIndex + 1).trim();
    } else if (hyphenIndex > 0) {
      senderName = cleanLine.substring(0, hyphenIndex).trim();
      messageText = cleanLine.substring(hyphenIndex + 3).trim();
    }

    if (senderName) {
      const agentKeywords = ['agent', 'me', 'sales', 'salesman', 'salesmate', 'مندوب', 'أنا', 'المبيعات'];
      const isAgent = agentKeywords.some(kw => senderName.toLowerCase().includes(kw));
      sender = isAgent ? 'agent' : 'customer';
    } else {
      const agentSignals = ['سعر', 'المطور', 'عرض', 'خصم', 'الموقع', 'زيارة', 'معاينة', 'أهلاً بك', 'مرحباً بك', 'price', 'developer', 'discount'];
      const isAgent = agentSignals.some(sig => cleanLine.toLowerCase().includes(sig));
      sender = isAgent ? 'agent' : 'customer';
    }

    messages.push({
      sender,
      senderName: senderName || (sender === 'agent' ? 'AdToDeal' : 'Client'),
      text: messageText
    });
  });

  return messages;
};

// Helper parser function for WhatsApp conversation analysis
const analyzeWhatsAppChat = (text, isRTL) => {
  let name = '';
  let phone = '';
  let email = '';
  let budget = '';
  let service = '';
  let interestLevel = 'Medium';
  let suggestions = '';

  // Extract phone (9 to 15 digits, handles optional leading + or 00)
  const phoneMatch = text.match(/(?:\+?|00)?\d{9,14}/);
  if (phoneMatch) {
    phone = phoneMatch[0];
  }

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // Extract Name from lines like "العميل: أحمد" or "Customer: John" or "معك خالد"
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

  // Extract service or property type
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

  // Extract budget (e.g. ميزانية 1,500,000 or budget is 800k)
  const budgetMatch = text.match(/(?:ميزانية|الميزانية|ميزانيتي|السعر|budget|max price|around)\s*(?:هي|تكون|is)?\s*(\d+[\d,]*\s*(?:مليون|ألف|k|m|million|sar|usd)?)/i);
  if (budgetMatch) {
    let rawBudget = budgetMatch[1].replace(/,/g, '').trim();
    budget = rawBudget;
    
    // Convert text numbers to digits
    if (budget.includes('مليون') || budget.toLowerCase().includes('m')) {
      const num = parseFloat(budget);
      if (!isNaN(num)) budget = (num * 1000000).toString();
    } else if (budget.includes('ألف') || budget.toLowerCase().includes('k')) {
      const num = parseFloat(budget);
      if (!isNaN(num)) budget = (num * 1000).toString();
    }
  }

  // Interest level from text signals
  const highSignals = ['مهتم جدا', 'عاجل', 'مستعجل', 'شراء فور', 'حالا', 'very interested', 'urgent', 'buy immediately'];
  const lowSignals = ['متردد', 'أفكر', 'شريك', 'بعدين', 'not sure', 'think about it', 'maybe later'];
  
  if (highSignals.some(s => text.toLowerCase().includes(s))) {
    interestLevel = 'High';
  } else if (lowSignals.some(s => text.toLowerCase().includes(s))) {
    interestLevel = 'Low';
  }

  // Fallbacks
  if (!name) name = isRTL ? 'عميل واتساب جديد' : 'New WhatsApp Lead';
  if (!phone) phone = '+966500000000';
  if (!service) service = isRTL ? 'عقار غير محدد بعد' : 'Unspecified Property';
  if (!budget) budget = '0';

  // Construct recommendations
  if (isRTL) {
    suggestions = `1. تواصل سريع بالواتساب: أرسل له كتيب المشروع الذي طلبه (${service}).
2. مراجعة الميزانية: العميل يبحث في حدود ميزانية ${Number(budget) > 0 ? Number(budget).toLocaleString() + ' ريال' : 'غير محددة بدقة'}.
3. التوصية: تجنب الاتصال المباشر ويفضل المراسلة الكتابية في المتابعة القادمة.`;
  } else {
    suggestions = `1. Send WhatsApp brochure: Share details for the requested (${service}) project.
2. Budget Alignment: Lead is looking around ${Number(budget) > 0 ? '$' + Number(budget).toLocaleString() : 'an unspecified budget'}.
3. Action Plan: Follow up via text during off-hours as they prefer quiet messages.`;
  }

  return { name, phone, email, service, budget, interestLevel, suggestions };
};

export default function CRMPage({ setPage, setSelectedLeadId }) {
  const { leads, addLead, updateLead, deleteLead, addTask } = useCRM();
  const { t, isRTL } = useLanguage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Classification & Campaign Wizard States
  const [activeTab, setActiveTab] = useState('all'); // all, interested, followup
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [sentLeadIds, setSentLeadIds] = useState([]);
  const [campaignTemplate, setCampaignTemplate] = useState('intro');
  const [campaignText, setCampaignText] = useState(isRTL 
    ? "مرحباً أ. {name}، معك أحمد من إيليت العقارية. سعدت بالتواصل معك بخصوص اهتمامك بمشروع {service}. هل يناسبك الاتصال الهاتفي غداً الساعة 4 عصراً لمناقشة التفاصيل؟" 
    : "Hi {name}, this is Ahmad from Elite Properties. Thanks for reaching out regarding the {service}. Would a phone call tomorrow at 4 PM work to discuss the pricing structures?"
  );
  
  // Add Lead Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState('Facebook Lead');
  const [newService, setNewService] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newExpectedValue, setNewExpectedValue] = useState('');
  const [newInterestLevel, setNewInterestLevel] = useState('Medium');
  const [newStatus, setNewStatus] = useState('New');
  const [newNotes, setNewNotes] = useState('');

  // WhatsApp & Contacts Import States
  const [importMode, setImportMode] = useState(null); // 'whatsapp' or null
  const [pastedChat, setPastedChat] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Real-time chat bubbles parsing
  useEffect(() => {
    setChatMessages(parseChatToMessages(pastedChat));
  }, [pastedChat]);

  // WhatsApp Web Integration States
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [isQrScanning, setIsQrScanning] = useState(false);
  const [selectedWhatsappChatId, setSelectedWhatsappChatId] = useState('w1');

  const handleSimulateQrScan = () => {
    setIsQrScanning(true);
    setTimeout(() => {
      setIsQrScanning(false);
      setIsWhatsappConnected(true);
    }, 1800);
  };

  const handleSyncChatAnalysis = async (messagesArray, chatName, chatPhone) => {
    setIsAnalyzing(true);
    
    // Compile messages text
    const chatText = messagesArray.map(m => `${m.sender === 'customer' ? 'Customer' : 'Agent'}: ${m.text}`).join('\n');
    
    // Populate form parameters
    if (isGeminiActive()) {
      try {
        const systemInstruction = `You are a sales CRM parser assistant. Your task is to extract structured lead details from the provided WhatsApp chat transcript. Respond ONLY with a valid JSON object matching this schema:
{
  "name": "lead name in Arabic if chat is Arabic, else English",
  "phone": "lead phone number",
  "email": "lead email address or empty string",
  "service": "interested property/service",
  "budget": "budget in numbers only",
  "interestLevel": "High" or "Medium" or "Low",
  "suggestions": "Three bullet points action items for the sales agent in Arabic if chat is in Arabic, else English"
}`;
        const responseText = await callGeminiApi(chatText, systemInstruction, true);
        const result = JSON.parse(responseText);

        setNewName(result.name || chatName);
        setNewPhone(result.phone || chatPhone);
        if (result.email) setNewEmail(result.email);
        if (result.service) setNewService(result.service);
        setNewBudget(result.budget?.toString() || '0');
        setNewExpectedValue(result.budget?.toString() || '0');
        setNewInterestLevel(result.interestLevel || 'Medium');
        setNewSource('WhatsApp Sync');
        
        const finalNotes = isRTL 
          ? `[تم ربط الواتساب ويب وسحب البيانات بـ AI]:\n--- توصيات المساعد الذكي ---\n${result.suggestions}`
          : `[Conversation synced directly via WhatsApp Web by AI]:\n--- AI Suggestions ---\n${result.suggestions}`;
        setNewNotes(finalNotes);
        setAiSuggestions(result.suggestions);

        setIsAnalyzing(false);
        setImportMode(null);
        alert(isRTL ? 'تم ربط الحساب وتحليل المحادثة بنجاح وتعبئة البيانات!' : 'Account synced and conversation parsed successfully!');
        return;
      } catch (e) {
        console.warn("Gemini synced parser failed, falling back:", e);
      }
    }

    // Local fallback parsing
    setTimeout(() => {
      setNewName(chatName);
      setNewPhone(chatPhone);
      setNewBudget('850000');
      setNewExpectedValue('850000');
      setNewInterestLevel('High');
      setNewSource('WhatsApp Sync');
      setNewService(isRTL ? 'شقة 3 غرف في وسط الرياض' : '3-Bedroom Apartment in Downtown Riyadh');

      const finalSuggestions = isRTL
        ? '• إرسال بروشور شقة وسط الرياض بالواتساب.\n• جدولة مكالمة هاتفية للمتابعة غداً.\n• عرض تفاصيل خطة التقسيط على 7 سنوات.'
        : '• Send the Downtown Riyadh brochure via WhatsApp.\n• Schedule a follow-up call tomorrow.\n• Share details of the 7-year installment plan.';
      const finalNotes = isRTL 
        ? `[تم استيراد المحادثة مباشرة عبر واتساب ويب]:\n--- توصيات المساعد الذكي ---\n${finalSuggestions}`
        : `[Conversation imported directly via WhatsApp Web Sync]:\n--- AI Suggestions ---\n${finalSuggestions}`;
      setNewNotes(finalNotes);
      setAiSuggestions(finalSuggestions);

      setIsAnalyzing(false);
      setImportMode(null);
      alert(isRTL ? 'تم ربط الحساب وتحليل المحادثة وتعبئة البيانات!' : 'Account synced and conversation parsed successfully!');
    }, 1200);
  };

  // Extract unique sources for filters
  const uniqueSources = [...new Set(leads.map(l => l.source))];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      alert(isRTL ? 'الرجاء إدخال الاسم ورقم الهاتف على الأقل' : 'Please input at least Name and Phone');
      return;
    }

    const createdLead = addLead({
      name: newName,
      nameAr: newName,
      phone: newPhone,
      email: newEmail,
      source: newSource,
      sourceAr: newSource,
      service: newService,
      serviceAr: newService,
      budget: Number(newBudget) || 0,
      expectedValue: Number(newExpectedValue) || 0,
      interestLevel: newInterestLevel,
      status: newStatus,
      statusAr: isRTL ? 'جديد' : newStatus, // Fallback conversion logic
      lastContact: new Date().toISOString().split('T')[0],
      nextFollowUp: '',
      notes: newNotes,
      notesAr: newNotes
    });

    // If analyzed via WhatsApp, automatically push a task to "Today's Tasks"
    if (newSource === 'WhatsApp' && aiSuggestions) {
      addTask({
        leadId: createdLead.id,
        title: isRTL 
          ? `متابعة عميل الواتساب: إرسال الكتيب والتفاصيل لـ ${newName}`
          : `WhatsApp follow-up: Send brochure & pricing to ${newName}`,
        titleAr: `متابعة عميل الواتساب: إرسال الكتيب والتفاصيل لـ ${newName}`,
        dueDate: new Date().toISOString().split('T')[0], // Today!
        priority: newInterestLevel === 'High' ? 'High' : newInterestLevel === 'Medium' ? 'Medium' : 'Low'
      });
    }

    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewService('');
    setNewBudget('');
    setNewExpectedValue('');
    setNewNotes('');
    setImportMode(null);
    setPastedChat('');
    setAiSuggestions('');
    setContactSearchQuery('');
    setShowAddModal(false);
  };

  const handleCloseModal = () => {
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewService('');
    setNewBudget('');
    setNewExpectedValue('');
    setNewNotes('');
    setImportMode(null);
    setPastedChat('');
    setAiSuggestions('');
    setContactSearchQuery('');
    setShowAddModal(false);
  };

  const handleChatAnalysis = async () => {
    if (!pastedChat.trim()) {
      alert(isRTL ? 'الرجاء إدخال نص المحادثة أولاً' : 'Please enter chat text first');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisStep(1);

    if (isGeminiActive()) {
      try {
        setAnalysisStep(2);
        const systemInstruction = `You are a sales CRM parser assistant. Your task is to extract structured lead details from the provided WhatsApp chat transcript. Respond ONLY with a valid JSON object matching this schema:
{
  "name": "lead full name (use Arabic if chat is in Arabic, else English)",
  "phone": "lead phone number (keep digits and country code, e.g. +966500000000)",
  "email": "lead email address or empty string if not found",
  "service": "interested property/service (e.g. Apartment, 3-Bedroom Villa in Yas Island)",
  "budget": "budget in numbers only (e.g. 1500000, do not use text, if empty use 0)",
  "interestLevel": "High" or "Medium" or "Low",
  "suggestions": "Three bullet points action items for the sales agent in Arabic if chat is in Arabic, else English"
}`;
        
        const responseText = await callGeminiApi(pastedChat, systemInstruction, true);
        setAnalysisStep(3);

        const result = JSON.parse(responseText);

        setNewName(result.name || (isRTL ? 'عميل واتساب جديد' : 'New WhatsApp Lead'));
        setNewPhone(result.phone || '+966500000000');
        if (result.email) setNewEmail(result.email);
        if (result.service) setNewService(result.service);
        if (result.budget && Number(result.budget) > 0) {
          setNewBudget(result.budget.toString());
          setNewExpectedValue(result.budget.toString());
        } else {
          setNewBudget('0');
          setNewExpectedValue('0');
        }
        setNewInterestLevel(result.interestLevel || 'Medium');
        setNewSource('WhatsApp');

        const finalNotes = (isRTL 
          ? `[ملخص محادثة واتساب بالذكاء الاصطناعي الحقيقي]:\nتم استخراج البيانات بواسطة Gemini 2.5 Flash.\n\n--- توصيات المساعد الذكي ---\n${result.suggestions}`
          : `[Real AI WhatsApp Chat Summary]:\nData extracted by Gemini 2.5 Flash.\n\n--- AI Suggestions ---\n${result.suggestions}`
        );
        setNewNotes(finalNotes);
        setAiSuggestions(result.suggestions);

        setIsAnalyzing(false);
        setAnalysisStep(0);
        setImportMode(null);
        alert(isRTL ? 'تم تحليل المحادثة بالذكاء الاصطناعي وتعبئة البيانات بنجاح!' : 'Conversation analyzed by AI and data populated successfully!');
        return;
      } catch (err) {
        console.error('Gemini parsing failed, falling back to local analysis:', err);
      }
    }

    setTimeout(() => {
      setAnalysisStep(2);
      
      setTimeout(() => {
        setAnalysisStep(3);

        setTimeout(() => {
          const result = analyzeWhatsAppChat(pastedChat, isRTL);
          
          setNewName(result.name);
          setNewPhone(result.phone);
          if (result.email) setNewEmail(result.email);
          if (result.service) setNewService(result.service);
          if (result.budget) {
            setNewBudget(result.budget);
            setNewExpectedValue(result.budget);
          }
          setNewInterestLevel(result.interestLevel);
          setNewSource('WhatsApp'); // Auto-set source to WhatsApp
          
          const finalNotes = (isRTL 
            ? `[ملخص محادثة واتساب بالذكاء الاصطناعي]:\nتم استخراج البيانات من المحادثة المرفقة.\n\n--- توصيات المساعد الذكي ---\n${result.suggestions}`
            : `[AI WhatsApp Chat Summary]:\nData extracted from the attached conversation.\n\n--- AI Suggestions ---\n${result.suggestions}`
          );
          setNewNotes(finalNotes);
          setAiSuggestions(result.suggestions);

          setIsAnalyzing(false);
          setAnalysisStep(0);
          setImportMode(null); // Return to standard view with filled form
          alert(isRTL ? 'تم تحليل المحادثة وتعبئة البيانات بنجاح!' : 'Conversation analyzed and data populated successfully!');
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleContactImportClick = async () => {
    // 1. Try native Contact Picker API first
    if ('contacts' in navigator && 'select' in navigator.contacts) {
      try {
        const props = ['name', 'tel', 'email'];
        const opts = { multiple: false };
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const nameVal = contact.name ? contact.name[0] : '';
          const phoneVal = contact.tel ? contact.tel[0] : '';
          const emailVal = contact.email ? contact.email[0] : '';
          
          if (nameVal) setNewName(nameVal);
          if (phoneVal) setNewPhone(phoneVal);
          if (emailVal) setNewEmail(emailVal);
          
          alert(isRTL ? 'تم استيراد جهة الاتصال بنجاح!' : 'Contact imported successfully!');
          return;
        }
      } catch (err) {
        console.warn('Native Contacts API rejected or failed, falling back:', err);
      }
    }
    
    // 2. If native fails or is unsupported, open custom contacts drawer modal
    setShowContactsModal(true);
  };

  // Segment leads by active tab
  const tabLeads = leads.filter(lead => {
    if (activeTab === 'interested') {
      return lead.interestLevel === 'High' || lead.status === 'Interested' || lead.status === 'Close to Deal' || lead.status === 'Won';
    }
    if (activeTab === 'followup') {
      return lead.status === 'Needs Follow-up' || lead.status === 'No Response' || lead.status === 'Postponed';
    }
    if (activeTab === 'notinterested') {
      return lead.status === 'Not Interested' || lead.status === 'Lost' || lead.interestLevel === 'Low';
    }
    return true; // 'all'
  });

  // Filter tabLeads by search & status & source
  const filteredLeads = tabLeads.filter(lead => {
    const query = search.toLowerCase();
    const matchesSearch = 
      lead.name.toLowerCase().includes(query) ||
      (lead.nameAr && lead.nameAr.toLowerCase().includes(query)) ||
      lead.phone.includes(query) ||
      lead.email.toLowerCase().includes(query);

    const matchesStatus = statusFilter === '' || lead.status === statusFilter;
    const matchesSource = sourceFilter === '' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="fade-in">
      <div className="page-heading-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('navCRM')}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {isRTL ? "إدارة وتصنيف بيانات عملائك ومتابعة صفقاتك." : "Track and manage your leads list and pipelines."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {t('addLead')}
        </button>
      </div>

      {/* Classification Tabs & Bulk WhatsApp Campaign action button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '0.5rem',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--card-border)',
        borderRadius: '0.75rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { 
              id: 'all', 
              label: t('tabAllLeads'), 
              count: leads.length,
              color: 'var(--primary)',
              glow: 'var(--primary-glow)',
              activeBg: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)'
            },
            { 
              id: 'interested', 
              label: t('tabInterestedLeads'), 
              count: leads.filter(l => l.interestLevel === 'High' || l.status === 'Interested' || l.status === 'Close to Deal' || l.status === 'Won').length,
              color: 'var(--success)',
              glow: 'var(--success-glow)',
              activeBg: 'linear-gradient(135deg, var(--success) 0%, #34d399 100%)'
            },
            { 
              id: 'followup', 
              label: t('tabFollowUpLeads'), 
              count: leads.filter(l => l.status === 'Needs Follow-up' || l.status === 'No Response' || l.status === 'Postponed').length,
              color: 'var(--accent)',
              glow: 'var(--accent-glow)',
              activeBg: 'linear-gradient(135deg, var(--accent) 0%, #fbbf24 100%)'
            },
            { 
              id: 'notinterested', 
              label: isRTL ? 'العملاء غير المهتمين' : 'Not Interested', 
              count: leads.filter(l => l.status === 'Not Interested' || l.status === 'Lost' || l.interestLevel === 'Low').length,
              color: 'var(--danger)',
              glow: 'var(--danger-glow)',
              activeBg: 'linear-gradient(135deg, var(--danger) 0%, #f87171 100%)'
            }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSentLeadIds([]);
                }}
                className="btn"
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? tab.activeBg : 'rgba(255, 255, 255, 0.02)',
                  border: isActive ? `1px solid ${tab.color}` : '1px solid var(--card-border)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  boxShadow: isActive ? `0 4px 15px ${tab.glow}` : 'none',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '0.35rem',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : tab.glow,
                  color: isActive ? '#fff' : tab.color,
                  minWidth: '24px',
                  display: 'inline-block',
                  textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campaign Action Button */}
        <button
          className="btn"
          onClick={() => setShowCampaignModal(true)}
          disabled={tabLeads.length === 0}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            opacity: tabLeads.length === 0 ? 0.5 : 1,
            cursor: tabLeads.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <MessageCircle size={16} />
          <span>{t('bulkWhatsAppCampaign')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '1rem', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingInlineStart: '2.5rem' }}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('filterStatus')}</option>
            {['New', 'Contacted', 'Interested', 'Needs Follow-up', 'No Response', 'Postponed', 'Close to Deal', 'Won', 'Lost', 'Not Interested'].map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">{t('filterSource')}</option>
            {uniqueSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Desktop Table View */}
      <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('phone')} / {t('email')}</th>
                <th>{t('source')}</th>
                <th>{t('budget')}</th>
                <th>{t('status')}</th>
                <th>{t('interestLevel')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {isRTL ? "لم يتم العثور على عملاء يطابقون خيارات البحث." : "No leads found matching current criteria."}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{isRTL ? lead.nameAr : lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRTL ? lead.serviceAr : lead.service}</div>
                    </td>
                    <td>
                      <div>{lead.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td>{isRTL ? (lead.sourceAr || lead.source) : lead.source}</td>
                    <td>
                      {isRTL ? `${lead.budget.toLocaleString()} ريال` : `$${lead.budget.toLocaleString()}`}
                    </td>
                    <td>
                      <span className={`badge badge-${lead.status.toLowerCase().replace(' ', '')}`}>
                        {isRTL ? lead.statusAr : lead.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: lead.interestLevel === 'High' ? 'var(--danger)' : lead.interestLevel === 'Medium' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        {isRTL ? lead.interestLevelAr : lead.interestLevel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setPage('leadDetails');
                          }}
                          title={t('leadDetails')}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', color: 'var(--secondary)' }}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setPage('whatsapp');
                          }}
                          title={t('whatsappQuickMsg')}
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', color: 'var(--danger)' }}
                          onClick={() => {
                            if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this lead?')) {
                              deleteLead(lead.id);
                            }
                          }}
                          title={t('deleteLead')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leads Mobile Cards View */}
      <div className="mobile-only-flex" style={{ flexDirection: 'column', gap: '1rem' }}>
        {filteredLeads.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            {isRTL ? "لم يتم العثور على عملاء يطابقون خيارات البحث." : "No leads found matching current criteria."}
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {isRTL ? lead.nameAr : lead.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {isRTL ? lead.serviceAr : lead.service}
                  </div>
                </div>
                <span className={`badge badge-${lead.status.toLowerCase().replace(' ', '')}`}>
                  {isRTL ? lead.statusAr : lead.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t('budget')}</span>
                  <strong style={{ color: 'var(--success)' }}>
                    {isRTL ? `${lead.budget.toLocaleString()} ريال` : `$${lead.budget.toLocaleString()}`}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t('source')}</span>
                  <span style={{ fontWeight: 600 }}>{isRTL ? (lead.sourceAr || lead.source) : lead.source}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t('phone')}</span>
                  <span style={{ fontFamily: 'monospace' }}>{lead.phone}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t('interestLevel')}</span>
                  <span style={{ 
                    color: lead.interestLevel === 'High' ? 'var(--danger)' : lead.interestLevel === 'Medium' ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: 'bold'
                  }}>
                    {isRTL ? lead.interestLevelAr : lead.interestLevel}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setPage('leadDetails');
                  }}
                >
                  <Eye size={14} />
                  <span>{t('leadDetails')}</span>
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setPage('whatsapp');
                  }}
                >
                  <MessageCircle size={14} />
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this lead?')) {
                      deleteLead(lead.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Lead Modal Overlay */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            
            <h3 style={{ margin: '0 0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('addLead')}</span>
              <button 
                type="button" 
                onClick={handleCloseModal} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </h3>

            {/* Quick Import Panel */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--card-border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'start' }}>
                {isRTL ? 'طرق استيراد سريعة (اختياري)' : 'Quick Import Methods (Optional)'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setImportMode(importMode === 'whatsapp' ? null : 'whatsapp')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 0.25rem',
                    fontSize: '0.75rem',
                    borderColor: importMode === 'whatsapp' ? 'var(--primary)' : 'var(--card-border)',
                    background: importMode === 'whatsapp' ? 'var(--primary-glow)' : undefined
                  }}
                >
                  <MessageCircle size={14} style={{ color: '#25D366' }} />
                  <span>{isRTL ? "لصق محادثة" : "Paste Chat"}</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setImportMode(importMode === 'whatsappSync' ? null : 'whatsappSync')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 0.25rem',
                    fontSize: '0.75rem',
                    borderColor: importMode === 'whatsappSync' ? 'var(--primary)' : 'var(--card-border)',
                    background: importMode === 'whatsappSync' ? 'var(--primary-glow)' : undefined
                  }}
                >
                  <RefreshCw size={14} style={{ color: '#25D366' }} />
                  <span>{isRTL ? "ربط واتساب مباشر" : "Sync WhatsApp"}</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={handleContactImportClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 0.25rem',
                    fontSize: '0.75rem',
                    borderColor: showContactsModal ? 'var(--primary)' : 'var(--card-border)',
                    background: showContactsModal ? 'var(--primary-glow)' : undefined
                  }}
                >
                  <Smartphone size={14} style={{ color: 'var(--secondary)' }} />
                  <span>{t('importContacts')}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Import Area */}
            {importMode === 'whatsapp' && (
              <div style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                animation: 'fadeIn 0.3s ease'
              }}>
                <style>{`
                  @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(79, 70, 229, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                  }
                `}</style>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
                    {t('whatsappAnalyze')}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setImportMode(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem', textAlign: 'start' }}>
                  {t('whatsappAnalyzeDesc')}
                </p>

                {/* ChatGPT style Chat Screen View */}
                <div style={{
                  background: '#070a13',
                  border: '1px solid var(--card-border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {chatMessages.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2rem 1rem',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        background: 'var(--primary-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8',
                        animation: 'pulse 2s infinite'
                      }}>
                        <Sparkles size={18} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>
                        {isRTL ? "محلل محادثات الواتساب الذكي" : "Smart WhatsApp Conversation Analyzer"}
                      </div>
                      <div style={{ fontSize: '0.75rem', maxWidth: '320px', lineHeight: 1.4 }}>
                        {isRTL 
                          ? "الصق محادثة الواتساب بالأسفل. سيقوم المساعد بتحويلها لشكل شات واستخراج بيانات العميل تلقائياً."
                          : "Paste a WhatsApp transcript below. The assistant will format it into a chat thread and extract lead details."}
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
                          fontSize: '0.7rem', 
                          color: 'var(--text-muted)', 
                          marginBottom: '0.2rem',
                          marginInlineStart: msg.sender === 'agent' ? '0' : '0.5rem',
                          marginInlineEnd: msg.sender === 'agent' ? '0.5rem' : '0'
                        }}>
                          {msg.senderName}
                        </span>
                        <div style={{
                          maxWidth: '85%',
                          padding: '0.6rem 0.9rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.85rem',
                          lineHeight: 1.4,
                          textAlign: 'start',
                          whiteSpace: 'pre-wrap',
                          background: msg.sender === 'agent' 
                            ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' 
                            : 'rgba(255, 255, 255, 0.08)',
                          color: msg.sender === 'agent' ? '#fff' : 'var(--text-main)',
                          borderBottomRightRadius: msg.sender === 'agent' ? '2px' : '0.75rem',
                          borderBottomLeftRadius: msg.sender === 'agent' ? '0.75rem' : '2px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Open WhatsApp URL tool */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <a 
                    href="https://web.whatsapp.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <MessageCircle size={14} style={{ color: '#25D366' }} />
                    {t('openWhatsAppShortcut')}
                  </a>
                  <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '0.25rem', alignItems: 'center' }}>
                    <input 
                      type="tel" 
                      placeholder={isRTL ? "رقم الهاتف للرابط السريع..." : "Phone for quick link..."}
                      id="quickWaPhone"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    />
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const inputVal = document.getElementById('quickWaPhone').value.trim();
                        if (inputVal) {
                          const cleaned = inputVal.replace(/[+\s\-]/g, '');
                          window.open(`https://wa.me/${cleaned}`, '_blank');
                        } else {
                          window.open(`https://web.whatsapp.com`, '_blank');
                        }
                      }}
                    >
                      {isRTL ? "فتح محادثة" : "Open Chat"}
                    </button>
                  </div>
                </div>

                <textarea
                  rows="5"
                  placeholder={t('pasteChatPlaceholder')}
                  value={pastedChat}
                  onChange={e => setPastedChat(e.target.value)}
                  disabled={isAnalyzing}
                  style={{
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    textAlign: 'start'
                  }}
                />

                {isAnalyzing ? (
                  <div style={{
                    background: 'rgba(79, 70, 229, 0.05)',
                    border: '1px solid var(--primary-glow)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {t('analyzingText')}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {analysisStep === 1 && (isRTL ? "جاري قراءة الرسالة المكتوبة..." : "Reading pasted transcript...")}
                      {analysisStep === 2 && (isRTL ? "استخلاص الأسماء والأرقام والعقارات المهتم بها..." : "Extracting names, phone numbers, and properties...")}
                      {analysisStep === 3 && (isRTL ? "تقييم مستوى الاهتمام وتوليد التوصيات البيعية..." : "Assessing interest level and compiling AI suggestions...")}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => { setPastedChat(''); setImportMode(null); }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      {isRTL ? "تراجع" : "Clear"}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleChatAnalysis}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      <Sparkles size={14} />
                      {t('analyzeBtn')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Real-time Sync Simulation Area */}
            {importMode === 'whatsappSync' && (
              <div style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                animation: 'fadeIn 0.3s ease',
                textAlign: 'start'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageCircle size={16} style={{ color: '#25D366' }} />
                    {isRTL ? "مزامنة وربط واتساب ويب المباشر" : "Direct WhatsApp Web Sync"}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setImportMode(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {!isWhatsappConnected ? (
                  /* Connection Screen with QR Code */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', textAlign: 'center', gap: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0 }}>
                      {isRTL 
                        ? "قم بمسح رمز الاستجابة السريعة (QR Code) لتوصيل حساب واتساب وسحب محادثات عملائك مباشرة داخل البرنامج."
                        : "Scan the QR Code to securely authorize the system to read and import your latest customer chats directly."
                      }
                    </p>

                    {/* QR Code Container */}
                    <div style={{
                      position: 'relative',
                      background: '#fff',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      width: '180px',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      overflow: 'hidden'
                    }}>
                      {/* Animated scanning line */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: '#25D366',
                        boxShadow: '0 0 10px #25D366',
                        animation: 'scan 2.5s linear infinite',
                        zIndex: 2
                      }} />
                      {/* Simulated QR Code SVG */}
                      <svg viewBox="0 0 24 24" width="160" height="160" style={{ opacity: isQrScanning ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                        <path d="M2 2h6v6H2zm2 2v2h2V4zm14-2h6v6h-6zm2 2v2h2V4zM2 16h6v6H2zm2 2v2h2v-2zm16-4h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm-6-8h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm-2-4h2v2h-2zm0 4h2v2h-2zm4-8h2v2h-2zm-4 0h2v2h-2zm-2 4h2v2h-2zm2 2h2v2h-2z" fill="#0c111d" />
                      </svg>

                      {isQrScanning && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: 'rgba(255,255,255,0.9)',
                          color: '#070a13',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            border: '3px solid #ccc',
                            borderTopColor: '#25D366',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <span>{isRTL ? "جاري مسح الكود..." : "Scanning..."}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isQrScanning}
                      onClick={handleSimulateQrScan}
                      className="btn"
                      style={{
                        background: '#25D366',
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem 1.75rem',
                        borderRadius: '2rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.25)'
                      }}
                    >
                      <RefreshCw size={16} className={isQrScanning ? 'spin-animation' : ''} />
                      <span>{isRTL ? "محاكاة مسح الكود والربط" : "Simulate QR Scan & Connect"}</span>
                    </button>
                    
                    <style>{`
                      @keyframes scan {
                        0% { top: 0%; }
                        50% { top: 100%; }
                        100% { top: 0%; }
                      }
                    `}</style>
                  </div>
                ) : (
                  /* Connected Active Chats Interface */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    {/* Header bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--card-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#25d366', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {isRTL ? "حساب متصل: +966 50 123 4567" : "Connected account: +966 50 123 4567"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWhatsappConnected(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        {isRTL ? "قطع الاتصال" : "Disconnect"}
                      </button>
                    </div>

                    {/* Chats Split Layout */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr',
                      gap: '1rem',
                      height: '350px',
                      background: '#070a13',
                      border: '1px solid var(--card-border)',
                      borderRadius: '0.75rem',
                      overflow: 'hidden'
                    }}>
                      {/* Left Side: Chats list */}
                      <div style={{ borderRight: isRTL ? 'none' : '1px solid var(--card-border)', borderLeft: isRTL ? '1px solid var(--card-border)' : 'none', overflowY: 'auto' }}>
                        {MOCK_WHATSAPP_CHATS.map(chat => (
                          <div
                            key={chat.id}
                            onClick={() => setSelectedWhatsappChatId(chat.id)}
                            style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid var(--card-border)',
                              cursor: 'pointer',
                              background: selectedWhatsappChatId === chat.id ? 'rgba(37, 211, 102, 0.08)' : 'transparent',
                              transition: 'background 0.2s',
                              textAlign: 'start'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: selectedWhatsappChatId === chat.id ? '#25d366' : 'var(--text-main)' }}>{chat.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{chat.time}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {chat.lastMsg}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Side: Conversation thread */}
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Selected Chat Messages */}
                        <div style={{
                          flex: 1,
                          padding: '1rem',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          background: 'rgba(255,255,255,0.01)'
                        }}>
                          {MOCK_WHATSAPP_CHATS.find(c => c.id === selectedWhatsappChatId)?.messages.map((m, idx) => (
                            <div
                              key={idx}
                              style={{
                                alignSelf: m.sender === 'agent' ? 'flex-end' : 'flex-start',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: m.sender === 'agent' ? 'flex-end' : 'flex-start',
                                width: '100%'
                              }}
                            >
                              <div style={{
                                maxWidth: '75%',
                                padding: '0.55rem 0.85rem',
                                borderRadius: '0.65rem',
                                fontSize: '0.8rem',
                                lineHeight: 1.4,
                                background: m.sender === 'agent' ? '#075e54' : 'rgba(255,255,255,0.07)',
                                color: '#fff',
                                textAlign: 'start'
                              }}>
                                {m.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Analysis Action Footer */}
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderTop: '1px solid var(--card-border)',
                          background: 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {isRTL ? "مزامنة واتساب ويب تفاعلية" : "Live WhatsApp web mirror"}
                          </div>
                          
                          <button
                            type="button"
                            disabled={isAnalyzing}
                            onClick={() => {
                              const activeChat = MOCK_WHATSAPP_CHATS.find(c => c.id === selectedWhatsappChatId);
                              if (activeChat) {
                                handleSyncChatAnalysis(activeChat.messages, activeChat.name, activeChat.phone);
                              }
                            }}
                            className="btn btn-primary"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.8rem',
                              background: '#25D366',
                              borderColor: '#25D366',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isAnalyzing ? (
                              <>
                                <RefreshCw size={14} className="spin-animation" style={{ marginRight: '0.25rem' }} />
                                <span>{isRTL ? "جاري سحب البيانات بالـ AI..." : "Extracting via AI..."}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                <span>{isRTL ? "استخلاص العميل بالـ AI" : "AI Extract Lead"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('name')}</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('phone')}</label>
                  <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} required placeholder="+9665..." />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('email')}</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('source')}</label>
                  <select value={newSource} onChange={e => setNewSource(e.target.value)}>
                    <option value="Facebook Lead">{isRTL ? "إعلان فيسبوك" : "Facebook Lead"}</option>
                    <option value="Instagram Ad">{isRTL ? "إعلان إنستغرام" : "Instagram Ad"}</option>
                    <option value="TikTok Campaign">{isRTL ? "حملة تيك توك" : "TikTok Campaign"}</option>
                    <option value="Google Search">{isRTL ? "بحث جوجل" : "Google Search"}</option>
                    <option value="Referral">{isRTL ? "توصية / صديق" : "Referral"}</option>
                    <option value="Direct Visit">{isRTL ? "زيارة مباشرة" : "Direct Visit"}</option>
                    <option value="WhatsApp">{isRTL ? "واتساب" : "WhatsApp"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('interestedService')}</label>
                <input type="text" value={newService} onChange={e => setNewService(e.target.value)} placeholder="e.g. 3-Bedroom Villa in Yas Island" />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('budget')}</label>
                  <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('expectedDealValue')}</label>
                  <input type="number" value={newExpectedValue} onChange={e => setNewExpectedValue(e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('interestLevel')}</label>
                  <select value={newInterestLevel} onChange={e => setNewInterestLevel(e.target.value)}>
                    <option value="High">{isRTL ? "عالي" : "High"}</option>
                    <option value="Medium">{isRTL ? "متوسط" : "Medium"}</option>
                    <option value="Low">{isRTL ? "منخفض" : "Low"}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('status')}</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {['New', 'Contacted', 'Interested', 'Needs Follow-up', 'No Response', 'Postponed', 'Close to Deal', 'Won', 'Lost', 'Not Interested'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('notes')}</label>
                <textarea rows="3" value={newNotes} onChange={e => setNewNotes(e.target.value)} style={{ textAlign: 'start' }}></textarea>
                
                {aiSuggestions && (
                  <div style={{
                    background: 'var(--success-glow)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    marginTop: '0.75rem',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles size={12} />
                        {t('aiSuggestions')}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', height: 'auto', background: 'rgba(255,255,255,0.05)' }}
                        onClick={() => {
                          navigator.clipboard.writeText(aiSuggestions);
                          alert(isRTL ? 'تم نسخ التوصيات للحافظة!' : 'Copied suggestions to clipboard!');
                        }}
                      >
                        {isRTL ? "نسخ المقترحات" : "Copy"}
                      </button>
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-main)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      textAlign: 'start'
                    }}>
                      {aiSuggestions}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button type="submit" className="btn btn-primary">
                  {isRTL ? "حفظ وإضافة" : "Save & Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MacBook / Phone Backup Contacts Selector Modal */}
      {showContactsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '450px',
            background: 'rgba(21, 27, 44, 0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={18} style={{ color: 'var(--secondary)' }} />
                {t('mockContactsBook')}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowContactsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.75rem', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={t('searchContacts')}
                value={contactSearchQuery}
                onChange={e => setContactSearchQuery(e.target.value)}
                style={{ paddingInlineStart: '2.25rem', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              paddingRight: '0.25rem'
            }}>
              {MOCK_CONTACTS.filter(c => 
                c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) || 
                c.nameEn.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                c.phone.includes(contactSearchQuery)
              ).map((contact, idx) => {
                const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--card-border)',
                      transition: 'background 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setNewName(isRTL ? contact.name : contact.nameEn);
                      setNewPhone(contact.phone);
                      setNewEmail(contact.email);
                      setShowContactsModal(false);
                      setContactSearchQuery('');
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'var(--card-border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--secondary-glow) 0%, var(--primary-glow) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'var(--secondary)',
                        border: '1px solid var(--card-border)'
                      }}>
                        {initials}
                      </div>
                      <div style={{ textAlign: 'start' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>
                          {isRTL ? contact.name : contact.nameEn}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {contact.phone}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.35rem',
                        background: 'var(--primary-glow)',
                        color: '#a5b4fc',
                        border: '1px solid var(--primary-glow)'
                      }}
                    >
                      {isRTL ? "استيراد" : "Import"}
                    </button>
                  </div>
                );
              })}
              {MOCK_CONTACTS.filter(c => 
                c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) || 
                c.nameEn.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                c.phone.includes(contactSearchQuery)
              ).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {isRTL ? "لا توجد جهات اتصال تطابق البحث." : "No contacts found matching search query."}
                </div>
              )}
            </div>
            
            <div style={{ borderTop: '1px solid var(--card-border)', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => setShowContactsModal(false)}
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk WhatsApp Campaign Modal */}
      {showCampaignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            
            {/* Header */}
            <h3 style={{ margin: '0 0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageCircle size={22} style={{ color: '#25D366' }} />
                {t('whatsappCampaignTitle')}
              </span>
              <button 
                type="button" 
                onClick={() => { setShowCampaignModal(false); setSentLeadIds([]); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </h3>

            {/* Campaign info details */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--card-border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "الشريحة المستهدفة للحملة:" : "Target Campaign Segment:"}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                  {activeTab === 'all' && (isRTL ? "جميع العملاء" : "All Leads")}
                  {activeTab === 'interested' && (isRTL ? "العملاء المهتمين" : "Interested Leads")}
                  {activeTab === 'followup' && (isRTL ? "عملاء المتابعة" : "Follow-up Leads")}
                  {" "}({tabLeads.length} {isRTL ? "عميل" : "leads"})
                </div>
              </div>

              {/* Progress Tracker */}
              <div style={{ flex: 1, maxWidth: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>{t('campaignProgress')}</span>
                  <span style={{ fontWeight: 'bold' }}>{sentLeadIds.length} / {tabLeads.length}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${tabLeads.length > 0 ? (sentLeadIds.length / tabLeads.length) * 100 : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Template Selector & Editor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="grid-responsive">
              
              {/* Template settings */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {t('campaignTemplate')}
                </label>
                
                <select 
                  value={campaignTemplate} 
                  onChange={e => {
                    setCampaignTemplate(e.target.value);
                    // Update default text when changing
                    if (e.target.value === 'intro') {
                      setCampaignText(isRTL 
                        ? "مرحباً أ. {name}، معك أحمد من إيليت العقارية. سعدت بالتواصل معك بخصوص اهتمامك بمشروع {service}. هل يناسبك الاتصال الهاتفي غداً الساعة 4 عصراً لمناقشة التفاصيل؟" 
                        : "Hi {name}, this is Ahmad from Elite Properties. Thanks for reaching out regarding the {service}. Would a phone call tomorrow at 4 PM work to discuss the pricing structures?"
                      );
                    } else if (e.target.value === 'followup') {
                      setCampaignText(isRTL 
                        ? "أهلاً أ. {name}، أتمنى أن تكون بخير. أردت فقط الاطمئنان على استفسارك الأخير بخصوص {service}. يسعدني تزويدك بأي تفاصيل إضافية في حال احتجت لها." 
                        : "Hi {name}, hope you're having a great week. I wanted to follow up on your inquiry about {service}. Let me know if you have any questions about the units or need more floor plans."
                      );
                    } else if (e.target.value === 'offer') {
                      setCampaignText(isRTL 
                        ? "مرحباً أ. {name}، بخصوص اهتمامك بـ {service}، أردت إبلاغك أن المطور يمنح خصماً حصرياً للعملاء الذين يوقعون العقود هذا الأسبوع. هل ترغب في ترتيب مكالمة سريعة لمناقشة الخصم؟" 
                        : "Hi {name}, regarding your interest in {service}, the developer is offering an exclusive discount for contracts signed this week. Let me know if you would like me to arrange a brief call to review options."
                      );
                    } else {
                      setCampaignText(isRTL ? "مرحباً أ. {name}، " : "Hi {name}, ");
                    }
                  }}
                  style={{ marginBottom: '1rem' }}
                >
                  <option value="intro">{isRTL ? "قالب: التعريف الأول" : "Template: First Introduction"}</option>
                  <option value="followup">{isRTL ? "قالب: متابعة لطيفة" : "Template: Soft Follow-up"}</option>
                  <option value="offer">{isRTL ? "قالب: خصم وعرض خاص" : "Template: Special Discount Offer"}</option>
                  <option value="custom">{isRTL ? "رسالة مخصصة فارغة" : "Blank Custom Message"}</option>
                </select>

                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--card-border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  lineHeight: '1.4',
                  textAlign: 'start'
                }}>
                  <strong style={{ color: 'var(--secondary)' }}>{isRTL ? "المتغيرات المتاحة:" : "Available Placeholders:"}</strong>
                  <ul style={{ margin: '0.25rem 0 0', paddingInlineStart: '1.25rem' }}>
                    <li><code>{"{name}"}</code>: {isRTL ? "اسم العميل" : "Client's Name"}</li>
                    <li><code>{"{service}"}</code>: {isRTL ? "العقار المهتم به" : "Interested Service"}</li>
                  </ul>
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {t('templateVariablesNotice')}
                  </div>
                </div>
              </div>

              {/* Template content */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)', textAlign: 'start' }}>
                  {isRTL ? "نص الرسالة الأساسي:" : "Message Body Template:"}
                </label>
                <textarea
                  rows="6"
                  value={campaignText}
                  onChange={e => setCampaignText(e.target.value)}
                  style={{ flex: 1, fontSize: '0.85rem', lineHeight: '1.5', textAlign: 'start' }}
                />
              </div>

            </div>

            {/* Recipient list with individual compile previews */}
            <h4 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1rem', textAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('campaignRecipients')}</span>
              {sentLeadIds.length === tabLeads.length && tabLeads.length > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold', animation: 'fadeIn 0.3s ease' }}>
                  ✓ {t('campaignSuccess')}
                </span>
              )}
            </h4>

            <div style={{
              border: '1px solid var(--card-border)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              maxHeight: '280px',
              overflowY: 'auto',
              background: '#070a13'
            }}>
              {tabLeads.length === 0 ? (
                <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {t('noLeadsInSegment')}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'start' }}>{t('name')}</th>
                      <th style={{ padding: '0.75rem', textAlign: 'start' }}>{isRTL ? "معاينة الرسالة للعميل" : "Compiled Message Preview"}</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', width: '120px' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabLeads.map(lead => {
                      const leadName = isRTL ? (lead.nameAr || lead.name) : lead.name;
                      const leadService = isRTL ? (lead.serviceAr || lead.service) : lead.service;
                      
                      // Compile message safely
                      const compiledText = (campaignText || '')
                        .replace(/\{name\}/g, leadName || '')
                        .replace(/\{service\}/g, leadService || '');
                      
                      const isSent = sentLeadIds.includes(lead.id);

                      return (
                        <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: isSent ? 'rgba(16, 185, 129, 0.02)' : 'transparent' }}>
                          <td style={{ padding: '0.75rem', verticalAlign: 'top', textAlign: 'start' }}>
                            <div style={{ fontWeight: 600 }}>{leadName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone}</div>
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', textAlign: 'start', verticalAlign: 'top' }}>
                            <div style={{
                              maxHeight: '60px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              background: 'rgba(0,0,0,0.2)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '0.35rem',
                              fontSize: '0.8rem',
                              color: '#e2e8f0',
                              border: '1px solid rgba(255,255,255,0.01)'
                            }}>
                              {compiledText}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {isSent ? (
                              <span style={{
                                color: 'var(--success)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                ✓ {t('sent')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                  // Open WhatsApp link
                                  const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
                                  const encoded = encodeURIComponent(compiledText);
                                  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
                                  
                                  // Mark as sent in state
                                  setSentLeadIds(prev => [...prev, lead.id]);
                                  
                                  // Update CRM lead: update lastContact to today
                                  updateLead(lead.id, {
                                    lastContact: new Date().toISOString().split('T')[0]
                                  });

                                  // Log a task or notification
                                  addTask({
                                    leadId: lead.id,
                                    title: isRTL 
                                      ? `تم إرسال رسالة واتساب جماعية لـ ${leadName}`
                                      : `Sent bulk WhatsApp message to ${leadName}`,
                                    titleAr: `تم إرسال رسالة واتساب جماعية لـ ${leadName}`,
                                    dueDate: new Date().toISOString().split('T')[0],
                                    completed: true,
                                    priority: 'Low'
                                  });
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  border: 'none',
                                  color: '#fff',
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '0.35rem',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                {t('sendTo')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setShowCampaignModal(false); setSentLeadIds([]); }}
                style={{ padding: '0.5rem 1.5rem' }}
              >
                {t('closeCampaign')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
