import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Settings, User, Lock, Bell, Zap, Save,
  Loader2, Eye, EyeOff, Shield, Sparkles, Clock, Wifi, WifiOff,
} from "lucide-react";

/* ── palette ─────────────────────────────────────────────────────────────── */
const C = {
  cream: "#FFF8E7", white: "#FFFFFF", border: "#F0E4C8",
  textMain: "#1A1A1A", textMid: "#8A8578",
  yellow: "#FFC107", yellowDark: "#B8860B",
  yellowBg: "#FFF3CD", yellowBorder: "#FFE082",
  green: "#16a34a", greenBg: "#dcfce7",
  red: "#dc2626", redBg: "#fee2e2",
  blue: "#185FA5", blueBg: "#E6F1FB",
};

const inputSx: React.CSSProperties = {
  width: "100%", background: C.white, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "10px 12px", color: C.textMain,
  fontSize: 13, outline: "none", fontFamily: "DM Sans",
};
const btnSx: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
  borderRadius: 8, border: "none", background: C.yellow, color: C.textMain,
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const labelSx: React.CSSProperties = {
  display: "block", fontSize: 12, color: C.textMid, marginBottom: 6, fontFamily: "DM Sans",
};

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ icon, title, desc, children }: {
  icon: React.ReactNode; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: C.yellowBg, display: "flex", alignItems: "center", justifyContent: "center", color: C.yellowDark }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 16, color: C.textMain, margin: 0 }}>{title}</h3>
          <p style={{ fontFamily: "DM Sans", fontSize: 13, color: C.textMid, margin: 0 }}>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */
