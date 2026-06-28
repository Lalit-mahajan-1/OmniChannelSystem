import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  Clock,
  Target,
  FileSpreadsheet,
  FileDown,
  Loader2,
  CheckCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

/* ─── palette — matches Campaigns / Inbox ─── */
const C = {
  cream: "#FFF8E7",
  creamDeep: "#FFFDF5",
  white: "#FFFFFF",
  border: "#F0E4C8",
  textMain: "#1A1A1A",
  textMid: "#8A8578",
  textFaint: "#B0A99A",
  yellow: "#FFC107",
  yellowDark: "#B8860B",
  yellowBg: "#FFF3CD",
  yellowBorder: "#FFE082",
  amber: "#EF9F27",
  amberBg: "#FAEEDA",
  amberBorder: "#FAC775",
  green:    "#B8860B",
  greenBg:  "#FFF3CD",
  greenBorder: "#FFE082",
  blue: "#185FA5",
  blueBg: "#E6F1FB",
  blueBorder: "#B5D4F4",
  purple: "#534AB7",
  purpleBg: "#EEEDFE",
  purpleBorder: "#CECBF6",
  red: "#A32D2D",
  redBg: "#FCEBEB",
  redBorder: "#F7C1C1",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportConfig {
  type: "ticket-summary" | "customer-health" | "at-risk" | "sentiment-trends" | "performance";
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  accentBorder: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  healthScore: number;
  healthStatus: string;
  createdAt: string;
}

interface TicketRecord {
  _id: string;
  ticketId: string;
  customerId?: string;
  channel: string;
  sentiment: string;
  urgency: string;
  priority: string;
  category: string;
  assignedTeam: string;
  escalationRequired: boolean;
  createdAt: string;
}

// ── Report Configurations ─────────────────────────────────────────────────────

const REPORT_TYPES: ReportConfig[] = [
  {
    type: "ticket-summary",
    title: "Ticket Intelligence Summary",
    description: "Complete breakdown of all analyzed tickets with sentiment, priority, and category",
    icon: <MessageSquare style={{ width: 20, height: 20 }} />,
    accent: C.blue,
    accentBg: C.blueBg,
    accentBorder: C.blueBorder,
  },
  {
    type: "customer-health",
    title: "Customer Health Report",
    description: "Health scores, status distribution, and engagement metrics across all customers",
    icon: <Users style={{ width: 20, height: 20 }} />,
    accent: C.green,
    accentBg: C.greenBg,
    accentBorder: C.greenBorder,
  },
  {
    type: "at-risk",
    title: "At-Risk Customers",
    description: "Detailed list of customers with low health scores requiring immediate attention",
    icon: <AlertTriangle style={{ width: 20, height: 20 }} />,
    accent: C.red,
    accentBg: C.redBg,
    accentBorder: C.redBorder,
  },
  {
    type: "sentiment-trends",
    title: "Sentiment Analysis",
    description: "Sentiment distribution, negative ticket breakdown, and escalation patterns",
    icon: <TrendingUp style={{ width: 20, height: 20 }} />,
    accent: C.purple,
    accentBg: C.purpleBg,
    accentBorder: C.purpleBorder,
  },
  {
    type: "performance",
    title: "Team Performance",
    description: "Resolution times, ticket volumes by team, and AI classification accuracy",
    icon: <Target style={{ width: 20, height: 20 }} />,
    accent: C.yellowDark,
    accentBg: C.yellowBg,
    accentBorder: C.yellowBorder,
  },
  {
    type: "agent-performance",
    title: "AI Agent Performance",
    description: "Auto-reply success rates, response latency, and channel breakdown for WhatsApp & Email agents",
    icon: <Clock style={{ width: 20, height: 20 }} />,
    accent: C.purple,
    accentBg: C.purpleBg,
    accentBorder: C.purpleBorder,
  },
  {
    type: "complaints",
    title: "Complaint Analysis",
    description: "All customer complaints across WhatsApp, Email channels with status and priority breakdown",
    icon: <AlertTriangle style={{ width: 20, height: 20 }} />,
    accent: C.amber,
    accentBg: C.amberBg,
    accentBorder: C.amberBorder,
  },
  {
    type: "campaign-report",
    title: "Campaign Performance",
    description: "Campaign delivery metrics — sent, delivered, read rates, and failure analysis",
    icon: <Target style={{ width: 20, height: 20 }} />,
    accent: C.green,
    accentBg: C.greenBg,
    accentBorder: C.greenBorder,
  },
];

// ── Style helpers (mirrors Campaigns / Inbox conventions) ─────────────────────

function ghostBtn(color: string, bg: string, border: string, disabled?: boolean): React.CSSProperties {
  return {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "10px 14px", borderRadius: 9, border: `0.5px solid ${border}`, background: bg,
    color, fontSize: 12.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1, textTransform: "uppercase", letterSpacing: "0.03em",
    transition: "all 0.15s",
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDateRange(preset: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

const PRESET_LABELS: Record<string, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "1y": "Last Year",
  custom: "Custom Range",
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [generating, setGenerating] = useState(false);

  // Fetch data
  const analyticsQuery = useQuery({
    queryKey: ["reports-analytics"],
    queryFn: () => api.tickets.getAnalytics().then((r) => r.data),
  });

  const atRiskQuery = useQuery({
    queryKey: ["reports-at-risk"],
    queryFn: () => api.tickets.getAtRisk().then((r) => r.data),
  });

  const ticketsQuery = useQuery({
    queryKey: ["reports-tickets"],
    queryFn: () =>
      api.tickets.getIntelligence({ limit: 1000 }).then((r) => r.data),
  });

  const customersQuery = useQuery<{ success: boolean; data: Customer[] }>({
    queryKey: ["reports-customers"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customers?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const agentStatsQuery = useQuery({
    queryKey: ["reports-agent-stats"],
    queryFn: () => api.agentAnalytics.getStats().then((r) => r.data),
  });

  const campaignsQuery = useQuery({
    queryKey: ["reports-campaigns"],
    queryFn: () => api.marketing.getCampaigns(),
  });

  const complaintsQuery = useQuery({
    queryKey: ["reports-complaints"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/social/complaints?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const analytics = analyticsQuery.data;
  const atRisk = atRiskQuery.data ?? [];
  const tickets: TicketRecord[] = (ticketsQuery.data as any) ?? [];
  const customers = customersQuery.data?.data ?? [];
  const agentStats = agentStatsQuery.data;
  const campaignsData: any[] = Array.isArray(campaignsQuery.data) ? campaignsQuery.data : [];
  const complaintsData: any[] = complaintsQuery.data?.data ?? [];

  // Filter by date range
  const { start: rangeStart, end: rangeEnd } = datePreset === "custom"
    ? { start: new Date(customStart || Date.now()), end: new Date(customEnd || Date.now()) }
    : getDateRange(datePreset);

  const filteredTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.createdAt);
    return ticketDate >= rangeStart && ticketDate <= rangeEnd;
  });

  // ── CSV Export ────────────────────────────────────────────────────────────────

  const exportCSV = (reportType: string) => {
    setGenerating(true);

    try {
      let data: any[] = [];
      let filename = "";

      switch (reportType) {
        case "ticket-summary":
          data = filteredTickets.map((t) => ({
            "Ticket ID": t.ticketId,
            Channel: t.channel,
            Sentiment: t.sentiment,
            Urgency: t.urgency,
            Priority: t.priority,
            Category: t.category,
            "Assigned Team": t.assignedTeam,
            Escalation: t.escalationRequired ? "Yes" : "No",
            Date: formatDate(t.createdAt),
          }));
          filename = `ticket-summary-${datePreset}.csv`;
          break;

        case "customer-health":
          data = customers.map((c) => ({
            Name: c.name,
            Email: c.email,
            Phone: c.phone || "—",
            "Health Score": c.healthScore,
            Status: c.healthStatus,
            "Member Since": formatDate(c.createdAt),
          }));
          filename = `customer-health-${datePreset}.csv`;
          break;

        case "at-risk":
          data = atRisk.map((c) => ({
            Name: c.name,
            Email: c.email || "—",
            Phone: c.phone || "—",
            "Health Score": c.healthScore,
            Status: c.healthStatus,
          }));
          filename = `at-risk-customers-${datePreset}.csv`;
          break;

        case "sentiment-trends":
          const sentimentData = analytics?.sentimentDistribution ?? [];
          data = sentimentData.map((s) => ({
            Sentiment: s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1),
            Count: s.count,
            Percentage: ((s.count / filteredTickets.length) * 100).toFixed(1) + "%",
          }));
          filename = `sentiment-trends-${datePreset}.csv`;
          break;

        case "performance":
          const teamData: Record<string, number> = {};
          filteredTickets.forEach((t) => {
            teamData[t.assignedTeam] = (teamData[t.assignedTeam] || 0) + 1;
          });
          data = Object.entries(teamData).map(([team, count]) => ({
            Team: team,
            "Tickets Assigned": count,
          }));
          filename = `team-performance-${datePreset}.csv`;
          break;

        case "agent-performance":
          if (agentStats?.recentActions) {
            data = agentStats.recentActions.map((a: any) => ({
              Agent: a.agentType,
              Action: a.actionType,
              Status: a.status,
              Channel: a.channel || "—",
              "Latency (ms)": a.totalLatencyMs || 0,
              Date: formatDate(a.createdAt),
            }));
          }
          if (agentStats?.byAgent) {
            data = [
              ...data,
              { Agent: "--- SUMMARY ---", Action: "", Status: "", Channel: "", "Latency (ms)": "", Date: "" },
              ...agentStats.byAgent.map((a: any) => ({
                Agent: a._id,
                Action: `${a.count} total`,
                Status: `${a.success} success`,
                Channel: "",
                "Latency (ms)": "",
                Date: "",
              })),
            ];
          }
          filename = `agent-performance-${datePreset}.csv`;
          break;

        case "complaints":
          data = complaintsData.map((c: any) => ({
            Channel: c.platform,
            Author: c.author,
            Content: c.content?.slice(0, 200),
            Sentiment: c.sentiment,
            Priority: c.priority,
            Status: c.complaintStatus,
            "Assigned To": c.assignedTo?.name || "Unassigned",
            Date: formatDate(c.createdAt),
          }));
          filename = `complaints-${datePreset}.csv`;
          break;

        case "campaign-report":
          data = campaignsData.map((c: any) => ({
            Name: c.name,
            Channel: c.type,
            Status: c.status,
            Sent: c.stats?.sent || 0,
            Delivered: c.stats?.delivered || 0,
            Read: c.stats?.read || 0,
            Failed: c.stats?.failed || 0,
            Segment: c.targetSegment?.join(", ") || "General",
            Created: formatDate(c.createdAt),
          }));
          filename = `campaign-performance-${datePreset}.csv`;
          break;
      }

      if (data.length === 0) {
        toast.error("No data available for this report");
        setGenerating(false);
        return;
      }

      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast.success(`CSV exported: ${filename}`);
    } catch (err) {
      toast.error("Failed to export CSV");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // ── PDF Export ────────────────────────────────────────────────────────────────

  const exportPDF = (reportType: string) => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const reportConfig = REPORT_TYPES.find((r) => r.type === reportType);
      const title = reportConfig?.title || "Report";

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(title, 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Date Range: ${formatDate(rangeStart.toISOString())} - ${formatDate(rangeEnd.toISOString())}`, 14, 36);

      let tableData: any[] = [];
      let columns: string[] = [];

      switch (reportType) {
        case "ticket-summary":
          columns = ["Ticket ID", "Channel", "Sentiment", "Priority", "Category", "Team"];
          tableData = filteredTickets.slice(0, 100).map((t) => [
            t.ticketId.slice(0, 12),
            t.channel,
            t.sentiment,
            t.priority,
            t.category,
            t.assignedTeam,
          ]);
          break;

        case "customer-health":
          columns = ["Name", "Email", "Health Score", "Status"];
          tableData = customers.slice(0, 100).map((c) => [
            c.name,
            c.email,
            c.healthScore.toString(),
            c.healthStatus,
          ]);
          break;

        case "at-risk":
          columns = ["Name", "Email", "Health Score", "Status"];
          tableData = atRisk.map((c) => [
            c.name,
            c.email || "—",
            c.healthScore.toString(),
            c.healthStatus,
          ]);
          break;

        case "sentiment-trends":
          columns = ["Sentiment", "Count", "Percentage"];
          const sentimentData = analytics?.sentimentDistribution ?? [];
          tableData = sentimentData.map((s) => [
            s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1),
            s.count.toString(),
            ((s.count / filteredTickets.length) * 100).toFixed(1) + "%",
          ]);
          break;

        case "performance":
          columns = ["Team", "Tickets Assigned"];
          const teamDataP: Record<string, number> = {};
          filteredTickets.forEach((t) => {
            teamDataP[t.assignedTeam] = (teamDataP[t.assignedTeam] || 0) + 1;
          });
          tableData = Object.entries(teamDataP).map(([team, count]) => [team, count.toString()]);
          break;

        case "agent-performance":
          columns = ["Agent", "Action", "Status", "Channel", "Latency (ms)"];
          tableData = (agentStats?.recentActions || []).slice(0, 50).map((a: any) => [
            a.agentType, a.actionType, a.status, a.channel || "—", String(a.totalLatencyMs || 0),
          ]);
          break;

        case "complaints":
          columns = ["Channel", "Author", "Content", "Sentiment", "Priority", "Status"];
          tableData = complaintsData.slice(0, 100).map((c: any) => [
            c.platform, c.author, (c.content || "").slice(0, 60), c.sentiment, c.priority, c.complaintStatus,
          ]);
          break;

        case "campaign-report":
          columns = ["Name", "Channel", "Status", "Sent", "Delivered", "Read", "Failed"];
          tableData = campaignsData.map((c: any) => [
            c.name, c.type, c.status, String(c.stats?.sent || 0), String(c.stats?.delivered || 0), String(c.stats?.read || 0), String(c.stats?.failed || 0),
          ]);
          break;
      }

      if (tableData.length === 0) {
        toast.error("No data available for this report");
        setGenerating(false);
        return;
      }

      autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [184, 134, 11], textColor: 255 },
        alternateRowStyles: { fillColor: [255, 248, 231] },
      });

      const filename = `${reportType}-${datePreset}.pdf`;
      doc.save(filename);

      toast.success(`PDF exported: ${filename}`);
    } catch (err) {
      toast.error("Failed to export PDF");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const isLoading =
    analyticsQuery.isLoading ||
    atRiskQuery.isLoading ||
    ticketsQuery.isLoading ||
    customersQuery.isLoading ||
    agentStatsQuery.isLoading ||
    campaignsQuery.isLoading ||
    complaintsQuery.isLoading;

  return (
    <div
      style={{
        padding: "28px 32px",
        minHeight: "100vh",
        background: C.cream,
        color: C.textMain,
        fontFamily: "DM Sans, Inter, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: C.textMain,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText style={{ width: 20, height: 20, color: C.yellow }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 4 }}>
              Insights
            </div>
            <h1
              style={{
                fontWeight: 500,
                fontSize: 22,
                color: C.textMain,
                margin: 0,
              }}
            >
              Reports &amp; Exports
            </h1>
          </div>
        </div>
        <p
          style={{
            fontSize: 13,
            color: C.textMid,
            margin: 0,
          }}
        >
          Generate comprehensive reports in CSV or PDF format
        </p>
      </div>

      {/* ── Date Range Filter ── */}
      <div
        style={{
          background: C.white,
          border: `0.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Calendar style={{ width: 15, height: 15, color: C.yellowDark }} />
          <h3
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              color: C.textMain,
              margin: 0,
            }}
          >
            Date Range
          </h3>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {["7d", "30d", "90d", "1y", "custom"].map((preset) => {
            const active = datePreset === preset;
            return (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `0.5px solid ${active ? C.textMain : C.border}`,
                  background: active ? C.textMain : C.cream,
                  color: active ? C.yellow : C.textMid,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {PRESET_LABELS[preset]}
              </button>
            );
          })}
          {datePreset === "custom" && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `0.5px solid ${C.border}`,
                  background: C.cream,
                  color: C.textMain,
                  fontSize: 13,
                }}
              />
              <span style={{ color: C.textFaint }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `0.5px solid ${C.border}`,
                  background: C.cream,
                  color: C.textMain,
                  fontSize: 13,
                }}
              />
            </>
          )}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: C.textMid, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Filter style={{ width: 12, height: 12, color: C.textFaint }} />
          Showing data from <strong style={{ color: C.textMain }}>{formatDate(rangeStart.toISOString())}</strong> to{" "}
          <strong style={{ color: C.textMain }}>{formatDate(rangeEnd.toISOString())}</strong>
          {filteredTickets.length > 0 && (
            <span>
              • <strong style={{ color: C.textMain }}>{filteredTickets.length}</strong> tickets
            </span>
          )}
        </div>
      </div>

      {/* ── Report Types Grid ── */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            gap: 8,
            color: C.textMid,
          }}
        >
          <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", color: C.yellowDark }} />
          Loading report data...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {REPORT_TYPES.map((report) => (
            <div
              key={report.type}
              style={{
                background: C.white,
                border: `0.5px solid ${C.border}`,
                borderLeft: `3px solid ${report.accent}`,
                borderRadius: 14,
                padding: "22px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: report.accentBg,
                  border: `0.5px solid ${report.accentBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: report.accent,
                  marginBottom: 16,
                }}
              >
                {report.icon}
              </div>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: 15.5,
                  color: C.textMain,
                  margin: "0 0 8px",
                }}
              >
                {report.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: C.textMid,
                  lineHeight: 1.55,
                  margin: "0 0 20px",
                  minHeight: 40,
                }}
              >
                {report.description}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => exportCSV(report.type)}
                  disabled={generating}
                  style={ghostBtn(C.green, C.greenBg, C.greenBorder, generating)}
                >
                  {generating ? (
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  ) : (
                    <FileSpreadsheet style={{ width: 14, height: 14 }} />
                  )}
                  CSV
                </button>
                <button
                  onClick={() => exportPDF(report.type)}
                  disabled={generating}
                  style={ghostBtn(C.red, C.redBg, C.redBorder, generating)}
                >
                  {generating ? (
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  ) : (
                    <FileDown style={{ width: 14, height: 14 }} />
                  )}
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats Summary ── */}
      <div
        style={{
          marginTop: 28,
          background: C.white,
          border: `0.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "22px 24px",
        }}
      >
        <h3
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            color: C.textMain,
            margin: "0 0 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle style={{ width: 15, height: 15, color: C.green }} />
          Report Summary
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "Total Tickets Analyzed", value: filteredTickets.length, color: C.textMain },
            { label: "Total Customers", value: customers.length, color: C.textMain },
            { label: "At-Risk Customers", value: atRisk.length, color: C.red },
            { label: "AI Agent Replies", value: agentStats?.totalReplies ?? 0, color: C.purple },
            { label: "Campaigns", value: campaignsData.length, color: C.green },
            { label: "Complaints", value: complaintsData.length, color: C.amber },
          ].map((s) => (
            <div key={s.label} style={{ padding: 14, borderRadius: 12, background: C.cream, border: `0.5px solid ${C.border}` }}>
              <div style={{ fontSize: 10.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 500, color: s.color, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}