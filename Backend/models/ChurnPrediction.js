const mongoose = require("mongoose");

const ChurnPredictionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    predictedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    churnProbability: {
      type: Number,
      required: true,
      min: 0.0,
      max: 1.0,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      index: true,
    },
    features: {
      avgSentimentScore: {
        type: Number,
        min: -1.0,
        max: 1.0,
      },
      ticketVolume30d: {
        type: Number,
        min: 0,
      },
      ticketVolumeTrend: {
        type: Number,
        comment: "Slope - positive means increasing volume (bad)",
      },
      escalationCount: {
        type: Number,
        min: 0,
      },
      avgResponseDelayHours: {
        type: Number,
        min: 0,
      },
      unresolvedTicketCount: {
        type: Number,
        min: 0,
      },
      negativeInteractionRatio: {
        type: Number,
        min: 0,
        max: 1,
      },
      daysSinceLastPositive: {
        type: Number,
        min: 0,
      },
      healthScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      channelDiversity: {
        type: Number,
        min: 1,
        comment: "Number of different channels used",
      },
    },
    recommendations: [
      {
        type: String,
        trim: true,
      },
    ],
    modelVersion: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    actionTaken: {
      type: String,
      enum: ["none", "reached_out", "discount_offered", "escalated", "resolved"],
      default: "none",
    },
    actionTakenAt: Date,
    actionTakenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ChurnPredictionSchema.index({ employerId: 1, riskLevel: 1, predictedAt: -1 });
ChurnPredictionSchema.index({ employerId: 1, churnProbability: -1 });
ChurnPredictionSchema.index({ customerId: 1, predictedAt: -1 });

// TTL index - keep predictions for 90 days
ChurnPredictionSchema.index({ predictedAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("ChurnPrediction", ChurnPredictionSchema);
