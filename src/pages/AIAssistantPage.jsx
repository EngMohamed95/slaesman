import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { useApp } from '../context/AppContext';
import { callAI, describeAIError } from '../utils/ai';
import { useAIConversations } from '../utils/aiConversations';
import { parseChatToMessages } from '../utils/chatParser';
import { Sparkles, ShieldAlert, Plus, Trash2 } from 'lucide-react';

// Helper to parse pasted chat text into structured message bubble objects

// Helper parser to extract details for the custom AI response

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
  // Kept separate from aiOutput so a failure is never mistaken for a result.
  const [aiError, setAiError] = useState('');
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
    setAiError('');

    try {
      let prompt = '';

      if (activeTab === 'chatAnalysis') {
        if (!pastedChatText.trim()) {
          setAiOutput(isRTL ? "الرجاء إدخال نص المحادثة للبدء." : "Please enter conversation transcript.");
          setLoading(false);
          return;
        }

        if (selectedTask === 'reply') {
          prompt = `Write a professional, polite and persuasive follow-up reply to this client, formatted as a ready-to-send message.\n\nTranscript:\n${pastedChatText}`;
        } else if (selectedTask === 'requirements') {
          prompt = `From this conversation extract: client name, target property or service, budget mentioned, contact details, and a brief assessment of their interest. Return a structured list.\n\nTranscript:\n${pastedChatText}`;
        } else {
          prompt = `Suggest a step-by-step follow-up plan for this client based on the conversation.\n\nTranscript:\n${pastedChatText}`;
        }
      } else {
        const leadName = isRTL ? (selectedLead.nameAr || selectedLead.name) : selectedLead.name;
        const leadService = isRTL ? (selectedLead.serviceAr || selectedLead.service) : selectedLead.service;
        const leadNotes = isRTL ? (selectedLead.notesAr || selectedLead.notes) : selectedLead.notes;

        if (activeTab === 'objections') {
          const objection = selectedObjection === 'price' ? 'Price is too expensive'
            : selectedObjection === 'think' ? 'Needs time to think or consult a partner'
            : selectedObjection === 'location' ? 'Location is too far'
            : 'Renting is better than buying right now';
          prompt = `Draft a convincing response for the salesperson to handle this objection.\nClient: ${leadName}\nService: ${leadService}\nObjection: ${objection}`;
        } else if (activeTab === 'scripts') {
          prompt = `Write a follow-up phone call script with three stages: greeting and rapport, feedback hook, urgency hook.\nClient: ${leadName}\nService: ${leadService}\nNotes: ${leadNotes}`;
        } else {
          prompt = `Summarise these sales notes and suggest the next best action to close the deal.\nClient: ${leadName}\nService: ${leadService}\nNotes: ${leadNotes}\nStatus: ${selectedLead.status}`;
        }
      }

      // Tone and language rules live in the proxy's sales_copilot task. They
      // used to be a systemInstruction string built right here, so anything
      // pasted into the transcript box could rewrite the model's instructions.
      const { text } = await callAI('sales_copilot', prompt, { lang: isRTL ? 'ar' : 'en' });
      setAiOutput(text);
      incrementAICount();
    } catch (err) {
      console.error('AI request failed:', err);
      // What used to be here: a catch that swallowed the error and fell
      // through to ~90 lines of hand-written "AI output" containing invented
      // budgets and payment plans. A failure now reports that it failed.
      setAiOutput('');
      setAiError(describeAIError(err, isRTL));
    } finally {
      setLoading(false);
    }
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
          ) : aiError ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div>
                <ShieldAlert size={28} style={{ color: 'var(--danger)', marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: 0, lineHeight: 1.7 }}>{aiError}</p>
              </div>
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
