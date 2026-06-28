import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TicketAnalytics, AtRiskCustomer } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  AlertTriangle,
  Flame,
  TrendingUp,
  Users,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

/* ─── palette — matches Campaigns / Inbox / Reports ─── */
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

interface TicketRecord {
  _id: string;
  ticketId: string;
  customerId?: string;
  channel: string;
  message: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  assignedTeam: string;
  suggestedAction: string;
  confidence: number;
  escalationRequired: boolean;
  createdAt: string;
}

// ── Colour helpers (mapped onto the cream/yellow palette) ─────────────────────

const sentimentColor: Record<string, string> = {
  positive: C.green,
  neutral: C.textFaint,
  negative: C.red,
};

const priorityColor: Record<string, string> = {
  low: C.green,
  medium: C.yellowDark,
  high: C.amber,
  critical: C.red,
};

const urgencyColor: Record<string, string> = {
  low: C.green,
  medium: C.yellowDark,
  high: C.red,
};

const channelOptions = ["email", "whatsapp", "twitter", "reddit", "social", "unknown"];
const priorityOptions = ["low", "medium", "high", "critical"];
const categoryOptions = [
  "billing",
  "technical",
  "account",
  "refund",
  "shipping",
  "feature-request",
  "complaint",
  "general",
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: C.cream,
  border: `0.5px solid ${C.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: C.textMain,
  fontSize: 13,
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  background: C.white,
  border: `0.5px solid ${C.border}`,
  borderRadius: 14,
};

function pill(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
    borderRadius: 999, background: bg, border: `0.5px solid ${border}`,
    fontSize: 9.5, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.04em",
  };
}

function tint(hex: string, bgAlpha = "18"): string {
  // produce a light tint background for an arbitrary hex (used for badges sourced from data, not the fixed palette)
  return `${hex}${bgAlpha}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
  border,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: bg,
            border: `0.5px solid ${border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 10.5,
            color: C.textFaint,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 26,
          color: C.textMain,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: C.textMid }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, colorMap }: { data: Array<{ label: string; count: number }>; colorMap?: Record<string, string> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {data.map((item) => {
        const pct = (item.count / max) * 100;
        const color = colorMap?.[item.label] ?? C.yellowDark;
        return (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: C.textMid,
                width: 100,
                flexShrink: 0,
                textTransform: "capitalize",
              }}
            >
              {item.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 8,
                background: C.border,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                color: C.textFaint,
                width: 24,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 600,
        color,
        background: tint(color),
        border: `0.5px solid ${tint(color, "55")}`,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TicketIntelligencePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Analyze form state ──
  const [form, setForm] = useState({
    message: "",
    channel: "email",
    customerId: "",
    ticketId: "",
  });
  const [analyzeResult, setAnalyzeResult] = useState<TicketRecord | null>(null);

  // ── Intelligence list filters ──
  const [filterPriority, setFilterPriority] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Queries ──
  const analyticsQuery = useQuery({
    queryKey: ["ticket-analytics"],
    queryFn: () => api.tickets.getAnalytics().then((r) => r.data),
  });

  const atRiskQuery = useQuery({
    queryKey: ["ticket-at-risk"],
    queryFn: () => api.tickets.getAtRisk().then((r) => r.data),
  });

  const intelligenceQuery = useQuery({
    queryKey: ["ticket-intelligence", filterPriority, filterChannel],
    queryFn: () =>
      api.tickets
        .getIntelligence({
          priority: filterPriority || undefined,
          channel: filterChannel || undefined,
          limit: 100,
        })
        .then((r) => r.data),
  });

  // ── Mutations ──
  const analyzeMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.tickets.analyze({
        message: payload.message,
        channel: payload.channel,
        customerId: payload.customerId,
        ticketId: payload.ticketId || undefined,
      }),
    onSuccess: (res) => {
      setAnalyzeResult(res.data as TicketRecord);
      queryClient.invalidateQueries({ queryKey: ["ticket-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-at-risk"] });
      toast({ title: "Ticket analyzed", description: "AI classification complete." });
    },
    onError: (err: Error) => {
      toast({
        title: "Analysis failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    if (!form.customerId.trim()) {
      toast({
        title: "Customer ID required",
        description: "Enter a valid MongoDB customer _id.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(form);
  };

  const analytics: TicketAnalytics | undefined = analyticsQuery.data;
  const atRisk: AtRiskCustomer[] = atRiskQuery.data ?? [];
  const tickets: TicketRecord[] = intelligenceQuery.data ?? [];

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
            <Brain style={{ width: 20, height: 20, color: C.yellow }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 4 }}>
              Intelligence
            </div>
            <h1
              style={{
                fontWeight: 500,
                fontSize: 22,
                color: C.textMain,
                margin: 0,
              }}
            >
              AI Ticket Intelligence
            </h1>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, color: C.textMid, margin: 0 }}>
            Classify tickets, track customer health, and surface escalations
          </p>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["ticket-analytics"] });
              queryClient.invalidateQueries({ queryKey: ["ticket-intelligence"] });
              queryClient.invalidateQueries({ queryKey: ["ticket-at-risk"] });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 999,
              border: `0.5px solid ${C.border}`,
              background: C.white,
              color: C.textMid,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Flame style={{ width: 16, height: 16 }} />}
          label="Critical Tickets"
          value={analyticsQuery.isLoading ? "—" : analytics?.criticalTickets ?? 0}
          color={C.red}
          bg={C.redBg}
          border={C.redBorder}
          sub="Need immediate attention"
        />
        <StatCard
          icon={<AlertTriangle style={{ width: 16, height: 16 }} />}
          label="Escalated"
          value={analyticsQuery.isLoading ? "—" : analytics?.escalatedTickets ?? 0}
          color={C.amber}
          bg={C.amberBg}
          border={C.amberBorder}
          sub="Escalation required"
        />
        <StatCard
          icon={<Activity style={{ width: 16, height: 16 }} />}
          label="Total Analyzed"
          value={
            analyticsQuery.isLoading
              ? "—"
              : (analytics?.categoryDistribution?.reduce((s, d) => s + d.count, 0) ?? 0)
          }
          color={C.green}
          bg={C.greenBg}
          border={C.greenBorder}
          sub="All-time records"
        />
        <StatCard
          icon={<Users style={{ width: 16, height: 16 }} />}
          label="At-Risk Customers"
          value={atRiskQuery.isLoading ? "—" : atRisk.length}
          color={C.purple}
          bg={C.purpleBg}
          border={C.purpleBorder}
          sub="Low health score"
        />
      </div>

      {/* ── Two-column grid: Analyze + Analytics ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Analyze Form */}
        <div
          style={{
            ...cardStyle,
            padding: 22,
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              color: C.textMain,
              margin: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Send style={{ width: 15, height: 15, color: C.yellowDark }} />
            Analyze a Ticket
          </h2>
          <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <textarea
              placeholder="Paste or type the customer message..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>
                  Channel *
                </label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {channelOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>
                  Customer ID *
                </label>
                <input
                  type="text"
                  placeholder="MongoDB _id"
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Ticket ID (optional — auto-generated if blank)"
              value={form.ticketId}
              onChange={(e) => setForm((f) => ({ ...f, ticketId: e.target.value }))}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={analyzeMutation.isPending}
              style={{
                background: C.textMain,
                border: "none",
                borderRadius: 9,
                padding: "11px 16px",
                color: C.yellow,
                fontWeight: 600,
                fontSize: 13,
                cursor: analyzeMutation.isPending ? "not-allowed" : "pointer",
                opacity: analyzeMutation.isPending ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {analyzeMutation.isPending ? (
                <>
                  <RefreshCw
                    style={{
                      width: 14,
                      height: 14,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Analyzing…
                </>
              ) : (
                <>
                  <Brain style={{ width: 14, height: 14 }} />
                  Run AI Analysis
                </>
              )}
            </button>
          </form>

          {/* ── Result ── */}
          {analyzeResult && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 16px",
                background: C.greenBg,
                border: `0.5px solid ${C.greenBorder}`,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: C.green,
                  marginBottom: 10,
                }}
              >
                ✓ Analysis Result
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <Badge
                  label={`Sentiment: ${analyzeResult.sentiment}`}
                  color={sentimentColor[analyzeResult.sentiment] ?? C.textFaint}
                />
                <Badge
                  label={`Priority: ${analyzeResult.priority}`}
                  color={priorityColor[analyzeResult.priority] ?? C.textFaint}
                />
                <Badge
                  label={`Urgency: ${analyzeResult.urgency}`}
                  color={urgencyColor[analyzeResult.urgency] ?? C.textFaint}
                />
                <Badge label={analyzeResult.category} color={C.blue} />
                {analyzeResult.escalationRequired && (
                  <Badge label="🚨 Escalation Required" color={C.red} />
                )}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: C.textMid,
                  marginBottom: 4,
                }}
              >
                <strong style={{ color: C.textMain }}>Assigned Team:</strong>{" "}
                {analyzeResult.assignedTeam}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: C.textMid,
                  marginBottom: 4,
                }}
              >
                <strong style={{ color: C.textMain }}>Suggested Action:</strong>{" "}
                {analyzeResult.suggestedAction}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint }}>
                Confidence: {Math.round((analyzeResult.confidence ?? 0) * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* Analytics Charts */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Category distribution */}
          <div
            style={{
              ...cardStyle,
              padding: 20,
              flex: 1,
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: C.textMain,
                margin: "0 0 14px",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <TrendingUp style={{ width: 14, height: 14, color: C.yellowDark }} />
              Category Distribution
            </h3>
            {analyticsQuery.isLoading ? (
              <div style={{ color: C.textFaint, fontSize: 12 }}>Loading…</div>
            ) : (
              <BarChart
                data={(analytics?.categoryDistribution ?? []).map((d) => ({
                  label: d.category,
                  count: d.count,
                }))}
              />
            )}
          </div>

          {/* Sentiment + Priority side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ ...cardStyle, padding: 16 }}>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: C.textMain,
                  margin: "0 0 12px",
                }}
              >
                Sentiment
              </h3>
              <BarChart
                data={(analytics?.sentimentDistribution ?? []).map((d) => ({
                  label: d.sentiment,
                  count: d.count,
                }))}
                colorMap={sentimentColor}
              />
            </div>
            <div style={{ ...cardStyle, padding: 16 }}>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: C.textMain,
                  margin: "0 0 12px",
                }}
              >
                Priority
              </h3>
              <BarChart
                data={(analytics?.priorityDistribution ?? []).map((d) => ({
                  label: d.priority,
                  count: d.count,
                }))}
                colorMap={priorityColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── At Risk Customers ── */}
      {atRisk.length > 0 && (
        <div
          style={{
            background: C.redBg,
            border: `0.5px solid ${C.redBorder}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              color: C.red,
              margin: "0 0 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle style={{ width: 16, height: 16 }} />
            At-Risk Customers ({atRisk.length})
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {atRisk.map((c) => (
              <div
                key={c._id}
                style={{
                  background: C.white,
                  border: `0.5px solid ${C.redBorder}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  minWidth: 180,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: C.textMain,
                  }}
                >
                  {c.name}
                </div>
                {c.email && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textFaint,
                    }}
                  >
                    {c.email}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: C.border,
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${c.healthScore}%`,
                        background: c.healthScore < 30 ? C.red : C.amber,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.red,
                      fontWeight: 700,
                    }}
                  >
                    {c.healthScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Intelligence Feed ── */}
      <div
        style={{
          ...cardStyle,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              color: C.textMain,
              margin: 0,
            }}
          >
            Intelligence Feed
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, color: C.textMid, cursor: "pointer" }}
            >
              <option value="">All channels</option>
              {channelOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, color: C.textMid, cursor: "pointer" }}
            >
              <option value="">All priorities</option>
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {intelligenceQuery.isLoading ? (
          <div style={{ color: C.textFaint, fontSize: 13, padding: "20px 0" }}>
            Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div
            style={{
              color: C.textFaint,
              fontSize: 13,
              padding: "32px 0",
              textAlign: "center",
            }}
          >
            No tickets yet. Use the form above to analyze your first ticket.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tickets.map((t) => {
              const isExpanded = expandedId === t._id;
              return (
                <div
                  key={t._id}
                  style={{
                    background: t.escalationRequired ? C.redBg : C.cream,
                    border: `0.5px solid ${t.escalationRequired ? C.redBorder : C.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : t._id)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: priorityColor[t.priority] ?? C.textFaint,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: C.textFaint,
                        flexShrink: 0,
                        width: 80,
                      }}
                    >
                      {t.channel}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: C.textMain,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.message.length > 80 ? t.message.slice(0, 80) + "…" : t.message}
                    </span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Badge
                        label={t.priority}
                        color={priorityColor[t.priority] ?? C.textFaint}
                      />
                      <Badge
                        label={t.sentiment}
                        color={sentimentColor[t.sentiment] ?? C.textFaint}
                      />
                      {t.escalationRequired && (
                        <Badge label="Escalate" color={C.red} />
                      )}
                    </div>
                    <span style={{ color: C.textFaint, flexShrink: 0, display: "flex" }}>
                      {isExpanded ? (
                        <ChevronUp style={{ width: 14, height: 14 }} />
                      ) : (
                        <ChevronDown style={{ width: 14, height: 14 }} />
                      )}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 16px 16px",
                        borderTop: `0.5px solid ${C.border}`,
                        paddingTop: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        {[
                          { label: "Category", value: t.category },
                          { label: "Urgency", value: t.urgency },
                          { label: "Assigned Team", value: t.assignedTeam },
                          {
                            label: "Confidence",
                            value: `${Math.round((t.confidence ?? 0) * 100)}%`,
                          },
                          {
                            label: "Ticket ID",
                            value: t.ticketId,
                          },
                          {
                            label: "Date",
                            value: new Date(t.createdAt).toLocaleString(),
                          },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.textFaint,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: 2,
                                fontWeight: 600,
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: C.textMid,
                                textTransform: "capitalize",
                              }}
                            >
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          padding: "10px 12px",
                          background: C.greenBg,
                          border: `0.5px solid ${C.greenBorder}`,
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: C.green,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 4,
                            fontWeight: 700,
                          }}
                        >
                          Suggested Action
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: C.textMain,
                          }}
                        >
                          {t.suggestedAction}
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          background: C.white,
                          border: `0.5px solid ${C.border}`,
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textFaint,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 4,
                            fontWeight: 600,
                          }}
                        >
                          Original Message
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: C.textMid,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {t.message}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}