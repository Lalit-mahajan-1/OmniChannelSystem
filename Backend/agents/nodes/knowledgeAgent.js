const ragService = require("../../rag/ragService");

/**
 * Knowledge Agent - Retrieves relevant knowledge base articles
 */
async function knowledgeAgent(state) {
  const startTime = Date.now();

  try {
    // Retrieve knowledge base articles via RAG
    const context = await ragService.retrieveContext(
      state.incomingMessage,
      state.customerId,
      state.employerId,
      state.channel,
      3
    );

    state.relevantArticles = context.knowledgeBaseArticles || [];
    state.suggestedPolicies = []; // TODO: Extract from articles
    state.troubleshootingSteps = []; // TODO: Extract from articles

    state.addTraceStep(
      "knowledgeAgent",
      "retrieve_knowledge",
      "success",
      { articleCount: state.relevantArticles.length },
      Date.now() - startTime
    );

    return state;
  } catch (error) {
    console.error("Knowledge agent error:", error);
    state.addError(error);
    state.addTraceStep(
      "knowledgeAgent",
      "retrieve_knowledge",
      "error",
      error.message,
      Date.now() - startTime
    );
    return state;
  }
}

module.exports = knowledgeAgent;
