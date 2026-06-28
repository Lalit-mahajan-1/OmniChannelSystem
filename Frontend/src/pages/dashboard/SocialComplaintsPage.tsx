import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, AlertTriangle, Loader2, AlertCircle, CheckCircle, MessageSquare, UserPlus, Edit3, Trash2, Smartphone, BarChart3, TrendingUp, Info, Zap, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  green: "#B8860B",
  greenBg: "#FFF3CD",
  blue: "#185FA5",
  blueBg: "#E6F1FB",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
};

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

interface InternalNote {
  note: string;
  addedBy?: UserDetails;
  addedAt: string;
}

interface Complaint {
  _id: string;
  platform: string;
  keyword: string;
  author: string;
  content: string;
  postUrl?: string;
  sentiment: "positive" | "negative" | "neutral";
  priority: "low" | "medium" | "high" | "critical";
  complaintStatus: "new" | "pending" | "assigned" | "in_progress" | "resolved" | "closed";
  isComplaint: boolean;
  customerId?: UserDetails;
  assignedTo?: UserDetails;
  resolvedBy?: UserDetails;
  internalNotes?: InternalNote[];
  resolutionNote?: string;
  resolvedAt?: string;
  scrapedAt: string;
  createdAt: string;
}

interface Stats {
  total: number;
  complaints: number;
  unassigned: number;
  status: {
    new: number;
    pending: number;
    assigned: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  platform: {
    twitter: number;
    reddit: number;
    youtube: number;
  };
  sentiment: {
    negative: number;
    positive: number;
    neutral: number;
  };
}

interface ComplaintListResponse {
  data: Complaint[];
  total: number;
  totalPages: number;
}

type ModalType = "resolve" | "note" | "assign" | "link" | "delete" | "error" | null;

function timeAgo(iso: string) {
  if (!iso) return "Unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SocialComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const [scraping, setScraping] = useState(false);
  const [scrapeKeyword, setScrapeKeyword] = useState("HDFC Bank");
  const [scrapeResult, setScrapeResult] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionModal, setActionModal] = useState<{
    show: boolean;
    type: ModalType;
    id: string;
    title: string;
    message?: string;
    input1?: string;
    input2?: string;
    placeholder1?: string;
    placeholder2?: string;
    loading: boolean;
  }>({
    show: false,
    type: null,
    id: "",
    title: "",
    message: "",
    input1: "",
    input2: "",
    placeholder1: "",
    placeholder2: "",
    loading: false,
  });

  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const openModal = (
    type: ModalType,
    id: string,
    title: string,
    message?: string,
    placeholder1?: string,
    placeholder2?: string
  ) => {
    setActionModal({
      show: true,
      type,
      id,
      title,
      message: message || "",
      input1: "",
      input2: "",
      placeholder1: placeholder1 || "",
      placeholder2: placeholder2 || "",
      loading: false,
    });
  };

