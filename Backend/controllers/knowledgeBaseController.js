const knowledgeBaseService = require("../rag/knowledgeBaseService");
const auditLogRepository = require("../repositories/auditLogRepository");

class KnowledgeBaseController {
  /**
   * List articles
   */
  async listArticles(req, res) {
    try {
      const { page = 1, limit = 20, category } = req.query;
      const employerId = req.employer._id;

      const result = await knowledgeBaseService.listArticles(
        { employerId, category },
        parseInt(page),
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error("List articles error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get single article
   */
  async getArticle(req, res) {
    try {
      const { id } = req.params;
      const article = await knowledgeBaseService.getArticleById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Verify employer owns the article
      if (article.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(article);
    } catch (error) {
      console.error("Get article error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create article
   */
  async createArticle(req, res) {
    try {
      const data = {
        ...req.body,
        employerId: req.employer._id,
        createdBy: req.employer._id,
      };

      const article = await knowledgeBaseService.createArticle(data);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "knowledge_base.created",
        resource: "knowledge_base",
        resourceId: article._id.toString(),
        employerId: req.employer._id,
        newState: article,
      });

      res.status(201).json(article);
    } catch (error) {
      console.error("Create article error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update article
   */
  async updateArticle(req, res) {
    try {
      const { id } = req.params;
      const article = await knowledgeBaseService.getArticleById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Verify employer owns the article
      if (article.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      const previousState = article.toObject();
      const updatedArticle = await knowledgeBaseService.updateArticle(id, req.body, req.employer._id);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "knowledge_base.updated",
        resource: "knowledge_base",
        resourceId: id,
        employerId: req.employer._id,
        previousState,
        newState: updatedArticle,
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Update article error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete article
   */
  async deleteArticle(req, res) {
    try {
      const { id } = req.params;
      const article = await knowledgeBaseService.getArticleById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Verify employer owns the article
      if (article.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      await knowledgeBaseService.deleteArticle(id);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "knowledge_base.deleted",
        resource: "knowledge_base",
        resourceId: id,
        employerId: req.employer._id,
        previousState: article,
      });

      res.json({ success: true, message: "Article deleted successfully" });
    } catch (error) {
      console.error("Delete article error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search articles semantically
   */
  async searchArticles(req, res) {
    try {
      const { query } = req.body;
      const { topK = 10 } = req.query;
      const employerId = req.employer._id;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const results = await knowledgeBaseService.searchArticles(query, employerId.toString(), parseInt(topK));

      res.json(results);
    } catch (error) {
      console.error("Search articles error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get categories with counts
   */
  async getCategories(req, res) {
    try {
      const employerId = req.employer._id;
      const categories = await knowledgeBaseService.getCategories(employerId.toString());

      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Vote on article helpfulness
   */
  async voteArticle(req, res) {
    try {
      const { id } = req.params;
      const { helpful } = req.body;

      const article = await knowledgeBaseService.getArticleById(id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Verify employer owns the article
      if (article.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = await knowledgeBaseService.voteArticle(id, helpful);

      res.json(result);
    } catch (error) {
      console.error("Vote article error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new KnowledgeBaseController();
