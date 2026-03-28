import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import connectDB from '../config/db.mjs';
import { logAgentEvent } from '../services/analyticsLogger.mjs';
import { askGroq } from '../utils/groq.mjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;
const PORT = process.env.WA_AGENT_PORT || 5002;

await connectDB();

const generateReply = async (lastMessage, customerName, history = []) => {
  const historyText = history.length
    ? history.slice(-5).map(m =>
        `${m.direction === 'inbound' ? customerName : 'Support'}: ${m.body}`
      ).join('\n')
    : '';

  return askGroq(
    `You are a WhatsApp customer support agent for a bank.
     Write a SHORT reply — max 2-3 sentences.
     Be friendly and conversational. This is WhatsApp, not email.
     No signatures. No "Dear customer". Just a natural helpful reply.`,
    `${historyText ? 'Previous messages:\n' + historyText + '\n\n' : ''}
     Customer: ${customerName || 'Customer'}
     Latest message: ${lastMessage}`,
    150
  );
};

const sendWA = async (customerId, message) => {
  const res = await axios.post(`${API_BASE}/webhook/messages/send`, {
    employerId: EMPLOYER_ID,
    customerId,
    message,
  });
  return res.data;
};

const getUnreadChats = async () => {
  const res = await axios.get(`${API_BASE}/webhook/chats`, {
    params: { employerId: EMPLOYER_ID },
  });
  const all = res.data.data || [];
  return all.filter(c => c.unreadCount > 0 || c.lastDirection === 'inbound');
};

const getHistory = async (customerId) => {
  try {
    const res = await axios.get(`${API_BASE}/webhook/chats/${customerId}`, {
      params: { employerId: EMPLOYER_ID },
    });
    return res.data.data || [];
  } catch {
    return [];
  }
};

