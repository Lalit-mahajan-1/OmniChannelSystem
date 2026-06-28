const KnowledgeBase = require("../models/KnowledgeBase");
const ragService = require("./ragService");

class KnowledgeBaseService {
  /**
   * Create a new knowledge base article
   */
  async createArticle(data) {
    try {
      const article = await KnowledgeBase.create(data);
      
      // Embed the article
      await ragService.embedKnowledgeBase(article._id);
      
      return article;
    } catch (error) {
      console.error("Knowledge base creation error:", error);
      throw new Error(`Failed to create article: ${error.message}`);
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(id) {
    try {
      const article = await KnowledgeBase.findById(id).populate("createdBy", "name email");
      if (!article) {
        throw new Error("Article not found");
      }
      
      // Increment view count
      article.viewCount += 1;
      await article.save();
      
      return article;
    } catch (error) {
      console.error("Knowledge base retrieval error:", error);
      throw new Error(`Failed to get article: ${error.message}`);
    }
  }

  /**
   * List articles with filters
   */
  async listArticles(filters = {}, page = 1, limit = 20) {
    try {
      const query = { isActive: true, ...filters };
      
      const articles = await KnowledgeBase.find(query)
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      const total = await KnowledgeBase.countDocuments(query);
      
      return {
        articles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Knowledge base list error:", error);
      throw new Error(`Failed to list articles: ${error.message}`);
    }
  }

  /**
   * Update article
   */
  async updateArticle(id, data, updaterId) {
    try {
      const article = await KnowledgeBase.findById(id);
      if (!article) {
        throw new Error("Article not found");
      }
      
      // Update article
      Object.assign(article, data, {
        version: article.version + 1,
        lastUpdatedBy: updaterId,
      });
      await article.save();
      
      // Re-embed the article
      await ragService.embedKnowledgeBase(id);
      
      return article;
    } catch (error) {
      console.error("Knowledge base update error:", error);
      throw new Error(`Failed to update article: ${error.message}`);
    }
  }

  /**
   * Delete (archive) article
   */
  async deleteArticle(id) {
    try {
      const article = await KnowledgeBase.findById(id);
      if (!article) {
        throw new Error("Article not found");
      }
      
      // Soft delete
      article.isActive = false;
      await article.save();
      
      // Delete from vector store
      if (article.embeddingId) {
        await ragService.vectorService.deleteKnowledgeBaseVector(
          article.embeddingId,
          article.employerId.toString()
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error("Knowledge base deletion error:", error);
      throw new Error(`Failed to delete article: ${error.message}`);
    }
  }

  /**
   * Search articles semantically
   */
  async searchArticles(query, employerId, topK = 10) {
    try {
      const embedding = await ragService.embeddingService.embed(query);
      
      const results = await ragService.vectorService.query(
        embedding,
        ragService.vectorService.getNamespace(employerId, "knowledge_base"),
        topK,
        { isActive: true }
      );
      
      // Get full article details
      const articleIds = results
        .map((r) => r.metadata?.articleId)
        .filter((id) => id);
      
      const articles = await KnowledgeBase.find({
        _id: { $in: articleIds },
        isActive: true,
      }).populate("createdBy", "name email");
      
      // Merge with scores
      const articlesWithScores = articles.map((article) => {
        const result = results.find(
          (r) => r.metadata?.articleId === article._id.toString()
        );
        return {
          ...article.toObject(),
          score: result?.score || 0,
        };
      });
      
      // Sort by score
      return articlesWithScores.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error("Knowledge base search error:", error);
      throw new Error(`Failed to search articles: ${error.message}`);
    }
  }

  /**
   * Get categories with counts
   */
  async getCategories(employerId) {
    try {
      const categories = await KnowledgeBase.aggregate([
        { $match: { employerId, isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      
      return categories.map((c) => ({
        category: c._id,
        count: c.count,
      }));
    } catch (error) {
      console.error("Categories retrieval error:", error);
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  /**
   * Vote on article helpfulness
   */
  async voteArticle(id, helpful) {
    try {
      const article = await KnowledgeBase.findById(id);
      if (!article) {
        throw new Error("Article not found");
      }
      
      if (helpful) {
        article.helpfulVotes += 1;
      }
      
      await article.save();
      
      return { helpfulVotes: article.helpfulVotes };
    } catch (error) {
      console.error("Article vote error:", error);
      throw new Error(`Failed to vote on article: ${error.message}`);
    }
  }
}

module.exports = new KnowledgeBaseService();
