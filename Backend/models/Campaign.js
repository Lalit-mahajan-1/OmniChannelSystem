const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["Email", "WhatsApp", "SMS"],
      required: [true, "Campaign type is required"],
    },
    targetSegment: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Active", "Completed", "Rejected"],
      default: "Draft",
    },
    content: {
      type: String,
      required: [true, "Campaign content is required"],
    },
    scheduledAt: {
      type: Date,
    },
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", CampaignSchema);
