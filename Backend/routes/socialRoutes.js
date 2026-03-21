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

// scrape
router.post('/scrape', scrapeAndSave);

// complaints
router.get('/complaints', getComplaints);
router.get('/complaints/:id', getComplaintById);
router.patch('/complaints/:id/assign', assignComplaint);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.patch('/complaints/:id/resolve', resolveComplaint);
router.patch('/complaints/:id/link-customer', linkCustomerToComplaint);
router.patch('/complaints/:id/note', addInternalNote);
router.delete('/complaints/:id', deleteComplaint);

// dashboard
router.get('/stats', getStats);
router.get('/stats/agents', getAgentStats);

module.exports = router;