import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search, MessageSquare, Mail, Phone, Smartphone,
  Sparkles, Send, Smile, Paperclip, Loader2, AlertCircle, Users,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL;

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  timezone: string;
  channel_ids?: { whatsapp?: string; chat_uid?: string; social_id?: string };
  createdAt: string;
  updatedAt: string;
}

const chatMessages = [
  { role: "customer", text: "Hi, I need help with my order.", time: "10:32 AM" },
  { role: "agent",    text: "Hi! Happy to help. Let me pull up your account.", time: "10:33 AM" },
  { role: "customer", text: "Thanks!", time: "10:34 AM" },
];

const aiSuggestions = [
  "Your order has been processed successfully.",
  "Is there anything else I can help you with today?",
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function InboxPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [selected,  setSelected]  = useState<Customer | null>(null);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${BASE}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params:  { limit: 100 },
      })
      .then(res => {
        setCustomers(res.data.data);
        if (res.data.data.length > 0) setSelected(res.data.data[0]);
      })
      .catch(err => setError(err.response?.data?.message || "Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* ── Sidebar list ── */}
      <div className="w-80 border-r border-white/[0.06] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">Inbox</h1>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {customers.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
              placeholder="Search customers…"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-400/70" />
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
              <Users className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No customers found</p>
            </div>
          )}

          {!loading && !error && filtered.map((c, i) => (
            <motion.button
              key={c._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(c)}
              className={`w-full text-left p-4 border-b border-white/[0.04] transition-colors ${
                selected?._id === c._id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center shrink-0 text-xs font-bold">
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{timeAgo(c.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.channel_ids?.whatsapp && <MessageSquare className="w-3 h-3 text-green-400" />}
                    {c.phone           && <Phone          className="w-3 h-3 text-neon-pink" />}
                    {c.channel_ids?.social_id && <Smartphone className="w-3 h-3 text-neon-yellow" />}
                    <Mail className="w-3 h-3 text-neon-cyan" />
                    <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                  </div>
                </div>
                {selected?._id === c._id && (
                  <div className="w-2 h-2 rounded-full bg-neon-cyan mt-2 shrink-0" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center text-xs font-bold">
                  {initials(selected.name)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{selected.name}</div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-neon-cyan" />
                    <span className="text-xs text-muted-foreground">{selected.email}</span>
                    {selected.phone && (
                      <>
                        <span className="text-white/20">·</span>
                        <Phone className="w-3 h-3 text-neon-pink" />
                        <span className="text-xs text-muted-foreground">{selected.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-muted-foreground uppercase">
                  {selected.language}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-muted-foreground">
                  {selected.timezone}
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="px-6 py-3 border-b border-white/[0.06] bg-neon-cyan/[0.03]">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-neon-cyan">AI Summary</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <strong className="text-foreground/80">{selected.name}</strong> — joined{" "}
                    {new Date(selected.createdAt).toLocaleDateString()}.{" "}
                    {selected.channel_ids?.whatsapp
                      ? "Active on WhatsApp."
                      : selected.phone
                      ? "Reachable by phone."
                      : "Contact via email."}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "agent"
                      ? "bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 border border-neon-cyan/10"
                      : "bg-white/[0.06] border border-white/[0.08]"
                  }`}>
                    <p>{msg.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Suggested replies */}
            <div className="px-6 py-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                <span className="text-xs font-semibold text-neon-purple">Suggested Replies</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((s, i) => (
                  <button key={i} className="text-xs px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-colors truncate max-w-xs">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground"><Paperclip className="w-4 h-4" /></button>
                <input
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
                  placeholder={`Message ${selected.name}…`}
                />
                <button className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground"><Smile className="w-4 h-4" /></button>
                <button className="p-2.5 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple text-background"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Select a customer to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
