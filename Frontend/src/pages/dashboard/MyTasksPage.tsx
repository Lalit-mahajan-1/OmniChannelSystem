import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  UserPlus,
  Edit3,
  Trash2,
  Smartphone,
  BarChart3,
  TrendingUp,
  Info,
  Zap,
  Sparkles,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const BASE = import.meta.env.VITE_API_URL;
const SOCIAL_AGENT = import.meta.env.VITE_SOCIAL_AGENT_URL;

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

export default function MyTasksPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Social Agent States
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisMap, setAnalysisMap] = useState<Map<string, any>>(new Map());
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const criticalCount = Array.from(analysisMap.values()).filter(a => a.urgency === 'critical').length;
  
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Empathetic");
  const [generatedReply, setGeneratedReply] = useState("");
  const [replyGenerating, setReplyGenerating] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

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
      const employerId = user?._id || (user as any)?.id;
      const params: Record<string, any> = {
        page,
        limit: 10,
        assignedTo: employerId,
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

    // fetch immediately with page reset behavior
    setTimeout(() => {
      fetchComplaints();
    }, 0);
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

  // --- SOCIAL AGENT INTEGRATION COMMANDS ---

  const analyzeSingle = async (complaintId: string) => {
    setAnalyzingId(complaintId);
    try {
      const res = await axios.post(`${SOCIAL_AGENT}/social-agent/analyze/${complaintId}`);
      setAnalysisMap(prev => new Map(prev).set(complaintId, res.data.analysis));
      toast.success("AI Analysis complete");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "AI Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  };

  const analyzeAll = async () => {
    setAnalyzingAll(true);
    toast.info("AI Analysis started...");
    try {
      const res = await axios.post(`${SOCIAL_AGENT}/social-agent/analyze-all`, { limit: 20 });
      const newMap = new Map(analysisMap);
      res.data.results.forEach((item: any) => {
        newMap.set(item.complaintId, item.analysis);
      });
      setAnalysisMap(newMap);
      toast.success(`Analyzed ${res.data.summary.total_analyzed} complaints — ${res.data.summary.critical_count} critical found!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to analyze all complaints");
    } finally {
      setAnalyzingAll(false);
    }
  };

  const generateReply = async (complaintId: string) => {
    setReplyGenerating(true);
    setReplyModalOpen(true);
    setGeneratedReply("");
    try {
      const res = await axios.post(`${SOCIAL_AGENT}/social-agent/suggest-response/${complaintId}`, { tone: selectedTone });
      setGeneratedReply(res.data.response);
    } catch (err: any) {
      toast.error("Failed to generate AI reply");
      setReplyModalOpen(false);
    } finally {
      setReplyGenerating(false);
    }
  };

  const appendAiNote = async (id: string, noteText: string) => {
    try {
      await axios.patch(`${BASE}/social/complaints/${id}/note`, { note: noteText }, { headers: authHeaders });
      toast.success("Note added!");
      await fetchComplaintDetails(id);
    } catch (err: any) {
      toast.error("Failed to add AI note");
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
        if (!input1?.trim()) throw new Error("Employer ID is required");
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

  const linkCustomer = (id: string) => {
    openModal("link", id, "Link Customer", "", "Required: Customer ID");
  };

  const deleteComplaint = (id: string) => {
    openModal("delete", id, "Archive Complaint", "Are you sure you want to archive this complaint?");
  };

  const getPriorityColor = (p: string) => {
    if (p === "critical" || p === "high") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (p === "medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-green-500/10 text-green-400 border-green-500/20";
  };

  const getPlatformColor = (platform: string) => {
    if (platform === "twitter") return "text-blue-400";
    if (platform === "reddit") return "text-orange-500";
    if (platform === "youtube") return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 lg:w-2/5 border-r border-white/[0.06] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                My Assigned Tasks
              </h1>
              <div className="flex items-center gap-3">
                <button 
                  onClick={analyzeAll} 
                  disabled={analyzingAll} 
                  className="px-3 py-1.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5 font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                   {analyzingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5"/>}
                   AI Analyze All
                </button>
                <span className="text-xs bg-white/[0.06] px-2 py-1 rounded-full text-muted-foreground border border-white/[0.08]">
                  {total} Found
                </span>
              </div>
            </div>

            {criticalCount > 0 && (
               <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                 <AlertCircle className="w-4 h-4"/>
                 ⚠ {criticalCount} CRITICAL complaints need immediate attention
               </div>
            )}

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search content, author, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-sm transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex gap-2">
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPage(1);
                  setPlatformFilter(e.target.value);
                }}
                className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xs px-2 py-1.5 focus:outline-none"
              >
                <option value="">All Platforms</option>
                <option value="twitter">Twitter</option>
                <option value="reddit">Reddit</option>
                <option value="youtube">YouTube</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xs px-2 py-1.5 focus:outline-none"
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

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading && (
              <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
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
                <Info className="w-6 h-6 opacity-30" />
                <p className="text-xs">No complaints found.</p>
              </div>
            )}

            {!loading &&
              !error &&
              complaints.map((c, i) => (
                <motion.button
                  key={c._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => fetchComplaintDetails(c._id)}
                  className={`w-full text-left p-4 border-b border-white/[0.04] transition-all duration-200 ${
                    selected?._id === c._id
                      ? "bg-white/[0.06] border-l-2 border-l-cyan-400"
                      : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className={`w-3.5 h-3.5 ${getPlatformColor(c.platform)}`} />
                      <span className="text-xs font-semibold capitalize text-foreground/80">
                        {c.platform}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(c.scrapedAt)}</span>
                  </div>

                  <p className="text-sm line-clamp-2 text-foreground/90 mb-2">{c.content}</p>

                  <div className="text-[10px] text-muted-foreground mb-3">
                    {c.author ? `@${c.author}` : "Unknown author"} {c.keyword ? `• ${c.keyword}` : ""}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)} capitalize text-[10px]`}>
                      {c.priority}
                    </span>

                    <span
                      className={`capitalize text-[10px] font-medium px-2 py-0.5 rounded border border-white/[0.05] ${
                        c.complaintStatus === "resolved" || c.complaintStatus === "closed"
                          ? "text-green-400 bg-green-400/5"
                          : c.complaintStatus === "in_progress"
                          ? "text-cyan-400 bg-cyan-400/5"
                          : "text-yellow-400 bg-yellow-400/5"
                      }`}
                    >
                      {c.complaintStatus.replace("_", " ")}
                    </span>

                    <button 
                       onClick={(e) => { e.stopPropagation(); analyzeSingle(c._id); }}
                       disabled={analyzingId === c._id}
                       className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[9px] font-bold flex items-center gap-1 hover:bg-purple-500/20 disabled:opacity-50"
                    >
                       {analyzingId === c._id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                       AI Analyze
                    </button>
                  </div>
                </motion.button>
              ))}
          </div>

          {!loading && !error && totalPages > 1 && (
            <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-sm bg-black/20">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.08] text-xs"
              >
                Prev
              </button>

              <span className="text-xs text-muted-foreground font-mono bg-white/[0.02] px-2 py-1 rounded">
                Pg {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.08] text-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-background/30 backdrop-blur-md relative overflow-hidden">
          {detailsLoading && (
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          )}

          {selected ? (
            <div className="p-8 h-full overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Complaint Details</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: <span className="font-mono">{selected._id}</span>
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selected.complaintStatus}
                    onChange={(e) => updateStatus(selected._id, e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-cyan-400/30 text-cyan-400 bg-cyan-400/5"
                  >
                    <option value="new">New</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  {selected.complaintStatus !== "resolved" && selected.complaintStatus !== "closed" && (
                    <button
                      onClick={() => setResolved(selected._id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-green-400/30 text-green-400 hover:bg-green-400/10 flex items-center gap-1 font-medium bg-green-400/5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  )}

                  <button
                    onClick={() => deleteComplaint(selected._id)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 bg-red-400/5"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                    Archive
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {analysisMap.has(selected._id) && (
                  <div className="glass-card p-5 rounded-xl border-l-4 border-l-purple-500 border-white/[0.04] bg-gradient-to-br from-purple-500/5 to-transparent shadow-lg text-foreground">
                     <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                        <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Action Plan</h3>
                        <div className="flex items-center gap-2">
                           <button onClick={() => analyzeSingle(selected._id)} className="text-xs px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground flex items-center gap-1 transition-colors"><RefreshCw className={`w-3 h-3 ${analyzingId === selected._id ? 'animate-spin' : ''}`}/> Re-analyze</button>
                           <button onClick={analyzeAll} disabled={analyzingAll} className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-bold flex items-center gap-1 transition-colors disabled:opacity-50"><Zap className="w-3 h-3"/> Analyze All</button>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Urgency</span>
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${analysisMap.get(selected._id)?.urgency === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : analysisMap.get(selected._id)?.urgency === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : analysisMap.get(selected._id)?.urgency === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{analysisMap.get(selected._id)?.urgency || 'unknown'}</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Category</span>
                           <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${analysisMap.get(selected._id)?.category === 'fraud' ? 'bg-red-500/10 text-red-400 border-red-500/20' : analysisMap.get(selected._id)?.category === 'billing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : analysisMap.get(selected._id)?.category === 'technical' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : analysisMap.get(selected._id)?.category === 'service' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-white/[0.05] text-white/80 border-white/[0.1]'}`}>{analysisMap.get(selected._id)?.category || 'general'}</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Escalation</span>
                           <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${analysisMap.get(selected._id)?.shouldEscalate ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{analysisMap.get(selected._id)?.shouldEscalate ? "Escalate Now" : "No Escalation"}</span>
                        </div>
                     </div>
                     
                     <p className="text-xs italic text-muted-foreground mb-4 font-medium opacity-90 border-l-2 border-white/[0.1] pl-3 py-1 bg-white/[0.01] rounded-r">{analysisMap.get(selected._id)?.summary}</p>
                     
                     <div className="mb-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-1">Suggested Action</span>
                        <p className="text-sm font-semibold text-indigo-200">{analysisMap.get(selected._id)?.suggestedAction}</p>
                     </div>
                     
                     <div className="mb-3 rounded-lg bg-green-500/5 border border-green-500/20 overflow-hidden">
                        <button onClick={() => setShowTemplate(!showTemplate)} className="w-full flex items-center justify-between p-3 bg-green-500/10 hover:bg-green-500/20 transition-colors border-b border-green-500/10 shadow-inner">
                           <span className="text-[10px] font-bold uppercase text-green-400 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> Response Template</span>
                           <div className="flex items-center gap-2">
                              <span onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(analysisMap.get(selected._id)?.responseTemplate || ""); toast.success('Copied!'); }} className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/40 flex items-center gap-1 font-bold shadow-sm"><Copy className="w-3 h-3"/> Copy</span>
                              {showTemplate ? <ChevronUp className="w-4 h-4 text-green-400"/> : <ChevronDown className="w-4 h-4 text-green-400"/>}
                           </div>
                        </button>
                        {showTemplate && <div className="p-4 text-xs font-medium leading-relaxed text-green-200/90 whitespace-pre-wrap bg-green-500/[0.02]">{analysisMap.get(selected._id)?.responseTemplate}</div>}
                     </div>
                     
                     <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-bold uppercase text-yellow-400 block">Internal Note</span>
                           <button onClick={() => appendAiNote(selected._id, analysisMap.get(selected._id)?.internalNote || "")} className="text-[9px] px-2 py-1.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"><Edit3 className="w-3 h-3"/> Add to Notes</button>
                        </div>
                        <p className="text-xs font-medium text-yellow-200/80 italic">{analysisMap.get(selected._id)?.internalNote}</p>
                     </div>
                     
                     {analysisMap.get(selected._id)?.tags?.length > 0 && (
                       <div className="flex flex-wrap gap-1.5 mt-2">
                          {analysisMap.get(selected._id).tags.map((tag: string, i: number) => (
                             <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground uppercase font-bold border border-white/[0.05]">{tag}</span>
                          ))}
                       </div>
                     )}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-white/[0.04]">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Platform</p>
                    <div className="flex items-center gap-2">
                      <Smartphone className={`w-4 h-4 ${getPlatformColor(selected.platform)}`} />
                      <p className="font-semibold capitalize">{selected.platform}</p>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-white/[0.04]">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Author</p>
                    <p className="font-medium truncate">{selected.author || "Anonymous"}</p>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-white/[0.04]">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Sentiment</p>
                    <p
                      className={`font-medium capitalize ${
                        selected.sentiment === "positive"
                          ? "text-green-400"
                          : selected.sentiment === "negative"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {selected.sentiment}
                    </p>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-white/[0.04]">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Priority</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(selected.priority)}`}>
                      {selected.priority}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-xl border border-white/[0.04]">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    Content
                  </h3>

                  <div className="p-4 rounded-lg bg-background/50 border border-white/[0.02] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selected.content}
                  </div>

                  {selected.postUrl && (
                    <div className="mt-4 flex justify-end">
                      <a
                        href={selected.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-400 hover:text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        View Original Source
                        <TrendingUp className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-end">
                     <button 
                        onClick={() => generateReply(selected._id)} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                     >
                        {replyGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <MessageSquare className="w-4 h-4"/>} 
                        Generate Public Reply
                     </button>
                  </div>
                </div>

                {(selected.resolvedBy || selected.resolutionNote) && (
                  <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                    <h4 className="text-xs font-semibold text-green-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Resolution Details
                    </h4>

                    {selected.resolvedBy && (
                      <p className="text-xs text-foreground/80 mb-1">
                        Resolved by:{" "}
                        <span className="font-semibold">
                          {selected.resolvedBy.name || selected.resolvedBy.email}
                        </span>
                      </p>
                    )}

                    {selected.resolutionNote && (
                      <p className="text-xs text-muted-foreground bg-white/[0.02] p-2 rounded mt-2 border border-white/[0.04]">
                        {selected.resolutionNote}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-5 rounded-xl border border-white/[0.04] flex flex-col">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                      <UserPlus className="w-4 h-4 text-purple-400" />
                      Assignment & Customer
                    </h4>

                    <div className="space-y-4 flex-1">
                      <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground uppercase">Assigned Employee</span>
                          <button
                            onClick={() => assignEmployee(selected._id)}
                            className="text-[10px] text-cyan-400 hover:underline"
                          >
                            Change
                          </button>
                        </div>
                        <p className="text-sm font-medium">
                          {selected.assignedTo ? (
                            selected.assignedTo.name || selected.assignedTo.email
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Unassigned</span>
                          )}
                        </p>
                      </div>

                      <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground uppercase">Linked Customer</span>
                          <button
                            onClick={() => linkCustomer(selected._id)}
                            className="text-[10px] text-purple-400 hover:underline"
                          >
                            Change
                          </button>
                        </div>
                        <p className="text-sm font-medium">
                          {selected.customerId ? (
                            selected.customerId.name || selected.customerId.email
                          ) : (
                            <span className="text-muted-foreground italic text-xs">No customer linked</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-xl border border-white/[0.04] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                        <Edit3 className="w-4 h-4 text-yellow-400" />
                        Internal Notes
                      </h4>
                      <button
                        onClick={() => addNote(selected._id)}
                        className="text-[10px] px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 font-medium"
                      >
                        + Add Note
                      </button>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] scrollbar-thin pr-2">
                      {selected.internalNotes && selected.internalNotes.length > 0 ? (
                        selected.internalNotes.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-xs text-foreground/90 leading-relaxed mb-1.5">{item.note}</p>
                            <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                              <span>{item.addedBy ? item.addedBy.name || item.addedBy.email : "System / Direct"}</span>
                              <span>
                                {new Date(item.addedAt).toLocaleString(undefined, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center p-4">
                          <p className="text-xs text-muted-foreground italic text-center">
                            No internal notes added yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 relative">
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-lg relative z-10">
                <BarChart3 className="w-8 h-8 text-cyan-400/50" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-foreground/90 mb-1">Select a Complaint</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose any complaint from the list to view details and take action.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {actionModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/[0.1] rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-foreground">{actionModal.title}</h3>

              {actionModal.message && (
                <p className="text-sm text-muted-foreground bg-white/[0.02] p-3 rounded-lg border border-white/[0.05]">
                  {actionModal.message}
                </p>
              )}

              {actionModal.type !== "delete" && actionModal.type !== "error" && (
                <div className="space-y-3">
                  {actionModal.placeholder1 && (
                    <input
                      type="text"
                      placeholder={actionModal.placeholder1}
                      value={actionModal.input1 || ""}
                      onChange={(e) =>
                        setActionModal((prev) => ({ ...prev, input1: e.target.value }))
                      }
                      className="w-full bg-white/[0.02] border border-white/[0.1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                    />
                  )}

                  {actionModal.placeholder2 && (
                    <input
                      type="text"
                      placeholder={actionModal.placeholder2}
                      value={actionModal.input2 || ""}
                      onChange={(e) =>
                        setActionModal((prev) => ({ ...prev, input2: e.target.value }))
                      }
                      className="w-full bg-white/[0.02] border border-white/[0.1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-xs rounded-lg border border-white/[0.1] hover:bg-white/[0.05]"
                >
                  {actionModal.type === "error" ? "Close" : "Cancel"}
                </button>

                {actionModal.type !== "error" && (
                  <button
                    onClick={handleModalSubmit}
                    disabled={actionModal.loading}
                    className={`px-4 py-2 text-xs rounded-lg font-semibold flex items-center gap-2 ${
                      actionModal.type === "delete"
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                        : "bg-cyan-400 text-black hover:opacity-90"
                    }`}
                  >
                    {actionModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {actionModal.type === "delete" ? "Confirm Archive" : "Submit"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {replyModalOpen && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#0a0a0a] border border-white/[0.1] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                 <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-400"/> AI Reply Generator</h3>
                 <div className="flex gap-2 mb-2">
                    {['Formal', 'Empathetic', 'Apologetic'].map(tone => (
                       <button 
                          key={tone} 
                          onClick={() => setSelectedTone(tone)} 
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedTone === tone ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 font-bold' : 'bg-white/[0.02] border-white/[0.05] text-muted-foreground hover:bg-white/[0.05]'}`}
                       >
                          {tone}
                       </button>
                    ))}
                 </div>
                 
                 <div className="relative">
                    {replyGenerating && <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center rounded-lg z-10"><Loader2 className="w-6 h-6 animate-spin text-blue-400"/></div>}
                    <textarea 
                       value={generatedReply} 
                       onChange={e => setGeneratedReply(e.target.value)} 
                       rows={6} 
                       className="w-full bg-white/[0.02] border border-white/[0.1] rounded-lg p-3 text-sm focus:outline-none focus:border-blue-400 leading-relaxed text-foreground shadow-inner" 
                       placeholder="Click generate to create a reply..."
                    />
                 </div>
                 
                 <div className="flex justify-between items-center pt-2">
                    <button 
                       onClick={() => generateReply(selected._id)} 
                       disabled={replyGenerating}
                       className="text-xs px-3 py-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] flex items-center gap-1.5 border border-transparent font-medium disabled:opacity-50"
                    >
                       <RefreshCw className={`w-3.5 h-3.5 ${replyGenerating ? 'animate-spin' : ''}`}/> Regenerate
                    </button>
                    <div className="flex gap-2">
                       <button onClick={() => { navigator.clipboard.writeText(generatedReply); toast.success('Copied!'); }} disabled={!generatedReply} className="px-3 py-1.5 text-xs rounded border border-white/[0.1] hover:bg-white/[0.05] disabled:opacity-50 font-medium">Copy Reply</button>
                       <button onClick={() => appendAiNote(selected._id, "AI Public Reply Draft:\n" + generatedReply)} disabled={!generatedReply} className="px-3 py-1.5 text-xs rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 font-bold">Post as Note</button>
                       <button onClick={() => setReplyModalOpen(false)} className="px-4 py-1.5 text-xs rounded border border-white/[0.1] hover:bg-white/[0.05] font-medium">Close</button>
                    </div>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}