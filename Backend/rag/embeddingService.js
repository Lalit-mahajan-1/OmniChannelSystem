const OpenAI = require("openai");

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "text-embedding-3-large";
    this.dimensions = 3072;
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async embedBatch(texts) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      });
      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("Batch embedding generation error:", error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embeddingA, embeddingB) {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error("Embeddings must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

module.exports = new EmbeddingService();
