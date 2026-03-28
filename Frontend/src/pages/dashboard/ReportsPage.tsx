import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart2,
  Users,
  CheckCircle,
  Sparkles,
  Download,
  X,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Bot,
  Mail,
  Smartphone,
  Loader2,
  RefreshCw,
  Shield,
  MessageSquare,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Trophy,
  Gauge,
  MessageCircle,
  Database,
} from "lucide-react";

const SENTIMENT_AGENT = import.meta.env.VITE_SENTIMENT_AGENT_URL || "http://localhost:5006";
const ANALYTICS_AGENT = import.meta.env.VITE_ANALYTICS_AGENT_URL || "http://localhost:5005";

// ── Mock fallback data ────────────────────────────────────────────────────────
const MOCK_REPORT = {
  generatedAt: new Date().toISOString(),
  overview: {
    totalCustomers: 142,
    resolutionRate: 87,
    resolved: 94,
    pending: 28,
    unresolved: 20,
    atRisk: 11,
    sentimentBreakdown: { positive: 68, neutral: 43, negative: 22, angry: 9 },
  },
  aiSummary: {
    executiveSummary:
      "Customer satisfaction is trending upward this week with an 87% resolution rate. AI agents handled 52% of all inbound queries autonomously. Key friction point remains payment processing delays — 18 open tickets. Immediate action recommended for 11 at-risk customers who have been waiting over 48 hours.",
    healthScore: 82,
    topConcern: "Payment processing delays",
    quickWin: "Enable auto-reply for billing category queries",
    weeklyTrend: "improving",
  },
  customers: [
    { customerId: "c1", name: "Priya Sharma", hasWhatsApp: true, totalEmails: 2, sentiment: "positive", resolutionStatus: "resolved", isAtRisk: false, sentimentScore: 0.8 },
    { customerId: "c2", name: "Rohit Verma", hasWhatsApp: false, totalEmails: 4, sentiment: "negative", resolutionStatus: "pending", isAtRisk: true, sentimentScore: -0.6 },
    { customerId: "c3", name: "Anjali Singh", hasWhatsApp: true, totalEmails: 1, sentiment: "angry", resolutionStatus: "unresolved", isAtRisk: true, sentimentScore: -1.8 },
    { customerId: "c4", name: "Vikram Nair", hasWhatsApp: true, totalEmails: 5, sentiment: "neutral", resolutionStatus: "resolved", isAtRisk: false, sentimentScore: 0.1 },
  ],
};

const MOCK_RESOLUTION = {
  success: true,
  data: { total: 168, resolved: 124, pending: 28, unresolved: 16, aiHandled: 87, resolutionRate: 74, aiRate: 52 },
};

const MOCK_CUSTOMER_DETAIL = {
  sentiment: { overall: "negative", score: -0.6, trend: "improving", breakdown: { angry: 1, negative: 3, neutral: 2, positive: 1 } },
  resolution: { status: "pending", responseTimeMin: 22, totalMessages: 7, inboundCount: 4, outboundCount: 3, channelsUsed: ["email"] },
  aiAnalysis: {
    mainQuery: "Refund not received after 7 business days",
    queryCategory: "billing",
    customerFrustrationLevel: "high",
    resolutionQuality: "poor",
    keyIssues: ["Refund delayed beyond SLA", "No proactive communication", "Agent did not escalate on time"],
    whatWentWell: "Initial response was within SLA of 2 hours",
    whatCouldImprove: "Escalation to billing team should have happened on day 3",
    recommendedNextAction: "Immediately escalate to billing department and send proactive SMS update to customer",
  },
  timeline: [
    { direction: "inbound", channel: "email", content: "I submitted a refund request 7 days ago. Still nothing.", sentiment: "negative" },
    { direction: "outbound", channel: "email", content: "We apologize for the delay. We are looking into this.", sentiment: "neutral" },
    { direction: "inbound", channel: "email", content: "This is unacceptable. I need this resolved today.", sentiment: "angry" },
    { direction: "outbound", channel: "email", content: "Your case has been escalated to our billing department.", sentiment: "neutral" },
  ],
};

const sentimentColor: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#94a3b8",
  negative: "#f97316",
  angry: "#ef4444",
};

const sentimentBg: Record<string, string> = {
  positive: "rgba(34,197,94,0.1)",
  neutral: "rgba(148,163,184,0.08)",
  negative: "rgba(249,115,22,0.1)",
  angry: "rgba(239,68,68,0.1)",
};

