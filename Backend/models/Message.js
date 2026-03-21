const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    from: String,
    to: String,
    messageId: String,
    type: String,
    body: String,
    mediaId: String,
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'inbound',
    },
    status: {
      type: String,
      default: 'received',
    },
    whatsappTimestamp: Date,
    rawPayload: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);