import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Mail,
  Smartphone,
  Calendar,
  Sparkles,
  MoreHorizontal,
  Send,
  Eye,
  MousePointer,
  CheckCircle,
  Zap,
  Target,
  Users,
  AlertCircle,
  ChevronRight,
  Play,
  Pause,
  Copy,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ─── campaign data ─── */
const campaigns = [
  {
    id: 1,
    name: "FD Maturity Reminder",
    tag: "Retention",
    desc: "Remind customers of upcoming Fixed Deposit maturity and offer renewal at premium rates.",
    channel: "whatsapp",
    status: "active",
    audience: 4820,
    sent: 12450,
    opened: 8715,
    clicked: 3290,
    converted: 1840,
    scheduled: "Mar 15, 2026",
    aiGenerated: true,
    priority: "high",
  },
  {
    id: 2,
    name: "Personal Loan Pre-Approval",
    tag: "Cross-sell",
    desc: "Notify eligible customers of pre-approved personal loan offers with instant disbursal.",
    channel: "email",
    status: "active",
    audience: 3200,
    sent: 8200,
    opened: 7380,
    clicked: 4920,
    converted: 2100,
    scheduled: "Mar 10, 2026",
    aiGenerated: true,
    priority: "high",
  },
  {
    id: 3,
    name: "KYC Update Drive",
    tag: "Compliance",
    desc: "Alert customers with pending KYC documents before deadline. Compliance-critical.",
    channel: "sms",
    status: "active",
    audience: 9100,
    sent: 9100,
    opened: 8200,
    clicked: 5600,
    converted: 4800,
    scheduled: "Mar 12, 2026",
    aiGenerated: false,
    priority: "critical",
  },
  {
    id: 4,
    name: "Credit Card Cashback Offer",
    tag: "Upsell",
    desc: "Promote 5% cashback on credit card spends above ₹5,000 for inactive cardholders.",
    channel: "whatsapp",
    status: "scheduled",
    audience: 6400,
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    scheduled: "Apr 1, 2026",
    aiGenerated: true,
    priority: "medium",
  },
  {
    id: 5,
    name: "Savings Account Interest Hike",
    tag: "Engagement",
    desc: "Inform dormant savings account holders about increased interest rates to re-engage.",
    channel: "email",
    status: "draft",
    audience: 2300,
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    scheduled: "Apr 5, 2026",
    aiGenerated: false,
    priority: "low",
  },
];

const channelMeta: Record<string, { icon: typeof Mail; color: string; bg: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: "#3ECF6A", bg: "rgba(62,207,106,0.10)", label: "WhatsApp" },
  email: { icon: Mail, color: "#60A5FA", bg: "rgba(96,165,250,0.10)", label: "Email" },
  sms: { icon: Smartphone, color: "#F59E0B", bg: "rgba(245,158,11,0.10)", label: "SMS" },
};

