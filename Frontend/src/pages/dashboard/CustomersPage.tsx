import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, AlertTriangle, CheckCircle, Clock, MessageSquare, Mail, Phone, Smartphone, Loader2, AlertCircle, Users, BrainCircuit } from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.VITE_API_URL;

/* ─── palette ─── */
const C = {
  cream: "#FFF8E7",
  creamDeep: "#FFFDF5",
  white: "#FFFFFF",
  border: "#F0E4C8",
  textMain: "#1A1A1A",
  textMid: "#8A8578",
  textFaint: "#B0A99A",
  yellow: "#FFC107",
  yellowDark: "#B8860B",
  yellowBg: "#FFF3CD",
  yellowBorder: "#FFE082",
  green:    "#B8860B",
  greenBg:  "#FFF3CD",
  blue: "#185FA5",
  blueBg: "#E6F1FB",
  purple: "#534AB7",
  purpleBg: "#EEEDFE",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
};

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

  const handleSummarize = async (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    const toastId = toast.loading("Summarizing history...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE}/tickets/summarize/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.dismiss(toastId);
      toast.success("Summary Generated", {
        description: res.data.data,
        duration: 10000,
      });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to summarize", {
        description: err.response?.data?.message || err.message,
      });
    }
  };

  return (
    <div style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.cream, fontFamily: "DM Sans, Inter, sans-serif" }}>

      {/* Page Header */}
      <div style={{ padding: '32px 32px 24px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 6 }}>
            Customer Intelligence
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: C.textMain }}>Customers</h1>
        </div>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: C.textFaint }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', background: C.white, border: `0.5px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px 10px 38px', fontWeight: 400, fontSize: '14px', color: C.textMain, width: '240px', outline: 'none' }}
            placeholder="Search customers…"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', padding: '24px 32px' }}>
        {[
          { label: "TOTAL CUSTOMERS", value: customers.length, icon: Users, color: C.green, bg: C.greenBg, showLive: true },
          { label: "AT RISK", value: 0, icon: AlertTriangle, color: C.yellowDark, bg: C.yellowBg },
          { label: "AVG. RESPONSE", value: "—", icon: Clock, color: C.blue, bg: C.blueBg },
          { label: "SATISFACTION", value: "—", icon: CheckCircle, color: C.purple, bg: C.purpleBg },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: '24px', position: 'relative', overflow: 'hidden', background: C.white, border: `0.5px solid ${C.border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFaint }}>{stat.label}</span>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon style={{ width: '14px', height: '14px', color: stat.color }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '32px', fontWeight: 500, color: C.textMain }}>{stat.value}</div>
              {stat.showLive && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: C.greenBg, color: C.green, borderRadius: '100px', padding: '3px 10px', fontSize: '10px', fontWeight: 500 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green }}/> Live
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading & Error */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '8px', color: C.textMid }}>
          <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading customers…</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
          <AlertCircle style={{ width: '32px', height: '32px', color: '#A32D2D' }} />
          <p style={{ fontSize: '14px', color: C.textMid }}>{error}</p>
        </div>
      )}

      {/* Customers Table */}
      {!loading && !error && (
        <div style={{ padding: '0 32px 32px', flex: 1 }}>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '128px', fontSize: '14px', color: C.textFaint }}>
                {search ? `No customers matching "${search}"` : "No customers found."}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: C.creamDeep, borderBottom: `0.5px solid ${C.border}` }}>
                  <tr>
                    {["Customer", "Phone", "Language", "Last Updated", "Channels", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: '12px 20px', fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                      style={{ borderBottom: `0.5px solid ${C.border}`, transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = C.creamDeep}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Customer Info */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: C.yellowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '13px', color: C.yellowDark, flexShrink: 0 }}>
                            {initials(c.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '14px', color: C.textMain }}>{c.name}</div>
                            <div style={{ fontWeight: 400, fontSize: '12px', color: C.textFaint, marginTop: '1px' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '13px', color: C.textMid }}>{c.phone || "—"}</span>
                      </td>

                      {/* Language */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ background: C.creamDeep, border: `0.5px solid ${C.border}`, color: C.textMid, borderRadius: '6px', padding: '3px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '11px', textTransform: 'uppercase' }}>
                          {c.language}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '12px', color: C.textFaint }}>{timeAgo(c.updatedAt)}</span>
                      </td>

                      {/* Channels */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.creamDeep }}>
                             <Mail style={{ width: '12px', height: '12px', color: C.blue }} />
                          </div>
                          {c.channel_ids?.whatsapp && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.creamDeep }}>
                               <MessageSquare style={{ width: '12px', height: '12px', color: C.green }} />
                            </div>
                          )}
                          {c.phone && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.creamDeep }}>
                               <Phone style={{ width: '12px', height: '12px', color: C.purple }} />
                            </div>
                          )}
                          {c.channel_ids?.social_id && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.creamDeep }}>
                               <Smartphone style={{ width: '12px', height: '12px', color: C.amber }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {c.isActive ? (
                          <span style={{ background: C.greenBg, color: C.green, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>Active</span>
                        ) : (
                          <span style={{ background: C.border, color: C.textMid, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>Inactive</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <button
                          onClick={(e) => handleSummarize(e, c._id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.textMain, border: 'none', color: C.yellow, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#2A2A2A'}
                          onMouseOut={(e) => e.currentTarget.style.background = C.textMain}
                        >
                          <BrainCircuit style={{ width: '14px', height: '14px' }} />
                          Summarize
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}