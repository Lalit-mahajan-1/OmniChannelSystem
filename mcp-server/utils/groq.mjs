import axios from 'axios';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const askGroq = async (systemPrompt, userPrompt, maxTokens = 300) => {
  const GROQ_KEY = process.env.GROQ_API_KEY;

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
    {
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    content: res.data.choices[0].message.content.trim(),
    latencyMs: Date.now() - started,
    model: GROQ_MODEL,
  };
};