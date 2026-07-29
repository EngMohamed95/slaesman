const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '35mb' }));

const PORT = Number(process.env.WHATSAPP_BRIDGE_PORT) || 3001;
const DEFAULT_MESSAGE_LIMIT = 1000;
const MAX_MESSAGE_LIMIT = 5000;

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

let qrCodeData = null;
let connectionStatus = 'INITIALIZING';
let lastError = null;

async function installWhatsAppCompatibilityPatch() {
    await client.pupPage.evaluate(() => {
        // WhatsApp Web currently exposes some chat keys as LIDs without a
        // serialized lastReceivedKey. The upstream serializer tries to query
        // IndexedDB with that missing key and silently drops every chat.
        window.WWebJS.getChatModel = async (chat, { isChannel = false } = {}) => {
            if (!chat) return null;

            const model = chat.serialize();
            model.isGroup = Boolean(chat.groupMetadata);
            model.isMuted = chat.mute?.expiration !== 0;
            model.formattedTitle = chat.formattedTitle || chat.name || '';
            if (isChannel) model.isChannel = Boolean(chat.newsletterMetadata);

            if (chat.groupMetadata) {
                model.groupMetadata = chat.groupMetadata.serialize();
                model.isReadOnly = Boolean(chat.groupMetadata.announce);
            }

            const loadedMessages = chat.msgs?.getModelsArray?.() || [];
            const lastMessage = loadedMessages
                .filter(message => !message.isNotification)
                .sort((a, b) => (a.t || 0) - (b.t || 0))
                .at(-1);
            model.lastMessage = lastMessage
                ? window.WWebJS.getMessageModel(lastMessage)
                : null;

            delete model.msgs;
            delete model.msgUnsyncedButtonReplyMsgs;
            delete model.unsyncedButtonReplies;
            return model;
        };
    });
}

client.on('qr', async (qr) => {
    console.log('WhatsApp QR Code generated.');
    try {
        qrCodeData = await qrcode.toDataURL(qr);
        connectionStatus = 'QR_READY';
        lastError = null;
    } catch (err) {
        console.error('Failed to convert QR code to Data URL', err);
    }
});

client.on('ready', async () => {
    try {
        await installWhatsAppCompatibilityPatch();
        console.log('WhatsApp connection successfully established.');
        qrCodeData = null;
        connectionStatus = 'CONNECTED';
        lastError = null;
    } catch (error) {
        console.error('Failed to install WhatsApp compatibility layer:', error);
        connectionStatus = 'ERROR';
        lastError = error.message;
    }
});

client.on('authenticated', () => {
    console.log('WhatsApp client authenticated.');
    connectionStatus = 'AUTHENTICATED';
});

client.on('loading_screen', (percent) => {
    if (connectionStatus !== 'CONNECTED') {
        connectionStatus = `LOADING:${percent}`;
    }
});

client.on('auth_failure', (msg) => {
    console.error('WhatsApp authentication failure:', msg);
    connectionStatus = 'DISCONNECTED';
    qrCodeData = null;
    lastError = String(msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    connectionStatus = 'DISCONNECTED';
    qrCodeData = null;
    lastError = String(reason);
});

client.initialize().catch(err => {
    console.error('Error during WhatsApp client initialization:', err);
    connectionStatus = 'ERROR';
    lastError = err.message;
});

// Endpoint to fetch bridge status and current QR code
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: qrCodeData,
        phone: client.info ? '+' + client.info.wid.user : null,
        error: lastError
    });
});

const formatPhone = (id) => {
    if (!id || id.server === 'g.us' || id.server === 'lid') return '';
    return id.user ? `+${id.user}` : '';
};

const formatMessage = (message) => ({
    id: message.id?._serialized || `${message.timestamp}-${message.fromMe}`,
    sender: message.fromMe ? 'agent' : 'customer',
    text: message.body || '',
    type: message.type || 'chat',
    hasMedia: Boolean(message.hasMedia),
    timestamp: message.timestamp,
    time: new Date(message.timestamp * 1000).toISOString()
});

async function resolvePhoneNumber(id) {
    if (!id || id.server === 'g.us') return '';
    if (id.server !== 'lid') return formatPhone(id);

    try {
        const phoneId = await client.pupPage.evaluate((serializedId) => {
            const wid = window.require('WAWebWidFactory').createWid(serializedId);
            const { toPn } = window.require('WAWebLidMigrationUtils');
            return toPn(wid)?._serialized || null;
        }, id._serialized);
        return phoneId ? `+${phoneId.split('@')[0]}` : '';
    } catch (error) {
        console.warn(`Could not map LID ${id._serialized} to a phone number:`, error.message);
        return '';
    }
}

async function getChatContactInfo(chat) {
    if (chat.isGroup) {
        return { name: chat.name || 'WhatsApp Group', phone: '' };
    }

    try {
        const contact = await chat.getContact();
        return {
            name: contact.name
                || contact.pushname
                || contact.shortName
                || chat.name
                || await resolvePhoneNumber(chat.id)
                || 'WhatsApp User',
            phone: await resolvePhoneNumber(chat.id)
        };
    } catch (error) {
        console.warn(`Could not resolve contact name for ${chat.id._serialized}:`, error.message);
        const phone = await resolvePhoneNumber(chat.id);
        return { name: chat.name || phone || 'WhatsApp User', phone };
    }
}

