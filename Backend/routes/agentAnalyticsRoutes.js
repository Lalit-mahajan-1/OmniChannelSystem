const express = require('express');
const router = express.Router();
const AgentAnalytics = require('../models/AgentAnalytics');
const { authenticateOrService } = require('../middleware/auth');

router.get('/stats', authenticateOrService, async (req, res) => {
  try {
    const [
      totalReplies,
      successCount,
      failedCount,
      byAgent,
      byChannel,
      avgLatency,
      recentActions,
    ] = await Promise.all([
      AgentAnalytics.countDocuments(),
      AgentAnalytics.countDocuments({ status: 'success' }),
      AgentAnalytics.countDocuments({ status: 'failed' }),
      AgentAnalytics.aggregate([
        { $group: { _id: '$agentType', count: { $sum: 1 }, success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      AgentAnalytics.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
      ]),
      AgentAnalytics.aggregate([
        { $match: { status: 'success', totalLatencyMs: { $gt: 0 } } },
        { $group: { _id: null, avgGeneration: { $avg: '$generationLatencyMs' }, avgSend: { $avg: '$sendLatencyMs' }, avgTotal: { $avg: '$totalLatencyMs' } } },
      ]),
      AgentAnalytics.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('agentType actionType status channel totalLatencyMs createdAt customerId')
        .lean(),
    ]);

    const successRate = totalReplies > 0 ? Math.round((successCount / totalReplies) * 1000) / 10 : 0;
    const latency = avgLatency[0] || { avgGeneration: 0, avgSend: 0, avgTotal: 0 };

    res.json({
      success: true,
      data: {
        totalReplies,
        successCount,
        failedCount,
        successRate,
        avgGenerationMs: Math.round(latency.avgGeneration || 0),
        avgSendMs: Math.round(latency.avgSend || 0),
        avgTotalMs: Math.round(latency.avgTotal || 0),
        byAgent,
        byChannel,
        recentActions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
