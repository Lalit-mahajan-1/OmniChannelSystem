const aiClient = require("../../services/aiClient");

/**
 * Response Agent - Generates AI response draft
 */
async function responseAgent(state) {
  const startTime = Date.now();

  try {
    // Build context string
    let contextStr = "";
    if (state.conversationHistory.length > 0) {
      contextStr += "\n=== CONVERSATION HISTORY ===\n";
      state.conversationHistory.forEach((item, i) => {
        contextStr += `${i + 1}. [${item.role}] ${item.text}\n`;
      });
    }

    if (state.relevantArticles.length > 0) {
      contextStr += "\n=== KNOWLEDGE BASE ===\n";
      state.relevantArticles.forEach((item, i) => {
        contextStr += `${i + 1}. [${item.category}] ${item.text}\n`;
      });
    }

    const prompt = `You are a helpful customer support AI assistant.
Generate a response to the customer's message.

Customer message: ${state.incomingMessage}
Intent: ${state.intent}
Sentiment: ${state.sentiment}
Urgency: ${state.urgencyLevel}

${contextStr}

Guidelines:
- Be empathetic and professional
- Address the customer's concern directly
- Use information from knowledge base when relevant
- Keep response concise but helpful
- If escalation needed, indicate clearly

Return ONLY the response text (no JSON, no explanation).`;

    const response = await aiClient.generateResponse(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });

    state.draftResponse = response;
    state.responseContext = contextStr;

    state.addTraceStep(
      "responseAgent",
      "generate_response",
      "success",
      { responseLength: response.length },
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Response agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "responseAgent",
      "generate_response",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = responseAgent;
