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

// Meta webhook
router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', receiveMessage);

// send message using stored employer/customer
router.post('/messages/send', sendMessage);

// direct backend replacement of Meta Graph API
router.post('/messages/send-direct', sendDirectMessage);

// chat history
router.get('/chats', getAllChats);
router.get('/chats/:customerId', getChatHistory);

module.exports = router;