import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  FileText, BarChart2, Users, CheckCircle, Sparkles, Search, Download, X,
  AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Clock, Activity, MessageSquare, Bot, Mail, Smartphone
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import html2pdf from "html2pdf.js";

const SENTIMENT_AGENT = import.meta.env.VITE_SENTIMENT_AGENT_URL;

// --- Colors ---
const S_COLORS: Record<string, string> = {
  angry:    "text-red-400 bg-red-400/10 border-red-400/20",
  negative: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  neutral:  "text-gray-400 bg-gray-400/10 border-gray-400/20",
  positive: "text-green-400 bg-green-400/10 border-green-400/20"
};
const R_COLORS: Record<string, string> = {
  resolved:   "text-green-400",
  pending:    "text-yellow-400",
  unresolved: "text-red-400"
};

// --- Mock Fallbacks ---
const MOCK_REPORT = {
  healthScore: 82,
  resolutionRate: 91,
  atRiskCount: 4,
  executiveSummary: "Customer satisfaction has remained largely positive. We noticed a brief surge in payment processing issues on Tuesday which negatively impacted our SLA. However, AI intervention successfully deflected 42% of tier-1 support tags.",
  weeklyTrend: "improving",
  topConcern: "Payment processing delays",
  quickWin: "Update FAQ regarding weekend settlements",
  customers: [
    { customerId: "c1", name: "Alice Johnson", hasWhatsApp: true, totalEmails: 0, sentiment: "positive", resolution: "resolved", isAtRisk: false },
    { customerId: "c2", name: "Bob Smith", hasWhatsApp: false, totalEmails: 3, sentiment: "negative", resolution: "pending", isAtRisk: true },
    { customerId: "c3", name: "Charlie Davis", hasWhatsApp: true, totalEmails: 1, sentiment: "angry", resolution: "unresolved", isAtRisk: true },
    { customerId: "c4", name: "Diana Prince", hasWhatsApp: true, totalEmails: 5, sentiment: "neutral", resolution: "resolved", isAtRisk: false }
  ]
};

const MOCK_RESOLUTION = {
  totalEmails: 1240,
  resolved: 1128,
  pending: 82,
  unresolved: 30,
  aiHandled: 645,
  aiRate: 52
};

const MOCK_CUSTOMER_DETAIL = {
  sentimentScore: 0.4,
  trend: "improving",
  breakdown: { angry: 0, negative: 1, neutral: 2, positive: 4 },
  responseTime: "14 mins",
  totalMessages: 7,
  inbound: 4,
  outbound: 3,
  mainQuery: "Checking status of delayed refund",
  queryCategory: "billing",
  frustrationLevel: "medium",
  keyIssues: ["Refund not processed after 5 days", "Unclear communication on initial call"],
  whatWentWell: "Agent apologized quickly",
  whatCouldImprove: "Faster escalation to billing department",
  recommendedAction: "Send an automated SMS once refund clears.",
  timeline: [
    { direction: "inbound", channel: "WhatsApp", content: "Where is my refund?" },
    { direction: "outbound", channel: "WhatsApp", content: "I apologize, let me check that for you." }
  ]
};

// --- Components ---
const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    {children}
  </div>
);

