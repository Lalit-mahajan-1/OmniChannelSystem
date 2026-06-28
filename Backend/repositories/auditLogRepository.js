const AuditLog = require("../models/AuditLog");

class AuditLogRepository {
  async create(data) {
    return await AuditLog.create(data);
  }

  async findById(id) {
    return await AuditLog.findById(id);
  }

  async findByEmployerId(employerId, options = {}) {
    const { limit = 50, skip = 0, action, resource, resourceId, startDate, endDate } = options;
    const query = { employerId };
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (resourceId) query.resourceId = resourceId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    return await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findByActor(actorId, options = {}) {
    const { limit = 50, skip = 0 } = options;
    return await AuditLog.find({ actorId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findByResource(resource, resourceId, options = {}) {
    const { limit = 50, skip = 0 } = options;
    return await AuditLog.find({ resource, resourceId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  }

  async getRecentActions(employerId, limit = 20) {
    return await AuditLog.find({ employerId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getActionStats(employerId, startDate, endDate) {
    const matchStage = { employerId };
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    return await AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  async getResourceStats(employerId, startDate, endDate) {
    const matchStage = { employerId };
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    return await AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$resource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  async countByEmployer(employerId, filters = {}) {
    return await AuditLog.countDocuments({ employerId, ...filters });
  }

  async deleteOldLogs(daysToKeep = 730) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    return await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });
  }
}

module.exports = new AuditLogRepository();
