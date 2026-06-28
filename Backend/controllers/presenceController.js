const AgentPresence = require("../models/AgentPresence");
const Employer = require("../models/Employer");

class PresenceController {
  /**
   * Get all online agents for employer
   */
  async getOnlineAgents(req, res) {
    try {
      const employerId = req.employer._id;

      const onlineAgents = await AgentPresence.find({
        employerId,
        status: { $in: ["online", "busy"] },
      })
        .populate("agentId", "name email")
        .sort({ lastSeen: -1 });

      res.json(onlineAgents);
    } catch (error) {
      console.error("Get online agents error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get agent presence by ID
   */
  async getAgentPresence(req, res) {
    try {
      const { agentId } = req.params;

      const presence = await AgentPresence.findOne({ agentId }).populate("agentId", "name email");

      if (!presence) {
        return res.status(404).json({ error: "Agent presence not found" });
      }

      res.json(presence);
    } catch (error) {
      console.error("Get agent presence error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update agent presence
   */
  async updatePresence(req, res) {
    try {
      const { status, capacity, currentChannel, specialization } = req.body;
      const agentId = req.employer._id;

      const presence = await AgentPresence.findOneAndUpdate(
        { agentId },
        {
          status,
          capacity,
          currentChannel,
          specialization,
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );

      res.json(presence);
    } catch (error) {
      console.error("Update presence error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get presence statistics
   */
  async getPresenceStats(req, res) {
    try {
      const employerId = req.employer._id;

      const stats = await AgentPresence.aggregate([
        { $match: { employerId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgCapacity: { $avg: "$capacity" },
          },
        },
      ]);

      const totalAgents = await Employer.countDocuments({ employerId });
      const onlineCount = stats.find((s) => s._id === "online")?.count || 0;
      const busyCount = stats.find((s) => s._id === "busy")?.count || 0;

      res.json({
        totalAgents,
        onlineAgents: onlineCount,
        busyAgents: busyCount,
        offlineAgents: totalAgents - onlineCount - busyCount,
        byStatus: stats,
      });
    } catch (error) {
      console.error("Get presence stats error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PresenceController();
