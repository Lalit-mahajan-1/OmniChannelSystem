const express = require("express");
const router = express.Router();
const knowledgeBaseController = require("../controllers/knowledgeBaseController");
const { authenticate, authorize } = require("../middleware/auth");

// All knowledge base routes require employer authentication
router.use(authenticate, authorize("employer"));
// Get categories with counts
router.get("/categories", knowledgeBaseController.getCategories.bind(knowledgeBaseController));

// Search articles semantically
router.post("/search", knowledgeBaseController.searchArticles.bind(knowledgeBaseController));

// Get single article
router.get("/:id", knowledgeBaseController.getArticle.bind(knowledgeBaseController));

// Create article
router.post("/", knowledgeBaseController.createArticle.bind(knowledgeBaseController));

// Update article
router.put("/:id", knowledgeBaseController.updateArticle.bind(knowledgeBaseController));

// Delete article
router.delete("/:id", knowledgeBaseController.deleteArticle.bind(knowledgeBaseController));

// Vote on article helpfulness
router.post("/:id/vote", knowledgeBaseController.voteArticle.bind(knowledgeBaseController));

module.exports = router;
