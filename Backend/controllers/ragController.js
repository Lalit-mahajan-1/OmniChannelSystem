const ragService = require("../rag/ragService");
const conversationRepository = require("../repositories/conversationRepository");
const auditLogRepository = require("../repositories/auditLogRepository");

class RAGController {
  /**
   * Query vector store for context
   */
  async queryVectorStore(req, res) {
    try {
      const { message, customerId, channel, topK = 10 } = req.body;
      const employerId = req.employer._id;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const context = await ragService.retrieveContext(
        message,
        customerId,
        employerId.toString(),
        channel || "support",
        topK
      );

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "rag.query",
        resource: "conversation",
        resourceId: customerId || "unknown",
        employerId,
        metadata: { channel, topK },
      });

      res.json({ context, formattedContext: ragService.formatContextForLLM(context) });
    } catch (error) {
      console.error("RAG query error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Embed and store a conversation chunk
   */
  async embedConversation(req, res) {
    try {
      const { conversationId } = req.body;
      const employerId = req.employer._id;

      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required" });
      }

      // Verify employer owns the conversation
      const conversation = await conversationRepository.findByConversationId(conversationId);
      if (!conversation || conversation.employerId.toString() !== employerId.toString()) {
        return res.status(403).json({ error: "Conversation not found or access denied" });
      }

      const result = await ragService.embedConversation(conversationId);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "rag.embed_conversation",
        resource: "conversation",
        resourceId: conversationId,
        employerId,
        metadata: { chunksProcessed: result.chunksProcessed },
      });

      res.json(result);
    } catch (error) {
      console.error("Embed conversation error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Bulk embed historical conversations
   */
  async embedBulkConversations(req, res) {
    try {
      const { limit = 100 } = req.body;
      const employerId = req.employer._id;

      const conversations = await conversationRepository.findByEmployerId(employerId, {
        limit,
        status: "resolved",
      });

      const results = [];
      for (const conv of conversations) {
        try {
          const result = await ragService.embedConversation(conv.conversationId);
          results.push({ conversationId: conv.conversationId, success: true, ...result });
        } catch (error) {
          results.push({ conversationId: conv.conversationId, success: false, error: error.message });
        }
      }

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "rag.embed_bulk",
        resource: "conversation",
        resourceId: "bulk",
        employerId,
        metadata: { total: conversations.length, successful: results.filter((r) => r.success).length },
      });

      res.json({ results, total: conversations.length, successful: results.filter((r) => r.success).length });
    } catch (error) {
      console.error("Bulk embed error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get semantic memory for a customer
   */
  async getCustomerMemory(req, res) {
    try {
      const { customerId } = req.params;
      const { query, topK = 10 } = req.query;
      const employerId = req.employer._id;

      const memory = await ragService.getCustomerMemory(customerId, employerId.toString(), query, topK);

      res.json(memory);
    } catch (error) {
      console.error("Get customer memory error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GDPR: Delete customer vectors
   */
  async deleteCustomerMemory(req, res) {
    try {
      const { customerId } = req.params;
      const employerId = req.employer._id;

      await ragService.deleteCustomerMemory(customerId, employerId.toString());

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "rag.delete_customer_memory",
        resource: "customer",
        resourceId: customerId,
        employerId,
        metadata: { reason: "GDPR request" },
      });

      res.json({ success: true, message: "Customer memory deleted successfully" });
    } catch (error) {
      console.error("Delete customer memory error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RAGController();
