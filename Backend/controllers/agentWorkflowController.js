const { createAgentGraph } = require("../agents/graph");
const AgentState = require("../agents/state");
const { addJob } = require("../config/bullmq");
const { getIO } = require("../socket");
const auditLogRepository = require("../repositories/auditLogRepository");

class AgentWorkflowController {
  /**
   * Trigger AI agent workflow for a message
   */
  async triggerWorkflow(req, res) {
    try {
      const { conversationId, message, customerId, employerId, channel } = req.body;

      if (!message || !customerId || !employerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create initial state
      const initialState = new AgentState({
        conversationId,
        customerId,
        employerId,
        incomingMessage: message,
        channel: channel || "support",
      });

      // Add job to queue for async processing
      await addJob("aiPipeline", "process_message", {
        conversationId,
        message,
        customerId,
        employerId,
        channel,
      });

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "ai.workflow_triggered",
        resource: "conversation",
        resourceId: conversationId,
        employerId: req.employer._id,
        metadata: { channel },
      });

      res.json({
        success: true,
        message: "AI workflow triggered",
        conversationId,
      });
    } catch (error) {
      console.error("Trigger workflow error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get workflow trace for a conversation
   */
  async getWorkflowTrace(req, res) {
    try {
      const { conversationId } = req.params;

      // TODO: Store and retrieve workflow traces from database
      // For now, return placeholder
      res.json({
        conversationId,
        trace: [],
        message: "Workflow trace storage to be implemented",
      });
    } catch (error) {
      console.error("Get workflow trace error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Process workflow synchronously (for testing)
   */
  async processWorkflowSync(req, res) {
    try {
      const { conversationId, message, customerId, employerId, channel } = req.body;

      const initialState = new AgentState({
        conversationId,
        customerId,
        employerId,
        incomingMessage: message,
        channel: channel || "support",
      });

      // Create and run graph
      const graph = createAgentGraph();
      const result = await graph.invoke(initialState);

      // Emit final response via Socket.IO
      if (result.finalResponse) {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit("ai:response_generated", {
          conversationId,
          draft: result.finalResponse,
          confidence: result.confidenceScore,
        });
      }

      res.json({
        success: true,
        result: result.toJSON(),
      });
    } catch (error) {
      console.error("Process workflow sync error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AgentWorkflowController();
