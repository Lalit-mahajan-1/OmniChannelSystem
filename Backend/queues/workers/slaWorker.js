const Conversation = require("../../models/Conversation");
const SLABreach = require("../../models/SLABreach");
const SLAPolicy = require("../../models/SLAPolicy");
const slaRepository = require("../../repositories/slaRepository");
const { getIO } = require("../../socket");

async function slaProcessor(job) {
  try {
    // Find all open conversations without first response
    const now = new Date();
    const conversationsWithoutFirstResponse = await Conversation.find({
      status: "open",
      firstResponseAt: { $exists: false },
    }).populate("slaPolicy");

    // Check for first response SLA breaches
    for (const conv of conversationsWithoutFirstResponse) {
      if (!conv.slaPolicy) continue;

      const ageInMinutes = (now - conv.createdAt) / (1000 * 60);
      const slaMinutes = conv.slaPolicy.firstResponseSLA;
      const warningThreshold = slaMinutes * 0.8; // 80% of SLA

      if (ageInMinutes >= slaMinutes) {
        // Breach occurred
        const existingBreach = await SLABreach.findOne({
          conversationId: conv._id,
          breachType: "first_response",
          severity: "breach",
        });

        if (!existingBreach) {
          await slaRepository.createBreach({
            conversationId: conv._id,
            customerId: conv.customerId,
            employerId: conv.employerId,
            breachType: "first_response",
            slaPolicy: conv.slaPolicy._id,
            breachedAt: now,
            severity: "breach",
            assignedAgent: conv.assignedAgent,
          });

          // Emit breach notification
          const io = getIO();
          io.to(`conversation:${conv.conversationId}`).emit("sla:breached", {
            conversationId: conv.conversationId,
            breachType: "first_response",
            severity: "breach",
          });
        }
      } else if (ageInMinutes >= warningThreshold) {
        // Warning threshold reached
        const existingWarning = await SLABreach.findOne({
          conversationId: conv._id,
          breachType: "first_response",
          severity: "warning",
        });

        if (!existingWarning) {
          await slaRepository.createBreach({
            conversationId: conv._id,
            customerId: conv.customerId,
            employerId: conv.employerId,
            breachType: "first_response",
            slaPolicy: conv.slaPolicy._id,
            breachedAt: now,
            severity: "warning",
            assignedAgent: conv.assignedAgent,
          });

          // Emit warning notification
          const io = getIO();
          const minutesLeft = Math.ceil(slaMinutes - ageInMinutes);
          io.to(`conversation:${conv.conversationId}`).emit("sla:warning", {
            conversationId: conv.conversationId,
            minutesLeft,
            type: "first_response",
          });
        }
      }
    }

    // Check for resolution SLA breaches
    const openConversations = await Conversation.find({
      status: "open",
      firstResponseAt: { $exists: true },
    }).populate("slaPolicy");

    for (const conv of openConversations) {
      if (!conv.slaPolicy) continue;

      const ageInMinutes = (now - conv.createdAt) / (1000 * 60);
      const slaMinutes = conv.slaPolicy.resolutionSLA;
      const warningThreshold = slaMinutes * 0.8;

      if (ageInMinutes >= slaMinutes) {
        const existingBreach = await SLABreach.findOne({
          conversationId: conv._id,
          breachType: "resolution",
          severity: "breach",
        });

        if (!existingBreach) {
          await slaRepository.createBreach({
            conversationId: conv._id,
            customerId: conv.customerId,
            employerId: conv.employerId,
            breachType: "resolution",
            slaPolicy: conv.slaPolicy._id,
            breachedAt: now,
            severity: "breach",
            assignedAgent: conv.assignedAgent,
          });

          const io = getIO();
          io.to(`conversation:${conv.conversationId}`).emit("sla:breached", {
            conversationId: conv.conversationId,
            breachType: "resolution",
            severity: "breach",
          });
        }
      } else if (ageInMinutes >= warningThreshold) {
        const existingWarning = await SLABreach.findOne({
          conversationId: conv._id,
          breachType: "resolution",
          severity: "warning",
        });

        if (!existingWarning) {
          await slaRepository.createBreach({
            conversationId: conv._id,
            customerId: conv.customerId,
            employerId: conv.employerId,
            breachType: "resolution",
            slaPolicy: conv.slaPolicy._id,
            breachedAt: now,
            severity: "warning",
            assignedAgent: conv.assignedAgent,
          });

          const io = getIO();
          const minutesLeft = Math.ceil(slaMinutes - ageInMinutes);
          io.to(`conversation:${conv.conversationId}`).emit("sla:warning", {
            conversationId: conv.conversationId,
            minutesLeft,
            type: "resolution",
          });
        }
      }
    }

    return { processed: conversationsWithoutFirstResponse.length + openConversations.length };
  } catch (error) {
    console.error("SLA worker error:", error);
    throw error;
  }
}

module.exports = slaProcessor;
