const AgentPresence = require("../models/AgentPresence");
const Employer = require("../models/Employer");

class PresenceService {
  /**
   * Update agent presence
   */
  async updatePresence(agentId, data) {
    try {
      const presence = await AgentPresence.findOneAndUpdate(
        { agentId },
        {
          ...data,
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );

      return presence;
    } catch (error) {
      console.error("Update presence error:", error);
      throw error;
    }
  }

  /**
   * Get agent presence
   */
  async getPresence(agentId) {
    try {
      return await AgentPresence.findOne({ agentId }).populate("agentId", "name email");
    } catch (error) {
      console.error("Get presence error:", error);
      throw error;
    }
  }

  /**
   * Get all online agents for employer
   */
  async getOnlineAgents(employerId) {
    try {
      return await AgentPresence.find({
        employerId,
        status: { $in: ["online", "busy"] },
      }).populate("agentId", "name email");
    } catch (error) {
      console.error("Get online agents error:", error);
      throw error;
    }
  }

  /**
   * Set agent status
   */
  async setStatus(agentId, status, socketId) {
    try {
      return await AgentPresence.findOneAndUpdate(
        { agentId },
        {
          status,
          socketId,
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Set status error:", error);
      throw error;
    }
  }

  /**
   * Add ticket to agent's current tickets
   */
  async addTicket(agentId, conversationId) {
    try {
      return await AgentPresence.findOneAndUpdate(
        { agentId },
        { $push: { currentTickets: conversationId } },
        { new: true }
      );
    } catch (error) {
      console.error("Add ticket error:", error);
      throw error;
    }
  }

  /**
   * Remove ticket from agent's current tickets
   */
  async removeTicket(agentId, conversationId) {
    try {
      return await AgentPresence.findOneAndUpdate(
        { agentId },
        { $pull: { currentTickets: conversationId } },
        { new: true }
      );
    } catch (error) {
      console.error("Remove ticket error:", error);
      throw error;
    }
  }

  /**
   * Cleanup offline agents (TTL handles this, but manual cleanup available)
   */
  async cleanupOfflineAgents(hoursThreshold = 24) {
    try {
      const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
      const result = await AgentPresence.deleteMany({
        status: "offline",
        lastSeen: { $lt: threshold },
      });

      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Cleanup offline agents error:", error);
      throw error;
    }
  }

  /**
   * Get presence summary for employer
   */
  async getPresenceSummary(employerId) {
    try {
      const summary = await AgentPresence.aggregate([
        { $match: { employerId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgCapacity: { $avg: "$capacity" },
            totalActiveTickets: { $sum: { $size: "$currentTickets" } },
          },
        },
      ]);

      const totalAgents = await Employer.countDocuments({ employerId });

      return {
        totalAgents,
        byStatus: summary,
      };
    } catch (error) {
      console.error("Get presence summary error:", error);
      throw error;
    }
  }
}

module.exports = new PresenceService();
