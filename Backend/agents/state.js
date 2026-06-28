/**
 * Agent State Schema for LangGraph
 * Defines the state that flows through the multi-agent workflow
 */

class AgentState {
  constructor(data = {}) {
    // Input
    this.conversationId = data.conversationId || "";
    this.customerId = data.customerId || "";
    this.employerId = data.employerId || "";
    this.incomingMessage = data.incomingMessage || "";
    this.channel = data.channel || "support";

    // Intent Agent output
    this.intent = data.intent || "";
    this.urgencyLevel = data.urgencyLevel || "medium";
    this.subCategory = data.subCategory || "";
    this.actionRequired = data.actionRequired || false;

    // Sentiment Agent output
    this.sentiment = data.sentiment || "neutral";
    this.emotionTags = data.emotionTags || [];
    this.escalationRisk = data.escalationRisk || 0;

    // Context Agent output
    this.customerProfile = data.customerProfile || {};
    this.conversationHistory = data.conversationHistory || [];
    this.sentimentTrend = data.sentimentTrend || "stable";
    this.previousComplaints = data.previousComplaints || [];
    this.preferredChannel = data.preferredChannel || "";

    // Knowledge Agent output
    this.relevantArticles = data.relevantArticles || [];
    this.suggestedPolicies = data.suggestedPolicies || [];
    this.troubleshootingSteps = data.troubleshootingSteps || [];

    // Compliance Agent output
    this.complianceStatus = data.complianceStatus || "clear";
    this.complianceFlags = data.complianceFlags || [];
    this.gdprRestrictions = data.gdprRestrictions || [];

    // Response Agent output
    this.draftResponse = data.draftResponse || "";
    this.responseContext = data.responseContext || "";

    // Review Agent output
    this.confidenceScore = data.confidenceScore || 0;
    this.hallucinationRisk = data.hallucinationRisk || 0;
    this.complianceScore = data.complianceScore || 0;
    this.finalResponse = data.finalResponse || "";
    this.reviewNotes = data.reviewNotes || [];

    // Pipeline metadata
    this.pipelineStartedAt = data.pipelineStartedAt || new Date();
    this.errors = data.errors || [];
    this.agentTrace = data.agentTrace || [];
  }

  /**
   * Add a trace step for an agent
   */
  addTraceStep(agentName, step, status, output, duration) {
    this.agentTrace.push({
      agentName,
      step,
      status,
      output,
      duration,
      timestamp: new Date(),
    });
  }

  /**
   * Add an error
   */
  addError(error) {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
    });
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      conversationId: this.conversationId,
      customerId: this.customerId,
      employerId: this.employerId,
      incomingMessage: this.incomingMessage,
      channel: this.channel,
      intent: this.intent,
      urgencyLevel: this.urgencyLevel,
      subCategory: this.subCategory,
      actionRequired: this.actionRequired,
      sentiment: this.sentiment,
      emotionTags: this.emotionTags,
      escalationRisk: this.escalationRisk,
      customerProfile: this.customerProfile,
      conversationHistory: this.conversationHistory,
      sentimentTrend: this.sentimentTrend,
      previousComplaints: this.previousComplaints,
      preferredChannel: this.preferredChannel,
      relevantArticles: this.relevantArticles,
      suggestedPolicies: this.suggestedPolicies,
      troubleshootingSteps: this.troubleshootingSteps,
      complianceStatus: this.complianceStatus,
      complianceFlags: this.complianceFlags,
      gdprRestrictions: this.gdprRestrictions,
      draftResponse: this.draftResponse,
      responseContext: this.responseContext,
      confidenceScore: this.confidenceScore,
      hallucinationRisk: this.hallucinationRisk,
      complianceScore: this.complianceScore,
      finalResponse: this.finalResponse,
      reviewNotes: this.reviewNotes,
      pipelineStartedAt: this.pipelineStartedAt,
      errors: this.errors,
      agentTrace: this.agentTrace,
    };
  }
}

module.exports = AgentState;
