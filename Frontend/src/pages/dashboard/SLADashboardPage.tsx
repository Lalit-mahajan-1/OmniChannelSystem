import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { SLATimer } from "@/components/SLATimer";

export function SLADashboardPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [breaches, setBreaches] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchPolicies();
    fetchBreaches();
    fetchMetrics();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/sla/policies");
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error("Fetch policies error:", error);
    }
  };

  const fetchBreaches = async () => {
    try {
      const res = await fetch("/api/sla/breaches");
      const data = await res.json();
      setBreaches(data.breaches || []);
    } catch (error) {
      console.error("Fetch breaches error:", error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/sla/metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error("Fetch metrics error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SLA Dashboard</h1>
        <p className="text-muted-foreground">Monitor service level agreements and compliance</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.complianceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Breaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{metrics.breachCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalConversations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policies.map((policy) => (
                <div key={policy._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-sm text-muted-foreground">
                      First Response: {policy.firstResponseSLA}m | Resolution: {policy.resolutionSLA}m
                    </div>
                  </div>
                  <Badge variant="outline">{policy.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breaches.slice(0, 5).map((breach) => (
                <div key={breach._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{breach.breachType}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(breach.breachedAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={breach.severity === "breach" ? "destructive" : "outline"}>
                    {breach.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
