const AgentPresence = require("../models/AgentPresence");
const Conversation = require("../models/Conversation");

class SmartRoutingService {
  /**
   * Calculate routing score for an agent
   */
  calculateRoutingScore(agent, ticket) {
    const expertiseMatch = this.getExpertiseMatch(agent, ticket);
    const workloadInverse = this.getWorkloadInverse(agent);
    const priorityUrgency = this.getPriorityUrgency(ticket);

    // Weighted score
    const score = expertiseMatch * 0.4 + workloadInverse * 0.35 + priorityUrgency * 0.25;

    return score;
  }

  /**
   * Get expertise match score (0.0 to 1.0)
   */
  getExpertiseMatch(agent, ticket) {
    if (!agent.specialization || agent.specialization.length === 0) {
      return 0.5; // Neutral if no specialization
    }

    const category = ticket.category || "general";
    if (agent.specialization.includes(category)) {
      return 1.0;
    }

    return 0.5;
  }

  /**
   * Get workload inverse score (0.0 to 1.0)
   */
  getWorkloadInverse(agent) {
    const currentTickets = agent.currentTickets?.length || 0;
    const capacity = agent.capacity || 5;
    const workloadRatio = currentTickets / capacity;

    return Math.max(0, 1 - workloadRatio);
  }

  /**
   * Get priority urgency score (0.0 to 1.0)
   */
  getPriorityUrgency(ticket) {
    const priority = ticket.priority || "medium";
    const priorityMap = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    };

    return priorityMap[priority] || 0.5;
  }

  /**
   * Find best agent for a ticket
   */
  async findBestAgent(ticket, employerId) {
    try {
      // Get all online agents for employer
      const onlineAgents = await AgentPresence.find({
        employerId,
        status: { $in: ["online", "busy"] },
      }).populate("agentId", "name email");

      if (onlineAgents.length === 0) {
        return null;
      }

      // Calculate scores for each agent
      const scoredAgents = onlineAgents.map((agent) => ({
        agent,
        score: this.calculateRoutingScore(agent, ticket),
      }));

      // Sort by score descending
      scoredAgents.sort((a, b) => b.score - a.score);

      // Return best agent with available capacity
      for (const scored of scoredAgents) {
        const currentTickets = scored.agent.currentTickets?.length || 0;
        const capacity = scored.agent.capacity || 5;

        if (currentTickets < capacity) {
          return scored.agent;
        }
      }

      // Fallback: return highest scored agent even if at capacity
      return scoredAgents[0].agent;
    } catch (error) {
      console.error("Find best agent error:", error);
      throw error;
    }
  }

  /**
   * Assign ticket to best agent
   */
  async assignTicket(ticket, employerId) {
    try {
      const bestAgent = await this.findBestAgent(ticket, employerId);

      if (!bestAgent) {
        // No online agents, leave unassigned
        return { success: false, message: "No online agents available" };
      }

      // Update conversation with assigned agent
      await Conversation.findOneAndUpdate(
        { conversationId: ticket.conversationId },
        { assignedAgent: bestAgent.agentId._id },
        { new: true }
      );

      // Update agent presence with new ticket
      await AgentPresence.findOneAndUpdate(
        { agentId: bestAgent.agentId._id },
        { $push: { currentTickets: ticket._id } },
        { new: true }
      );

      // Emit assignment event via Socket.IO
      const { getIO } = require("../socket");
      const io = getIO();
      io.to(`agent:${bestAgent.agentId._id}`).emit("ticket:assigned", {
        ticketId: ticket.conversationId,
        agentId: bestAgent.agentId._id,
        agentName: bestAgent.agentId.name,
      });

      return {
        success: true,
        agent: bestAgent.agentId,
        score: this.calculateRoutingScore(bestAgent, ticket),
      };
    } catch (error) {
      console.error("Assign ticket error:", error);
      throw error;
    }
  }

  /**
   * Reassign ticket to different agent
   */
  async reassignTicket(conversationId, newAgentId) {
    try {
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const oldAgentId = conversation.assignedAgent;

      // Update conversation
      conversation.assignedAgent = newAgentId;
      await conversation.save();

      // Update old agent's current tickets
      if (oldAgentId) {
        await AgentPresence.findOneAndUpdate(
          { agentId: oldAgentId },
          { $pull: { currentTickets: conversation._id } }
        );
      }

      // Update new agent's current tickets
      await AgentPresence.findOneAndUpdate(
        { agentId: newAgentId },
        { $push: { currentTickets: conversation._id } }
      );

      // Emit reassignment event
      const { getIO } = require("../socket");
      const io = getIO();
      io.to(`agent:${newAgentId}`).emit("ticket:assigned", {
        ticketId: conversationId,
        agentId: newAgentId,
      });

      return { success: true };
    } catch (error) {
      console.error("Reassign ticket error:", error);
      throw error;
    }
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(employerId) {
    try {
      const agents = await AgentPresence.find({ employerId }).populate("agentId", "name email");

      const stats = agents.map((agent) => ({
        agentId: agent.agentId._id,
        agentName: agent.agentId.name,
        status: agent.status,
        currentTickets: agent.currentTickets?.length || 0,
        capacity: agent.capacity,
        utilization: ((agent.currentTickets?.length || 0) / agent.capacity) * 100,
      }));

      return stats;
    } catch (error) {
      console.error("Get routing stats error:", error);
      throw error;
    }
  }
}

module.exports = new SmartRoutingService();
