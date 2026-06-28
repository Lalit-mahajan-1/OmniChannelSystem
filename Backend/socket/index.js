const { Server } = require("socket.io");
const socketAuth = require("./middleware/socketAuth");
const TicketHandlers = require("./handlers/ticketHandlers");
const AgentHandlers = require("./handlers/agentHandlers");
const NotificationHandlers = require("./handlers/notificationHandlers");

let io;

function initializeSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use(socketAuth);

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id} (User: ${socket.user.email})`);

    // Initialize handlers
    const ticketHandlers = new TicketHandlers(io);
    const agentHandlers = new AgentHandlers(io);
    const notificationHandlers = new NotificationHandlers(io);

    // Join agent's private room
    socket.join(`agent:${socket.user.id}`);

    // Join employer room
    socket.join(`employer:${socket.user.employerId}`);

    // Ticket handlers
    socket.on("agent:join_room", (data) => ticketHandlers.joinConversationRoom(socket, data));
    socket.on("agent:leave_room", (data) => ticketHandlers.leaveConversationRoom(socket, data));
    socket.on("agent:typing_start", (data) => ticketHandlers.typingStart(socket, data));
    socket.on("agent:typing_stop", (data) => ticketHandlers.typingStop(socket, data));

    // Agent handlers
    socket.on("agent:set_status", (data) => agentHandlers.setAgentStatus(socket, data));
    socket.on("agent:heartbeat", () => agentHandlers.agentHeartbeat(socket));

    // Disconnect handler
    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id} (User: ${socket.user.email})`);

      // Update agent presence to offline
      const AgentPresence = require("../models/AgentPresence");
      await AgentPresence.findOneAndUpdate(
        { agentId: socket.user.id },
        { status: "offline", lastSeen: new Date(), socketId: null }
      );

      // Notify employer room
      io.to(`employer:${socket.user.employerId}`).emit("agent:offline", {
        agentId: socket.user.id,
      });
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log("Socket.IO server initialized");
  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

module.exports = { initializeSocketIO, getIO };
