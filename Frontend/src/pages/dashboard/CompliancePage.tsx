import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle, Clock, FileText, Ban,
  Bell, ChevronRight, Download, RefreshCw, Lock,
  AlertCircle, Eye, Zap, Filter, ExternalLink,
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

/* ─── data ─── */
const ALERTS = [
  {
    type:"warning",
    title:"DND Number Detected",
    desc:"Customer +91-98765-43210 is on TRAI DND registry. SMS delivery blocked automatically.",
    time:"5m ago", rule:"TRAI DND Rule §4.2", action:"Review Customer",
  },
  {
    type:"success",
    title:"Consent Verified — Campaign C-4521",
    desc:"Bulk WhatsApp campaign passed double opt-in consent check. 12,450 contacts validated.",
    time:"1h ago", rule:"RBI Consent Framework", action:"View Report",
  },
  {
    type:"error",
    title:"Template Pending Approval",
    desc:"Message template 'Promo-March-Loan' awaiting compliance officer review before TRAI submission.",
    time:"2h ago", rule:"TRAI DLT §7.1", action:"Review Template",
  },
  {
    type:"success",
    title:"Monthly Audit Passed",
    desc:"March 2026 communication audit complete — 99.5% compliance across all 29,750 messages sent.",
    time:"1d ago", rule:"RBI Circular 2024/87", action:"Download Report",
  },
  {
    type:"warning",
    title:"Opt-Out Request Received",
    desc:"14 customers unsubscribed from marketing communications in last 24h. Suppression list updated.",
    time:"3h ago", rule:"PDPA §12", action:"View List",
  },
  {
    type:"info",
    title:"DPDP Act Update",
    desc:"New Digital Personal Data Protection Act guidelines effective April 1, 2026. Review required.",
    time:"2d ago", rule:"DPDP Act 2023", action:"Read Circular",
  },
];

const RULES = [
  { label:"TRAI DND Registry",       status:"synced",  lastCheck:"2m ago",     icon:Ban,       desc:"Auto-blocks DND numbers before every campaign dispatch" },
  { label:"RBI Consent Framework",   status:"active",  lastCheck:"Real-time",  icon:CheckCircle,desc:"Double opt-in required for all financial product messaging" },
  { label:"DPDP Act 2023",           status:"review",  lastCheck:"Pending",    icon:FileText,  desc:"New data protection guidelines require policy update by Apr 1" },
  { label:"TRAI DLT Registration",   status:"active",  lastCheck:"Verified",   icon:Shield,    desc:"All message templates registered on Distributed Ledger" },
  { label:"RBI Fair Practice Code",  status:"active",  lastCheck:"Real-time",  icon:Lock,      desc:"Communication frequency limits enforced per customer" },
];

const PENDING = [
  { id:"TPL-0041", name:"Q2 Loan Offer Template",    channel:"whatsapp", submittedBy:"Ravi Menon",    age:"6h",   risk:"low" },
  { id:"TPL-0042", name:"FD Renewal Promo — April",  channel:"email",    submittedBy:"Priya Sharma",  age:"14h",  risk:"medium" },
  { id:"TPL-0043", name:"EMI Late Payment Reminder", channel:"sms",      submittedBy:"Arun Kumar",    age:"1d",   risk:"high" },
];

const alertMeta: Record<string, { color:string; bg:string; border:string; icon:typeof Shield }> = {
  warning: { color:"#ffa726", bg:"rgba(255,167,38,0.10)", border:"rgba(255,167,38,0.25)", icon:AlertTriangle },
  success: { color:T.green,   bg:"rgba(0,230,118,0.10)",  border:"rgba(0,230,118,0.25)",  icon:CheckCircle },
  error:   { color:"#ef5350", bg:"rgba(239,83,80,0.10)",  border:"rgba(239,83,80,0.25)",  icon:AlertCircle },
  info:    { color:T.aqua,    bg:"rgba(127,255,212,0.10)",border:"rgba(127,255,212,0.25)",icon:Bell },
};

const statusMeta: Record<string, { color:string; bg:string; label:string }> = {
  active:  { color:T.green,   bg:"rgba(0,230,118,0.10)",  label:"Active" },
  synced:  { color:T.aqua,    bg:"rgba(127,255,212,0.10)",label:"Synced" },
  review:  { color:"#ffa726", bg:"rgba(255,167,38,0.10)", label:"Needs Review" },
};

