const express = require('express');
const router  = express.Router();
const {
  scrapeAndSave,
  getComplaints,
  getStats,
  deleteComplaint,
} = require('../controllers/socialController');

// POST /api/social/scrape   — trigger a scrape
router.post('/scrape', scrapeAndSave);

// GET  /api/social/complaints — get saved complaints
router.get('/complaints', getComplaints);

// GET  /api/social/stats      — dashboard stats
router.get('/stats', getStats);

// DELETE /api/social/:id
router.delete('/:id', deleteComplaint);

module.exports = router;