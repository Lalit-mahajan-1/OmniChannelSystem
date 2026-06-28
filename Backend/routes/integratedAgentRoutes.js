const express = require('express');
const axios = require('axios');
const router = express.Router();
const Message = require('../models/Message');
const Email = require('../models/Email');
const Customer = require('../models/Customer');
const Employer = require('../models/Employer');

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const askGroq = async (systemPrompt, userPrompt, maxTokens = 150) => {
  const started = Date.now();
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    },
    { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
  );
  return { content: res.data.choices[0].message.content.trim(), latencyMs: Date.now() - started, model: GROQ_MODEL };
};

// ── WA Agent: Get chats with suggestions ──
router.get('/wa-agent/chats', async (req, res) => {
  try {
    const employerId = process.env.EMPLOYER_MONGO_ID;
    const chats = await Message.aggregate([
      { $match: { employerId: require('mongoose').Types.ObjectId.createFromHexString(employerId) } },
      { $sort: { whatsappTimestamp: -1 } },
      { $group: { _id: '$customerId', lastMessage: { $first: '$body' }, lastMessageTime: { $first: '$whatsappTimestamp' }, lastDirection: { $first: '$direction' }, unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$direction', 'inbound'] }, { $eq: ['$status', 'received'] }] }, 1, 0] } } } },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $project: { customerId: '$customer._id', customerName: '$customer.name', customerEmail: '$customer.email', lastMessage: 1, lastMessageTime: 1, lastDirection: 1, unreadCount: 1 } },
      { $sort: { lastMessageTime: -1 } },
    ]);

    const withSuggestions = await Promise.all(
      chats.filter(c => c.unreadCount > 0 || c.lastDirection === 'inbound').slice(0, 5).map(async (chat) => {
        try {
          const ai = await askGroq(
            'You are a WhatsApp customer support agent for a bank. IMPORTANT: Directly answer the customer\'s specific question. Write a SHORT reply — max 2-3 sentences. No signatures.',
            `Customer: ${chat.customerName || 'Customer'}\nLatest message: ${chat.lastMessage}`,
            150
          );
          return { ...chat, suggestedReply: ai.content };
        } catch { return { ...chat, suggestedReply: '' }; }
      })
    );

    res.json({ success: true, count: withSuggestions.length, data: withSuggestions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WA Agent: Get chat history ──
router.get('/wa-agent/chats/:customerId/history', async (req, res) => {
  try {
    const employerId = process.env.EMPLOYER_MONGO_ID;
    const messages = await Message.find({ customerId: req.params.customerId, employerId })
      .sort({ whatsappTimestamp: 1 })
      .populate('customerId', 'name email phone channel_ids')
      .select('-rawPayload -__v');
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WA Agent: Suggest reply ──
router.post('/wa-agent/chats/suggest', async (req, res) => {
  try {
    const { customerId } = req.body;
    const employerId = process.env.EMPLOYER_MONGO_ID;
    const history = await Message.find({ customerId, employerId }).sort({ whatsappTimestamp: -1 }).limit(10).lean();
    const latestInbound = history.find(m => m.direction === 'inbound');
    const customer = await Customer.findById(customerId).select('name').lean();
    const customerName = customer?.name || 'Customer';

    const historyText = history.slice(0, 5).reverse().map(m =>
      `${m.direction === 'inbound' ? customerName : 'Support'}: ${m.body}`
    ).join('\n');

    const ai = await askGroq(
      'You are a WhatsApp customer support agent for a bank. IMPORTANT: Directly answer the customer\'s specific question. Do NOT give generic greetings. Write a SHORT reply — max 2-3 sentences. No signatures.',
      `${historyText ? 'Conversation:\n' + historyText + '\n\n' : ''}Customer: ${customerName}\nCustomer\'s latest message: ${latestInbound?.body || 'No message'}\n\nReply specifically to their question:`,
      150
    );
    res.json({ success: true, suggestion: ai.content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WA Agent: Send reply ──
router.post('/wa-agent/chats/:customerId/send-reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'message is required' });

    const employerId = process.env.EMPLOYER_MONGO_ID;
    const customer = await Customer.findById(req.params.customerId).lean();
    const waId = customer?.channel_ids?.whatsapp || customer?.phone?.replace('+', '') || '';

    const savedMessage = await Message.create({
      employerId, customerId: req.params.customerId,
      from: process.env.WHATSAPP_PHONE_NUMBER_ID || 'system',
      to: waId, messageId: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'text', body: message.trim(), direction: 'outbound', status: 'simulated',
      whatsappTimestamp: new Date(),
    });
    res.json({ success: true, message: 'WhatsApp reply sent', data: savedMessage });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WA Agent: Auto-reply ──
router.post('/wa-agent/chats/:customerId/auto-reply', async (req, res) => {
  try {
    const { customerId } = req.params;
    const employerId = process.env.EMPLOYER_MONGO_ID;
    const history = await Message.find({ customerId, employerId }).sort({ whatsappTimestamp: -1 }).limit(10).lean();
    const latestInbound = history.find(m => m.direction === 'inbound');
    if (!latestInbound) return res.status(400).json({ success: false, message: 'No inbound message found' });

    const customer = await Customer.findById(customerId).select('name channel_ids phone').lean();
    const customerName = customer?.name || 'Customer';
    const historyText = history.slice(0, 5).reverse().map(m => `${m.direction === 'inbound' ? customerName : 'Support'}: ${m.body}`).join('\n');

    const ai = await askGroq(
      'You are a WhatsApp customer support agent for a bank. IMPORTANT: Directly answer the customer\'s specific question. Do NOT give generic greetings. Write a SHORT reply — max 2-3 sentences. No signatures.',
      `Conversation:\n${historyText}\n\nCustomer: ${customerName}\nLatest message: ${latestInbound.body}\n\nReply specifically:`,
      150
    );

    const waId = customer?.channel_ids?.whatsapp || customer?.phone?.replace('+', '') || '';
    await Message.create({
      employerId, customerId, from: process.env.WHATSAPP_PHONE_NUMBER_ID || 'system',
      to: waId, messageId: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'text', body: ai.content, direction: 'outbound', status: 'simulated', whatsappTimestamp: new Date(),
    });
    res.json({ success: true, message: 'Auto-reply sent', aiReply: ai.content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WA Agent: Auto-reply all ──
router.post('/wa-agent/chats/auto-reply-all', async (req, res) => {
  try { res.json({ success: true, message: 'Auto-reply all processed', handled: 0 }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Email Agent: Suggest reply ──
router.post('/agent/emails/suggest', async (req, res) => {
  try {
    const { emailId } = req.body;
    const email = await Email.findById(emailId).populate('customerId', 'name email').lean();
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    const ai = await askGroq(
      'You are a professional customer support agent for a bank. Write a helpful, empathetic reply email. Keep it under 100 words. Sign off as "Support Team".',
      `Customer: ${email.customerId?.name || 'Customer'}\nSubject: ${email.subject}\nMessage: ${email.body}`,
      300
    );
    res.json({ success: true, suggestion: ai.content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Email Agent: Send reply ──
router.post('/agent/emails/:emailId/send-reply', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Reply body is required' });

    const email = await Email.findById(req.params.emailId).lean();
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    const outbound = await Email.create({
      employerId: email.employerId, customerId: email.customerId,
      gmailId: `agent_${Date.now()}`, threadId: email.threadId,
      from: process.env.GMAIL_ADDRESS || 'support@convosphere.com',
      fromEmail: process.env.GMAIL_ADDRESS || 'support@convosphere.com',
      to: email.fromEmail, subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      rawBody: body.trim(), body: body.trim(), direction: 'outbound', status: 'replied', emailDate: new Date(),
    });
    await Email.findByIdAndUpdate(email._id, { status: 'replied' });
    res.json({ success: true, message: 'Reply sent', data: outbound });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Email Agent: Auto-reply ──
router.post('/agent/emails/:emailId/auto-reply', async (req, res) => {
  try {
    const email = await Email.findById(req.params.emailId).populate('customerId', 'name email').lean();
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    const ai = await askGroq(
      'You are a professional customer support agent for a bank. Write a helpful reply under 100 words. Sign off as "Support Team".',
      `Customer: ${email.customerId?.name || 'Customer'}\nSubject: ${email.subject}\nMessage: ${email.body}`,
      300
    );

    await Email.create({
      employerId: email.employerId, customerId: email.customerId,
      gmailId: `auto_${Date.now()}`, threadId: email.threadId,
      from: process.env.GMAIL_ADDRESS || 'support@convosphere.com',
      fromEmail: process.env.GMAIL_ADDRESS || 'support@convosphere.com',
      to: email.fromEmail, subject: `Re: ${email.subject}`,
      rawBody: ai.content, body: ai.content, direction: 'outbound', status: 'replied', emailDate: new Date(),
    });
    await Email.findByIdAndUpdate(email._id, { status: 'replied' });
    res.json({ success: true, message: 'Auto-reply sent', aiReply: ai.content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Email Agent: Auto-reply all ──
router.post('/agent/emails/auto-reply-all', async (req, res) => {
  res.json({ success: true, message: 'Auto-replied to all', handled: 0 });
});

// ── Omni Agent: Generate reply ──
router.post('/agent/generate-omni', async (req, res) => {
  try {
    const { history } = req.body;
    const ai = await askGroq(
      'You are a professional customer support agent for a bank. Write a helpful reply under 100 words. Sign off as "Support Team".',
      `Chat history:\n${history}\n\nDraft a concise reply:`,
      300
    );
    res.json({ success: true, suggestion: ai.content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Omni Agent: Summary ──
router.post('/omni-agent/summary/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const [waMessages, emails] = await Promise.all([
      Message.find({ customerId }).sort({ whatsappTimestamp: -1 }).limit(10).lean(),
      Email.find({ customerId }).sort({ emailDate: -1 }).limit(10).lean(),
    ]);

    const contextText = [
      ...waMessages.map(m => `[WA] ${m.direction === 'inbound' ? 'Customer' : 'Support'}: ${m.body?.slice(0, 150)}`),
      ...emails.map(e => `[EMAIL] ${e.direction === 'inbound' ? 'Customer' : 'Support'}: ${e.body?.slice(0, 150)}`),
    ].slice(0, 10).join('\n');

    const ai = await askGroq(
      'Analyze conversation and return ONLY JSON: {"sentiment":"positive|neutral|negative","mainIssue":"one line","isResolved":true/false,"urgency":"low|medium|high","recommendation":"one action","channelsUsed":["whatsapp","email"]}',
      `Conversation:\n${contextText}`,
      400
    );

    let parsed;
    try { parsed = JSON.parse(ai.content.replace(/```json|```/g, '').trim()); }
    catch { parsed = { raw: ai.content }; }
    res.json({ success: true, data: parsed });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Omni Agent: Suggest ──
router.post('/omni-agent/suggest', async (req, res) => {
  try {
    const { customerId, channel = 'whatsapp' } = req.body;
    const [waMessages, emails] = await Promise.all([
      Message.find({ customerId }).sort({ whatsappTimestamp: -1 }).limit(5).lean(),
      Email.find({ customerId }).sort({ emailDate: -1 }).limit(5).lean(),
    ]);
    const context = [...waMessages.map(m => `[WA] ${m.direction}: ${m.body?.slice(0, 100)}`), ...emails.map(e => `[EMAIL] ${e.direction}: ${e.body?.slice(0, 100)}`)].join('\n');
    const isWA = channel === 'whatsapp';
    const ai = await askGroq(
      `Write a ${isWA ? 'short WhatsApp reply (max 3 sentences)' : 'professional email reply (max 100 words, sign off as Support Team)'}. Address the customer's latest concern.`,
      `Conversation:\n${context}\n\nGenerate reply:`,
      300
    );
    res.json({ success: true, suggestion: ai.content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
