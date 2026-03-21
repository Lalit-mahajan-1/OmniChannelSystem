import { motion } from "framer-motion";
import { Plus, MessageSquare, Mail, Smartphone, Calendar, Sparkles, MoreHorizontal, TrendingUp } from "lucide-react";

const campaigns = [
  { id: 1, name: "Spring Renewal Drive", channel: "email", status: "active", sent: 12450, opened: 8715, clicked: 3290, scheduled: "Mar 15" },
  { id: 2, name: "Welcome Series", channel: "whatsapp", status: "active", sent: 8200, opened: 7380, clicked: 4920, scheduled: "Mar 10" },
  { id: 3, name: "Feedback Request", channel: "sms", status: "draft", sent: 0, opened: 0, clicked: 0, scheduled: "Mar 25" },
  { id: 4, name: "Product Launch", channel: "email", status: "scheduled", sent: 0, opened: 0, clicked: 0, scheduled: "Apr 1" },
];

const channelIcons: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageSquare, sms: Smartphone };
const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400", draft: "bg-white/10 text-muted-foreground", scheduled: "bg-neon-cyan/10 text-neon-cyan",
};

export default function CampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button className="btn-neon text-sm !px-4 !py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> New Campaign</button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: "20,650", icon: TrendingUp },
          { label: "Avg Open Rate", value: "78.2%", icon: Mail },
          { label: "AI Generated", value: "12", icon: Sparkles },
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

      {/* Campaign Cards */}
      <div className="space-y-3">
        {campaigns.map((c, i) => {
          const CIcon = channelIcons[c.channel] || Mail;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
                <CIcon className="w-5 h-5 text-neon-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{c.scheduled}</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                <div><div className="font-semibold text-foreground text-sm">{c.sent.toLocaleString()}</div>Sent</div>
                <div><div className="font-semibold text-foreground text-sm">{c.opened.toLocaleString()}</div>Opened</div>
                <div><div className="font-semibold text-foreground text-sm">{c.clicked.toLocaleString()}</div>Clicked</div>
              </div>
              <button className="p-2 rounded-lg hover:bg-white/[0.06]"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
