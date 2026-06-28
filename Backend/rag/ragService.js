const embeddingService = require("./embeddingService");
const vectorService = require("./vectorService");
const chunkingService = require("./chunkingService");
const Conversation = require("../models/Conversation");
const KnowledgeBase = require("../models/KnowledgeBase");

class RAGService {
  /**
   * Build context for LLM from retrieved vectors
   */
  buildContext(retrievedResults) {
    const context = {
      customerHistory: [],
      knowledgeBaseArticles: [],
      relatedTickets: [],
    };

    for (const result of retrievedResults) {
      const metadata = result.metadata || {};

      if (metadata.type === "conversation") {
        context.customerHistory.push({
          text: metadata.text || result.metadata?.text || "",
          role: metadata.role,
          timestamp: metadata.timestamp,
          sentiment: metadata.sentiment,
          channel: metadata.channel,
        });
      } else if (metadata.type === "knowledge_base") {
        context.knowledgeBaseArticles.push({
          text: metadata.text || result.metadata?.text || "",
          category: metadata.category,
          subcategory: metadata.subcategory,
          tags: metadata.tags,
          score: result.score,
        });
      } else if (metadata.type === "ticket") {
        context.relatedTickets.push({
          text: metadata.text || result.metadata?.text || "",
          category: metadata.category,
          sentiment: metadata.sentiment,
          score: result.score,
        });
      }
    }

    return context;
  }

  /**
   * Retrieve relevant context for a message
   */
  async retrieveContext(message, customerId, employerId, channel, topK = 10) {
    try {
      // Generate embedding for the message
      const embedding = await embeddingService.embed(message);

      // Query different namespaces in parallel
      const [conversationResults, kbResults, ticketResults] = await Promise.all([
        vectorService.query(
          embedding,
          vectorService.getNamespace(employerId, "conversations"),
          Math.ceil(topK / 3),
          { customerId }
        ),
        vectorService.query(
          embedding,
          vectorService.getNamespace(employerId, "knowledge_base"),
          Math.ceil(topK / 3),
          {}
        ),
        vectorService.query(
          embedding,
          vectorService.getNamespace(employerId, "tickets"),
          Math.ceil(topK / 3),
          { customerId }
        ),
      ]);

      // Combine and sort by score
      const allResults = [
        ...conversationResults,
        ...kbResults,
        ...ticketResults,
      ].sort((a, b) => (b.score || 0) - (a.score || 0));

      // Build context
      return this.buildContext(allResults.slice(0, topK));
    } catch (error) {
      console.error("RAG context retrieval error:", error);
      throw new Error(`Failed to retrieve context: ${error.message}`);
    }
  }

  /**
   * Format context for LLM prompt
   */
  formatContextForLLM(context) {
    let formatted = "";

    if (context.customerHistory && context.customerHistory.length > 0) {
      formatted += "\n=== CUSTOMER HISTORY ===\n";
      context.customerHistory.forEach((item, i) => {
        formatted += `${i + 1}. [${item.role}] ${item.text}\n`;
      });
    }

    if (context.knowledgeBaseArticles && context.knowledgeBaseArticles.length > 0) {
      formatted += "\n=== KNOWLEDGE BASE ===\n";
      context.knowledgeBaseArticles.forEach((item, i) => {
        formatted += `${i + 1}. [${item.category}] ${item.text} (score: ${item.score?.toFixed(2)})\n`;
      });
    }

    if (context.relatedTickets && context.relatedTickets.length > 0) {
      formatted += "\n=== RELATED TICKETS ===\n";
      context.relatedTickets.forEach((item, i) => {
        formatted += `${i + 1}. [${item.category}] ${item.text} (score: ${item.score?.toFixed(2)})\n`;
      });
    }

    return formatted;
  }

