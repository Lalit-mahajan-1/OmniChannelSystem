class NotificationHandlers {
  constructor(io) {
    this.io = io;
  }

  /**
   * Emit new notification to specific agent
   */
  emitToAgent(agentId, notification) {
    const agentRoom = `agent:${agentId}`;
    this.io.to(agentRoom).emit("notification:new", { notification });
  }

  /**
   * Emit new notification to employer room
   */
  emitToEmployer(employerId, notification) {
    const employerRoom = `employer:${employerId}`;
    this.io.to(employerRoom).emit("notification:new", { notification });
  }

  /**
   * Emit SLA warning
   */
  emitSLAWarning(conversationId, minutesLeft, type) {
    this.io.to(`conversation:${conversationId}`).emit("sla:warning", {
      conversationId,
      minutesLeft,
      type,
    });
  }

  /**
   * Emit SLA breach
   */
  emitSLABreach(conversationId, breach) {
    this.io.to(`conversation:${conversationId}`).emit("sla:breached", {
      conversationId,
      breach,
    });
  }

  /**
   * Emit AI response generated
   */
  emitAIResponse(conversationId, draft, confidence) {
    this.io.to(`conversation:${conversationId}`).emit("ai:response_generated", {
      conversationId,
      draft,
      confidence,
    });
  }

  /**
   * Emit AI pipeline progress
   */
  emitAIPipelineProgress(conversationId, step, status) {
    this.io.to(`conversation:${conversationId}`).emit("ai:pipeline_progress", {
      conversationId,
      step,
      status,
    });
  }

  /**
   * Emit sentiment change
   */
  emitSentimentChange(customerId, from, to, score) {
    this.io.to(`customer:${customerId}`).emit("sentiment:changed", {
      customerId,
      from,
      to,
      score,
    });
  }

  /**
   * Emit customer reply
   */
  emitCustomerReply(conversationId, message) {
    this.io.to(`conversation:${conversationId}`).emit("customer:replied", {
      conversationId,
      message,
    });
  }

  /**
   * Emit dashboard metrics update
   */
  emitDashboardMetrics(employerId, metrics) {
    const employerRoom = `employer:${employerId}`;
    this.io.to(employerRoom).emit("dashboard:metrics_update", { metrics });
  }
}

module.exports = NotificationHandlers;