const statusMeta: Record<string, { color: string; bg: string; border: string; label: string; dot?: boolean }> = {
  active: { color: "#3ECF6A", bg: "rgba(62,207,106,0.10)", border: "rgba(62,207,106,0.25)", label: "Active", dot: true },
  scheduled: { color: "#60A5FA", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)", label: "Scheduled" },
  draft: { color: "#94A3B8", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.10)", label: "Draft" },
  paused: { color: "#F59E0B", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", label: "Paused" },
};

const tagMeta: Record<string, { color: string; bg: string }> = {
  Retention: { color: "#3ECF6A", bg: "rgba(62,207,106,0.08)" },
  "Cross-sell": { color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
  Compliance: { color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
  Upsell: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  Engagement: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
};

const priorityMeta: Record<string, { color: string }> = {
  critical: { color: "#EF4444" },
  high: { color: "#F59E0B" },
  medium: { color: "#3ECF6A" },
  low: { color: "#94A3B8" },
};

const FILTERS = ["All", "Active", "Scheduled", "Draft"];

function MiniBar({ val, max, color }: { val: number; max: number; color: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "5px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (val / max) * 100)}%` }}
        transition={{ duration: 0.8 }}
        style={{ height: "100%", background: color, borderRadius: "999px" }}
      />
    </div>
  );
}

function metric(sent: number, value: number) {
  return sent > 0 ? Math.round((value / sent) * 100) : 0;
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<number | null>(1);

  const filtered = useMemo(
    () => campaigns.filter((c) => (filter === "All" ? true : c.status === filter.toLowerCase())),
    [filter]
  );

  const totals = useMemo(() => {
    const sent = campaigns.reduce((a, c) => a + c.sent, 0);
    const opened = campaigns.reduce((a, c) => a + c.opened, 0);
    const clicked = campaigns.reduce((a, c) => a + c.clicked, 0);
    const converted = campaigns.reduce((a, c) => a + c.converted, 0);
    const uniqueReach = campaigns.reduce((a, c) => a + c.audience, 0);
    const openRate = sent ? ((opened / sent) * 100).toFixed(1) : "0.0";
    const ctr = sent ? ((clicked / sent) * 100).toFixed(1) : "0.0";
    const aiGenerated = campaigns.filter((c) => c.aiGenerated).length;

    return {
      sent,
      openRate,
      ctr,
      converted,
      uniqueReach,
      aiGenerated,
    };
  }, []);

  const STATS = [
    { label: "Total Sent", value: totals.sent.toLocaleString(), icon: Send, color: "#3ECF6A", hint: "Messages delivered" },
    { label: "Avg Open Rate", value: `${totals.openRate}%`, icon: Eye, color: "#60A5FA", hint: "Average open rate" },
    { label: "Avg CTR", value: `${totals.ctr}%`, icon: MousePointer, color: "#A78BFA", hint: "Average click-through rate" },
    { label: "AI Generated", value: `${totals.aiGenerated} / ${campaigns.length}`, icon: Sparkles, color: "#F59E0B", hint: "AI drafted campaigns" },
    { label: "Conversions", value: totals.converted.toLocaleString(), icon: Target, color: "#F59E0B", hint: "Customers who acted" },
    { label: "Reach", value: totals.uniqueReach.toLocaleString(), icon: Users, color: "#60A5FA", hint: "Targeted audience" },
  ];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#06090f" }}>
      {/* MAIN */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: "26px 28px 24px",
        }}
        className="scrollbar-thin"
      >
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "22px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="section-eyebrow">OUTREACH ENGINE</div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Campaigns
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary-db"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <Plus style={{ width: "15px", height: "15px" }} />
            NEW CAMPAIGN
          </motion.button>
        </motion.div>

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0,1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="stat-card-db"
              style={{
                padding: "16px",
                minHeight: "92px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              title={s.hint}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="section-eyebrow" style={{ color: "#475569", margin: 0 }}>
                  {s.label}
                </span>
                <s.icon style={{ width: "13px", height: "13px", color: s.color }} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#F8FAFC", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* FILTERS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  border: `1px solid ${active ? "rgba(62,207,106,0.28)" : "transparent"}`,
                  background: active ? "rgba(62,207,106,0.10)" : "rgba(255,255,255,0.05)",
                  color: active ? "#3ECF6A" : "#94A3B8",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {f}
                {f !== "All" && (
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "999px",
                      background: active ? "rgba(62,207,106,0.14)" : "rgba(255,255,255,0.08)",
                      color: active ? "#3ECF6A" : "#E2E8F0",
                      fontSize: "10px",
                    }}
                  >
                    {campaigns.filter((c) => c.status === f.toLowerCase()).length}
                  </span>
                )}
              </button>
            );
          })}

          <div
            style={{
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "#475569",
            }}
          >
            {filtered.length} CAMPAIGNS
          </div>
        </div>

        {/* CAMPAIGN LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AnimatePresence>
            {filtered.map((c, i) => {
              const cm = channelMeta[c.channel];
              const sm = statusMeta[c.status];
              const tm = tagMeta[c.tag];
              const pm = priorityMeta[c.priority];
              const CIcon = cm.icon;

              const openRate = metric(c.sent, c.opened);
              const clickRate = metric(c.sent, c.clicked);
              const convRate = metric(c.sent, c.converted);
              const isSelected = selected === c.id;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(isSelected ? null : c.id)}
                  style={{
                    padding: "18px 18px 16px",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.2s",
                    borderLeft: `3px solid ${pm.color}`,
                    borderRadius: "14px",
                    border: isSelected ? "1px solid rgba(62,207,106,0.20)" : "1px solid rgba(255,255,255,0.07)",
                    background: isSelected ? "rgba(62,207,106,0.025)" : "rgba(255,255,255,0.018)",
                    boxShadow: isSelected ? "0 0 0 1px rgba(62,207,106,0.03) inset" : "none",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: "linear-gradient(90deg, transparent, #3ECF6A, transparent)",
                        opacity: 0.5,
                      }}
                    />
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "52px 1.5fr 0.95fr 92px", gap: "16px", alignItems: "center" }}>
                    {/* channel */}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        flexShrink: 0,
                        background: cm.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: cm.color,
                      }}
                    >
                      <CIcon style={{ width: "18px", height: "18px" }} />
                    </div>

                    {/* left content */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "16px", color: "#F8FAFC", lineHeight: 1.3 }}>{c.name}</span>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: sm.bg,
                            border: `1px solid ${sm.border}`,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: sm.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {sm.dot && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sm.color }} />}
                          {sm.label}
                        </span>

                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: tm.bg,
                            border: `1px solid ${tm.color}22`,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: tm.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {c.tag}
                        </span>

                        {c.aiGenerated && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "999px",
                              background: "rgba(245,158,11,0.08)",
                              border: "1px solid rgba(245,158,11,0.20)",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "#F59E0B",
                              textTransform: "uppercase",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Sparkles style={{ width: 10, height: 10 }} />
                            AI Drafted
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          color: "#8EA0B7",
                          lineHeight: 1.55,
                          margin: 0,
                          maxWidth: "720px",
                        }}
                      >
                        {c.desc}
                      </p>
                    </div>

                    {/* metrics / schedule */}
                    <div>
                      {c.sent > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
                          {[
                            { label: "Sent", val: c.sent.toLocaleString(), color: "#94A3B8" },
                            { label: "Open", val: `${openRate}%`, color: "#3ECF6A" },
                            { label: "CTR", val: `${clickRate}%`, color: "#60A5FA" },
                            { label: "Conv", val: c.converted.toLocaleString(), color: "#F59E0B" },
                          ].map((m) => (
                            <div key={m.label} style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "15px", color: m.color, marginBottom: "4px" }}>{m.val}</div>
                              <div style={{ fontSize: "9px", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.label}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "6px",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "11px",
                            color: "#64748B",
                          }}
                        >
                          <Calendar style={{ width: 12, height: 12 }} />
                          {c.scheduled}
                        </div>
                      )}
                    </div>

                    {/* actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
                      {c.status === "active" && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          style={ghostBtn("#F59E0B", "rgba(245,158,11,0.10)", "rgba(245,158,11,0.20)")}
                        >
                          <Pause style={{ width: 12, height: 12 }} />
                          Pause
                        </button>
                      )}

                      {c.status === "draft" && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          style={ghostBtn("#3ECF6A", "rgba(62,207,106,0.10)", "rgba(62,207,106,0.22)")}
                        >
                          <Play style={{ width: 12, height: 12 }} />
                          Launch
                        </button>
                      )}

                      {c.status === "scheduled" && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          style={ghostBtn("#60A5FA", "rgba(96,165,250,0.10)", "rgba(96,165,250,0.22)")}
                        >
                          <Calendar style={{ width: 12, height: 12 }} />
                          Edit
                        </button>
                      )}

                      <button
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.07)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#94A3B8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <MoreHorizontal style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            marginTop: "18px",
                            paddingTop: "18px",
                            borderTop: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "14px" }}>
                            {[
                              {
                                label: "Open Rate",
                                val: openRate,
                                max: 100,
                                color: "#3ECF6A",
                                suffix: "%",
                                desc: `${c.opened.toLocaleString()} opens from ${c.sent.toLocaleString()} sends`,
                              },
                              {
                                label: "Click Through",
                                val: clickRate,
                                max: 100,
                                color: "#60A5FA",
                                suffix: "%",
                                desc: `${c.clicked.toLocaleString()} users clicked CTA`,
                              },
                              {
                                label: "Conversion",
                                val: convRate,
                                max: 100,
                                color: "#F59E0B",
                                suffix: "%",
                                desc: `${c.converted.toLocaleString()} converted customers`,
                              },
                            ].map((m) => (
                              <div
                                key={m.label}
                                style={{
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                  borderRadius: "10px",
                                  padding: "14px",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                  <span style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</span>
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: m.color }}>
                                    {m.val}
                                    {m.suffix}
                                  </span>
                                </div>
                                <MiniBar val={m.val} max={m.max} color={m.color} />
                                <div style={{ fontSize: "11px", color: "#8EA0B7", marginTop: "8px", lineHeight: 1.45 }}>{m.desc}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                            <div style={metaLine}>
                              <Calendar style={{ width: 12, height: 12 }} />
                              Launched {c.scheduled}
                            </div>
                            <div style={metaLine}>
                              <Users style={{ width: 12, height: 12 }} />
                              {c.audience.toLocaleString()} targeted
                            </div>
                            <div style={{ ...metaLine, color: cm.color }}>
                              <CIcon style={{ width: 12, height: 12 }} />
                              via {cm.label}
                            </div>
                            <div style={{ ...metaLine, color: pm.color }}>
                              <AlertCircle style={{ width: 12, height: 12 }} />
                              {c.priority} priority
                            </div>

                            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                              <button style={ghostBtn("#94A3B8", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.08)")}>
                                <Copy style={{ width: 12, height: 12 }} />
                                Duplicate
                              </button>
                              <button
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 14px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(62,207,106,0.24)",
                                  background: "rgba(62,207,106,0.10)",
                                  color: "#3ECF6A",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Full Report
                                <ChevronRight style={{ width: 12, height: 12 }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: "330px",
          flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          background: "#0B1118",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        className="scrollbar-thin"
      >
        <div
          style={{
            padding: "22px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "linear-gradient(180deg, rgba(62,207,106,0.03), rgba(255,255,255,0))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Activity style={{ width: 16, height: 16, color: "#3ECF6A" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#3ECF6A", letterSpacing: "0.10em", textTransform: "uppercase" }}>
              AI Suggestions
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
            Auto-generated outreach strategies based on current customer engagement patterns.
          </p>
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { title: "Home Loan Balance Transfer", tag: "Cross-sell", tagColor: "#60A5FA", insight: "142 customers have loans at competitor rates >8.5%", reach: "142 customers", channel: "WhatsApp", impact: "High" },
            { title: "Dormant Account Revival", tag: "Retention", tagColor: "#3ECF6A", insight: "389 accounts with no transactions in 90+ days", reach: "389 customers", channel: "SMS + Email", impact: "Medium" },
            { title: "RD Scheme Promotion", tag: "Upsell", tagColor: "#F59E0B", insight: "Savings customers who haven't explored recurring deposits", reach: "1,200 customers", channel: "WhatsApp", impact: "High" },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.05 }}
              style={{
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.018)",
                borderLeft: `2px solid ${s.tagColor}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.4 }}>{s.title}</span>
                <span
                  style={{
                    flexShrink: 0,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: `${s.tagColor}14`,
                    border: `1px solid ${s.tagColor}22`,
                    fontSize: "10px",
                    fontWeight: 700,
                    color: s.tagColor,
                    textTransform: "uppercase",
                  }}
                >
                  {s.tag}
                </span>
              </div>

              <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.55, marginBottom: "12px" }}>{s.insight}</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                <span style={railMeta}>
                  <Users style={{ width: 12, height: 12 }} />
                  {s.reach}
                </span>
                <span style={railMeta}>
                  <MessageSquare style={{ width: 12, height: 12 }} />
                  {s.channel}
                </span>
                <span style={{ ...railMeta, color: s.tagColor }}>
                  <ArrowUpRight style={{ width: 12, height: 12 }} />
                  Impact: {s.impact}
                </span>
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  background: "rgba(62,207,106,0.08)",
                  border: "1px solid rgba(62,207,106,0.20)",
                  color: "#3ECF6A",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  outline: "none",
                }}
              >
                <Zap style={{ width: 13, height: 13 }} />
                Draft in AI
              </button>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            padding: "18px 20px 22px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <AlertCircle style={{ width: 14, height: 14, color: "#64748B" }} />
            <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748B", fontWeight: 700, letterSpacing: "0.08em" }}>
              Best Practice
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.65, margin: 0 }}>
            WhatsApp campaigns maintain <strong style={{ color: "#3ECF6A", fontWeight: 700 }}>3× higher conversion rates</strong> compared to email for urgent financial alerts.
          </p>
        </div>
      </div>
    </div>
  );
}

const metaLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "11px",
  color: "#64748B",
};

const railMeta: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10px",
  color: "#64748B",
};

function ghostBtn(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    fontSize: "11px",
    color,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
}