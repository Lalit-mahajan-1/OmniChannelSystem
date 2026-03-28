import mongoose from 'mongoose';

const AgentAnalyticsSchema = new mongoose.Schema(
  {
    agentType: {
      type: String,
      enum: ['gmail', 'whatsapp', 'analytics', 'omni', 'social', 'sentiment'],
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['auto_reply', 'auto_reply_all', 'manual_send', 'suggestion', 'poller_auto_reply'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      required: true,
      index: true,
    },

    employerId: {
      type: String,
      index: true,
    },
    customerId: {
      type: String,
      index: true,
    },
    emailId: {
      type: String,
      index: true,
    },
    chatId: {
      type: String,
      index: true,
    },
    threadId: {
      type: String,
      index: true,
    },

    channel: {
      type: String,
      enum: ['email', 'whatsapp'],
      index: true,
    },

    inboundMessage: {
      type: String,
      default: '',
    },
    aiReply: {
      type: String,
      default: '',
    },

    model: {
      type: String,
      default: 'llama-3.3-70b-versatile',
    },

    generationLatencyMs: {
      type: Number,
      default: 0,
    },
    sendLatencyMs: {
      type: Number,
      default: 0,
    },
    totalLatencyMs: {
      type: Number,
      default: 0,
    },

    messageLength: {
      type: Number,
      default: 0,
    },
    replyLength: {
      type: Number,
      default: 0,
    },

    autoReplyEnabled: {
      type: Boolean,
      default: null,
    },

    errorMessage: {
      type: String,
      default: '',
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const AgentAnalytics =
  mongoose.models.AgentAnalytics ||
  mongoose.model('AgentAnalytics', AgentAnalyticsSchema);

export default AgentAnalytics;