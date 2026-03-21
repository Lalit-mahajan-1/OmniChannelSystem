import { motion } from "framer-motion";
import { MessageSquare, GitBranch, Brain, Route, Shield, Send, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  { icon: MessageSquare, label: "Channels", desc: "WhatsApp, Email, SMS, Calls", color: "from-green-400/20 to-green-500/20" },
  { icon: GitBranch, label: "Hub", desc: "Unified message queue", color: "from-neon-cyan/20 to-blue-500/20" },
  { icon: Brain, label: "AI Engine", desc: "NLP, sentiment, intent", color: "from-neon-purple/20 to-pink-500/20" },
  { icon: Route, label: "Routing", desc: "Smart agent assignment", color: "from-neon-yellow/20 to-orange-500/20" },
  { icon: Shield, label: "Compliance", desc: "DND, consent, approval", color: "from-red-400/20 to-red-500/20" },
  { icon: Send, label: "Response", desc: "AI-assisted delivery", color: "from-neon-cyan/20 to-neon-purple/20" },
  { icon: BarChart3, label: "Insights", desc: "Analytics & reporting", color: "from-neon-pink/20 to-neon-purple/20" },
];

export default function WorkflowPage() {
  return (
    <div className="p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-2">Communication Workflow</h1>
        <p className="text-muted-foreground text-sm">Visualize how messages flow through the ConvoSphere AI pipeline.</p>
      </motion.div>

      {/* Horizontal Flow */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-0 min-w-max px-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center"
            >
              <div className="glass-card-hover p-6 text-center w-40">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3`}
                >
                  <step.icon className="w-7 h-7 text-foreground" />
                </motion.div>
                <div className="font-semibold text-sm mb-1">{step.label}</div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  className="mx-2"
                >
                  <ArrowRight className="w-5 h-5 text-neon-cyan/40" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <motion.div key={step.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <step.icon className="w-4.5 h-4.5 text-foreground" />
              </div>
              <div className="font-semibold text-sm">{step.label}</div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc} — automated processing with real-time monitoring and fallback handling.</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
