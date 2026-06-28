const express = require("express");
const router = express.Router();
const ragController = require("../controllers/ragController");
const { authenticate } = require("../middleware/auth");

// All RAG routes require employer authentication
router.use(authenticate);

// Query vector store for context
router.post("/query", ragController.queryVectorStore.bind(ragController));

// Embed and store a conversation
router.post("/embed", ragController.embedConversation.bind(ragController));

// Bulk embed historical conversations
router.post("/embed-bulk", ragController.embedBulkConversations.bind(ragController));

// Get semantic memory for a customer
router.get("/customer-memory/:customerId", ragController.getCustomerMemory.bind(ragController));

// GDPR: Delete customer vectors
router.delete("/customer-memory/:customerId", ragController.deleteCustomerMemory.bind(ragController));

module.exports = router;
