const churnService = require('../services/churnService');
const { autoCreateTask } = require('./taskController');
const Customer = require('../models/Customer');

const predictChurn = async (req, res) => {
  try {
    const { customerId } = req.params;
    const employerId = req.userId;
    const prediction = await churnService.predictChurn(customerId, employerId);

    if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
      const customer = await Customer.findById(customerId).select('name').lean();
      autoCreateTask({
        title: `Retention: ${customer?.name || 'Customer'} at ${prediction.riskLevel} churn risk`,
        description: `Churn probability: ${(prediction.churnProbability * 100).toFixed(1)}%. ${prediction.recommendations?.[0] || ''}`,
        customerId,
        priority: prediction.riskLevel === 'critical' ? 'critical' : 'high',
        category: 'retention',
        createdBy: employerId,
      }).catch(() => {});
    }

    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPredictions = async (req, res) => {
  try {
    const employerId = req.userId;
    const { riskLevel, limit = 50 } = req.query;
    const predictions = await churnService.getPredictions(employerId, {
      riskLevel,
      limit: Number(limit),
    });
    res.json({ success: true, data: predictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getChurnStats = async (req, res) => {
  try {
    const employerId = req.userId;
    const stats = await churnService.getChurnStats(employerId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const result = await churnService.markActionTaken(id, action, req.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { predictChurn, getPredictions, getChurnStats, markAction };