const resolutionColor: Record<string, string> = {
  resolved: "#22c55e",
  pending: "#eab308",
  unresolved: "#ef4444",
};

function initials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function formatMs(ms?: number) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function agentLabel(name?: string | null) {
  if (name === "gmail") return "Gmail Agent";
  if (name === "whatsapp") return "WhatsApp Agent";
  return "—";
}

function parseExecutiveSummary(aiSummary: any) {
  if (!aiSummary) {
    return {
      executiveSummary: "",
      healthScore: 0,
      topConcern: "—",
      quickWin: "—",
      weeklyTrend: "stable",
    };
  }

  if (typeof aiSummary.executiveSummary !== "string") {
    return {
      executiveSummary: "",
      healthScore: aiSummary.healthScore || 0,
      topConcern: aiSummary.topConcern || "—",
      quickWin: aiSummary.quickWin || "—",
      weeklyTrend: aiSummary.weeklyTrend || "stable",
    };
  }

  const raw = aiSummary.executiveSummary;
  const jsonStart = raw.indexOf("{");

  if (jsonStart === -1) {
    return {
      executiveSummary: raw,
      healthScore: aiSummary.healthScore || 0,
      topConcern: aiSummary.topConcern || "—",
      quickWin: aiSummary.quickWin || "—",
      weeklyTrend: aiSummary.weeklyTrend || "stable",
    };
  }

  const textPart = raw.slice(0, jsonStart).trim();
  const jsonPart = raw.slice(jsonStart).trim();

  try {
    const parsed = JSON.parse(jsonPart);
    return {
      executiveSummary: textPart || parsed.executiveSummary || raw,
      healthScore: aiSummary.healthScore || parsed.healthScore || 0,
      topConcern: aiSummary.topConcern || parsed.topConcern || "—",
      quickWin: aiSummary.quickWin || parsed.quickWin || "—",
      weeklyTrend: aiSummary.weeklyTrend || parsed.weeklyTrend || "stable",
    };
  } catch {
    return {
      executiveSummary: raw,
      healthScore: aiSummary.healthScore || 0,
      topConcern: aiSummary.topConcern || "—",
      quickWin: aiSummary.quickWin || "—",
      weeklyTrend: aiSummary.weeklyTrend || "stable",
    };
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveUpdates, setLiveUpdates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [loadingReport, setLoadingReport] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [reportData, setReportData] = useState<any>(null);
  const [resolutionData, setResolutionData] = useState<any>(null);

  const [metricsData, setMetricsData] = useState<any>(null);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [logsData, setLogsData] = useState<any[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterResolution, setFilterResolution] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const safeGet = async (url: string) => {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchReport = async () => {
    const res = await safeGet(`${SENTIMENT_AGENT}/sentiment-agent/full-report`);
    setReportData(res || MOCK_REPORT);
  };

  const fetchResolution = async () => {
    const res = await safeGet(`${SENTIMENT_AGENT}/sentiment-agent/resolution-stats`);
    setResolutionData(res?.data || MOCK_RESOLUTION.data);
  };

  const fetchAnalytics = async () => {
    const [metrics, recommendations, channels, alerts, performance, logs] = await Promise.all([
      safeGet(`${ANALYTICS_AGENT}/analytics-agent/metrics`),
      safeGet(`${ANALYTICS_AGENT}/analytics-agent/recommendations`),
      safeGet(`${ANALYTICS_AGENT}/analytics-agent/channel-breakdown`),
      safeGet(`${ANALYTICS_AGENT}/analytics-agent/alerts`),
      safeGet(`${ANALYTICS_AGENT}/analytics-agent/agent-performance`),
      safeGet(`${ANALYTICS_AGENT}/analytics-agent/logs`),
    ]);

    setMetricsData(metrics?.data || null);
    setRecommendationsData(recommendations || null);
    setChannelData(channels?.data || null);
    setAlertsData(alerts?.data || []);
    setPerformanceData(performance?.data || null);
    setLogsData(logs?.data || []);
  };

  const fetchAll = async () => {
    setLoadingReport(true);
    await Promise.all([fetchReport(), fetchResolution(), fetchAnalytics()]);
    setLoadingReport(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!liveUpdates) return;
    const t = setInterval(() => {
      fetchAll();
    }, 60000);
    return () => clearInterval(t);
  }, [liveUpdates]);

  const handleGenerate = async () => {
    setGenerating(true);
    await fetchAll();
    setGenerating(false);
    toast.success("Detailed report generated from sentiment + analytics agents!");
  };

  const analyzeCustomer = async (c: any) => {
    setAnalyzingId(c.customerId);
    setSelectedCustomer(c);
    setTimelineOpen(false);

    try {
      const res = await axios.post(`${SENTIMENT_AGENT}/sentiment-agent/analyze-customer`, { customerId: c.customerId });
      setCustomerDetail(res.data);
    } catch {
      setCustomerDetail(MOCK_CUSTOMER_DETAIL);
    } finally {
      setAnalyzingId(null);
    }
  };

  const overview = reportData?.overview || MOCK_REPORT.overview;
  const aiSummaryRaw = reportData?.aiSummary || MOCK_REPORT.aiSummary;
  const aiSummary = parseExecutiveSummary(aiSummaryRaw);

  const allCustomers = reportData?.customers || MOCK_REPORT.customers;
  const res = resolutionData || MOCK_RESOLUTION.data;

  const gmailStats = performanceData?.agents?.find((a: any) => a.agentType === "gmail");
  const whatsappStats = performanceData?.agents?.find((a: any) => a.agentType === "whatsapp");

  let customers = [...allCustomers];
  if (searchQuery) customers = customers.filter((c: any) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  if (filterSentiment) customers = customers.filter((c: any) => c.sentiment === filterSentiment);
  if (filterResolution) customers = customers.filter((c: any) => c.resolutionStatus === filterResolution);

  customers.sort((a: any, b: any) => {
    if (sortBy === "sentiment") return (a.sentimentScore || 0) - (b.sentimentScore || 0);
    if (sortBy === "risk") return (b.isAtRisk ? 1 : 0) - (a.isAtRisk ? 1 : 0);
    if (sortBy === "resolution") return (a.resolutionStatus || "").localeCompare(b.resolutionStatus || "");
    return (a.name || "").localeCompare(b.name || "");
  });

  const healthScore = aiSummary.healthScore || 0;
  const healthColor = healthScore >= 70 ? "#22c55e" : healthScore >= 40 ? "#eab308" : "#ef4444";

  const totalRes = res.total || 1;
  const resPct = Math.round((res.resolved / totalRes) * 100);
  const penPct = Math.round((res.pending / totalRes) * 100);
  const unresPct = Math.max(0, 100 - resPct - penPct);

  const recommendationList = recommendationsData?.recommendations || [];
  const activeAlerts = alertsData || [];
  const recentLogs = (logsData || []).slice(0, 5);

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "customers", label: "Customers", icon: Users },
    { id: "resolution", label: "Resolution", icon: CheckCircle },
  ];

  const deepCustomerInsight = useMemo(() => {
    if (!selectedCustomer) return null;

    const riskReasons = [];
    if (selectedCustomer.isAtRisk) riskReasons.push("marked at-risk");
    if (selectedCustomer.sentiment === "negative" || selectedCustomer.sentiment === "angry") riskReasons.push("negative sentiment");
    if (selectedCustomer.resolutionStatus !== "resolved") riskReasons.push("unresolved status");

    return riskReasons.length ? riskReasons.join(", ") : "stable customer profile";
  }, [selectedCustomer]);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#0a0a0a", color: "#fff" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: "240px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 12px",
          background: "#0d0d0d",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "11px",
            borderRadius: "10px",
            background: "linear-gradient(135deg,#00ffcc,#a855f7)",
            color: "#000",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "0.06em",
            cursor: "pointer",
            border: "none",
            marginBottom: "20px",
            opacity: generating ? 0.7 : 1,
          }}
        >
          {generating ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Zap style={{ width: 14, height: 14 }} />}
          {generating ? "GENERATING..." : "GENERATE REPORT"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? "#00ffcc" : "rgba(255,255,255,0.4)",
                background: activeTab === t.id ? "rgba(0,255,204,0.07)" : "transparent",
                border: activeTab === t.id ? "1px solid rgba(0,255,204,0.15)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              <t.icon style={{ width: 15, height: 15 }} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "12px",
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "auto",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {[
            { label: "Customers", value: allCustomers.length, color: "#00ffcc" },
            { label: "Resolution Rate", value: `${overview.resolutionRate}%`, color: "#22c55e" },
            { label: "At-Risk", value: overview.atRisk, color: "#ef4444" },
            { label: "Alerts", value: activeAlerts.length, color: "#f97316" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "14px", color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Live updates</span>
          <div
            onClick={() => setLiveUpdates(!liveUpdates)}
            style={{
              width: 32,
              height: 18,
              borderRadius: 9,
              background: liveUpdates ? "rgba(0,255,204,0.4)" : "rgba(255,255,255,0.08)",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: liveUpdates ? 14 : 2,
                width: 14,
                height: 14,
                borderRadius: 7,
                background: liveUpdates ? "#00ffcc" : "rgba(255,255,255,0.3)",
                transition: "left 0.2s",
              }}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              {activeTab === "overview" ? "Executive Operations Report" : activeTab === "customers" ? "Customer Intelligence" : "Resolution & Automation"}
            </h1>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: "5px", fontFamily: "monospace" }}>
              <Activity style={{ width: 11, height: 11 }} /> Updated {timeAgo(lastUpdated)}
              {liveUpdates && (
                <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                  LIVE
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleGenerate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
            </button>

            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(0,255,204,0.08)",
                border: "1px solid rgba(0,255,204,0.2)",
                color: "#00ffcc",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <Download style={{ width: 13, height: 13 }} /> Export PDF
            </button>
          </div>
        </div>

        {loadingReport ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
            <Loader2 style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: "#00ffcc" }} />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 80, height: 80, position: "relative", marginBottom: 10 }}>
                      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke={healthColor}
                          strokeWidth="6"
                          strokeDasharray={213.6}
                          strokeDashoffset={213.6 - (213.6 * healthScore) / 100}
                          strokeLinecap="round"
                          style={{ filter: `drop-shadow(0 0 8px ${healthColor}60)` }}
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: 700, fontSize: "22px", color: healthColor }}>
                        {healthScore}
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                      Health Score
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <ArrowUpRight style={{ width: 16, height: 16, color: "#22c55e" }} />
                      <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>
                        {metricsData?.rates?.emailResolutionRate ?? overview.resolutionRate}% resolved
                      </span>
                    </div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "48px", color: "#22c55e", lineHeight: 1, letterSpacing: "-0.03em" }}>
                      {overview.resolutionRate}%
                    </div>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", fontWeight: 600, marginTop: 8 }}>
                      Resolution Rate
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      background: "rgba(239,68,68,0.04)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderLeft: "3px solid #ef4444",
                      borderRadius: "14px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertTriangle style={{ width: 20, height: 20, color: "#ef4444", marginBottom: 10 }} />
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "52px", color: "#ef4444", lineHeight: 1 }}>{overview.atRisk}</div>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444", fontWeight: 600, marginTop: 8, opacity: 0.8 }}>
                      At-Risk Customers
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Bot style={{ width: 16, height: 16, color: "#a855f7" }} />
                      <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                        AI DIGEST
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                      "{aiSummary.executiveSummary}"
                    </p>
                  </motion.div>
                </div>

                {/* analytics deep cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "20px" }}>
                  <MiniInsightCard
                    title="Best Success Agent"
                    value={agentLabel(performanceData?.winner?.bySuccessRate)}
                    sub={whatsappStats?.successRate !== undefined || gmailStats?.successRate !== undefined ? `WA ${whatsappStats?.successRate ?? 0}% • Gmail ${gmailStats?.successRate ?? 0}%` : "No agent logs yet"}
                    color="#22c55e"
                    Icon={Trophy}
                  />
                  <MiniInsightCard
                    title="Fastest Agent"
                    value={agentLabel(performanceData?.winner?.bySpeed)}
                    sub={`WA ${formatMs(whatsappStats?.avgTotalLatencyMs)} • Gmail ${formatMs(gmailStats?.avgTotalLatencyMs)}`}
                    color="#60a5fa"
                    Icon={Gauge}
                  />
                  <MiniInsightCard
                    title="Unread WhatsApp"
                    value={`${metricsData?.summary?.unreadWhatsApp ?? 0}`}
                    sub={`${metricsData?.summary?.activeChats ?? 0} active chats`}
                    color="#22c55e"
                    Icon={MessageCircle}
                  />
                  <MiniInsightCard
                    title="Critical Complaints"
                    value={`${metricsData?.summary?.criticalComplaints ?? 0}`}
                    sub={`${activeAlerts.length} live alerts`}
                    color="#ef4444"
                    Icon={Shield}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600 }}>
                      <Sparkles style={{ width: 16, height: 16, color: "#00ffcc" }} /> AI Executive Summary
                    </div>
                    <span style={{ fontSize: "9px", background: "rgba(0,255,204,0.08)", color: "#00ffcc", border: "1px solid rgba(0,255,204,0.2)", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, letterSpacing: "0.08em" }}>
                      GENERATED NOW
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {aiSummary.weeklyTrend === "improving" ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
                      {aiSummary.weeklyTrend}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid rgba(234,179,8,0.2)", textTransform: "uppercase" }}>
                      ⚠ {aiSummary.topConcern}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)", textTransform: "uppercase" }}>
                      ⚡ {aiSummary.quickWin}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", textTransform: "uppercase" }}>
                      {activeAlerts.length} active alerts
                    </span>
                  </div>

                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, marginBottom: "18px" }}>
                    {aiSummary.executiveSummary}
                  </p>

                  {!!recommendationList.length && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
                      {recommendationList.slice(0, 4).map((r: any, i: number) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: r.priority === "high" ? "#ef4444" : r.priority === "medium" ? "#eab308" : "#22c55e", textTransform: "uppercase" }}>
                              {r.priority}
                            </span>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{r.category}</span>
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>{r.title}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{r.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px", color: "rgba(255,255,255,0.8)" }}>Sentiment Breakdown</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    {Object.entries(overview.sentimentBreakdown).map(([k, v]: [string, any]) => (
                      <div key={k} style={{ background: sentimentBg[k] || "rgba(255,255,255,0.04)", border: `1px solid ${sentimentColor[k]}30`, borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "28px", color: sentimentColor[k] }}>{v}</div>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: sentimentColor[k], opacity: 0.8, marginTop: 4, fontWeight: 600 }}>{k}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* alerts + logs + channel stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: 600 }}>
                      <AlertTriangle style={{ width: 15, height: 15, color: "#ef4444" }} />
                      Live Operational Alerts
                    </div>

                    {activeAlerts.length === 0 ? (
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>No active alerts.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {activeAlerts.slice(0, 4).map((a: any, i: number) => (
                          <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.12)", background: "rgba(239,68,68,0.04)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600 }}>{a.title}</span>
                              <span style={{ fontSize: "10px", color: a.severity === "critical" ? "#ef4444" : a.severity === "high" ? "#f97316" : "#60a5fa", textTransform: "uppercase", fontWeight: 700 }}>
                                {a.severity}
                              </span>
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{a.action}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: 600 }}>
                      <Database style={{ width: 15, height: 15, color: "#a855f7" }} />
                      Recent Agent Activity
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {recentLogs.length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>No analytics logs yet.</div>
                      ) : (
                        recentLogs.map((l: any, i: number) => (
                          <div key={i} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", color: l.agentType === "gmail" ? "#60a5fa" : "#22c55e", fontWeight: 700, textTransform: "uppercase" }}>
                                {l.agentType}
                              </span>
                              <span style={{ fontSize: "10px", color: l.status === "success" ? "#22c55e" : "#ef4444", textTransform: "uppercase" }}>
                                {l.status}
                              </span>
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>
                              {l.actionType} • {formatMs(l.totalLatencyMs)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <CustomerTable customers={customers} analyzingId={analyzingId} onAnalyze={analyzeCustomer} />
              </motion.div>
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === "customers" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                  {[
                    { value: filterSentiment, onChange: setFilterSentiment, options: ["", "positive", "neutral", "negative", "angry"], placeholder: "All Sentiments" },
                    { value: filterResolution, onChange: setFilterResolution, options: ["", "resolved", "pending", "unresolved"], placeholder: "All Statuses" },
                  ].map((s, i) => (
                    <select
                      key={i}
                      value={s.value}
                      onChange={(e) => s.onChange(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 12px", color: "rgba(255,255,255,0.7)", fontSize: "12px", outline: "none" }}
                    >
                      {s.options.map((o) => (
                        <option key={o} value={o}>
                          {o || s.placeholder}
                        </option>
                      ))}
                    </select>
                  ))}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 12px", color: "rgba(255,255,255,0.7)", fontSize: "12px", outline: "none", marginLeft: "auto" }}
                  >
                    <option value="name">Sort: Name</option>
                    <option value="sentiment">Sort: Sentiment</option>
                    <option value="resolution">Sort: Resolution</option>
                    <option value="risk">Sort: At-Risk First</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "20px" }}>
                  <MiniInsightCard title="Negative / Angry" value={`${customers.filter((c: any) => ["negative", "angry"].includes(c.sentiment)).length}`} sub="High friction customers" color="#ef4444" Icon={AlertTriangle} />
                  <MiniInsightCard title="Pending / Unresolved" value={`${customers.filter((c: any) => c.resolutionStatus !== "resolved").length}`} sub="Need follow-up" color="#eab308" Icon={Clock} />
                  <MiniInsightCard title="At-Risk Segment" value={`${customers.filter((c: any) => c.isAtRisk).length}`} sub="Priority outreach required" color="#f97316" Icon={Shield} />
                </div>

                <CustomerTable customers={customers} analyzingId={analyzingId} onAnalyze={analyzeCustomer} />
              </motion.div>
            )}

            {/* RESOLUTION TAB */}
            {activeTab === "resolution" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
                  {[
                    { label: "Total Cases", value: res.total, color: "#60a5fa", Icon: Mail },
                    { label: "Resolved", value: res.resolved, color: "#22c55e", Icon: CheckCircle },
                    { label: "Pending", value: res.pending, color: "#eab308", Icon: Clock },
                    { label: "Unresolved", value: res.unresolved, color: "#ef4444", Icon: AlertCircle },
                    { label: "AI Handled", value: res.aiHandled, color: "#a855f7", Icon: Bot },
                    { label: "AI Rate", value: `${res.aiRate}%`, color: "#a855f7", Icon: Zap },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px", position: "relative", overflow: "hidden" }}
                    >
                      <div style={{ position: "absolute", top: 16, right: 16, color: s.color, opacity: 0.5 }}>
                        <s.Icon style={{ width: 20, height: 20 }} />
                      </div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "36px", color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "16px" }}>Volume Distribution</div>
                    <div style={{ width: "100%", height: "14px", display: "flex", borderRadius: "7px", overflow: "hidden", background: "rgba(255,255,255,0.04)", marginBottom: "16px" }}>
                      <div style={{ width: `${resPct}%`, background: "#22c55e", transition: "width 0.8s ease" }} />
                      <div style={{ width: `${penPct}%`, background: "#eab308", transition: "width 0.8s ease" }} />
                      <div style={{ width: `${unresPct}%`, background: "#ef4444", transition: "width 0.8s ease" }} />
                    </div>
                    <div style={{ display: "flex", gap: "24px", justifyContent: "center" }}>
                      {[["#22c55e", "Resolved", `${resPct}%`], ["#eab308", "Pending", `${penPct}%`], ["#ef4444", "Unresolved", `${unresPct}%`]].map(([color, label, pct]) => (
                        <div key={label as string} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color as string }} />
                          <span style={{ fontFamily: "monospace", fontSize: "12px", color: color as string, fontWeight: 600 }}>
                            {label} {pct}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "16px" }}>Agent Automation Performance</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <PerfRow label="Gmail Success" value={`${gmailStats?.successRate ?? 0}%`} color="#60a5fa" />
                      <PerfRow label="WhatsApp Success" value={`${whatsappStats?.successRate ?? 0}%`} color="#22c55e" />
                      <PerfRow label="Gmail Avg Latency" value={formatMs(gmailStats?.avgTotalLatencyMs)} color="#60a5fa" />
                      <PerfRow label="WhatsApp Avg Latency" value={formatMs(whatsappStats?.avgTotalLatencyMs)} color="#22c55e" />
                      <PerfRow label="Winner" value={agentLabel(performanceData?.winner?.bySuccessRate)} color="#a855f7" />
                    </div>
                  </div>
                </div>

                {!!recommendationList.length && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "13px", fontWeight: 600 }}>
                      <Sparkles style={{ width: 15, height: 15, color: "#a855f7" }} />
                      Resolution Recommendations
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
                      {recommendationList.slice(0, 4).map((r: any, i: number) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: 6 }}>{r.title}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.55, marginBottom: 8 }}>{r.action}</div>
                          <div style={{ fontSize: "10px", color: "#a855f7", fontFamily: "monospace" }}>{r.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* CUSTOMER DRAWER */}
      <AnimatePresence>
        {selectedCustomer && customerDetail && (
          <motion.div
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            style={{ position: "fixed", top: 0, right: 0, height: "100%", width: "440px", background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.07)", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(0,0,0,0.6)" }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0,255,204,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: "#00ffcc" }}>
                  {initials(selectedCustomer.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px" }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{selectedCustomer.customerId}</div>
                </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerDetail(null); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <Section title="Risk Snapshot" icon={<Shield style={{ width: 13, height: 13 }} />} color="#ef4444">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    This customer is currently classified as:{" "}
                    <span style={{ color: selectedCustomer.isAtRisk ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
                      {selectedCustomer.isAtRisk ? "AT RISK" : "STABLE"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                    Signal drivers: {deepCustomerInsight}
                  </div>
                </div>
              </Section>

              <Section title="Sentiment Analysis" icon={<Activity style={{ width: 13, height: 13 }} />} color="#00ffcc">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "22px", color: sentimentColor[customerDetail.sentiment?.overall] || "#94a3b8" }}>
                    {customerDetail.sentiment?.overall?.toUpperCase() || "NEUTRAL"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>
                    {customerDetail.sentiment?.trend === "improving" ? <TrendingUp style={{ width: 13, height: 13 }} /> : <TrendingDown style={{ width: 13, height: 13, color: "#ef4444" }} />}
                    {customerDetail.sentiment?.trend || "stable"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {[
                    { k: "angry", label: "Angry", color: "#ef4444" },
                    { k: "negative", label: "Neg", color: "#f97316" },
                    { k: "neutral", label: "Neu", color: "#94a3b8" },
                    { k: "positive", label: "Pos", color: "#22c55e" },
                  ].map((s) => (
                    <div key={s.k} style={{ background: `${s.color}15`, border: `1px solid ${s.color}25`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "18px", color: s.color }}>{customerDetail.sentiment?.breakdown?.[s.k] || 0}</div>
                      <div style={{ fontSize: "9px", textTransform: "uppercase", color: s.color, opacity: 0.8, fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Resolution Status" icon={<CheckCircle style={{ width: 13, height: 13 }} />} color="#22c55e">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", background: `${resolutionColor[customerDetail.resolution?.status] || "#94a3b8"}15`, color: resolutionColor[customerDetail.resolution?.status] || "#94a3b8" }}>
                    {customerDetail.resolution?.status === "resolved" ? <CheckCircle style={{ width: 22, height: 22 }} /> : customerDetail.resolution?.status === "unresolved" ? <AlertCircle style={{ width: 22, height: 22 }} /> : <Clock style={{ width: 22, height: 22 }} />}
                  </div>
                  <div style={{ flex: 1, fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Status</span>
                      <span style={{ fontWeight: 600, color: resolutionColor[customerDetail.resolution?.status] || "#94a3b8", textTransform: "capitalize" }}>{customerDetail.resolution?.status || "pending"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Response time</span>
                      <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>{customerDetail.resolution?.responseTimeMin ? `${customerDetail.resolution.responseTimeMin} min` : "Pending"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Messages</span>
                      <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>{customerDetail.resolution?.totalMessages || 0} ({customerDetail.resolution?.inboundCount || 0}↓ / {customerDetail.resolution?.outboundCount || 0}↑)</span>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="AI Intelligence" icon={<Bot style={{ width: 13, height: 13 }} />} color="#a855f7">
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 4, fontWeight: 600 }}>Core Query</div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 12 }}>{customerDetail.aiAnalysis?.mainQuery || "General inquiry"}</div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "monospace", textTransform: "uppercase" }}>{customerDetail.aiAnalysis?.queryCategory}</span>
                  <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: 5, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "monospace", textTransform: "uppercase", fontWeight: 600 }}>
                    Frustration: {customerDetail.aiAnalysis?.customerFrustrationLevel}
                  </span>
                </div>

                {customerDetail.aiAnalysis?.keyIssues?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 6 }}>Key Issues</div>
                    <ul style={{ margin: 0, paddingLeft: 16, color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: 1.8 }}>
                      {customerDetail.aiAnalysis.keyIssues.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
                    </ul>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {customerDetail.aiAnalysis?.whatWentWell && (
                    <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)", padding: "10px 12px", borderRadius: 8, color: "#22c55e", fontSize: "12px", display: "flex", gap: 8 }}>
                      <CheckCircle style={{ width: 13, height: 13, marginTop: 2, flexShrink: 0 }} /> {customerDetail.aiAnalysis.whatWentWell}
                    </div>
                  )}
                  {customerDetail.aiAnalysis?.whatCouldImprove && (
                    <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.12)", padding: "10px 12px", borderRadius: 8, color: "#eab308", fontSize: "12px", display: "flex", gap: 8 }}>
                      <AlertTriangle style={{ width: 13, height: 13, marginTop: 2, flexShrink: 0 }} /> {customerDetail.aiAnalysis.whatCouldImprove}
                    </div>
                  )}
                </div>

                <div style={{ background: "rgba(0,255,204,0.04)", border: "1px solid rgba(0,255,204,0.15)", borderRadius: 8, padding: "14px" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#00ffcc", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Zap style={{ width: 11, height: 11 }} /> Recommended Action
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{customerDetail.aiAnalysis?.recommendedNextAction}</div>
                </div>
              </Section>

              {customerDetail.timeline?.length > 0 && (
                <Section title="Message Timeline" icon={<MessageSquare style={{ width: 13, height: 13 }} />} color="rgba(255,255,255,0.3)" collapsible open={timelineOpen} onToggle={() => setTimelineOpen(!timelineOpen)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {customerDetail.timeline.map((m: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: m.direction === "outbound" ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "85%", background: m.direction === "outbound" ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${m.direction === "outbound" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                            <span style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", color: m.channel === "whatsapp" ? "#22c55e" : "#60a5fa" }}>{m.channel}</span>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: sentimentColor[m.sentiment] || "#94a3b8" }} />
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{m.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// reusable mini insight card
function MiniInsightCard({ title, value, sub, color, Icon }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{title}</span>
        <Icon style={{ width: 15, height: 15, color }} />
      </div>
      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "20px", color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{sub}</div>
    </motion.div>
  );
}

function PerfRow({ label, value, color }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontFamily: "monospace", fontSize: "12px", color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Section({ title, icon, color, children, collapsible = false, open = true, onToggle }: any) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div onClick={collapsible ? onToggle : undefined} style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", cursor: collapsible ? "pointer" : "default", userSelect: "none" }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{title}</span>
        {collapsible && <span style={{ marginLeft: "auto", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{open ? "▾" : "▸"}</span>}
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px" }}>{(!collapsible || open) && children}</div>
    </div>
  );
}

function CustomerTable({ customers, analyzingId, onAnalyze }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 100px 110px 60px 70px 90px", padding: "10px 20px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>Customer</div><div>Channels</div><div style={{ textAlign: "center" }}>Sentiment</div><div style={{ textAlign: "center" }}>Resolution</div><div style={{ textAlign: "center" }}>Emails</div><div style={{ textAlign: "center" }}>Risk</div><div style={{ textAlign: "right" }}>Action</div>
      </div>
      {customers.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>No customers found.</div>
      ) : customers.map((c: any, i: number) => (
        <motion.div
          key={c.customerId || i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          style={{ display: "grid", gridTemplateColumns: "2fr 90px 100px 110px 60px 70px 90px", padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,255,204,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#00ffcc" }}>
              {initials(c.name)}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500 }}>{c.name}</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {c.hasWhatsApp && <Smartphone style={{ width: 13, height: 13, color: "#22c55e" }} />}
            {c.totalEmails > 0 && <Mail style={{ width: 13, height: 13, color: "#60a5fa" }} />}
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: 99, background: sentimentBg[c.sentiment] || "rgba(255,255,255,0.05)", color: sentimentColor[c.sentiment] || "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
              {c.sentiment || "neutral"}
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 700, color: resolutionColor[c.resolutionStatus] || "#94a3b8", textTransform: "uppercase" }}>
              {c.resolutionStatus || "pending"}
            </span>
          </div>
          <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{c.totalEmails || 0}</div>
          <div style={{ textAlign: "center" }}>
            {c.isAtRisk ? <AlertTriangle style={{ width: 14, height: 14, color: "#ef4444" }} /> : <CheckCircle style={{ width: 13, height: 13, color: "rgba(34,197,94,0.4)" }} />}
          </div>
          <div style={{ textAlign: "right" }}>
            <button
              onClick={() => onAnalyze(c)}
              disabled={analyzingId === c.customerId}
              style={{ fontSize: "10px", fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: "rgba(0,255,204,0.08)", color: "#00ffcc", border: "1px solid rgba(0,255,204,0.2)", cursor: "pointer", letterSpacing: "0.05em", opacity: analyzingId === c.customerId ? 0.5 : 1 }}
            >
              {analyzingId === c.customerId ? "..." : "ANALYZE"}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}