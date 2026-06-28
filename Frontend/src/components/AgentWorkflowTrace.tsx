import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

interface AgentStep {
  agentName: string;
  step: string;
  status: "success" | "error" | "running" | "pending";
  output?: any;
  duration?: number;
  timestamp: Date;
}

interface AgentWorkflowTraceProps {
  trace: AgentStep[];
}

export function AgentWorkflowTrace({ trace }: AgentWorkflowTraceProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Agent Workflow Trace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trace.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${getStatusColor(step.status)} flex items-center justify-center text-white`}>
                  {getStatusIcon(step.status)}
                </div>
                {index < trace.length - 1 && (
                  <div className="w-0.5 h-8 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.agentName}</span>
                  <Badge variant="outline" className="text-xs">
                    {step.step}
                  </Badge>
                  {step.duration && (
                    <span className="text-xs text-muted-foreground">
                      {step.duration}ms
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {step.output && typeof step.output === "string"
                    ? step.output
                    : JSON.stringify(step.output)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
