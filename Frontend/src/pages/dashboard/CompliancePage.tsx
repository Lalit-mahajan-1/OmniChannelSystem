import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Ban, Bell, ChevronRight, Download, RefreshCw, Lock, AlertCircle, Eye, Zap, Filter, ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { ContentApprovalData, AuditLogData } from "@/lib/api";

const C = {
  cream: "#FFF8E7", creamDeep: "#FFFDF5", white: "#FFFFFF",
  border: "#F0E4C8", textMain: "#1A1A1A", textMid: "#8A8578", textFaint: "#B0A99A",
  yellow: "#FFC107", yellowDark: "#B8860B", yellowBg: "#FFF3CD", yellowBorder: "#FFE082",
  amber: "#854F0B", amberBg: "#FAEEDA", amberBorder: "#FAC775",
  green: "#B8860B", greenBg: "#FFF3CD", greenBorder: "#FFE082",
  blue: "#185FA5", blueBg: "#E6F1FB", blueBorder: "#B5D4F4",
  red: "#A32D2D", redBg: "#FCEBEB", redBorder: "#F7C1C1",
};

const RULES = [
  { label: "TRAI DND Registry", status: "synced", lastCheck: "2m ago", icon: Ban, desc: "Auto-blocks DND numbers before every campaign dispatch" },
  { label: "RBI Consent Framework", status: "active", lastCheck: "Real-time", icon: CheckCircle, desc: "Double opt-in required for all financial product messaging" },
  { label: "DPDP Act 2023", status: "review", lastCheck: "Pending", icon: FileText, desc: "New data protection guidelines require policy update by Apr 1" },
  { label: "TRAI DLT Registration", status: "active", lastCheck: "Verified", icon: Shield, desc: "All message templates registered on Distributed Ledger" },
  { label: "RBI Fair Practice Code", status: "active", lastCheck: "Real-time", icon: Lock, desc: "Communication frequency limits enforced per customer" },
];

const alertMeta: Record<string, { color: string; bg: string; border: string; icon: typeof Shield }> = {
  warning: { color: C.yellowDark, bg: C.yellowBg, border: C.yellowBorder, icon: AlertTriangle },
  success: { color: C.green, bg: C.greenBg, border: C.greenBorder, icon: CheckCircle },
  error: { color: C.red, bg: C.redBg, border: C.redBorder, icon: AlertCircle },
  info: { color: C.blue, bg: C.blueBg, border: C.blueBorder, icon: Bell },
};
const statusMeta: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: C.green, bg: C.greenBg, label: "Active" },
  synced: { color: C.blue, bg: C.blueBg, label: "Synced" },
  review: { color: C.yellowDark, bg: C.yellowBg, label: "Needs Review" },
};
const riskMeta: Record<string, { color: string; bg: string; border: string }> = {
  low: { color: C.green, bg: C.greenBg, border: C.greenBorder },
  medium: { color: C.amber, bg: C.amberBg, border: C.amberBorder },
  high: { color: C.red, bg: C.redBg, border: C.redBorder },
};
const channelMeta: Record<string, { color: string; bg: string; border: string }> = {
  whatsapp: { color: C.green, bg: C.greenBg, border: C.greenBorder },
  email: { color: C.blue, bg: C.blueBg, border: C.blueBorder },
  sms: { color: C.amber, bg: C.amberBg, border: C.amberBorder },
};

const TABS = ["Alerts", "Active Rules", "Pending Approvals"];

function formatTimeAgo(d: string) { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; }
function formatCount(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n); }

function ScoreRing({ score }: { score: number }) {
  const r = 38, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="8" />
      <motion.circle cx="50" cy="50" r={r} fill="none" stroke={score >= 95 ? C.yellow : score >= 80 ? C.amber : C.red} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 1.2, ease: "easeOut" }} />
    </svg>
  );
}

