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

export const sendRealWhatsAppMessage = async (recipientPhone, messageText) => {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();

  // If Meta WhatsApp Business Cloud API credentials exist, make real HTTP POST request to Graph API
  if (phoneNumberId && accessToken) {
    const cleanedPhone = recipientPhone.replace(/[^\d]/g, '');
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanedPhone,
        type: 'text',
        text: { preview_url: true, body: messageText }
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `WhatsApp API HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Fallback: Open real WhatsApp Web / App directly in browser
  const cleaned = recipientPhone.replace(/[^\d]/g, '');
  const encodedText = encodeURIComponent(messageText);
  const waUrl = cleaned 
    ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodedText}` 
    : `https://web.whatsapp.com`;
    
  window.open(waUrl, '_blank');
  return { success: true, mode: 'wa.me' };
};
