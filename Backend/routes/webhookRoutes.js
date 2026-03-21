const express = require('express');
const router = express.Router();

const {
  verifyWebhook,
  receiveMessage,
  sendMessage,
  getAllChats,
  getChatHistory,
} = require('../controllers/webhookController');

// Meta webhook
router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', receiveMessage);

// employer -> customer
router.post('/messages/send', sendMessage);

// chat history
router.get('/chats', getAllChats);
router.get('/chats/:customerId', getChatHistory);

module.exports = router;