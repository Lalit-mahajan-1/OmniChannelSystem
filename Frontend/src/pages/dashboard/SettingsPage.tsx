import { motion } from "framer-motion";
import { User, Key, Bell, Palette, Globe, Shield } from "lucide-react";

const sections = [
  {
    icon: User, title: "User Management", items: [
      { label: "Name", value: "James Owen", type: "text" },
      { label: "Email", value: "james@convosphere.ai", type: "text" },
      { label: "Role", value: "Admin", type: "select" },
    ]
  },
  {
    icon: Key, title: "API Integrations", items: [
      { label: "Twilio SID", value: "AC•••••••4f2a", type: "password" },
      { label: "WhatsApp API", value: "Connected", type: "status" },
      { label: "SendGrid", value: "Connected", type: "status" },
    ]
  },
  {
    icon: Bell, title: "Notifications", items: [
      { label: "Email Alerts", value: true, type: "toggle" },
      { label: "Slack Integration", value: true, type: "toggle" },
      { label: "SMS Alerts", value: false, type: "toggle" },
    ]
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">Settings</motion.h1>

      {sections.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <section.icon className="w-4 h-4 text-neon-cyan" />
            <h3 className="font-semibold">{section.title}</h3>
          </div>
          <div className="space-y-4">
            {section.items.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                {item.type === "toggle" ? (
                  <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.value ? "bg-neon-cyan/30" : "bg-white/10"}`}>
                    <div className={`w-4 h-4 rounded-full bg-foreground transition-transform mt-0.5 ${item.value ? "translate-x-5.5 ml-0.5" : "translate-x-0.5"}`} />
                  </div>
                ) : item.type === "status" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">{item.value as string}</span>
                ) : (
                  <span className="text-sm font-mono">{item.value as string}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <button className="btn-neon text-sm">Save Changes</button>
      </motion.div>
    </div>
  );
}
