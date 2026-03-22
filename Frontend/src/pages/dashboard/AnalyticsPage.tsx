import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Zap, Clock, MessageSquare,
  Activity, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight,
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

const axisStyle = { fontFamily: T.mono, fontSize: 9, fill: T.dim, letterSpacing: "0.08em" };
const gridStyle = { stroke: "rgba(0,230,118,0.06)", strokeDasharray: "4 4" };

const ChartTooltip = ({ active, payload, label, unit = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(3,10,6,0.96)", border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 14px",
      fontFamily:T.mono, fontSize:11,
      boxShadow:`0 8px 24px rgba(0,0,0,0.6),0 0 20px rgba(0,230,118,0.06)`,
    }}>
      <div style={{ color:T.dim, marginBottom:5, letterSpacing:"0.12em", fontSize:9, textTransform:"uppercase" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color||T.green, fontWeight:700, marginBottom:2 }}>
          {p.name && <span style={{color:T.dim,marginRight:6}}>{p.name}</span>}
          {p.value}{unit}
        </div>
      ))}
    </div>
  );
};

/* ─── data ─── */
const responseData = [
  { day:"Mon", value:2.4 },{ day:"Tue", value:1.8 },{ day:"Wed", value:2.1 },
  { day:"Thu", value:1.5 },{ day:"Fri", value:1.2 },{ day:"Sat", value:0.9 },{ day:"Sun", value:1.1 },
];
const satisfactionData = [
  { month:"Jan", value:78 },{ month:"Feb", value:82 },{ month:"Mar", value:85 },
  { month:"Apr", value:88 },{ month:"May", value:91 },{ month:"Jun", value:94 },
];
const channelVolumeData = [
  { day:"Mon", whatsapp:120, email:80, sms:40, call:25 },
  { day:"Tue", whatsapp:145, email:95, sms:55, call:30 },
  { day:"Wed", whatsapp:132, email:88, sms:48, call:22 },
  { day:"Thu", whatsapp:160, email:102, sms:62, call:35 },
  { day:"Fri", whatsapp:178, email:115, sms:70, call:40 },
  { day:"Sat", whatsapp:90,  email:55, sms:30, call:15 },
  { day:"Sun", whatsapp:75,  email:48, sms:22, call:12 },
];
const sentimentTrend = [
  { day:"Mon", positive:62, neutral:26, negative:12 },
  { day:"Tue", positive:68, neutral:22, negative:10 },
  { day:"Wed", positive:59, neutral:28, negative:13 },
  { day:"Thu", positive:71, neutral:20, negative:9  },
  { day:"Fri", positive:74, neutral:18, negative:8  },
  { day:"Sat", positive:80, neutral:15, negative:5  },
  { day:"Sun", positive:77, neutral:17, negative:6  },
];
const alerts = [
  { id:1, type:"spike",   label:"Message volume spike on WhatsApp",     time:"12m ago", severity:"high" },
  { id:2, type:"drop",    label:"Response time degraded — avg 3.2m",     time:"28m ago", severity:"medium" },
  { id:3, type:"risk",    label:"3 high-risk customers need follow-up",  time:"1h ago",  severity:"high" },
  { id:4, type:"success", label:"CSAT hit 94% — highest this quarter",   time:"2h ago",  severity:"positive" },
];
const kpis = [
  { label:"Avg Response",     value:"1.2m",  change:"-28%",  up:true,  icon:Clock,         hint:"Time to first reply across all channels" },
  { label:"Resolution Rate",  value:"94.7%", change:"+5.2%", up:true,  icon:CheckCircle,   hint:"Conversations closed without escalation" },
  { label:"CSAT Score",       value:"4.8/5", change:"+0.3",  up:true,  icon:TrendingUp,    hint:"Avg customer satisfaction this week" },
  { label:"AI Assist Rate",   value:"67%",   change:"+12%",  up:true,  icon:Zap,           hint:"Messages handled or suggested by AI" },
  { label:"Active Chats",     value:"38",    change:"+4",    up:true,  icon:MessageSquare, hint:"Open conversations right now" },
  { label:"At-Risk Customers",value:"23",    change:"+3",    up:false, icon:AlertTriangle, hint:"Customers with negative sentiment trend" },
];
const TABS = ["Overview","Channels","Sentiment","Alerts"];

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:T.bgCard, border:`1px solid ${T.border}`,
      borderRadius:8, position:"relative", overflow:"hidden", ...style,
    }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${T.green}35,transparent)` }}/>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [tab, setTab] = useState("Overview");

  return (
    <div style={{
      padding:"24px 28px", background:T.bg,
      minHeight:"100%", fontFamily:T.body, color:T.text,
      overflowY:"auto",
    }}>

      {/* ── HEADER ── */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <Activity size={14} style={{color:T.green}}/>
          <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.18em",textTransform:"uppercase"}}>
            Performance Intelligence
          </span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <h1 style={{fontFamily:T.display,fontSize:"clamp(1.8rem,3vw,2.8rem)",letterSpacing:"0.06em",lineHeight:1,color:T.text}}>
            ANALYTICS
          </h1>
          <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:T.green,
              boxShadow:`0 0 6px ${T.green}`,display:"inline-block"}}/>
            Live · Updated 30s ago
          </div>
        </div>
      </motion.div>

      {/* ── KPI STRIP ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:20}}>
        {kpis.map((k,i)=>(
          <motion.div key={k.label}
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            title={k.hint}
            whileHover={{boxShadow:`0 0 20px rgba(0,230,118,0.09)`} as any}
            style={{
              background:T.bgCard, border:`1px solid ${T.border}`,
              borderRadius:6, padding:"14px 14px 12px",
              position:"relative", overflow:"hidden", cursor:"default",
              transition:"border-color 0.2s,box-shadow 0.2s",
            }}
          >
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,
              background:`linear-gradient(90deg,transparent,${k.up?T.green:"#ef5350"}50,transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontFamily:T.mono,fontSize:8,letterSpacing:"0.14em",color:T.dim,textTransform:"uppercase",lineHeight:1.3}}>
                {k.label}
              </span>
              <k.icon size={11} style={{color:k.up?`${T.green}80`:"#ef535080"}}/>
            </div>
            <div style={{
              fontFamily:T.display, fontSize:"1.6rem", letterSpacing:"0.04em",
              background:`linear-gradient(135deg,${k.up?T.green:T.muted},${k.up?T.aqua:T.dim})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              lineHeight:1, marginBottom:5,
            }}>{k.value}</div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              {k.up?<ArrowUpRight size={9} style={{color:T.green}}/>:<ArrowDownRight size={9} style={{color:"#ef5350"}}/>}
              <span style={{fontFamily:T.mono,fontSize:9,color:k.up?T.green:"#ef5350"}}>{k.change}</span>
              <span style={{fontFamily:T.mono,fontSize:8,color:T.dim}}>vs last week</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:4,marginBottom:18,borderBottom:`1px solid ${T.border}`}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"8px 18px", background:"transparent", border:"none",
            borderBottom:`2px solid ${tab===t?T.green:"transparent"}`,
            color:tab===t?T.green:T.dim,
            fontFamily:T.mono, fontSize:10, letterSpacing:"0.14em",
            textTransform:"uppercase", cursor:"pointer",
            transition:"all 0.18s", marginBottom:-1,
          }}>{t}</button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab==="Overview" && (
        <motion.div key="overview" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>

          <Card style={{padding:"20px 20px 14px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>Response Time Trend</div>
                <div style={{fontFamily:T.display,fontSize:"1.4rem",color:T.green,letterSpacing:"0.04em"}}>1.2 min avg</div>
              </div>
              <span style={{padding:"3px 10px",borderRadius:20,background:"rgba(0,230,118,0.10)",border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:9,color:T.green}}>
                ↓ 28% this week
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={responseData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.green} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle}/>
                <XAxis dataKey="day"   tick={axisStyle} axisLine={false} tickLine={false}/>
                <YAxis               tick={axisStyle} axisLine={false} tickLine={false} unit="m"/>
                <Tooltip content={<ChartTooltip unit="m"/>}/>
                <Area type="monotone" dataKey="value" stroke={T.green} strokeWidth={2} fill="url(#respGrad)"
                  dot={{fill:T.green,r:3,strokeWidth:0}}
                  activeDot={{fill:T.green,r:5,strokeWidth:0,filter:`drop-shadow(0 0 6px ${T.green})`}}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,marginTop:6,textAlign:"center"}}>
              Goal: ≤ 1.5 min · Faster = better for customer experience
            </div>
          </Card>

          <Card style={{padding:"20px",display:"flex",flexDirection:"column"}}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>CSAT Trend</div>
            <div style={{textAlign:"center",padding:"12px 0 8px"}}>
              <div style={{
                fontFamily:T.display, fontSize:"4rem", letterSpacing:"0.04em",
                background:`linear-gradient(135deg,${T.green},${T.aqua})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1,
              }}>94%</div>
              <div style={{fontFamily:T.mono,fontSize:9,color:T.green,marginTop:4}}>↑ Highest this quarter</div>
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={satisfactionData} margin={{top:4,right:4,bottom:0,left:-24}}>
                <CartesianGrid {...gridStyle}/>
                <XAxis dataKey="month" tick={{...axisStyle,fontSize:8}} axisLine={false} tickLine={false}/>
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[70,100]}/>
                <Tooltip content={<ChartTooltip unit="%"/>}/>
                <Line type="monotone" dataKey="value" stroke={T.aqua} strokeWidth={2}
                  dot={{fill:T.aqua,r:3,strokeWidth:0}}
                  activeDot={{fill:T.aqua,r:4,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:6,marginTop:12}}>
              {[["Promoters","72%",T.green],["Passives","18%",T.muted],["Detractors","10%","#ef5350"]].map(([l,v,c])=>(
                <div key={l as string} style={{flex:1,padding:"8px 6px",borderRadius:6,background:`${c as string}10`,border:`1px solid ${c as string}20`,textAlign:"center"}}>
                  <div style={{fontFamily:T.display,fontSize:"1.1rem",color:c as string}}>{v}</div>
                  <div style={{fontFamily:T.mono,fontSize:8,color:T.dim,letterSpacing:"0.08em"}}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ══ CHANNELS ══ */}
      {tab==="Channels" && (
        <motion.div key="channels" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <Card style={{padding:"20px 20px 14px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>Message Volume by Channel</div>
                <div style={{fontFamily:T.display,fontSize:"1.2rem",color:T.text,letterSpacing:"0.04em"}}>This Week · All Channels</div>
              </div>
              <div style={{display:"flex",gap:12}}>
                {[["WhatsApp",T.green],["Email",T.aqua],["SMS","#00bcd4"],["Call","#4db6ac"]].map(([l,c])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontFamily:T.mono,fontSize:9,color:T.muted}}>
                    <div style={{width:8,height:8,borderRadius:2,background:c as string}}/> {l}
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={channelVolumeData} margin={{top:4,right:4,bottom:0,left:-16}} barGap={2}>
                <CartesianGrid {...gridStyle} vertical={false}/>
                <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false}/>
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"rgba(3,10,6,0.96)",border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.mono,fontSize:11}}
                  labelStyle={{color:T.green,marginBottom:4,letterSpacing:"0.08em"}} itemStyle={{color:T.muted}}/>
                <Bar dataKey="whatsapp" name="WhatsApp" fill={T.green}  radius={[3,3,0,0]} maxBarSize={16}/>
                <Bar dataKey="email"    name="Email"    fill={T.aqua}   radius={[3,3,0,0]} maxBarSize={16}/>
                <Bar dataKey="sms"      name="SMS"      fill="#00bcd4"  radius={[3,3,0,0]} maxBarSize={16}/>
                <Bar dataKey="call"     name="Call"     fill="#4db6ac"  radius={[3,3,0,0]} maxBarSize={16}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {label:"WhatsApp",pct:48,msgs:895,color:T.green},
              {label:"Email",   pct:29,msgs:583,color:T.aqua},
              {label:"SMS",     pct:14,msgs:327,color:"#00bcd4"},
              {label:"Calls",   pct:9, msgs:179,color:"#4db6ac"},
            ].map(c=>(
              <Card key={c.label} style={{padding:"16px"}}>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,marginBottom:8,letterSpacing:"0.12em",textTransform:"uppercase"}}>{c.label}</div>
                <div style={{fontFamily:T.display,fontSize:"2rem",color:c.color,marginBottom:6}}>{c.pct}%</div>
                <div style={{width:"100%",height:3,borderRadius:2,background:"rgba(255,255,255,0.05)",overflow:"hidden",marginBottom:6}}>
                  <motion.div initial={{width:0}} animate={{width:`${c.pct}%`}} transition={{duration:0.8}}
                    style={{height:"100%",background:c.color,borderRadius:2}}/>
                </div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>{c.msgs.toLocaleString()} msgs</div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══ SENTIMENT ══ */}
      {tab==="Sentiment" && (
        <motion.div key="sentiment" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>

          <Card style={{padding:"20px 20px 14px"}}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>Sentiment Distribution · This Week</div>
            <div style={{fontFamily:T.display,fontSize:"1.2rem",color:T.text,marginBottom:14}}>
              77% Positive today — <span style={{color:T.green}}>↑ improving</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sentimentTrend} margin={{top:4,right:4,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.green} stopOpacity={0.28}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.muted} stopOpacity={0.18}/><stop offset="95%" stopColor={T.muted} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef5350" stopOpacity={0.20}/><stop offset="95%" stopColor="#ef5350" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle}/>
                <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false}/>
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} unit="%"/>
                <Tooltip contentStyle={{background:"rgba(3,10,6,0.96)",border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.mono,fontSize:11}}
                  labelStyle={{color:T.green,marginBottom:4}} itemStyle={{color:T.muted}}/>
                <Area type="monotone" dataKey="positive" name="Positive" stroke={T.green}   strokeWidth={2} fill="url(#posGrad)"/>
                <Area type="monotone" dataKey="neutral"  name="Neutral"  stroke={T.muted}   strokeWidth={1.5} fill="url(#neuGrad)"/>
                <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef5350"   strokeWidth={1.5} fill="url(#negGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:14,marginTop:8}}>
              {[["Positive",T.green],["Neutral",T.muted],["Negative","#ef5350"]].map(([l,c])=>(
                <div key={l as string} style={{display:"flex",alignItems:"center",gap:5,fontFamily:T.mono,fontSize:9,color:c as string}}>
                  <div style={{width:8,height:2,background:c as string,borderRadius:1}}/> {l}
                </div>
              ))}
            </div>
          </Card>

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card style={{padding:"16px"}}>
              <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Today's Snapshot</div>
              {[{label:"Positive",val:77,color:T.green},{label:"Neutral",val:17,color:T.muted},{label:"Negative",val:6,color:"#ef5350"}].map(s=>(
                <div key={s.label} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>{s.label}</span>
                    <span style={{fontFamily:T.mono,fontSize:9,color:s.color,fontWeight:700}}>{s.val}%</span>
                  </div>
                  <div style={{width:"100%",height:4,borderRadius:2,background:"rgba(255,255,255,0.05)"}}>
                    <motion.div initial={{width:0}} animate={{width:`${s.val}%`}} transition={{duration:0.8}}
                      style={{height:"100%",borderRadius:2,background:s.color,boxShadow:`0 0 8px ${s.color}60`}}/>
                  </div>
                </div>
              ))}
            </Card>

            <div style={{background:"rgba(239,83,80,0.06)",border:"1px solid rgba(239,83,80,0.18)",borderRadius:8,padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <AlertTriangle size={12} style={{color:"#ef5350"}}/>
                <span style={{fontFamily:T.mono,fontSize:9,color:"#ef5350",letterSpacing:"0.14em",textTransform:"uppercase"}}>Needs Attention</span>
              </div>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,lineHeight:1.7}}>
                <span style={{color:"#ef5350",fontWeight:700}}>3 customers</span> showed negative sentiment shift in last 2h. Recommend proactive outreach.
              </div>
              <button style={{
                marginTop:10,width:"100%",padding:"7px",borderRadius:6,
                background:"rgba(239,83,80,0.12)",border:"1px solid rgba(239,83,80,0.25)",
                color:"#ef5350",fontFamily:T.mono,fontSize:9,cursor:"pointer",
                letterSpacing:"0.10em",textTransform:"uppercase",
              }}>View At-Risk Customers →</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ ALERTS ══ */}
      {tab==="Alerts" && (
        <motion.div key="alerts" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <Card>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.16em",textTransform:"uppercase"}}>System Alerts</span>
              <span style={{padding:"3px 10px",borderRadius:20,background:"rgba(239,83,80,0.10)",border:"1px solid rgba(239,83,80,0.25)",fontFamily:T.mono,fontSize:9,color:"#ef5350"}}>
                2 critical
              </span>
            </div>
            {alerts.map((a,i)=>{
              const col = a.severity==="high"?"#ef5350":a.severity==="positive"?T.green:"#ffa726";
              return (
                <motion.div key={a.id}
                  initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}
                  whileHover={{backgroundColor:"rgba(0,230,118,0.025)"} as any}
                  style={{
                    padding:"16px 20px",borderBottom:"1px solid rgba(0,230,118,0.05)",
                    display:"flex",alignItems:"center",gap:14,
                    borderLeft:`2px solid ${col}`,cursor:"pointer",transition:"background 0.18s",
                  }}
                >
                  <div style={{width:32,height:32,borderRadius:8,flexShrink:0,
                    background:`${col}12`,border:`1px solid ${col}30`,
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {a.severity==="positive"
                      ? <CheckCircle size={14} style={{color:col}}/>
                      : a.severity==="high"
                      ? <AlertTriangle size={14} style={{color:col}}/>
                      : <Activity size={14} style={{color:col}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:T.text,marginBottom:3}}>{a.label}</div>
                    <div style={{fontFamily:T.mono,fontSize:9,color:T.dim}}>{a.time}</div>
                  </div>
                  <span style={{
                    padding:"3px 10px",borderRadius:20,
                    background:`${col}12`,border:`1px solid ${col}25`,
                    fontFamily:T.mono,fontSize:8,color:col,
                    letterSpacing:"0.10em",textTransform:"uppercase",
                  }}>{a.severity}</span>
                </motion.div>
              );
            })}
            <div style={{padding:"14px 20px",fontFamily:T.mono,fontSize:9,color:T.dim,textAlign:"center"}}>
              Showing last 4 alerts · All times in your timezone
            </div>
          </Card>
        </motion.div>
      )}

    </div>
  );
}