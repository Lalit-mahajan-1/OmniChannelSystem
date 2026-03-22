import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sliders, Globe, FileText, Sparkles, Zap,
  CheckCircle, XCircle, ToggleLeft, ToggleRight,
  TrendingUp, Clock, Shield, AlertTriangle, ChevronDown,
  Activity, MessageSquare, RefreshCw,
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
const TONES = [
  { id:"professional", label:"Professional",  desc:"Formal, precise. Best for loan & investment queries.", icon:"🏦" },
  { id:"empathetic",   label:"Empathetic",    desc:"Warm, understanding. Best for complaints & disputes.", icon:"🤝" },
  { id:"friendly",     label:"Friendly",      desc:"Conversational. Best for savings & general support.", icon:"💬" },
  { id:"urgent",       label:"Urgent",        desc:"Direct & action-oriented. Best for KYC & compliance.", icon:"⚡" },
];

const LANGUAGES = [
  { code:"en", label:"English",   native:"English",    active:true  },
  { code:"hi", label:"Hindi",     native:"हिंदी",       active:true  },
  { code:"mr", label:"Marathi",   native:"मराठी",       active:true  },
  { code:"ta", label:"Tamil",     native:"தமிழ்",       active:false },
  { code:"te", label:"Telugu",    native:"తెలుగు",      active:false },
  { code:"bn", label:"Bengali",   native:"বাংলা",       active:false },
  { code:"gu", label:"Gujarati",  native:"ગુજરાતી",     active:false },
  { code:"ar", label:"Arabic",    native:"عربي",        active:false },
];

const LOGS = [
  { time:"10:36 AM", customer:"Sarah Chen",    channel:"whatsapp", category:"Billing",    suggestion:"Processed FD renewal with 10% loyalty discount. Sent confirmation template.",    accepted:true,  confidence:94 },
  { time:"10:22 AM", customer:"Marcus Rivera", channel:"email",    category:"Escalation", suggestion:"Flagged for billing team escalation — unresolved for 3 days.",                  accepted:false, confidence:71 },
  { time:"09:50 AM", customer:"Aisha Patel",   channel:"sms",      category:"Logistics",  suggestion:"Provided courier tracking ID and estimated delivery window.",                    accepted:true,  confidence:88 },
  { time:"09:15 AM", customer:"Tom Bradley",   channel:"email",    category:"Follow-up",  suggestion:"Auto-generated follow-up email for missed call — sent after 2h window.",        accepted:true,  confidence:96 },
  { time:"08:44 AM", customer:"Lin Wei",       channel:"whatsapp", category:"Support",    suggestion:"Detected positive resolution. Triggered CSAT feedback survey.",                 accepted:true,  confidence:91 },
  { time:"08:12 AM", customer:"Priya Sharma",  channel:"email",    category:"Compliance", suggestion:"KYC deadline reminder sent. Flagged for compliance team if no response in 48h.",accepted:true,  confidence:99 },
];

const TOGGLES = [
  { id:"auto_suggest",    label:"AI Auto-Suggest",          desc:"Proactively suggest replies during live conversations",    on:true  },
  { id:"sentiment_alert", label:"Sentiment Alerts",         desc:"Alert agents when customer sentiment turns negative",      on:true  },
  { id:"intent_classify", label:"Intent Classification",    desc:"Automatically tag messages as support/billing/complaint",  on:true  },
  { id:"auto_translate",  label:"Auto-Translation",         desc:"Translate incoming messages to agent's language",          on:false },
  { id:"smart_routing",   label:"AI Smart Routing",         desc:"Route conversations to best-fit agent automatically",      on:true  },
  { id:"csat_trigger",    label:"CSAT Auto-Trigger",        desc:"Send feedback surveys after every resolved conversation",  on:false },
];

const PERF_STATS = [
  { label:"Suggestions Today", value:"247",  icon:Sparkles,   color:T.green },
  { label:"Accepted Rate",     value:"82%",  icon:TrendingUp, color:T.green },
  { label:"Avg Quality Score", value:"4.6",  icon:Activity,   color:T.aqua  },
  { label:"Time Saved Today",  value:"3.2h", icon:Clock,      color:T.green },
];

const channelColor: Record<string, string> = {
  whatsapp:"#00e676", email:T.aqua, sms:"#00bcd4",
};

