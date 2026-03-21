const express = require('express');
const router  = express.Router();
const Email   = require('../models/Email');

// GET /api/emails?employerId=xxx
// All emails for employer dashboard
router.get('/', async (req, res) => {
  try {
    const { employerId } = req.query;
    const filter = employerId ? { employerId } : {};

    const emails = await Email.find(filter)
      .sort({ emailDate: -1 })
      .populate('customerId', 'name email')
      .select('-__v');

    res.json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/emails/thread/:threadId
// Full thread conversation
router.get('/thread/:threadId', async (req, res) => {
  try {
    const emails = await Email.find({ threadId: req.params.threadId })
      .sort({ emailDate: 1 })
      .select('-__v');

    res.json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/emails/customer/:customerId
// All emails from a specific customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const emails = await Email.find({ customerId: req.params.customerId })
      .sort({ emailDate: -1 })
      .select('-__v');

    res.json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;