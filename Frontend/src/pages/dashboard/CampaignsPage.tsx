import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageSquare, Mail, Smartphone, Calendar, Sparkles, MoreHorizontal,
  Send, Eye, MousePointer, CheckCircle, Zap, Target, Users, AlertCircle,
  ChevronRight, Play, Pause, Copy, Activity, ArrowUpRight, X, Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Campaign } from "@/lib/api";

/* ─── palette — matches the rest of the app ─── */
const C = {
  cream: "#FFF8E7", creamDeep: "#FFFDF5", white: "#FFFFFF",
  border: "#F0E4C8", textMain: "#1A1A1A", textMid: "#8A8578", textFaint: "#B0A99A",
  yellow: "#FFC107", yellowDark: "#B8860B", yellowBg: "#FFF3CD", yellowBorder: "#FFE082",
  amber: "#EF9F27", amberBg: "#FAEEDA", amberBorder: "#FAC775",
  green: "#B8860B", greenBg: "#FFF3CD", greenBorder: "#FFE082",
  blue: "#185FA5", blueBg: "#E6F1FB", blueBorder: "#B5D4F4",
  purple: "#534AB7", purpleBg: "#EEEDFE",
  red: "#A32D2D", redBg: "#FCEBEB", redBorder: "#F7C1C1",
};

function typeToChannel(type: Campaign["type"]): string {
  switch (type) { case "WhatsApp": return "whatsapp"; case "Email": return "email"; case "SMS": return "sms"; default: return "email"; }
}
function statusToKey(status: Campaign["status"]): string {
  switch (status) { case "Active": return "active"; case "Draft": return "draft"; case "Pending Approval": case "Approved": return "scheduled"; case "Completed": return "completed"; case "Rejected": return "draft"; default: return "draft"; }
}
function filterMatches(filter: string, s: Campaign["status"]): boolean { return filter === "All" || statusToKey(s) === filter.toLowerCase(); }

const channelMeta: Record<string, { icon: typeof Mail; color: string; bg: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: C.green, bg: C.greenBg, label: "WhatsApp" },
  email: { icon: Mail, color: C.blue, bg: C.blueBg, label: "Email" },
  sms: { icon: Smartphone, color: C.yellowDark, bg: C.amberBg, label: "SMS" },
};
const statusMeta: Record<string, { color: string; bg: string; border: string; label: string; dot?: boolean }> = {
  active: { color: C.green, bg: C.greenBg, border: C.greenBorder, label: "Active", dot: true },
  scheduled: { color: C.blue, bg: C.blueBg, border: C.blueBorder, label: "Scheduled" },
  draft: { color: C.textMid, bg: C.border, border: C.border, label: "Draft" },
  paused: { color: C.yellowDark, bg: C.yellowBg, border: C.yellowBorder, label: "Paused" },
  completed: { color: C.green, bg: C.greenBg, border: C.greenBorder, label: "Completed" },
};

const FILTERS = ["All", "Active", "Scheduled", "Draft"];

