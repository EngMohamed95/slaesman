import { supabase } from '../lib/supabase';

/**
 * WhatsApp Cloud API — client side.
 *
 * What was here before: `getWhatsAppConfig`/`setWhatsAppConfig`, which kept the
 * Meta permanent access token in localStorage under `salesmate_wa_access_token`,
 * and `isWhatsAppCloudApiActive()`, which returned true whenever two strings
 * were non-empty. SettingsPage rendered "Real Meta WhatsApp API Connected &
 * Active" off that check while nothing in the app could send through the Cloud
 * API at all — `sendRealWhatsAppMessage()` had been deleted in Phase 0 for
 * putting that same token in a Bearer header from the browser.
 *
 * The token now goes to `whatsapp-connect` once and lives in Vault. Connection
 * state is a row in `whatsapp_accounts`, so the badge reflects a number Meta
 * confirmed rather than a non-empty text input.
 *
 * A note on the old localStorage keys: they are cleared on the next successful
 * connect (below) rather than on load, so a token typed before this change does
 * not sit in the browser forever.
 */

const LEGACY_KEYS = [
  'salesmate_wa_phone_number_id',
  'salesmate_wa_access_token',
  'salesmate_wa_waba_id',
];

/** One-way: these values are never read back, only removed. */
export const clearLegacyWhatsAppConfig = () => {
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
};

