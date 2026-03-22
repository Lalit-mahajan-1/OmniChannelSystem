import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app         = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY      = process.env.GROQ_API_KEY;
const API_BASE      = process.env.API_BASE      || 'http://localhost:5000/api';
const EMPLOYER_ID   = process.env.EMPLOYER_MONGO_ID;
const GMAIL_AGENT   = process.env.GMAIL_AGENT_URL  || 'http://localhost:5001';
const WA_AGENT      = process.env.WA_AGENT_URL     || 'http://localhost:5002';
const PORT          = process.env.OMNI_AGENT_PORT  || 5003;

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
      max_tokens: 400,
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

// ── Fetch context from BOTH agents ────────────────────────────────────────────
const getBothContexts = async (customerId) => {

  // Hit both agents in parallel
  const [waRes, emailRes] = await Promise.allSettled([
    axios.get(`${WA_AGENT}/wa-agent/chats/${customerId}/history`),
    axios.get(`${GMAIL_AGENT}/agent/emails/${customerId}/history`),
  ]);

  const waMessages = waRes.status === 'fulfilled'
    ? (waRes.value.data.data || [])
    : [];

  const emailMessages = emailRes.status === 'fulfilled'
    ? (emailRes.value.data.data || [])
    : [];

  // Merge into unified sorted timeline
  const merged = [
    ...waMessages.map(m => ({
      channel:   'whatsapp',
      direction: m.direction,
      content:   m.body,
      timestamp: m.whatsappTimestamp || m.createdAt,
    })),
    ...emailMessages.map(e => ({
      channel:   'email',
      direction: e.direction,
      content:   e.subject ? `[${e.subject}] ${e.body}` : e.body,
      timestamp: e.emailDate || e.createdAt,
    })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return { waMessages, emailMessages, merged };
};

// ── Build context string for AI ───────────────────────────────────────────────
const buildContextString = (merged) =>
  merged
    .slice(-10)
    .map(m =>
      `[${m.channel.toUpperCase()}] ${m.direction === 'inbound' ? 'Customer' : 'Support'}: ${m.content?.substring(0, 150)}`
    )
    .join('\n');

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// POST /omni-agent/suggest
// Takes BOTH WhatsApp + Email history → generates best reply for target channel
// Body: { customerId, channel: "whatsapp"|"email", customMessage (optional) }
app.post('/omni-agent/suggest', async (req, res) => {
  try {
    const { customerId, channel = 'whatsapp', customMessage } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required' });
    }

    const { merged } = await getBothContexts(customerId);

    if (!merged.length) {
      return res.status(404).json({ success: false, message: 'No messages found for this customer' });
    }

    const contextText = buildContextString(merged);
    const isWA = channel === 'whatsapp';

    const systemPrompt = customMessage
      ? `You are a ${isWA ? 'WhatsApp' : 'email'} customer support agent.
         The employer wants to say: "${customMessage}".
         Rewrite as a ${isWA ? 'short friendly WhatsApp message (max 3 sentences)' : 'professional support email (max 100 words, sign off as Support Team)'}.`
      : `You are an omnichannel customer support agent for a bank.
         You have full context from both WhatsApp and Email conversations.
         Write a ${isWA
           ? 'SHORT WhatsApp reply (max 3 sentences, conversational, no signature)'
           : 'professional email reply (max 100 words, sign off as Support Team)'
         }.
         Address the customer's most recent concern using ALL available context.`;

    const suggestion = await askGroq(
      systemPrompt,
      `Full conversation history (WhatsApp + Email):\n${contextText}\n\nGenerate the best reply.`
    );

    res.json({
      success: true,
      suggestion,
      channel,
      contextUsed: merged.length,
      waCount:     merged.filter(m => m.channel === 'whatsapp').length,
      emailCount:  merged.filter(m => m.channel === 'email').length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /omni-agent/summary/:customerId
// Customer intelligence summary from ALL channels
// Returns: sentiment, mainIssue, urgency, isResolved, recommendation
app.post('/omni-agent/summary/:customerId', async (req, res) => {
  try {
    const { merged } = await getBothContexts(req.params.customerId);

    if (!merged.length) {
      return res.status(404).json({ success: false, message: 'No messages found' });
    }

    const contextText = buildContextString(merged);

    const summary = await askGroq(
      `You are a customer intelligence analyst for a bank.
       Analyze the conversation history and return ONLY a JSON object with these exact fields:
       {
         "sentiment": "positive|neutral|negative|angry",
         "mainIssue": "one line description of the main issue",
         "isResolved": true or false,
         "urgency": "low|medium|high",
         "recommendation": "one clear action to take next",
         "channelsUsed": ["whatsapp", "email"]
       }
       Return ONLY the JSON. No explanation. No markdown.`,
      `Conversation history:\n${contextText}`
    );

    let parsed;
    try {
      parsed = JSON.parse(summary.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { raw: summary };
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /omni-agent/timeline/:customerId
// Unified timeline from both channels — useful for frontend display
app.get('/omni-agent/timeline/:customerId', async (req, res) => {
  try {
    const { waMessages, emailMessages, merged } = await getBothContexts(req.params.customerId);

    res.json({
      success: true,
      customerId:    req.params.customerId,
      total:         merged.length,
      whatsappCount: waMessages.length,
      emailCount:    emailMessages.length,
      timeline:      merged,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /omni-agent/send
// Send reply on specified channel
// Body: { customerId, channel: "whatsapp"|"email", message, emailId (required if email) }
app.post('/omni-agent/send', async (req, res) => {
  try {
    const { customerId, channel, message, emailId } = req.body;

    if (!customerId || !channel || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'customerId, channel, and message are required',
      });
    }

    let result;

    if (channel === 'whatsapp') {
      const r = await axios.post(`${API_BASE}/webhook/messages/send`, {
        employerId: EMPLOYER_ID,
        customerId,
        message: message.trim(),
      });
      result = r.data;
    } else if (channel === 'email') {
      if (!emailId) {
        return res.status(400).json({ success: false, message: 'emailId is required for email' });
      }
      const r = await axios.post(`${API_BASE}/emails/${emailId}/reply`, {
        body: message.trim(),
      });
      result = r.data;
    } else {
      return res.status(400).json({ success: false, message: 'channel must be whatsapp or email' });
    }

    res.json({ success: true, channel, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nOmni Agent running on http://localhost:${PORT}`);
  console.log(`  POST /omni-agent/suggest             — AI reply using WA + Email context`);
  console.log(`  POST /omni-agent/summary/:id         — customer intelligence report`);
  console.log(`  GET  /omni-agent/timeline/:id        — unified timeline`);
  console.log(`  POST /omni-agent/send                — send on any channel\n`);
});
