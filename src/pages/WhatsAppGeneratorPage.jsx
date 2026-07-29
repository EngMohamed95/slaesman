import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { openWhatsAppConversation, sendWhatsAppAttachment } from '../utils/whatsapp';
import { MessageSquare, ExternalLink, Send, Paperclip, X } from 'lucide-react';

export default function WhatsAppGeneratorPage({ defaultLeadId }) {
  const { t, isRTL } = useLanguage();
  const { leads } = useCRM();

  const [selectedLeadId, setSelectedLeadId] = useState(defaultLeadId || leads[0]?.id || '');
  const [template, setTemplate] = useState('intro'); // intro, followup, viewing, payment, price
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(attachment);
    setAttachmentPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [attachment]);

  // Auto compile templates based on selected lead
  useEffect(() => {
    if (!selectedLead) return;

    const leadName = isRTL ? selectedLead.nameAr : selectedLead.name;
    const leadService = isRTL ? selectedLead.serviceAr : selectedLead.service;

    let text = '';
    if (template === 'intro') {
      text = isRTL
        ? `مرحباً أ. ${leadName}، معك أحمد من إيليت العقارية. سعدت بالتواصل معك بخصوص اهتمامك بمشروع ${leadService}. هل يناسبك الاتصال الهاتفي غداً الساعة 4 عصراً لمناقشة التفاصيل؟`
        : `Hi ${leadName}, this is Ahmad from Elite Properties. Thanks for reaching out regarding the ${leadService}. Would a phone call tomorrow at 4 PM work to discuss the pricing structures?`;
    } else if (template === 'followup') {
      text = isRTL
        ? `أهلاً أ. ${leadName}، أتمنى أن تكون بخير. أردت فقط الاطمئنان على استفسارك الأخير بخصوص ${leadService}. يسعدني تزويدك بأي تفاصيل إضافية في حال احتجت لها.`
        : `Hi ${leadName}, hope you're having a great week. I wanted to follow up on your inquiry about ${leadService}. Let me know if you have any questions about the units or need more floor plans.`;
    } else if (template === 'viewing') {
      text = isRTL
        ? `مرحباً أ. ${leadName}، قمنا بجدولة معاينات لمشروع ${leadService} نهاية هذا الأسبوع. هل تفضل الحضور يوم الجمعة أم السبت لحجز جولتك الخاصة؟`
        : `Hi ${leadName}, we are scheduling private site tours for ${leadService} this weekend. Would Friday or Saturday work better for your schedule?`;
    } else if (template === 'payment') {
      text = isRTL
        ? `سيد ${leadName}، مرفق تفاصيل خطة السداد لمشروع ${leadService}: دفعة أولى 10%، أقساط شهرية ممتدة على 7 سنوات، بدون فوائد. سيسعدني إرسال ملف الـ PDF بالتفاصيل الكاملة.`
        : `Hi ${leadName}, here is a summary of the payment structure for ${leadService}: 10% down payment, 7-year monthly installments, 0% interest. Let me know if I should email you the detailed PDF brochure.`;
    } else {
      text = isRTL
        ? `مرحباً أ. ${leadName}، بخصوص استفسارك عن السعر، أود التنويه أن المطور يمنح خصماً بقيمة 5% للعملاء الذين يوقعون العقود هذا الأسبوع. هل ترغب في ترتيب مكالمة سريعة مع المستشار المالي لتعديل الدفعات؟`
        : `Hi ${leadName}, regarding the pricing of ${leadService}, the developer is offering a 5% discount for contracts signed this week. Let me know if you would like me to arrange a brief call with our advisor to review options.`;
    }

    setMessage(text);
  }, [selectedLeadId, template, isRTL]);

  const handleOpenWhatsApp = async () => {
    if (!selectedLead) return;
    setIsSending(true);
    try {
      if (attachment) {
        // Must happen directly in the click event or the browser may block it.
        openWhatsAppConversation(selectedLead.phone);
        await sendWhatsAppAttachment(selectedLead.phone, attachment, message);
        setAttachment(null);
      } else {
        openWhatsAppConversation(selectedLead.phone, message);
      }
    } catch (e) {
      alert(isRTL ? `حدث خطأ أثناء إرسال الواتساب: ${e.message}` : `Error sending WhatsApp message: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare style={{ color: 'var(--secondary)' }} /> {t('whatsappTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('whatsappSubtitle')}</p>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem' }}>
        
        {/* Left Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              {isRTL ? "اختر المستلم / العميل" : "Select Recipient Lead"}
            </label>
            <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)}>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{isRTL ? lead.nameAr : lead.name} ({lead.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              {t('selectTemplate')}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { id: 'intro', label: t('templateIntro') },
                { id: 'followup', label: t('templateFollowUp') },
                { id: 'viewing', label: t('templateViewing') },
                { id: 'payment', label: t('templatePayment') },
                { id: 'price', label: t('templateObjection') }
              ].map(tpl => (
                <label key={tpl.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: template === tpl.id ? 'var(--secondary-glow)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${template === tpl.id ? 'var(--secondary)' : 'var(--card-border)'}`,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}>
                  <input 
                    type="radio" 
                    name="template" 
                    checked={template === tpl.id} 
                    onChange={() => setTemplate(tpl.id)} 
                    style={{ display: 'none' }}
                  />
                  <span>{tpl.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            {isRTL ? "معاينة الرسالة وتعديلها" : "Edit Compiled Message"}
          </h3>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <textarea
              style={{ flex: 1, minHeight: '200px', fontSize: '0.95rem', lineHeight: 1.6 }}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />

            <div style={{
              border: '1px dashed var(--card-border)',
              borderRadius: '0.65rem',
              padding: '0.85rem'
            }}>
              {!attachment ? (
                <label className="btn" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)'
                }}>
                  <Paperclip size={16} />
                  {isRTL ? 'إرفاق صورة أو فيديو' : 'Attach image or video'}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 25 * 1024 * 1024) {
                        alert(isRTL ? 'حجم الملف يجب ألا يتجاوز 25 ميجابايت.' : 'File size must not exceed 25 MB.');
                        event.target.value = '';
                        return;
                      }
                      setAttachment(file);
                    }}
                  />
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {attachment.type.startsWith('image/') ? (
                    <img src={attachmentPreview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '0.5rem' }} />
                  ) : (
                    <video src={attachmentPreview} style={{ width: 110, height: 72, objectFit: 'cover', borderRadius: '0.5rem' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(attachment.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" className="btn" onClick={() => setAttachment(null)} aria-label={isRTL ? 'حذف المرفق' : 'Remove attachment'}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {selectedLead && (
              <div style={{
                background: selectedLead.consent?.whatsapp !== false ? 'var(--success-glow)' : 'var(--danger-glow)',
                color: selectedLead.consent?.whatsapp !== false ? 'var(--success)' : 'var(--danger)',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontWeight: 'bold' }}>!</span>
                <span>
                  {selectedLead.consent?.whatsapp !== false 
                    ? (isRTL ? "موافق عليها: العميل سمح بالتواصل عبر الواتساب." : "Consent check: Lead allows WhatsApp communication.")
                    : (isRTL ? "تحذير: لم يعط العميل موافقة على الواتساب أو ألغى الاشتراك." : "Consent check: Lead has restricted or not consented to WhatsApp.")
                  }
                </span>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
              onClick={handleOpenWhatsApp}
              disabled={!selectedLeadId || isSending || (!message.trim() && !attachment)}
            >
              <Send size={16} />
              {isSending
                ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
                : attachment
                  ? (isRTL ? 'إرسال المرفق وفتح واتساب' : 'Send attachment & open WhatsApp')
                  : t('generateAndOpen')}
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
