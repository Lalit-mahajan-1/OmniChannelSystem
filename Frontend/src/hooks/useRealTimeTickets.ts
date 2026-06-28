import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

interface Ticket {
  _id: string;
  conversationId: string;
  customerId: string;
  status: string;
  priority: string;
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export function useRealTimeTickets(employerId: string) {
  const { socket, isConnected } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join employer room for ticket updates
    socket.emit("agent:join_room", { employerId });

    const handleTicketCreated = (data: { ticket: Ticket }) => {
      setTickets((prev) => [data.ticket, ...prev]);
    };

    const handleTicketUpdated = (data: { ticketId: string; changes: any }) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticketId ? { ...t, ...data.changes } : t))
      );
    };

    const handleTicketAssigned = (data: { ticketId: string; agentId: string }) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticketId ? { ...t, assignedAgent: data.agentId } : t))
      );
    };

    const handleTicketResolved = (data: { ticketId: string }) => {
      setTickets((prev) => prev.map((t) => (t._id === data.ticketId ? { ...t, status: "resolved" } : t)));
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:assigned", handleTicketAssigned);
    socket.on("ticket:resolved", handleTicketResolved);

    // Fetch initial tickets
    fetch(`/api/tickets?employerId=${employerId}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.tickets || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tickets:", err);
        setLoading(false);
      });

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:assigned", handleTicketAssigned);
      socket.off("ticket:resolved", handleTicketResolved);
    };
  }, [socket, isConnected, employerId]);

  const openTickets = tickets.filter((t) => t.status === "open");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");

  return {
    tickets,
    openTickets,
    resolvedTickets,
    loading,
  };
}