export default function CompliancePage() {
  const [tab, setTab] = useState("Alerts");
  const [alertFilter, setAlertFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ContentApprovalData[]>([]);
  const [approvalStats, setApprovalStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [consentStats, setConsentStats] = useState({ dncCount: 0, marketingCount: 0, totalCount: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [logsRes, pendingRes, statsRes, consentRes] = await Promise.all([
        api.compliance.getAuditLogs(), api.compliance.getApprovals("Pending"),
        api.compliance.getApprovalStats(), api.compliance.getConsentStats(),
      ]);
      setAuditLogs(logsRes.data || []); setPendingApprovals(pendingRes.data || []);
      setApprovalStats(statsRes.data); setConsentStats(consentRes.data);
    } catch (err: any) { setError(err.message || "Failed to load compliance data"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const complianceScore = approvalStats.total > 0 ? Math.round((approvalStats.approved / approvalStats.total) * 1000) / 10 : 100;
  const filteredAlerts = auditLogs.filter(a => alertFilter === "all" || a.type === alertFilter);

  const handleApproval = async (id: string, status: "Approved" | "Rejected") => {
    setActionLoading(id);
    try { await api.compliance.updateApproval(id, status); await fetchAll(); }
    catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100%", overflowY: "auto", background: C.cream, fontFamily: "DM Sans, Inter, sans-serif" }} className="scrollbar-thin">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 6 }}>Regulatory Intelligence</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: C.textMain }}>Compliance</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={fetchAll} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.textMid, cursor: "pointer", fontWeight: 500 }}><RefreshCw style={{ width: 14, height: 14 }} /> Sync rules</button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, borderRadius: 8, border: "none", background: C.textMain, color: C.yellow, cursor: "pointer", fontWeight: 500 }}><Download style={{ width: 14, height: 14 }} /> Export audit</button>
          </div>
        </div>
      </motion.div>

      {error && <div style={{ background: C.redBg, border: `0.5px solid ${C.redBorder}`, borderRadius: 12, padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: C.red }}><AlertCircle style={{ width: 16, height: 16 }} />{error}<button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.red, cursor: "pointer" }}>×</button></div>}

      {/* SCORE + KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px", marginBottom: "24px" }}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden", border: `0.5px solid ${C.yellowBorder}`, background: C.creamDeep, borderRadius: 14 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.yellow},transparent)`, opacity: 0.6 }} />
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 16 }}>Compliance score</div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            {loading ? <div style={{ width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 style={{ width: 32, height: 32, color: C.yellowDark }} className="animate-spin" /></div> : <>
              <ScoreRing score={complianceScore} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 500, color: C.yellowDark }}>{complianceScore}%</div>
            </>}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.green, marginBottom: 8, textTransform: "uppercase", fontWeight: 500 }}>{loading ? "Loading..." : complianceScore >= 95 ? "↑ Excellent standing" : complianceScore >= 80 ? "→ Good standing" : "↓ Needs attention"}</div>
          <div style={{ fontSize: 12, color: C.textMid, textAlign: "center", lineHeight: 1.5 }}>All RBI & TRAI rules<br />passing in real-time</div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[{ label: "DND Blocked", value: loading ? "..." : formatCount(consentStats.dncCount), icon: Ban, color: C.red, bg: C.redBg, sub: "This month" }, { label: "Pending Approvals", value: loading ? "..." : String(approvalStats.pending), icon: Clock, color: C.yellowDark, bg: C.yellowBg, sub: "Need action" }, { label: "Active Consents", value: loading ? "..." : formatCount(consentStats.marketingCount), icon: CheckCircle, color: C.green, bg: C.greenBg, sub: "Opt-in verified" }, { label: "Templates Approved", value: loading ? "..." : String(approvalStats.approved), icon: FileText, color: C.blue, bg: C.blueBg, sub: "This quarter" }].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} style={{ padding: 20, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textFaint }}>{s.label}</span><div style={{ width: 24, height: 24, borderRadius: 6, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon style={{ width: 13, height: 13, color: s.color }} /></div></div>
              <div style={{ fontSize: 28, fontWeight: 500, color: C.textMain, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.textMid }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `0.5px solid ${C.border}` }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 20px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t ? C.yellow : "transparent"}`, color: tab === t ? C.yellowDark : C.textMid, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", marginBottom: "-1px", display: "flex", alignItems: "center", gap: 8 }}>{t}{t === "Pending Approvals" && approvalStats.pending > 0 && <span style={{ padding: "2px 6px", borderRadius: 100, background: C.amberBg, color: C.amber, fontSize: 10, fontWeight: 500 }}>{approvalStats.pending}</span>}</button>)}
      </div>

      {/* ALERTS */}
      {tab === "Alerts" && <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          {["all", "success", "warning", "error", "info"].map(f => { const active = alertFilter === f; const meta = f !== "all" ? alertMeta[f] : null; return <button key={f} onClick={() => setAlertFilter(f)} style={{ padding: "6px 16px", borderRadius: 100, cursor: "pointer", fontSize: 11, fontWeight: 500, textTransform: "uppercase", border: `0.5px solid ${active ? (meta?.color ?? C.textMain) : C.border}`, background: active ? (meta ? meta.bg : C.textMain) : C.white, color: active ? (meta?.color ?? C.yellow) : C.textMid, transition: "all 0.2s" }}>{f}</button>; })}
          <div style={{ marginLeft: "auto", fontSize: 11, color: C.textFaint, display: "flex", alignItems: "center", gap: 6 }}><Filter style={{ width: 12, height: 12 }} /> {filteredAlerts.length} alerts</div>
        </div>
        {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, color: C.textFaint }}><Loader2 style={{ width: 24, height: 24 }} className="animate-spin" /><span style={{ fontSize: 14, marginLeft: 12 }}>Loading audit logs...</span></div>
          : filteredAlerts.length === 0 ? <div style={{ textAlign: "center", padding: 48, color: C.textMid, fontSize: 14 }}>No audit logs found. Activity will appear here as actions are performed.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><AnimatePresence>{filteredAlerts.map((a, i) => { const m = alertMeta[a.type] || alertMeta.info; const Icon = m.icon; const isOpen = expanded === i; return (
              <motion.div key={a._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setExpanded(isOpen ? null : i)} style={{ padding: "16px 20px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.2s", border: isOpen ? `0.5px solid ${m.border}` : `0.5px solid ${C.border}`, borderLeft: `3px solid ${m.color}`, background: isOpen ? C.creamDeep : C.white, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", color: m.color }}><Icon style={{ width: 18, height: 18 }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 15, fontWeight: 500, color: C.textMain }}>{a.title || a.action}</span><span style={{ fontSize: 11, color: C.textFaint, flexShrink: 0, marginLeft: 12 }}>{formatTimeAgo(a.createdAt)}</span></div>
                    <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, margin: 0 }}>{a.description}</p>
                  </div>
                </div>
                <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}><div style={{ marginTop: 16, paddingTop: 16, borderTop: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 12, color: C.textFaint }}>Regulatory basis:</span><span style={{ padding: "4px 12px", borderRadius: 100, background: m.bg, border: `0.5px solid ${m.border}`, fontSize: 10, fontWeight: 500, color: m.color, textTransform: "uppercase" }}>{a.rule || "General"}</span></div><button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 11, background: C.textMain, color: C.yellow, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.actionLabel || "View"} <ChevronRight style={{ width: 12, height: 12 }} /></button></div></motion.div>}</AnimatePresence>
              </motion.div>); })}</AnimatePresence></div>}
      </motion.div>}

      {/* ACTIVE RULES */}
      {tab === "Active Rules" && <motion.div key="rules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ padding: 0, overflow: "hidden", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ position: "relative" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.yellow},transparent)`, opacity: 0.6 }} /></div>
          <div style={{ padding: "16px 24px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.creamDeep }}><span style={{ fontSize: 14, fontWeight: 500, color: C.yellowDark, letterSpacing: "0.1em", textTransform: "uppercase" }}>Regulatory Rule Engine</span><span style={{ fontSize: 11, color: C.textFaint, display: "flex", alignItems: "center", gap: 6 }}><Zap style={{ width: 12, height: 12, color: C.yellowDark }} /> Auto-enforced in real-time</span></div>
          {RULES.map((r, i) => { const sm = statusMeta[r.status]; const Icon = r.icon; return (
            <motion.div key={r.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ padding: "20px 24px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: C.yellowBg, display: "flex", alignItems: "center", justifyContent: "center", color: C.yellowDark }}><Icon style={{ width: 18, height: 18 }} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><span style={{ fontSize: 15, fontWeight: 500, color: C.textMain }}>{r.label}</span><span style={{ padding: "4px 10px", borderRadius: 100, background: sm.bg, fontSize: 9, fontWeight: 500, color: sm.color, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>{r.status === "active" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: sm.color }} />}{sm.label}</span></div>
                <p style={{ fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, paddingRight: 16 }}><div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Last check</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.yellowDark }}>{r.lastCheck}</div></div>
              {r.status === "review" ? <button style={{ padding: "8px 16px", color: C.yellowDark, gap: 6, background: C.yellowBg, display: "flex", alignItems: "center", border: `0.5px solid ${C.yellowBorder}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500 }}><Eye style={{ width: 14, height: 14 }} /> Review</button> : <ExternalLink style={{ width: 16, height: 16, color: C.textFaint, flexShrink: 0 }} />}
            </motion.div>); })}
          <div style={{ padding: 16, background: C.creamDeep, fontSize: 12, color: C.textFaint, textAlign: "center" }}>Rules enforced across WhatsApp · Email · SMS · Voice · All channels</div>
        </div>
      </motion.div>}

      {/* PENDING APPROVALS */}
      {tab === "Pending Approvals" && <motion.div key="approvals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ background: C.yellowBg, border: `0.5px solid ${C.yellowBorder}`, borderRadius: 12, padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 16 }}>
          <AlertTriangle style={{ width: 20, height: 20, color: C.yellowDark, flexShrink: 0, marginTop: 2 }} />
          <div><span style={{ fontSize: 13, fontWeight: 500, color: C.yellowDark, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Action Required</span><p style={{ fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.6 }}>{approvalStats.pending} template{approvalStats.pending !== 1 ? "s are" : " is"} pending approval. TRAI mandates review within <span style={{ color: C.yellowDark, fontWeight: 500 }}>24 hours</span>.</p></div>
        </div>
        {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, color: C.textFaint }}><Loader2 style={{ width: 24, height: 24 }} className="animate-spin" /></div>
          : pendingApprovals.length === 0 ? <div style={{ padding: 48, textAlign: "center", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12 }}><CheckCircle style={{ width: 32, height: 32, color: C.green, margin: "0 auto 12px" }} /><div style={{ color: C.green, fontWeight: 500, marginBottom: 4 }}>All clear</div><div style={{ fontSize: 14, color: C.textMid }}>No pending approvals.</div></div>
            : <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["ID", "Name", "Channel", "Submitted By", "Waiting", "Risk", "Actions"].map(h => <th key={h} style={{ padding: "16px 24px", textAlign: "left", fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", color: C.textFaint, textTransform: "uppercase", borderBottom: `0.5px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>{pendingApprovals.map((p, i) => { const rm = riskMeta[p.risk] || riskMeta.low; const cm = channelMeta[p.channel] || channelMeta.email; const busy = actionLoading === p._id; return (
                  <motion.tr key={p._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                    <td style={{ padding: "16px 24px" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.blue }}>{p._id.slice(-6).toUpperCase()}</span></td>
                    <td style={{ padding: "16px 24px" }}><span style={{ fontSize: 14, color: C.textMain, fontWeight: 500 }}>{p.name || `${p.relatedType} Approval`}</span></td>
                    <td style={{ padding: "16px 24px" }}><span style={{ padding: "4px 10px", borderRadius: 100, background: cm.bg, border: `0.5px solid ${cm.border}`, fontSize: 10, fontWeight: 500, color: cm.color, textTransform: "uppercase" }}>{p.channel}</span></td>
                    <td style={{ padding: "16px 24px" }}><span style={{ fontSize: 13, color: C.textMid }}>{p.submittedBy || "Unknown"}</span></td>
                    <td style={{ padding: "16px 24px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock style={{ width: 12, height: 12, color: C.textFaint }} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: formatTimeAgo(p.createdAt).includes("d") ? C.red : C.yellowDark }}>{formatTimeAgo(p.createdAt)}</span></div></td>
                    <td style={{ padding: "16px 24px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 100, background: rm.bg, border: `0.5px solid ${rm.border}`, fontSize: 10, fontWeight: 500, color: rm.color, textTransform: "uppercase" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: rm.color }} /> {p.risk}</span></td>
                    <td style={{ padding: "16px 24px" }}><div style={{ display: "flex", gap: 8 }}>
                      <button disabled={busy} onClick={e => { e.stopPropagation(); handleApproval(p._id, "Approved"); }} style={{ padding: "6px 12px", color: C.green, gap: 6, background: C.greenBg, border: `0.5px solid ${C.greenBorder}`, display: "flex", alignItems: "center", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500, opacity: busy ? 0.5 : 1 }}>{busy ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <CheckCircle style={{ width: 12, height: 12 }} />} Approve</button>
                      <button disabled={busy} onClick={e => { e.stopPropagation(); handleApproval(p._id, "Rejected"); }} style={{ padding: "6px 12px", color: C.red, gap: 6, background: C.redBg, border: `0.5px solid ${C.redBorder}`, display: "flex", alignItems: "center", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500, opacity: busy ? 0.5 : 1 }}><Ban style={{ width: 12, height: 12 }} /> Reject</button>
                    </div></td>
                  </motion.tr>); })}</tbody>
              </table>
              <div style={{ padding: "16px 24px", borderTop: `0.5px solid ${C.border}`, background: C.creamDeep, fontSize: 12, color: C.textFaint, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>Approved templates are auto-submitted to TRAI DLT portal</span><span style={{ color: C.yellowDark }}>SLA: 24h review window</span></div>
            </div>}
      </motion.div>}
    </div>
  );
}
