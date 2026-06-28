import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface AgentPresenceProps {
  status: "online" | "offline" | "busy" | "away";
  name: string;
  currentTickets?: number;
  capacity?: number;
}

export function AgentPresence({ status, name, currentTickets = 0, capacity = 5 }: AgentPresenceProps) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "away":
        return "bg-orange-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "busy":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "away":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const utilization = capacity > 0 ? (currentTickets / capacity) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
          <span>
            {currentTickets}/{capacity} tickets
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
