import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle, Clock, FileText, Ban,
  Bell, ChevronRight, Download, RefreshCw, Lock,
  AlertCircle, Eye, Zap, Filter, ExternalLink,
} from "lucide-react";
import { useState } from "react";

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
  warning: { color:"#F59E0B", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)", icon:AlertTriangle },
  success: { color:"#3ECF6A", bg:"rgba(62,207,106,0.1)",  border:"rgba(62,207,106,0.25)",  icon:CheckCircle },
  error:   { color:"#EF4444", bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.25)",  icon:AlertCircle },
  info:    { color:"#60A5FA", bg:"rgba(96,165,250,0.1)",border:"rgba(96,165,250,0.25)",icon:Bell },
};

const statusMeta: Record<string, { color:string; bg:string; label:string }> = {
  active:  { color:"#3ECF6A", bg:"rgba(62,207,106,0.1)",  label:"Active" },
  synced:  { color:"#60A5FA", bg:"rgba(96,165,250,0.1)",label:"Synced" },
  review:  { color:"#F59E0B", bg:"rgba(245,158,11,0.1)", label:"Needs Review" },
};

const riskMeta: Record<string, { color:string }> = {
  low:    { color:"#3ECF6A" },
  medium: { color:"#F59E0B" },
  high:   { color:"#EF4444" },
};

const channelMeta: Record<string, { color:string }> = {
  whatsapp: { color:"#3ECF6A" },
  email:    { color:"#60A5FA" },
  sms:      { color:"#F59E0B" },
};

const TABS = ["Alerts", "Active Rules", "Pending Approvals"];

