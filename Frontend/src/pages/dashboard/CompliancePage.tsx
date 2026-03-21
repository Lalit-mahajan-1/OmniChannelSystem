import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Ban, Bell } from "lucide-react";

const alerts = [
  { type: "warning", title: "DND Number Detected", desc: "Customer +91-9876543210 is on DND registry. SMS blocked.", time: "5m ago" },
  { type: "success", title: "Consent Verified", desc: "Bulk campaign #C-4521 passed consent validation.", time: "1h ago" },
  { type: "error", title: "Approval Pending", desc: "Message template 'Promo-March' awaiting compliance review.", time: "2h ago" },
  { type: "success", title: "Audit Complete", desc: "Monthly communication audit passed — 99.5% compliance.", time: "1d ago" },
];

const alertStyles: Record<string, { icon: typeof Shield; color: string; bg: string }> = {
  warning: { icon: AlertTriangle, color: "text-neon-yellow", bg: "bg-neon-yellow/10" },
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  error: { icon: Clock, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function CompliancePage() {
  return (
    <div className="p-6 space-y-6">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">Compliance</motion.h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Compliance Score", value: "99.5%", icon: Shield },
          { label: "DND Blocked", value: "142", icon: Ban },
          { label: "Pending Approvals", value: "3", icon: Clock },
          { label: "Consents Active", value: "18.2K", icon: FileText },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className="w-4 h-4 text-neon-cyan/60" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-neon-cyan" /> Recent Alerts</h2>
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const s = alertStyles[a.type];
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                className="glass-card p-4 flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{a.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