  const closeModal = () => {
    setActionModal((prev) => ({ ...prev, show: false }));
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE}/social/stats`, {
        headers: authHeaders,
      });
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, any> = {
        page,
        limit: 10,
        isComplaint: true,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (platformFilter) params.platform = platformFilter;
      if (statusFilter) params.complaintStatus = statusFilter;

      const res = await axios.get<ComplaintListResponse>(`${BASE}/social/complaints`, {
        headers: authHeaders,
        params,
      });

      setComplaints((res.data as any).data || []);
      setTotal((res.data as any).total || 0);
      setTotalPages((res.data as any).totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintDetails = async (id: string) => {
    setDetailsLoading(true);
    try {
      const res = await axios.get(`${BASE}/social/complaints/${id}`, {
        headers: authHeaders,
      });
      setSelected(res.data.data);
    } catch (err: any) {
      openModal("error", id, "Fetch Error", err.response?.data?.message || "Failed to fetch complaint details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshAll = async (keepSelected = true) => {
    await Promise.all([fetchStats(), fetchComplaints()]);
    if (keepSelected && selected?._id) {
      await fetchComplaintDetails(selected._id);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, platformFilter, statusFilter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);

    setTimeout(() => {
      fetchComplaints();
    }, 0);
  };

  const handleScrape = async () => {
    if (!scrapeKeyword.trim()) {
      setScrapeResult("Keyword is required");
      return;
    }

    setScraping(true);
    setScrapeResult("");

    try {
      const payload = {
        keyword: scrapeKeyword.trim(),
        platforms: ["twitter", "reddit", "youtube"]
      };

      const res = await axios.post(`${BASE}/social/scrape`, payload, {
        headers: authHeaders,
      });

      setScrapeResult(
        `Fetched ${res.data.meta?.totalFetched || 0}, saved ${res.data.meta?.savedCount || 0}, duplicates ${res.data.meta?.duplicateCount || 0}`
      );

      setPage(1);
      await refreshAll(false);
    } catch (err: any) {
      setScrapeResult(err.response?.data?.message || "Failed to scrape social platforms");
    } finally {
      setScraping(false);
    }
  };

  const updateStatus = async (id: string, complaintStatus: string) => {
    try {
      await axios.patch(
        `${BASE}/social/complaints/${id}/status`,
        { complaintStatus },
        { headers: authHeaders }
      );

      await refreshAll();
    } catch (err: any) {
      openModal("error", id, "Update Error", err.response?.data?.message || "Failed to update status");
    }
  };

  const handleModalSubmit = async () => {
    const { type, id, input1, input2 } = actionModal;
    setActionModal((prev) => ({ ...prev, loading: true }));

    try {
      if (type === "resolve") {
        if (!input1?.trim()) throw new Error("Employer ID is required");
        await axios.patch(
          `${BASE}/social/complaints/${id}/resolve`,
          {
            resolvedBy: input1.trim(),
            resolutionNote: input2?.trim() || "",
          },
          { headers: authHeaders }
        );
      }

      if (type === "note") {
        if (!input1?.trim()) throw new Error("Note is required");
        const payload: any = { note: input1.trim() };
        if (input2?.trim()) payload.addedBy = input2.trim();

        await axios.patch(`${BASE}/social/complaints/${id}/note`, payload, {
          headers: authHeaders,
        });
      }

      if (type === "assign") {
        if (!input1?.trim()) throw new Error("Employee ID is required");
        await axios.patch(
          `${BASE}/social/complaints/${id}/assign`,
          { assignedTo: input1.trim() },
          { headers: authHeaders }
        );
      }

      if (type === "link") {
        if (!input1?.trim()) throw new Error("Customer ID is required");
        await axios.patch(
          `${BASE}/social/complaints/${id}/link-customer`,
          { customerId: input1.trim() },
          { headers: authHeaders }
        );
      }

      if (type === "delete") {
        await axios.delete(`${BASE}/social/complaints/${id}`, {
          headers: authHeaders,
        });

        if (selected?._id === id) {
          setSelected(null);
        }
      }

      closeModal();
      await refreshAll(false);

      if (type !== "delete" && selected?._id === id) {
        await fetchComplaintDetails(id);
      }
    } catch (err: any) {
      setActionModal((prev) => ({
        ...prev,
        loading: false,
        type: "error",
        title: "Error",
        message: err.response?.data?.message || err.message || "Operation failed",
      }));
    }
  };

  const setResolved = (id: string) => {
    openModal(
      "resolve",
      id,
      "Resolve Complaint",
      "",
      "Required: Resolver Employer ID",
      "Optional: Resolution Note"
    );
  };

  const addNote = (id: string) => {
    openModal(
      "note",
      id,
      "Add Internal Note",
      "",
      "Required: Note text",
      "Optional: Employer ID"
    );
  };

  const assignEmployee = (id: string) => {
    openModal("assign", id, "Assign Complaint", "", "Required: Employee ID");
  };

  const assignToMe = async (id: string) => {
    const employerId = user?._id || (user as any)?.id;
    if (!employerId) {
      openModal("error", id, "Assign Error", "Employer ID could not be identified from session.");
      return;
    }
    try {
      await axios.patch(
        `${BASE}/social/complaints/${id}/assign`,
        { assignedTo: employerId },
        { headers: authHeaders }
      );
      await refreshAll(true);
    } catch (err: any) {
      openModal("error", id, "Assign Error", err.response?.data?.message || "Failed to self-assign");
    }
  };

  const linkCustomer = (id: string) => {
    openModal("link", id, "Link Customer", "", "Required: Customer ID");
  };

  const deleteComplaint = (id: string) => {
    openModal("delete", id, "Archive Complaint", "Are you sure you want to archive this complaint?");
  };

  // UI Helpers
  const getSeverityStyle = (priority: string) => {
    if (priority === 'critical') return { background: C.yellowDark, boxShadow: 'none', textLabel: 'CRITICAL', labelBg: C.yellowBg, labelText: C.yellowDark, labelBorder: `1px solid ${C.yellowBorder}` };
    if (priority === 'high') return { background: C.amber, boxShadow: 'none', textLabel: 'HIGH', labelBg: C.amberBg, labelText: C.yellowDark, labelBorder: `1px solid ${C.amberBg}` };
    if (priority === 'medium') return { background: C.amber, boxShadow: 'none', textLabel: 'MEDIUM', labelBg: C.amberBg, labelText: C.amber, labelBorder: `1px solid ${C.amberBg}` };
    return { background: C.blue, boxShadow: 'none', textLabel: 'LOW', labelBg: C.blueBg, labelText: C.blue, labelBorder: `1px solid ${C.blueBg}` };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'new') return <span className="badge-green">NEW</span>;
    if (status === 'assigned') return <span className="badge-blue">ASSIGNED</span>;
    return <span style={{ background: C.creamDeep, color: C.textMid, padding: '3px 10px', borderRadius: '100px', fontSize: '11px', textTransform: 'uppercase' }}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Page Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
        <div className="section-eyebrow">CUSTOMER COMPLAINTS</div>
        <h1 className="page-title" style={{ margin: '0' }}>Complaint Box</h1>
        
        {stats && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 16px' }}>
              <BarChart3 style={{ width: '14px', height: '14px', color: '#60A5FA' }} />
              <div>
                <span style={{ font: 'var(--font-data)', fontSize: '22px', color: C.textMain, fontWeight: 600 }}>{stats.total}</span>
                <span style={{ fontSize: '11px', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: '6px' }}>TOTAL EXTRACTED</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 16px' }}>
              <AlertTriangle style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
              <div>
                <span style={{ font: 'var(--font-data)', fontSize: '22px', color: C.textMain, fontWeight: 600 }}>{stats.complaints}</span>
                <span style={{ fontSize: '11px', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: '6px' }}>COMPLAINTS</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 16px' }}>
              <CheckCircle style={{ width: '14px', height: '14px', color: '#3ECF6A' }} />
              <div>
                <span style={{ font: 'var(--font-data)', fontSize: '22px', color: C.textMain, fontWeight: 600 }}>{stats.status.resolved + stats.status.closed}</span>
                <span style={{ fontSize: '11px', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: '6px' }}>RESOLVED</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 16px' }}>
              <UserPlus style={{ width: '14px', height: '14px', color: '#A78BFA' }} />
              <div>
                <span style={{ font: 'var(--font-data)', fontSize: '22px', color: C.textMain, fontWeight: 600 }}>{stats.unassigned}</span>
                <span style={{ fontSize: '11px', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: '6px' }}>UNASSIGNED</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <input
          value={scrapeKeyword}
          onChange={(e) => setScrapeKeyword(e.target.value)}
          placeholder="Keyword to scrape..."
          style={{ flex: 1, minWidth: '150px', background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 16px', color: C.textMain, fontSize: '14px', outline: 'none' }}
        />
        <button onClick={handleScrape} disabled={scraping} className="btn-primary-db" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {scraping ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Zap style={{ width: '14px', height: '14px' }} />}
          SCRAPE
        </button>
        {scrapeResult && <span style={{ fontSize: '12px', color: C.yellowDark, marginLeft: '8px' }}>{scrapeResult}</span>}
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: C.textMid }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px 10px 36px', color: C.textMain, fontSize: '13px', outline: 'none', width: '220px' }}
            />
          </form>
          <select
            value={platformFilter}
            onChange={(e) => { setPage(1); setPlatformFilter(e.target.value); }}
            style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', color: C.textMid, fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="twitter">Twitter</option>
            <option value="reddit">Reddit</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', color: C.textMid, fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main 2-Col Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', flex: 1, overflow: 'hidden' }}>
        
        {/* Complaints List */}
        <div className="scrollbar-thin" style={{ borderRight: `1px solid ${C.border}`, overflowY: 'auto', padding: '16px 24px' }}>
          {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: C.textMid, gap: '8px' }}><Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> Loading...</div>}
          {error && !loading && <div style={{ color: C.amber, textAlign: 'center', padding: '20px' }}>{error}</div>}
          {!loading && !error && complaints.length === 0 && <div style={{ color: C.textMid, textAlign: 'center', padding: '40px' }}>No complaints found.</div>}
          
          {!loading && !error && complaints.map((c, i) => {
            const sevStyle = getSeverityStyle(c.priority);
            const isSelected = selected?._id === c._id;
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                onClick={() => fetchComplaintDetails(c._id)}
                style={{
                  background: isSelected ? C.yellowBg : C.creamDeep,
                  border: '1px solid',
                  borderColor: isSelected ? C.yellowBorder : C.creamDeep,
                  borderRadius: '12px',
                  padding: '16px 18px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  if(!isSelected) e.currentTarget.style.background = C.creamDeep;
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Severity Bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: sevStyle.background, boxShadow: sevStyle.boxShadow }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '11px', color: C.textFaint, textTransform: 'uppercase' }}>
                    <Smartphone style={{ width: '12px', height: '12px' }} /> {c.platform}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: '10px', color: C.textFaint }}>{timeAgo(c.scrapedAt)}</div>
                </div>

                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', color: C.textMain, lineHeight: 1.4, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.content}
                </div>

                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '12px', color: C.textFaint, marginBottom: '12px' }}>
                  @{c.author} • {c.keyword}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusBadge(c.complaintStatus)}
                  <span style={{ background: sevStyle.labelBg, border: sevStyle.labelBorder, color: sevStyle.labelText, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {sevStyle.textLabel}
                  </span>
                </div>
              </motion.div>
            );
          })}
          
          {!loading && !error && totalPages > 1 && (
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost-db" style={{ padding: '6px 12px', fontSize: '12px' }}>Prev</button>
                <span style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono', monospace" }}>Pg {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost-db" style={{ padding: '6px 12px', fontSize: '12px' }}>Next</button>
             </div>
          )}
        </div>

        {/* Selected Complaint Detail Panel */}
        <div style={{ background: C.cream, overflowY: 'auto' }} className="scrollbar-thin">
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: C.white, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>
                <AlertTriangle style={{ width: '28px', height: '28px', color: C.textFaint }} />
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '16px', color: C.textMid }}>Select a Complaint</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '13px', color: C.textFaint, marginTop: '6px', maxWidth: '240px' }}>
                Select a social complaint from the list to view full details and take action.
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px' }}>
               {detailsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.textMid }}><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}/> Loading details...</div>
               ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <div>
                        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '20px', color: C.textMain, marginBottom: '4px' }}>Complaint Details</h2>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: C.textFaint }}>ID: {selected._id}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={selected.complaintStatus}
                          onChange={(e) => updateStatus(selected._id, e.target.value)}
                          style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 10px', color: C.textMain, fontSize: '12px', outline: 'none' }}
                        >
                          <option value="new">New</option>
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button onClick={() => deleteComplaint(selected._id)} style={{ background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBg}`, padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Archive">
                           <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>

