const ragService = require("../../rag/ragService");
const Customer = require("../../models/Customer");
const Conversation = require("../../models/Conversation");

/**
 * Context Agent - Retrieves customer context via RAG
 */
async function contextAgent(state) {
  const startTime = Date.now();

  try {
    // Get customer profile
    const customer = await Customer.findById(state.customerId);
    if (customer) {
      state.customerProfile = {
        name: customer.name,
        email: customer.email,
        healthScore: customer.healthScore,
        healthStatus: customer.healthStatus,
        language: customer.language,
        timezone: customer.timezone,
        segmentationTags: customer.segmentationTags,
        consentStatus: customer.consentStatus,
      };
    }

    // Retrieve conversation history via RAG
    const context = await ragService.retrieveContext(
      state.incomingMessage,
      state.customerId,
      state.employerId,
      state.channel,
      5
    );

    state.conversationHistory = context.customerHistory || [];
    state.sentimentTrend = "stable"; // TODO: Calculate from history
    state.previousComplaints = []; // TODO: Extract from history
    state.preferredChannel = state.channel; // TODO: Determine from history

    state.addTraceStep(
      "contextAgent",
      "retrieve_context",
      "success",
      { historyCount: state.conversationHistory.length },
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Context agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "contextAgent",
      "retrieve_context",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = contextAgent;
