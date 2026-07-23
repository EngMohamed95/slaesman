import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { useApp } from '../context/AppContext';
import { isGeminiActive, callGeminiApi } from '../utils/gemini';
import { Sparkles, X, Send, MessageSquare, AlertCircle, HelpCircle } from 'lucide-react';

export default function FloatingAIAssistant() {
  const { t, isRTL, lang } = useLanguage();
  const { leads, tasks } = useCRM();
  const { checkAILimit, incrementAICount, theme } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('salesmate_floating_chat');
    if (saved) return JSON.parse(saved);
    
    // Initial welcome message
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: lang === 'ar' 
          ? "مرحباً! أنا مساعدك الشخصي الذكي. يمكنك أن تسألني عن أي شيء يخص مبيعاتك، عملائك، أو تنظيم مهامك اليومية."
          : "Hello! I am your AI Sales Assistant. Ask me anything about your deals, customer info, or follow-up tasks.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef(null);

  // Persist messages in localStorage
  useEffect(() => {
    localStorage.setItem('salesmate_floating_chat', JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    if (!textToSend) {
      setInputValue('');
    }

    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    
    // SaaS validation limit check
    const limit = checkAILimit();
    if (!limit.allowed) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ai',
          isWarning: true,
          text: lang === 'ar'
            ? "🚨 لقد استنفدت الحد المسموح به للحساب المجاني (3 عمليات توليد بالذكاء الاصطناعي). يرجى ترقية باقتك إلى الاحترافية (Pro) أو النمو (Growth) من صفحة الاشتراكات للحصول على استخدام غير محدود وبدون قيود."
            : "🚨 You have reached the limit of the free tier (3 AI queries). Please upgrade to the Pro or Growth plan in the Subscriptions page to unlock unlimited access.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 500);
      return;
    }

    if (!isGeminiActive()) {
      // API Key missing error response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          isWarning: true,
          text: lang === 'ar'
            ? "تنبيه: مفتاح Gemini API غير مضاف. يرجى التوجه لصفحة الإعدادات وتثبيت المفتاح لتفعيل الدردشة المباشرة."
            : "Notice: Gemini API Key is missing. Please navigate to the Settings page and add your API key to activate live chat.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 500);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Gather active leads and tasks context
      const simplifiedLeads = leads.map(l => ({
        name: isRTL ? (l.nameAr || l.name) : l.name,
        status: isRTL ? (l.statusAr || l.status) : l.status,
        budget: l.budget,
        source: isRTL ? (l.sourceAr || l.source) : l.source,
        interest: isRTL ? (l.interestLevelAr || l.interestLevel) : l.interestLevel,
        service: isRTL ? (l.serviceAr || l.service) : l.service,
        notes: isRTL ? (l.notesAr || l.notes) : l.notes
      }));

      const simplifiedTasks = tasks.map(t => ({
        title: isRTL ? (t.titleAr || t.title) : t.title,
        completed: t.completed,
        priority: t.priority
      }));

      // Gather chat history (limit to last 6 messages to avoid bloating token limit)
      const chatHistory = messages.slice(-6).map(m => 
        `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`
      ).join('\n');

      const systemPrompt = `
        You are a highly efficient, supportive, and context-aware CRM Sales Assistant floating chatbot.
        You assist the agent by looking at their real-time client leads and tasks database.
        
        System Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
        YOU MUST CORRESPOND AND REPLY ONLY IN ${lang === 'ar' ? 'Arabic' : 'English'}. Keep responses short, concise, and helpful (max 3 small paragraphs).

        CRM DATABASE CONTEXT:
        - Leads list: ${JSON.stringify(simplifiedLeads)}
        - Follow-up Tasks: ${JSON.stringify(simplifiedTasks)}
      `;

      const prompt = `
        Conversation History:
        ${chatHistory}

        User Question: ${query}

        Assistant Response:
      `;

      const aiResponseText = await callGeminiApi(prompt, systemPrompt);
      incrementAICount();

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred');
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: lang === 'ar'
          ? "عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى التحقق من اتصال الإنترنت ومفتاح الـ API."
          : "Sorry, an error occurred while connecting to the AI. Please verify your internet connection and API key.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const clearChat = () => {
    const defaultMsg = [
      {
        id: 'welcome',
        sender: 'ai',
        text: lang === 'ar' 
          ? "مرحباً! أنا مساعدك الشخصي الذكي. يمكنك أن تسألني عن أي شيء يخص مبيعاتك، عملائك، أو تنظيم مهامك اليومية."
          : "Hello! I am your AI Sales Assistant. Ask me anything about your deals, customer info, or follow-up tasks.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
  };

  // Predefined prompt chips
  const promptChips = lang === 'ar' ? [
    { label: "لخص صفقاتي النشطة", text: "لخص لي الصفقات الجارية والعملاء المهتمين حالياً" },
    { label: "نصيحة مبيعات لليوم", text: "أعطني نصيحة تسويقية أو نصيحة بيع سريعة ومفيدة لليوم" },
    { label: "أعلى عميل ميزانية", text: "من هو العميل صاحب الميزانية الأعلى وما حالته حالياً؟" }
  ] : [
    { label: "Summarize active deals", text: "Summarize my active leads and current pipeline deals" },
    { label: "Sales tip of the day", text: "Give me a brief actionable sales or marketing tip for today" },
    { label: "Highest budget lead", text: "Who is the lead with the highest budget in my CRM right now?" }
  ];

  return (
    <div style={{ zIndex: 9999 }} className="print-hide">
      
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: isRTL ? '2rem' : 'calc(var(--sidebar-w) + 2rem)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 9999
          }}
          className="floating-ai-fab"
        >
          <Sparkles size={26} className="fab-icon-sparkle" />
        </button>
      )}

      {/* Floating Chat Container Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: isRTL ? '2rem' : 'calc(var(--sidebar-w) + 2rem)',
          width: '360px',
          height: '500px',
          borderRadius: '1rem',
          background: theme === 'light' ? '#ffffff' : 'rgba(11, 15, 25, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 9999
        }} className="floating-chat-window">
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid var(--card-border)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: 'var(--secondary-glow)',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
              </div>
              <div style={{ textAlign: 'start' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                  {isRTL ? "مساعد سيلز ميت AI" : "SalesMate AI Assistant"}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>● {isRTL ? "متصل بالبيانات" : "Connected to CRM"}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={clearChat} 
                title={isRTL ? "مسح المحادثة" : "Clear Chat"}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '0.25rem'
                }}
              >
                {isRTL ? "مسح" : "Clear"}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-main)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: theme === 'light' ? '#f8fafc' : 'rgba(0,0,0,0.1)'
          }}>
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id || index} style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  textAlign: 'start'
                }}>
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: isUser ? '0.75rem 0.75rem 0 0.75rem' : '0.75rem 0.75rem 0.75rem 0',
                    background: isUser 
                      ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' 
                      : msg.isWarning 
                        ? 'var(--danger-glow)' 
                        : theme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    border: msg.isWarning ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--card-border)',
                    color: msg.isWarning ? 'var(--danger)' : isUser ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: isUser ? '0 2px 8px rgba(79, 70, 229, 0.2)' : 'none'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginTop: '2px',
                    textAlign: isUser ? 'right' : 'left'
                  }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}
            
            {/* Loading / Typing indicator */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.75rem 0.75rem 0.75rem 0',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="dot-pulse-1" style={{ animation: 'bounce 1s infinite' }}>•</span>
                  <span className="dot-pulse-2" style={{ animation: 'bounce 1s infinite 0.2s' }}>•</span>
                  <span className="dot-pulse-3" style={{ animation: 'bounce 1s infinite 0.4s' }}>•</span>
                  <span>{isRTL ? "مساعدك يفكر..." : "Assistant is thinking..."}</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          {messages.length <= 2 && !loading && (
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.15)',
              borderTop: '1px solid var(--card-border)'
            }}>
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.text)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.75rem',
                    color: 'var(--secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  className="quick-chip-btn"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            <input
              type="text"
              placeholder={isRTL ? "اكتب سؤالك هنا..." : "Type your message..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--card-border)',
                background: theme === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-main)'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputValue.trim()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '0.5rem',
                background: inputValue.trim() ? 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)' : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={14} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
            </button>
          </div>
        </div>
      )}

      {/* Global CSS adjustments for animations and responsive positions */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .fab-icon-sparkle {
          animation: sparkle-pulse 3s infinite;
        }
        @keyframes sparkle-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.1) rotate(10deg); opacity: 0.9; }
        }
        .quick-chip-btn:hover {
          background: rgba(6, 182, 212, 0.1) !important;
          border-color: var(--secondary) !important;
        }
        @media (max-width: 1024px) {
          .floating-ai-fab {
            left: 1.5rem !important;
            bottom: 5.5rem !important; /* Raised above bottom tab menus */
          }
          .floating-chat-window {
            left: 1.5rem !important;
            bottom: 5.5rem !important;
            width: 320px !important;
            height: 420px !important;
          }
        }
      `}</style>

    </div>
  );
}
