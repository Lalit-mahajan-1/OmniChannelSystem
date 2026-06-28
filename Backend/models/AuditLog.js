const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      required: true,
      enum: ["employer", "customer", "ai", "system"],
      index: true,
    },
    actorEmail: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ["ticket", "customer", "conversation", "knowledge_base", "sla_policy", "employer", "audit"],
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      agentName: {
        type: String,
        comment: "For AI actions: intentAgent, sentimentAgent, etc.",
      },
      duration: {
        type: Number,
        comment: "Duration in milliseconds",
      },
      reason: String,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ employerId: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - auto-delete after 2 years
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
