import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageSquare, Mail, Smartphone, Calendar, Sparkles,
  MoreHorizontal, TrendingUp, Send, Eye, MousePointer,
  Clock, CheckCircle, FileText, Zap, Target, Users,
  AlertCircle, ChevronRight, Play, Pause, Copy,
} from "lucide-react";
import { useState } from "react";

/* ─── theme ─── */
const T = {
  green:    "#00e676",
  greenMid: "#00c853",
  greenDeep:"#007a3d",
  aqua:     "#7fffd4",
  bg:       "#03060a",
  bgCard:   "rgba(8,16,10,0.95)",
  border:   "rgba(0,230,118,0.10)",
  borderHi: "rgba(0,230,118,0.28)",
  text:     "#e8f5e9",
  muted:    "#7aab88",
  dim:      "#3d6b4a",
  mono:     "'Space Mono', monospace",
  display:  "'Bebas Neue', sans-serif",
  body:     "'Syne', sans-serif",
};

/* ─── campaign data (banking relevant) ─── */
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
    desc: "Alert customers with pending KYC documents before RBI deadline. Compliance-critical.",
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
  whatsapp: { icon: MessageSquare, color: T.green,   bg: "rgba(0,230,118,0.10)",   label: "WhatsApp" },
  email:    { icon: Mail,          color: T.aqua,    bg: "rgba(127,255,212,0.10)", label: "Email" },
  sms:      { icon: Smartphone,    color: "#00bcd4", bg: "rgba(0,188,212,0.10)",   label: "SMS" },
};

const statusMeta: Record<string, { color: string; bg: string; border: string; label: string; dot?: boolean }> = {
  active:    { color: T.green,   bg: "rgba(0,230,118,0.10)",  border: "rgba(0,230,118,0.25)",  label: "Active",    dot: true },
  scheduled: { color: T.aqua,    bg: "rgba(127,255,212,0.10)",border: "rgba(127,255,212,0.25)",label: "Scheduled" },
  draft:     { color: T.muted,   bg: "rgba(122,171,136,0.08)",border: "rgba(122,171,136,0.18)",label: "Draft" },
  paused:    { color: "#ffa726", bg: "rgba(255,167,38,0.10)", border: "rgba(255,167,38,0.25)", label: "Paused" },
};

const tagMeta: Record<string, { color: string; bg: string }> = {
  Retention:   { color: T.green,   bg: "rgba(0,230,118,0.08)" },
  "Cross-sell":{ color: T.aqua,    bg: "rgba(127,255,212,0.08)" },
  Compliance:  { color: "#ef5350", bg: "rgba(239,83,80,0.08)" },
  Upsell:      { color: "#ffa726", bg: "rgba(255,167,38,0.08)" },
  Engagement:  { color: "#4db6ac", bg: "rgba(77,182,172,0.08)" },
};

const priorityMeta: Record<string, { color: string }> = {
  critical: { color: "#ef5350" },
  high:     { color: "#ffa726" },
  medium:   { color: T.green },
  low:      { color: T.dim },
};

const STATS = [
  { label: "Total Sent",    value: "29,750", icon: Send,         color: T.green, hint: "Messages sent across all active campaigns" },
  { label: "Avg Open Rate", value: "78.2%",  icon: Eye,          color: T.aqua,  hint: "Average open rate this month" },
  { label: "Avg CTR",       value: "38.6%",  icon: MousePointer, color: T.green, hint: "Click-through rate across campaigns" },
  { label: "AI Generated",  value: "3 / 5",  icon: Sparkles,     color: T.aqua,  hint: "Campaigns drafted by AI assistant" },
  { label: "Conversions",   value: "8,740",  icon: Target,       color: T.green, hint: "Customers who took action after receiving" },
  { label: "Reach",         value: "25,820", icon: Users,        color: T.aqua,  hint: "Unique customers targeted" },
];

const FILTERS = ["All", "Active", "Scheduled", "Draft"];

