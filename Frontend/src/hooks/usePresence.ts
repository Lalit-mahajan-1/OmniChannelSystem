import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

interface AgentPresence {
  agentId: string;
  name: string;
  status: "online" | "offline" | "busy" | "away";
  currentTickets: number;
  capacity: number;
}

export function usePresence(employerId: string) {
  const { socket, isConnected } = useSocket();
  const [agents, setAgents] = useState<AgentPresence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join employer room
    socket.emit("agent:join_room", { employerId });

    // Listen for presence updates
    const handlePresenceUpdate = (data: { agents: AgentPresence[] }) => {
      setAgents(data.agents);
      setLoading(false);
    };

    const handleAgentOnline = (data: { agentId: string; name: string }) => {
      setAgents((prev) => [
        ...prev.filter((a) => a.agentId !== data.agentId),
        { ...data, status: "online", currentTickets: 0, capacity: 5 },
      ]);
    };

    const handleAgentOffline = (data: { agentId: string }) => {
      setAgents((prev) => prev.filter((a) => a.agentId !== data.agentId));
    };

    const handleAgentStatusChanged = (data: { agentId: string; status: string }) => {
      setAgents((prev) =>
        prev.map((a) => (a.agentId === data.agentId ? { ...a, status: data.status as any } : a))
      );
    };

    socket.on("presence:update", handlePresenceUpdate);
    socket.on("agent:online", handleAgentOnline);
    socket.on("agent:offline", handleAgentOffline);
    socket.on("agent:status_changed", handleAgentStatusChanged);

    // Fetch initial presence
    fetch(`/api/agents/presence/online`)
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch presence:", err);
        setLoading(false);
      });

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("agent:online", handleAgentOnline);
      socket.off("agent:offline", handleAgentOffline);
      socket.off("agent:status_changed", handleAgentStatusChanged);
    };
  }, [socket, isConnected, employerId]);

  const onlineAgents = agents.filter((a) => a.status === "online" || a.status === "busy");
  const offlineAgents = agents.filter((a) => a.status === "offline");

  return {
    agents,
    onlineAgents,
    offlineAgents,
    loading,
  };
}
