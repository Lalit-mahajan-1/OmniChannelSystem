import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ShieldAlert,
  CheckCircle,
  Bot,
  User,
  AlertTriangle,
  Mail,
  MessageCircle,
  Globe,
  RefreshCw,
  Zap,
  Target,
  Users,
  BarChart2,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Trophy,
  Gauge,
  Sparkles,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const ANALYTICS_BASE = "http://localhost:5005";
const SENTIMENT_BASE = "http://localhost:5006";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Metrics {
  summary: {
    totalCustomers: number;
    activeChats: number;
    unrepliedEmails: number;
    unreadWhatsApp: number;
    atRiskCustomers: number;
    totalComplaints: number;
    unresolvedComplaints: number;
    criticalComplaints: number;
    totalEmails?: number;
  };
  rates: {
    emailResolutionRate: number;
    aiReplyRate: number;
    negativeRatio: number;
  };
  channels: {
    email: number;
    whatsapp: number;
    twitter: number;
    reddit: number;
    youtube: number;
    linkedin: number;
  };
  sentiment: { positive: number; neutral: number; negative: number };
  recentActivity: { emailsLast24h: number; whatsappLast24h: number };
  atRiskIds: string[];
  alerts: string[];
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  action: string;
  impact: string;
}

interface ChannelBreakdown {
  email: {
    total: number;
    replied: number;
    unreplied: number;
    aiReplied: number;
    resolutionRate: number;
  };
  whatsapp: {
    total: number;
    unread: number;
    active: number;
  };
  social: {
    total: number;
    complaints: number;
    resolved: number;
    critical: number;
    byPlatform: Record<string, number>;
  };
}

interface SentimentTrend {
  trend: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }>;
  overall: { positive: number; neutral: number; negative: number };
}

interface AlertItem {
  type: string;
  severity: "critical" | "high" | "medium";
  title: string;
  action: string;
  link: string;
}

interface AgentStat {
  agentType: "gmail" | "whatsapp";
  totalEvents: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  autoReplyCount: number;
  suggestionCount: number;
  manualSendCount: number;
  successRate: number;
  avgGenerationLatencyMs: number;
  avgSendLatencyMs: number;
  avgTotalLatencyMs: number;
}

interface AgentPerformance {
  agents: AgentStat[];
  winner: {
    bySuccessRate: "gmail" | "whatsapp" | null;
    bySpeed: "gmail" | "whatsapp" | null;
  };
}

interface AgentLog {
  _id: string;
  agentType: "gmail" | "whatsapp";
  actionType: string;
  status: "success" | "failed" | "skipped";
  channel: "email" | "whatsapp";
  customerId?: string;
  emailId?: string;
  chatId?: string;
  inboundMessage?: string;
  aiReply?: string;
  model?: string;
  generationLatencyMs?: number;
  sendLatencyMs?: number;
  totalLatencyMs?: number;
  createdAt: string;
  errorMessage?: string;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  alerts: string[];
  metrics: any;
  performance?: AgentPerformance;
}

interface ResolutionStats {
  total: number;
  resolved: number;
  pending: number;
  unresolved: number;
  aiHandled: number;
  resolutionRate: number;
  aiRate: number;
}

interface SentimentCustomer {
  customerId: string;
  name: string;
  sentiment: "positive" | "neutral" | "negative" | "angry";
  sentimentScore: number;
  resolutionStatus: "resolved" | "pending" | "unresolved";
  unrepliedEmails: number;
  totalEmails: number;
  hasWhatsApp: boolean;
  unreadWhatsApp: number;
  isAtRisk: boolean;
}

interface SentimentFullReport {
  generatedAt: string;
  overview: {
    totalCustomers: number;
    resolutionRate: number;
    resolved: number;
    pending: number;
    unresolved: number;
    atRisk: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
      angry: number;
    };
  };
  aiSummary: {
    executiveSummary: string;
    healthScore?: number;
    topConcern?: string;
    quickWin?: string;
    weeklyTrend?: string;
  };
  customers: SentimentCustomer[];
}

interface ParsedAiSummary {
  executiveSummary: string;
  healthScore: number | null;
  topConcern: string;
  quickWin: string;
  weeklyTrend: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    width: "100%",
    minHeight: "100%",
    background:
      "radial-gradient(ellipse at 0% 0%, rgba(62,207,106,0.06) 0%, transparent 40%), radial-gradient(ellipse at 100% 0%, rgba(96,165,250,0.07) 0%, transparent 40%), #020617",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    padding: "26px 32px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap" as const,
    gap: "16px",
    background: "rgba(2,6,23,0.82)",
    backdropFilter: "blur(14px)",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#3ECF6A",
    marginBottom: "4px",
  },
  title: {
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "28px",
    fontWeight: 700,
    color: "#F8FAFC",
    letterSpacing: "-0.02em",
  },
  toolbar: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" as const },
  refreshBtn: {
    height: "38px",
    width: "38px",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: "10px",
    background: "rgba(15,23,42,0.92)",
    color: "#94A3B8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  body: { padding: "22px 32px 36px", display: "flex", flexDirection: "column" as const, gap: "18px" },
  card: {
    background: "linear-gradient(160deg,rgba(15,23,42,0.90),rgba(2,6,23,0.95))",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.30)",
  },
  p: { padding: "20px" },
  sTitle: {
    margin: "0 0 4px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "16px",
    color: "#F8FAFC",
    letterSpacing: "-0.01em",
  },
  sDesc: {
    margin: "0 0 18px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "12px",
    color: "#64748B",
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#64748B",
  },
  bigNum: {
    margin: "8px 0 6px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: "36px",
    lineHeight: 1,
    color: "#F8FAFC",
    letterSpacing: "-0.02em",
  },
  badge: (color: string) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "99px",
    background: `${color}18`,
    border: `1px solid ${color}30`,
    color,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    fontWeight: 700,
  }),
};

const axisStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fill: "#475569",
  letterSpacing: "0.03em",
};

const grid = { stroke: "rgba(148,163,184,0.08)", strokeDasharray: "4 4" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...S.card, ...style }}>{children}</div>;
}

function Tip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(2,6,23,0.97)",
        border: "1px solid rgba(148,163,184,0.14)",
        borderRadius: "12px",
        padding: "10px 14px",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "12px",
        boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ color: "#94A3B8", marginBottom: "5px", fontWeight: 600 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            color: p.color || "#3ECF6A",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            gap: "14px",
            marginTop: i === 0 ? 0 : 3,
          }}
        >
          <span>{p.name}</span>
          <span>{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "80px" }}>
      <div
        style={{
          width: 28,
          height: 28,
          border: "2px solid rgba(62,207,106,0.2)",
          borderTopColor: "#3ECF6A",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

function AlertBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "#EF4444",
    high: "#F59E0B",
    medium: "#60A5FA",
  };
  const c = colors[severity] || "#94A3B8";
  return <span style={S.badge(c)}>{severity.toUpperCase()}</span>;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#3ECF6A",
  };
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[priority] || "#94A3B8",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function formatMs(ms?: number) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatAgentName(name?: string | null) {
  if (!name) return "—";
  if (name === "gmail") return "Gmail Agent";
  if (name === "whatsapp") return "WhatsApp Agent";
  return name;
}

