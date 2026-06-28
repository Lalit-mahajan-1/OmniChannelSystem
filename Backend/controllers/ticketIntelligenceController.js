const {
  analyzeTicket,
  getTicketIntelligence,
  getTicketAnalytics,
  getAtRiskCustomers,
  summarizeCustomerHistory,
} = require('../services/ticketIntelligenceService');

// POST /api/tickets/analyze
const analyzeTicketController = async (req, res) => {
  try {
    const { message, channel, customerId, ticketId, sourceId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required and must be a non-empty string' });
    }
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required' });
    }
    if (!channel) {
      return res.status(400).json({ success: false, message: 'channel is required (email, whatsapp, twitter, reddit, social, unknown)' });
    }

    const result = await analyzeTicket({ message, channel, customerId, ticketId, sourceId });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('[TicketIntelligence] analyzeTicket error:', err.message);
    const status = err.message.includes('required') ? 400 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/intelligence
const getTicketIntelligenceController = async (req, res) => {
  try {
    const filter = {};
    const { customerId, channel, priority, limit = 50, skip = 0 } = req.query;

    if (customerId) filter.customerId = customerId;
    if (channel) filter.channel = channel;
    if (priority) filter.priority = priority;

    const data = await getTicketIntelligence(filter, {
      limit: Math.min(Number(limit) || 50, 200),
      skip: Number(skip) || 0,
    });

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[TicketIntelligence] getIntelligence error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/at-risk
const getAtRiskCustomersController = async (req, res) => {
  try {
    const customers = await getAtRiskCustomers();
    return res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    console.error('[TicketIntelligence] getAtRisk error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/analytics
const getTicketAnalyticsController = async (req, res) => {
  try {
    const analytics = await getTicketAnalytics();
    return res.json({ success: true, data: analytics });
  } catch (err) {
    console.error('[TicketIntelligence] getAnalytics error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tickets/summarize/:customerId
const summarizeHistoryController = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) return res.status(400).json({ success: false, message: 'customerId is required' });
    const summary = await summarizeCustomerHistory(customerId);
    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error('[TicketIntelligence] summarizeHistory error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  analyzeTicketController,
  getTicketIntelligenceController,
  getAtRiskCustomersController,
  getTicketAnalyticsController,
  summarizeHistoryController,
};
