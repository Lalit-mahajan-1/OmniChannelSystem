const mongoose = require("mongoose");

const SLABreachSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
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
    breachType: {
      type: String,
      required: true,
      enum: ["first_response", "resolution"],
      index: true,
    },
    slaPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SLAPolicy",
      required: true,
    },
    breachedAt: {
      type: Date,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["warning", "breach", "critical"],
      index: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
    },
    notified: {
      type: Boolean,
      default: false,
    },
    resolvedAfterBreach: {
      type: Boolean,
      default: false,
    },
    resolutionDelay: {
      type: Number,
      comment: "Minutes after SLA deadline",
    },
    escalationTriggered: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
SLABreachSchema.index({ employerId: 1, breachedAt: -1 });
SLABreachSchema.index({ severity: 1, notified: 1 });
SLABreachSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

module.exports = mongoose.model("SLABreach", SLABreachSchema);
