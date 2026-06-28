const SLAPolicy = require("../models/SLAPolicy");
const SLABreach = require("../models/SLABreach");
const Conversation = require("../models/Conversation");
const slaRepository = require("../repositories/slaRepository");
const { getIO } = require("../socket");

class SLAService {
  /**
   * Assign SLA policy to a conversation based on criteria
   */
  async assignSLA(conversationId, employerId, channel, priority) {
    try {
      // Try to find matching policy
      let policy = await slaRepository.findPolicyByCriteria(employerId, channel, priority);

      // Fallback to default policy
      if (!policy) {
        policy = await slaRepository.findDefaultPolicy(employerId);
      }

      if (!policy) {
        console.warn(`No SLA policy found for employer ${employerId}`);
        return null;
      }

      // Update conversation with SLA policy
      await Conversation.findOneAndUpdate(
        { conversationId },
        { slaPolicy: policy._id },
        { new: true }
      );

      return policy;
    } catch (error) {
      console.error("Assign SLA error:", error);
      throw error;
    }
  }

  /**
   * Check SLA compliance for a conversation
   */
  async checkSLA(conversationId) {
    try {
      const conversation = await Conversation.findOne({ conversationId }).populate("slaPolicy");
      if (!conversation || !conversation.slaPolicy) {
        return null;
      }

      const now = new Date();
      const createdAt = conversation.createdAt;
      const ageInMinutes = (now - createdAt) / (1000 * 60);

      const policy = conversation.slaPolicy;
      const result = {
        conversationId,
        firstResponseSLA: policy.firstResponseSLA,
        resolutionSLA: policy.resolutionSLA,
        ageInMinutes,
        firstResponseStatus: this.getSLAStatus(ageInMinutes, policy.firstResponseSLA),
        resolutionStatus: this.getSLAStatus(ageInMinutes, policy.resolutionSLA),
        firstResponseAt: conversation.firstResponseAt,
        resolvedAt: conversation.resolvedAt,
      };

      return result;
    } catch (error) {
      console.error("Check SLA error:", error);
      throw error;
    }
  }

  /**
   * Get SLA status based on age and threshold
   */
  getSLAStatus(age, threshold) {
    const warningThreshold = threshold * 0.8;

    if (age >= threshold) {
      return "breached";
    } else if (age >= warningThreshold) {
      return "warning";
    }
    return "ok";
  }

  /**
   * Get SLA metrics for employer
   */
  async getSLAMetrics(employerId, startDate, endDate) {
    try {
      const breaches = await slaRepository.getBreachStats(employerId, startDate, endDate);
      const totalConversations = await Conversation.countDocuments({
        employerId,
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      });

      const breachCount = breaches.reduce((sum, b) => sum + b.count, 0);
      const complianceRate = totalConversations > 0 ? ((totalConversations - breachCount) / totalConversations) * 100 : 100;

      return {
        totalConversations,
        breachCount,
        complianceRate,
        byType: breaches,
      };
    } catch (error) {
      console.error("Get SLA metrics error:", error);
      throw error;
    }
  }

  /**
   * Escalate conversation based on SLA breach
   */
  async escalateConversation(conversationId, reason) {
    try {
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // TODO: Implement escalation logic (assign to supervisor, notify, etc.)
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("ticket:escalated", {
        conversationId,
        reason,
        priority: "high",
      });

      return { success: true, message: "Conversation escalated" };
    } catch (error) {
      console.error("Escalate conversation error:", error);
      throw error;
    }
  }
}

module.exports = new SLAService();
