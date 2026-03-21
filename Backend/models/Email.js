const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      default: null,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },

    gmailId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    threadId: {
      type: String,
      index: true,
      required: true,
    },

    from: {
      type: String,
      trim: true,
      default: '',
    },

    fromEmail: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },

    to: {
      type: String,
      trim: true,
      default: '',
    },

    subject: {
      type: String,
      trim: true,
      default: '',
    },

    rawBody: {
      type: String,
      default: '',
    },

    body: {
      type: String,
      default: '',
    },

    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
      index: true,
    },

    aiReply: {
      type: String,
      default: null,
    },

    aiReplySent: {
      type: Boolean,
      default: false,
    },

    notes: [
      {
        note: { type: String, required: true, trim: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', default: null },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ['received', 'pending', 'assigned', 'replied', 'resolved', 'closed'],
      default: 'received',
      index: true,
    },

    emailDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

EmailSchema.index({ threadId: 1, emailDate: 1 });
EmailSchema.index({ customerId: 1, emailDate: -1 });
EmailSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Email', EmailSchema);