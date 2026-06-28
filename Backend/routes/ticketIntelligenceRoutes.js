const express = require('express');
const {
  analyzeTicketController,
  getTicketIntelligenceController,
  getAtRiskCustomersController,
  getTicketAnalyticsController,
} = require('../controllers/ticketIntelligenceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All ticket intelligence routes require a logged-in employer
router.use(authenticate, authorize('employer'));

// POST /api/tickets/analyze  — classify a ticket with AI
router.post('/analyze', analyzeTicketController);

// GET  /api/tickets/intelligence — list all intelligence records (filterable)
router.get('/intelligence', getTicketIntelligenceController);

// GET  /api/tickets/analytics  — aggregated stats for dashboard
router.get('/analytics', getTicketAnalyticsController);

// GET  /api/tickets/at-risk    — customers with 'At Risk' health status
router.get('/at-risk', getAtRiskCustomersController);

// GET /api/tickets/summarize/:customerId - Summarize history
const { summarizeHistoryController } = require('../controllers/ticketIntelligenceController');
router.get('/summarize/:customerId', summarizeHistoryController);

module.exports = router;
