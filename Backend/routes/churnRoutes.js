const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { predictChurn, getPredictions, getChurnStats, markAction } = require('../controllers/churnController');

router.use(authenticate, authorize('employer'));

router.get('/', getPredictions);
router.get('/stats', getChurnStats);
router.post('/predict/:customerId', predictChurn);
router.patch('/:id/action', markAction);

module.exports = router;
