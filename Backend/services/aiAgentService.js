// ── LLM: Groq (free tier — llama-3.1-8b-instant) ─────────────────
// SETUP: npm install groq-sdk   (in Backend/)
//        Add GROQ_API_KEY=your_key to Backend/.env
//        Get free key at: https://console.groq.com
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate an AI reply to a customer email/message.
 * Automatically fetches cross-channel customer intelligence from the MCP server
 * and injects it as context before calling the LLM.
 *
 * @param {string} customerEmail      - the email body from customer
 * @param {string} subject            - email subject
 * @param {string} customerName       - customer name if known
 * @param {Array}  history            - previous emails in this thread
 * @param {string} customerIdentifier - phone or email to fetch MCP context (optional)
 */
const generateAIReply = async (
  customerEmail,
  subject,
  customerName = 'Customer',
  history = [],
  customerIdentifier = null
) => {
  // ── Step 1: Fetch MCP intelligence (non-blocking — fails gracefully) ──
  let contextBlock = '';
  if (customerIdentifier) {
    try {
      // Dynamic import bridges CommonJS (Backend) → ESM (mcp-server)
      const { buildCustomerIntelligence } = await import(
        '../../mcp-server/src/intelligence/contextBuilder.js'
      );
      const { connectMongo } = await import(
        '../../mcp-server/src/services/mongoService.js'
      );
      await connectMongo();
      const intel = await buildCustomerIntelligence(customerIdentifier);
      contextBlock = `\nCUSTOMER INTELLIGENCE (cross-channel history):\n${JSON.stringify(intel, null, 2)}\n`;
    } catch (err) {
      // MCP context is optional — never block the reply if it fails
      console.warn('[AI] MCP context unavailable:', err.message);
    }
  }

  // ── Step 2: Build prompt ───────────────────────────────────────────
  const historyText = history.length > 0
    ? `\nPrevious conversation:\n${history.map(h =>
        `${h.direction === 'inbound' ? 'Customer' : 'Us'}: ${h.body}`
      ).join('\n\n')}\n`
    : '';

  const prompt = `You are a helpful customer support agent. Reply professionally and concisely.
${contextBlock}${historyText}
Customer name: ${customerName}
Subject: ${subject}
Customer message: ${customerEmail}

Write a helpful, friendly reply. Keep it under 150 words. Do not include a subject line.`;

  // ── Step 3: Call Groq (free) ───────────────────────────────────────
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('AI generation failed:', err.message);
    return `Thank you for reaching out. We have received your message and will get back to you shortly.\n\nBest regards,\nSupport Team`;
  }
};

module.exports = { generateAIReply };