// Fetch every chat and resolve the saved/push contact name.
app.get('/chats', async (req, res) => {
    try {
        if (connectionStatus !== 'CONNECTED') {
            return res.status(400).json({ error: 'Not connected to WhatsApp' });
        }
        const chats = await client.getChats();
        const formattedChats = await Promise.all(chats.map(async (c) => {
            const contactInfo = await getChatContactInfo(c);
            const lastMsgBody = c.lastMessage ? c.lastMessage.body : '';
            const msgTime = c.lastMessage 
                ? new Date(c.lastMessage.timestamp * 1000).toISOString()
                : '';
                
            return {
                id: c.id._serialized,
                name: contactInfo.name,
                phone: contactInfo.phone,
                isGroup: Boolean(c.isGroup),
                unreadCount: c.unreadCount || 0,
                lastMsg: lastMsgBody,
                time: msgTime,
                messages: [] // loaded dynamically on select
            };
        }));

        formattedChats.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
        
        res.json({ chats: formattedChats });
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).json({ error: 'Failed to fetch WhatsApp chats', details: err.message });
    }
});

// Endpoint to fetch message history for a specific chat
app.get('/chats/:chatId/messages', async (req, res) => {
    try {
        if (connectionStatus !== 'CONNECTED') {
            return res.status(400).json({ error: 'Not connected to WhatsApp' });
        }
        const { chatId } = req.params;
        const chat = await client.getChatById(chatId);
        const fetchAll = req.query.all === 'true';
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = fetchAll
            ? Infinity
            : Number.isFinite(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), MAX_MESSAGE_LIMIT)
            : DEFAULT_MESSAGE_LIMIT;
        const messages = await chat.fetchMessages({ limit });
        const formattedMessages = messages
            .map(formatMessage)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        res.json({
            messages: formattedMessages,
            count: formattedMessages.length,
            limit: fetchAll ? null : limit,
            mayHaveMore: fetchAll ? false : formattedMessages.length === limit
        });
    } catch (err) {
        console.error(`Error fetching messages for chat ${req.params.chatId}:`, err);
        res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
    }
});

// Endpoint to log out and destroy the WhatsApp session
app.post('/logout', async (req, res) => {
    try {
        if (client) {
            await client.logout().catch(() => {});
            connectionStatus = 'DISCONNECTED';
            qrCodeData = null;
            lastError = null;
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ error: 'Failed to log out', details: err.message });
    }
});

// Endpoint to inspect store and client state
app.get('/debug', async (req, res) => {
    try {
        if (!client) {
            return res.json({ error: 'Client not initialized' });
        }
        const state = await client.getState().catch(e => e.message);
        
        const info = await client.pupPage.evaluate(async () => {
            try {
                const store = window.require('WAWebCollections');
                const chatModel = store.Chat;
                const models = chatModel ? chatModel.getModelsArray() : null;
                
                let testError = null;
                if (models && models.length > 0) {
                    try {
                        await window.WWebJS.getChatModel(models[0]);
                    } catch (err) {
                        testError = { message: err.message, stack: err.stack };
                    }
                }
                
                return {
                    hasWAWebCollections: !!store,
                    hasChat: !!chatModel,
                    modelsCount: models ? models.length : null,
                    testError: testError
                };
            } catch (err) {
                return { error: err.message, stack: err.stack };
            }
        }).catch(e => ({ error: e.message }));

        res.json({
            status: connectionStatus,
            state: state,
            info: info
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to send a WhatsApp message (optional/future extension)
app.post('/send', async (req, res) => {
    const { chatId, message } = req.body;
    try {
        if (connectionStatus !== 'CONNECTED') {
            return res.status(400).json({ error: 'Not connected to WhatsApp' });
        }
        if (!chatId || !message) {
            return res.status(400).json({ error: 'chatId and message parameters are required.' });
        }
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});

// Send an image/video from the CRM through the already connected Web session.
app.post('/send-media', async (req, res) => {
    const { phone, data, mimetype, filename, caption = '' } = req.body;
    try {
        if (connectionStatus !== 'CONNECTED') {
            return res.status(400).json({ error: 'Not connected to WhatsApp' });
        }
        if (!phone || !data || !mimetype) {
            return res.status(400).json({ error: 'phone, data and mimetype are required.' });
        }
        if (!/^image\/|^video\//.test(mimetype)) {
            return res.status(400).json({ error: 'Only image and video attachments are supported.' });
        }

        const cleanedPhone = String(phone).replace(/\D/g, '').replace(/^00/, '');
        const numberId = await client.getNumberId(cleanedPhone);
        if (!numberId) {
            return res.status(404).json({ error: 'This phone number is not registered on WhatsApp.' });
        }

        const media = new MessageMedia(mimetype, data, filename || 'attachment');
        const sentMessage = await client.sendMessage(numberId._serialized, media, {
            caption: String(caption || '')
        });
        res.json({ success: true, messageId: sentMessage.id?._serialized || null });
    } catch (err) {
        console.error('Error sending WhatsApp media:', err);
        res.status(500).json({ error: 'Failed to send WhatsApp attachment', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp Bridge Server running on http://localhost:${PORT}`);
});