function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="100" height="100" style={{ transform:"rotate(-90deg)" }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
      <motion.circle
        cx="50" cy="50" r={r} fill="none"
        stroke={score >= 95 ? "#3ECF6A" : score >= 80 ? "#F59E0B" : "#EF4444"}
        strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════ */
export default function CompliancePage() {
  const [tab, setTab] = useState("Alerts");
  const [alertFilter,setAlertFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filteredAlerts = ALERTS.filter(a =>
    alertFilter === "all" || a.type === alertFilter
  );

  return (
    <div style={{ padding:"28px 32px", minHeight:"100%", overflowY:"auto" }} className="scrollbar-thin">

      {/* ── HEADER ── */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:"24px"}}>
        <div className="section-eyebrow">REGULATORY INTELLIGENCE</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
          <h1 className="page-title" style={{ margin:0 }}>Compliance</h1>
          <div style={{display:"flex",gap:"12px"}}>
            <button className="btn-ghost-db" style={{ padding: '8px 16px', fontSize: '12px' }}>
               <RefreshCw style={{ width: '14px', height: '14px' }}/> SYNC RULES
            </button>
            <button className="btn-primary-db" style={{ padding: '8px 16px', fontSize: '12px' }}>
               <Download style={{ width: '14px', height: '14px' }}/> EXPORT AUDIT
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── TOP ROW: score + KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:"24px",marginBottom:"24px"}}>

        {/* Compliance score card */}
        <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} className="glass-card-db" style={{ padding:"24px", display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden", border: '1px solid rgba(62,207,106,0.2)', background: 'rgba(62,207,106,0.03)' }}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1, background:`linear-gradient(90deg,transparent,#3ECF6A,transparent)`, opacity: 0.5}}/>
          <div className="section-eyebrow" style={{marginBottom:"16px", color: '#475569'}}>COMPLIANCE SCORE</div>
          <div style={{position:"relative",marginBottom:"16px"}}>
            <ScoreRing score={99.5}/>
            <div style={{ position:"absolute",top:"50%",left:"50%", transform:"translate(-50%,-50%)", fontFamily:"'JetBrains Mono', monospace",fontSize:"20px",fontWeight: 700, color: "#3ECF6A" }}>
              99.5%
            </div>
          </div>
          <div style={{fontFamily:"'JetBrains Mono', monospace",fontSize:"10px",color:"#3ECF6A",marginBottom:"8px", textTransform: 'uppercase', fontWeight: 600}}>
            ↑ Excellent standing
          </div>
          <div style={{fontFamily:"'DM Sans', sans-serif",fontSize:"12px",color:"#94A3B8",textAlign:"center",lineHeight:1.5}}>
            All RBI & TRAI rules<br/>passing in real-time
          </div>
        </motion.div>

        {/* KPI grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
          {[
            { label:"DND BLOCKED",        value:"142",   icon:Ban,         color:"#EF4444", sub:"This month" },
            { label:"PENDING APPROVALS",  value:"3",     icon:Clock,       color:"#F59E0B", sub:"Need action" },
            { label:"ACTIVE CONSENTS",    value:"18.2K", icon:CheckCircle, color:"#3ECF6A",   sub:"Opt-in verified" },
            { label:"TEMPLATES APPROVED", value:"47",    icon:FileText,    color:"#60A5FA",    sub:"This quarter" },
          ].map((s,i)=>(
            <motion.div key={s.label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.06}} className="stat-card-db" style={{ padding:"20px" }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                <span className="section-eyebrow" style={{ color: '#475569', margin: 0 }}>{s.label}</span>
                <s.icon style={{ width: '14px', height: '14px', color: s.color }}/>
              </div>
              <div className="stat-value" style={{ fontSize: '28px', color: '#F1F5F9', marginBottom:"6px" }}>{s.value}</div>
              <div style={{fontFamily:"'DM Sans', sans-serif",fontSize:"12px",color:"#7DD3FC"}}>{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:"8px",marginBottom:"24px",borderBottom:`1px solid rgba(255,255,255,0.07)`}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"12px 20px",background:"transparent",border:"none",
            borderBottom:`2px solid ${tab===t?"#3ECF6A":"transparent"}`,
            color:tab===t?"#3ECF6A":"#94A3B8",
            fontFamily:"'DM Sans', sans-serif",fontSize:"13px", fontWeight: 600,
            cursor:"pointer",transition:"all 0.2s",marginBottom:"-1px",
            display:"flex",alignItems:"center",gap:"8px",
          }}>
            {t}
            {t==="Pending Approvals" && (
              <span className="badge-amber" style={{ padding: '2px 6px' }}>3</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ALERTS TAB ══ */}
      {tab==="Alerts" && (
        <motion.div key="alerts" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          {/* filter row */}
          <div style={{display:"flex",gap:"8px",marginBottom:"16px", alignItems: 'center'}}>
            {["all","success","warning","error","info"].map(f=>{
              const active = alertFilter===f;
              const meta = f!=="all"?alertMeta[f]:null;
              return (
                <button key={f} onClick={()=>setAlertFilter(f)} style={{
                  padding:"6px 16px",borderRadius:"100px",cursor:"pointer",
                  fontFamily:"'JetBrains Mono', monospace",fontSize:"11px", fontWeight: 600, textTransform:"uppercase",
                  border:`1px solid ${active?(meta?.color??"#3ECF6A"):"transparent"}`,
                  background:active?(meta?meta.bg:"rgba(62,207,106,0.1)"):"rgba(255,255,255,0.05)",
                  color:active?(meta?.color??"#3ECF6A"):"#94A3B8",transition:"all 0.2s",
                }}>{f}</button>
              );
            })}
            <div style={{marginLeft:"auto",fontFamily:"'JetBrains Mono', monospace",fontSize:"11px",color:"#475569",display:"flex",alignItems:"center",gap:"6px"}}>
              <Filter style={{ width: '12px', height: '12px' }}/> {filteredAlerts.length} ALERTS
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
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
                    className="glass-card-db"
                    style={{
                      borderLeft:`3px solid ${m.color}`, padding:"16px 20px",
                      cursor:"pointer", position:"relative", overflow:"hidden", transition:"all 0.2s",
                      borderColor: isOpen ? m.border : 'rgba(255,255,255,0.07)',
                      background: isOpen ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
                    }}
                    onMouseOver={(e) => { if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseOut={(e) => { if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    <div style={{display:"flex",alignItems:"flex-start",gap:"16px"}}>
                      <div style={{ width:"40px",height:"40px",borderRadius:"10px",flexShrink:0, background:m.bg, display:"flex",alignItems:"center",justifyContent:"center", color: m.color }}>
                        <Icon style={{ width: '18px', height: '18px' }}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
                          <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:"15px",fontWeight:600,color:"#F1F5F9"}}>{a.title}</span>
                          <span style={{fontFamily:"'JetBrains Mono', monospace",fontSize:"11px",color:"#475569",flexShrink:0,marginLeft:"12px"}}>{a.time}</span>
                        </div>
                        <p style={{fontFamily: "'DM Sans', sans-serif", fontSize:"13px",color:"#94A3B8",lineHeight:1.6,margin:0}}>{a.desc}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:0.2}} style={{overflow:"hidden"}}>
                          <div style={{marginTop:"16px",paddingTop:"16px",borderTop:`1px solid rgba(255,255,255,0.05)`, display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                              <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:"12px",color:"#475569"}}>Regulatory basis:</span>
                              <span style={{ padding:"4px 12px",borderRadius:"100px", background:m.bg,border:`1px solid ${m.border}`, fontFamily:"'JetBrains Mono', monospace",fontSize:"10px", fontWeight: 600, color:m.color,textTransform: 'uppercase'}}>{a.rule}</span>
                            </div>
                            <button className="btn-primary-db" style={{ display:"flex",alignItems:"center",gap:"8px", padding:"8px 16px",fontSize:"11px" }}>
                              {a.action} <ChevronRight style={{ width: '12px', height: '12px' }}/>
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
          <div className="glass-card-db" style={{ padding: 0, overflow:"hidden" }}>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1, background:`linear-gradient(90deg,transparent,#3ECF6A,transparent)`, opacity: 0.5}}/>
            </div>
            <div style={{padding:"16px 24px",borderBottom:`1px solid rgba(255,255,255,0.07)`, display:"flex",alignItems:"center",justifyContent:"space-between", background: 'rgba(255,255,255,0.02)'}}>
              <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:"14px",fontWeight:600,color:"#3ECF6A",letterSpacing:"0.1em",textTransform:"uppercase"}}>
                Regulatory Rule Engine
              </span>
              <span style={{fontFamily:"'JetBrains Mono', monospace",fontSize:"11px",color:"#475569",display:"flex",alignItems:"center",gap:"6px"}}>
                <Zap style={{ width: '12px', height: '12px', color: '#3ECF6A' }}/> AUTO-ENFORCED IN REAL-TIME
              </span>
            </div>

            {RULES.map((r,i)=>{
              const sm = statusMeta[r.status];
              const Icon = r.icon;
              return (
                <motion.div key={r.label}
                  initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                  style={{
                    padding:"20px 24px",borderBottom:`1px solid rgba(255,255,255,0.05)`,
                    display:"flex",alignItems:"center",gap:"16px",
                    transition:"background 0.2s",cursor:"pointer",
                  }}
                  onMouseOver={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={(e: any) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width:"40px",height:"40px",borderRadius:"10px",flexShrink:0,
                    background:"rgba(62,207,106,0.1)", display:"flex",alignItems:"center",justifyContent:"center", color: '#3ECF6A'
                  }}>
                    <Icon style={{ width: '18px', height: '18px' }}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:"15px",fontWeight:600,color:"#F1F5F9"}}>{r.label}</span>
                      <span style={{ padding:"4px 10px",borderRadius:"100px", background:sm.bg,border:`1px solid ${sm.bg}`, fontFamily:"'JetBrains Mono', monospace",fontSize:"9px",fontWeight: 600, color:sm.color, textTransform:"uppercase", display:"flex",alignItems:"center",gap:"6px" }}>
                        {r.status==="active"&&<span style={{width:"6px",height:"6px",borderRadius:"50%",background:sm.color}}/>}
                        {sm.label}
                      </span>
                    </div>
                    <p style={{fontFamily: "'DM Sans', sans-serif", fontSize:"13px",color:"#94A3B8",margin:0,lineHeight:1.5}}>{r.desc}</p>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0, paddingRight: '16px'}}>
                    <div style={{fontFamily:"'DM Sans', sans-serif",fontSize:"11px",color:"#475569",marginBottom:"4px"}}>Last check</div>
                    <div style={{fontFamily:"'JetBrains Mono', monospace",fontSize:"12px",color:"#3ECF6A"}}>{r.lastCheck}</div>
                  </div>
                  {r.status==="review" && (
                    <button className="btn-ghost-db" style={{ padding:"8px 16px", color:"#F59E0B", gap:"6px", background: 'rgba(245,158,11,0.1)' }}>
                      <Eye style={{ width: '14px', height: '14px' }}/> Review
                    </button>
                  )}
                  {r.status!=="review" && (
                    <ExternalLink style={{ width: '16px', height: '16px', color: '#475569', flexShrink:0 }}/>
                  )}
                </motion.div>
              );
            })}

            <div style={{padding:"16px", background:"rgba(255,255,255,0.02)", fontFamily:"'DM Sans', sans-serif",fontSize:"12px",color:"#475569",textAlign:"center"}}>
              Rules enforced across WhatsApp · Email · SMS · Voice · All channels
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ PENDING APPROVALS TAB ══ */}
      {tab==="Pending Approvals" && (
        <motion.div key="approvals" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <div style={{ background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)", borderRadius:"12px",padding:"16px 24px",marginBottom:"24px", display:"flex",alignItems:"flex-start",gap:"16px" }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color:"#F59E0B",flexShrink:0,marginTop:"2px"}}/>
            <div>
              <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:"13px",fontWeight:600,color:"#F59E0B",letterSpacing:"0.1em",textTransform:"uppercase", display: 'block', marginBottom: '8px'}}>Action Required</span>
              <p style={{fontFamily: "'DM Sans', sans-serif", fontSize:"13px",color:"#94A3B8",margin:0,lineHeight:1.6}}>
                3 message templates are pending compliance approval. Templates cannot be used in campaigns until approved. TRAI mandates review within <span style={{color:"#F59E0B", fontWeight: 600}}>24 hours</span>.
              </p>
            </div>
          </div>

          <div className="glass-card-db" style={{ padding: 0, overflow:"hidden" }}>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1, background:`linear-gradient(90deg,transparent,#F59E0B,transparent)`, opacity: 0.5 }}/>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    {["Template ID","Name","Channel","Submitted By","Waiting","Risk Level","Actions"].map(h=>(
                      <th key={h} style={{ padding:"16px 24px",textAlign:"left", fontFamily:"'DM Sans', sans-serif",fontSize:"10px", fontWeight: 600, letterSpacing:"0.1em", color:"#475569",textTransform:"uppercase", borderBottom:`1px solid rgba(255,255,255,0.07)`,whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PENDING.map((p,i)=>{
                    const rm = riskMeta[p.risk];
                    const cm = channelMeta[p.channel];
                    return (
                      <motion.tr key={p.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}} style={{borderBottom:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}} onMouseOver={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e: any) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{padding:"16px 24px"}}><span style={{fontFamily:"'JetBrains Mono', monospace",fontSize:"12px",color:"#60A5FA"}}>{p.id}</span></td>
                        <td style={{padding:"16px 24px"}}><span style={{fontFamily:"'DM Sans', sans-serif",fontSize:"14px",color:"#F1F5F9",fontWeight:500}}>{p.name}</span></td>
                        <td style={{padding:"16px 24px"}}><span style={{ padding:"4px 10px",borderRadius:"100px", background:`rgba(255,255,255,0.05)`, border:`1px solid rgba(255,255,255,0.1)`, fontFamily:"'JetBrains Mono', monospace",fontSize:"10px", fontWeight: 600, color:cm.color, textTransform:"uppercase" }}>{p.channel}</span></td>
                        <td style={{padding:"16px 24px"}}><span style={{fontFamily: "'DM Sans', sans-serif", fontSize:"13px",color:"#94A3B8"}}>{p.submittedBy}</span></td>
                        <td style={{padding:"16px 24px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <Clock style={{ width: '12px', height: '12px', color:"#475569"}}/>
                            <span style={{fontFamily:"'JetBrains Mono', monospace",fontSize:"11px",color:p.age==="1d"?"#EF4444":"#F59E0B"}}>{p.age}</span>
                          </div>
                        </td>
                        <td style={{padding:"16px 24px"}}>
                          <span style={{ display:"inline-flex",alignItems:"center",gap:"6px", padding:"4px 10px",borderRadius:"100px", background:`${rm.color}15`, border:`1px solid ${rm.color}30`, fontFamily:"'JetBrains Mono', monospace",fontSize:"10px", fontWeight: 600, color:rm.color, textTransform:"uppercase" }}>
                            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:rm.color}}/> {p.risk}
                          </span>
                        </td>
                        <td style={{padding:"16px 24px"}}>
                          <div style={{display:"flex",gap:"8px"}}>
                            <button className="btn-ghost-db" style={{ padding:"6px 12px", color:"#3ECF6A", gap:"6px", background: 'rgba(62,207,106,0.1)', border: '1px solid rgba(62,207,106,0.3)' }}>
                              <CheckCircle style={{ width: '12px', height: '12px' }}/> Approve
                            </button>
                            <button className="btn-ghost-db" style={{ padding:"6px 12px", color:"#EF4444", gap:"6px", background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                              <Ban style={{ width: '12px', height: '12px' }}/> Reject
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{padding:"16px 24px",borderTop:`1px solid rgba(255,255,255,0.05)`, background:"rgba(255,255,255,0.02)",fontFamily:"'DM Sans', sans-serif",fontSize:"12px",color:"#475569", display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Approved templates are auto-submitted to TRAI DLT portal</span>
              <span style={{color:"#F59E0B"}}>SLA: 24h review window</span>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}