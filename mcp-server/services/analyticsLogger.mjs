import connectDB from '../config/db.mjs';
import AgentAnalytics from '../models/AgentAnalytics.mjs';

export const logAgentEvent = async (payload) => {
  try {
    await connectDB();

    const doc = await AgentAnalytics.create({
      agentType: payload.agentType,
      actionType: payload.actionType,
      status: payload.status,
      employerId: payload.employerId || '',
      customerId: payload.customerId || '',
      emailId: payload.emailId || '',
      chatId: payload.chatId || '',
      threadId: payload.threadId || '',
      channel: payload.channel || '',
      inboundMessage: payload.inboundMessage || '',
      aiReply: payload.aiReply || '',
      model: payload.model || 'llama-3.3-70b-versatile',
      generationLatencyMs: payload.generationLatencyMs || 0,
      sendLatencyMs: payload.sendLatencyMs || 0,
      totalLatencyMs: payload.totalLatencyMs || 0,
      messageLength: payload.messageLength || 0,
      replyLength: payload.replyLength || 0,
      autoReplyEnabled: payload.autoReplyEnabled ?? null,
      errorMessage: payload.errorMessage || '',
      metadata: payload.metadata || {},
    });

    return doc;
  } catch (err) {
    console.error('[AnalyticsLogger] Failed to save analytics:', err.message);
    return null;
  }
};