                    <div className="glass-card-db" style={{ padding: '20px', marginBottom: '16px' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                             <div className="section-eyebrow" style={{ color: C.textFaint, marginBottom: '4px' }}>Platform</div>
                             <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', color: C.textMain, textTransform: 'capitalize' }}>{selected.platform}</div>
                          </div>
                          <div>
                             <div className="section-eyebrow" style={{ color: C.textFaint, marginBottom: '4px' }}>Author</div>
                             <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', color: C.textMain }}>@{selected.author}</div>
                          </div>
                          <div>
                             <div className="section-eyebrow" style={{ color: C.textFaint, marginBottom: '4px' }}>Sentiment</div>
                             <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', color: selected.sentiment === 'negative' ? C.amber : selected.sentiment === 'positive' ? C.yellowDark : C.textMid, textTransform: 'capitalize' }}>{selected.sentiment}</div>
                          </div>
                          <div>
                             <div className="section-eyebrow" style={{ color: C.textFaint, marginBottom: '4px' }}>Priority</div>
                             <span style={{ fontSize: '11px', fontWeight: 600, color: getSeverityStyle(selected.priority).labelText }}>{selected.priority.toUpperCase()}</span>
                          </div>
                       </div>
                       
                       <div style={{ background: C.creamDeep, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '13px', color: C.textMid, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {selected.content}
                          </div>
                          {selected.postUrl && (
                             <a href={selected.postUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '12px', color: C.yellowDark, fontWeight: 500 }}>
                                View Original <TrendingUp style={{ width: '12px', height: '12px' }} />
                             </a>
                          )}
                       </div>
                    </div>

                    <div className="glass-card-db" style={{ padding: '20px', marginBottom: '16px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: C.textMain }}>
                             <UserPlus style={{ width: '14px', height: '14px', color: '#60A5FA' }} /> Assignment
                          </div>
                       </div>
                       <div style={{ background: C.creamDeep, padding: '12px', borderRadius: '8px', border: `1px solid ${C.border}`, marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="section-eyebrow" style={{ color: C.textFaint }}>Employee</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                               <span onClick={() => assignToMe(selected._id)} style={{ cursor: 'pointer', fontSize: '10px', color: C.yellowDark }}>Self-Assign</span>
                               <span onClick={() => assignEmployee(selected._id)} style={{ cursor: 'pointer', fontSize: '10px', color: C.blue }}>Change</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '13px', color: selected.assignedTo ? C.textMain : C.textFaint }}>
                            {selected.assignedTo ? (selected.assignedTo.name || selected.assignedTo.email) : 'Unassigned'}
                          </div>
                       </div>
                       <div style={{ background: C.creamDeep, padding: '12px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="section-eyebrow" style={{ color: C.textFaint }}>Customer</span>
                            <span onClick={() => linkCustomer(selected._id)} style={{ cursor: 'pointer', fontSize: '10px', color: C.blue }}>Change</span>
                          </div>
                          <div style={{ fontSize: '13px', color: selected.customerId ? C.textMain : C.textFaint }}>
                            {selected.customerId ? (selected.customerId.name || selected.customerId.email) : 'Not Linked'}
                          </div>
                       </div>
                    </div>

                    <div className="glass-card-db" style={{ padding: '20px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: C.textMain }}>
                             <Edit3 style={{ width: '14px', height: '14px', color: C.amber }} /> Notes & Resolution
                          </div>
                          <button onClick={() => addNote(selected._id)} className="btn-ghost-db" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', minWidth: 0 }}>Add Note</button>
                       </div>
                       
                       {(selected.complaintStatus !== 'resolved' && selected.complaintStatus !== 'closed') && (
                          <button onClick={() => setResolved(selected._id)} style={{ width: '100%', background: C.yellowBg, border: `1px solid ${C.yellowBorder}`, color: C.yellowDark, borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', marginBottom: '16px' }}>
                            <CheckCircle style={{ width: '14px', height: '14px' }} /> MARK AS RESOLVED
                          </button>
                       )}

                       {selected.resolvedBy && (
                          <div style={{ background: C.yellowBg, border: `1px solid ${C.yellowBorder}`, padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                             <div style={{ fontSize: '11px', color: C.yellowDark, fontWeight: 600, marginBottom: '4px' }}>Resolved By: {selected.resolvedBy.name || selected.resolvedBy.email}</div>
                             {selected.resolutionNote && <div style={{ fontSize: '12px', color: C.textMid }}>Note: {selected.resolutionNote}</div>}
                          </div>
                       )}

                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selected.internalNotes && selected.internalNotes.map((note, idx) => (
                             <div key={idx} style={{ background: C.creamDeep, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: '12px', color: C.textMain, marginBottom: '4px' }}>{note.note}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textFaint }}>
                                   <span>{note.addedBy ? (note.addedBy.name || note.addedBy.email) : 'System'}</span>
                                   <span>{new Date(note.addedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                             </div>
                          ))}
                          {(!selected.internalNotes || selected.internalNotes.length === 0) && (
                             <div style={{ fontSize: '12px', color: C.textFaint, textAlign: 'center', padding: '10px 0' }}>No internal notes.</div>
                          )}
                       </div>
                    </div>

                  </>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Modals remain structurally similar but themed */}
      <AnimatePresence>
        {actionModal.show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,11,13,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '16px', color: C.textMain }}>{actionModal.title}</h3>
                  <X style={{ width: '16px', height: '16px', color: C.textFaint, cursor: 'pointer' }} onClick={closeModal} />
               </div>

               {actionModal.message && (
                  <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '16px', background: C.creamDeep, padding: '12px', borderRadius: '8px' }}>{actionModal.message}</p>
               )}

               {actionModal.type !== "delete" && actionModal.type !== "error" && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                     {actionModal.placeholder1 && (
                        <input value={actionModal.input1 || ""} onChange={(e) => setActionModal(p => ({...p, input1: e.target.value}))} placeholder={actionModal.placeholder1} className="input-db" style={{ width: '100%', boxSizing: 'border-box' }} />
                     )}
                     {actionModal.placeholder2 && (
                        <input value={actionModal.input2 || ""} onChange={(e) => setActionModal(p => ({...p, input2: e.target.value}))} placeholder={actionModal.placeholder2} className="input-db" style={{ width: '100%', boxSizing: 'border-box' }} />
                     )}
                  </div>
               )}

               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={closeModal} className="btn-ghost-db" style={{ padding: '8px 16px', fontSize: '12px' }}>{actionModal.type === 'error' ? 'Close' : 'Cancel'}</button>
                  {actionModal.type !== 'error' && (
                     <button onClick={handleModalSubmit} disabled={actionModal.loading} className="btn-primary-db" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', ...(actionModal.type === 'delete' ? { background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: 'white' } : {}) }}>
                        {actionModal.loading && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
                        {actionModal.type === 'delete' ? 'Confirm Archive' : 'Submit'}
                     </button>
                  )}
               </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}