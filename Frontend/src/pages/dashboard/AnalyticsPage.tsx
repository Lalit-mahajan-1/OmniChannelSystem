import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const responseData = [
  { name: "Mon", value: 2.4 }, { name: "Tue", value: 1.8 }, { name: "Wed", value: 2.1 },
  { name: "Thu", value: 1.5 }, { name: "Fri", value: 1.2 }, { name: "Sat", value: 0.9 }, { name: "Sun", value: 1.1 },
];

const satisfactionData = [
  { name: "Jan", value: 78 }, { name: "Feb", value: 82 }, { name: "Mar", value: 85 },
  { name: "Apr", value: 88 }, { name: "May", value: 91 }, { name: "Jun", value: 94 },
];

const agentData = [
  { name: "Agent A", resolved: 142, avg: 1.2 },
  { name: "Agent B", resolved: 128, avg: 1.5 },
  { name: "Agent C", resolved: 115, avg: 1.8 },
  { name: "Agent D", resolved: 98, avg: 2.1 },
];

const kpis = [
  { label: "Avg Response Time", value: "1.2m", change: "-28%", positive: true },
  { label: "Resolution Rate", value: "94.7%", change: "+5.2%", positive: true },
  { label: "Customer Satisfaction", value: "4.8/5", change: "+0.3", positive: true },
  { label: "AI Assist Rate", value: "67%", change: "+12%", positive: true },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">Analytics</motion.h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="text-xs text-muted-foreground mb-1">{kpi.label}</div>
            <div className="text-3xl font-bold gradient-text">{kpi.value}</div>
            <span className="text-xs text-green-400">{kpi.change}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="font-semibold mb-4">Response Time Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={responseData}>
              <defs>
                <linearGradient id="cyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip contentStyle={{ background: "rgba(10,10,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="value" stroke="#22D3EE" fill="url(#cyan)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="font-semibold mb-4">Customer Satisfaction</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip contentStyle={{ background: "rgba(10,10,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="value" stroke="#A855F7" strokeWidth={2} dot={{ fill: "#A855F7", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
        <h3 className="font-semibold mb-4">Agent Performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={agentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <Tooltip contentStyle={{ background: "rgba(10,10,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
            <Bar dataKey="resolved" fill="#22D3EE" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
