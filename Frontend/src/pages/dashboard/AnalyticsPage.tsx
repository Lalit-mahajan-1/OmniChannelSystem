import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Zap, Clock, MessageSquare,
  Activity, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight,
  Loader2, AlertCircle, RefreshCw, Mail, Smartphone, Globe, ChevronRight, XCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

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

const ANALYTICS_AGENT = import.meta.env.VITE_ANALYTICS_AGENT_URL;
const TABS = ["Overview", "Channels", "Sentiment", "Alerts"];

/* ════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [tab, setTab] = useState("Overview");
  
  const [metrics, setMetrics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<any>(null);
  const [sentimentTrend, setSentimentTrend] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setError("");
    try {
      const [m, r, c, s, a] = await Promise.all([
        axios.get(`${ANALYTICS_AGENT}/analytics-agent/metrics`),
        axios.get(`${ANALYTICS_AGENT}/analytics-agent/recommendations`),
        axios.get(`${ANALYTICS_AGENT}/analytics-agent/channel-breakdown`),
        axios.get(`${ANALYTICS_AGENT}/analytics-agent/sentiment-trend`),
        axios.get(`${ANALYTICS_AGENT}/analytics-agent/alerts`)
      ]);
      setMetrics(m.data);
      setRecommendations(r.data.recommendations || []);
      setChannelBreakdown(c.data);
      setSentimentTrend(s.data);
      setAlerts(a.data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch analytics from agent: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeDiff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
  const isStale = timeDiff > 120;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-green-400 opacity-60 bg-black/90">
        <Loader2 className="w-8 h-8 animate-spin text-[#00e676]" />
        <p className="text-xs uppercase tracking-widest font-mono font-bold">Initializing Analytics Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-red-400 bg-black/90">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm font-bold">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 border border-red-400/30 rounded bg-red-400/10 text-xs font-mono uppercase tracking-widest hover:bg-red-400/30 transition-all">Retry</button>
      </div>
    );
  }

  const kpis = metrics ? [
    { label:"Avg Response",     value:`${metrics.summary?.activeChats || 0}m`, change:`Using Active Load`, up:false, icon:Clock,         hint:"Time to first reply across all channels" },
    { label:"Resolution Rate",  value:`${metrics.rates?.emailResolutionRate || 0}%`, change:`Calculated Live`, up:true, icon:CheckCircle,   hint:"Conversations closed without escalation" },
    { label:"CSAT Score",       value:`${metrics.sentiment?.positive || 0}%`, change:`Last 24h limit`, up:true,  icon:TrendingUp,    hint:"Avg customer satisfaction this week" },
    { label:"AI Assist Rate",   value:`${metrics.rates?.aiReplyRate || 0}%`, change:`Autodrafts utilized`,  up:true,  icon:Zap,           hint:"Messages handled or suggested by AI" },
    { label:"Active Chats",     value:`${metrics.summary?.activeChats || 0}`,    change:`Real-time count`,  up:true,  icon:MessageSquare, hint:"Open conversations right now" },
    { label:"At-Risk Customers",value:`${metrics.summary?.atRiskCustomers || 0}`,    change:`Detected globally`, up:false, icon:AlertTriangle, hint:"Customers with negative sentiment trend" },
  ] : [];

  const activityData = [
    { name: "Emails Last 24h", value: metrics?.recentActivity?.emailsLast24h || 0 },
    { name: "WA Last 24h", value: metrics?.recentActivity?.whatsappLast24h || 0 }
  ];

  const trendData = sentimentTrend?.trend?.map((t: any) => ({
    date: t.date,
    value: Math.round((t.positive / (t.positive + t.neutral + t.negative || 1)) * 100)
  })) || [];

  return (
    <div style={{
      padding:"24px 28px", background:T.bg,
      minHeight:"100%", fontFamily:T.body, color:T.text,
      overflowY:"auto"
    }}>

      {/* ── HEADER ── */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Activity size={14} style={{color:T.green}}/>
              <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.18em",textTransform:"uppercase"}}>
                Performance Intelligence
              </span>
            </div>
            <h1 style={{fontFamily:T.display,fontSize:"clamp(1.8rem,3vw,2.8rem)",letterSpacing:"0.06em",lineHeight:1,color:T.text}}>
              ANALYTICS
            </h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={fetchData} className="p-2 rounded bg-white/[0.05] border border-white/[0.05] hover:bg-white/[0.1] transition-all">
              <RefreshCw className={`w-4 h-4 text-green-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div style={{fontFamily:T.mono,fontSize:9,color:isStale ? "#ffa726" : T.dim,display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,padding:"6px 12px",borderRadius:20}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:isStale ? "#ffa726" : T.green,
                boxShadow:`0 0 6px ${isStale ? "#ffa726" : T.green}`,display:"inline-block"}}/>
              Live · Updated {Math.floor(timeDiff)}s ago
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI STRIP ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:8,marginBottom:20}}>
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
              <k.icon size={11} style={{color:k.up?`${T.green}80`:"#cddc39"}}/>
            </div>
            <motion.div 
               key={k.value} 
               initial={{scale:1.1, opacity:0.8}} 
               animate={{scale:1, opacity:1}}
               transition={{type:"spring", stiffness:300}}
               style={{
                  fontFamily:T.display, fontSize:"1.6rem", letterSpacing:"0.04em",
                  background:`linear-gradient(135deg,${k.up?T.green:T.muted},${k.up?T.aqua:T.dim})`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  lineHeight:1, marginBottom:5,
               }}
            >
              {k.value}
            </motion.div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:T.mono,fontSize:8,color:T.dim}}>{k.change}</span>
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
                <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>Response Activity Trend</div>
                <div style={{fontFamily:T.display,fontSize:"1.4rem",color:T.green,letterSpacing:"0.04em"}}>24H Snapshot</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={activityData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <CartesianGrid {...gridStyle}/>
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false}/>
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip unit=" interactions"/>}/>
                <Bar dataKey="value" fill={T.green} radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{padding:"20px",display:"flex",flexDirection:"column"}}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>CSAT Trend</div>
            <div style={{textAlign:"center",padding:"12px 0 8px"}}>
              <div style={{
                fontFamily:T.display, fontSize:"4rem", letterSpacing:"0.04em",
                background:`linear-gradient(135deg,${T.green},${T.aqua})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1,
              }}>{metrics?.sentiment?.positive || 0}%</div>
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={trendData} margin={{top:4,right:4,bottom:0,left:-24}}>
                <CartesianGrid {...gridStyle}/>
                <XAxis dataKey="date" tick={{...axisStyle,fontSize:8}} axisLine={false} tickLine={false}/>
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0,100]}/>
                <Tooltip content={<ChartTooltip unit="%"/>}/>
                <Line type="monotone" dataKey="value" stroke={T.aqua} strokeWidth={2}
                  dot={{fill:T.aqua,r:3,strokeWidth:0}}
                  activeDot={{fill:T.aqua,r:4,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* ══ CHANNELS ══ */}
      {tab==="Channels" && channelBreakdown && (
        <motion.div key="channels" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Email Card */}
           <Card style={{padding:"20px"}}>
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"><Mail className="w-5 h-5 text-blue-400"/></div>
                 <h3 className="font-bold text-lg text-blue-400">Email Pipeline</h3>
              </div>
              <div className="space-y-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Total Volume</span><span className="text-white font-bold text-sm bg-white/5 py-0.5 px-2 rounded">{channelBreakdown.email?.total || 0}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Replied</span><span className="text-green-400 font-bold">{channelBreakdown.email?.replied || 0}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Pending</span><span className="text-orange-400 font-bold">{channelBreakdown.email?.unreplied || 0}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>AI Handled</span><span className="text-purple-400 font-bold">{channelBreakdown.email?.aiReplied || 0}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span>Resolution Rate</span><span className="text-blue-400 font-bold">{channelBreakdown.email?.resolutionRate || 0}%</span>
                 </div>
              </div>
              <div className="mt-4 w-full h-1.5 bg-blue-500/10 rounded overflow-hidden">
                 <motion.div initial={{width:0}} animate={{width:`${channelBreakdown.email?.resolutionRate||0}%`}} className="h-full bg-blue-400" />
              </div>
           </Card>

           {/* WA Card */}
           <Card style={{padding:"20px"}}>
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20"><Smartphone className="w-5 h-5 text-green-400"/></div>
                 <h3 className="font-bold text-lg text-green-400">WhatsApp Hub</h3>
              </div>
              <div className="space-y-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Total Chats</span><span className="text-white font-bold text-sm bg-white/5 py-0.5 px-2 rounded">{channelBreakdown.whatsapp?.total || 0}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Unread</span><span className="text-orange-400 font-bold">{channelBreakdown.whatsapp?.unread || 0}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Active Flows</span><span className="text-green-400 font-bold">{channelBreakdown.whatsapp?.active || 0}</span>
                 </div>
              </div>
           </Card>

           {/* Social Card */}
           <Card style={{padding:"20px"}}>
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"><Globe className="w-5 h-5 text-purple-400"/></div>
                 <h3 className="font-bold text-lg text-purple-400">Social Radar</h3>
              </div>
              <div className="space-y-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Scraped Total</span><span className="text-white font-bold text-sm bg-white/5 py-0.5 px-2 rounded">{channelBreakdown.social?.total || 0}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                   <span>Complaints</span><span className="text-red-400 font-bold">{channelBreakdown.social?.complaints || 0}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span>Resolved</span><span className="text-green-400 font-bold">{channelBreakdown.social?.resolved || 0}</span>
                 </div>
                 <div className="text-[10px] mt-4 pt-4 border-t border-white/[0.06] opacity-80 space-y-2">
                   <div className="flex justify-between text-blue-300"><span>Twitter</span><span>{channelBreakdown.social?.byPlatform?.twitter || 0}</span></div>
                   <div className="flex justify-between text-orange-300"><span>Reddit</span><span>{channelBreakdown.social?.byPlatform?.reddit || 0}</span></div>
                   <div className="flex justify-between text-red-300"><span>YouTube</span><span>{channelBreakdown.social?.byPlatform?.youtube || 0}</span></div>
                 </div>
              </div>
           </Card>
        </motion.div>
      )}

      {/* ══ SENTIMENT ══ */}
      {tab==="Sentiment" && sentimentTrend && (
        <motion.div key="sentiment" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Card style={{padding:"20px 20px 14px"}}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>7-Day Sentiment Timeline</div>
            <ResponsiveContainer width="100%" height={200}>
               <AreaChart data={sentimentTrend.trend} margin={{top:4,right:4,bottom:0,left:-20}}>
                 <defs>
                   <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.28}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                   <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.muted} stopOpacity={0.18}/><stop offset="95%" stopColor={T.muted} stopOpacity={0}/></linearGradient>
                   <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef5350" stopOpacity={0.20}/><stop offset="95%" stopColor="#ef5350" stopOpacity={0}/></linearGradient>
                 </defs>
                 <CartesianGrid {...gridStyle}/>
                 <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false}/>
                 <YAxis tick={axisStyle} axisLine={false} tickLine={false}/>
                 <Tooltip contentStyle={{background:"rgba(3,10,6,0.96)",border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.mono,fontSize:11}} labelStyle={{color:T.green,marginBottom:4}} itemStyle={{color:T.muted}}/>
                 <Area type="monotone" dataKey="positive" name="Positive" stroke={T.green} strokeWidth={2} fill="url(#posGrad)"/>
                 <Area type="monotone" dataKey="neutral" name="Neutral" stroke={T.muted} strokeWidth={1.5} fill="url(#neuGrad)"/>
                 <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef5350" strokeWidth={1.5} fill="url(#negGrad)"/>
               </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{padding:"20px"}}>
             <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:20}}>Overall Breakdown</div>
             {[{label:"Positive",val:sentimentTrend.overall?.positive||0,color:T.green},{label:"Neutral",val:sentimentTrend.overall?.neutral||0,color:T.muted},{label:"Negative",val:sentimentTrend.overall?.negative||0,color:"#ef5350"}].map(s=>(
               <div key={s.label} className="mb-6 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                 <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs tracking-widest uppercase font-bold" style={{color:s.color}}>{s.label}</span>
                    <span className="font-display text-2xl" style={{color:s.color}}>{s.val}</span>
                 </div>
               </div>
             ))}
          </Card>
        </motion.div>
      )}

      {/* ══ ALERTS ══ */}
      {tab==="Alerts" && (
        <motion.div key="alerts" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <Card style={{padding:"20px"}}>
             <h3 style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.green,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Active System Alerts</h3>
             {alerts.length === 0 ? (
                <div className="text-center p-8 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                   <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
                   <p className="font-bold text-sm uppercase tracking-widest">All Clear</p>
                   <p className="text-xs mt-1 opacity-70">No active alerts detected. Systems normal.</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {alerts.map((a: any, i: number) => {
                      const color = a.severity === "critical" ? "#ef5350" : a.severity === "high" ? "#ffa726" : "#ffca28";
                      return (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl shadow-sm border bg-white/[0.02]" style={{borderColor:`${color}30`}}>
                           <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg" style={{background:`${color}20`,color:color}}><AlertTriangle className="w-5 h-5"/></div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded" style={{background:`${color}20`,color}}>{a.severity}</span>
                                    <span style={{fontFamily:T.mono,fontSize:9,color:T.dim}}>{a.type}</span>
                                 </div>
                                 <p className="font-bold text-sm text-white/90">{a.title}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <p className="text-xs text-muted-foreground max-w-xs">{a.action}</p>
                              {a.link && (
                                 <a href={a.link} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors text-black whitespace-nowrap" style={{background:color}}>
                                    Go Fix <ChevronRight className="w-3.5 h-3.5"/>
                                 </a>
                              )}
                           </div>
                        </div>
                      )
                   })}
                </div>
             )}
          </Card>
        </motion.div>
      )}

      {/* ── AL RECOMMENDATIONS PANEL ── */}
      <div className="mt-8">
        <div className="flex flex-col mb-4">
           <h2 className="text-xl font-bold font-display tracking-wide text-green-400 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> AI Action Recommendations
           </h2>
           <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Based on current system metrics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {recommendations.length === 0 && loading === false && (
              <div className="col-span-full p-8 text-center bg-white/[0.02] border border-white/[0.05] rounded-xl text-muted-foreground">
                 <p className="text-sm font-bold opacity-70">No critical recommendations at this time.</p>
              </div>
           )}
           {recommendations.map((rec: any, i: number) => {
              const priorityCol = rec.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : rec.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20';
              return (
                 <Card key={i} style={{padding:"20px", display:"flex", flexDirection:"column", height:"100%"}}>
                    <div className="flex items-start justify-between mb-4">
                       <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${priorityCol}`}>{rec.priority}</span>
                       <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono bg-white/[0.05] px-2 py-0.5 rounded">{rec.category}</span>
                    </div>
                    <h3 className="font-bold text-base text-white/90 mb-2 leading-snug">{rec.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{rec.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                       <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex gap-2 items-start">
                          <Activity className="w-4 h-4 text-indigo-400 mt-0.5" />
                          <div>
                             <p className="text-[9px] uppercase tracking-widest font-bold text-indigo-300 mb-1">Recommended Action</p>
                             <p className="text-xs text-indigo-100 font-medium">{rec.action}</p>
                          </div>
                       </div>
                       <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5"/> Impact: {rec.impact}
                       </p>
                    </div>
                 </Card>
              )
           })}
        </div>
      </div>

    </div>
  );
}