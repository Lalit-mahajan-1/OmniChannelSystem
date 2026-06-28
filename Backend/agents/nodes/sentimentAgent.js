const aiClient = require("../../services/aiClient");

/**
 * Sentiment Agent - Analyzes sentiment and emotions
 */
async function sentimentAgent(state) {
  const startTime = Date.now();

  try {
    const prompt = `You are a sentiment analyzer.
Analyze the message and return JSON with:
{ sentiment, emotionTags, escalationRisk }

Sentiment options: positive, neutral, negative
EmotionTags: array of emotions (frustrated, angry, happy, confused, satisfied, worried)
EscalationRisk: number between 0.0 and 1.0

Message: ${state.incomingMessage}`;

    const response = await aiClient.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 200,
    });

    const result = JSON.parse(response);

    state.sentiment = result.sentiment || "neutral";
    state.emotionTags = result.emotionTags || [];
    state.escalationRisk = result.escalationRisk || 0;

    state.addTraceStep(
      "sentimentAgent",
      "analyze_sentiment",
      "success",
      result,
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Sentiment agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "sentimentAgent",
      "analyze_sentiment",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = sentimentAgent;
