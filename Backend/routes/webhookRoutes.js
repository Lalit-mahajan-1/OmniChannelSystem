const express = require('express');
const router = express.Router();

const {
  verifyWebhook,
  receiveMessage,
  sendMessage,
  sendDirectMessage,
  getAllChats,
  getChatHistory,
} = require('../controllers/webhookController');

const { authenticate, authorize, authenticateOrService } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimiter');
const { validateSendMessage } = require('../middleware/validate');

// ── Public: Meta Webhook (must remain unauthenticated) ────────────────────────
// Meta sends GET for verification and POST for incoming messages
router.get('/whatsapp', webhookLimiter, verifyWebhook);
router.post('/whatsapp', webhookLimiter, receiveMessage);

// ── Protected: Send messages (Employer or Agent service) ─────────────────────
router.post('/messages/send', authenticateOrService, authorize('employer'), validateSendMessage, sendMessage);
router.post('/messages/send-direct', authenticateOrService, authorize('employer'), sendDirectMessage);

// ── Protected: Chat history (Employer or Agent service) ──────────────────────
router.get('/chats', authenticateOrService, authorize('employer'), getAllChats);
router.get('/chats/:customerId', authenticateOrService, authorize('employer'), getChatHistory);

module.exports = router;