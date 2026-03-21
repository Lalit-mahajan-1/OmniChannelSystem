import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, AlertTriangle, Loader2, AlertCircle, CheckCircle,
  MessageSquare, UserPlus, Clock, Edit3, Trash2, Smartphone
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL;

interface Complaint {
  _id: string;
  platform: string;
  source_id: string;
  author: string;
  content: string;
  sentiment_score: number;
  priority: string;
  status: string;
  url: string;
  metrics: { likes: number; shares: number; comments: number };
  customer_id?: string;
  assigned_to?: string;
  internal_notes: string[];
  resolved_at?: string;
  posted_at: string;
  createdAt: string;
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

export default function SocialComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Scrape state
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // View state
  const [selected, setSelected] = useState<Complaint | null>(null);

  const fetchComplaints = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    axios
      .get(`${BASE}/social/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10 }
      })
      .then(res => {
        setComplaints(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch(err => setError(err.response?.data?.message || "Failed to load complaints"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResult("");
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${BASE}/social/scrape`,
        { keyword: "HDFC Bank", platforms: ["twitter", "reddit", "youtube"], complaintsOnly: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScrapeResult(`Successfully scraped ${res.data.data?.length || 0} new complaints.`);
      setPage(1);
      fetchComplaints();
    } catch (err: any) {
      setScrapeResult(err.response?.data?.message || "Failed to generate complaints.");
    } finally {
      setScraping(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(`${BASE}/social/complaints/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
      if (selected?._id === id) setSelected({ ...selected, status });
    } catch (err) {}
  };

  const resolveComplaint = async (id: string, resolution_summary: string) => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(`${BASE}/social/complaints/${id}/resolve`, { resolution_summary }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
      if (selected?._id === id) setSelected({ ...selected, status: "resolved", resolved_at: new Date().toISOString() });
    } catch (err) {}
  };

  const addNote = async (id: string) => {
    const note = prompt("Enter internal note:");
    if (!note) return;
    const token = localStorage.getItem("token");
    try {
      await axios.patch(`${BASE}/social/complaints/${id}/note`, { note }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
    } catch (err) {}
  };

  const assignAgent = async (id: string) => {
    const assigned_to = prompt("Enter Agent ID to assign:");
    if (!assigned_to) return;
    const token = localStorage.getItem("token");
    try {
      await axios.patch(`${BASE}/social/complaints/${id}/assign`, { assigned_to }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
    } catch (err) {}
  };

  const linkCustomer = async (id: string) => {
    const customer_id = prompt("Enter Customer ID to link:");
    if (!customer_id) return;
    const token = localStorage.getItem("token");
    try {
      await axios.patch(`${BASE}/social/complaints/${id}/link-customer`, { customer_id }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
    } catch (err) {}
  };

  const deleteComplaint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${BASE}/social/complaints/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (selected?._id === id) setSelected(null);
      fetchComplaints();
    } catch (err) {}
  };

  const getPriorityColor = (p: string) => {
    if (p === "high") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (p === "medium") return "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20";
    return "bg-green-500/10 text-green-400 border-green-500/20";
  };

  return (
    <div className="flex h-full">
      {/* ── Sidebar list ── */}
      <div className="w-1/2 lg:w-2/5 border-r border-white/[0.06] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-neon-yellow" />
              Complaint Box
            </h1>
            <span className="text-xs bg-white/[0.06] px-2 py-1 rounded-full text-muted-foreground border border-white/[0.08]">
              Total: {total}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-neon-cyan text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {scraping ? "Generating..." : "Generate New Complaints"}
            </button>
            {scrapeResult && (
              <p className="text-[11px] text-center text-muted-foreground mt-1">{scrapeResult}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading complaints…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-400/70" />
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && complaints.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center text-muted-foreground">
              <AlertTriangle className="w-6 h-6 opacity-30" />
              <p className="text-xs">No complaints found.</p>
            </div>
          )}

          {!loading && !error && complaints.map((c, i) => (
            <motion.button
              key={c._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(c)}
              className={`w-full text-left p-5 border-b border-white/[0.04] transition-colors ${
                selected?._id === c._id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold capitalize text-neon-cyan">{c.platform}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{timeAgo(c.posted_at)}</span>
              </div>
              <p className="text-sm line-clamp-2 text-foreground/90 mb-3">{c.content}</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)} capitalize text-[10px]`}>
                  {c.priority} Priority
                </span>
                <span className={`capitalize ${
                  c.status === 'resolved' ? 'text-green-400' : 'text-neon-yellow'
                }`}>
                  {c.status.replace('_', ' ')}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-white/[0.06] flex items-center justify-between text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] disabled:opacity-30 transition-colors hover:bg-white/[0.08]"
            >
              Prev
            </button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] disabled:opacity-30 transition-colors hover:bg-white/[0.08]"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Details Panel ── */}
      <div className="flex-1 flex flex-col bg-background/30 backdrop-blur-sm">
        {selected ? (
          <div className="p-8 h-full overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Complaint Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selected._id, "in_progress")}
                  className="px-3 py-1.5 text-xs rounded-lg border border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow/10 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => resolveComplaint(selected._id, "Resolved via portal")}
                  className="px-3 py-1.5 text-xs rounded-lg border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve
                </button>
                <button
                  onClick={() => deleteComplaint(selected._id)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/[0.06]">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Platform</p>
                  <p className="font-semibold capitalize text-neon-cyan">{selected.platform}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Author</p>
                  <p className="font-medium text-foreground/90 truncate">{selected.author}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-medium capitalize flex items-center gap-1">
                    {selected.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Clock className="w-3.5 h-3.5 text-neon-yellow" />}
                    {selected.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Priority</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(selected.priority)}`}>
                    {selected.priority}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Message Content
                </h3>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.content}
                </div>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noreferrer" className="text-xs text-neon-cyan hover:underline mt-3 inline-block">
                    View Original Post ↗
                  </a>
                )}
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/[0.06]">
                <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.01]">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Assignments
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Assigned Agent:</span>
                      <span className="text-xs font-mono">{selected.assigned_to || "Unassigned"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Linked Customer:</span>
                      <span className="text-xs font-mono">{selected.customer_id || "None"}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => assignAgent(selected._id)} className="text-[10px] px-2 py-1 rounded border border-white/[0.1] hover:bg-white/[0.05] transition-colors">Assign Agent</button>
                      <button onClick={() => linkCustomer(selected._id)} className="text-[10px] px-2 py-1 rounded border border-white/[0.1] hover:bg-white/[0.05] transition-colors">Link Customer</button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.01] flex flex-col">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5 justify-between">
                    <span className="flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Internal Notes</span>
                    <button onClick={() => addNote(selected._id)} className="text-[10px] px-2 py-1 rounded bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 transition-colors">
                      + Add Note
                    </button>
                  </h4>
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-32 scrollbar-thin pr-2">
                    {selected.internal_notes?.length > 0 ? (
                      selected.internal_notes.map((note, idx) => (
                        <div key={idx} className="text-xs p-2 rounded bg-white/[0.04] text-foreground/80 border border-white/[0.05]">
                          {note}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No notes added yet.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">Select a complaint to view details & act on it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
