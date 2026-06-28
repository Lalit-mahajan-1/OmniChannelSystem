import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";

interface SLATimerProps {
  slaDeadline: Date;
  type: "first_response" | "resolution";
  onWarning?: () => void;
  onBreach?: () => void;
}

export function SLATimer({ slaDeadline, type, onWarning, onBreach }: SLATimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [status, setStatus] = useState<"ok" | "warning" | "breached">("ok");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadline = new Date(slaDeadline);
      const diff = deadline.getTime() - now.getTime();
      const minutesLeft = diff / (1000 * 60);
      setTimeLeft(Math.max(0, minutesLeft));

      const warningThreshold = 20; // 20 minutes warning
      if (minutesLeft <= 0) {
        if (status !== "breached") {
          setStatus("breached");
          onBreach?.();
        }
      } else if (minutesLeft <= warningThreshold) {
        if (status !== "warning") {
          setStatus("warning");
          onWarning?.();
        }
      } else {
        setStatus("ok");
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [slaDeadline, status, onWarning, onBreach]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "ok":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "breached":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === "breached" ? (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          SLA Breached
        </Badge>
      ) : status === "warning" ? (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500">
          <Clock className="h-3 w-3" />
          {formatTime(timeLeft)} left
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(timeLeft)} left
        </Badge>
      )}
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
    </div>
  );
}
