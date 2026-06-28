import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

interface UseSocketEventsOptions {
  onTicketCreated?: (data: any) => void;
  onTicketUpdated?: (data: any) => void;
  onTicketAssigned?: (data: any) => void;
  onTicketResolved?: (data: any) => void;
  onCustomerReplied?: (data: any) => void;
  onAgentReplied?: (data: any) => void;
  onAIResponseGenerated?: (data: any) => void;
  onAIPipelineProgress?: (data: any) => void;
  onSLAWarning?: (data: any) => void;
  onSLABreached?: (data: any) => void;
  onAgentOnline?: (data: any) => void;
  onAgentOffline?: (data: any) => void;
  onAgentStatusChanged?: (data: any) => void;
  onNotificationNew?: (data: any) => void;
  onDashboardMetricsUpdate?: (data: any) => void;
}

export function useSocketEvents(options: UseSocketEventsOptions = {}) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlers: Record<string, (data: any) => void> = {};

    if (options.onTicketCreated) {
      handlers["ticket:created"] = options.onTicketCreated;
      socket.on("ticket:created", options.onTicketCreated);
    }

    if (options.onTicketUpdated) {
      handlers["ticket:updated"] = options.onTicketUpdated;
      socket.on("ticket:updated", options.onTicketUpdated);
    }

    if (options.onTicketAssigned) {
      handlers["ticket:assigned"] = options.onTicketAssigned;
      socket.on("ticket:assigned", options.onTicketAssigned);
    }

    if (options.onTicketResolved) {
      handlers["ticket:resolved"] = options.onTicketResolved;
      socket.on("ticket:resolved", options.onTicketResolved);
    }

    if (options.onCustomerReplied) {
      handlers["customer:replied"] = options.onCustomerReplied;
      socket.on("customer:replied", options.onCustomerReplied);
    }

    if (options.onAgentReplied) {
      handlers["agent:replied"] = options.onAgentReplied;
      socket.on("agent:replied", options.onAgentReplied);
    }

    if (options.onAIResponseGenerated) {
      handlers["ai:response_generated"] = options.onAIResponseGenerated;
      socket.on("ai:response_generated", options.onAIResponseGenerated);
    }

    if (options.onAIPipelineProgress) {
      handlers["ai:pipeline_progress"] = options.onAIPipelineProgress;
      socket.on("ai:pipeline_progress", options.onAIPipelineProgress);
    }

    if (options.onSLAWarning) {
      handlers["sla:warning"] = options.onSLAWarning;
      socket.on("sla:warning", options.onSLAWarning);
    }

    if (options.onSLABreached) {
      handlers["sla:breached"] = options.onSLABreached;
      socket.on("sla:breached", options.onSLABreached);
    }

    if (options.onAgentOnline) {
      handlers["agent:online"] = options.onAgentOnline;
      socket.on("agent:online", options.onAgentOnline);
    }

    if (options.onAgentOffline) {
      handlers["agent:offline"] = options.onAgentOffline;
      socket.on("agent:offline", options.onAgentOffline);
    }

    if (options.onAgentStatusChanged) {
      handlers["agent:status_changed"] = options.onAgentStatusChanged;
      socket.on("agent:status_changed", options.onAgentStatusChanged);
    }

    if (options.onNotificationNew) {
      handlers["notification:new"] = options.onNotificationNew;
      socket.on("notification:new", options.onNotificationNew);
    }

    if (options.onDashboardMetricsUpdate) {
      handlers["dashboard:metrics_update"] = options.onDashboardMetricsUpdate;
      socket.on("dashboard:metrics_update", options.onDashboardMetricsUpdate);
    }

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, isConnected, options]);

  return { socket, isConnected };
}
