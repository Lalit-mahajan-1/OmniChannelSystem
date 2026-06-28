const ragService = require("../../rag/ragService");

async function embeddingProcessor(job) {
  const { type, id, employerId } = job.data;

  try {
    if (type === "conversation") {
      const result = await ragService.embedConversation(id);
      return result;
    } else if (type === "knowledge_base") {
      const result = await ragService.embedKnowledgeBase(id);
      return result;
    } else {
      throw new Error(`Unknown embedding type: ${type}`);
    }
  } catch (error) {
    console.error("Embedding worker error:", error);
    throw error;
  }
}

module.exports = embeddingProcessor;
