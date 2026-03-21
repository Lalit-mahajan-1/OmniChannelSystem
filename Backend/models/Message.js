const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    from: { type: String, trim: true, default: '' },
    to: { type: String, trim: true, default: '' },

    messageId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    type: {
      type: String,
      default: 'text',
      trim: true,
    },

    body: {
      type: String,
      default: '',
      trim: true,
    },

    mediaId: {
      type: String,
      default: '',
      trim: true,
    },

    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['received', 'sent', 'delivered', 'read', 'failed'],
      default: 'received',
      index: true,
    },

    whatsappTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ employerId: 1, customerId: 1, whatsappTimestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);