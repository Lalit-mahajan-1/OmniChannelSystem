const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getCampaigns,
  updateCampaign,
  requestApproval,
  getApprovals,
  getApprovalStats,
  updateApproval,
} = require('../controllers/marketingController');

router.post('/campaigns', createCampaign);
router.get('/campaigns', getCampaigns);
router.patch('/campaigns/:id', updateCampaign);
router.post('/campaigns/:id/request-approval', requestApproval);

router.get('/approvals', getApprovals);
router.get('/approvals/stats', getApprovalStats);
router.patch('/approvals/:id', updateApproval);

module.exports = router;
