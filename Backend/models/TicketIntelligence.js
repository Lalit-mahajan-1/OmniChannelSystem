const mongoose = require('mongoose');

const TicketIntelligenceSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'twitter', 'reddit', 'social', 'unknown'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
      index: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['billing', 'technical', 'account', 'refund', 'shipping', 'feature-request', 'complaint', 'general'],
      required: true,
      index: true,
    },
    assignedTeam: {
      type: String,
      required: true,
      trim: true,
      default: 'Support Team',
    },
    suggestedAction: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.75,
    },
    escalationRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    sourceId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
  },
  { timestamps: true }
);

TicketIntelligenceSchema.index({ customerId: 1, createdAt: -1 });
TicketIntelligenceSchema.index({ ticketId: 1, channel: 1 }, { unique: false });

module.exports = mongoose.model('TicketIntelligence', TicketIntelligenceSchema);