const catColor: Record<string, string> = {
  Billing:"#ffa726", Escalation:"#ef5350", Logistics:T.aqua,
  "Follow-up":T.muted, Support:T.green, Compliance:"#ef5350",
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width:44, height:24, borderRadius:12, flexShrink:0,
      background:on ? `linear-gradient(135deg,${T.green},${T.greenDeep})` : "rgba(255,255,255,0.08)",
      border:`1px solid ${on ? T.green : "rgba(255,255,255,0.12)"}`,
      position:"relative", cursor:"pointer", transition:"all 0.25s",
      boxShadow: on ? `0 0 12px rgba(0,230,118,0.25)` : "none",
    }}>
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type:"spring", stiffness:500, damping:30 }}
        style={{
          width:18, height:18, borderRadius:"50%",
          background: on ? "#03060a" : T.dim,
          position:"absolute", top:2,
        }}
      />
    </button>
  );
}

function ConfidenceBar({ val }: { val: number }) {
  const color = val >= 90 ? T.green : val >= 75 ? "#ffa726" : "#ef5350";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:50, height:3, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${val}%` }}
          transition={{ duration:0.6 }}
          style={{ height:"100%", background:color, borderRadius:2 }}
        />
      </div>
      <span style={{ fontFamily:T.mono, fontSize:9, color, minWidth:28 }}>{val}%</span>
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function AIControlPage() {
  const [tone,       setTone]       = useState("professional");
  const [confidence, setConfidence] = useState(75);
  const [languages,  setLanguages]  = useState(LANGUAGES);
  const [toggles,    setToggles]    = useState(TOGGLES);
  const [logFilter,  setLogFilter]  = useState("all");
  const [expanded,   setExpanded]   = useState<number | null>(null);

  const toggleLang = (code: string) =>
    setLanguages(prev => prev.map(l => l.code === code ? { ...l, active: !l.active } : l));

  const toggleFeature = (id: string) =>
    setToggles(prev => prev.map(t => t.id === id ? { ...t, on: !t.on } : t));

  const filteredLogs = logFilter === "all"
    ? LOGS
    : LOGS.filter(l => logFilter === "accepted" ? l.accepted : !l.accepted);

  const activeLangs = languages.filter(l => l.active).length;
  const acceptedCount = LOGS.filter(l => l.accepted).length;

  return (
    <div style={{
      padding:"24px 28px", background:T.bg,
      minHeight:"100%", fontFamily:T.body, color:T.text,
      overflowY:"auto",
    }}>

      {/* ── HEADER ── */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <Brain size={14} style={{color:T.green}}/>
          <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.18em",textTransform:"uppercase"}}>
            AI Engine Configuration
          </span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <h1 style={{fontFamily:T.display,fontSize:"clamp(1.8rem,3vw,2.8rem)",letterSpacing:"0.06em",lineHeight:1,color:T.text}}>
            AI CONTROL
          </h1>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:6,
              background:"rgba(0,230,118,0.06)",border:`1px solid ${T.border}`,
              fontFamily:T.mono,fontSize:9,color:T.green}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:T.green,
                boxShadow:`0 0 6px ${T.green}`,display:"inline-block"}}/>
              AI Engine: Online
            </div>
            <button style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"8px 14px",borderRadius:6,
              background:`linear-gradient(135deg,${T.green},${T.greenDeep})`,
              border:"none",color:"#03060a",fontFamily:T.mono,fontSize:10,
              fontWeight:700,cursor:"pointer",letterSpacing:"0.10em",
              boxShadow:`0 0 16px rgba(0,230,118,0.22)`,
            }}>
              <RefreshCw size={11}/> Apply Changes
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── PERF STATS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {PERF_STATS.map((s,i)=>(
          <motion.div key={s.label}
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,
              padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,
              background:`linear-gradient(90deg,transparent,${s.color}50,transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontFamily:T.mono,fontSize:8,letterSpacing:"0.14em",color:T.dim,textTransform:"uppercase"}}>{s.label}</span>
              <s.icon size={11} style={{color:`${s.color}80`}}/>
            </div>
            <div style={{fontFamily:T.display,fontSize:"2rem",letterSpacing:"0.04em",
              background:`linear-gradient(135deg,${s.color},${s.color}88)`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1,marginBottom:4}}>
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>

        {/* RESPONSE TONE */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
          style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${T.green}40,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:28,height:28,borderRadius:7,background:"rgba(0,230,118,0.10)",border:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Sliders size={13} style={{color:T.green}}/>
            </div>
            <div>
              <div style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.12em",textTransform:"uppercase"}}>Response Tone</div>
              <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,marginTop:2}}>How the AI communicates with customers</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {TONES.map(t=>{
              const active = tone===t.id;
              return (
                <motion.button key={t.id}
                  whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                  onClick={()=>setTone(t.id)}
                  style={{
                    padding:"12px 14px",borderRadius:7,cursor:"pointer",textAlign:"left",
                    background:active?"rgba(0,230,118,0.10)":"rgba(255,255,255,0.03)",
                    border:`1px solid ${active?T.green:T.border}`,
                    transition:"all 0.2s",
                    boxShadow:active?`0 0 16px rgba(0,230,118,0.10)`:"none",
                    position:"relative",overflow:"hidden",
                  }}
                >
                  {active && <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                    background:`linear-gradient(90deg,transparent,${T.green},transparent)`}}/>}
                  <div style={{fontSize:18,marginBottom:6}}>{t.icon}</div>
                  <div style={{fontFamily:T.mono,fontSize:10,fontWeight:700,
                    color:active?T.green:T.text,letterSpacing:"0.06em",marginBottom:4}}>
                    {t.label}
                  </div>
                  <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{t.desc}</div>
                  {active && (
                    <div style={{position:"absolute",bottom:8,right:10}}>
                      <CheckCircle size={12} style={{color:T.green}}/>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* CONFIDENCE THRESHOLD */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
          style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${T.aqua}40,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:28,height:28,borderRadius:7,background:"rgba(127,255,212,0.10)",border:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Brain size={13} style={{color:T.aqua}}/>
            </div>
            <div>
              <div style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.aqua,letterSpacing:"0.12em",textTransform:"uppercase"}}>Confidence Threshold</div>
              <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,marginTop:2}}>Min confidence before AI shows a suggestion</div>
            </div>
          </div>

          {/* Big number display */}
          <div style={{textAlign:"center",margin:"10px 0 16px"}}>
            <div style={{fontFamily:T.display,fontSize:"4rem",letterSpacing:"0.04em",
              background:`linear-gradient(135deg,${confidence>=75?T.green:confidence>=50?"#ffa726":"#ef5350"},${T.aqua})`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>
              {confidence}%
            </div>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginTop:4}}>
              {confidence>=80?"High precision · fewer, better suggestions"
               :confidence>=60?"Balanced · recommended for most teams"
               :"Aggressive · more suggestions, lower precision"}
            </div>
          </div>

          {/* Slider */}
          <div style={{position:"relative",marginBottom:14}}>
            <input type="range" min={0} max={100} value={confidence}
              onChange={e=>setConfidence(+e.target.value)}
              style={{
                width:"100%", height:4, borderRadius:2,
                appearance:"none", outline:"none", cursor:"pointer",
                background:`linear-gradient(90deg, ${T.green} ${confidence}%, rgba(255,255,255,0.08) ${confidence}%)`,
              }}
            />
          </div>

          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <span style={{fontFamily:T.mono,fontSize:8,color:T.dim}}>0% — All suggestions</span>
            <span style={{fontFamily:T.mono,fontSize:8,color:T.dim}}>100% — Only certain</span>
          </div>

          {/* Zone labels */}
          <div style={{display:"flex",gap:6}}>
            {[
              {label:"Conservative",range:"80–100%",color:T.green,   active:confidence>=80},
              {label:"Balanced",    range:"60–79%", color:"#ffa726", active:confidence>=60&&confidence<80},
              {label:"Aggressive",  range:"0–59%",  color:"#ef5350", active:confidence<60},
            ].map(z=>(
              <div key={z.label} style={{
                flex:1,padding:"8px 6px",borderRadius:6,textAlign:"center",
                background:z.active?`${z.color}10`:"rgba(255,255,255,0.02)",
                border:`1px solid ${z.active?z.color+"35":T.border}`,
                transition:"all 0.2s",
              }}>
                <div style={{fontFamily:T.mono,fontSize:8,color:z.active?z.color:T.dim,fontWeight:700}}>{z.label}</div>
                <div style={{fontFamily:T.mono,fontSize:7,color:T.dim,marginTop:2}}>{z.range}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── SECOND ROW: Languages + Toggles ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>

        {/* LANGUAGES */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${T.green}40,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:7,background:"rgba(0,230,118,0.10)",border:`1px solid ${T.border}`,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Globe size={13} style={{color:T.green}}/>
              </div>
              <div>
                <div style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.12em",textTransform:"uppercase"}}>Languages</div>
                <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,marginTop:2}}>AI responds in customer's language</div>
              </div>
            </div>
            <span style={{padding:"2px 10px",borderRadius:20,background:"rgba(0,230,118,0.10)",border:`1px solid ${T.border}`,
              fontFamily:T.mono,fontSize:9,color:T.green}}>{activeLangs} active</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {languages.map(l=>(
              <button key={l.code}
                onClick={()=>toggleLang(l.code)}
                style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"8px 12px",borderRadius:7,cursor:"pointer",
                  background:l.active?"rgba(0,230,118,0.07)":"rgba(255,255,255,0.02)",
                  border:`1px solid ${l.active?T.green+"40":T.border}`,
                  transition:"all 0.18s",
                }}
              >
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:T.mono,fontSize:10,color:l.active?T.green:T.muted,fontWeight:700}}>{l.label}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>{l.native}</div>
                </div>
                <div style={{
                  width:18,height:18,borderRadius:"50%",flexShrink:0,
                  background:l.active?"rgba(0,230,118,0.15)":"rgba(255,255,255,0.04)",
                  border:`1px solid ${l.active?T.green+"50":T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {l.active
                    ? <CheckCircle size={10} style={{color:T.green}}/>
                    : <span style={{width:6,height:6,borderRadius:"50%",background:T.dim}}/>}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* AI FEATURE TOGGLES */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
          style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${T.aqua}40,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:28,height:28,borderRadius:7,background:"rgba(127,255,212,0.10)",border:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Zap size={13} style={{color:T.aqua}}/>
            </div>
            <div>
              <div style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.aqua,letterSpacing:"0.12em",textTransform:"uppercase"}}>AI Features</div>
              <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,marginTop:2}}>Enable or disable AI capabilities per your policy</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {toggles.map(t=>(
              <div key={t.id} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
                padding:"10px 12px",borderRadius:7,
                background:t.on?"rgba(0,230,118,0.04)":"rgba(255,255,255,0.02)",
                border:`1px solid ${t.on?"rgba(0,230,118,0.14)":T.border}`,
                transition:"all 0.2s",
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:T.mono,fontSize:10,color:t.on?T.text:T.muted,fontWeight:700,letterSpacing:"0.04em",marginBottom:2}}>
                    {t.label}
                  </div>
                  <div style={{fontSize:10,color:T.dim,lineHeight:1.45}}>{t.desc}</div>
                </div>
                <Toggle on={t.on} onChange={()=>toggleFeature(t.id)}/>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── AI SUGGESTION LOGS ── */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${T.green}40,transparent)`}}/>
        </div>

        {/* header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <FileText size={14} style={{color:T.green}}/>
            <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.16em",textTransform:"uppercase"}}>
              AI Suggestion Log
            </span>
            <span style={{padding:"2px 8px",borderRadius:20,background:"rgba(0,230,118,0.08)",border:`1px solid ${T.border}`,
              fontFamily:T.mono,fontSize:8,color:T.green}}>{LOGS.length} today</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            {["all","accepted","dismissed"].map(f=>(
              <button key={f} onClick={()=>setLogFilter(f)} style={{
                padding:"4px 12px",borderRadius:20,cursor:"pointer",
                fontFamily:T.mono,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",
                border:`1px solid ${logFilter===f?T.green:T.border}`,
                background:logFilter===f?"rgba(0,230,118,0.08)":"transparent",
                color:logFilter===f?T.green:T.dim,transition:"all 0.18s",
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* acceptance summary */}
        <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,
          background:"rgba(0,230,118,0.02)",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontFamily:T.mono,fontSize:9,color:T.muted}}>
            <CheckCircle size={10} style={{color:T.green}}/> {acceptedCount} accepted
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,fontFamily:T.mono,fontSize:9,color:T.muted}}>
            <XCircle size={10} style={{color:"#ef5350"}}/> {LOGS.length - acceptedCount} dismissed
          </div>
          <div style={{width:120,height:4,borderRadius:2,background:"rgba(239,83,80,0.20)",overflow:"hidden",marginLeft:4}}>
            <div style={{height:"100%",borderRadius:2,background:T.green,
              width:`${Math.round((acceptedCount/LOGS.length)*100)}%`}}/>
          </div>
          <span style={{fontFamily:T.mono,fontSize:9,color:T.green}}>
            {Math.round((acceptedCount/LOGS.length)*100)}% acceptance rate
          </span>
        </div>

        {/* log rows */}
        <div>
          <AnimatePresence>
            {filteredLogs.map((l,i)=>{
              const isOpen = expanded===i;
              return (
                <motion.div key={i}
                  initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                  transition={{delay:i*0.04}}
                  onClick={()=>setExpanded(isOpen?null:i)}
                  style={{
                    padding:"13px 20px",borderBottom:"1px solid rgba(0,230,118,0.05)",
                    cursor:"pointer",transition:"background 0.18s",
                    borderLeft:`2px solid ${l.accepted?T.green:"#ef535050"}`,
                  }}
                  whileHover={{backgroundColor:"rgba(0,230,118,0.025)"} as any}
                >
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    {/* time */}
                    <span style={{fontFamily:T.mono,fontSize:9,color:T.dim,flexShrink:0,minWidth:56}}>{l.time}</span>

                    {/* customer */}
                    <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0,minWidth:110}}>
                      <div style={{
                        width:26,height:26,borderRadius:"50%",
                        background:"linear-gradient(135deg,rgba(0,230,118,0.18),rgba(127,255,212,0.10))",
                        border:`1px solid ${T.border}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:T.mono,fontSize:9,fontWeight:700,color:T.green,
                      }}>
                        {l.customer.split(" ").map((n:string)=>n[0]).join("")}
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:10,color:T.text,fontWeight:700}}>{l.customer}</span>
                    </div>

                    {/* category */}
                    <span style={{
                      padding:"2px 8px",borderRadius:20,flexShrink:0,
                      background:`${catColor[l.category]||T.muted}12`,
                      border:`1px solid ${catColor[l.category]||T.muted}25`,
                      fontFamily:T.mono,fontSize:8,color:catColor[l.category]||T.muted,
                      letterSpacing:"0.08em",textTransform:"uppercase",
                    }}>{l.category}</span>

                    {/* channel dot */}
                    <span style={{
                      padding:"2px 8px",borderRadius:20,flexShrink:0,
                      background:`${channelColor[l.channel]}12`,
                      border:`1px solid ${channelColor[l.channel]}25`,
                      fontFamily:T.mono,fontSize:8,color:channelColor[l.channel],
                      letterSpacing:"0.08em",textTransform:"uppercase",
                    }}>{l.channel}</span>

                    {/* suggestion text */}
                    <span style={{flex:1,fontSize:12,color:T.muted,overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {l.suggestion}
                    </span>

                    {/* confidence */}
                    <ConfidenceBar val={l.confidence}/>

                    {/* accepted badge */}
                    <span style={{
                      display:"inline-flex",alignItems:"center",gap:4,flexShrink:0,
                      padding:"3px 10px",borderRadius:20,
                      background:l.accepted?"rgba(0,230,118,0.10)":"rgba(239,83,80,0.08)",
                      border:`1px solid ${l.accepted?"rgba(0,230,118,0.25)":"rgba(239,83,80,0.20)"}`,
                      fontFamily:T.mono,fontSize:8,color:l.accepted?T.green:"#ef5350",
                      letterSpacing:"0.08em",textTransform:"uppercase",
                    }}>
                      {l.accepted?<CheckCircle size={8}/>:<XCircle size={8}/>}
                      {l.accepted?"Accepted":"Dismissed"}
                    </span>

                    <ChevronDown size={12} style={{
                      color:T.dim,flexShrink:0,transition:"transform 0.2s",
                      transform:isOpen?"rotate(180deg)":"rotate(0deg)",
                    }}/>
                  </div>

                  {/* expanded */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                        exit={{opacity:0,height:0}} transition={{duration:0.2}}
                        style={{overflow:"hidden"}}
                      >
                        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,
                          display:"flex",alignItems:"flex-start",gap:12}}>
                          <div style={{flex:1,padding:"10px 14px",borderRadius:7,
                            background:"rgba(0,230,118,0.04)",border:`1px solid ${T.border}`}}>
                            <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,letterSpacing:"0.12em",
                              textTransform:"uppercase",marginBottom:5}}>Full AI Suggestion</div>
                            <p style={{fontSize:12,color:T.text,lineHeight:1.65,margin:0}}>{l.suggestion}</p>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                            <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,textAlign:"right"}}>Confidence</div>
                            <ConfidenceBar val={l.confidence}/>
                            <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,textAlign:"right",marginTop:4}}>Model</div>
                            <div style={{fontFamily:T.mono,fontSize:9,color:T.green}}>ConvoSphere v2.1</div>
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

        <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,
          background:"rgba(0,230,118,0.02)",fontFamily:T.mono,fontSize:9,color:T.dim,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>All AI suggestions are logged for compliance & audit</span>
          <span style={{color:T.green}}>Retention: 90 days</span>
        </div>
      </motion.div>
    </div>
  );
}