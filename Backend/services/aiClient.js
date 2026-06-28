const axios = require('axios');

const parseJsonBlock = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    return null;
  }
};

const askOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const url = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  const response = await axios.post(
    url,
    {
      model,
      messages: [
        { role: 'system', content: 'You are a ticket intelligence classification engine.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.0,
      max_tokens: 400,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    }
  );

  return response.data.choices?.[0]?.message?.content || '';
};

const askClaude = async (prompt) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY is not configured');

  // Uses the current Anthropic Messages API (not the legacy /v1/complete)
  const url = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
  const response = await axios.post(
    url,
    {
      model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      temperature: 0.0,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    }
  );

  return response.data?.content?.[0]?.text || '';
};

// Lazy-load Groq client
const Groq = require('groq-sdk');
let _groqClient = null;
const getGroqClient = () => {
  if (!_groqClient && process.env.GROQ_API_KEY) {
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groqClient;
};

const askGroq = async (prompt) => {
  const client = getGroqClient();
  if (!client) throw new Error('GROQ_API_KEY is not configured');

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are a ticket intelligence classification engine.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.0,
    max_tokens: 400,
  });

  return response.choices?.[0]?.message?.content || '';
};

const askAi = async (prompt) => {
  try {
    // Priority order: Groq (free) → OpenAI → Claude
    if (process.env.GROQ_API_KEY) {
      return await askGroq(prompt);
    }
    if (process.env.OPENAI_API_KEY) {
      return await askOpenAI(prompt);
    }
    if (process.env.CLAUDE_API_KEY) {
      return await askClaude(prompt);
    }
    throw new Error('No AI provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY.');
  } catch (err) {
    throw new Error(`Ticket intelligence AI failure: ${err.message}`);
  }
};

const classifyTicket = async ({ message, channel }) => {
  const prompt = `Analyze the customer support ticket message and return ONLY valid JSON with the following fields:\n\n{
  \"sentiment\": \"positive|neutral|negative\",
  \"urgency\": \"low|medium|high\",
  \"priority\": \"low|medium|high|critical\",
  \"category\": \"billing|technical|account|refund|shipping|feature-request|complaint|general\",
  \"assignedTeam\": \"Finance Team|Engineering Support|Customer Success|Escalation Team|Support Team\",
  \"suggestedAction\": \"Short actionable recommendation.\",
  \"escalationRequired\": true|false,
  \"confidence\": number
}\n\nKeep the answer in JSON only. No extra text.\n\nMessage: \"${message.replace(/\n/g, ' ')}\"\nChannel: \"${channel}\"\n`;

  const raw = await askAi(prompt);
  const result = parseJsonBlock(raw);

  if (!result) {
    throw new Error('Unable to parse ticket intelligence response from AI');
  }

  return {
    sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment) ? result.sentiment : 'neutral',
    urgency: ['low', 'medium', 'high'].includes(result.urgency) ? result.urgency : 'medium',
    priority: ['low', 'medium', 'high', 'critical'].includes(result.priority) ? result.priority : 'medium',
    category: ['billing', 'technical', 'account', 'refund', 'shipping', 'feature-request', 'complaint', 'general'].includes(result.category) ? result.category : 'general',
    assignedTeam: typeof result.assignedTeam === 'string' && result.assignedTeam.trim().length > 0 ? result.assignedTeam : 'Support Team',
    suggestedAction: typeof result.suggestedAction === 'string' && result.suggestedAction.trim().length > 0 ? result.suggestedAction.trim() : 'Review the ticket and prioritize follow-up.',
    escalationRequired: Boolean(result.escalationRequired),
    confidence: Number(result.confidence) || 0.75,
  };
};

module.exports = {
  classifyTicket,
  askAi,
};
