import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentWorkflowTrace } from "@/components/AgentWorkflowTrace";
import { Play, Brain } from "lucide-react";

export function AgentWorkflowPage() {
  const [conversationId, setConversationId] = useState("");
  const [message, setMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [employerId, setEmployerId] = useState("");
  const [trace, setTrace] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleTriggerWorkflow = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/agents/workflow/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message,
          customerId,
          employerId,
          channel: "support",
        }),
      });
      const data = await res.json();
      console.log("Workflow triggered:", data);
    } catch (error) {
      console.error("Trigger workflow error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSyncWorkflow = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/agents/workflow/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message,
          customerId,
          employerId,
          channel: "support",
        }),
      });
      const data = await res.json();
      setTrace(data.result?.agentTrace || []);
    } catch (error) {
      console.error("Sync workflow error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agent Workflow</h1>
        <p className="text-muted-foreground">Trigger and monitor multi-agent AI workflows</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Trigger Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conversationId">Conversation ID</Label>
                <Input
                  id="conversationId"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerId">Customer ID</Label>
                <Input
                  id="customerId"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="employerId">Employer ID</Label>
                <Input
                  id="employerId"
                  value={employerId}
                  onChange={(e) => setEmployerId(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTriggerWorkflow} disabled={isRunning}>
                <Play className="h-4 w-4 mr-2" />
                Trigger Async
              </Button>
              <Button onClick={handleSyncWorkflow} disabled={isRunning} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Run Sync
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {trace.length > 0 && <AgentWorkflowTrace trace={trace} />}
    </div>
  );
}