const getCustomer = async (customerId) => {
  try {
    const res = await axios.get(`${API_BASE}/customers/${customerId}`);
    return res.data.data || res.data || null;
  } catch (err) {
    console.error(`[getCustomer] ${customerId} →`, err.response?.status ?? err.message);
    return null;
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

app.get('/wa-agent/chats', async (req, res) => {
  try {
    const unread = await getUnreadChats();

    const withSuggestions = await Promise.all(
      unread.map(async (chat) => {
        const history = await getHistory(chat.customerId);
        const ai = await generateReply(chat.lastMessage, chat.customerName, history);
        return { ...chat, suggestedReply: ai.content, history };
      })
    );

    res.json({ success: true, count: withSuggestions.length, data: withSuggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/wa-agent/chats/:customerId/history', async (req, res) => {
  try {
    const history = await getHistory(req.params.customerId);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/wa-agent/chats/:customerId/send-reply', async (req, res) => {
  const started = Date.now();

  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const history = await getHistory(req.params.customerId);
    const latestInbound = [...history].reverse().find(m => m.direction === 'inbound');

    const sendStart = Date.now();
    const result = await sendWA(req.params.customerId, message.trim());
    const sendLatencyMs = Date.now() - sendStart;

    await logAgentEvent({
      agentType: 'whatsapp',
      actionType: 'manual_send',
      status: 'success',
      employerId: EMPLOYER_ID,
      customerId: req.params.customerId,
      chatId: req.params.customerId,
      channel: 'whatsapp',
      inboundMessage: latestInbound?.body || '',
      aiReply: message.trim(),
      sendLatencyMs,
      totalLatencyMs: Date.now() - started,
      messageLength: (latestInbound?.body || '').length,
      replyLength: message.trim().length,
    });

    res.json({ success: true, message: 'WhatsApp reply sent', data: result });
  } catch (err) {
    await logAgentEvent({
      agentType: 'whatsapp',
      actionType: 'manual_send',
      status: 'failed',
      employerId: EMPLOYER_ID,
      customerId: req.params.customerId,
      chatId: req.params.customerId,
      channel: 'whatsapp',
      totalLatencyMs: Date.now() - started,
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/wa-agent/chats/:customerId/auto-reply', async (req, res) => {
  const started = Date.now();

  try {
    const { customerId } = req.params;
    const history = await getHistory(customerId);

    if (!history.length) {
      await logAgentEvent({
        agentType: 'whatsapp',
        actionType: 'auto_reply',
        status: 'failed',
        employerId: EMPLOYER_ID,
        customerId,
        chatId: customerId,
        channel: 'whatsapp',
        totalLatencyMs: Date.now() - started,
        errorMessage: 'No chat history found',
      });
      return res.status(404).json({ success: false, message: 'No chat history found' });
    }

    const latestInbound = [...history].reverse().find(m => m.direction === 'inbound');
    if (!latestInbound) {
      await logAgentEvent({
        agentType: 'whatsapp',
        actionType: 'auto_reply',
        status: 'failed',
        employerId: EMPLOYER_ID,
        customerId,
        chatId: customerId,
        channel: 'whatsapp',
        totalLatencyMs: Date.now() - started,
        errorMessage: 'No inbound message found',
      });
      return res.status(400).json({ success: false, message: 'No inbound message found' });
    }

    const customerName = latestInbound.customerId?.name || 'Customer';
    const ai = await generateReply(latestInbound.body, customerName, history);

    const sendStart = Date.now();
    await sendWA(customerId, ai.content);
    const sendLatencyMs = Date.now() - sendStart;

    await logAgentEvent({
      agentType: 'whatsapp',
      actionType: 'auto_reply',
      status: 'success',
      employerId: EMPLOYER_ID,
      customerId,
      chatId: customerId,
      channel: 'whatsapp',
      inboundMessage: latestInbound.body || '',
      aiReply: ai.content,
      model: ai.model,
      generationLatencyMs: ai.latencyMs,
      sendLatencyMs,
      totalLatencyMs: Date.now() - started,
      messageLength: (latestInbound.body || '').length,
      replyLength: ai.content.length,
    });

    console.log(`[Auto-Reply WA] Sent to ${customerName}: ${ai.content.slice(0, 60)}...`);
    res.json({ success: true, message: 'Auto-reply sent', aiReply: ai.content });
  } catch (err) {
    await logAgentEvent({
      agentType: 'whatsapp',
      actionType: 'auto_reply',
      status: 'failed',
      employerId: EMPLOYER_ID,
      customerId: req.params.customerId,
      chatId: req.params.customerId,
      channel: 'whatsapp',
      totalLatencyMs: Date.now() - started,
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/wa-agent/chats/auto-reply-all', async (req, res) => {
  try {
    const unread = await getUnreadChats();

    if (!unread.length) {
      return res.json({ success: true, message: 'No unread chats', handled: 0 });
    }

    const results = [];
    for (const chat of unread) {
      try {
        const history = await getHistory(chat.customerId);
        const ai = await generateReply(chat.lastMessage, chat.customerName, history);

        const sendStart = Date.now();
        await sendWA(chat.customerId, ai.content);
        const sendLatencyMs = Date.now() - sendStart;

        await logAgentEvent({
          agentType: 'whatsapp',
          actionType: 'auto_reply_all',
          status: 'success',
          employerId: EMPLOYER_ID,
          customerId: chat.customerId,
          chatId: chat.customerId,
          channel: 'whatsapp',
          inboundMessage: chat.lastMessage || '',
          aiReply: ai.content,
          model: ai.model,
          generationLatencyMs: ai.latencyMs,
          sendLatencyMs,
          totalLatencyMs: ai.latencyMs + sendLatencyMs,
          messageLength: (chat.lastMessage || '').length,
          replyLength: ai.content.length,
          metadata: {
            customerName: chat.customerName || '',
          },
        });

        results.push({ customerId: chat.customerId, name: chat.customerName, status: 'sent', aiReply: ai.content });
        console.log(`[Auto-Reply-All WA] Replied to ${chat.customerName}`);

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        await logAgentEvent({
          agentType: 'whatsapp',
          actionType: 'auto_reply_all',
          status: 'failed',
          employerId: EMPLOYER_ID,
          customerId: chat.customerId,
          chatId: chat.customerId,
          channel: 'whatsapp',
          inboundMessage: chat.lastMessage || '',
          errorMessage: err.message,
          metadata: {
            customerName: chat.customerName || '',
          },
        });

        results.push({ customerId: chat.customerId, status: 'failed', error: err.message });
      }
    }

    res.json({ success: true, handled: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/wa-agent/chats/suggest', async (req, res) => {
  const started = Date.now();

  try {
    const { customerId, customMessage } = req.body;
    const history = await getHistory(customerId);
    const latestInbound = [...history].reverse().find(m => m.direction === 'inbound');
    const customerName = latestInbound?.customerId?.name || 'Customer';

    const systemPrompt = customMessage
      ? `You are a WhatsApp support agent. Rewrite this as a short friendly WhatsApp message (max 2-3 sentences): "${customMessage}"`
      : `You are a WhatsApp customer support agent for a bank.
         Write a SHORT helpful reply — max 2-3 sentences. Be conversational.`;

    const ai = await askGroq(
      systemPrompt,
      `Customer: ${customerName}\nLatest message: ${latestInbound?.body || 'No message'}`,
      150
    );

    await logAgentEvent({
      agentType: 'whatsapp',
      actionType: 'suggestion',
      status: 'success',
      employerId: EMPLOYER_ID,
      customerId,
      chatId: customerId,
      channel: 'whatsapp',
      inboundMessage: latestInbound?.body || '',
      aiReply: ai.content,
      model: ai.model,
      generationLatencyMs: ai.latencyMs,
      totalLatencyMs: Date.now() - started,
      messageLength: (latestInbound?.body || '').length,
      replyLength: ai.content.length,
      metadata: {
        customerName,
        customMessage: customMessage || '',
      },
    });

    res.json({ success: true, suggestion: ai.content });
  } catch (err) {
    await logAgentEvent({
      agentType: 'whatsapp',
      actionType: 'suggestion',
      status: 'failed',
      employerId: EMPLOYER_ID,
      channel: 'whatsapp',
      totalLatencyMs: Date.now() - started,
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Background poller ─────────────────────────────────────────────────────────
const processedMessageIds = new Set();

const startPoller = () => {
  console.log('WhatsApp auto-reply poller started — checking every 30 seconds');

  setInterval(async () => {
    try {
      const unread = await getUnreadChats();
      if (!unread.length) return;

      console.log(`[Poller] ${unread.length} unread WA chat(s) — checking auto-reply flags`);

      for (const chat of unread) {
        try {
          const customer = await getCustomer(chat.customerId);

          if (!customer) {
            console.warn(`[Poller] Could not fetch customer ${chat.customerId}, skipping`);
            continue;
          }

          if (!customer.autoReplyWhatsapp) continue;

          const history = await getHistory(chat.customerId);
          const latestInbound = [...history].reverse().find(m => m.direction === 'inbound');

          if (!latestInbound) continue;

          const msgKey = `${chat.customerId}__${latestInbound._id || latestInbound.id || latestInbound.whatsappTimestamp}`;
          if (processedMessageIds.has(msgKey)) continue;

          processedMessageIds.add(msgKey);

          const customerName = customer.name || chat.customerName || 'Customer';
          const started = Date.now();
          const ai = await generateReply(latestInbound.body, customerName, history);

          const sendStart = Date.now();
          await sendWA(chat.customerId, ai.content);
          const sendLatencyMs = Date.now() - sendStart;

          await logAgentEvent({
            agentType: 'whatsapp',
            actionType: 'poller_auto_reply',
            status: 'success',
            employerId: EMPLOYER_ID,
            customerId: chat.customerId,
            chatId: chat.customerId,
            channel: 'whatsapp',
            inboundMessage: latestInbound.body || '',
            aiReply: ai.content,
            model: ai.model,
            generationLatencyMs: ai.latencyMs,
            sendLatencyMs,
            totalLatencyMs: Date.now() - started,
            messageLength: (latestInbound.body || '').length,
            replyLength: ai.content.length,
            autoReplyEnabled: !!customer.autoReplyWhatsapp,
            metadata: {
              customerName,
              msgKey,
            },
          });

          console.log(`[Poller Auto-Reply] Sent to ${customerName}: ${ai.content.slice(0, 60)}...`);
          await new Promise(r => setTimeout(r, 800));
        } catch (err) {
          await logAgentEvent({
            agentType: 'whatsapp',
            actionType: 'poller_auto_reply',
            status: 'failed',
            employerId: EMPLOYER_ID,
            customerId: chat.customerId,
            chatId: chat.customerId,
            channel: 'whatsapp',
            inboundMessage: chat.lastMessage || '',
            errorMessage: err.message,
            metadata: {
              customerName: chat.customerName || '',
            },
          });

          console.error(`[Poller] Failed for customer ${chat.customerId}:`, err.message);
        }
      }

      if (processedMessageIds.size > 500) {
        const entries = [...processedMessageIds];
        entries.slice(0, 200).forEach(e => processedMessageIds.delete(e));
      }
    } catch (err) {
      console.error('[Poller] Error:', err.message);
    }
  }, 30 * 1000);
};

app.listen(PORT, () => {
  console.log(`\nWhatsApp Agent running on http://localhost:${PORT}`);
  console.log(`  GET  /wa-agent/chats`);
  console.log(`  GET  /wa-agent/chats/:id/history`);
  console.log(`  POST /wa-agent/chats/:id/send-reply`);
  console.log(`  POST /wa-agent/chats/:id/auto-reply`);
  console.log(`  POST /wa-agent/chats/auto-reply-all`);
  console.log(`  POST /wa-agent/chats/suggest\n`);
  startPoller();
});