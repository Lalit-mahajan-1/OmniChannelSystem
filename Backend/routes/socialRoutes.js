const express = require('express');
const router = express.Router();

const {
  scrapeAndSave,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  resolveComplaint,
  linkCustomerToComplaint,
  addInternalNote,
  getStats,
  getAgentStats,
  deleteComplaint,
} = require('../controllers/socialController');

const { authenticate, authorize } = require('../middleware/auth');
const { scrapeLimiter } = require('../middleware/rateLimiter');
const { validateObjectId, validateScrape } = require('../middleware/validate');

// ── All social routes require employer authentication ─────────────────────────

// Scrape — rate limited heavily (Puppeteer is resource-intensive)
router.post('/scrape', authenticate, authorize('employer'), scrapeLimiter, validateScrape, scrapeAndSave);

// Complaints
router.get('/complaints', authenticate, authorize('employer'), getComplaints);
router.get('/complaints/:id', authenticate, authorize('employer'), validateObjectId(), getComplaintById);
router.patch('/complaints/:id/assign', authenticate, authorize('employer'), validateObjectId(), assignComplaint);
router.patch('/complaints/:id/status', authenticate, authorize('employer'), validateObjectId(), updateComplaintStatus);
router.patch('/complaints/:id/resolve', authenticate, authorize('employer'), validateObjectId(), resolveComplaint);
router.patch('/complaints/:id/link-customer', authenticate, authorize('employer'), validateObjectId(), linkCustomerToComplaint);
router.patch('/complaints/:id/note', authenticate, authorize('employer'), validateObjectId(), addInternalNote);
router.delete('/complaints/:id', authenticate, authorize('employer'), validateObjectId(), deleteComplaint);

// Dashboard stats
router.get('/stats', authenticate, authorize('employer'), getStats);
router.get('/stats/agents', authenticate, authorize('employer'), getAgentStats);

module.exports = router;