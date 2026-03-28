import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, MessageSquare, Mail, Phone, Smartphone, Loader2, AlertCircle, Users } from "lucide-react";

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
    <div style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Page Header */}
      <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-eyebrow">CUSTOMER INTELLIGENCE</div>
          <h1 className="page-title" style={{ margin: 0 }}>Customers</h1>
        </div>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94A3B8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '10px 14px 10px 38px', fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#F1F5F9', width: '240px', outline: 'none' }}
            placeholder="Search customers…"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', padding: '24px 32px' }}>
        {[
          { label: "TOTAL CUSTOMERS", value: customers.length, icon: Users, accent: "green", showLive: true },
          { label: "AT RISK", value: 0, icon: AlertTriangle, accent: "amber" },
          { label: "AVG. RESPONSE", value: "—", icon: Clock, accent: "blue" },
          { label: "SATISFACTION", value: "—", icon: CheckCircle, accent: "purple" },
        ].map((stat, i) => (
          <div key={stat.label} className="stat-card-db" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="section-eyebrow" style={{ color: '#475569', letterSpacing: '0.14em' }}>{stat.label}</span>
              <stat.icon style={{ width: '18px', height: '18px', color: stat.accent === 'green' ? '#3ECF6A' : stat.accent === 'amber' ? '#F59E0B' : stat.accent === 'blue' ? '#60A5FA' : '#A78BFA' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="stat-value" style={{ fontSize: '36px' }}>{stat.value}</div>
              {stat.showLive && <div className="badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><div className="live-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }}/> LIVE</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Loading & Error */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '8px', color: '#94A3B8' }}>
          <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading customers…</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
          <AlertCircle style={{ width: '32px', height: '32px', color: 'rgba(239,68,68,0.7)' }} />
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>{error}</p>
        </div>
      )}

      {/* Customers Table */}
      {!loading && !error && (
        <div style={{ padding: '0 32px 32px', flex: 1 }}>
          <div className="glass-card-db" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '128px', fontSize: '14px', color: '#475569' }}>
                {search ? `No customers matching "${search}"` : "No customers found."}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '12px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: '12px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>Language</th>
                    <th style={{ padding: '12px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>Last Updated</th>
                    <th style={{ padding: '12px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>Channels</th>
                    <th style={{ padding: '12px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Customer Info */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(62,207,106,0.2),rgba(62,207,106,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#3ECF6A', flexShrink: 0 }}>
                            {initials(c.name)}
                          </div>
                          <div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', color: '#F1F5F9' }}>{c.name}</div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '12px', color: '#475569', marginTop: '1px' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '13px', color: '#94A3B8' }}>{c.phone || "—"}</span>
                      </td>

                      {/* Language */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', borderRadius: '6px', padding: '3px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '11px', textTransform: 'uppercase' }}>
                          {c.language}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '12px', color: '#475569' }}>{timeAgo(c.updatedAt)}</span>
                      </td>

                      {/* Channels */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                             <Mail style={{ width: '12px', height: '12px', color: '#60A5FA' }} />
                          </div>
                          {c.channel_ids?.whatsapp && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                               <MessageSquare style={{ width: '12px', height: '12px', color: '#3ECF6A' }} />
                            </div>
                          )}
                          {c.phone && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                               <Phone style={{ width: '12px', height: '12px', color: '#A78BFA' }} />
                            </div>
                          )}
                          {c.channel_ids?.social_id && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                               <Smartphone style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {c.isActive ? (
                          <span className="badge-green">ACTIVE</span>
                        ) : (
                          <span style={{ background: 'rgba(255,255,255,0.06)', color: '#475569', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>INACTIVE</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
