const TicketIntelligence = require('../models/TicketIntelligence');

const createTicketIntelligence = async (payload) => {
  return TicketIntelligence.create(payload);
};

const findIntelligence = async (filter = {}, options = {}) => {
  const query = TicketIntelligence.find(filter).sort({ createdAt: -1 });
  if (options.limit) query.limit(options.limit);
  if (options.skip) query.skip(options.skip);
  return query.lean();
};

const findLatestByCustomer = async (customerId, limit = 1) => {
  return TicketIntelligence.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

const countCriticalTickets = async () => {
  return TicketIntelligence.countDocuments({ priority: 'critical' });
};

const countEscalatedTickets = async () => {
  return TicketIntelligence.countDocuments({ escalationRequired: true });
};

const aggregateTicketAnalytics = async () => {
  const [category, sentiment, priority] = await Promise.all([
    TicketIntelligence.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    TicketIntelligence.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]),
    TicketIntelligence.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    categoryDistribution: category.map((item) => ({ category: item._id || 'unknown', count: item.count })),
    sentimentDistribution: sentiment.map((item) => ({ sentiment: item._id || 'neutral', count: item.count })),
    priorityDistribution: priority.map((item) => ({ priority: item._id || 'medium', count: item.count })),
  };
};

module.exports = {
  createTicketIntelligence,
  findIntelligence,
  findLatestByCustomer,
  countCriticalTickets,
  countEscalatedTickets,
  aggregateTicketAnalytics,
};
