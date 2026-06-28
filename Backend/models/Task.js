const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ticketId: {
      type: String,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'twitter', 'reddit', 'social', 'unknown'],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    category: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Task', TaskSchema);
