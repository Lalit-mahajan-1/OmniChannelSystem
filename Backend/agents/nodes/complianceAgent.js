const aiClient = require("../../services/aiClient");
const Customer = require("../../models/Customer");

/**
 * Compliance Agent - Checks for compliance issues
 */
async function complianceAgent(state) {
  const startTime = Date.now();

  try {
    // Get customer DNC status
    const customer = await Customer.findById(state.customerId);
    const isDNC = customer?.consentStatus?.dnc || false;

    const prompt = `You are a compliance checker for a customer support platform.
Check the draft response against: DNC regulations, GDPR data handling, content restrictions, company policy.

Customer DNC status: ${isDNC}
Incoming message: ${state.incomingMessage}
Intent: ${state.intent}
Sentiment: ${state.sentiment}

Return JSON: { status, flags, gdprIssues, recommendation }

Status options: clear, warning, blocked
Flags: array of compliance flags
GDRIssues: array of GDPR-related issues
Recommendation: string`;

    const response = await aiClient.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 300,
    });

    const result = JSON.parse(response);

    state.complianceStatus = result.status || "clear";
    state.complianceFlags = result.flags || [];
    state.gdprRestrictions = result.gdprIssues || [];

    state.addTraceStep(
      "complianceAgent",
      "check_compliance",
      "success",
      result,
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Compliance agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "complianceAgent",
      "check_compliance",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = complianceAgent;
