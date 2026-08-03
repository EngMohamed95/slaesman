// Shared parser for pasted WhatsApp transcripts.
// Previously duplicated byte-for-byte in CRMPage.jsx and AIAssistantPage.jsx.

const AGENT_NAME_KEYWORDS = ['agent', 'me', 'sales', 'salesman', 'salesmate', 'مندوب', 'أنا', 'المبيعات'];
const AGENT_PHRASE_SIGNALS = ['سعر', 'المطور', 'عرض', 'خصم', 'الموقع', 'زيارة', 'معاينة', 'أهلاً بك', 'مرحباً بك', 'price', 'developer', 'discount'];

export const parseChatToMessages = (text) => {
  if (!text) return [];
  const lines = text.split('\n');
  const messages = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const cleanLine = trimmed.replace(/^\[[^\]]+\]\s*/, ''); // strip timestamps like [20/06/2026, 14:15]

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

    // With a name prefix, classify by the name; otherwise guess from wording.
    const isAgent = senderName
      ? AGENT_NAME_KEYWORDS.some(kw => senderName.toLowerCase().includes(kw))
      : AGENT_PHRASE_SIGNALS.some(sig => cleanLine.toLowerCase().includes(sig));
    const sender = isAgent ? 'agent' : 'customer';

    messages.push({
      sender,
      senderName: senderName || (sender === 'agent' ? 'AdToDeal' : 'Client'),
      text: messageText
    });
  });

  return messages;
};
