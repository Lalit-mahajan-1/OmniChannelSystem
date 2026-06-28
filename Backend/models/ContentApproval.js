const mongoose = require("mongoose");

const ContentApprovalSchema = new mongoose.Schema(
  {
    relatedType: {
      type: String,
      enum: ["Campaign", "Message"],
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedType'
    },
    name: { type: String, default: "" },
    channel: {
      type: String,
      enum: ["whatsapp", "email", "sms", "voice"],
      default: "email",
    },
    submittedBy: { type: String, default: "" },
    risk: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
    },
    comments: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContentApproval", ContentApprovalSchema);
