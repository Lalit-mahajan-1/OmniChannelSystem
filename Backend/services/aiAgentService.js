const axios = require('axios');

/**
 * Generate an AI reply to a customer email
 * Uses Anthropic Claude API (swap for OpenAI if you prefer)
 *
 * @param {string} customerEmail  - the email body from customer
 * @param {string} subject        - email subject
 * @param {string} customerName   - customer name if known
 * @param {Array}  history        - previous emails in this thread
 */
const generateAIReply = async (customerEmail, subject, customerName = 'Customer', history = []) => {
  // Build conversation context from history
  const historyText = history.length > 0
    ? `\nPrevious conversation:\n${history.map(h => `${h.direction === 'inbound' ? 'Customer' : 'Us'}: ${h.body}`).join('\n\n')}\n`
    : '';

  const prompt = `You are a helpful customer support agent. Reply professionally and concisely.
${historyText}
Customer name: ${customerName}
Subject: ${subject}
Customer message: ${customerEmail}

Write a helpful, friendly reply. Keep it under 150 words. Do not include a subject line.`;

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.content[0].text;
  } catch (err) {
    console.error('AI generation failed:', err.message);
    // Fallback generic reply if AI fails
    return `Thank you for reaching out. We have received your message and will get back to you shortly.\n\nBest regards,\nSupport Team`;
  }
};

module.exports = { generateAIReply };