const riskMeta: Record<string, { color:string }> = {
  low:    { color:T.green },
  medium: { color:"#ffa726" },
  high:   { color:"#ef5350" },
};

const channelMeta: Record<string, { color:string }> = {
  whatsapp: { color:T.green },
  email:    { color:T.aqua },
  sms:      { color:"#00bcd4" },
};

const TABS = ["Alerts", "Active Rules", "Pending Approvals"];

function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="100" height="100" style={{ transform:"rotate(-90deg)" }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,230,118,0.10)" strokeWidth="7"/>
      <motion.circle
        cx="50" cy="50" r={r} fill="none"
        stroke={score >= 95 ? T.green : score >= 80 ? "#ffa726" : "#ef5350"}
        strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter:`drop-shadow(0 0 6px ${T.green})` }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════ */
export default function CompliancePage() {
  const [tab,        setTab]        = useState("Alerts");
  const [alertFilter,setAlertFilter]= useState("all");
  const [expanded,   setExpanded]   = useState<number | null>(null);

  const filteredAlerts = ALERTS.filter(a =>
    alertFilter === "all" || a.type === alertFilter
  );

  return (
    <div style={{
      padding:"24px 28px", background:T.bg,
      minHeight:"100%", fontFamily:T.body, color:T.text,
      overflowY:"auto",
    }}>

      {/* ── HEADER ── */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <Shield size={14} style={{color:T.green}}/>
          <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.18em",textTransform:"uppercase"}}>
            Regulatory Intelligence
          </span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <h1 style={{fontFamily:T.display,fontSize:"clamp(1.8rem,3vw,2.8rem)",letterSpacing:"0.06em",lineHeight:1,color:T.text}}>
            COMPLIANCE
          </h1>
          <div style={{display:"flex",gap:8}}>
            <button style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"8px 14px",borderRadius:6,
              border:`1px solid ${T.border}`,background:"transparent",
              color:T.muted,fontFamily:T.mono,fontSize:10,cursor:"pointer",
              letterSpacing:"0.10em",transition:"all 0.2s",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.green;(e.currentTarget as HTMLButtonElement).style.borderColor=T.borderHi;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.muted;(e.currentTarget as HTMLButtonElement).style.borderColor=T.border;}}
            >
              <RefreshCw size={11}/> Sync Rules
            </button>
            <button style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"8px 14px",borderRadius:6,
              background:`linear-gradient(135deg,${T.green},${T.greenDeep})`,
              border:"none",color:"#03060a",fontFamily:T.mono,fontSize:10,
              fontWeight:700,cursor:"pointer",letterSpacing:"0.10em",
              boxShadow:`0 0 16px rgba(0,230,118,0.22)`,
            }}>
              <Download size={11}/> Export Audit
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── TOP ROW: score + KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:12,marginBottom:20}}>

        {/* Compliance score card */}
        <motion.div
          initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
          style={{
            background:T.bgCard, border:`1px solid ${T.green}30`,
            borderRadius:8, padding:"20px",
            display:"flex",flexDirection:"column",alignItems:"center",
            position:"relative",overflow:"hidden",
          }}
        >
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${T.green}50,transparent)`}}/>
          <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>
            Compliance Score
          </div>
          <div style={{position:"relative",marginBottom:10}}>
            <ScoreRing score={99.5}/>
            <div style={{
              position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",
              fontFamily:T.display,fontSize:"1.5rem",letterSpacing:"0.04em",
              background:`linear-gradient(135deg,${T.green},${T.aqua})`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              lineHeight:1,textAlign:"center",
            }}>
              99.5%
            </div>
          </div>
          <div style={{fontFamily:T.mono,fontSize:9,color:T.green,marginBottom:4}}>
            ↑ Excellent standing
          </div>
          <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,textAlign:"center",lineHeight:1.5}}>
            All RBI & TRAI rules<br/>passing in real-time
          </div>
        </motion.div>

        {/* KPI grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[
            { label:"DND Blocked",        value:"142",   icon:Ban,         color:"#ef5350", sub:"This month" },
            { label:"Pending Approvals",  value:"3",     icon:Clock,       color:"#ffa726", sub:"Need action" },
            { label:"Active Consents",    value:"18.2K", icon:CheckCircle, color:T.green,   sub:"Opt-in verified" },
            { label:"Templates Approved", value:"47",    icon:FileText,    color:T.aqua,    sub:"This quarter" },
          ].map((s,i)=>(
            <motion.div key={s.label}
              initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.06}}
              style={{
                background:T.bgCard, border:`1px solid ${T.border}`,
                borderRadius:8, padding:"16px 14px", position:"relative", overflow:"hidden",
              }}
            >
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,${s.color}50,transparent)`}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontFamily:T.mono,fontSize:8,letterSpacing:"0.14em",color:T.dim,textTransform:"uppercase"}}>
                  {s.label}
                </span>
                <s.icon size={11} style={{color:`${s.color}80`}}/>
              </div>
              <div style={{
                fontFamily:T.display,fontSize:"2rem",letterSpacing:"0.04em",
                background:`linear-gradient(135deg,${s.color},${s.color}88)`,
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                lineHeight:1,marginBottom:5,
              }}>{s.value}</div>
              <div style={{fontFamily:T.mono,fontSize:8,color:T.dim}}>{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:4,marginBottom:18,borderBottom:`1px solid ${T.border}`}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"8px 18px",background:"transparent",border:"none",
            borderBottom:`2px solid ${tab===t?T.green:"transparent"}`,
            color:tab===t?T.green:T.dim,
            fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",
            textTransform:"uppercase",cursor:"pointer",transition:"all 0.18s",marginBottom:-1,
            display:"flex",alignItems:"center",gap:7,
          }}>
            {t}
            {t==="Pending Approvals" && (
              <span style={{padding:"1px 6px",borderRadius:8,background:"rgba(255,167,38,0.15)",
                border:"1px solid rgba(255,167,38,0.30)",color:"#ffa726",fontSize:8}}>3</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ALERTS TAB ══ */}
      {tab==="Alerts" && (
        <motion.div key="alerts" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          {/* filter row */}
          <div style={{display:"flex",gap:7,marginBottom:14}}>
            {["all","success","warning","error","info"].map(f=>{
              const active = alertFilter===f;
              const meta = f!=="all"?alertMeta[f]:null;
              return (
                <button key={f} onClick={()=>setAlertFilter(f)} style={{
                  padding:"4px 12px",borderRadius:20,cursor:"pointer",
                  fontFamily:T.mono,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",
                  border:`1px solid ${active?(meta?.color??T.green):T.border}`,
                  background:active?(meta?meta.bg:"rgba(0,230,118,0.08)"):"transparent",
                  color:active?(meta?.color??T.green):T.dim,transition:"all 0.18s",
                }}>{f}</button>
              );
            })}
            <div style={{marginLeft:"auto",fontFamily:T.mono,fontSize:9,color:T.dim,display:"flex",alignItems:"center",gap:5}}>
              <Filter size={10}/> {filteredAlerts.length} alerts
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <AnimatePresence>
              {filteredAlerts.map((a,i)=>{
                const m = alertMeta[a.type];
                const Icon = m.icon;
                const isOpen = expanded===i;
                return (
                  <motion.div key={i}
                    initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0}}
                    transition={{delay:i*0.05}}
                    onClick={()=>setExpanded(isOpen?null:i)}
                    style={{
                      background:T.bgCard, border:`1px solid ${isOpen?m.color+"40":T.border}`,
                      borderLeft:`3px solid ${m.color}`,
                      borderRadius:8, padding:"14px 18px",
                      cursor:"pointer", position:"relative", overflow:"hidden",
                      transition:"all 0.2s",
                    }}
                    whileHover={{borderColor:isOpen?m.color+"40":T.borderHi} as any}
                  >
                    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                      <div style={{
                        width:34,height:34,borderRadius:8,flexShrink:0,
                        background:m.bg,border:`1px solid ${m.border}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                      }}>
                        <Icon size={15} style={{color:m.color}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.text,letterSpacing:"0.04em"}}>{a.title}</span>
                          <span style={{fontFamily:T.mono,fontSize:9,color:T.dim,flexShrink:0,marginLeft:12}}>{a.time}</span>
                        </div>
                        <p style={{fontSize:12,color:T.muted,lineHeight:1.6,margin:0}}>{a.desc}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                          exit={{opacity:0,height:0}} transition={{duration:0.2}}
                          style={{overflow:"hidden"}}
                        >
                          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`,
                            display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontFamily:T.mono,fontSize:9,color:T.dim}}>Regulatory basis:</span>
                              <span style={{
                                padding:"2px 10px",borderRadius:20,
                                background:m.bg,border:`1px solid ${m.border}`,
                                fontFamily:T.mono,fontSize:9,color:m.color,letterSpacing:"0.08em",
                              }}>{a.rule}</span>
                            </div>
                            <button style={{
                              display:"flex",alignItems:"center",gap:5,
                              padding:"6px 14px",borderRadius:6,
                              background:`linear-gradient(135deg,${T.green},${T.greenDeep})`,
                              border:"none",color:"#03060a",fontFamily:T.mono,fontSize:9,
                              fontWeight:700,cursor:"pointer",letterSpacing:"0.10em",
                            }}>
                              {a.action} <ChevronRight size={10}/>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ══ ACTIVE RULES TAB ══ */}
      {tab==="Active Rules" && (
        <motion.div key="rules" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <div style={{
            background:T.bgCard,border:`1px solid ${T.border}`,
            borderRadius:8,overflow:"hidden",
          }}>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,${T.green}40,transparent)`}}/>
            </div>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.16em",textTransform:"uppercase"}}>
                Regulatory Rule Engine
              </span>
              <span style={{fontFamily:T.mono,fontSize:9,color:T.dim,display:"flex",alignItems:"center",gap:5}}>
                <Zap size={10} style={{color:T.green}}/> Auto-enforced in real-time
              </span>
            </div>

            {RULES.map((r,i)=>{
              const sm = statusMeta[r.status];
              const Icon = r.icon;
              return (
                <motion.div key={r.label}
                  initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                  style={{
                    padding:"16px 20px",borderBottom:`1px solid rgba(0,230,118,0.05)`,
                    display:"flex",alignItems:"center",gap:14,
                    transition:"background 0.18s",cursor:"pointer",
                  }}
                  whileHover={{backgroundColor:"rgba(0,230,118,0.025)"} as any}
                >
                  <div style={{
                    width:36,height:36,borderRadius:8,flexShrink:0,
                    background:`${T.green}10`,border:`1px solid ${T.border}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <Icon size={15} style={{color:T.green}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.text,letterSpacing:"0.04em"}}>{r.label}</span>
                      <span style={{
                        padding:"2px 8px",borderRadius:20,
                        background:sm.bg,border:`1px solid ${sm.color}30`,
                        fontFamily:T.mono,fontSize:8,color:sm.color,
                        letterSpacing:"0.08em",textTransform:"uppercase",
                        display:"flex",alignItems:"center",gap:4,
                      }}>
                        {r.status==="active"&&<span style={{width:5,height:5,borderRadius:"50%",background:sm.color,boxShadow:`0 0 4px ${sm.color}`}}/>}
                        {sm.label}
                      </span>
                    </div>
                    <p style={{fontSize:11,color:T.muted,margin:0,lineHeight:1.5}}>{r.desc}</p>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,marginBottom:3}}>Last check</div>
                    <div style={{fontFamily:T.mono,fontSize:10,color:T.green}}>{r.lastCheck}</div>
                  </div>
                  {r.status==="review" && (
                    <button style={{
                      padding:"5px 12px",borderRadius:6,flexShrink:0,
                      background:"rgba(255,167,38,0.10)",border:"1px solid rgba(255,167,38,0.30)",
                      color:"#ffa726",fontFamily:T.mono,fontSize:8,cursor:"pointer",
                      letterSpacing:"0.10em",display:"flex",alignItems:"center",gap:4,
                    }}>
                      <Eye size={9}/> Review
                    </button>
                  )}
                  {r.status!=="review" && (
                    <ExternalLink size={13} style={{color:T.dim,flexShrink:0}}/>
                  )}
                </motion.div>
              );
            })}

            <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,
              background:"rgba(0,230,118,0.02)",
              fontFamily:T.mono,fontSize:9,color:T.dim,textAlign:"center"}}>
              Rules enforced across WhatsApp · Email · SMS · Voice · All channels
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ PENDING APPROVALS TAB ══ */}
      {tab==="Pending Approvals" && (
        <motion.div key="approvals" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <div style={{
            background:"rgba(255,167,38,0.03)",border:"1px solid rgba(255,167,38,0.18)",
            borderRadius:8,padding:"12px 18px",marginBottom:14,
            display:"flex",alignItems:"flex-start",gap:10,
          }}>
            <AlertTriangle size={14} style={{color:"#ffa726",flexShrink:0,marginTop:1}}/>
            <div>
              <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:"#ffa726",letterSpacing:"0.12em",textTransform:"uppercase"}}>
                Action Required
              </span>
              <p style={{fontSize:11,color:T.muted,margin:"3px 0 0",lineHeight:1.6}}>
                3 message templates are pending compliance approval. Templates cannot be used in campaigns until approved. TRAI mandates review within <span style={{color:"#ffa726"}}>24 hours</span>.
              </p>
            </div>
          </div>

          <div style={{
            background:T.bgCard,border:`1px solid ${T.border}`,
            borderRadius:8,overflow:"hidden",
          }}>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,#ffa72650,transparent)`}}/>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    {["Template ID","Name","Channel","Submitted By","Waiting","Risk Level","Actions"].map(h=>(
                      <th key={h} style={{
                        padding:"10px 16px",textAlign:"left",
                        fontFamily:T.mono,fontSize:8,letterSpacing:"0.16em",
                        color:T.dim,textTransform:"uppercase",
                        borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PENDING.map((p,i)=>{
                    const rm = riskMeta[p.risk];
                    const cm = channelMeta[p.channel];
                    return (
                      <motion.tr key={p.id}
                        initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}
                        style={{borderBottom:"1px solid rgba(0,230,118,0.05)",transition:"background 0.18s",cursor:"pointer"}}
                        onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background="rgba(0,230,118,0.025)"}
                        onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background="transparent"}
                      >
                        <td style={{padding:"14px 16px"}}>
                          <span style={{fontFamily:T.mono,fontSize:10,color:T.aqua}}>{p.id}</span>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <span style={{fontFamily:T.mono,fontSize:11,color:T.text,fontWeight:700}}>{p.name}</span>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <span style={{
                            padding:"2px 10px",borderRadius:20,
                            background:`${cm.color}12`,border:`1px solid ${cm.color}25`,
                            fontFamily:T.mono,fontSize:9,color:cm.color,
                            letterSpacing:"0.08em",textTransform:"uppercase",
                          }}>{p.channel}</span>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <span style={{fontSize:12,color:T.muted}}>{p.submittedBy}</span>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <Clock size={10} style={{color:T.dim}}/>
                            <span style={{fontFamily:T.mono,fontSize:10,color:p.age==="1d"?"#ef5350":"#ffa726"}}>{p.age}</span>
                          </div>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <span style={{
                            display:"inline-flex",alignItems:"center",gap:4,
                            padding:"2px 10px",borderRadius:20,
                            background:`${rm.color}12`,border:`1px solid ${rm.color}25`,
                            fontFamily:T.mono,fontSize:9,color:rm.color,
                            letterSpacing:"0.08em",textTransform:"uppercase",
                          }}>
                            <span style={{width:5,height:5,borderRadius:"50%",background:rm.color}}/>
                            {p.risk}
                          </span>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <div style={{display:"flex",gap:6}}>
                            <button style={{
                              padding:"5px 10px",borderRadius:5,
                              background:"rgba(0,230,118,0.10)",border:`1px solid ${T.border}`,
                              color:T.green,fontFamily:T.mono,fontSize:8,cursor:"pointer",
                              letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:4,
                            }}>
                              <CheckCircle size={9}/> Approve
                            </button>
                            <button style={{
                              padding:"5px 10px",borderRadius:5,
                              background:"rgba(239,83,80,0.08)",border:"1px solid rgba(239,83,80,0.20)",
                              color:"#ef5350",fontFamily:T.mono,fontSize:8,cursor:"pointer",
                              letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:4,
                            }}>
                              <Ban size={9}/> Reject
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,
              background:"rgba(0,230,118,0.02)",fontFamily:T.mono,fontSize:9,color:T.dim,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Approved templates are auto-submitted to TRAI DLT portal</span>
              <span style={{color:"#ffa726"}}>SLA: 24h review window</span>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}