class ChunkingService {
  constructor() {
    this.maxChunkSize = 1000; // characters
    this.chunkOverlap = 200; // characters
  }

  /**
   * Split text into intelligent chunks
   */
  chunkText(text, metadata = {}) {
    if (!text || text.length <= this.maxChunkSize) {
      return [
        {
          text,
          metadata: { ...metadata, chunkIndex: 0, totalChunks: 1 },
        },
      ];
    }

    const chunks = [];
    const sentences = this.splitIntoSentences(text);
    let currentChunk = "";
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= this.maxChunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push({
            text: currentChunk.trim(),
            metadata: {
              ...metadata,
              chunkIndex,
              totalChunks: -1, // Will be updated at end
            },
          });
          chunkIndex++;
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunkIndex,
          totalChunks: -1,
        },
      });
    }

    // Update total chunks count
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Split by sentence boundaries (. ! ?) followed by space or end
    const sentences = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [];
    return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  /**
   * Chunk conversation messages for embedding
   */
  chunkConversation(messages, conversationId, customerId, employerId, channel) {
    const chunks = [];
    let chunkIndex = 0;

    for (const message of messages) {
      const messageChunks = this.chunkText(message.content, {
        type: "conversation",
        conversationId,
        customerId,
        employerId,
        channel,
        role: message.role,
        timestamp: message.timestamp,
        messageId: message.messageId,
      });

      messageChunks.forEach((chunk) => {
        chunks.push({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            chunkIndex: chunkIndex++,
          },
        });
      });
    }

    // Update total chunks
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Chunk knowledge base article
   */
  chunkKnowledgeBase(article, employerId) {
    return this.chunkText(article.content, {
      type: "knowledge_base",
      employerId,
      articleId: article._id?.toString(),
      category: article.category,
      subcategory: article.subcategory,
      tags: article.tags,
    });
  }

  /**
   * Chunk ticket intelligence record
   */
  chunkTicketIntelligence(ticket, employerId) {
    const text = `${ticket.summary || ""} ${ticket.category || ""} ${ticket.subcategory || ""} ${ticket.sentiment || ""}`;
    return this.chunkText(text, {
      type: "ticket",
      employerId,
      ticketId: ticket._id?.toString(),
      customerId: ticket.customerId?.toString(),
      category: ticket.category,
      sentiment: ticket.sentiment,
    });
  }
}

module.exports = new ChunkingService();
