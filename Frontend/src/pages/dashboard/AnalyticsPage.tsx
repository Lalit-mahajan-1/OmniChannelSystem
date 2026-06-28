import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TicketAnalytics, AtRiskCustomer, AgentAnalyticsStats } from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  Brain,
  Flame,
  CheckCircle,
  Target,
  RefreshCw,
  HeartPulse,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  healthScore: number;
  healthStatus: string;
  isActive: boolean;
  createdAt: string;
}

interface CustomerResponse {
  success: boolean;
  count: number;
  total: number;
  data: Customer[];
}

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  yellow:   "#FFC107",
  yellowBg: "#FFF3CD",
  yellowBorder: "#FFE082",
  amber:    "#EF9F27",
  cream:    "#FFF8E7",
  border:   "#F0E4C8",
  muted:    "#E8D9B5",
  textMain: "#1A1A1A",
  textMid:  "#8A8578",
  textFaint:"#B0A99A",
  white:    "#FFFFFF",
  danger:   "#E24B4A",
  dangerBg: "#FCEBEB",
  dangerBorder: "#F7C1C1",
  dangerText: "#A32D2D",
  green:    "#B8860B",
  greenBg:  "#FFF3CD",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function DonutChart({
  data,
  centerLabel,
  centerSub,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const circumference = 2 * Math.PI * 40;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
        <circle cx="55" cy="55" r="40" fill="none" stroke={C.border} strokeWidth="16" />
        {data.map((d) => {
          const dash = (d.value / total) * circumference;
          const el = (
            <circle
              key={d.name}
              cx="55" cy="55" r="40"
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 55 55)"
            />
          );
          offset += dash;
          return el;
        })}
        <text x="55" y="51" textAnchor="middle" fontSize="15" fontWeight="500" fill={C.textMain}>{centerLabel}</text>
        <text x="55" y="65" textAnchor="middle" fontSize="10" fill={C.textMid}>{centerSub}</text>
      </svg>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "9px" }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: C.textMid }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: d.color, flexShrink: 0, display: "inline-block" }} />
              {d.name}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: C.textMain }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "12px", color: C.textMid, width: "76px", flexShrink: 0, textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: "8px", background: C.border, borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: "4px" }} />
      </div>
      <span style={{ fontSize: "12px", color: C.textMid, width: "32px", textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, iconBg, iconColor, trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  trend?: { label: string; up: boolean };
}) {
  return (
    <div style={{
      background: C.white,
      border: `0.5px solid ${C.border}`,
      borderRadius: "12px",
      padding: "18px 20px",
    }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        background: iconBg, color: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "14px",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textFaint, marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 500, color: C.textMain, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: C.textMid, marginTop: "5px" }}>{sub}</div>}
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 500, marginTop: "6px", color: trend.up ? C.green : C.dangerText }}>
          <TrendingUp style={{ width: 12, height: 12, transform: trend.up ? "none" : "rotate(180deg)" }} />
          {trend.label}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, icon, children, style }: { title: string; icon: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.white, border: `0.5px solid ${C.border}`,
      borderRadius: "12px", padding: "22px", ...style,
    }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: C.textMain, marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: C.yellow }}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const analyticsQuery = useQuery({
    queryKey: ["analytics-ticket", refreshKey],
    queryFn: () => api.tickets.getAnalytics().then((r) => r.data),
  });

  const atRiskQuery = useQuery({
    queryKey: ["analytics-at-risk", refreshKey],
    queryFn: () => api.tickets.getAtRisk().then((r) => r.data),
  });

  const agentQuery = useQuery({
    queryKey: ["analytics-agents", refreshKey],
    queryFn: () => api.agentAnalytics.getStats().then((r) => r.data),
  });

  const agentStats: AgentAnalyticsStats | undefined = agentQuery.data;

  const customersQuery = useQuery<CustomerResponse>({
    queryKey: ["analytics-customers", refreshKey],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customers?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const analytics: TicketAnalytics | undefined = analyticsQuery.data;
  const atRisk: AtRiskCustomer[] = atRiskQuery.data ?? [];
  const customers = customersQuery.data?.data ?? [];

  const totalTickets = analytics?.categoryDistribution?.reduce((s, c) => s + c.count, 0) ?? 0;
  const activeCustomers = customers.filter((c) => c.isActive).length;
  const avgHealth =
    customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + (c.healthScore ?? 100), 0) / customers.length)
      : 100;
  const healthyCount = customers.filter((c) => c.healthStatus === "Healthy").length;
  const watchlistCount = customers.filter((c) => c.healthStatus === "Watchlist").length;

  const isLoading = analyticsQuery.isLoading || atRiskQuery.isLoading || customersQuery.isLoading;

  const PRIORITY_COLORS: Record<string, string> = {
    low: C.yellow, medium: C.amber, high: "#f97316", critical: C.textMain,
  };
  const SENTIMENT_COLORS: Record<string, string> = {
    positive: C.yellow, neutral: C.textMain, negative: C.danger,
  };

  const categoryData = analytics?.categoryDistribution ?? [];
  const catMax = Math.max(...categoryData.map((c) => c.count), 1);
  const catColors = [C.yellow, C.textMain, C.amber, C.muted, C.danger, C.muted];

  const sentimentData = (analytics?.sentimentDistribution ?? []).map((s) => ({
    name: s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1),
    value: s.count,
    color: SENTIMENT_COLORS[s.sentiment] ?? C.muted,
  }));

  const priorityData = (analytics?.priorityDistribution ?? []).map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
    color: PRIORITY_COLORS[p.priority] ?? C.muted,
  }));

  const healthData = [
    { name: "Healthy", value: healthyCount, color: C.yellow },
    { name: "Watchlist", value: watchlistCount, color: C.amber },
    { name: "At Risk", value: atRisk.length, color: C.danger },
  ];

  return (
    <div style={{ background: C.cream, minHeight: "100vh", padding: "28px 32px", fontFamily: "DM Sans, Inter, sans-serif", color: C.textMain }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.textMain, display: "flex", alignItems: "center", justifyContent: "center", color: C.yellow }}>
            <Activity style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: C.textMain }}>Analytics</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Real-time insights across channels</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.yellowBg, border: `0.5px solid ${C.yellowBorder}`, borderRadius: "100px", padding: "5px 12px", fontSize: "11px", fontWeight: 500, color: "#7A4E00" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, animation: "pulse 2s infinite" }} />
            Live
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 12, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: isLoading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard icon={<Brain style={{ width: 16, height: 16 }} />} label="Total Tickets" value={isLoading ? "—" : totalTickets} sub="AI analyzed" iconBg={C.yellowBg} iconColor="#B8860B" />
        <KpiCard icon={<Flame style={{ width: 16, height: 16 }} />} label="Critical" value={isLoading ? "—" : analytics?.criticalTickets ?? 0} sub="Immediate action" iconBg={C.dangerBg} iconColor={C.dangerText} />
        <KpiCard icon={<AlertTriangle style={{ width: 16, height: 16 }} />} label="Escalated" value={isLoading ? "—" : analytics?.escalatedTickets ?? 0} sub="Needs review" iconBg={C.yellowBg} iconColor="#B8860B" />
        <KpiCard icon={<Users style={{ width: 16, height: 16 }} />} label="Active Customers" value={isLoading ? "—" : activeCustomers} sub={`${atRisk.length} at risk`} iconBg={C.textMain} iconColor={C.yellow} />
        <KpiCard
          icon={<Target style={{ width: 16, height: 16 }} />}
          label="Avg Health"
          value={isLoading ? "—" : avgHealth}
          iconBg={C.greenBg} iconColor={C.green}
          trend={avgHealth >= 75 ? { label: "Healthy", up: true } : { label: "Needs attention", up: false }}
        />
        <KpiCard icon={<CheckCircle style={{ width: 16, height: 16 }} />} label="Resolution Rate" value="—" sub="Coming soon" iconBg="#E1F5EE" iconColor="#0F6E56" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
        {/* Category bar chart */}
        <ChartCard title="Ticket categories" icon={<Activity style={{ width: 14, height: 14 }} />}>
          {isLoading ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>Loading…</div>
          ) : categoryData.length === 0 ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categoryData.map((c, i) => (
                <HBar
                  key={c.category}
                  label={c.category.charAt(0).toUpperCase() + c.category.slice(1)}
                  value={c.count}
                  max={catMax}
                  color={catColors[i % catColors.length]}
                />
              ))}
            </div>
          )}
        </ChartCard>

        {/* Sentiment donut */}
        <ChartCard title="Sentiment breakdown" icon={<Brain style={{ width: 14, height: 14 }} />}>
          {isLoading ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>Loading…</div>
          ) : sentimentData.length === 0 ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>No data yet</div>
          ) : (
            <DonutChart data={sentimentData} centerLabel={`${Math.round((sentimentData.find(s=>s.name==="Positive")?.value??0)/sentimentData.reduce((a,b)=>a+b.value,0)*100)}%`} centerSub="positive" />
          )}
        </ChartCard>

        {/* Priority donut */}
        <ChartCard title="Priority levels" icon={<Flame style={{ width: 14, height: 14 }} />}>
          {isLoading ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>Loading…</div>
          ) : priorityData.length === 0 ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>No data yet</div>
          ) : (
            <DonutChart data={priorityData} centerLabel={`${Math.round((priorityData.find(p=>p.name==="Low")?.value??0)/priorityData.reduce((a,b)=>a+b.value,0)*100)}%`} centerSub="low" />
          )}
        </ChartCard>

        {/* Health bars + mini-stats */}
        <ChartCard title="Customer health" icon={<HeartPulse style={{ width: 14, height: 14 }} />}>
          {isLoading ? (
            <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>Loading…</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <HBar label="Healthy" value={healthyCount} max={Math.max(customers.length, 1)} color={C.yellow} />
                <HBar label="Watchlist" value={watchlistCount} max={Math.max(customers.length, 1)} color={C.amber} />
                <HBar label="At Risk" value={atRisk.length} max={Math.max(customers.length, 1)} color={C.danger} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "Total", val: customers.length, bg: "#F7F2E8", valColor: C.textMain, labelColor: C.textFaint },
                  { label: "Healthy", val: `${customers.length > 0 ? Math.round(healthyCount/customers.length*100) : 0}%`, bg: C.yellowBg, valColor: "#7A4E00", labelColor: "#B8860B" },
                  { label: "At risk", val: `${customers.length > 0 ? Math.round(atRisk.length/customers.length*100) : 0}%`, bg: C.dangerBg, valColor: C.dangerText, labelColor: C.dangerText },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: s.valColor }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: s.labelColor, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* At-Risk */}
      {atRisk.length > 0 && (
        <div style={{ background: C.white, border: `0.5px solid ${C.dangerBorder}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.dangerText, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle style={{ width: 15, height: 15 }} />
            At-risk customers ({atRisk.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {atRisk.slice(0, 6).map((c) => (
              <div key={c._id} style={{ background: C.dangerBg, border: `0.5px solid ${C.dangerBorder}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.textMain, marginBottom: 2 }}>{c.name}</div>
                {c.email && <div style={{ fontSize: 11, color: C.textMid, marginBottom: 10 }}>{c.email}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.healthScore}%`, background: c.healthScore < 30 ? C.danger : C.amber, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.dangerText, width: 24, textAlign: "right" }}>{c.healthScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Performance */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.textMain, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Brain style={{ width: 15, height: 15, color: C.yellow }} />
          AI Agent Performance
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 18 }}>
          <KpiCard icon={<Activity style={{ width: 16, height: 16 }} />} label="Total AI Replies" value={agentQuery.isLoading ? "—" : agentStats?.totalReplies ?? 0} sub="All agents" iconBg={C.yellowBg} iconColor="#B8860B" />
          <KpiCard icon={<CheckCircle style={{ width: 16, height: 16 }} />} label="Success Rate" value={agentQuery.isLoading ? "—" : `${agentStats?.successRate ?? 0}%`} sub={`${agentStats?.failedCount ?? 0} failed`} iconBg="#E1F5EE" iconColor="#0F6E56" />
          <KpiCard icon={<Target style={{ width: 16, height: 16 }} />} label="Avg Response" value={agentQuery.isLoading ? "—" : `${((agentStats?.avgTotalMs ?? 0) / 1000).toFixed(1)}s`} sub="End-to-end latency" iconBg={C.yellowBg} iconColor="#B8860B" />
          <KpiCard icon={<Brain style={{ width: 16, height: 16 }} />} label="AI Generation" value={agentQuery.isLoading ? "—" : `${((agentStats?.avgGenerationMs ?? 0) / 1000).toFixed(1)}s`} sub="LLM inference time" iconBg={C.textMain} iconColor={C.yellow} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <ChartCard title="Replies by agent" icon={<Activity style={{ width: 14, height: 14 }} />}>
            {agentQuery.isLoading ? (
              <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>Loading…</div>
            ) : !agentStats?.byAgent?.length ? (
              <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>No agent activity yet. Send some AI replies first.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {agentStats.byAgent.map((a) => (
                  <HBar key={a._id} label={a._id.charAt(0).toUpperCase() + a._id.slice(1)} value={a.count} max={Math.max(...agentStats.byAgent.map(x => x.count), 1)} color={a._id === 'whatsapp' ? C.yellow : a._id === 'gmail' ? C.amber : C.textMain} />
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Recent agent activity" icon={<Activity style={{ width: 14, height: 14 }} />}>
            {agentQuery.isLoading ? (
              <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>Loading…</div>
            ) : !agentStats?.recentActions?.length ? (
              <div style={{ textAlign: "center", color: C.textFaint, padding: "40px 0" }}>No activity yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {agentStats.recentActions.slice(0, 10).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.status === 'success' ? C.yellow : C.danger, flexShrink: 0 }} />
                    <span style={{ color: C.textMain, fontWeight: 500 }}>{a.agentType}</span>
                    <span style={{ color: C.textFaint, flex: 1 }}>{a.actionType.replace(/_/g, ' ')}</span>
                    <span style={{ color: C.textMid, fontSize: 11 }}>{a.totalLatencyMs ? `${(a.totalLatencyMs / 1000).toFixed(1)}s` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}