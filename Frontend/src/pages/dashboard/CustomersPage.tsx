import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, MessageSquare, Mail, Phone, Smartphone, Loader2, AlertCircle,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL;

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  timezone: string;
  isActive: boolean;
  channel_ids?: { whatsapp?: string; chat_uid?: string; social_id?: string };
  createdAt: string;
  updatedAt: string;
}

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${BASE}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params:  { limit: 100 },
      })
      .then(res => setCustomers(res.data.data))
      .catch(err => setError(err.response?.data?.message || "Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Title + Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
            placeholder="Search customers…"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: customers.length,                           icon: CheckCircle,   change: "live" },
          { label: "At Risk",         value: 0,                                           icon: AlertTriangle, change: "—", negative: true },
          { label: "Avg. Response",   value: "—",                                         icon: Clock,         change: "—" },
          { label: "Satisfaction",    value: "—",                                         icon: TrendingUp,    change: "—" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-neon-cyan/60" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <span className={`text-xs ${stat.negative ? "text-red-400" : "text-green-400"}`}>{stat.change}</span>
          </motion.div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading customers…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400/70" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              {search ? `No customers matching "${search}"` : "No customers found."}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-muted-foreground">
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Phone</th>
                  <th className="text-left p-4 font-medium">Language</th>
                  <th className="text-left p-4 font-medium">Last Updated</th>
                  <th className="text-left p-4 font-medium">Channels</th>
                  <th className="text-left p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {/* Name + Email */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center text-xs font-bold shrink-0">
                          {initials(c.name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-4 text-xs text-muted-foreground">{c.phone || "—"}</td>

                    {/* Language */}
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] uppercase text-muted-foreground">
                        {c.language}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="p-4 text-xs text-muted-foreground">{timeAgo(c.updatedAt)}</td>

                    {/* Channels */}
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neon-cyan" />
                        {c.channel_ids?.whatsapp  && <MessageSquare className="w-3.5 h-3.5 text-green-400" />}
                        {c.phone                  && <Phone          className="w-3.5 h-3.5 text-neon-pink" />}
                        {c.channel_ids?.social_id && <Smartphone     className="w-3.5 h-3.5 text-neon-yellow" />}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.isActive
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}
    </div>
  );
}