function MiniBar({ val, max, color }: { val: number; max: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (val / max) * 100)}%` }}
        transition={{ duration: 0.8 }}
        style={{ height: "100%", background: color, borderRadius: 2 }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function CampaignsPage() {
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState<number | null>(null);
  const [showNew,  setShowNew]  = useState(false);

  const filtered = campaigns.filter(c =>
    filter === "All" ? true : c.status === filter.toLowerCase()
  );

  const selCamp = campaigns.find(c => c.id === selected);

  return (
    <div style={{
      display: "flex", height: "100%",
      background: T.bg, fontFamily: T.body, color: T.text,
      overflow: "hidden",
    }}>

      {/* ══ MAIN PANEL ══ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflowY: "auto", padding: "24px 28px",
      }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:22 }}
        >
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <Target size={14} style={{ color:T.green }}/>
              <span style={{ fontFamily:T.mono, fontSize:10, fontWeight:700, color:T.green, letterSpacing:"0.18em", textTransform:"uppercase" }}>
                Outreach Engine
              </span>
            </div>
            <h1 style={{ fontFamily:T.display, fontSize:"clamp(1.8rem,3vw,2.8rem)", letterSpacing:"0.06em", lineHeight:1, color:T.text }}>
              CAMPAIGNS
            </h1>
          </div>
          <motion.button
            whileHover={{ scale:1.03 }}
            whileTap={{ scale:0.97 }}
            onClick={() => setShowNew(true)}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"10px 20px",
              background:`linear-gradient(135deg,${T.green},${T.greenDeep})`,
              border:"none", borderRadius:6, cursor:"pointer",
              color:"#03060a", fontFamily:T.mono, fontSize:10, fontWeight:700,
              letterSpacing:"0.12em", textTransform:"uppercase",
              boxShadow:`0 0 20px rgba(0,230,118,0.25)`,
            }}
          >
            <Plus size={13}/> New Campaign
          </motion.button>
        </motion.div>

        {/* ── STAT STRIP ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:20 }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
              title={s.hint}
              style={{
                background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:6,
                padding:"12px 14px", position:"relative", overflow:"hidden",
              }}
            >
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                background:`linear-gradient(90deg,transparent,${s.color}50,transparent)` }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.14em", color:T.dim, textTransform:"uppercase" }}>{s.label}</span>
                <s.icon size={10} style={{ color:`${s.color}80` }}/>
              </div>
              <div style={{
                fontFamily:T.display, fontSize:"1.5rem", letterSpacing:"0.04em",
                background:`linear-gradient(135deg,${s.color},${s.color}88)`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                lineHeight:1,
              }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── FILTER PILLS ── */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          {FILTERS.map(f => {
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:"5px 14px", borderRadius:20, cursor:"pointer",
                fontFamily:T.mono, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                border:`1px solid ${active ? T.green : T.border}`,
                background:active ? "rgba(0,230,118,0.10)" : "transparent",
                color:active ? T.green : T.dim, transition:"all 0.18s",
              }}>{f}
                {f !== "All" && (
                  <span style={{ marginLeft:6, padding:"0 5px", borderRadius:8,
                    background:"rgba(0,230,118,0.08)", color:T.green, fontSize:8 }}>
                    {campaigns.filter(c => c.status === f.toLowerCase()).length}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ marginLeft:"auto", fontFamily:T.mono, fontSize:9, color:T.dim }}>
            {filtered.length} campaigns
          </div>
        </div>

        {/* ── CAMPAIGN CARDS ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <AnimatePresence>
            {filtered.map((c, i) => {
              const cm   = channelMeta[c.channel];
              const sm   = statusMeta[c.status];
              const tm   = tagMeta[c.tag];
              const pm   = priorityMeta[c.priority];
              const CIcon = cm.icon;
              const openRate   = c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0;
              const clickRate  = c.sent > 0 ? Math.round((c.clicked / c.sent) * 100) : 0;
              const convRate   = c.sent > 0 ? Math.round((c.converted / c.sent) * 100) : 0;
              const isSelected = selected === c.id;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  transition={{ delay:i*0.05 }}
                  onClick={() => setSelected(isSelected ? null : c.id)}
                  style={{
                    background:T.bgCard,
                    border:`1px solid ${isSelected ? T.green : T.border}`,
                    borderLeft:`3px solid ${pm.color}`,
                    borderRadius:8, padding:"16px 20px",
                    cursor:"pointer", position:"relative", overflow:"hidden",
                    transition:"all 0.22s",
                    boxShadow:isSelected ? `0 0 24px rgba(0,230,118,0.08)` : "none",
                  }}
                  whileHover={{ borderColor: isSelected ? T.green : T.borderHi } as any}
                >
                  {/* top glow */}
                  {isSelected && (
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                      background:`linear-gradient(90deg,transparent,${T.green}50,transparent)` }}/>
                  )}

                  {/* AI badge */}
                  {c.aiGenerated && (
                    <div style={{
                      position:"absolute", top:12, right:52,
                      display:"flex", alignItems:"center", gap:4,
                      padding:"2px 8px", borderRadius:10,
                      background:"rgba(0,230,118,0.08)", border:`1px solid ${T.border}`,
                      fontFamily:T.mono, fontSize:8, color:T.green, letterSpacing:"0.10em",
                    }}>
                      <Sparkles size={8}/> AI
                    </div>
                  )}

                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    {/* channel icon */}
                    <div style={{
                      width:42, height:42, borderRadius:10, flexShrink:0,
                      background:cm.bg, border:`1px solid ${cm.color}25`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:`0 0 12px ${cm.color}12`,
                    }}>
                      <CIcon size={18} style={{ color:cm.color }}/>
                    </div>

                    {/* name + meta */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                        <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.text, letterSpacing:"0.04em" }}>
                          {c.name}
                        </span>
                        {/* status */}
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:4,
                          padding:"2px 8px", borderRadius:20,
                          background:sm.bg, border:`1px solid ${sm.border}`,
                          fontFamily:T.mono, fontSize:8, color:sm.color,
                          letterSpacing:"0.08em", textTransform:"uppercase",
                        }}>
                          {sm.dot && <span style={{ width:5, height:5, borderRadius:"50%", background:sm.color,
                            boxShadow:`0 0 4px ${sm.color}`, animation:"pulse 2s infinite" }}/>}
                          {sm.label}
                        </span>
                        {/* tag */}
                        <span style={{
                          padding:"2px 8px", borderRadius:20,
                          background:tm.bg, border:`1px solid ${tm.color}20`,
                          fontFamily:T.mono, fontSize:8, color:tm.color,
                          letterSpacing:"0.08em", textTransform:"uppercase",
                        }}>{c.tag}</span>
                      </div>
                      <p style={{ fontSize:11, color:T.muted, lineHeight:1.5, margin:0, maxWidth:480 }}>
                        {c.desc}
                      </p>
                    </div>

                    {/* metrics (only if sent) */}
                    {c.sent > 0 ? (
                      <div style={{ display:"flex", gap:20, flexShrink:0 }}>
                        {[
                          { label:"Sent",      val:c.sent.toLocaleString(),      icon:Send,         color:T.muted },
                          { label:"Open Rate", val:`${openRate}%`,              icon:Eye,          color:T.green },
                          { label:"CTR",       val:`${clickRate}%`,             icon:MousePointer, color:T.aqua },
                          { label:"Converted", val:`${c.converted.toLocaleString()}`, icon:Target,   color:T.green },
                        ].map(m => (
                          <div key={m.label} style={{ textAlign:"center", minWidth:50 }}>
                            <div style={{ fontFamily:T.display, fontSize:"1.1rem", color:m.color, lineHeight:1 }}>
                              {m.val}
                            </div>
                            <div style={{ fontFamily:T.mono, fontSize:8, color:T.dim, letterSpacing:"0.10em", marginTop:3, textTransform:"uppercase" }}>
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0,
                        fontFamily:T.mono, fontSize:9, color:T.dim }}>
                        <Calendar size={11}/> {c.scheduled}
                      </div>
                    )}

                    {/* action buttons */}
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      {c.status === "active" && (
                        <button onClick={e=>e.stopPropagation()} style={{
                          padding:"5px 10px", borderRadius:5,
                          background:"rgba(255,167,38,0.10)", border:"1px solid rgba(255,167,38,0.25)",
                          color:"#ffa726", cursor:"pointer", display:"flex", alignItems:"center", gap:4,
                          fontFamily:T.mono, fontSize:8,
                        }}><Pause size={10}/> Pause</button>
                      )}
                      {c.status === "draft" && (
                        <button onClick={e=>e.stopPropagation()} style={{
                          padding:"5px 10px", borderRadius:5,
                          background:"rgba(0,230,118,0.10)", border:`1px solid ${T.border}`,
                          color:T.green, cursor:"pointer", display:"flex", alignItems:"center", gap:4,
                          fontFamily:T.mono, fontSize:8,
                        }}><Play size={10}/> Launch</button>
                      )}
                      <button onClick={e=>e.stopPropagation()} style={{
                        padding:6, background:"transparent", border:`1px solid ${T.border}`,
                        borderRadius:5, cursor:"pointer", display:"flex", color:T.dim,
                      }}><MoreHorizontal size={13}/></button>
                    </div>
                  </div>

                  {/* EXPANDED DETAIL */}
                  <AnimatePresence>
                    {isSelected && c.sent > 0 && (
                      <motion.div
                        initial={{ opacity:0, height:0 }}
                        animate={{ opacity:1, height:"auto" }}
                        exit={{ opacity:0, height:0 }}
                        transition={{ duration:0.25 }}
                        style={{ overflow:"hidden" }}
                      >
                        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                            {[
                              { label:"Open Rate",       val:openRate,  max:100, color:T.green, suffix:"%", desc:`${c.opened.toLocaleString()} of ${c.sent.toLocaleString()} opened` },
                              { label:"Click-thru Rate", val:clickRate, max:100, color:T.aqua,  suffix:"%", desc:`${c.clicked.toLocaleString()} clicked the CTA` },
                              { label:"Conversion Rate", val:convRate,  max:100, color:T.green, suffix:"%", desc:`${c.converted.toLocaleString()} customers acted` },
                            ].map(m => (
                              <div key={m.label} style={{ background:"rgba(0,230,118,0.03)", border:`1px solid ${T.border}`, borderRadius:6, padding:"12px 14px" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                                  <span style={{ fontFamily:T.mono, fontSize:8, color:T.dim, letterSpacing:"0.12em", textTransform:"uppercase" }}>{m.label}</span>
                                  <span style={{ fontFamily:T.mono, fontSize:11, fontWeight:700, color:m.color }}>{m.val}{m.suffix}</span>
                                </div>
                                <MiniBar val={m.val} max={m.max} color={m.color}/>
                                <div style={{ fontFamily:T.mono, fontSize:8, color:T.dim, marginTop:6 }}>{m.desc}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:T.mono, fontSize:9, color:T.muted }}>
                              <Calendar size={10}/> Launched {c.scheduled}
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:T.mono, fontSize:9, color:T.muted }}>
                              <Users size={10}/> {c.audience.toLocaleString()} targeted
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:T.mono, fontSize:9, color:cm.color }}>
                              <CIcon size={10}/> via {cm.label}
                            </div>
                            <button style={{
                              marginLeft:"auto", display:"flex", alignItems:"center", gap:5,
                              padding:"5px 12px", borderRadius:5,
                              background:"rgba(0,230,118,0.08)", border:`1px solid ${T.border}`,
                              color:T.green, fontFamily:T.mono, fontSize:8, cursor:"pointer",
                              letterSpacing:"0.10em",
                            }}>
                              <Copy size={9}/> Duplicate
                            </button>
                            <button style={{
                              display:"flex", alignItems:"center", gap:5,
                              padding:"5px 12px", borderRadius:5,
                              background:`linear-gradient(135deg,${T.green},${T.greenDeep})`,
                              border:"none", color:"#03060a", fontFamily:T.mono, fontSize:8,
                              cursor:"pointer", letterSpacing:"0.10em", fontWeight:700,
                            }}>
                              Full Report <ChevronRight size={9}/>
                            </button>
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

      {/* ══ RIGHT PANEL — AI CAMPAIGN BUILDER ══ */}
      <div style={{
        width: 280, flexShrink:0,
        borderLeft:`1px solid ${T.border}`,
        background:"rgba(3,6,10,0.98)",
        display:"flex", flexDirection:"column",
        overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 18px 14px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <Sparkles size={12} style={{ color:T.green }}/>
            <span style={{ fontFamily:T.mono, fontSize:9, fontWeight:700, color:T.green, letterSpacing:"0.18em", textTransform:"uppercase" }}>
              AI Suggestions
            </span>
          </div>
          <p style={{ fontSize:11, color:T.muted, lineHeight:1.6 }}>
            Based on your customer data, these campaigns could drive impact.
          </p>
        </div>

        {/* AI Suggestions */}
        <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
          {[
            {
              title: "Home Loan Balance Transfer",
              tag: "Cross-sell",
              tagColor: T.aqua,
              insight: "142 customers have loans at competitor rates >8.5%",
              reach: "142 customers",
              channel: "WhatsApp",
              impact: "High",
            },
            {
              title: "Dormant Account Revival",
              tag: "Retention",
              tagColor: T.green,
              insight: "389 accounts with no transactions in 90+ days",
              reach: "389 customers",
              channel: "SMS + Email",
              impact: "Medium",
            },
            {
              title: "RD Scheme Promotion",
              tag: "Upsell",
              tagColor: "#ffa726",
              insight: "Savings customers who haven't explored recurring deposits",
              reach: "1,200 customers",
              channel: "WhatsApp",
              impact: "High",
            },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity:0, x:12 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay:0.2 + i*0.08 }}
              style={{
                background:"rgba(0,230,118,0.04)", border:`1px solid ${T.border}`,
                borderRadius:8, padding:"12px 14px", position:"relative",
              }}
            >
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontFamily:T.mono, fontSize:10, fontWeight:700, color:T.text, letterSpacing:"0.04em", lineHeight:1.3, maxWidth:160 }}>
                  {s.title}
                </span>
                <span style={{
                  padding:"1px 6px", borderRadius:8, flexShrink:0,
                  background:`${s.tagColor}12`, border:`1px solid ${s.tagColor}25`,
                  fontFamily:T.mono, fontSize:7, color:s.tagColor, letterSpacing:"0.08em",
                }}>{s.tag}</span>
              </div>
              <p style={{ fontSize:10, color:T.muted, lineHeight:1.55, marginBottom:8 }}>{s.insight}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                <span style={{ display:"flex", alignItems:"center", gap:4, fontFamily:T.mono, fontSize:8, color:T.dim }}>
                  <Users size={8}/> {s.reach}
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:4, fontFamily:T.mono, fontSize:8, color:T.dim }}>
                  <MessageSquare size={8}/> {s.channel}
                </span>
                <span style={{ fontFamily:T.mono, fontSize:8, color:T.green }}>
                  Impact: {s.impact}
                </span>
              </div>
              <button style={{
                width:"100%", padding:"7px", borderRadius:6,
                background:"rgba(0,230,118,0.08)", border:`1px solid ${T.border}`,
                color:T.green, fontFamily:T.mono, fontSize:8, cursor:"pointer",
                letterSpacing:"0.10em", textTransform:"uppercase",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              }}>
                <Zap size={9}/> Create with AI
              </button>
            </motion.div>
          ))}
        </div>

        {/* Quick tips */}
        <div style={{ marginTop:"auto", padding:"14px 18px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <AlertCircle size={11} style={{ color:T.dim }}/>
            <span style={{ fontFamily:T.mono, fontSize:8, color:T.dim, letterSpacing:"0.12em", textTransform:"uppercase" }}>Best Practice</span>
          </div>
          <p style={{ fontSize:10, color:T.dim, lineHeight:1.65 }}>
            WhatsApp campaigns have <span style={{color:T.green}}>3× higher open rates</span> than email for time-sensitive financial alerts.
          </p>
        </div>
      </div>
    </div>
  );
}