export class WhatsAppError extends Error {
  constructor(code, { status = 0, detail = null } = {}) {
    super(code);
    this.name = 'WhatsAppError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

/** Bilingual, actionable text for every failure the two functions can return. */
export const describeWhatsAppError = (error, isRTL) => {
  const code = error?.code || 'unknown';
  const messages = {
    whatsapp_not_configured: {
      ar: 'الاتصال بالخادم غير مهيأ.',
      en: 'The server connection is not configured.',
    },
    whatsapp_not_connected: {
      ar: 'لم يتم ربط رقم واتساب بالمؤسسة بعد. اربطه من الإعدادات أولاً.',
      en: 'No WhatsApp number is connected yet. Connect one in Settings first.',
    },
    // The single most common rejection in day-to-day use, and the one that
    // needs the clearest instruction: Meta forbids free text more than 24 hours
    // after the customer's last message.
    window_closed: {
      ar: 'مرّت أكثر من 24 ساعة على آخر رسالة من العميل، فلا يسمح واتساب بإرسال نص حر. استخدم قالباً معتمداً.',
      en: 'More than 24 hours have passed since the customer last wrote, so WhatsApp does not allow free-form text. Use an approved template.',
    },
    consent_withheld: {
      ar: 'هذا العميل لم يوافق على التواصل عبر واتساب.',
      en: 'This lead has not consented to WhatsApp contact.',
    },
    feature_not_included: {
      ar: 'واتساب غير متاح في باقتك الحالية.',
      en: 'WhatsApp is not included in your current plan.',
    },
    insufficient_role: {
      ar: 'ربط رقم واتساب متاح لمالك المؤسسة أو المدير فقط.',
      en: 'Only an owner or a manager can connect a WhatsApp number.',
    },
    credentials_rejected: {
      ar: 'رفضت ميتا هذه الاعتمادات. تأكد من معرف الرقم ومن أن التوكن دائم وغير منتهٍ.',
      en: 'Meta rejected these credentials. Check the phone number id, and that the token is permanent and not expired.',
    },
    number_already_connected: {
      ar: 'هذا الرقم مرتبط بمؤسسة أخرى بالفعل.',
      en: 'That number is already connected to another organization.',
    },
    lead_not_found: {
      ar: 'لم يتم العثور على العميل.',
      en: 'Lead not found.',
    },
    lead_has_no_phone: {
      ar: 'لا يوجد رقم هاتف لهذا العميل.',
      en: 'This lead has no phone number.',
    },
    lead_phone_invalid: {
      ar: 'رقم هاتف العميل غير صالح للإرسال عبر واتساب.',
      en: "The lead's phone number is not valid for WhatsApp.",
    },
    send_failed: {
      ar: 'رفضت ميتا إرسال الرسالة.',
      en: 'Meta rejected the message.',
    },
    graph_unreachable: {
      ar: 'تعذّر الوصول إلى خدمة واتساب من الخادم.',
      en: 'The server could not reach the WhatsApp service.',
    },
    unauthorized: {
      ar: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
      en: 'Your session expired. Please sign in again.',
    },
    no_organization: {
      ar: 'حسابك غير مرتبط بمؤسسة.',
      en: 'Your account is not linked to an organization.',
    },
    // Mirrors describeAIError: a 404 from the gateway means the function was
    // never deployed, which otherwise reads as a network fault and stays unfixed.
    function_not_deployed: {
      ar: 'دوال واتساب غير منشورة على الخادم. انشرها عبر: supabase functions deploy whatsapp-send',
      en: 'The WhatsApp functions are not deployed. Deploy them with: supabase functions deploy whatsapp-send',
    },
  };
  const known = messages[code];
  if (known) return isRTL ? known.ar : known.en;
  const detail = error?.detail ? ` (${error.detail})` : '';
  return (isRTL
    ? 'تعذّر إتمام طلب واتساب. حاول مرة أخرى.'
    : 'The WhatsApp request could not be completed. Please try again.') + detail;
};

const invokeWhatsApp = async (fn, body) => {
  if (!supabase) throw new WhatsAppError('whatsapp_not_configured');

  const { data, error } = await supabase.functions.invoke(fn, { body });

  if (error) {
    let payload;
    try {
      payload = await error.context?.json?.();
    } catch {
      payload = null;
    }
    const status = error.context?.status || 0;
    const fallback = status === 404 ? 'function_not_deployed' : 'graph_unreachable';
    throw new WhatsAppError(payload?.error || fallback, {
      status,
      detail: payload?.detail ?? null,
    });
  }

  return data;
};

/**
 * The connected number, or null. Reads `whatsapp_accounts`, whose secret
 * pointer column is not granted to `authenticated` — there is nothing sensitive
 * in what comes back.
 */
export const getWhatsAppAccount = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .select('org_id, phone_number_id, waba_id, display_phone_number, verified_name, connected_at')
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ?? null;
};

export const connectWhatsAppAccount = async ({ phoneNumberId, wabaId, accessToken }) => {
  const result = await invokeWhatsApp('whatsapp-connect', {
    action: 'connect',
    phoneNumberId,
    wabaId,
    accessToken,
  });
  // Only now: the server holds the token, so any copy left in this browser
  // from before the migration is pure liability.
  clearLegacyWhatsAppConfig();
  return result;
};

export const disconnectWhatsAppAccount = () =>
  invokeWhatsApp('whatsapp-connect', { action: 'disconnect' });

/**
 * The org's APPROVED templates, read live from Graph. Not cached in Postgres
 * on purpose: approval status changes on Meta's side without telling us, and a
 * stale "approved" here is a send that fails in front of a customer.
 */
export const listWhatsAppTemplates = async () => {
  const result = await invokeWhatsApp('whatsapp-connect', { action: 'templates' });
  return result?.templates ?? [];
};

/**
 * Send to a lead. Note what is NOT a parameter: the phone number. Passing a
 * lead id is what lets the server check consent and the 24-hour window against
 * a record it trusts, rather than against whatever the page had in state.
 *
 * @param {object}  args
 * @param {string}  args.leadId
 * @param {string} [args.text]     Free-form — only legal inside the 24h window.
 * @param {object} [args.template] `{ name, language, components }` — legal any time.
 */
export const sendWhatsAppCloudMessage = ({ leadId, text, template }) =>
  invokeWhatsApp('whatsapp-send', { leadId, text, template });

/** Whether free-form text is currently allowed for this number. */
export const isWhatsAppWindowOpen = async (orgId, phone) => {
  if (!supabase || !orgId || !phone) return false;
  const { data, error } = await supabase
    .rpc('whatsapp_window_open', { target_org: orgId, target_phone: phone });
  return error ? false : Boolean(data);
};

export const fetchLeadConversation = async (leadId, limit = 100) => {
  if (!supabase || !leadId) return [];
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('id, direction, body, message_type, template_name, status, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return error ? [] : (data ?? []);
};

/**
 * Live inbound messages. This is what retires the polling in CRMPage: an
 * incoming reply arrives as a Postgres change the instant the webhook writes
 * it, instead of up to 8 seconds later and only while the tab is open.
 *
 * Returns an unsubscribe function — call it from the effect's cleanup.
 */
export const subscribeToWhatsAppMessages = (onMessage) => {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('whatsapp_messages_stream')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'whatsapp_messages' },
      (payload) => onMessage(payload.new, payload.eventType),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};

const normalizeWhatsAppPhone = (phone) => phone
  .replace(/[^\d]/g, '')
  .replace(/^00/, '');

export const openWhatsAppConversation = (recipientPhone, messageText = '') => {
  const cleaned = normalizeWhatsAppPhone(recipientPhone);
  const encodedText = encodeURIComponent(messageText);
  const waUrl = cleaned
    ? `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`
    : 'https://web.whatsapp.com';
  const openedWindow = window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (!openedWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }
  return openedWindow;
};

// sendRealWhatsAppMessage() used to live here. It was imported nowhere, and it
// sent a permanent Meta access token as an Authorization header straight from
// the browser. Sending moves behind a server-side Cloud API function.

const WHATSAPP_BRIDGE_URL = (import.meta.env.VITE_WHATSAPP_BRIDGE_URL || 'http://localhost:3001').replace(/\/$/, '');

export const sendWhatsAppAttachment = async (recipientPhone, file, caption = '') => {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected attachment.'));
    reader.readAsDataURL(file);
  });
  const base64 = String(dataUrl).split(',')[1];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  let response;
  try {
    response = await fetch(`${WHATSAPP_BRIDGE_URL}/send-media`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: recipientPhone,
        data: base64,
        mimetype: file.type,
        filename: file.name,
        caption
      })
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('WhatsApp attachment upload timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.details || result.error || `WhatsApp bridge HTTP ${response.status}`);
  }
  return result;
};
