const auditLogRepository = require("../repositories/auditLogRepository");

class AuditService {
  /**
   * Log an action to the audit trail
   */
  async logAction(data) {
    try {
      return await auditLogRepository.create(data);
    } catch (error) {
      console.error("Log action error:", error);
      throw error;
    }
  }

  /**
   * Log mutation (create/update/delete)
   */
  async logMutation(actorId, actorType, actorEmail, action, resource, resourceId, previousState, newState, employerId, metadata = {}) {
    try {
      return await auditLogRepository.create({
        actorId,
        actorType,
        actorEmail,
        action,
        resource,
        resourceId,
        previousState,
        newState,
        employerId,
        metadata,
      });
    } catch (error) {
      console.error("Log mutation error:", error);
      throw error;
    }
  }

  /**
   * Log AI action
   */
  async logAIAction(conversationId, agentName, action, confidence, duration, employerId) {
    try {
      return await auditLogRepository.create({
        actorId: conversationId,
        actorType: "ai",
        actorEmail: agentName,
        action: `ai.${action}`,
        resource: "conversation",
        resourceId: conversationId,
        employerId,
        metadata: {
          agentName,
          confidence,
          duration,
        },
      });
    } catch (error) {
      console.error("Log AI action error:", error);
      throw error;
    }
  }

  /**
   * Get audit trail for a resource
   */
  async getResourceAuditTrail(resource, resourceId, employerId) {
    try {
      return await auditLogRepository.findByResource(resource, resourceId);
    } catch (error) {
      console.error("Get resource audit trail error:", error);
      throw error;
    }
  }

  /**
   * Get audit trail for an actor
   */
  async getActorAuditTrail(actorId) {
    try {
      return await auditLogRepository.findByActor(actorId);
    } catch (error) {
      console.error("Get actor audit trail error:", error);
      throw error;
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(employerId, startDate, endDate) {
    try {
      const actionStats = await auditLogRepository.getActionStats(employerId, startDate, endDate);
      const resourceStats = await auditLogRepository.getResourceStats(employerId, startDate, endDate);

      return {
        actionStats,
        resourceStats,
        period: { startDate, endDate },
      };
    } catch (error) {
      console.error("Get compliance report error:", error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep = 730) {
    try {
      return await auditLogRepository.deleteOldLogs(daysToKeep);
    } catch (error) {
      console.error("Cleanup old logs error:", error);
      throw error;
    }
  }
}

module.exports = new AuditService();