function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "DM Sans", fontSize: 14, color: C.textMain, marginBottom: 2 }}>{label}</div>
        {desc && <div style={{ fontFamily: "DM Sans", fontSize: 12, color: C.textMid }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: 48, height: 26, borderRadius: 13, border: "none", background: checked ? C.yellow : C.border, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.white, position: "absolute", top: 3, left: checked ? 25 : 3, transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

/* ── Status dot ──────────────────────────────────────────────────────────── */
function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      {ok ? <Wifi size={16} color={C.green} /> : <WifiOff size={16} color={C.red} />}
      <span style={{ fontFamily: "DM Sans", fontSize: 14, color: C.textMain, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: ok ? C.greenBg : C.redBg, color: ok ? C.green : C.red }}>
        {ok ? "Connected" : "Not configured"}
      </span>
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────────── */
function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── 1. Profile ──
  const [profile, setProfile] = useState({ name: "", email: "", company: "" });
  useEffect(() => {
    if (user) setProfile({ name: user.name || "", email: user.email || "", company: (user as any).company || "" });
  }, [user]);

  const profileMut = useMutation({
    mutationFn: async (d: typeof profile) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employers/${(user as any)?._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["user"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── 2. Notifications (localStorage) ──
  const [notif, setNotif] = useState(() => loadJSON("omni_notif_prefs", { emailAlerts: true, whatsappAlerts: false, complaintAlerts: true }));
  const saveNotif = (n: typeof notif) => { setNotif(n); localStorage.setItem("omni_notif_prefs", JSON.stringify(n)); toast.success("Notification preferences saved"); };

  // ── 3. AI Agent config (localStorage) ──
  const [ai, setAI] = useState(() => loadJSON("omni_ai_config", { autoReply: false, model: "llama-3.1-8b-instant" }));
  const saveAI = (v: typeof ai) => { setAI(v); localStorage.setItem("omni_ai_config", JSON.stringify(v)); toast.success("AI config saved"); };

  // ── 4. Business Hours (localStorage) ──
  const [hours, setHours] = useState(() => loadJSON("omni_business_hours", { start: "09:00", end: "18:00", timezone: "IST", weekends: false }));
  const saveHours = () => { localStorage.setItem("omni_business_hours", JSON.stringify(hours)); toast.success("Business hours saved"); };

  // ── 6. Password ──
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const pwMut = useMutation({
    mutationFn: async (d: typeof pw) => {
      if (d.newPassword !== d.confirmPassword) throw new Error("Passwords do not match");
      if (d.newPassword.length < 6) throw new Error("Password must be at least 6 characters");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employers/${(user as any)?._id}/password`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: d.currentPassword, newPassword: d.newPassword }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error((j as any).message || "Failed to change password"); }
      return res.json();
    },
    onSuccess: () => { toast.success("Password changed"); setPw({ currentPassword: "", newPassword: "", confirmPassword: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: C.cream, fontFamily: "DM Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.yellowBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Settings size={20} color={C.yellowDark} />
        </div>
        <div>
          <h1 style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 20, color: C.textMain, margin: 0 }}>Settings</h1>
          <p style={{ fontFamily: "DM Sans", fontSize: 13, color: C.textMid, margin: 0 }}>Manage your account, notifications, and AI configuration</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* ── 1. Profile ── */}
        <Section icon={<User size={18} />} title="Profile Settings" desc="Update your personal details">
          {([ ["Name", "name", "text"], ["Email", "email", "email"], ["Company", "company", "text"] ] as const).map(([lbl, key, type]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={labelSx}>{lbl}</label>
              <input type={type} value={(profile as any)[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} style={inputSx} />
            </div>
          ))}
          <button onClick={() => profileMut.mutate(profile)} disabled={profileMut.isPending} style={{ ...btnSx, opacity: profileMut.isPending ? 0.6 : 1 }}>
            {profileMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
          </button>
        </Section>

        {/* ── 2. Notifications ── */}
        <Section icon={<Bell size={18} />} title="Notification Preferences" desc="Choose which alerts you receive">
          <Toggle label="Email Notifications" desc="Get notified via email for new tickets" checked={notif.emailAlerts} onChange={v => saveNotif({ ...notif, emailAlerts: v })} />
          <Toggle label="WhatsApp Alerts" desc="Receive WhatsApp message alerts" checked={notif.whatsappAlerts} onChange={v => saveNotif({ ...notif, whatsappAlerts: v })} />
          <Toggle label="Complaint Alerts" desc="Instant alerts for social media complaints" checked={notif.complaintAlerts} onChange={v => saveNotif({ ...notif, complaintAlerts: v })} />
        </Section>

        {/* ── 3. AI Agent Config ── */}
        <Section icon={<Sparkles size={18} />} title="AI Agent Configuration" desc="Manage agent status and auto-reply defaults">
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {[ { label: "Gmail Agent", port: 5001 }, { label: "WhatsApp Agent", port: 5002 } ].map(a => (
              <div key={a.port} style={{ flex: 1, padding: 12, borderRadius: 10, background: C.yellowBg, border: `1px solid ${C.yellowBorder}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textMain, marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: C.textMid }}>Port {a.port}</div>
              </div>
            ))}
          </div>
          <Toggle label="Auto-Reply (default)" desc="Enable AI auto-reply for new conversations" checked={ai.autoReply} onChange={v => saveAI({ ...ai, autoReply: v })} />
          <div style={{ marginTop: 12 }}>
            <label style={labelSx}>Default AI Model</label>
            <input value={ai.model} onChange={e => saveAI({ ...ai, model: e.target.value })} style={inputSx} />
          </div>
        </Section>

        {/* ── 4. Business Hours ── */}
        <Section icon={<Clock size={18} />} title="Business Hours" desc="Set your operating hours for SLA tracking">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={labelSx}>Start Time</label><input type="time" value={hours.start} onChange={e => setHours({ ...hours, start: e.target.value })} style={inputSx} /></div>
            <div><label style={labelSx}>End Time</label><input type="time" value={hours.end} onChange={e => setHours({ ...hours, end: e.target.value })} style={inputSx} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSx}>Timezone</label>
            <select value={hours.timezone} onChange={e => setHours({ ...hours, timezone: e.target.value })} style={{ ...inputSx, cursor: "pointer" }}>
              {["IST", "UTC", "EST", "PST", "CET"].map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <Toggle label="Include Weekends" desc="Count weekends as business days" checked={hours.weekends} onChange={v => setHours({ ...hours, weekends: v })} />
          <button onClick={saveHours} style={{ ...btnSx, marginTop: 12 }}><Save size={14} /> Save Hours</button>
        </Section>

        {/* ── 5. API Connections ── */}
        <Section icon={<Zap size={18} />} title="API Connections" desc="Integration status for connected services">
          <StatusDot ok={!!import.meta.env.VITE_WA_AGENT_URL} label="WhatsApp Business API" />
          <StatusDot ok={!!import.meta.env.VITE_AGENT_URL} label="Gmail Integration" />
          <StatusDot ok={!!import.meta.env.VITE_API_URL} label="Groq AI Engine" />
          <div style={{ marginTop: 12, padding: 12, background: C.blueBg, borderRadius: 8, fontSize: 12, color: C.blue }}>
            Connection status is based on environment configuration. Update your .env file to add or change integrations.
          </div>
        </Section>

        {/* ── 6. Security ── */}
        <Section icon={<Shield size={18} />} title="Security" desc="Change your account password">
          {([ ["Current Password", "currentPassword"], ["New Password", "newPassword"], ["Confirm Password", "confirmPassword"] ] as const).map(([lbl, key]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={labelSx}>{lbl}</label>
              <input type={showPw ? "text" : "password"} value={pw[key]} onChange={e => setPw({ ...pw, [key]: e.target.value })} style={inputSx} />
            </div>
          ))}
          <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", color: C.textMid, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? "Hide" : "Show"} passwords
          </button>
          <button
            onClick={() => pwMut.mutate(pw)}
            disabled={pwMut.isPending || !pw.currentPassword || !pw.newPassword || !pw.confirmPassword}
            style={{ ...btnSx, opacity: (pwMut.isPending || !pw.currentPassword || !pw.newPassword || !pw.confirmPassword) ? 0.5 : 1 }}
          >
            {pwMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Change Password
          </button>
        </Section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}
