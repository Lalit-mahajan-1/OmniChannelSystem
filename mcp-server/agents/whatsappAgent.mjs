import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app         = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY    = process.env.GROQ_API_KEY;
const API_BASE    = process.env.API_BASE    || 'http://localhost:5000/api';
const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;
const PORT        = process.env.WA_AGENT_PORT || 5002;

// ── Groq AI ───────────────────────────────────────────────────────────────────
const askGroq = async (systemPrompt, userPrompt) => {
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      max_tokens: 150,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content.trim();
};

// ── Generate short WhatsApp reply ─────────────────────────────────────────────
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
     Latest message: ${lastMessage}`
  );
};

// ── Send WhatsApp via backend ─────────────────────────────────────────────────
const sendWA = async (customerId, message) => {
  const res = await axios.post(`${API_BASE}/webhook/messages/send`, {
    employerId: EMPLOYER_ID,
    customerId,
    message,
  });
  return res.data;
};

// ── Get all unread chats ──────────────────────────────────────────────────────
const getUnreadChats = async () => {
  const res = await axios.get(`${API_BASE}/webhook/chats`, {
    params: { employerId: EMPLOYER_ID },
  });
  const all = res.data.data || [];
  return all.filter(c => c.unreadCount > 0 || c.lastDirection === 'inbound');
};

// ── Get history for a customer ────────────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS — mirrors gmailAgent.mjs structure exactly
// ════════════════════════════════════════════════════════════════════════════

// GET /wa-agent/chats
// All unread chats with AI suggested reply — same as GET /agent/emails
app.get('/wa-agent/chats', async (req, res) => {
  try {
    const unread = await getUnreadChats();

    const withSuggestions = await Promise.all(
      unread.map(async (chat) => {
        const history = await getHistory(chat.customerId);
        const suggestedReply = await generateReply(
          chat.lastMessage, chat.customerName, history
        );
        return { ...chat, suggestedReply, history };
      })
    );

    res.json({ success: true, count: withSuggestions.length, data: withSuggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /wa-agent/chats/:customerId/history
// Full chat history — same as GET /agent/emails/:customerId/history
app.get('/wa-agent/chats/:customerId/history', async (req, res) => {
  try {
    const history = await getHistory(req.params.customerId);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wa-agent/chats/:customerId/send-reply
// Employer sends edited reply — same as POST /agent/emails/:id/send-reply
// Body: { message: "reply text" }
app.post('/wa-agent/chats/:customerId/send-reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    const result = await sendWA(req.params.customerId, message.trim());
    res.json({ success: true, message: 'WhatsApp reply sent', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wa-agent/chats/:customerId/auto-reply
// AI auto-replies ONE customer — same as POST /agent/emails/:id/auto-reply
app.post('/wa-agent/chats/:customerId/auto-reply', async (req, res) => {
  try {
    const { customerId } = req.params;
    const history = await getHistory(customerId);

    if (!history.length) {
      return res.status(404).json({ success: false, message: 'No chat history found' });
    }

    const latestInbound = [...history].reverse().find(m => m.direction === 'inbound');
    if (!latestInbound) {
      return res.status(400).json({ success: false, message: 'No inbound message found' });
    }

    const customerName = latestInbound.customerId?.name || 'Customer';
    const aiReply = await generateReply(latestInbound.body, customerName, history);
    await sendWA(customerId, aiReply);

    console.log(`Auto-replied to ${customerName}: ${aiReply.slice(0, 60)}...`);
    res.json({ success: true, message: 'Auto-reply sent', aiReply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wa-agent/chats/auto-reply-all
// AI auto-replies ALL unread chats — same as POST /agent/emails/auto-reply-all
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
        const aiReply = await generateReply(chat.lastMessage, chat.customerName, history);
        await sendWA(chat.customerId, aiReply);

        results.push({ customerId: chat.customerId, name: chat.customerName, status: 'sent', aiReply });
        console.log(`Auto-replied to ${chat.customerName}`);

        await new Promise(r => setTimeout(r, 500)); // Meta rate limit buffer
      } catch (err) {
        results.push({ customerId: chat.customerId, status: 'failed', error: err.message });
      }
    }

    res.json({ success: true, handled: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wa-agent/chats/suggest
// Regenerate suggestion — same as POST /agent/emails/suggest
// Body: { customerId, customMessage (optional) }
app.post('/wa-agent/chats/suggest', async (req, res) => {
  try {
    const { customerId, customMessage } = req.body;
    const history = await getHistory(customerId);
    const latestInbound = [...history].reverse().find(m => m.direction === 'inbound');
    const customerName = latestInbound?.customerId?.name || 'Customer';

    const systemPrompt = customMessage
      ? `You are a WhatsApp support agent. Rewrite this as a short friendly WhatsApp message (max 2-3 sentences): "${customMessage}"`
      : `You are a WhatsApp customer support agent for a bank.
         Write a SHORT helpful reply — max 2-3 sentences. Be conversational.`;

    const suggestion = await askGroq(
      systemPrompt,
      `Customer: ${customerName}\nLatest message: ${latestInbound?.body || 'No message'}`
    );

    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Background poller — auto-replies every 60 seconds (like gmail poller) ─────
const startPoller = () => {
  console.log('WhatsApp poller started — auto-checking every 60 seconds');

  setInterval(async () => {
    try {
      const unread = await getUnreadChats();
      if (unread.length > 0) {
        console.log(`Poller: ${unread.length} unread WA chat(s)`);
      }
    } catch (err) {
      console.error('Poller error:', err.message);
    }
  }, 60 * 1000);
};

app.listen(PORT, () => {
  console.log(`\nWhatsApp Agent running on http://localhost:${PORT}`);
  console.log(`  GET  /wa-agent/chats                        — unread + AI suggestions`);
  console.log(`  GET  /wa-agent/chats/:id/history            — full history`);
  console.log(`  POST /wa-agent/chats/:id/send-reply         — send edited reply`);
  console.log(`  POST /wa-agent/chats/:id/auto-reply         — auto reply one`);
  console.log(`  POST /wa-agent/chats/auto-reply-all         — auto reply all`);
  console.log(`  POST /wa-agent/chats/suggest                — regenerate suggestion\n`);
  startPoller();
});
