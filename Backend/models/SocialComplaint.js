const mongoose = require('mongoose');

const SocialComplaintSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['twitter', 'reddit', 'youtube', 'google_reviews', 'other'],
      required: true,
      index: true,
    },

    keyword: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    postId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    author: {
      type: String,
      trim: true,
      default: 'unknown',
    },

    authorProfileUrl: {
      type: String,
      trim: true,
      default: '',
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    postUrl: {
      type: String,
      trim: true,
      default: '',
    },

    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
      index: true,
    },

    isComplaint: {
      type: Boolean,
      default: false,
      index: true,
    },

    complaintStatus: {
      type: String,
      enum: ['new', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'new',
      index: true,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      default: null,
      index: true,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolutionNote: {
      type: String,
      trim: true,
      default: '',
    },

    internalNotes: [
      {
        note: { type: String, required: true, trim: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', default: null },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    scrapedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    sourceCreatedAt: {
      type: Date,
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

SocialComplaintSchema.index({ platform: 1, keyword: 1 });
SocialComplaintSchema.index({ complaintStatus: 1, assignedTo: 1 });
SocialComplaintSchema.index({ scrapedAt: -1 });

module.exports = mongoose.model('SocialComplaint', SocialComplaintSchema);