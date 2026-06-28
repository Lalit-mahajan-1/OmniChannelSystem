const { getIO } = require("../../socket");

async function notificationProcessor(job) {
  const { type, recipient, data } = job.data;

  try {
    const io = getIO();

    switch (type) {
      case "agent":
        // Send to specific agent
        io.to(`agent:${recipient}`).emit("notification:new", data);
        break;

      case "employer":
        // Send to all agents in employer
        io.to(`employer:${recipient}`).emit("notification:new", data);
        break;

      case "conversation":
        // Send to all in conversation room
        io.to(`conversation:${recipient}`).emit("notification:new", data);
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Notification worker error:", error);
    throw error;
  }
}

module.exports = notificationProcessor;
