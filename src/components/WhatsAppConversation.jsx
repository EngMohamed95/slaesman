import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import {
  getWhatsAppAccount,
  fetchLeadConversation,
  subscribeToWhatsAppMessages,
  sendWhatsAppCloudMessage,
  isWhatsAppWindowOpen,
  listWhatsAppTemplates,
  describeWhatsAppError,
} from '../utils/whatsapp';
import { MessageSquare, Send, Check, CheckCheck, AlertTriangle, Clock } from 'lucide-react';

/**
 * The read side of the Cloud API.
 *
 * The webhook writes inbound replies into `whatsapp_messages`; without this
 * they were being recorded and never shown. Messages arrive over Realtime, so
 * a reply appears the moment the webhook commits it — no polling loop, and it
 * keeps working while the rep is looking at a different lead.
 *
 * The composer is deliberately two-faced. Inside the 24-hour customer service
 * window WhatsApp allows free text; outside it only an approved template is
 * legal, so the textarea is replaced by a template picker rather than left
 * enabled to produce a rejection the rep cannot interpret.
 *
 * Renders nothing at all when the org has no connected number — that org is
 * still on the wa.me deep link and has no transcript to show.
 */
export default function WhatsAppConversation({ lead }) {
  const { isRTL } = useLanguage();
  const { orgId } = useApp();

  const [account, setAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  // Which lead `messages` was fetched for. Tracking that instead of a `loading`
  // flag means switching leads cannot render the previous lead's transcript in
  // the gap before the new fetch lands.
  const [loadedFor, setLoadedFor] = useState(null);
  const [windowOpen, setWindowOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const leadId = lead?.id;
  const leadPhone = lead?.phone;

  useEffect(() => {
    let active = true;
    getWhatsAppAccount().then((row) => {
      if (active) setAccount(row);
    });
    return () => { active = false; };
  }, []);

  const refreshWindow = useCallback(() => {
    if (!orgId || !leadPhone) return;
    isWhatsAppWindowOpen(orgId, leadPhone).then(setWindowOpen);
  }, [orgId, leadPhone]);

  useEffect(() => {
    if (!account || !leadId) return undefined;
    let active = true;
    fetchLeadConversation(leadId).then((rows) => {
      if (!active) return;
      setMessages(rows);
      setLoadedFor(leadId);
    });
    refreshWindow();
    return () => { active = false; };
  }, [account, leadId, refreshWindow]);

  // Live updates. INSERT brings a new message; UPDATE is a delivery receipt
  // moving an existing one from sent to delivered to read.
  useEffect(() => {
    if (!account || !leadId) return undefined;
    return subscribeToWhatsAppMessages((row, eventType) => {
      if (!row || row.lead_id !== leadId) return;
      setMessages((previous) => {
        const index = previous.findIndex((m) => m.id === row.id);
        if (index === -1) return [...previous, row];
        const next = [...previous];
        next[index] = { ...next[index], ...row };
        return next;
      });
      // An inbound message reopens the 24-hour window; a status change cannot.
      if (eventType === 'INSERT' && row.direction === 'in') refreshWindow();
    });
  }, [account, leadId, refreshWindow]);

  // Templates are only needed when free text is not allowed, and the request
  // costs a Graph round trip — so it waits until the window is actually shut.
  useEffect(() => {
    if (!account || windowOpen || templates.length) return;
    let active = true;
    listWhatsAppTemplates()
      .then((rows) => { if (active) setTemplates(rows); })
      .catch(() => { /* leaves the picker empty; the notice below explains why */ });
    return () => { active = false; };
  }, [account, windowOpen, templates.length]);

  if (!account || !lead) return null;

  const loading = loadedFor !== leadId;
  const consentWithheld = lead.consent?.whatsapp === false;

  const handleSend = async () => {
    setError('');
    setSending(true);
    try {
      if (windowOpen) {
        await sendWhatsAppCloudMessage({ leadId, text: draft });
        setDraft('');
      } else {
        const template = templates.find((tpl) => tpl.name === selectedTemplate);
        if (!template) return;
        await sendWhatsAppCloudMessage({
          leadId,
          template: { name: template.name, language: template.language },
        });
        setSelectedTemplate('');
      }
      // The row arrives over Realtime; nothing is appended optimistically here
      // because a message shown as sent that was not is worse than a short wait.
    } catch (e) {
      setError(describeWhatsAppError(e, isRTL));
    } finally {
      setSending(false);
    }
  };

  const statusIcon = (status) => {
    if (status === 'failed') return <AlertTriangle size={12} style={{ color: 'var(--danger)' }} />;
    if (status === 'read') return <CheckCheck size={12} style={{ color: '#53bdeb' }} />;
    if (status === 'delivered') return <CheckCheck size={12} style={{ color: 'var(--text-muted)' }} />;
    return <Check size={12} style={{ color: 'var(--text-muted)' }} />;
  };

  const canSend = !sending
    && !consentWithheld
    && (windowOpen ? draft.trim().length > 0 : Boolean(selectedTemplate));

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <MessageSquare size={20} style={{ color: '#25D366' }} />
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
          {isRTL ? 'محادثة واتساب' : 'WhatsApp conversation'}
        </h3>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxHeight: '320px',
        overflowY: 'auto',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--card-border)',
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem' }}>
            {isRTL ? 'جارٍ تحميل المحادثة…' : 'Loading conversation…'}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem', lineHeight: 1.7 }}>
            {isRTL
              ? 'لا توجد رسائل بعد. أول رسالة من العميل أو منك ستظهر هنا مباشرة.'
              : 'No messages yet. The first message either way will appear here live.'}
          </div>
        ) : (
          messages.map((message) => {
            const outbound = message.direction === 'out';
            return (
              <div
                key={message.id}
                style={{
                  alignSelf: outbound ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: outbound ? 'rgba(37, 211, 102, 0.14)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${outbound ? 'rgba(37, 211, 102, 0.28)' : 'var(--card-border)'}`,
                  borderRadius: '0.6rem',
                  padding: '0.5rem 0.7rem',
                  fontSize: '0.85rem',
                  textAlign: 'start'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {message.body || (
                    <em style={{ color: 'var(--text-muted)' }}>
                      {message.template_name
                        ? `${isRTL ? 'قالب' : 'Template'}: ${message.template_name}`
                        : `[${message.message_type}]`}
                    </em>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  justifyContent: 'flex-end',
                  marginTop: '0.25rem',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>{new Date(message.created_at).toLocaleString(isRTL ? 'ar-EG' : 'en-GB', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}</span>
                  {outbound && statusIcon(message.status)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {consentWithheld ? (
        <div style={{
          background: 'var(--danger-glow)',
          color: 'var(--danger)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.8rem',
          textAlign: 'start',
          lineHeight: 1.6
        }}>
          {isRTL
            ? 'هذا العميل لم يوافق على التواصل عبر واتساب. الإرسال مرفوض من الخادم أصلاً.'
            : 'This lead has not consented to WhatsApp contact. The server rejects sending regardless.'}
        </div>
      ) : windowOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            rows="3"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isRTL ? 'اكتب رسالتك…' : 'Write your message…'}
            style={{ textAlign: 'start' }}
          />
          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', alignSelf: 'flex-start' }}
            disabled={!canSend}
            onClick={handleSend}
          >
            <Send size={15} /> {sending ? (isRTL ? 'جارٍ الإرسال…' : 'Sending…') : (isRTL ? 'إرسال' : 'Send')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--accent)',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.8rem',
            fontSize: '0.78rem',
            lineHeight: 1.6,
            textAlign: 'start'
          }}>
            <Clock size={14} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <span>
              {isRTL
                ? 'مرّت أكثر من 24 ساعة على آخر رسالة من العميل، فلا يسمح واتساب بالنص الحر. اختر قالباً معتمداً.'
                : 'More than 24 hours since the customer last wrote, so WhatsApp does not allow free text. Pick an approved template.'}
            </span>
          </div>

          {templates.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, textAlign: 'start', lineHeight: 1.6 }}>
              {isRTL
                ? 'لا توجد قوالب معتمدة على حساب الواتساب. أنشئها واعتمدها من لوحة ميتا أولاً.'
                : 'No approved templates on the WhatsApp account. Create and get them approved in the Meta dashboard first.'}
            </p>
          ) : (
            <>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                <option value="">{isRTL ? '— اختر قالباً —' : '— Select a template —'}</option>
                {templates.map((tpl) => (
                  <option key={`${tpl.name}:${tpl.language}`} value={tpl.name}>
                    {tpl.name} ({tpl.language})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', alignSelf: 'flex-start' }}
                disabled={!canSend}
                onClick={handleSend}
              >
                <Send size={15} /> {sending ? (isRTL ? 'جارٍ الإرسال…' : 'Sending…') : (isRTL ? 'إرسال القالب' : 'Send template')}
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '0.75rem',
          background: 'var(--danger-glow)',
          color: 'var(--danger)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '0.5rem',
          padding: '0.6rem 0.8rem',
          fontSize: '0.78rem',
          textAlign: 'start',
          lineHeight: 1.6
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
