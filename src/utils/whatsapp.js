export const getWhatsAppConfig = () => {
  return {
    phoneNumberId: localStorage.getItem('salesmate_wa_phone_number_id') || '',
    accessToken: localStorage.getItem('salesmate_wa_access_token') || '',
    wabaId: localStorage.getItem('salesmate_wa_waba_id') || ''
  };
};

export const setWhatsAppConfig = ({ phoneNumberId, accessToken, wabaId }) => {
  if (phoneNumberId) localStorage.setItem('salesmate_wa_phone_number_id', phoneNumberId.trim());
  else localStorage.removeItem('salesmate_wa_phone_number_id');

  if (accessToken) localStorage.setItem('salesmate_wa_access_token', accessToken.trim());
  else localStorage.removeItem('salesmate_wa_access_token');

  if (wabaId) localStorage.setItem('salesmate_wa_waba_id', wabaId.trim());
  else localStorage.removeItem('salesmate_wa_waba_id');
};

export const isWhatsAppCloudApiActive = () => {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();
  return !!(phoneNumberId && accessToken);
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
