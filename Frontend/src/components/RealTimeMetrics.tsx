import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";

interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  slaComplianceRate: number;
  onlineAgents: number;
}

export function RealTimeMetrics() {
  const { socket, isConnected } = useSocket();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
    slaComplianceRate: 0,
    onlineAgents: 0,
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMetricsUpdate = (data: { metrics: DashboardMetrics }) => {
      setMetrics(data.metrics);
    };

    socket.on("dashboard:metrics_update", handleMetricsUpdate);

    // Fetch initial metrics
    fetch("/api/dashboard/metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Failed to fetch metrics:", err));

    return () => {
      socket.off("dashboard:metrics_update", handleMetricsUpdate);
    };
  }, [socket, isConnected]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalTickets}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.openTickets}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.resolvedTickets}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(1)}m</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.slaComplianceRate.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Online Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.onlineAgents}</div>
        </CardContent>
      </Card>
    </div>
  );
}
