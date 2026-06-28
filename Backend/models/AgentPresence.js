const mongoose = require("mongoose");

const AgentPresenceSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["online", "offline", "busy", "away"],
      default: "offline",
      index: true,
    },
    lastSeen: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    currentTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    capacity: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 20,
    },
    socketId: {
      type: String,
      sparse: true,
    },
    currentChannel: {
      type: String,
      enum: ["email", "whatsapp", "instagram", "support", "all"],
      default: "all",
    },
    specialization: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// Indexes for efficient queries
AgentPresenceSchema.index({ status: 1, lastSeen: -1 });
AgentPresenceSchema.index({ employerId: 1 });

// TTL index - auto-clean offline agents after 24 hours
AgentPresenceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("AgentPresence", AgentPresenceSchema);
