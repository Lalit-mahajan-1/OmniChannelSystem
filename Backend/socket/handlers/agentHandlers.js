const AgentPresence = require("../../models/AgentPresence");

class AgentHandlers {
  constructor(io) {
    this.io = io;
  }

  /**
   * Handle agent status change
   */
  async setAgentStatus(socket, data) {
    try {
      const { status } = data;
      const agentId = socket.user.id;

      if (!["online", "offline", "busy", "away"].includes(status)) {
        return socket.emit("error", { message: "Invalid status" });
      }

      // Update agent presence in database
      await AgentPresence.findOneAndUpdate(
        { agentId },
        {
          status,
          lastSeen: new Date(),
          socketId: socket.id,
        },
        { upsert: true }
      );

      // Join employer room for dashboard updates
      const employerRoom = `employer:${socket.user.employerId}`;
      socket.join(employerRoom);

      // Notify all agents in the employer
      this.io.to(employerRoom).emit("agent:status_changed", {
        agentId,
        status,
        email: socket.user.email,
      });

      // Emit specific online/offline events
      if (status === "online") {
        this.io.to(employerRoom).emit("agent:online", {
          agentId,
          name: socket.user.email,
        });
      } else if (status === "offline") {
        this.io.to(employerRoom).emit("agent:offline", {
          agentId,
        });
      }

      console.log(`Agent ${agentId} status changed to ${status}`);
    } catch (error) {
      console.error("Set agent status error:", error);
      socket.emit("error", { message: "Failed to update status" });
    }
  }

  /**
   * Handle agent heartbeat
   */
  async agentHeartbeat(socket) {
    try {
      const agentId = socket.user.id;

      await AgentPresence.findOneAndUpdate(
        { agentId },
        { lastSeen: new Date() },
        { upsert: true }
      );
    } catch (error) {
      console.error("Agent heartbeat error:", error);
    }
  }

  /**
   * Get online agents for employer
   */
  async getOnlineAgents(employerId) {
    try {
      const onlineAgents = await AgentPresence.find({
        employerId,
        status: { $in: ["online", "busy"] },
      }).populate("agentId", "name email");

      return onlineAgents;
    } catch (error) {
      console.error("Get online agents error:", error);
      return [];
    }
  }

  /**
   * Emit presence update to employer room
   */
  emitPresenceUpdate(employerId, agents) {
    const employerRoom = `employer:${employerId}`;
    this.io.to(employerRoom).emit("presence:update", { agents });
  }
}

module.exports = AgentHandlers;