  /**
   * Embed and store conversation
   */
  async embedConversation(conversationId) {
    try {
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Chunk the conversation
      const chunks = chunkingService.chunkConversation(
        conversation.messages,
        conversation.conversationId,
        conversation.customerId.toString(),
        conversation.employerId.toString(),
        conversation.channel
      );

      // Generate embeddings for all chunks
      const texts = chunks.map((c) => c.text);
      const embeddings = await embeddingService.embedBatch(texts);

      // Prepare vectors for upsert
      const vectors = chunks.map((chunk, i) => ({
        id: `conv_${conversation.conversationId}_${chunk.metadata.chunkIndex}`,
        values: embeddings[i],
        metadata: {
          ...chunk.metadata,
          customerId: conversation.customerId.toString(),
          employerId: conversation.employerId.toString(),
          text: chunk.text.substring(0, 1000), // First 1000 chars for display
        },
      }));

      // Upsert to Pinecone
      await vectorService.upsertBatch(
        vectors,
        vectorService.getNamespace(conversation.employerId.toString(), "conversations")
      );

      // Update conversation with embedding IDs
      for (const chunk of chunks) {
        const messageIndex = conversation.messages.findIndex(
          (m) => m.messageId === chunk.metadata.messageId
        );
        if (messageIndex !== -1) {
          conversation.messages[messageIndex].metadata.embeddingId = `conv_${conversation.conversationId}_${chunk.metadata.chunkIndex}`;
        }
      }
      await conversation.save();

      return { success: true, chunksProcessed: chunks.length };
    } catch (error) {
      console.error("Conversation embedding error:", error);
      throw new Error(`Failed to embed conversation: ${error.message}`);
    }
  }

  /**
   * Embed and store knowledge base article
   */
  async embedKnowledgeBase(articleId) {
    try {
      const article = await KnowledgeBase.findById(articleId);
      if (!article) {
        throw new Error("Knowledge base article not found");
      }

      // Chunk the article
      const chunks = chunkingService.chunkKnowledgeBase(article, article.employerId.toString());

      // Generate embeddings
      const texts = chunks.map((c) => c.text);
      const embeddings = await embeddingService.embedBatch(texts);

      // Prepare vectors
      const vectors = chunks.map((chunk, i) => ({
        id: `kb_${article._id}_${chunk.metadata.chunkIndex}`,
        values: embeddings[i],
        metadata: {
          ...chunk.metadata,
          employerId: article.employerId.toString(),
          text: chunk.text.substring(0, 1000),
        },
      }));

      // Upsert to Pinecone
      await vectorService.upsertBatch(
        vectors,
        vectorService.getNamespace(article.employerId.toString(), "knowledge_base")
      );

      // Update article with embedding ID
      article.embeddingId = `kb_${article._id}_0`;
      await article.save();

      return { success: true, chunksProcessed: chunks.length };
    } catch (error) {
      console.error("Knowledge base embedding error:", error);
      throw new Error(`Failed to embed knowledge base: ${error.message}`);
    }
  }

  /**
   * Get customer memory (semantic search)
   */
  async getCustomerMemory(customerId, employerId, query = "", topK = 10) {
    try {
      if (!query) {
        // If no query, get recent conversation history
        const conversations = await Conversation.find({ customerId, employerId })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        return {
          conversations,
          knowledgeBase: [],
          relatedTickets: [],
        };
      }

      // Use semantic search
      const context = await this.retrieveContext(query, customerId, employerId, "all", topK);
      return context;
    } catch (error) {
      console.error("Customer memory retrieval error:", error);
      throw new Error(`Failed to get customer memory: ${error.message}`);
    }
  }

  /**
   * Delete customer memory (GDPR)
   */
  async deleteCustomerMemory(customerId, employerId) {
    try {
      await vectorService.deleteCustomerVectors(customerId, employerId);
      return { success: true };
    } catch (error) {
      console.error("Customer memory deletion error:", error);
      throw new Error(`Failed to delete customer memory: ${error.message}`);
    }
  }
}

module.exports = new RAGService();
