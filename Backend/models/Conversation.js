const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["email", "whatsapp", "instagram", "support", "internal"],
      index: true,
    },
    messages: [
      {
        messageId: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
          enum: ["customer", "agent", "ai", "system"],
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          sentiment: {
            type: String,
            enum: ["positive", "neutral", "negative"],
          },
          sentimentScore: {
            type: Number,
            min: -1.0,
            max: 1.0,
          },
          embeddingId: String,
          channel: String,
          agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employer",
          },
        },
      },
    ],
    summary: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["open", "resolved", "archived"],
      default: "open",
      index: true,
    },
    slaPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SLAPolicy",
    },
    firstResponseAt: Date,
    resolvedAt: Date,
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ConversationSchema.index({ customerId: 1, createdAt: -1 });
ConversationSchema.index({ channel: 1, status: 1 });
ConversationSchema.index({ employerId: 1, status: 1 });
ConversationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years TTL

module.exports = mongoose.model("Conversation", ConversationSchema);
