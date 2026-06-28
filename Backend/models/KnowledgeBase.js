const mongoose = require("mongoose");

const KnowledgeBaseSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["faq", "policy", "product", "troubleshooting", "billing", "technical"],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    embeddingId: {
      type: String,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
KnowledgeBaseSchema.index({ employerId: 1, category: 1, isActive: 1 });
KnowledgeBaseSchema.index({ tags: 1 });

module.exports = mongoose.model("KnowledgeBase", KnowledgeBaseSchema);
