const aiClient = require("../../services/aiClient");

/**
 * Intent Agent - Classifies the customer's intent and urgency
 */
async function intentAgent(state) {
  const startTime = Date.now();

  try {
    const prompt = `You are a customer support intent classifier.
Analyze the message and return JSON with:
{ intent, urgencyLevel, subCategory, actionRequired }

Intent options: complaint, inquiry, praise, escalation, billing, technical, general
UrgencyLevel options: low, medium, high, critical
ActionRequired: boolean

Message: ${state.incomingMessage}
Channel: ${state.channel}`;

    const response = await aiClient.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 200,
    });

    // Parse JSON response
    const result = JSON.parse(response);

    state.intent = result.intent || "general";
    state.urgencyLevel = result.urgencyLevel || "medium";
    state.subCategory = result.subCategory || "";
    state.actionRequired = result.actionRequired || false;

    state.addTraceStep(
      "intentAgent",
      "classify_intent",
      "success",
      result,
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Intent agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "intentAgent",
      "classify_intent",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = intentAgent;
