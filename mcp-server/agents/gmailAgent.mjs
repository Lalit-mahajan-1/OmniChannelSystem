import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
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
const PORT = process.env.AGENT_PORT || 5001;

// ── DB connect
await connectDB();

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

  const result = await askGroq(
    `You are a professional customer support agent for a bank.
     Write a helpful, empathetic reply email.
     Keep it under 100 words.
     Do not include a subject line.
     Sign off as "Support Team".`,
    `${historyText}
     Customer name: ${email.customerId?.name || 'Customer'}
     Subject: ${email.subject}
     Latest message: ${email.body}`,
    300
  );

  return result;
};

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

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

        const { content: suggestedReply } = await generateSuggestedReply(email, threadHistory);
        return { ...email, suggestedReply, threadHistory };
      })
    );

    res.json({ success: true, count: withSuggestions.length, data: withSuggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

app.post('/agent/emails/:emailId/send-reply', async (req, res) => {
  const started = Date.now();

  try {
    const { body } = req.body;
    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: 'Reply body is required' });
    }

    const emailRes = await axios.get(`${API_BASE}/emails/${req.params.emailId}`);
    const email = emailRes.data.data;

    const sendStart = Date.now();
    const response = await axios.post(
      `${API_BASE}/emails/${req.params.emailId}/reply`,
      { body: body.trim() }
    );
    const sendLatencyMs = Date.now() - sendStart;

    await logAgentEvent({
      agentType: 'gmail',
      actionType: 'manual_send',
      status: 'success',
      employerId: EMPLOYER_ID,
      customerId: email?.customerId?._id || email?.customerId || '',
      emailId: req.params.emailId,
      threadId: email?.threadId || '',
      channel: 'email',
      inboundMessage: email?.body || '',
      aiReply: body.trim(),
      generationLatencyMs: 0,
      sendLatencyMs,
      totalLatencyMs: Date.now() - started,
      messageLength: (email?.body || '').length,
      replyLength: body.trim().length,
      metadata: {
        subject: email?.subject || '',
        fromEmail: email?.fromEmail || '',
      },
    });

    res.json({ success: true, message: 'Reply sent', data: response.data });
  } catch (err) {
    await logAgentEvent({
      agentType: 'gmail',
      actionType: 'manual_send',
      status: 'failed',
      employerId: EMPLOYER_ID,
      emailId: req.params.emailId,
      channel: 'email',
      totalLatencyMs: Date.now() - started,
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/agent/emails/:emailId/auto-reply', async (req, res) => {
  const started = Date.now();

  try {
    const emailRes = await axios.get(`${API_BASE}/emails/${req.params.emailId}`);
    const email = emailRes.data.data;

    if (!email) {
      await logAgentEvent({
        agentType: 'gmail',
        actionType: 'auto_reply',
        status: 'failed',
        employerId: EMPLOYER_ID,
        emailId: req.params.emailId,
        channel: 'email',
        totalLatencyMs: Date.now() - started,
        errorMessage: 'Email not found',
      });
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    if (isAutomated(email.fromEmail)) {
      await logAgentEvent({
        agentType: 'gmail',
        actionType: 'auto_reply',
        status: 'skipped',
        employerId: EMPLOYER_ID,
        customerId: email?.customerId?._id || email?.customerId || '',
        emailId: req.params.emailId,
        threadId: email?.threadId || '',
        channel: 'email',
        inboundMessage: email?.body || '',
        totalLatencyMs: Date.now() - started,
        errorMessage: 'Skipping automated sender',
      });
      return res.status(400).json({ success: false, message: 'Skipping automated sender' });
    }

    let threadHistory = [];
    try {
      const t = await axios.get(`${API_BASE}/emails/thread/${email.threadId}`);
      threadHistory = t.data.data || [];
    } catch {}

    const ai = await generateSuggestedReply(email, threadHistory);

    const sendStart = Date.now();
    await axios.post(`${API_BASE}/emails/${req.params.emailId}/reply`, { body: ai.content });
    const sendLatencyMs = Date.now() - sendStart;

    await logAgentEvent({
      agentType: 'gmail',
      actionType: 'auto_reply',
      status: 'success',
      employerId: EMPLOYER_ID,
      customerId: email?.customerId?._id || email?.customerId || '',
      emailId: req.params.emailId,
      threadId: email?.threadId || '',
      channel: 'email',
      inboundMessage: email?.body || '',
      aiReply: ai.content,
      model: ai.model,
      generationLatencyMs: ai.latencyMs,
      sendLatencyMs,
      totalLatencyMs: Date.now() - started,
      messageLength: (email?.body || '').length,
      replyLength: ai.content.length,
      metadata: {
        subject: email?.subject || '',
        fromEmail: email?.fromEmail || '',
      },
    });

    res.json({ success: true, message: 'Auto-reply sent', aiReply: ai.content });
  } catch (err) {
    await logAgentEvent({
      agentType: 'gmail',
      actionType: 'auto_reply',
      status: 'failed',
      employerId: EMPLOYER_ID,
      emailId: req.params.emailId,
      channel: 'email',
      totalLatencyMs: Date.now() - started,
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/agent/emails/auto-reply-all', async (req, res) => {
  const started = Date.now();

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

        const ai = await generateSuggestedReply(email, threadHistory);

        const sendStart = Date.now();
        await axios.post(`${API_BASE}/emails/${email._id}/reply`, { body: ai.content });
        const sendLatencyMs = Date.now() - sendStart;

        await logAgentEvent({
          agentType: 'gmail',
          actionType: 'auto_reply_all',
          status: 'success',
          employerId: EMPLOYER_ID,
          customerId: email?.customerId?._id || email?.customerId || '',
          emailId: email._id,
          threadId: email?.threadId || '',
          channel: 'email',
          inboundMessage: email?.body || '',
          aiReply: ai.content,
          model: ai.model,
          generationLatencyMs: ai.latencyMs,
          sendLatencyMs,
          totalLatencyMs: ai.latencyMs + sendLatencyMs,
          messageLength: (email?.body || '').length,
          replyLength: ai.content.length,
          metadata: {
            subject: email?.subject || '',
            fromEmail: email?.fromEmail || '',
          },
        });

        results.push({ emailId: email._id, from: email.fromEmail, status: 'sent', aiReply: ai.content });
        console.log(`Auto-replied to ${email.fromEmail}`);
      } catch (err) {
        await logAgentEvent({
          agentType: 'gmail',
          actionType: 'auto_reply_all',
          status: 'failed',
          employerId: EMPLOYER_ID,
          customerId: email?.customerId?._id || email?.customerId || '',
          emailId: email._id,
          threadId: email?.threadId || '',
          channel: 'email',
          inboundMessage: email?.body || '',
          totalLatencyMs: 0,
          errorMessage: err.message,
          metadata: {
            subject: email?.subject || '',
            fromEmail: email?.fromEmail || '',
          },
        });

        results.push({ emailId: email._id, from: email.fromEmail, status: 'failed' });
      }
    }

    res.json({ success: true, handled: results.length, results, totalLatencyMs: Date.now() - started });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/agent/emails/suggest', async (req, res) => {
  const started = Date.now();

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

    const ai = await askGroq(
      systemPrompt,
      `Customer: ${email.customerId?.name || 'Customer'}
       Subject: ${email.subject}
       Message: ${email.body}`,
      300
    );

    await logAgentEvent({
      agentType: 'gmail',
      actionType: 'suggestion',
      status: 'success',
      employerId: EMPLOYER_ID,
      customerId: email?.customerId?._id || email?.customerId || '',
      emailId,
      threadId: email?.threadId || '',
      channel: 'email',
      inboundMessage: email?.body || '',
      aiReply: ai.content,
      model: ai.model,
      generationLatencyMs: ai.latencyMs,
      totalLatencyMs: Date.now() - started,
      messageLength: (email?.body || '').length,
      replyLength: ai.content.length,
      metadata: {
        subject: email?.subject || '',
        customMessage: customMessage || '',
      },
    });

    res.json({ success: true, suggestion: ai.content });
  } catch (err) {
    await logAgentEvent({
      agentType: 'gmail',
      actionType: 'suggestion',
      status: 'failed',
      employerId: EMPLOYER_ID,
      channel: 'email',
      totalLatencyMs: Date.now() - started,
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/agent/generate-omni', async (req, res) => {
  try {
    const { history } = req.body;
    const ai = await askGroq(
      `You are a professional customer support agent for a bank. Write a helpful, empathetic reply to the customer. Keep it under 100 words. Sign off as "Support Team".`,
      `Here is the recent OmniChannel chat history:\n\n${history}\n\nDraft a concise reply addressing the customer's latest concerns.`,
      300
    );
    res.json({ success: true, suggestion: ai.content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nGmail Agent API running on http://localhost:${PORT}`);
  console.log(`  GET  /agent/emails`);
  console.log(`  GET  /agent/emails/:customerId/history`);
  console.log(`  POST /agent/emails/:emailId/send-reply`);
  console.log(`  POST /agent/emails/:emailId/auto-reply`);
  console.log(`  POST /agent/emails/auto-reply-all`);
  console.log(`  POST /agent/emails/suggest\n`);
});