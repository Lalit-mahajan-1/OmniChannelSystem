const mongoose = require('mongoose');

const SocialComplaintSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['twitter', 'reddit'],
      required: true,
      index: true,
    },

    // The bank/brand being complained about
    keyword: {
      type: String,
      required: true,
      index: true,
    },

    // Post details
    postId:      { type: String, unique: true },
    author:      { type: String },
    content:     { type: String, required: true },
    postUrl:     { type: String },

    // Sentiment
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
    },

    // Is it a complaint?
    isComplaint: { type: Boolean, default: false },

    // Linked to a customer in our system
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    scrapedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialComplaint', SocialComplaintSchema);