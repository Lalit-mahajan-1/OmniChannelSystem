import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app  = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY    = process.env.GROQ_API_KEY;
const API_BASE    = process.env.API_BASE    || 'http://localhost:5000/api';
const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;
const PORT        = process.env.AGENT_PORT  || 5001;

// ── Gmail client ──────────────────────────────────────────────────────────────
const getGmailClient = () => {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
};

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
      max_tokens: 300,
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

// ── Skip automated senders ────────────────────────────────────────────────────
const SKIP_SENDERS = [
  'no-reply', 'noreply', 'notifications@', 'newsletter',
  'updates@', 'alerts@', 'mailer', 'donotreply',
];
const isAutomated = (email) =>
  SKIP_SENDERS.some((s) => email?.toLowerCase().includes(s));

// ── Generate suggested reply ──────────────────────────────────────────────────
const generateSuggestedReply = async (email, threadHistory = []) => {
  const historyText = threadHistory.length
    ? `\nPrevious conversation:\n${threadHistory
        .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Support'}: ${m.body}`)
        .join('\n\n')}\n`
    : '';

  return askGroq(
    `You are a professional customer support agent for a bank.
     Write a helpful, empathetic reply email.
     Keep it under 100 words.
     Do not include a subject line.
     Sign off as "Support Team".`,
    `${historyText}
     Customer name: ${email.customerId?.name || 'Customer'}
     Subject: ${email.subject}
     Latest message: ${email.body}`
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// GET /agent/emails
// All unreplied emails with AI suggested reply for each
app.get('/agent/emails', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/emails`, {
      params: { employerId: EMPLOYER_ID },
    });

    const all = response.data.data || [];
    const unreplied = all.filter(
      (e) => e.direction === 'inbound' &&
             e.status === 'received' &&
             !isAutomated(e.fromEmail)
    );

    const withSuggestions = await Promise.all(
      unreplied.map(async (email) => {
        let threadHistory = [];
        try {
          const t = await axios.get(`${API_BASE}/emails/thread/${email.threadId}`);
          threadHistory = t.data.data || [];
        } catch {}

        const suggestedReply = await generateSuggestedReply(email, threadHistory);
        return { ...email, suggestedReply, threadHistory };
      })
    );

    res.json({ success: true, count: withSuggestions.length, data: withSuggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /agent/emails/:customerId/history
// Full email thread history for a customer
app.get('/agent/emails/:customerId/history', async (req, res) => {
  try {
    const response = await axios.get(
      `${API_BASE}/emails/customer/${req.params.customerId}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /agent/emails/:emailId/send-reply
// Employer edits suggestion and sends final reply
// Body: { "body": "final reply text" }
app.post('/agent/emails/:emailId/send-reply', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: 'Reply body is required' });
    }

    const response = await axios.post(
      `${API_BASE}/emails/${req.params.emailId}/reply`,
      { body: body.trim() }
    );

    res.json({ success: true, message: 'Reply sent', data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /agent/emails/:emailId/auto-reply
// AI generates and sends without employer editing
app.post('/agent/emails/:emailId/auto-reply', async (req, res) => {
  try {
    const emailRes = await axios.get(`${API_BASE}/emails/${req.params.emailId}`);
    const email = emailRes.data.data;

    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    if (isAutomated(email.fromEmail)) {
      return res.status(400).json({ success: false, message: 'Skipping automated sender' });
    }

    let threadHistory = [];
    try {
      const t = await axios.get(`${API_BASE}/emails/thread/${email.threadId}`);
      threadHistory = t.data.data || [];
    } catch {}

    const aiReply = await generateSuggestedReply(email, threadHistory);

    await axios.post(`${API_BASE}/emails/${req.params.emailId}/reply`, { body: aiReply });

    res.json({ success: true, message: 'Auto-reply sent', aiReply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /agent/emails/auto-reply-all
// Auto reply to ALL unreplied emails at once
app.post('/agent/emails/auto-reply-all', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/emails`, {
      params: { employerId: EMPLOYER_ID },
    });

    const unreplied = (response.data.data || []).filter(
      (e) => e.direction === 'inbound' &&
             e.status === 'received' &&
             !isAutomated(e.fromEmail)
    );

    if (!unreplied.length) {
      return res.json({ success: true, message: 'No unreplied emails', handled: 0 });
    }

    const results = [];
    for (const email of unreplied) {
      try {
        let threadHistory = [];
        try {
          const t = await axios.get(`${API_BASE}/emails/thread/${email.threadId}`);
          threadHistory = t.data.data || [];
        } catch {}

        const aiReply = await generateSuggestedReply(email, threadHistory);
        await axios.post(`${API_BASE}/emails/${email._id}/reply`, { body: aiReply });
        results.push({ emailId: email._id, from: email.fromEmail, status: 'sent', aiReply });
        console.log(`Auto-replied to ${email.fromEmail}`);
      } catch (err) {
        results.push({ emailId: email._id, from: email.fromEmail, status: 'failed' });
      }
    }

    res.json({ success: true, handled: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /agent/emails/suggest
// Regenerate AI suggestion (employer clicks "regenerate")
// Body: { emailId, customMessage (optional hint from employer) }
app.post('/agent/emails/suggest', async (req, res) => {
  try {
    const { emailId, customMessage } = req.body;

    const emailRes = await axios.get(`${API_BASE}/emails/${emailId}`);
    const email = emailRes.data.data;

    let threadHistory = [];
    try {
      const t = await axios.get(`${API_BASE}/emails/thread/${email.threadId}`);
      threadHistory = t.data.data || [];
    } catch {}

    const systemPrompt = customMessage
      ? `You are a customer support agent. The employer wants to say: "${customMessage}".
         Rewrite this as a professional, empathetic support email under 100 words.
         Sign off as "Support Team".`
      : `You are a professional customer support agent for a bank.
         Write a helpful, empathetic reply email under 100 words.
         Sign off as "Support Team".`;

    const suggestion = await askGroq(
      systemPrompt,
      `Customer: ${email.customerId?.name || 'Customer'}
       Subject: ${email.subject}
       Message: ${email.body}`
    );

    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /agent/generate-omni
// Generate a response based on raw omnichannel chat history
app.post('/agent/generate-omni', async (req, res) => {
  try {
    const { history } = req.body;
    const systemPrompt = `You are a professional customer support agent for a bank. Write a helpful, empathetic reply to the customer. Keep it under 100 words. Sign off as "Support Team".`;
    const userPrompt = `Here is the recent OmniChannel chat history:\n\n${history}\n\nDraft a concise reply addressing the customer's latest concerns.`;
    const suggestion = await askGroq(systemPrompt, userPrompt);
    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nGmail Agent API running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /agent/emails                        — unreplied emails + AI suggestions`);
  console.log(`  GET  /agent/emails/:customerId/history    — full thread history`);
  console.log(`  POST /agent/emails/:emailId/send-reply    — send employer edited reply`);
  console.log(`  POST /agent/emails/:emailId/auto-reply    — AI auto reply one email`);
  console.log(`  POST /agent/emails/auto-reply-all         — AI auto reply all emails`);
  console.log(`  POST /agent/emails/suggest                — regenerate AI suggestion\n`);
});
