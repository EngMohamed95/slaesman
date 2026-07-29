import { useEffect, useMemo, useState } from 'react';

const EVENT_NAME = 'adtodeal-ai-conversations-updated';
const keyFor = email => `adtodeal_ai_conversations_${email || 'default'}`;

const welcomeMessage = lang => ({
  id: `welcome-${Date.now()}`,
  sender: 'ai',
  text: lang === 'ar'
    ? 'مرحباً! أنا مساعدك الشخصي الذكي. اسألني عن العملاء أو الصفقات أو مهام المتابعة.'
    : 'Hello! I am your AI Sales Assistant. Ask me about clients, deals, or follow-up tasks.',
  createdAt: new Date().toISOString()
});

const createConversation = (lang, messages = []) => ({
  id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: lang === 'ar' ? 'محادثة جديدة' : 'New conversation',
  summary: lang === 'ar' ? 'ابدأ سؤالًا جديدًا مع مساعد المبيعات' : 'Start a new conversation',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: messages.length ? messages : [welcomeMessage(lang)]
});

const normalizeMessage = message => ({
  ...message,
  createdAt: message.createdAt || new Date().toISOString()
});

const deriveMetadata = (conversation, lang) => {
  const userMessages = conversation.messages.filter(message => message.sender === 'user');
  const lastMessage = conversation.messages.at(-1);
  const firstQuestion = userMessages[0]?.text || '';
  return {
    ...conversation,
    title: firstQuestion
      ? firstQuestion.slice(0, 52)
      : (conversation.title || (lang === 'ar' ? 'محادثة جديدة' : 'New conversation')),
    summary: lastMessage?.text?.replace(/\s+/g, ' ').slice(0, 100)
      || (lang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'),
    updatedAt: new Date().toISOString()
  };
};

const loadConversations = (email, lang) => {
  const saved = localStorage.getItem(keyFor(email));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // Ignore malformed legacy data and create a clean conversation.
    }
  }

  const legacyKey = `adtodeal_floating_chat_${email || 'default'}`;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy) {
    try {
      const messages = JSON.parse(legacy).map(normalizeMessage);
      return [deriveMetadata(createConversation(lang, messages), lang)];
    } catch {
      // Ignore malformed legacy data.
    }
  }
  return [createConversation(lang)];
};

export const useAIConversations = (email, lang) => {
  const storageKey = keyFor(email);
  const [conversations, setConversations] = useState(() => loadConversations(email, lang));
  const [activeConversationId, setActiveConversationId] = useState(() => conversations[0]?.id);

  useEffect(() => {
    const loaded = loadConversations(email, lang);
    setConversations(loaded);
    setActiveConversationId(loaded[0]?.id);
  }, [email, lang]);

  useEffect(() => {
    const handleUpdate = event => {
      if (event.detail?.key !== storageKey) return;
      setConversations(event.detail.conversations);
      if (event.detail.activeConversationId) {
        setActiveConversationId(event.detail.activeConversationId);
      }
    };
    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME, handleUpdate);
  }, [storageKey]);

  const persist = (next, activeId = activeConversationId) => {
    localStorage.setItem(storageKey, JSON.stringify(next));
    setConversations(next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { key: storageKey, conversations: next, activeConversationId: activeId }
    }));
  };

  const activeConversation = useMemo(
    () => conversations.find(item => item.id === activeConversationId) || conversations[0],
    [conversations, activeConversationId]
  );

  const selectConversation = id => {
    setActiveConversationId(id);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { key: storageKey, conversations, activeConversationId: id }
    }));
  };

  const newConversation = () => {
    const conversation = createConversation(lang);
    persist([conversation, ...conversations], conversation.id);
    setActiveConversationId(conversation.id);
    return conversation;
  };

  const setMessages = updater => {
    const current = activeConversation || newConversation();
    const messages = typeof updater === 'function' ? updater(current.messages) : updater;
    const updated = deriveMetadata({ ...current, messages: messages.map(normalizeMessage) }, lang);
    persist(conversations.map(item => item.id === current.id ? updated : item), current.id);
  };

  const deleteConversation = id => {
    let next = conversations.filter(item => item.id !== id);
    if (!next.length) next = [createConversation(lang)];
    const nextActiveId = id === activeConversationId ? next[0].id : activeConversationId;
    persist(next, nextActiveId);
    setActiveConversationId(nextActiveId);
  };

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages: activeConversation?.messages || [],
    setMessages,
    selectConversation,
    newConversation,
    deleteConversation
  };
};
