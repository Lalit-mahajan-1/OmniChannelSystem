const AgentPresence = require("../../models/AgentPresence");

class TicketHandlers {
  constructor(io) {
    this.io = io;
  }

  /**
   * Handle agent joining a conversation room
   */
  async joinConversationRoom(socket, data) {
    try {
      const { conversationId } = data;
      const roomName = `conversation:${conversationId}`;

      socket.join(roomName);

      // Notify others in the room
      socket.to(roomName).emit("agent:joined_room", {
        conversationId,
        agentId: socket.user.id,
        agentName: socket.user.email,
      });

      console.log(`Agent ${socket.user.id} joined room ${roomName}`);
    } catch (error) {
      console.error("Join conversation room error:", error);
      socket.emit("error", { message: "Failed to join conversation room" });
    }
  }

  /**
   * Handle agent leaving a conversation room
   */
  async leaveConversationRoom(socket, data) {
    try {
      const { conversationId } = data;
      const roomName = `conversation:${conversationId}`;

      socket.leave(roomName);

      // Notify others in the room
      socket.to(roomName).emit("agent:left_room", {
        conversationId,
        agentId: socket.user.id,
      });

      console.log(`Agent ${socket.user.id} left room ${roomName}`);
    } catch (error) {
      console.error("Leave conversation room error:", error);
    }
  }

  /**
   * Handle agent typing start
   */
  async typingStart(socket, data) {
    try {
      const { conversationId } = data;
      const roomName = `conversation:${conversationId}`;

      socket.to(roomName).emit("agent:typing", {
        conversationId,
        agentId: socket.user.id,
        agentName: socket.user.email,
      });
    } catch (error) {
      console.error("Typing start error:", error);
    }
  }

  /**
   * Handle agent typing stop
   */
  async typingStop(socket, data) {
    try {
      const { conversationId } = data;
      const roomName = `conversation:${conversationId}`;

      socket.to(roomName).emit("agent:typing_stop", {
        conversationId,
        agentId: socket.user.id,
      });
    } catch (error) {
      console.error("Typing stop error:", error);
    }
  }

  /**
   * Emit ticket created event
   */
  emitTicketCreated(ticket, customer) {
    const employerRoom = `employer:${ticket.employerId}`;
    this.io.to(employerRoom).emit("ticket:created", {
      ticket,
      customer,
    });
  }

  /**
   * Emit ticket updated event
   */
  emitTicketUpdated(ticketId, changes) {
    const employerRoom = `employer:${ticket.employerId}`;
    this.io.to(employerRoom).emit("ticket:updated", {
      ticketId,
      changes,
    });
  }

  /**
   * Emit ticket assigned event
   */
  emitTicketAssigned(ticketId, agentId, agentName) {
    const agentRoom = `agent:${agentId}`;
    const employerRoom = `employer:${ticket.employerId}`;

    this.io.to(agentRoom).emit("ticket:assigned", {
      ticketId,
      agentId,
      agentName,
    });

    this.io.to(employerRoom).emit("ticket:assigned", {
      ticketId,
      agentId,
      agentName,
    });
  }

  /**
   * Emit ticket resolved event
   */
  emitTicketResolved(ticketId, resolvedBy, resolutionTime) {
    const employerRoom = `employer:${ticket.employerId}`;
    this.io.to(employerRoom).emit("ticket:resolved", {
      ticketId,
      resolvedBy,
      resolutionTime,
    });
  }
}

module.exports = TicketHandlers;
