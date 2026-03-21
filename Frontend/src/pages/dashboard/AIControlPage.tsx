import { motion } from "framer-motion";
import { Brain, Sliders, Globe, FileText, Sparkles } from "lucide-react";
import { useState } from "react";

const tones = ["Professional", "Friendly", "Casual", "Empathetic"];
const languages = ["English", "Spanish", "French", "Hindi", "Mandarin", "Arabic"];

const logs = [
  { time: "10:36 AM", customer: "Sarah Chen", suggestion: "Processed renewal with 10% loyalty discount.", accepted: true },
  { time: "10:22 AM", customer: "Marcus Rivera", suggestion: "Suggested escalation to billing team.", accepted: false },
  { time: "09:50 AM", customer: "Aisha Patel", suggestion: "Offered express delivery option.", accepted: true },
  { time: "09:15 AM", customer: "Tom Bradley", suggestion: "Generated follow-up email template.", accepted: true },
];

export default function AIControlPage() {
  const [tone, setTone] = useState("Professional");
  const [confidence, setConfidence] = useState(75);

  return (
    <div className="p-6 space-y-6">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">AI Control Panel</motion.h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-neon-cyan" />
            <h3 className="font-semibold">Response Tone</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tones.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  tone === t ? "bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 text-foreground" : "bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:bg-white/[0.08]"
                }`}
              >{t}</button>
            ))}
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-neon-purple" />
            <h3 className="font-semibold">Languages</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map(l => (
              <span key={l} className="px-3 py-1.5 rounded-full text-xs bg-white/[0.06] border border-white/[0.08] text-muted-foreground">{l}</span>
            ))}
          </div>
        </motion.div>

        {/* Confidence */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-neon-pink" />
            <h3 className="font-semibold">Confidence Threshold</h3>
          </div>
          <div className="space-y-3">
            <input type="range" min={0} max={100} value={confidence} onChange={e => setConfidence(+e.target.value)}
              className="w-full accent-neon-cyan" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low (more suggestions)</span>
              <span className="font-mono text-neon-cyan">{confidence}%</span>
              <span>High (fewer, precise)</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-neon-yellow" />
            <h3 className="font-semibold">AI Performance</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Suggestions Today", value: "247" },
              { label: "Accepted Rate", value: "82%" },
              { label: "Avg Quality Score", value: "4.6/5" },
              { label: "Time Saved", value: "3.2h" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Logs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-neon-cyan" />
          <h3 className="font-semibold">Suggestion Logs</h3>
        </div>
        <div className="space-y-3">
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
              <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">{l.time}</span>
              <div className="flex-1">
                <span className="text-sm font-medium">{l.customer}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{l.suggestion}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${l.accepted ? "bg-green-500/10 text-green-400" : "bg-white/10 text-muted-foreground"}`}>
                {l.accepted ? "Accepted" : "Dismissed"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