function cleanExecutiveSummary(raw?: string): ParsedAiSummary {
  if (!raw) {
    return {
      executiveSummary: "No AI summary available.",
      healthScore: null,
      topConcern: "—",
      quickWin: "—",
      weeklyTrend: "—",
    };
  }

  const firstJsonIndex = raw.indexOf("{");
  if (firstJsonIndex === -1) {
    return {
      executiveSummary: raw.trim(),
      healthScore: null,
      topConcern: "—",
      quickWin: "—",
      weeklyTrend: "—",
    };
  }

  const plainText = raw.slice(0, firstJsonIndex).trim();
  const jsonPart = raw.slice(firstJsonIndex).trim();

  try {
    const parsed = JSON.parse(jsonPart);
    return {
      executiveSummary: plainText || parsed.executiveSummary || "No executive summary available.",
      healthScore: typeof parsed.healthScore === "number" ? parsed.healthScore : null,
      topConcern: parsed.topConcern || "—",
      quickWin: parsed.quickWin || "—",
      weeklyTrend: parsed.weeklyTrend || "—",
    };
  } catch {
    return {
      executiveSummary: raw.trim(),
      healthScore: null,
      topConcern: "—",
      quickWin: "—",
      weeklyTrend: "—",
    };
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [channels, setChannels] = useState<ChannelBreakdown | null>(null);
  const [sentimentTrend, setSentimentTrend] = useState<SentimentTrend | null>(null);
  const [alertsData, setAlertsData] = useState<AlertItem[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [resolutionStats, setResolutionStats] = useState<ResolutionStats | null>(null);
  const [fullReport, setFullReport] = useState<SentimentFullReport | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingSentimentTrend, setLoadingSentimentTrend] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingResolution, setLoadingResolution] = useState(true);
  const [loadingFullReport, setLoadingFullReport] = useState(true);

  const [tab, setTab] = useState<"overview" | "channels" | "sentiment" | "alerts" | "ai">("overview");
  const [spinning, setSpinning] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setSpinning(true);

    setLoadingMetrics(true);
    setLoadingRecs(true);
    setLoadingChannels(true);
    setLoadingSentimentTrend(true);
    setLoadingAlerts(true);
    setLoadingPerformance(true);
    setLoadingLogs(true);
    setLoadingResolution(true);
    setLoadingFullReport(true);

    const safe = async (url: string) => {
      try {
        const r = await fetch(url);
        return r.ok ? r.json() : null;
      } catch {
        return null;
      }
    };

    const [m, r, c, s, a, p, l, rs, fr] = await Promise.all([
      safe(`${ANALYTICS_BASE}/analytics-agent/metrics`),
      safe(`${ANALYTICS_BASE}/analytics-agent/recommendations`),
      safe(`${ANALYTICS_BASE}/analytics-agent/channel-breakdown`),
      safe(`${ANALYTICS_BASE}/analytics-agent/sentiment-trend`),
      safe(`${ANALYTICS_BASE}/analytics-agent/alerts`),
      safe(`${ANALYTICS_BASE}/analytics-agent/agent-performance`),
      safe(`${ANALYTICS_BASE}/analytics-agent/logs`),
      safe(`${SENTIMENT_BASE}/sentiment-agent/resolution-stats`),
      safe(`${SENTIMENT_BASE}/sentiment-agent/full-report`),
    ]);

    if (m?.success) setMetrics(m.data);
    setLoadingMetrics(false);

    if (r?.success) {
      setRecs({
        recommendations: r.recommendations || [],
        alerts: r.alerts || [],
        metrics: r.metrics || {},
        performance: r.performance || null,
      });
    }
    setLoadingRecs(false);

    if (c?.success) setChannels(c.data);
    setLoadingChannels(false);

    if (s?.success) setSentimentTrend(s.data);
    setLoadingSentimentTrend(false);

    if (a?.success) setAlertsData(a.data || []);
    setLoadingAlerts(false);

    if (p?.success) setAgentPerformance(p.data);
    setLoadingPerformance(false);

    if (l?.success) setLogs((l.data || []).slice(0, 12));
    setLoadingLogs(false);

    if (rs?.success) setResolutionStats(rs.data);
    setLoadingResolution(false);

    if (fr?.success) setFullReport(fr);
    setLoadingFullReport(false);

    setLastFetched(new Date());
    setTimeout(() => setSpinning(false), 600);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const parsedAiSummary = useMemo(() => cleanExecutiveSummary(fullReport?.aiSummary?.executiveSummary), [fullReport]);

  const channelPie = useMemo(() => {
    if (!channels) return [];
    const { email, whatsapp, social } = channels;
    return [
      { name: "Email", value: email.total, color: "#60A5FA" },
      { name: "WhatsApp", value: whatsapp.total, color: "#3ECF6A" },
      { name: "Twitter", value: social.byPlatform.twitter || 0, color: "#38BDF8" },
      { name: "Reddit", value: social.byPlatform.reddit || 0, color: "#F97316" },
      { name: "YouTube", value: social.byPlatform.youtube || 0, color: "#EF4444" },
      { name: "LinkedIn", value: social.byPlatform.linkedin || 0, color: "#818CF8" },
    ].filter((d) => d.value > 0);
  }, [channels]);

  const sentimentChart = useMemo(() => {
    if (!sentimentTrend) return [];
    return sentimentTrend.trend.map((d) => ({
      date: d.date.slice(5),
      Positive: d.positive,
      Neutral: d.neutral,
      Negative: d.negative,
      Total: d.total,
    }));
  }, [sentimentTrend]);

  const channelBar = useMemo(() => {
    if (!channels) return [];
    return [
      { name: "Email", Total: channels.email.total, Replied: channels.email.replied, "AI Replied": channels.email.aiReplied },
      { name: "WhatsApp", Total: channels.whatsapp.total, Active: channels.whatsapp.active, Unread: channels.whatsapp.unread },
      { name: "Social", Total: channels.social.total, Complaints: channels.social.complaints, Resolved: channels.social.resolved },
    ];
  }, [channels]);

  const gmailStats = useMemo(
    () => agentPerformance?.agents.find((a) => a.agentType === "gmail") || null,
    [agentPerformance]
  );

  const whatsappStats = useMemo(
    () => agentPerformance?.agents.find((a) => a.agentType === "whatsapp") || null,
    [agentPerformance]
  );

  const performanceRadar = useMemo(() => {
    if (!gmailStats || !whatsappStats) return [];
    return [
      { metric: "Success", Gmail: gmailStats.successRate, WhatsApp: whatsappStats.successRate },
      { metric: "Auto", Gmail: gmailStats.autoReplyCount, WhatsApp: whatsappStats.autoReplyCount },
      { metric: "Manual", Gmail: gmailStats.manualSendCount, WhatsApp: whatsappStats.manualSendCount },
      { metric: "Suggest", Gmail: gmailStats.suggestionCount, WhatsApp: whatsappStats.suggestionCount },
    ];
  }, [gmailStats, whatsappStats]);

  const tabs: { id: typeof tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart2 size={14} /> },
    { id: "channels", label: "Channels", icon: <Globe size={14} /> },
    { id: "sentiment", label: "Sentiment", icon: <Activity size={14} /> },
    { id: "alerts", label: "Alerts", icon: <AlertTriangle size={14} /> },
    { id: "ai", label: "AI Insights", icon: <Zap size={14} /> },
  ];

  return (
    <div style={S.page} className="analytics-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .analytics-root * { box-sizing: border-box; }
        .analytics-tab { transition: all 0.18s ease; }
        .analytics-tab:hover { color: #E2E8F0 !important; background: rgba(255,255,255,0.05) !important; }
        .analytics-tab.active { color: #3ECF6A !important; background: rgba(62,207,106,0.10) !important; border-color: rgba(62,207,106,0.24) !important; }
        .kpi-card { animation: fadeUp 0.4s ease both; }
        .rec-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .rec-card:hover { border-color: rgba(62,207,106,0.22) !important; box-shadow: 0 0 0 1px rgba(62,207,106,0.12), 0 18px 48px rgba(0,0,0,0.35) !important; transform: translateY(-2px); }
        .row-hover:hover { background: rgba(255,255,255,0.025) !important; }
        @media (max-width: 1280px) { .kpi-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 1000px) { .perf-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2,1fr) !important; } .main-row { grid-template-columns: 1fr !important; } .ai-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>● ConvoSphere · Complaint Intelligence</div>
          <h1 style={S.title}>Analytics Dashboard</h1>
          {lastFetched && (
            <div style={{ marginTop: "4px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#334155" }}>
              Last updated {lastFetched.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div style={S.toolbar}>
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: "12px",
              padding: "4px",
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`analytics-tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "#64748B",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {t.icon} {t.label}
                {t.id === "alerts" && alertsData.length > 0 && (
                  <span
                    style={{
                      background: "#EF4444",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      borderRadius: "99px",
                      padding: "1px 5px",
                      marginLeft: "2px",
                    }}
                  >
                    {alertsData.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button style={S.refreshBtn} onClick={fetchAll} title="Refresh all data">
            <RefreshCw size={14} style={{ transition: "transform 0.6s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }} />
          </button>
        </div>
      </div>

      <div style={S.body}>
        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "14px" }}>
              {[
                {
                  label: "Total Complaints",
                  value: loadingMetrics ? "—" : metrics?.summary.totalComplaints?.toLocaleString() ?? "—",
                  icon: <ShieldAlert size={15} color="#F59E0B" />,
                  meta: `${metrics?.summary.unresolvedComplaints ?? "—"} unresolved`,
                  metaColor: "#F59E0B",
                },
                {
                  label: "Critical Complaints",
                  value: loadingMetrics ? "—" : metrics?.summary.criticalComplaints ?? "—",
                  icon: <AlertTriangle size={15} color="#EF4444" />,
                  meta: "Need immediate action",
                  metaColor: "#EF4444",
                },
                {
                  label: "At-Risk Customers",
                  value: loadingMetrics ? "—" : metrics?.summary.atRiskCustomers ?? "—",
                  icon: <Users size={15} color="#F97316" />,
                  meta: "No reply 48h+",
                  metaColor: "#F97316",
                },
                {
                  label: "AI Reply Rate",
                  value: loadingMetrics ? "—" : `${metrics?.rates.aiReplyRate ?? "—"}%`,
                  icon: <Bot size={15} color="#A78BFA" />,
                  meta: "Email automation",
                  metaColor: "#A78BFA",
                },
                {
                  label: "Email Resolution",
                  value: loadingMetrics ? "—" : `${metrics?.rates.emailResolutionRate ?? "—"}%`,
                  icon: <Mail size={15} color="#60A5FA" />,
                  meta: `${metrics?.summary.unrepliedEmails ?? "—"} unreplied`,
                  metaColor: "#60A5FA",
                },
                {
                  label: "WhatsApp Unread",
                  value: loadingMetrics ? "—" : metrics?.summary.unreadWhatsApp ?? "—",
                  icon: <MessageCircle size={15} color="#3ECF6A" />,
                  meta: `${metrics?.summary.activeChats ?? "—"} active`,
                  metaColor: "#3ECF6A",
                },
              ].map((k, i) => (
                <div key={i} className="kpi-card">
                  <Card style={{ ...S.p }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={S.label}>{k.label}</div>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(148,163,184,0.10)",
                          flexShrink: 0,
                        }}
                      >
                        {k.icon}
                      </div>
                    </div>
                    <div style={S.bigNum}>{loadingMetrics ? <Spinner /> : k.value}</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px",
                        color: k.metaColor,
                        fontWeight: 700,
                        marginTop: "4px",
                      }}
                    >
                      {k.meta}
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <div className="perf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
              <Card style={S.p}>
                <div style={S.label}>Best Agent by Success Rate</div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Trophy size={18} color="#F59E0B" />
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "22px", fontWeight: 800, color: "#F8FAFC" }}>
                    {loadingPerformance ? "—" : formatAgentName(agentPerformance?.winner.bySuccessRate)}
                  </div>
                </div>
              </Card>

              <Card style={S.p}>
                <div style={S.label}>Best Agent by Speed</div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Gauge size={18} color="#3ECF6A" />
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "22px", fontWeight: 800, color: "#F8FAFC" }}>
                    {loadingPerformance ? "—" : formatAgentName(agentPerformance?.winner.bySpeed)}
                  </div>
                </div>
              </Card>

              <Card style={S.p}>
                <div style={S.label}>Overall Health Score</div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <HeartPulse size={18} color="#A78BFA" />
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "30px", fontWeight: 800, color: "#A78BFA" }}>
                    {loadingFullReport ? "—" : parsedAiSummary.healthScore ?? "—"}
                  </div>
                </div>
              </Card>

              <Card style={S.p}>
                <div style={S.label}>Resolution Rate</div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={18} color="#3ECF6A" />
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "30px", fontWeight: 800, color: "#3ECF6A" }}>
                    {loadingResolution ? "—" : `${resolutionStats?.resolutionRate ?? 0}%`}
                  </div>
                </div>
              </Card>
            </div>

            <div className="main-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px" }}>
              <Card style={S.p}>
                <h3 style={S.sTitle}>Executive AI Summary</h3>
                <p style={S.sDesc}>Generated from sentiment-agent/full-report</p>
                {loadingFullReport ? (
                  <Spinner />
                ) : (
                  <div>
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, rgba(167,139,250,0.10), rgba(62,207,106,0.06))",
                        border: "1px solid rgba(167,139,250,0.18)",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "14px",
                        lineHeight: 1.75,
                        color: "#E2E8F0",
                      }}
                    >
                      {parsedAiSummary.executiveSummary}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginTop: "14px" }}>
                      <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                        <div style={{ ...S.label, color: "#EF4444" }}>Top Concern</div>
                        <div style={{ marginTop: 6, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "#FCA5A5" }}>
                          {parsedAiSummary.topConcern}
                        </div>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(62,207,106,0.05)", border: "1px solid rgba(62,207,106,0.12)" }}>
                        <div style={{ ...S.label, color: "#3ECF6A" }}>Quick Win</div>
                        <div style={{ marginTop: 6, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "#86EFAC" }}>
                          {parsedAiSummary.quickWin}
                        </div>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.12)" }}>
                        <div style={{ ...S.label, color: "#60A5FA" }}>Weekly Trend</div>
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          {parsedAiSummary.weeklyTrend === "declining" ? (
                            <TrendingDown size={14} color="#EF4444" />
                          ) : (
                            <TrendingUp size={14} color="#3ECF6A" />
                          )}
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "#BFDBFE", textTransform: "capitalize" }}>
                            {parsedAiSummary.weeklyTrend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card style={S.p}>
                <h3 style={S.sTitle}>Resolution Snapshot</h3>
                <p style={S.sDesc}>From sentiment-agent/resolution-stats</p>
                {loadingResolution ? (
                  <Spinner />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Total Cases", value: resolutionStats?.total ?? 0, color: "#94A3B8" },
                      { label: "Resolved", value: resolutionStats?.resolved ?? 0, color: "#3ECF6A" },
                      { label: "Pending", value: resolutionStats?.pending ?? 0, color: "#F59E0B" },
                      { label: "Unresolved", value: resolutionStats?.unresolved ?? 0, color: "#EF4444" },
                      { label: "AI Handled", value: resolutionStats?.aiHandled ?? 0, color: "#A78BFA" },
                      { label: "AI Rate", value: `${resolutionStats?.aiRate ?? 0}%`, color: "#A78BFA" },
                    ].map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(148,163,184,0.07)",
                        }}
                      >
                        <div style={S.label}>{r.label}</div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 20, color: r.color }}>
                          {r.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {/* CHANNELS */}
        {tab === "channels" && (
          <>
            <div className="main-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Card style={S.p}>
                <h3 style={S.sTitle}>Channel Distribution</h3>
                <p style={S.sDesc}>Volume by source channel</p>
                {loadingChannels ? (
                  <Spinner />
                ) : (
                  <div style={{ height: "280px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3}>
                          {channelPie.map((e, i) => (
                            <Cell key={i} fill={e.color} stroke="rgba(0,0,0,0)" />
                          ))}
                        </Pie>
                        <Tooltip content={<Tip />} />
                        <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card style={S.p}>
                <h3 style={S.sTitle}>Channel Stats</h3>
                <p style={S.sDesc}>Detailed operational breakdown</p>
                {loadingChannels ? (
                  <Spinner />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ padding: "14px", borderRadius: "14px", border: "1px solid rgba(96,165,250,0.20)", background: "rgba(96,165,250,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#60A5FA", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px" }}>
                          <Mail size={13} /> Email
                        </div>
                        <span style={S.badge("#60A5FA")}>{channels?.email.resolutionRate}% resolved</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
                        {[["Total", channels?.email.total], ["Replied", channels?.email.replied], ["AI Replied", channels?.email.aiReplied]].map(([l, v]) => (
                          <div key={String(l)} style={{ textAlign: "center" }}>
                            <div style={S.label}>{l}</div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "20px", fontWeight: 800, color: "#60A5FA" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: "14px", borderRadius: "14px", border: "1px solid rgba(62,207,106,0.20)", background: "rgba(62,207,106,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#3ECF6A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px" }}>
                          <MessageCircle size={13} /> WhatsApp
                        </div>
                        <span style={S.badge("#3ECF6A")}>{channels?.whatsapp.unread} unread</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
                        {[["Total", channels?.whatsapp.total], ["Active", channels?.whatsapp.active], ["Unread", channels?.whatsapp.unread]].map(([l, v]) => (
                          <div key={String(l)} style={{ textAlign: "center" }}>
                            <div style={S.label}>{l}</div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "20px", fontWeight: 800, color: "#3ECF6A" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: "14px", borderRadius: "14px", border: "1px solid rgba(249,115,22,0.20)", background: "rgba(249,115,22,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#F97316", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px" }}>
                          <Globe size={13} /> Social
                        </div>
                        <span style={S.badge("#EF4444")}>{channels?.social.critical} critical</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
                        {Object.entries(channels?.social.byPlatform ?? {}).map(([platform, count]) => (
                          <div key={platform} style={{ textAlign: "center" }}>
                            <div style={S.label}>{platform}</div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 800, color: "#F97316" }}>
                              {count as number}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <Card style={S.p}>
              <h3 style={S.sTitle}>Channel Volume Comparison</h3>
              <p style={S.sDesc}>Total vs replied vs AI-handled across channels</p>
              {loadingChannels ? (
                <Spinner />
              ) : (
                <div style={{ height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelBar} margin={{ top: 4, right: 8, bottom: 0, left: -16 }} barSize={24} barCategoryGap="36%">
                      <CartesianGrid {...grid} />
                      <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", paddingTop: "12px" }} />
                      <Bar dataKey="Total" fill="#334155" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Replied" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="AI Replied" fill="#3ECF6A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Active" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Unread" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Complaints" fill="#F97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Resolved" fill="#34D399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card style={S.p}>
              <h3 style={S.sTitle}>Agent vs Agent Comparison</h3>
              <p style={S.sDesc}>Analytics log comparison between Gmail and WhatsApp agents</p>
              {loadingPerformance ? (
                <Spinner />
              ) : (
                <div style={{ height: "320px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceRadar}>
                      <PolarGrid stroke="rgba(148,163,184,0.15)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                      <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 10 }} />
                      <Radar name="Gmail" dataKey="Gmail" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.18} />
                      <Radar name="WhatsApp" dataKey="WhatsApp" stroke="#3ECF6A" fill="#3ECF6A" fillOpacity={0.18} />
                      <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }} />
                      <Tooltip content={<Tip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </>
        )}

        {/* SENTIMENT */}
        {tab === "sentiment" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
              {loadingFullReport ? (
                <Card style={{ ...S.p, gridColumn: "1/-1" }}><Spinner /></Card>
              ) : (
                [
                  { label: "Positive", value: fullReport?.overview.sentimentBreakdown.positive ?? 0, color: "#3ECF6A" },
                  { label: "Neutral", value: fullReport?.overview.sentimentBreakdown.neutral ?? 0, color: "#94A3B8" },
                  { label: "Negative", value: fullReport?.overview.sentimentBreakdown.negative ?? 0, color: "#EF4444" },
                  { label: "Angry", value: fullReport?.overview.sentimentBreakdown.angry ?? 0, color: "#F97316" },
                ].map((s, i) => (
                  <Card key={i} style={{ ...S.p }}>
                    <div style={S.label}>{s.label} Sentiment</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "38px", fontWeight: 800, color: s.color, marginTop: "8px" }}>
                      {s.value}
                    </div>
                  </Card>
                ))
              )}
            </div>

            <Card style={S.p}>
              <h3 style={S.sTitle}>7-Day Sentiment Trend</h3>
              <p style={S.sDesc}>Trend from analytics-agent sentiment endpoint</p>
              {loadingSentimentTrend ? (
                <Spinner />
              ) : (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentChart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <defs>
                        <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3ECF6A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3ECF6A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...grid} />
                      <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", paddingTop: "10px" }} />
                      <Area type="monotone" dataKey="Positive" stroke="#3ECF6A" strokeWidth={2.5} fill="url(#gPos)" />
                      <Area type="monotone" dataKey="Neutral" stroke="#94A3B8" strokeWidth={2} fill="url(#gNeu)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="Negative" stroke="#EF4444" strokeWidth={2.5} fill="url(#gNeg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card style={S.p}>
              <h3 style={S.sTitle}>Customer Sentiment & Resolution</h3>
              <p style={S.sDesc}>Per-customer report from sentiment-agent/full-report</p>
              {loadingFullReport ? (
                <Spinner />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        {["Customer", "Sentiment", "Score", "Resolution", "Unreplied Emails", "Unread WA", "At Risk"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid rgba(148,163,184,0.10)", ...S.label }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(fullReport?.customers || []).map((c, i) => {
                        const sentimentColor =
                          c.sentiment === "positive"
                            ? "#3ECF6A"
                            : c.sentiment === "neutral"
                            ? "#94A3B8"
                            : c.sentiment === "negative"
                            ? "#EF4444"
                            : "#F97316";

                        const resolutionColor =
                          c.resolutionStatus === "resolved"
                            ? "#3ECF6A"
                            : c.resolutionStatus === "pending"
                            ? "#F59E0B"
                            : "#EF4444";

                        return (
                          <tr key={c.customerId || i} className="row-hover" style={{ transition: "background 0.15s" }}>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>
                              {c.name}
                            </td>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={S.badge(sentimentColor)}>{c.sentiment}</span>
                            </td>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: sentimentColor, fontWeight: 700 }}>
                              {c.sentimentScore}
                            </td>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={S.badge(resolutionColor)}>{c.resolutionStatus}</span>
                            </td>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#60A5FA" }}>
                              {c.unrepliedEmails}
                            </td>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#3ECF6A" }}>
                              {c.unreadWhatsApp}
                            </td>
                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              {c.isAtRisk ? <span style={S.badge("#EF4444")}>YES</span> : <span style={S.badge("#3ECF6A")}>NO</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ALERTS */}
        {tab === "alerts" && (
          <>
            {loadingAlerts ? (
              <Card style={S.p}><Spinner /></Card>
            ) : alertsData.length === 0 ? (
              <Card style={{ ...S.p, textAlign: "center" }}>
                <CheckCircle size={40} color="#3ECF6A" style={{ marginBottom: "12px" }} />
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px" }}>
                  All clear!
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "#64748B" }}>
                  No active alerts at this time.
                </div>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {alertsData.map((a, i) => {
                  const severityColor: Record<string, string> = { critical: "#EF4444", high: "#F59E0B", medium: "#60A5FA" };
                  const sc = severityColor[a.severity] || "#94A3B8";
                  const typeIcon: Record<string, React.ReactNode> = {
                    email: <Mail size={16} />,
                    whatsapp: <MessageCircle size={16} />,
                    social: <Globe size={16} />,
                    customer: <Users size={16} />,
                  };

                  return (
                    <Card key={i} style={{ border: `1px solid ${sc}25`, background: `linear-gradient(160deg, ${sc}05, rgba(2,6,23,0.95))` }}>
                      <div
                        className="row-hover"
                        style={{
                          ...S.p,
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          borderRadius: "20px",
                          transition: "background 0.15s",
                          cursor: "pointer",
                        }}
                        onClick={() => (window.location.href = a.link)}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "12px",
                            background: `${sc}18`,
                            border: `1px solid ${sc}30`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: sc,
                            flexShrink: 0,
                          }}
                        >
                          {typeIcon[a.type] || <AlertTriangle size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <AlertBadge severity={a.severity} />
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", color: "#F8FAFC" }}>
                              {a.title}
                            </span>
                          </div>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "#64748B" }}>{a.action}</div>
                        </div>
                        <ChevronRight size={16} color="#475569" style={{ flexShrink: 0 }} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card style={S.p}>
              <h3 style={S.sTitle}>AI Alert Context</h3>
              <p style={S.sDesc}>Signals surfaced by the analytics recommendations engine</p>
              {loadingRecs ? (
                <Spinner />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
                  {(recs?.alerts || []).map((a, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "14px",
                        borderRadius: "14px",
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.14)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <AlertTriangle size={14} color="#EF4444" />
                        <span style={{ ...S.label, color: "#EF4444" }}>Active Signal</span>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#FCA5A5", fontWeight: 600 }}>{a}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* AI INSIGHTS */}
        {tab === "ai" && (
          <>
            {!loadingRecs && recs?.metrics && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
                {[
                  { label: "Unreplied Emails", value: recs.metrics.unrepliedEmails, color: "#60A5FA" },
                  { label: "Unread WhatsApp", value: recs.metrics.unreadWhatsApp, color: "#3ECF6A" },
                  { label: "At-Risk Customers", value: recs.metrics.atRiskCustomers, color: "#F97316" },
                  { label: "Critical Complaints", value: recs.metrics.criticalComplaints, color: "#EF4444" },
                ].map((m, i) => (
                  <Card key={i} style={{ ...S.p, textAlign: "center" }}>
                    <div style={S.label}>{m.label}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "30px", fontWeight: 800, color: m.color, marginTop: "6px" }}>
                      {m.value}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="ai-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Card style={S.p}>
                <h3 style={S.sTitle}>Best Performing Agent</h3>
                <p style={S.sDesc}>Computed using saved MongoDB analytics events</p>
                {loadingPerformance ? (
                  <Spinner />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ padding: "16px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(62,207,106,0.10), rgba(96,165,250,0.08))", border: "1px solid rgba(62,207,106,0.14)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Trophy size={16} color="#F59E0B" />
                        <span style={{ ...S.label, color: "#F59E0B" }}>Winner by Success Rate</span>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#F8FAFC" }}>
                        {formatAgentName(agentPerformance?.winner.bySuccessRate)}
                      </div>
                    </div>

                    <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.14)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Gauge size={16} color="#60A5FA" />
                        <span style={{ ...S.label, color: "#60A5FA" }}>Winner by Speed</span>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#F8FAFC" }}>
                        {formatAgentName(agentPerformance?.winner.bySpeed)}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card style={S.p}>
                <h3 style={S.sTitle}>Operational AI Analysis</h3>
                <p style={S.sDesc}>Combined reading of sentiment and agent performance</p>
                {loadingPerformance || loadingFullReport ? (
                  <Spinner />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.10)" }}>
                      <div style={{ ...S.label, color: "#60A5FA" }}>Gmail Agent</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, marginTop: 6 }}>
                        Success rate <b style={{ color: "#60A5FA" }}>{gmailStats?.successRate ?? 0}%</b>, total events{" "}
                        <b style={{ color: "#60A5FA" }}>{gmailStats?.totalEvents ?? 0}</b>, average total latency{" "}
                        <b style={{ color: "#60A5FA" }}>{formatMs(gmailStats?.avgTotalLatencyMs)}</b>.
                      </div>
                    </div>

                    <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.10)" }}>
                      <div style={{ ...S.label, color: "#3ECF6A" }}>WhatsApp Agent</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, marginTop: 6 }}>
                        Success rate <b style={{ color: "#3ECF6A" }}>{whatsappStats?.successRate ?? 0}%</b>, total events{" "}
                        <b style={{ color: "#3ECF6A" }}>{whatsappStats?.totalEvents ?? 0}</b>, average total latency{" "}
                        <b style={{ color: "#3ECF6A" }}>{formatMs(whatsappStats?.avgTotalLatencyMs)}</b>.
                      </div>
                    </div>

                    <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.14)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Sparkles size={14} color="#A78BFA" />
                        <span style={{ ...S.label, color: "#A78BFA" }}>Insight</span>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#DDD6FE", lineHeight: 1.7 }}>
                        {agentPerformance?.winner.bySuccessRate === "whatsapp" && (gmailStats?.totalEvents ?? 0) === 0
                          ? "WhatsApp Agent currently dominates performance because it is the only channel with recorded auto-reply activity. Gmail Agent needs live usage data before a fair comparison can be made."
                          : agentPerformance?.winner.bySuccessRate === agentPerformance?.winner.bySpeed
                          ? `${formatAgentName(agentPerformance?.winner.bySuccessRate)} currently leads on both reliability and speed, making it the strongest automated support channel right now.`
                          : `${formatAgentName(agentPerformance?.winner.bySuccessRate)} leads on success rate, while ${formatAgentName(agentPerformance?.winner.bySpeed)} is faster. This suggests a trade-off between reliability and turnaround speed.`}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {!loadingRecs && recs?.alerts && recs.alerts.length > 0 && (
              <Card style={{ ...S.p, border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <AlertTriangle size={16} color="#EF4444" />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", color: "#EF4444" }}>
                    Active Alerts
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {recs.alerts.map((a, i) => (
                    <span key={i} style={S.badge("#EF4444")}>{a}</span>
                  ))}
                </div>
              </Card>
            )}

            <div>
              <h3 style={{ ...S.sTitle, marginBottom: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={16} color="#A78BFA" /> AI-Powered Recommendations
                </span>
              </h3>
              {loadingRecs ? (
                <Card style={S.p}>
                  <Spinner />
                  <div style={{ textAlign: "center", marginTop: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#475569" }}>
                    Groq AI is analyzing your metrics…
                  </div>
                </Card>
              ) : (
                <div className="ai-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
                  {(recs?.recommendations ?? []).map((r, i) => {
                    const priorityColor: Record<string, string> = { high: "#EF4444", medium: "#F59E0B", low: "#3ECF6A" };
                    const categoryIcon: Record<string, React.ReactNode> = {
                      response_time: <Clock size={14} />,
                      ai_automation: <Bot size={14} />,
                      customer_risk: <Users size={14} />,
                      social_media: <Globe size={14} />,
                      staffing: <User size={14} />,
                      agent_performance: <Target size={14} />,
                    };
                    const pc = priorityColor[r.priority] || "#94A3B8";

                    return (
                      <div
                        key={i}
                        className="rec-card"
                        style={{
                          ...S.card,
                          ...S.p,
                          border: `1px solid rgba(148,163,184,0.12)`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={S.badge(pc)}>
                              <PriorityDot priority={r.priority} />
                              {r.priority.toUpperCase()}
                            </span>
                            <span style={{ ...S.label, textTransform: "none", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
                              {categoryIcon[r.category] || <Target size={12} />} {r.category.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "15px", color: "#F8FAFC", marginBottom: "6px", lineHeight: 1.3 }}>
                          {r.title}
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "#64748B", marginBottom: "12px", lineHeight: 1.6 }}>
                          {r.description}
                        </div>
                        <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(62,207,106,0.06)", border: "1px solid rgba(62,207,106,0.14)", marginBottom: "8px" }}>
                          <div style={{ ...S.label, color: "#3ECF6A", marginBottom: "3px" }}>Action</div>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "#86EFAC", fontWeight: 600 }}>
                            {r.action}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ArrowUpRight size={12} color="#A78BFA" />
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#A78BFA" }}>{r.impact}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Card style={S.p}>
              <h3 style={S.sTitle}>Recent Agent Logs</h3>
              <p style={S.sDesc}>Latest raw events saved by Gmail and WhatsApp agents</p>
              {loadingLogs ? (
                <Spinner />
              ) : (
                <div style={{ maxHeight: 320, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        {["Time", "Agent", "Action", "Status", "Latency", "Channel"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid rgba(148,163,184,0.10)", ...S.label }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((row, i) => (
                        <tr key={row._id || i} className="row-hover" style={{ transition: "background 0.15s" }}>
                          <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#94A3B8" }}>
                            {new Date(row.createdAt).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: row.agentType === "gmail" ? "#60A5FA" : "#3ECF6A", fontWeight: 700 }}>
                            {row.agentType}
                          </td>
                          <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#E2E8F0" }}>
                            {row.actionType}
                          </td>
                          <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: row.status === "success" ? "#3ECF6A" : row.status === "failed" ? "#EF4444" : "#F59E0B", fontWeight: 700 }}>
                            {row.status}
                          </td>
                          <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#A78BFA" }}>
                            {formatMs(row.totalLatencyMs)}
                          </td>
                          <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#64748B" }}>
                            {row.channel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}