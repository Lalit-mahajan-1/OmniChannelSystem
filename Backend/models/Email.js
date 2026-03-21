const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema(
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
      default: null,
    },

    // Gmail identifiers
    gmailId:   { type: String, unique: true, required: true },
    threadId:  { type: String, index: true },

    // Email fields
    from:      { type: String },
    fromEmail: { type: String, index: true },
    to:        { type: String },
    subject:   { type: String },
    body:      { type: String },

    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },

    // AI generated reply (stored before sending)
    aiReply:   { type: String, default: null },
    aiReplySent: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['received', 'replied', 'pending'],
      default: 'received',
    },

    emailDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Email', EmailSchema);