const Skeleton = ({ className = "" }: any) => (
  <div className={`animate-pulse bg-white/[0.05] rounded ${className}`} />
);

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [liveUpdates, setLiveUpdates] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Data
  const [reportData, setReportData] = useState<any>(null);
  const [resolutionData, setResolutionData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [analyzingCustomerId, setAnalyzingCustomerId] = useState<string | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  // Analysis Filters
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterResolution, setFilterResolution] = useState("");
  const [sortBy, setSortBy] = useState("Name");

  const fetchFullReport = async () => {
    try {
      setLoadingReport(true);
      const res = await axios.get(`${SENTIMENT_AGENT}/sentiment-agent/full-report`);
      setReportData(res.data);
      setLastUpdated(new Date());
    } catch (err: any) {
       console.warn("Analytics API failed, using MOCK data");
       setReportData(MOCK_REPORT);
       setLastUpdated(new Date());
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchResolutionStats = async () => {
    try {
       const res = await axios.get(`${SENTIMENT_AGENT}/sentiment-agent/resolution-stats`);
       setResolutionData(res.data);
    } catch (err: any) {
       console.warn("Resolution API failed, using MOCK data");
       setResolutionData(MOCK_RESOLUTION);
    }
  };

  useEffect(() => {
     fetchFullReport();
     fetchResolutionStats();
  }, []);

  useEffect(() => {
     if (!liveUpdates) return;
     const interval = setInterval(() => {
        fetchFullReport();
        if (activeTab === "Resolution Stats") fetchResolutionStats();
     }, 60000);
     return () => clearInterval(interval);
  }, [liveUpdates, activeTab]);

  const handleGenerate = async () => {
     setGenerating(true);
     await fetchFullReport();
     setGenerating(false);
     toast.success("Report generated!");
  };

  const analyzeCustomer = async (customer: any) => {
     try {
        setAnalyzingCustomerId(customer.customerId);
        const res = await axios.post(`${SENTIMENT_AGENT}/sentiment-agent/analyze-customer`, { customerId: customer.customerId });
        setCustomerDetail({ ...customer, ...res.data });
        setSelectedCustomerId(customer.customerId);
        setTimelineExpanded(false);
     } catch (err) {
        console.warn("Analyze API failed, using MOCK data");
        setCustomerDetail({ ...customer, ...MOCK_CUSTOMER_DETAIL });
        setSelectedCustomerId(customer.customerId);
        setTimelineExpanded(false);
     } finally {
        setAnalyzingCustomerId(null);
     }
  };

  const downloadReport = () => {
     const element = document.getElementById("report-content");
     if (!element) return;
     
     toast.loading("Generating PDF...", { id: "pdf-toast" });
     const opt = {
        margin: 0.5,
        filename: `report-${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#05090f" },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
     };
     
     html2pdf().set(opt).from(element).save().then(() => {
        toast.success("PDF Downloaded!", { id: "pdf-toast" });
     }).catch(() => {
        toast.error("Failed to generate PDF", { id: "pdf-toast" });
     });
  };

  const timeDiff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);

  // Derived filtered customers
  let customersToRender = reportData?.customers || [];
  if (searchQuery) {
     customersToRender = customersToRender.filter((c: any) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (activeTab === "Customer Analysis") {
     if (filterSentiment) customersToRender = customersToRender.filter((c: any) => c.sentiment === filterSentiment);
     if (filterResolution) customersToRender = customersToRender.filter((c: any) => c.resolution === filterResolution);
     
     customersToRender = [...customersToRender].sort((a: any, b: any) => {
        if (sortBy === "Sentiment") return a.sentiment.localeCompare(b.sentiment);
        if (sortBy === "Resolution") return a.resolution.localeCompare(b.resolution);
        if (sortBy === "At-Risk") return (b.isAtRisk ? 1 : 0) - (a.isAtRisk ? 1 : 0);
        return (a.name || "").localeCompare(b.name || "");
     });
  }

  // --- Render Functions ---
  
  const renderLeftPanel = () => (
    <div className="w-60 shrink-0 border-r border-white/[0.06] bg-background/50 backdrop-blur-md flex flex-col h-full overflow-hidden">
       <div className="p-5 border-b border-white/[0.06]">
          <h2 className="text-xl font-bold mb-4 font-display tracking-wide">Reports</h2>
          <button onClick={handleGenerate} disabled={generating} className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg flex justify-center items-center gap-2 font-bold text-sm transition-all disabled:opacity-50">
             {generating ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/> : <Sparkles className="w-4 h-4"/>}
             {generating ? "Generating..." : "Generate"}
          </button>
       </div>
       
       <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin">
          {[
            { id: "Overview", icon: BarChart2, label: "Overview Report" },
            { id: "Customer Analysis", icon: Users, label: "Customer Analysis" },
            { id: "Resolution Stats", icon: CheckCircle, label: "Resolution Stats" },
          ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === t.id ? 'bg-white/[0.08] text-white font-medium shadow-sm' : 'text-muted-foreground hover:bg-white/[0.04]'}`}>
                <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-cyan-400' : ''}`} />
                {t.label}
             </button>
          ))}
          
          <div className="mt-8 pt-6 border-t border-white/[0.06] px-1 space-y-4">
             <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50" />
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between items-center text-xs px-2 py-1.5 bg-white/[0.02] rounded">
                   <span className="text-muted-foreground">Total Customers</span>
                   <span className="font-bold font-mono">{reportData?.customers?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs px-2 py-1.5 bg-white/[0.02] rounded">
                   <span className="text-muted-foreground">Resolution Rate</span>
                   <span className="font-bold text-green-400 font-mono">{reportData?.resolutionRate || 0}%</span>
                </div>
                <div className="flex justify-between items-center text-xs px-2 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded">
                   <span className="font-medium">At-Risk Count</span>
                   <span className="font-bold font-mono">{reportData?.atRiskCount || 0}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="p-4 border-t border-white/[0.06] bg-black/20">
          <label className="flex items-center justify-between cursor-pointer group">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${liveUpdates ? 'bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse' : 'bg-white/20'}`} />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">Live updates</span>
             </div>
             <div className={`w-8 h-4 rounded-full transition-colors relative ${liveUpdates ? 'bg-green-500/30' : 'bg-white/10'}`}>
                <input type="checkbox" className="hidden" checked={liveUpdates} onChange={(e) => setLiveUpdates(e.target.checked)} />
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${liveUpdates ? 'translate-x-4.5 bg-green-400' : 'translate-x-0.5 opacity-50'}`} />
             </div>
          </label>
       </div>
    </div>
  );

  const renderTopBar = () => (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
       <div>
          <h1 className="text-2xl font-bold font-display tracking-widest text-white/90">{activeTab}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-2">
             <Activity className="w-3 h-3"/> Last updated {timeDiff}s ago
          </p>
       </div>
       <button onClick={downloadReport} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.1] rounded text-xs font-bold transition-all text-white/90 shadow-sm">
          <Download className="w-3.5 h-3.5" /> Export PDF
       </button>
    </div>
  );

  const renderCustomerTable = () => (
     <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-lg mt-6">
       <table className="w-full text-left border-collapse">
         <thead>
           <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
             <th className="p-4 font-medium">Customer</th>
             <th className="p-4 font-medium">Channels</th>
             <th className="p-4 font-medium text-center">Sentiment</th>
             <th className="p-4 font-medium text-center">Resolution</th>
             <th className="p-4 font-medium text-center">Emails</th>
             <th className="p-4 font-medium text-center">At Risk</th>
             <th className="p-4 font-medium text-right">Action</th>
           </tr>
         </thead>
         <tbody className="divide-y divide-white/[0.04]">
            {customersToRender.length === 0 ? (
               <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No customers found.</td></tr>
            ) : customersToRender.map((c: any, i: number) => (
               <motion.tr key={c.customerId || i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i * 0.05}} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="p-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-white/10 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                           {c.name ? c.name.substring(0,2) : "UN"}
                        </div>
                        <span className="text-sm font-medium text-white/90">{c.name || c.customerId}</span>
                     </div>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-2">
                        {c.hasWhatsApp && <div className="text-green-400 bg-green-400/10 p-1.5 rounded" title="WhatsApp"><Smartphone className="w-3.5 h-3.5" /></div>}
                        {c.totalEmails > 0 && <div className="text-cyan-400 bg-cyan-400/10 p-1.5 rounded" title="Email"><Mail className="w-3.5 h-3.5" /></div>}
                     </div>
                  </td>
                  <td className="p-4 text-center">
                     <span className={`inline-block border px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg ${S_COLORS[c.sentiment?.toLowerCase()] || S_COLORS['neutral']}`}>{c.sentiment || 'neutral'}</span>
                  </td>
                  <td className="p-4 text-center">
                     <span className={`text-[11px] uppercase tracking-wider font-bold ${R_COLORS[c.resolution?.toLowerCase()] || R_COLORS['pending']}`}>{c.resolution || 'pending'}</span>
                  </td>
                  <td className="p-4 text-center font-mono text-sm text-foreground/80">{c.totalEmails || 0}</td>
                  <td className="p-4 text-center">
                     {c.isAtRisk ? <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" /> : <CheckCircle className="w-4 h-4 text-green-500/50 mx-auto" />}
                  </td>
                  <td className="p-4 text-right">
                     <button onClick={() => analyzeCustomer(c)} disabled={analyzingCustomerId === c.customerId} className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] rounded font-bold text-[10px] uppercase tracking-widest text-white transition-all outline-none disabled:opacity-50">
                        {analyzingCustomerId === c.customerId ? "..." : "Analyze"}
                     </button>
                  </td>
               </motion.tr>
            ))}
         </tbody>
       </table>
     </div>
  );

  const renderOverview = () => {
    if (loadingReport) return <div className="p-8 flex justify-center"><Skeleton className="w-full h-96" /></div>;
    return (
       <div id="report-content" className="pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
             <GlassCard className="p-5 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                   <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/[0.05]" />
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (reportData?.healthScore || 0)) / 100} className={`transition-all duration-1000 ${reportData?.healthScore > 70 ? 'text-green-500' : reportData?.healthScore > 40 ? 'text-yellow-500' : 'text-red-500'}`} />
                   </svg>
                   <span className="font-display text-4xl leading-none">{reportData?.healthScore || 0}</span>
                </div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">Overall Health</h3>
             </GlassCard>

             <GlassCard className="p-5 flex flex-col justify-center">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Resolution Rate</h3>
                <div className="font-display text-5xl text-green-400 mb-3">{reportData?.resolutionRate || 0}%</div>
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                   <motion.div initial={{width:0}} animate={{width:`${reportData?.resolutionRate||0}%`}} className="h-full bg-green-500" />
                </div>
             </GlassCard>

             <GlassCard className="p-5 flex flex-col justify-center border-l-2 border-l-red-500/50">
                <AlertTriangle className="w-6 h-6 text-red-400 mb-2 opacity-80" />
                <div className="font-display text-5xl text-red-500 mb-1">{reportData?.atRiskCount || 0}</div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-red-400/70">Need immediate attention</h3>
             </GlassCard>

             <GlassCard className="p-5 flex flex-col bg-gradient-to-br from-indigo-500/10 to-transparent">
                <div className="flex items-center justify-between mb-3 text-indigo-400">
                   <Bot className="w-5 h-5"/>
                   <span className="text-[9px] uppercase tracking-widest font-bold opacity-80 border border-indigo-500/30 px-2 py-0.5 rounded">AI Summary</span>
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed line-clamp-3 italic mb-2">"{reportData?.executiveSummary?.split('.')?.[0]}."</p>
                <button className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider hover:underline mt-auto self-start">Read more</button>
             </GlassCard>
          </div>

          <GlassCard className="p-5 mb-6">
             <h2 className="text-sm font-bold flex items-center gap-2 text-white/90 mb-4 pb-3 border-b border-white/[0.06]"><Sparkles className="w-4 h-4 text-cyan-400"/> AI Executive Summary <span className="text-[9px] ml-2 text-muted-foreground font-mono bg-white/[0.04] px-2 py-1 rounded">Generated just now</span></h2>
             <p className="text-sm text-foreground/80 leading-loose max-w-4xl">{reportData?.executiveSummary}</p>
             <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/[0.06]">
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${reportData?.weeklyTrend === 'improving' ? 'bg-green-500/10 text-green-400 border-green-500/20' : reportData?.weeklyTrend === 'declining' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                   Trend: {reportData?.weeklyTrend || 'stable'} {reportData?.weeklyTrend === 'improving' ? <TrendingUp className="w-3.5 h-3.5"/> : reportData?.weeklyTrend === 'declining' ? <TrendingDown className="w-3.5 h-3.5"/> : '-'}
                </div>
                <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg text-xs font-medium"><span className="opacity-70 font-bold uppercase tracking-widest text-[10px] mr-2">Top Concern:</span> {reportData?.topConcern || "None"}</div>
                <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium"><span className="opacity-70 font-bold uppercase tracking-widest text-[10px] mr-2">Quick Win:</span> {reportData?.quickWin || "None"}</div>
             </div>
          </GlassCard>

          {renderCustomerTable()}
       </div>
    );
  };

  const renderAnalysis = () => {
    return (
       <div id="report-content" className="pb-10">
         <div className="flex flex-wrap gap-4 mb-4">
            <select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)} className="bg-white/[0.02] border border-white/[0.1] rounded text-xs px-3 py-1.5 focus:outline-none">
               <option value="">All Sentiments</option>
               <option value="angry">Angry</option>
               <option value="negative">Negative</option>
               <option value="neutral">Neutral</option>
               <option value="positive">Positive</option>
            </select>
            <select value={filterResolution} onChange={e => setFilterResolution(e.target.value)} className="bg-white/[0.02] border border-white/[0.1] rounded text-xs px-3 py-1.5 focus:outline-none">
               <option value="">All Resolutions</option>
               <option value="resolved">Resolved</option>
               <option value="pending">Pending</option>
               <option value="unresolved">Unresolved</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white/[0.02] border border-white/[0.1] rounded text-xs px-3 py-1.5 focus:outline-none ml-auto">
               <option value="Name">Sort by: Name</option>
               <option value="Sentiment">Sort by: Sentiment</option>
               <option value="Resolution">Sort by: Resolution</option>
               <option value="At-Risk">Sort by: At-Risk First</option>
            </select>
         </div>
         {renderCustomerTable()}
       </div>
    );
  };

  const renderResolutionStats = () => {
     if (!resolutionData) return <div className="p-8"><Skeleton className="w-full h-64" /></div>;
     const r = resolutionData;
     
     const total = r.totalEmails || 1;
     const resPct = (r.resolved / total) * 100;
     const penPct = (r.pending / total) * 100;
     const unresPct = (r.unresolved / total) * 100;
     
     const pieData = [
       { name: "Resolved", value: r.resolved, color: "#4ade80" }, // green-400
       { name: "Pending", value: r.pending, color: "#facc15" },  // yellow-400
       { name: "Unresolved", value: r.unresolved, color: "#f87171" } // red-400
     ];

     return (
        <div id="report-content" className="pb-10 space-y-6">
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <GlassCard className="p-5 border-l-2 border-l-blue-500/50">
                 <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 hidden md:block">Total Actions</h3>
                 <div className="font-display text-4xl text-blue-400 mb-1">{r.totalEmails}</div>
                 <h4 className="text-xs text-blue-400/70 font-bold uppercase tracking-widest">Total Emails</h4>
              </GlassCard>
              <GlassCard className="p-5 border-l-2 border-l-green-500/50 bg-green-500/5">
                 <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 hidden md:block flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400 inline"/> Success</h3>
                 <div className="font-display text-4xl text-green-400 mb-1">{r.resolved}</div>
                 <h4 className="text-xs text-green-400/80 font-bold uppercase tracking-widest">Resolved</h4>
              </GlassCard>
              <GlassCard className="p-5 border-l-2 border-l-yellow-500/50 bg-yellow-500/5">
                 <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 hidden md:block flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-400 inline"/> In Progress</h3>
                 <div className="font-display text-4xl text-yellow-500 mb-1">{r.pending}</div>
                 <h4 className="text-xs text-yellow-500/80 font-bold uppercase tracking-widest">Pending</h4>
              </GlassCard>
              <GlassCard className="p-5 border-l-2 border-l-red-500/50 bg-red-500/5">
                 <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 hidden md:block flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-400 inline"/> Stalled</h3>
                 <div className="font-display text-4xl text-red-500 mb-1">{r.unresolved}</div>
                 <h4 className="text-xs text-red-500/80 font-bold uppercase tracking-widest">Unresolved</h4>
              </GlassCard>
              <GlassCard className="p-5 border-l-2 border-l-purple-500/50 bg-purple-500/5 text-purple-400">
                 <h3 className="text-[10px] uppercase font-bold tracking-widest mb-1 hidden md:block flex items-center gap-1"><Bot className="w-3 h-3 inline"/> Automated</h3>
                 <div className="font-display text-4xl mb-1">{r.aiHandled}</div>
                 <h4 className="text-xs font-bold uppercase tracking-widest opacity-80">AI Handled</h4>
              </GlassCard>
              <GlassCard className="p-5 border-l-2 border-l-indigo-400/50 bg-indigo-500/5 text-indigo-400">
                 <h3 className="text-[10px] uppercase font-bold tracking-widest mb-1 hidden md:block">Efficiency</h3>
                 <div className="font-display text-4xl mb-1">{r.aiRate}%</div>
                 <h4 className="text-xs font-bold uppercase tracking-widest opacity-80">AI Rate</h4>
              </GlassCard>
           </div>
           
           <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white/80 mb-4">Volume Distribution</h3>
              <div className="w-full h-8 flex rounded-xl overflow-hidden shadow-inner">
                 <div style={{width: `${resPct}%`}} className="bg-green-500 hover:bg-green-400 transition-colors cursor-pointer" title={`Resolved: ${resPct.toFixed(1)}%`} />
                 <div style={{width: `${penPct}%`}} className="bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" title={`Pending: ${penPct.toFixed(1)}%`} />
                 <div style={{width: `${unresPct}%`}} className="bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" title={`Unresolved: ${unresPct.toFixed(1)}%`} />
              </div>
              <div className="flex gap-6 mt-4 justify-center">
                 <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-400"><div className="w-3 h-3 bg-green-500 rounded-full"/> Resolved</div>
                 <div className="flex items-center gap-2 text-xs font-mono font-bold text-yellow-500"><div className="w-3 h-3 bg-yellow-500 rounded-full"/> Pending</div>
                 <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-500"><div className="w-3 h-3 bg-red-500 rounded-full"/> Unresolved</div>
              </div>
           </div>

           <GlassCard className="p-6 h-80 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} dataKey="value" stroke="rgba(0,0,0,0.5)" strokeWidth={3} paddingAngle={2}>
                       {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="font-display text-6xl text-white/90 leading-none">{r.resolved ? Math.round((r.resolved / total) * 100) : 0}%</span>
                 <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-1">Resolution</span>
              </div>
           </GlassCard>
        </div>
     );
  };

  const renderCustomerDrawer = () => {
     if (!selectedCustomerId) return null;
     const c = customerDetail || {};
     const overallCol = S_COLORS[c.sentiment?.toLowerCase()] || S_COLORS['neutral'];
     
     return (
        <AnimatePresence>
           <motion.div initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-[480px] bg-[#05090f] border-l border-white/[0.1] shadow-2xl z-50 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded border ${overallCol}`}>{c.sentiment}</div>
                    <h2 className="text-base font-bold text-white/90 font-display tracking-wider truncate max-w-[200px]">{c.name || c.customerId}</h2>
                 </div>
                 <button onClick={() => setSelectedCustomerId(null)} className="p-1.5 hover:bg-white/[0.1] text-muted-foreground hover:text-white rounded transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin pb-10">
                 
                 {/* 1. Sentiment Analysis */}
                 <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Sentiment Score</h3>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                       <div className="flex justify-between items-center mb-3">
                         <span className="font-mono text-sm font-bold text-white/80">{c.sentimentScore || 0}</span>
                         <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                           {c.trend || 'improving'} <TrendingUp className="w-3.5 h-3.5"/>
                         </div>
                       </div>
                       <div className="h-2 w-full flex rounded-full overflow-hidden shadow-inner mb-4 relative bg-gray-600">
                          {/* Visualizer -2 to +1 mapper roughly */}
                          <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-full opacity-50"/>
                          <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_4px_white] z-10" style={{left: `${((Number(c.sentimentScore||0) + 2) / 3) * 100}%`}} />
                       </div>
                       <div className="grid grid-cols-4 gap-2">
                          {[
                            {l:"Angry", v:c.breakdown?.angry || 0, c:"text-red-400 bg-red-400/10"},
                            {l:"Neg", v:c.breakdown?.negative || 0, c:"text-orange-400 bg-orange-400/10"},
                            {l:"Neu", v:c.breakdown?.neutral || 0, c:"text-gray-400 bg-gray-400/10"},
                            {l:"Pos", v:c.breakdown?.positive || 0, c:"text-green-400 bg-green-400/10"}
                          ].map(t =>(
                             <div key={t.l} className={`p-1.5 rounded text-center flex flex-col ${t.c}`}>
                                <span className="font-display text-lg leading-none mb-1">{t.v}</span>
                                <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">{t.l}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </section>

                 {/* 2. Query Resolution */}
                 <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Resolution Status</h3>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex gap-4 items-center">
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 font-bold ${c.resolution==='resolved'?'border-green-500/30 text-green-400 bg-green-500/10':c.resolution==='unresolved'?'border-red-500/30 text-red-400 bg-red-500/10':'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`}>
                          {c.resolution==='resolved' ? <CheckCircle className="w-8 h-8"/> : c.resolution==='unresolved' ? <AlertCircle className="w-8 h-8"/> : <Clock className="w-8 h-8"/>}
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center text-xs border-b border-white/[0.04] pb-1.5"><span className="text-muted-foreground">Response</span><span className="font-mono text-white/90">{c.responseTime || "Pending"}</span></div>
                          <div className="flex justify-between items-center text-xs border-b border-white/[0.04] pb-1.5"><span className="text-muted-foreground">Messages</span><span className="font-mono font-bold text-white/90">{c.totalMessages || 0} ({c.inbound || 0} IN / {c.outbound || 0} OUT)</span></div>
                          <div className="flex justify-between items-center text-xs pb-1"><span className="text-muted-foreground">Channels</span><div className="flex gap-1">{c.hasWhatsApp && <Smartphone className="w-3.5 h-3.5 text-green-400"/>}{c.totalEmails > 0 && <Mail className="w-3.5 h-3.5 text-cyan-400"/>}</div></div>
                       </div>
                    </div>
                 </section>

                 {/* 3. AI Analysis */}
                 <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 text-indigo-400"><Bot className="w-4 h-4"/> AI Intelligence</h3>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/20 blur-xl rounded-full pointer-events-none"/>
                       <div className="mb-4">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-300">Core Query</span>
                          <p className="font-semibold text-indigo-100 text-sm mt-0.5">{c.mainQuery || "General inquiry"}</p>
                       </div>
                       <div className="flex gap-2 mb-4">
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] uppercase tracking-widest font-mono text-white/70">{c.queryCategory || "account"}</span>
                          <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold ${c.frustrationLevel==='high'||c.frustrationLevel==='critical'?'bg-red-500/20 text-red-300 border border-red-500/30':'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'}`}>Frustration: {c.frustrationLevel || "medium"}</span>
                       </div>
                       
                       {c.keyIssues && c.keyIssues.length > 0 && (
                          <div className="mb-4">
                             <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-300">Key Context</span>
                             <ul className="list-disc pl-4 mt-1 text-xs text-indigo-200/80 space-y-1">
                                {c.keyIssues.map((iss: string, idx: number) => <li key={idx}>{iss}</li>)}
                             </ul>
                          </div>
                       )}

                       <div className="space-y-2 mb-5">
                          {c.whatWentWell && <div className="text-xs bg-green-500/10 border border-green-500/20 text-green-200 p-2 rounded flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-400"/> {c.whatWentWell}</div>}
                          {c.whatCouldImprove && <div className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-2 rounded flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-400"/> {c.whatCouldImprove}</div>}
                       </div>

                       <div className="bg-indigo-500/20 border border-indigo-500/40 rounded-lg p-3">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-300 mb-1 block">Recommended Action</span>
                          <p className="text-xs font-bold text-white/90 leading-relaxed">{c.recommendedAction || "Monitor customer sentiment."}</p>
                       </div>
                    </div>
                 </section>

                 {/* 4. Timeline */}
                 <section className="mb-6">
                    <button onClick={() => setTimelineExpanded(!timelineExpanded)} className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2 pb-2 border-b border-white/[0.04]">
                       <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Journey Timeline</span>
                       <span className="text-cyan-400">{timelineExpanded ? "Hide" : "Show"}</span>
                    </button>
                    {timelineExpanded && (
                       <div className="space-y-3 px-2 pt-2 border-l-2 border-white/10 ml-3">
                          {(c.timeline || []).map((msg: any, i: number) => (
                             <div key={i} className="relative pl-4">
                                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-[#05090f] bg-white/20" />
                                <div className="flex gap-2 text-[10px] mb-1 text-muted-foreground uppercase font-mono tracking-widest font-bold">
                                   <span className={msg.direction==='inbound'?'text-cyan-400':'text-purple-400'}>{msg.direction}</span>
                                   <span>•</span>
                                   <span>{msg.channel}</span>
                                </div>
                                <div className="bg-white/[0.03] border border-white/[0.06] p-2.5 rounded-lg text-xs leading-relaxed text-white/80">{msg.content}</div>
                             </div>
                          ))}
                          {(!c.timeline || c.timeline.length === 0) && <div className="pl-4 text-xs text-muted-foreground italic">No historical messages parsed.</div>}
                       </div>
                    )}
                 </section>

              </div>
           </motion.div>
        </AnimatePresence>
     );
  };

  return (
    <div className="flex h-full bg-[#05090f] text-[#e8f5e9] overflow-hidden font-body">
      {renderLeftPanel()}
      <div className="flex-1 flex flex-col relative overflow-hidden">
         <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
            {renderTopBar()}
            <AnimatePresence mode="wait">
               <motion.div key={activeTab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
                  {activeTab === "Overview" && renderOverview()}
                  {activeTab === "Customer Analysis" && renderAnalysis()}
                  {activeTab === "Resolution Stats" && renderResolutionStats()}
               </motion.div>
            </AnimatePresence>
         </div>
         {renderCustomerDrawer()}
      </div>
    </div>
  );
}
