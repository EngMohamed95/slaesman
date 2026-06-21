import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Search, Filter, MessageCircle, Phone, Eye, Trash2, Sparkles, Smartphone, X } from 'lucide-react';

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
      senderName: senderName || (sender === 'agent' ? 'SalesMate' : 'Client'),
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
  const { leads, addLead, deleteLead, addTask } = useCRM();
  const { t, isRTL } = useLanguage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
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

  const handleChatAnalysis = () => {
    if (!pastedChat.trim()) {
      alert(isRTL ? 'الرجاء إدخال نص المحادثة أولاً' : 'Please enter chat text first');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisStep(1);

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

  // Filter leads
  const filteredLeads = leads.filter(lead => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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

      {/* Leads Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setImportMode(importMode === 'whatsapp' ? null : 'whatsapp')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    borderColor: importMode === 'whatsapp' ? 'var(--primary)' : 'var(--card-border)',
                    background: importMode === 'whatsapp' ? 'var(--primary-glow)' : undefined
                  }}
                >
                  <MessageCircle size={16} style={{ color: '#25D366' }} />
                  <span>{t('whatsappAnalyze')}</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={handleContactImportClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    borderColor: showContactsModal ? 'var(--primary)' : 'var(--card-border)',
                    background: showContactsModal ? 'var(--primary-glow)' : undefined
                  }}
                >
                  <Smartphone size={16} style={{ color: 'var(--secondary)' }} />
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
    </div>
  );
}