function MiniBar({ val, max, color }: { val: number; max: number; color: string }) {
  return (
    <div style={{ width: "100%", height: "5px", borderRadius: "999px", background: C.border, overflow: "hidden" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (val / max) * 100)}%` }} transition={{ duration: 0.8 }} style={{ height: "100%", background: color, borderRadius: "999px" }} />
    </div>
  );
}
function pct(sent: number, value: number) { return sent > 0 ? Math.round((value / sent) * 100) : 0; }
function ghostBtn(color: string, bg: string, border: string): React.CSSProperties {
  return { display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", fontSize: "11px", color, background: bg, border: `0.5px solid ${border}`, borderRadius: "8px", cursor: "pointer", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"Email" | "WhatsApp" | "SMS">("Email");
  const [formContent, setFormContent] = useState("");
  const [formSegment, setFormSegment] = useState("");
  const [formScheduled, setFormScheduled] = useState("");

  const fetchCampaigns = useCallback(async () => {
    try { setError(null); const data = await api.marketing.getCampaigns(); setCampaigns(Array.isArray(data) ? data : []); }
    catch (err: any) { setError(err.message || "Failed to load campaigns"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filtered = useMemo(() => campaigns.filter(c => filterMatches(filter, c.status)), [filter, campaigns]);
  const totals = useMemo(() => {
    const sent = campaigns.reduce((a, c) => a + (c.stats?.sent || 0), 0);
    const delivered = campaigns.reduce((a, c) => a + (c.stats?.delivered || 0), 0);
    const read = campaigns.reduce((a, c) => a + (c.stats?.read || 0), 0);
    const failed = campaigns.reduce((a, c) => a + (c.stats?.failed || 0), 0);
    return { sent, delivered, read, failed, openRate: sent ? ((read / sent) * 100).toFixed(1) : "0.0", deliveryRate: sent ? ((delivered / sent) * 100).toFixed(1) : "0.0", total: campaigns.length };
  }, [campaigns]);

  const STATS = [
    { label: "Total Sent", value: totals.sent.toLocaleString(), icon: Send, color: C.yellowDark, bg: C.yellowBg },
    { label: "Delivered", value: totals.delivered.toLocaleString(), icon: CheckCircle, color: C.blue, bg: C.blueBg },
    { label: "Open Rate", value: `${totals.openRate}%`, icon: Eye, color: C.purple, bg: C.purpleBg },
    { label: "Delivery Rate", value: `${totals.deliveryRate}%`, icon: MousePointer, color: C.yellowDark, bg: C.amberBg },
    { label: "Failed", value: totals.failed.toLocaleString(), icon: AlertCircle, color: C.red, bg: C.redBg },
    { label: "Campaigns", value: `${totals.total}`, icon: Target, color: C.blue, bg: C.blueBg },
  ];

  const [draftingAI, setDraftingAI] = useState<string | null>(null);
  const API_ROOT = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const AGENT_BASE = import.meta.env.VITE_AGENT_URL ? import.meta.env.VITE_AGENT_URL + "/agent" : API_ROOT + "/agent";

  async function handleDraftInAI(title: string, channel: string, insight: string) {
    setDraftingAI(title);
    try {
      const channelType = channel.toLowerCase().includes("whatsapp") ? "WhatsApp" : channel.toLowerCase().includes("sms") ? "SMS" : "Email";
      const res = await fetch(`${AGENT_BASE}/generate-omni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: `Draft a ${channelType} campaign message for: ${title}. Context: ${insight}. Write a concise, professional marketing message for bank customers.` }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setFormName(title);
        setFormType(channelType as "Email" | "WhatsApp" | "SMS");
        setFormContent(data.suggestion);
        setFormSegment("");
        setShowModal(true);
      }
    } catch {
      setFormName(title);
      setFormType(channelType as "Email" | "WhatsApp" | "SMS");
      setFormContent(`Draft campaign message for: ${title}. ${insight}`);
      setShowModal(true);
    } finally {
      setDraftingAI(null);
    }
  }

  async function handleCreate() {
    if (!formName.trim() || !formContent.trim()) return;
    setCreating(true);
    try {
      const segments = formSegment.split(",").map(s => s.trim()).filter(Boolean);
      await api.marketing.createCampaign({ name: formName, type: formType, content: formContent, targetSegment: segments.length ? segments : ["General"], ...(formScheduled ? { scheduledAt: formScheduled } : {}) });
      setShowModal(false); setFormName(""); setFormType("Email"); setFormContent(""); setFormSegment(""); setFormScheduled("");
      await fetchCampaigns();
    } catch (err: any) { alert(err.message || "Failed to create campaign"); }
    finally { setCreating(false); }
  }

  async function handleLaunch(e: React.MouseEvent, id: string) {
    e.stopPropagation(); setActionLoading(id);
    try { await api.marketing.requestApproval(id); await fetchCampaigns(); }
    catch (err: any) { alert(err.message || "Failed to submit for approval"); }
    finally { setActionLoading(null); }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: C.cream, fontFamily: "DM Sans, Inter, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "26px 28px 24px" }} className="scrollbar-thin">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "22px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 6 }}>Outreach Engine</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: C.textMain }}>Campaigns</h1>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "12px", fontWeight: 500, borderRadius: "100px", background: C.textMain, color: C.yellow, border: "none", cursor: "pointer" }}>
            <Plus style={{ width: "15px", height: "15px" }} /> New campaign
          </motion.button>
        </motion.div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: "12px", marginBottom: "20px" }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ padding: "16px", minHeight: "92px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textFaint }}>{s.label}</span>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon style={{ width: "12px", height: "12px", color: s.color }} /></div>
              </div>
              <div style={{ fontSize: "26px", fontWeight: 500, color: C.textMain, lineHeight: 1, letterSpacing: "-0.02em" }}>{loading ? "..." : s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {FILTERS.map(f => {
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: "999px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.04em", fontWeight: 500, border: `0.5px solid ${active ? C.textMain : C.border}`, background: active ? C.textMain : C.white, color: active ? C.yellow : C.textMid, transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px" }}>
                {f}
                {f !== "All" && <span style={{ padding: "2px 7px", borderRadius: "999px", background: active ? "rgba(255,193,7,0.18)" : C.yellowBg, color: active ? C.yellow : C.yellowDark, fontSize: "10px" }}>{campaigns.filter(c => filterMatches(f, c.status)).length}</span>}
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", fontSize: "11px", color: C.textFaint }}>{filtered.length} campaigns</div>
        </div>

        {/* STATES */}
        {loading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 8, color: C.textFaint }}><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /><span style={{ fontSize: 12 }}>Loading campaigns...</span></div>}
        {error && !loading && <div style={{ padding: 24, borderRadius: 14, border: `0.5px solid ${C.redBorder}`, background: C.redBg, textAlign: "center" }}><AlertCircle style={{ width: 24, height: 24, color: C.red, marginBottom: 8 }} /><p style={{ color: C.red, fontSize: 14, margin: "0 0 12px" }}>{error}</p><button onClick={() => { setLoading(true); fetchCampaigns(); }} style={{ ...ghostBtn(C.red, C.redBg, C.redBorder) }}>Retry</button></div>}
        {!loading && !error && campaigns.length === 0 && <div style={{ textAlign: "center", padding: "80px 0" }}><Target style={{ width: 40, height: 40, color: C.textFaint, marginBottom: 12 }} /><p style={{ color: C.textMid, fontSize: 15, margin: "0 0 8px" }}>No campaigns yet</p><p style={{ color: C.textFaint, fontSize: 13, margin: 0 }}>Create your first campaign to get started.</p></div>}

        {/* CAMPAIGN LIST */}
        {!loading && !error && <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AnimatePresence>
            {filtered.map((c, i) => {
              const channel = typeToChannel(c.type);
              const uiStatus = statusToKey(c.status);
              const cm = channelMeta[channel] || channelMeta.email;
              const sm = statusMeta[uiStatus] || statusMeta.draft;
              const CIcon = cm.icon;
              const sent = c.stats?.sent || 0; const delivered = c.stats?.delivered || 0; const read = c.stats?.read || 0; const failed = c.stats?.failed || 0;
              const openRate = pct(sent, read); const deliveryRate = pct(sent, delivered);
              const isSelected = selected === c._id;

              return (
                <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(isSelected ? null : c._id)}
                  style={{ padding: "18px 18px 16px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.2s", borderRadius: "14px", border: isSelected ? `0.5px solid ${C.yellowBorder}` : `0.5px solid ${C.border}`, background: isSelected ? C.creamDeep : C.white }}>
                  {isSelected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)`, opacity: 0.6 }} />}
                  <div style={{ display: "grid", gridTemplateColumns: "52px 1.5fr 0.95fr 92px", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: cm.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cm.color }}><CIcon style={{ width: "18px", height: "18px" }} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 500, fontSize: "16px", color: C.textMain, lineHeight: 1.3 }}>{c.name}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", borderRadius: "999px", background: sm.bg, border: `0.5px solid ${sm.border}`, fontSize: "9px", fontWeight: 500, color: sm.color, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                          {sm.dot && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sm.color }} />}{c.status}
                        </span>
                        {c.targetSegment?.[0] && <span style={{ padding: "3px 8px", borderRadius: "999px", background: C.blueBg, border: `0.5px solid ${C.blueBorder}`, fontSize: "9px", fontWeight: 500, color: C.blue, textTransform: "uppercase" }}>{c.targetSegment[0]}</span>}
                      </div>
                      <p style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.55, margin: 0, maxWidth: "720px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</p>
                    </div>
                    <div>
                      {sent > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
                          {[{ label: "Sent", val: sent.toLocaleString(), color: C.textMid }, { label: "Delivered", val: delivered.toLocaleString(), color: C.yellowDark }, { label: "Read", val: `${openRate}%`, color: C.purple }, { label: "Failed", val: failed.toLocaleString(), color: C.red }].map(m => (
                            <div key={m.label} style={{ textAlign: "center" }}><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: "15px", color: m.color, marginBottom: "4px" }}>{m.val}</div><div style={{ fontSize: "9px", color: C.textFaint, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.label}</div></div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", fontSize: "11px", color: C.textFaint }}><Calendar style={{ width: 12, height: 12 }} />{c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not scheduled"}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
                      {uiStatus === "active" && <button onClick={e => e.stopPropagation()} style={ghostBtn(C.yellowDark, C.yellowBg, C.yellowBorder)}><Pause style={{ width: 12, height: 12 }} />Pause</button>}
                      {uiStatus === "draft" && <button onClick={e => handleLaunch(e, c._id)} disabled={actionLoading === c._id} style={ghostBtn(C.green, C.greenBg, C.greenBorder)}>{actionLoading === c._id ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Play style={{ width: 12, height: 12 }} />}Launch</button>}
                      {uiStatus === "scheduled" && <button onClick={e => e.stopPropagation()} style={ghostBtn(C.blue, C.blueBg, C.blueBorder)}><Calendar style={{ width: 12, height: 12 }} />Edit</button>}
                      <button onClick={e => e.stopPropagation()} style={{ width: 32, height: 32, borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.cream, color: C.textMid, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><MoreHorizontal style={{ width: 15, height: 15 }} /></button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.24 }} style={{ overflow: "hidden" }}>
                        <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: `0.5px solid ${C.border}` }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "14px" }}>
                            {[{ label: "Read Rate", val: openRate, max: 100, color: C.yellowDark, barColor: C.yellow, suffix: "%", desc: `${read.toLocaleString()} read from ${sent.toLocaleString()} sent` }, { label: "Delivery Rate", val: deliveryRate, max: 100, color: C.purple, barColor: "#7F77DD", suffix: "%", desc: `${delivered.toLocaleString()} delivered` }, { label: "Failure Rate", val: pct(sent, failed), max: 100, color: C.red, barColor: C.red, suffix: "%", desc: `${failed.toLocaleString()} failed` }].map(m => (
                              <div key={m.label} style={{ background: C.cream, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span style={{ fontSize: "10px", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 500, color: m.color }}>{m.val}{m.suffix}</span></div>
                                <MiniBar val={m.val} max={m.max} color={m.barColor} />
                                <div style={{ fontSize: "11px", color: C.textMid, marginTop: "8px", lineHeight: 1.45 }}>{m.desc}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textFaint }}><Calendar style={{ width: 12, height: 12 }} />Created {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textFaint }}><Users style={{ width: 12, height: 12 }} />{c.targetSegment?.join(", ") || "General"}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: cm.color }}><CIcon style={{ width: 12, height: 12 }} />via {cm.label}</div>
                            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                              <button style={ghostBtn(C.textMid, C.cream, C.border)}><Copy style={{ width: 12, height: 12 }} />Duplicate</button>
                              <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: `0.5px solid ${C.textMain}`, background: C.textMain, color: C.yellow, fontSize: "11px", fontWeight: 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Report<ChevronRight style={{ width: 12, height: 12 }} /></button>
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
        </div>}
      </div>

      {/* RIGHT PANEL — AI Suggestions */}
      <div style={{ width: "330px", flexShrink: 0, borderLeft: `0.5px solid ${C.border}`, background: C.creamDeep, display: "flex", flexDirection: "column", overflowY: "auto" }} className="scrollbar-thin">
        <div style={{ padding: "22px 20px", borderBottom: `0.5px solid ${C.border}`, background: C.yellowBg }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}><Activity style={{ width: 16, height: 16, color: C.yellowDark }} /><span style={{ fontSize: "12px", fontWeight: 500, color: C.yellowDark, letterSpacing: "0.10em", textTransform: "uppercase" }}>AI Suggestions</span></div>
          <p style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.6, margin: 0 }}>Auto-generated outreach strategies based on current customer engagement patterns.</p>
        </div>
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {[{ title: "Home Loan Balance Transfer", tag: "Cross-sell", tagColor: C.blue, tagBg: C.blueBg, insight: "142 customers have loans at competitor rates >8.5%", reach: "142 customers", channel: "WhatsApp", impact: "High" }, { title: "Dormant Account Revival", tag: "Retention", tagColor: C.green, tagBg: C.greenBg, insight: "389 accounts with no transactions in 90+ days", reach: "389 customers", channel: "Email", impact: "Medium" }, { title: "RD Scheme Promotion", tag: "Upsell", tagColor: C.yellowDark, tagBg: C.amberBg, insight: "Savings customers who haven't explored recurring deposits", reach: "1,200 customers", channel: "WhatsApp", impact: "High" }].map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 + i * 0.05 }}
              style={{ padding: "16px", borderRadius: "14px", border: `0.5px solid ${C.border}`, background: C.white, borderLeft: `2px solid ${s.tagColor}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: C.textMain, lineHeight: 1.4 }}>{s.title}</span>
                <span style={{ flexShrink: 0, padding: "3px 8px", borderRadius: "999px", background: s.tagBg, fontSize: "10px", fontWeight: 500, color: s.tagColor, textTransform: "uppercase" }}>{s.tag}</span>
              </div>
              <p style={{ fontSize: "12px", color: C.textMid, lineHeight: 1.55, marginBottom: "12px" }}>{s.insight}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.textFaint }}><Users style={{ width: 12, height: 12 }} />{s.reach}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.textFaint }}><MessageSquare style={{ width: 12, height: 12 }} />{s.channel}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: s.tagColor }}><ArrowUpRight style={{ width: 12, height: 12 }} />Impact: {s.impact}</span>
              </div>
              <button
                onClick={() => handleDraftInAI(s.title, s.channel, s.insight)}
                disabled={draftingAI === s.title}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", background: C.textMain, border: "none", color: C.yellow, fontSize: "11px", fontWeight: 500, cursor: draftingAI === s.title ? "wait" : "pointer", letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: draftingAI === s.title ? 0.6 : 1 }}>
                {draftingAI === s.title ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Zap style={{ width: 13, height: 13 }} />}
                {draftingAI === s.title ? "Generating..." : "Draft in AI"}
              </button>
            </motion.div>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: "18px 20px 22px", borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}><AlertCircle style={{ width: 14, height: 14, color: C.textFaint }} /><span style={{ fontSize: "11px", textTransform: "uppercase", color: C.textFaint, fontWeight: 500, letterSpacing: "0.08em" }}>Best Practice</span></div>
          <p style={{ fontSize: "12px", color: C.textMid, lineHeight: 1.65, margin: 0 }}>WhatsApp campaigns maintain <strong style={{ color: C.yellowDark, fontWeight: 500 }}>3x higher conversion rates</strong> compared to email for urgent financial alerts.</p>
        </div>
      </div>

      {/* NEW CAMPAIGN MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(26,26,26,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 520, maxHeight: "90vh", overflowY: "auto", background: C.white, border: `0.5px solid ${C.yellowBorder}`, boxShadow: "0 24px 60px rgba(0,0,0,0.18)", borderRadius: 18, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h2 style={{ color: C.textMain, fontSize: 20, fontWeight: 700, margin: 0 }}>New Campaign</h2>
                <button onClick={() => setShowModal(false)} style={{ color: C.textMid, background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 17, height: 17 }} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Campaign Name</label><input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., FD Maturity Reminder" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.cream, color: C.textMain, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Channel Type</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["Email", "WhatsApp", "SMS"] as const).map(t => { const active = formType === t; const cm = channelMeta[typeToChannel(t)]; return (
                      <button key={t} onClick={() => setFormType(t)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `0.5px solid ${active ? C.yellowBorder : C.border}`, background: active ? C.yellowBg : C.white, color: active ? C.yellowDark : C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}><cm.icon style={{ width: 14, height: 14 }} />{t}</button>
                    ); })}
                  </div>
                </div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Content</label><textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Write your campaign message..." rows={4} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.cream, color: C.textMain, fontSize: 14, outline: "none", resize: "vertical", minHeight: 90, boxSizing: "border-box", fontFamily: "inherit" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Target Segment</label><input value={formSegment} onChange={e => setFormSegment(e.target.value)} placeholder="e.g., Premium, Youth (comma-separated)" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.cream, color: C.textMain, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Schedule (optional)</label><input type="datetime-local" value={formScheduled} onChange={e => setFormScheduled(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.cream, color: C.textMain, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
                <button onClick={handleCreate} disabled={creating || !formName.trim() || !formContent.trim()}
                  style={{ width: "100%", padding: 14, borderRadius: 12, background: creating || !formName.trim() || !formContent.trim() ? C.border : C.textMain, border: "none", color: creating || !formName.trim() || !formContent.trim() ? C.textFaint : C.yellow, fontSize: 13, fontWeight: 600, cursor: creating || !formName.trim() || !formContent.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {creating ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Plus style={{ width: 16, height: 16 }} />}
                  {creating ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
