const express = require('express');
const router = express.Router();

const {
  verifyWebhook,
  receiveMessage,
  sendMessage,
  getConversation,
  getAllConversations,
} = require('../controllers/webhookController');

router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', receiveMessage);

router.post('/send', sendMessage);

router.get('/conversations/:customerId', getConversation);
router.get('/conversations', getAllConversations);

module.exports = router;