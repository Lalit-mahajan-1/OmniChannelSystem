const aiClient = require("../../services/aiClient");

/**
 * Review Agent - Reviews AI-generated response for quality
 */
async function reviewAgent(state) {
  const startTime = Date.now();

  try {
    const prompt = `You are a quality assurance reviewer for AI-generated support responses.
Evaluate the response for: factual accuracy, hallucination risk, compliance, tone, helpfulness.

Draft response: ${state.draftResponse}
Context used: ${state.responseContext.substring(0, 1000)}...
Compliance status: ${state.complianceStatus}

Return JSON: { confidenceScore, hallucinationRisk, complianceScore, approved, notes }

ConfidenceScore: number between 0.0 and 1.0
HallucinationRisk: number between 0.0 and 1.0
ComplianceScore: number between 0.0 and 1.0
Approved: boolean
Notes: array of improvement suggestions`;

    const response = await aiClient.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 300,
    });

    const result = JSON.parse(response);

    state.confidenceScore = result.confidenceScore || 0.5;
    state.hallucinationRisk = result.hallucinationRisk || 0.5;
    state.complianceScore = result.complianceScore || 0.5;
    state.reviewNotes = result.notes || [];

    if (result.approved && state.confidenceScore >= 0.7) {
      state.finalResponse = state.draftResponse;
    }

    state.addTraceStep(
      "reviewAgent",
      "review_response",
      "success",
      result,
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Review agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "reviewAgent",
      "review_response",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = reviewAgent;
