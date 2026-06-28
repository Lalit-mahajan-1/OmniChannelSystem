import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export function ChurnPredictionPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [riskFilter, setRiskFilter] = useState("all");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchPredictions();
    fetchStats();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await fetch(`/api/churn/predictions?riskLevel=${riskFilter === "all" ? "" : riskFilter}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error("Fetch predictions error:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/churn/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const handlePredict = async (customerId: string) => {
    try {
      await fetch(`/api/churn/predict/${customerId}`, { method: "POST" });
      fetchPredictions();
    } catch (error) {
      console.error("Predict error:", error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Churn Prediction</h1>
        <p className="text-muted-foreground">Monitor customer churn risk and take proactive action</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.byRiskLevel?.find((r: any) => r._id === "critical")?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats.byRiskLevel?.find((r: any) => r._id === "high")?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Probability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.byRiskLevel?.reduce((sum: number, r: any) => sum + r.avgProbability, 0) / stats.byRiskLevel?.length || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Customer Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {predictions.map((prediction) => (
              <div key={prediction._id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getRiskIcon(prediction.riskLevel)}
                    <span className="font-medium">{prediction.customerId?.name || prediction.customerId}</span>
                    <Badge variant="outline">{prediction.riskLevel}</Badge>
                    <Badge variant="secondary">{(prediction.churnProbability * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Predicted: {new Date(prediction.predictedAt).toLocaleString()}
                  </div>
                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="mt-2 text-sm">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {prediction.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {!prediction.actionTaken && (
                  <Button size="sm" onClick={() => handlePredict(prediction.customerId)}>
                    Take Action
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
