const mongoose = require('mongoose');
const { classifyTicket, askAi } = require('./aiClient');
const {
  createTicketIntelligence,
  findIntelligence,
  findLatestByCustomer,
  countCriticalTickets,
  countEscalatedTickets,
  aggregateTicketAnalytics,
} = require('../repositories/ticketIntelligenceRepository');
const { calculateCustomerHealth } = require('../utils/customerHealth');
const Customer = require('../models/Customer');

// ── Analyze a ticket using AI and persist the result ──────────────────────────
const analyzeTicket = async ({ message, channel, customerId, ticketId, sourceId }) => {
  if (!message || !message.toString().trim()) {
    throw new Error('Message is required for ticket intelligence analysis.');
  }

  const validChannels = ['email', 'whatsapp', 'twitter', 'reddit', 'social', 'unknown'];
  const safeChannel = validChannels.includes(channel) ? channel : 'unknown';

  const classification = await classifyTicket({ message, channel: safeChannel });

  const intelligence = await createTicketIntelligence({
    ticketId: ticketId || `ticket-${Date.now()}`,
    customerId: customerId || null,
    channel: safeChannel,
    message,
    ...classification,
    sourceId: sourceId || '',
  });

  // Update customer health score non-blocking
  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    setImmediate(async () => {
      try {
        const recentIntelligence = await findLatestByCustomer(customerId, 10);
        const health = calculateCustomerHealth(recentIntelligence);
        await Customer.findByIdAndUpdate(customerId, {
          healthScore: health.healthScore,
          healthStatus: health.healthStatus,
        });
      } catch (healthErr) {
        console.warn('[TicketIntelligence] Health update failed:', healthErr.message);
      }
    });
  }

  return intelligence;
};

// ── Fetch ticket intelligence records (filterable, paginated) ─────────────────
const getTicketIntelligence = async (filter = {}, options = {}) => {
  return findIntelligence(filter, options);
};

// ── Aggregated analytics for dashboard ───────────────────────────────────────
const getTicketAnalytics = async () => {
  const [criticalTickets, escalatedTickets, analytics] = await Promise.all([
    countCriticalTickets(),
    countEscalatedTickets(),
    aggregateTicketAnalytics(),
  ]);

  return {
    criticalTickets,
    escalatedTickets,
    ...analytics,
  };
};

// ── At-risk customer list ─────────────────────────────────────────────────────
const getAtRiskCustomers = async () => {
  return Customer.find({ healthStatus: 'At Risk' })
    .sort({ healthScore: 1 })
    .limit(50)
    .select('name email phone healthScore healthStatus channel_ids createdAt')
    .lean();
};

// ── Summarize Customer History ───────────────────────────────────────────────
const summarizeCustomerHistory = async (customerId) => {
  const recentIntelligence = await findLatestByCustomer(customerId, 10);
  if (!recentIntelligence || recentIntelligence.length === 0) {
    return "No recent history available to summarize.";
  }

  const historyText = recentIntelligence.map(t => 
    `Date: ${t.createdAt}, Channel: ${t.channel}, Message: "${t.message}", Sentiment: ${t.sentiment}, Category: ${t.category}`
  ).join('\n');

  const prompt = `Summarize the following customer interaction history for a support agent. Highlight the main issues, customer sentiment trend, and any pending actions needed.\n\nHistory:\n${historyText}`;

  try {
    const summary = await askAi(prompt);
    return summary;
  } catch (error) {
    console.error("Error summarizing history:", error);
    return "Failed to generate summary.";
  }
};

module.exports = {
  analyzeTicket,
  getTicketIntelligence,
  getTicketAnalytics,
  getAtRiskCustomers,
  summarizeCustomerHistory,
};
