const auditLogRepository = require("../repositories/auditLogRepository");

class AuditController {
  /**
   * List audit logs
   */
  async listLogs(req, res) {
    try {
      const { page = 1, limit = 50, action, resource, resourceId, startDate, endDate } = req.query;
      const employerId = req.employer._id;

      const logs = await auditLogRepository.findByEmployerId(employerId.toString(), {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        action,
        resource,
        resourceId,
        startDate,
        endDate,
      });

      const total = await auditLogRepository.countByEmployer(employerId.toString(), { action, resource });

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("List audit logs error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get action statistics
   */
  async getActionStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const employerId = req.employer._id;

      const stats = await auditLogRepository.getActionStats(employerId.toString(), startDate, endDate);

      res.json(stats);
    } catch (error) {
      console.error("Get action stats error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get resource statistics
   */
  async getResourceStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const employerId = req.employer._id;

      const stats = await auditLogRepository.getResourceStats(employerId.toString(), startDate, endDate);

      res.json(stats);
    } catch (error) {
      console.error("Get resource stats error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get recent actions
   */
  async getRecentActions(req, res) {
    try {
      const { limit = 20 } = req.query;
      const employerId = req.employer._id;

      const logs = await auditLogRepository.getRecentActions(employerId.toString(), parseInt(limit));

      res.json(logs);
    } catch (error) {
      console.error("Get recent actions error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuditController();
