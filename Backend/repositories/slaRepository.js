const SLAPolicy = require("../models/SLAPolicy");
const SLABreach = require("../models/SLABreach");

class SLARepository {
  // SLA Policy methods
  async createPolicy(data) {
    return await SLAPolicy.create(data);
  }

  async findPolicyById(id) {
    return await SLAPolicy.findById(id);
  }

  async findPoliciesByEmployer(employerId, options = {}) {
    const { isActive = true } = options;
    return await SLAPolicy.find({ employerId, isActive }).sort({ priority: -1 });
  }

  async findDefaultPolicy(employerId) {
    return await SLAPolicy.findOne({ employerId, isDefault: true, isActive: true });
  }

  async findPolicyByCriteria(employerId, channel, priority) {
    return await SLAPolicy.findOne({ employerId, channel: { $in: [channel, "all"] }, priority, isActive: true });
  }

  async updatePolicy(id, data) {
    return await SLAPolicy.findByIdAndUpdate(id, data, { new: true });
  }

  async deletePolicy(id) {
    return await SLAPolicy.findByIdAndDelete(id);
  }

  async softDeletePolicy(id) {
    return await SLAPolicy.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  // SLA Breach methods
  async createBreach(data) {
    return await SLABreach.create(data);
  }

  async findBreachById(id) {
    return await SLABreach.findById(id).populate("conversationId").populate("customerId").populate("assignedAgent");
  }

  async findBreachesByEmployer(employerId, options = {}) {
    const { limit = 50, skip = 0, severity, notified, startDate, endDate } = options;
    const query = { employerId };
    
    if (severity) query.severity = severity;
    if (notified !== undefined) query.notified = notified;
    if (startDate || endDate) {
      query.breachedAt = {};
      if (startDate) query.breachedAt.$gte = new Date(startDate);
      if (endDate) query.breachedAt.$lte = new Date(endDate);
    }
    
    return await SLABreach.find(query)
      .populate("conversationId")
      .populate("customerId", "name email")
      .populate("assignedAgent", "name email")
      .sort({ breachedAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findBreachesByConversation(conversationId) {
    return await SLABreach.find({ conversationId }).sort({ breachedAt: -1 });
  }

  async findBreachesByCustomer(customerId, employerId) {
    return await SLABreach.find({ customerId, employerId })
      .populate("conversationId")
      .sort({ breachedAt: -1 });
  }

  async updateBreach(id, data) {
    return await SLABreach.findByIdAndUpdate(id, data, { new: true });
  }

  async markBreachNotified(id) {
    return await SLABreach.findByIdAndUpdate(id, { notified: true }, { new: true });
  }

  async markBreachResolved(id, resolutionDelay) {
    return await SLABreach.findByIdAndUpdate(
      id,
      { resolvedAfterBreach: true, resolutionDelay },
      { new: true }
    );
  }

  async findUnnotifiedBreaches(employerId) {
    return await SLABreach.find({ employerId, notified: false })
      .populate("conversationId")
      .populate("assignedAgent", "name email")
      .sort({ breachedAt: -1 });
  }

  async getBreachStats(employerId, startDate, endDate) {
    const matchStage = { employerId };
    if (startDate || endDate) {
      matchStage.breachedAt = {};
      if (startDate) matchStage.breachedAt.$gte = new Date(startDate);
      if (endDate) matchStage.breachedAt.$lte = new Date(endDate);
    }

    return await SLABreach.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$breachType",
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$severity", "breach"] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ["$severity", "warning"] }, 1, 0] } },
        },
      },
    ]);
  }

  async countBreachesByEmployer(employerId, filters = {}) {
    return await SLABreach.countDocuments({ employerId, ...filters });
  }
}

module.exports = new SLARepository();
