const mongoose = require("mongoose");

const SLAPolicySchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    priority: {
      type: String,
      required: true,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["email", "whatsapp", "instagram", "support", "all"],
      default: "all",
    },
    firstResponseSLA: {
      type: Number,
      required: true,
      min: 1,
      comment: "Minutes to first response",
    },
    resolutionSLA: {
      type: Number,
      required: true,
      min: 1,
      comment: "Minutes to resolution",
    },
    escalationAfter: {
      type: Number,
      required: true,
      min: 1,
      comment: "Minutes before escalation",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
SLAPolicySchema.index({ employerId: 1, priority: 1, isActive: 1 });
SLAPolicySchema.index({ employerId: 1, channel: 1, isActive: 1 });

module.exports = mongoose.model("SLAPolicy", SLAPolicySchema);
