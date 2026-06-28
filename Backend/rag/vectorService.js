const { Pinecone } = require("@pinecone-database/pinecone");

class VectorService {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.indexName = process.env.PINECONE_INDEX || "omnichannel-memory";
    this.index = null;
  }

  /**
   * Initialize Pinecone index connection
   */
  async initialize() {
    try {
      this.index = this.pinecone.index(this.indexName);
      console.log(`Connected to Pinecone index: ${this.indexName}`);
      return true;
    } catch (error) {
      console.error("Pinecone initialization error:", error);
      throw new Error(`Failed to initialize Pinecone: ${error.message}`);
    }
  }

  /**
   * Get namespace for a specific employer
   */
  getNamespace(employerId, type) {
    return `${type}/${employerId}`;
  }

  /**
   * Upsert a single vector
   */
  async upsertVector(id, vector, metadata, namespace) {
    try {
      await this.index.upsert([
        {
          id,
          values: vector,
          metadata,
        },
      ], {
        namespace,
      });
      return true;
    } catch (error) {
      console.error("Vector upsert error:", error);
      throw new Error(`Failed to upsert vector: ${error.message}`);
    }
  }

  /**
   * Upsert multiple vectors in batch
   */
  async upsertBatch(vectors, namespace) {
    try {
      await this.index.upsert(vectors, {
        namespace,
      });
      return true;
    } catch (error) {
      console.error("Batch vector upsert error:", error);
      throw new Error(`Failed to upsert batch vectors: ${error.message}`);
    }
  }

  /**
   * Query vectors by similarity
   */
  async query(vector, namespace, topK = 10, filter = {}) {
    try {
      const results = await this.index.query({
        vector,
        topK,
        namespace,
        includeMetadata: true,
        filter,
      });
      return results.matches || [];
    } catch (error) {
      console.error("Vector query error:", error);
      throw new Error(`Failed to query vectors: ${error.message}`);
    }
  }

  /**
   * Delete a vector by ID
   */
  async deleteVector(id, namespace) {
    try {
      await this.index.deleteOne(id, {
        namespace,
      });
      return true;
    } catch (error) {
      console.error("Vector deletion error:", error);
      throw new Error(`Failed to delete vector: ${error.message}`);
    }
  }

  /**
   * Delete all vectors for a customer (GDPR)
   */
  async deleteCustomerVectors(customerId, employerId) {
    try {
      const namespaces = [
        this.getNamespace(employerId, "conversations"),
        this.getNamespace(employerId, "tickets"),
      ];

      for (const namespace of namespaces) {
        // Query all vectors for this customer
        const results = await this.index.query({
          vector: Array(3072).fill(0), // Dummy vector for filtering
          topK: 10000,
          namespace,
          includeMetadata: true,
          filter: { customerId },
        });

        if (results.matches && results.matches.length > 0) {
          const idsToDelete = results.matches.map((match) => match.id);
          await this.index.deleteMany(idsToDelete, { namespace });
        }
      }

      return true;
    } catch (error) {
      console.error("Customer vectors deletion error:", error);
      throw new Error(`Failed to delete customer vectors: ${error.message}`);
    }
  }

  /**
   * Delete all vectors for a knowledge base article
   */
  async deleteKnowledgeBaseVector(embeddingId, employerId) {
    try {
      const namespace = this.getNamespace(employerId, "knowledge_base");
      await this.deleteVector(embeddingId, namespace);
      return true;
    } catch (error) {
      console.error("KB vector deletion error:", error);
      throw new Error(`Failed to delete KB vector: ${error.message}`);
    }
  }
}

module.exports = new VectorService();
