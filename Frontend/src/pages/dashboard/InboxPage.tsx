import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Mail, Phone, Smartphone,
  Sparkles, Send, Smile, Paperclip, Loader2, AlertCircle, Users, CheckCircle, Zap, RefreshCw, Bot
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const BASE = import.meta.env.VITE_API_URL;
const AGENT_BASE    = import.meta.env.VITE_AGENT_URL + "/agent";
const WA_AGENT_BASE = import.meta.env.VITE_WA_AGENT_URL + "/wa-agent";
const OMNI_BASE     = import.meta.env.VITE_OMNI_AGENT_URL + "/omni-agent";

interface InboxItem {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  lastMessage: string;
  timestamp: string;
  channels: Set<'whatsapp' | 'email'>;
  unread: boolean;
}

interface TimelineMessage {
  id: string;
  type: 'whatsapp' | 'email';
  subject?: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  timestamp: string;
  aiReply?: string;
}

interface AgentEmail {
  _id: string;
  subject: string;
  body: string;
  fromEmail: string;
  emailDate: string;
  status: string;
  customerId: { _id: string; name: string; email: string; phone?: string };
  suggestedReply: string;
  threadHistory?: any[];
}

const aiSuggestions = [
  "Your order has been processed successfully.",
  "Is there anything else I can help you with today?",
];

function initials(name: string) {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function InboxPage() {
  const { user } = useAuth();
  const employerId = user?._id || (user as any)?.id;

  // modes
  const [inboxMode, setInboxMode] = useState<'omni' | 'agent'>('omni');
  const [search, setSearch] = useState("");

  // OMNI INBOX STATE
  const [inboxMap, setInboxMap] = useState<Map<string, InboxItem>>(new Map());
  const [inboxLoading, setInboxLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineMessage[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [waError, setWaError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [omniGenerating, setOmniGenerating] = useState(false);

  // EMAIL AGENT MODAL STATE
  const [emailAgentOpen, setEmailAgentOpen] = useState(false);
  const [emailAgentLoading, setEmailAgentLoading] = useState(false);
  const [emailAgentSuggestion, setEmailAgentSuggestion] = useState("");
  const [emailAgentContext, setEmailAgentContext] = useState<any[]>([]);
  const [emailAgentId, setEmailAgentId] = useState("");
  const [emailAgentRegenerating, setEmailAgentRegenerating] = useState(false);
  const [emailAgentSending, setEmailAgentSending] = useState(false);
  const [emailAgentContextOpen, setEmailAgentContextOpen] = useState(false);

  // AGENT INBOX STATE
  const [agentEmails, setAgentEmails] = useState<AgentEmail[]>([]);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState("");
  const [activeAgentEmail, setActiveAgentEmail] = useState<AgentEmail | null>(null);
  const [agentHistory, setAgentHistory] = useState<TimelineMessage[]>([]);
  const [agentHistoryLoading, setAgentHistoryLoading] = useState(false);
  const [editReplyText, setEditReplyText] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [sendingAgent, setSendingAgent] = useState(false);
  const [autoReplyingAll, setAutoReplyingAll] = useState(false);

  // WA AGENT PANEL STATE
  const [waAgentOpen, setWaAgentOpen] = useState(false);
  const [waAgentLoading, setWaAgentLoading] = useState(false);
  const [waAgentSuggestion, setWaAgentSuggestion] = useState("");
  const [waAgentRegenerating, setWaAgentRegenerating] = useState(false);
  const [waAgentSending, setWaAgentSending] = useState(false);

  // OMNI AGENT MODAL STATE
  const [omniModalOpen, setOmniModalOpen] = useState(false);
  const [omniLoading, setOmniLoading] = useState(false);
  const [omniReport, setOmniReport] = useState<any>(null);
  const [omniDrafting, setOmniDrafting] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // 1. OMNI INBOX LOGIC
  // ==========================================
  const fetchOmniInbox = useCallback(async () => {
    if (!employerId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [waRes, emailRes] = await Promise.allSettled([
        axios.get(`${BASE}/webhook/chats?employerId=${employerId}`, { headers }),
        axios.get(`${BASE}/emails?employerId=${employerId}&limit=100`, { headers })
      ]);

      const waChats = waRes.status === 'fulfilled' ? (waRes.value.data.data || []) : [];
      const emails = emailRes.status === 'fulfilled' ? (emailRes.value.data.data || []) : [];

      const newMap = new Map<string, InboxItem>();

      waChats.forEach((chat: any) => {
        if (!chat.customerId) return;
        newMap.set(chat.customerId, {
          customerId: chat.customerId,
          name: chat.customerName || "Unknown",
          email: chat.customerEmail || "",
          phone: chat.customerPhone || "",
          lastMessage: chat.lastMessage || "",
          timestamp: chat.lastMessageTime || new Date().toISOString(),
          channels: new Set(['whatsapp']),
          unread: chat.unreadCount > 0
        });
      });

      emails.forEach((em: any) => {
        if (!em.customerId?._id) return;
        const cid = em.customerId._id;
        const existing = newMap.get(cid);
        const emTime = new Date(em.emailDate || em.createdAt).getTime();
        const exTime = existing ? new Date(existing.timestamp).getTime() : 0;
        const unread = em.status === 'received';

        if (existing) {
          existing.channels.add('email');
          if (emTime > exTime) {
            existing.lastMessage = em.subject || em.body || "Email received";
            existing.timestamp = em.emailDate || em.createdAt;
          }
          if (unread) existing.unread = true;
        } else {
          newMap.set(cid, {
            customerId: cid,
            name: em.customerId.name || "Unknown",
            email: em.customerId.email || "",
            phone: em.customerId.phone || "",
            lastMessage: em.subject || em.body || "Email received",
            timestamp: em.emailDate || em.createdAt || new Date().toISOString(),
            channels: new Set(['email']),
            unread
          });
        }
      });

      setInboxMap(prev => {
        if (prev.size !== newMap.size) return newMap;
        let changed = false;
        for (const [k, v] of newMap.entries()) {
          const old = prev.get(k);
          if (!old || old.timestamp !== v.timestamp || old.unread !== v.unread) {
            changed = true;
            break;
          }
        }
        return changed ? newMap : prev;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setInboxLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    fetchOmniInbox();
    const int = setInterval(fetchOmniInbox, 30000);
    return () => clearInterval(int);
  }, [fetchOmniInbox]);

  useEffect(() => {
    if (!selectedCustomerId) {
       setCustomerProfile(null);
       return;
    }
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE}/customers/${selectedCustomerId}`, { headers: { Authorization: `Bearer ${token}` } });
        setCustomerProfile(res.data.data);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [selectedCustomerId]);

  const fetchOmniTimeline = useCallback(async () => {
    if (!selectedCustomerId || !employerId) return;
    
    setTimelineLoading(prev => timeline.length === 0 ? true : false);
    
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [waRes, emailRes] = await Promise.allSettled([
        axios.get(`${BASE}/webhook/chats/${selectedCustomerId}?employerId=${employerId}`, { headers }),
        axios.get(`${BASE}/emails/customer/${selectedCustomerId}`, { headers })
      ]);

      let waMessages = [];
      let emailMessages = [];

      if (waRes.status === 'fulfilled') {
        waMessages = waRes.value.data.data || [];
        setWaError(false);
      } else { setWaError(true); }

      if (emailRes.status === 'fulfilled') {
        emailMessages = emailRes.value.data.data || [];
        setEmailError(false);
      } else { setEmailError(true); }

      const formattedWa: TimelineMessage[] = waMessages.map((m: any) => ({
        id: m._id || m.id,
        type: 'whatsapp',
        body: m.body,
        status: m.status,
        direction: m.direction || 'inbound',
        timestamp: m.whatsappTimestamp || m.createdAt || new Date().toISOString(),
      }));

      const formattedEmail: TimelineMessage[] = emailMessages.map((m: any) => ({
        id: m._id || m.id,
        type: 'email',
        subject: m.subject,
        body: m.body || m.rawBody,
        status: m.status,
        direction: m.direction || 'inbound',
        timestamp: m.emailDate || m.createdAt || new Date().toISOString(),
        aiReply: m.aiReply,
      }));

      const merged = [...formattedWa, ...formattedEmail].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setTimeline(prev => {
        if (prev.length !== merged.length) return merged;
        const lastP = prev[prev.length - 1];
        const lastM = merged[merged.length - 1];
        if (lastP?.timestamp !== lastM?.timestamp || lastP?.status !== lastM?.status) return merged;
        return prev;
      });

    } catch (err: any) {
      console.error(err);
    } finally {
      setTimelineLoading(false);
    }
  }, [selectedCustomerId, employerId, timeline.length]);

  useEffect(() => {
    if (inboxMode !== 'omni') return;
    fetchOmniTimeline();
    const int = setInterval(fetchOmniTimeline, 15000);
    return () => clearInterval(int);
  }, [fetchOmniTimeline, inboxMode]);

  const handleUpdateEmailStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${BASE}/emails/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Marked as ${status}`);
      fetchOmniTimeline();
    } catch(err: any) {
      toast.error("Status update failed");
    }
  };

  const handleOmniGenerate = async () => {
    if (timeline.length === 0) return;
    setOmniGenerating(true);
    try {
      const historyStr = timeline.slice(-12).map(m => `[${m.type.toUpperCase()}] ${m.direction === 'inbound' ? 'Customer' : 'Bank Support'}: ${m.body}`).join('\n');
      const res = await axios.post(`${AGENT_BASE}/generate-omni`, { history: historyStr });
      if (res.data.suggestion) {
        setMessageText(res.data.suggestion);
        toast.success("AI draft ready for review!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate AI response.");
    } finally {
      setOmniGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !customerProfile || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (filter === 'email') {
        const latestInboundEmail = timeline.slice().reverse().find(m => m.type === 'email' && m.direction === 'inbound');
        if (!latestInboundEmail) throw new Error("No inbound email to reply to");
        
        await axios.post(`${BASE}/emails/${latestInboundEmail.id}/reply`, { body: messageText }, { headers });
      } else {
        const to = customerProfile.channel_ids?.whatsapp || customerProfile.phone || customerProfile.channel_ids?.social_id;
        if (!to) throw new Error("No WhatsApp ID found");

        await axios.post(
          `${BASE}/webhook/messages/send-direct`, 
          { to, message: messageText },
          { headers }
        );
      }

      const newMsg: TimelineMessage = {
        id: Math.random().toString(),
        type: filter === 'email' ? 'email' : 'whatsapp',
        body: messageText.trim(),
        direction: 'outbound',
        status: 'sending',
        timestamp: new Date().toISOString(),
      };
      
      setTimeline(prev => [...prev, newMsg]);
      setMessageText("");

      setTimeout(() => {
        if (endOfMessagesRef.current) endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        fetchOmniTimeline();
      }, 2000);

    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Message delivery failed");
    } finally {
      setSending(false);
    }
  };

  const handleOpenEmailAgent = async () => {
    const emails = timeline.filter(m => m.type === 'email');
    const inboundEmails = emails.filter(m => m.direction === 'inbound').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (inboundEmails.length === 0) {
      toast.error("No inbound emails found for this customer");
      return;
    }

    const latest = inboundEmails[0];
    setEmailAgentId(latest.id);
    setEmailAgentContext(emails.slice(-3));
    setEmailAgentOpen(true);
    setEmailAgentLoading(true);

    try {
      const res = await axios.post(`${AGENT_BASE}/emails/suggest`, { emailId: latest.id });
      setEmailAgentSuggestion(res.data.suggestion);
    } catch (err: any) {
      setEmailAgentOpen(false);
      toast.error("Email Agent is offline. Make sure it's running on port 5001.");
    } finally {
      setEmailAgentLoading(false);
    }
  };

  const handleEmailAgentRegenerate = async () => {
    setEmailAgentRegenerating(true);
    try {
      const res = await axios.post(`${AGENT_BASE}/emails/suggest`, { emailId: emailAgentId });
      setEmailAgentSuggestion(res.data.suggestion);
    } catch (err) {
      toast.error("Failed to regenerate");
    } finally {
      setEmailAgentRegenerating(false);
    }
  };

  const handleEmailAgentSend = async () => {
    if (!emailAgentSuggestion.trim()) return;
    setEmailAgentSending(true);
    try {
      await axios.post(`${AGENT_BASE}/emails/${emailAgentId}/send-reply`, { body: emailAgentSuggestion });
      toast.success("Reply sent successfully!");
      setEmailAgentOpen(false);
      fetchOmniTimeline();
    } catch (err) {
      toast.error("Failed to send reply");
    } finally {
      setEmailAgentSending(false);
    }
  };

  const handleEmailAgentAutoReplyAll = async () => {
    if (!window.confirm("AI will auto-reply to ALL unreplied emails. Continue?")) return;
    try {
      await axios.post(`${AGENT_BASE}/emails/auto-reply-all`);
      toast.success("Auto-replied to all emails!");
      setEmailAgentOpen(false);
      fetchOmniTimeline();
    } catch (err) {
      toast.error("Failed to auto-reply all");
    }
  };

  const handleOpenWaAgent = async () => {
    setWaAgentOpen(true);
    setWaAgentLoading(true);
    try {
      const res = await axios.get(`${WA_AGENT_BASE}/chats`);
      const chat = res.data?.data?.find((c: any) => c.customerId === selectedCustomerId);
      if (chat && chat.suggestedReply) {
        setWaAgentSuggestion(chat.suggestedReply);
      } else {
        const suggestRes = await axios.post(`${WA_AGENT_BASE}/chats/suggest`, { customerId: selectedCustomerId });
        setWaAgentSuggestion(suggestRes.data.suggestion);
      }
    } catch (err: any) {
      toast.error("Failed to load WA Agent context");
      setWaAgentOpen(false);
    } finally {
      setWaAgentLoading(false);
    }
  };

  const handleWaAgentRegenerate = async () => {
    setWaAgentRegenerating(true);
    try {
      const res = await axios.post(`${WA_AGENT_BASE}/chats/suggest`, { customerId: selectedCustomerId });
      setWaAgentSuggestion(res.data.suggestion);
    } catch (err) {
      toast.error("Failed to regenerate");
    } finally {
      setWaAgentRegenerating(false);
    }
  };

  const handleWaAgentSend = async () => {
    if (!waAgentSuggestion?.trim()) return;
    setWaAgentSending(true);
    try {
      await axios.post(`${WA_AGENT_BASE}/chats/${selectedCustomerId}/send-reply`, { message: waAgentSuggestion });
      toast.success("WhatsApp reply sent!");
      setWaAgentOpen(false);
      fetchOmniTimeline();
    } catch (err) {
      toast.error("Failed to send WhatsApp reply");
    } finally {
      setWaAgentSending(false);
    }
  };

  const handleWaAgentAutoReplyAll = async () => {
    if (!window.confirm("AI will reply to all unread WhatsApp chats. Continue?")) return;
    try {
      await axios.post(`${WA_AGENT_BASE}/chats/auto-reply-all`);
      toast.success("Auto-replied to all WhatsApp chats!");
      setWaAgentOpen(false);
      fetchOmniTimeline();
    } catch (err) {
      toast.error("Failed to auto-reply all WhatsApp chats");
    }
  };

  const handleOpenOmniIntelligence = async () => {
    setOmniModalOpen(true);
    setOmniLoading(true);
    try {
      const res = await axios.post(`${OMNI_BASE}/summary/${selectedCustomerId}`);
      setOmniReport(res.data.data || res.data);
    } catch (err) {
      toast.error("Failed to load Omni Intelligence Report");
      setOmniModalOpen(false);
    } finally {
      setOmniLoading(false);
    }
  };

  const handleOmniDraftWa = async () => {
    setOmniDrafting(true);
    try {
      const res = await axios.post(`${OMNI_BASE}/suggest`, { customerId: selectedCustomerId, channel: "whatsapp" });
      setOmniModalOpen(false);
      setMessageText(res.data.suggestion);
      setFilter('whatsapp');
      toast.success("Omni AI draft ready!");
    } catch (err) {
      toast.error("Failed to draft via Omni AI");
    } finally {
      setOmniDrafting(false);
    }
  };

  const handleOmniDraftEmail = async () => {
    setOmniDrafting(true);
    try {
      const res = await axios.post(`${OMNI_BASE}/suggest`, { customerId: selectedCustomerId, channel: "email" });
      setOmniModalOpen(false);
      setEmailAgentSuggestion(res.data.suggestion);
      setEmailAgentOpen(true);
      toast.success("Omni AI draft ready!");
    } catch (err) {
      toast.error("Failed to draft via Omni AI");
    } finally {
      setOmniDrafting(false);
    }
  };

  const handleAutodraftOption = async (option: 'email' | 'wa' | 'omni') => {
    if (timeline.length === 0) return;
    setOmniGenerating(true);
    try {
      if (option === 'email') {
        const historyStr = timeline.slice(-12).map(m => `[${m.type.toUpperCase()}] ${m.direction === 'inbound' ? 'Customer' : 'Bank Support'}: ${m.body}`).join('\n');
        const res = await axios.post(`${AGENT_BASE}/generate-omni`, { history: historyStr });
        if (res.data.suggestion) setMessageText(res.data.suggestion);
      } else if (option === 'wa') {
        const res = await axios.post(`${WA_AGENT_BASE}/chats/suggest`, { customerId: selectedCustomerId });
        if (res.data.suggestion) setMessageText(res.data.suggestion);
      } else if (option === 'omni') {
        const targetChannel = filter === 'email' ? 'email' : 'whatsapp';
        const res = await axios.post(`${OMNI_BASE}/suggest`, { customerId: selectedCustomerId, channel: targetChannel });
        if (res.data.suggestion) setMessageText(res.data.suggestion);
      }
      toast.success(`${option.toUpperCase()} AI draft ready for review!`);
    } catch (err: any) {
      toast.error(`Failed to generate ${option} response.`);
    } finally {
       setOmniGenerating(false);
    }
  };


  // ==========================================
  // 2. AI AGENT LOGIC
  // ==========================================

  const fetchAgentEmails = useCallback(async () => {
    try {
       const res = await axios.get(`${AGENT_BASE}/emails`);
       const newEmails = res.data?.data || res.data || [];
       
       setAgentEmails(prev => {
         if (newEmails.length > prev.length && prev.length > 0) {
           toast.success(`${newEmails.length - prev.length} new unreplied emails!`);
         }
         return newEmails;
       });
       setAgentError("");
    } catch(err: any) {
       console.error("Agent fetch error:", err);
       setAgentError("Failed to load agent emails");
    } finally {
       setAgentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (inboxMode !== 'agent') return;
    setAgentLoading(true);
    fetchAgentEmails();
    const int = setInterval(fetchAgentEmails, 30000);
    return () => clearInterval(int);
  }, [inboxMode, fetchAgentEmails]);

  // When activeAgentEmail changes, fetch history and populate text area
  useEffect(() => {
     if (inboxMode !== 'agent' || !activeAgentEmail) return;
     
     setEditReplyText(activeAgentEmail.suggestedReply || "");
     setAgentHistoryLoading(true);

     const fetchHistory = async () => {
       try {
         const res = await axios.get(`${AGENT_BASE}/emails/${activeAgentEmail.customerId._id}/history`);
         const historyRaw = res.data?.data || res.data || [];
         const formatted: TimelineMessage[] = historyRaw.map((m: any) => ({
            id: m._id || m.id,
            type: 'email',
            subject: m.subject,
            body: m.body || m.rawBody,
            direction: m.direction || 'inbound',
            status: m.status,
            timestamp: m.emailDate || m.createdAt || new Date().toISOString()
         })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

         setAgentHistory(formatted);
       } catch (err) {
         console.error("Failed to load agent history");
         toast.error("Failed to load email history context");
       } finally {
         setAgentHistoryLoading(false);
       }
     };
     fetchHistory();
  }, [activeAgentEmail, inboxMode]);

  const handleAgentRegenerate = async () => {
    if (!activeAgentEmail) return;
    setRegenerating(true);
    try {
       const res = await axios.post(`${AGENT_BASE}/emails/suggest`, {
          emailId: activeAgentEmail._id
       });
       setEditReplyText(res.data.suggestion || res.data.data?.suggestion || "");
       toast.success("AI generated a new response");
    } catch (err) {
       toast.error("Failed to regenerate response");
    } finally {
       setRegenerating(false);
    }
  };

  const handleAgentSend = async () => {
    if (!activeAgentEmail || !editReplyText.trim()) return;
    setSendingAgent(true);
    try {
       await axios.post(`${AGENT_BASE}/emails/${activeAgentEmail._id}/send-reply`, {
          body: editReplyText
       });
       toast.success("Sent!");
       setActiveAgentEmail(null);
       fetchAgentEmails();
    } catch (err) {
       toast.error("Failed to send reply");
    } finally {
       setSendingAgent(false);
    }
  };

  const handleAutoReplyAll = async () => {
    if (agentEmails.length === 0) return;
    if (!window.confirm(`Auto-reply to all ${agentEmails.length} unreplied emails? The AI will instantly dispatch responses without manual review.`)) return;
    
    setAutoReplyingAll(true);
    toast("Auto-repliers engaged. Dispatched to background queue...");
    try {
       await axios.post(`${AGENT_BASE}/emails/auto-reply-all`);
       toast.success(`Successfully auto-replied to all ${agentEmails.length} emails!`);
       setActiveAgentEmail(null);
       fetchAgentEmails();
    } catch (err) {
       toast.error("Failed to process auto-reply all");
    } finally {
       setAutoReplyingAll(false);
    }
  };

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [timeline, agentHistory]);

  const filteredTimeline = timeline.filter(msg => filter === 'all' || msg.type === filter);
  const inboxArray = Array.from(inboxMap.values())
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const filteredAgentEmails = agentEmails.filter(e => 
    e.subject?.toLowerCase().includes(search.toLowerCase()) || 
    e.customerId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden custom-scrollbar">
      {/* ── UNIFIED SIDEBAR ── */}
      <div className="w-80 border-r border-white/[0.06] flex flex-col shrink-0 bg-background z-10">
        
        {/* Toggle Head */}
        <div className="p-4 border-b border-white/[0.06] flex flex-col gap-4">
          <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
             <button 
                onClick={() => { setInboxMode('omni'); setActiveAgentEmail(null); setSelectedCustomerId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${inboxMode === 'omni' ? 'bg-white/[0.08] text-foreground shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/[0.02]'}`}
             >
                <Users className="w-3.5 h-3.5" /> Omni Inbox
             </button>
             <button 
                onClick={() => { setInboxMode('agent'); setActiveAgentEmail(null); setSelectedCustomerId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${inboxMode === 'agent' ? 'bg-indigo-500/20 text-indigo-100 shadow-sm border border-indigo-500/30' : 'text-muted-foreground hover:text-white hover:bg-white/[0.02]'}`}
             >
                <Bot className="w-3.5 h-3.5" /> AI Agent
             </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors"
              placeholder={`Search ${inboxMode === 'omni' ? 'customers' : 'emails'}…`}
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          {inboxMode === 'omni' ? (
             <>
                {inboxLoading && (
                  <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
                    <span className="text-xs">Loading…</span>
                  </div>
                )}
                {!inboxLoading && inboxArray.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-center text-muted-foreground">
                    <Users className="w-6 h-6 opacity-30" />
                    <p className="text-xs">No active conversations</p>
                  </div>
                )}
                {!inboxLoading && inboxArray.map((c, i) => (
                  <motion.button
                    key={c.customerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedCustomerId(c.customerId)}
                    className={`w-full text-left p-4 border-b border-white/[0.04] transition-colors relative ${
                      selectedCustomerId === c.customerId ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {selectedCustomerId === c.customerId && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-cyan" />
                    )}
                    {c.unread && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center shrink-0 text-xs font-bold border border-white/[0.05]">
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm truncate ${c.unread ? 'text-white' : 'text-foreground/90'}`}>{c.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1 font-mono">{timeAgo(c.timestamp)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate my-0.5">{c.lastMessage}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {c.channels.has('whatsapp') && <MessageSquare className="w-3 h-3 text-green-400 opacity-80" />}
                          {c.channels.has('email') && <Mail className="w-3 h-3 text-blue-400 opacity-80" />}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
             </>
          ) : (
             <>
                {/* Global Actions inside Agent mode */}
                {agentEmails.length > 0 && (
                   <div className="p-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-indigo-500/[0.02]">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1"><Bot className="w-4 h-4"/> AI Queue ({agentEmails.length})</span>
                      <button 
                        onClick={handleAutoReplyAll}
                        disabled={autoReplyingAll || agentEmails.length === 0}
                        className="px-3 py-1.5 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-bold uppercase tracking-wider hover:bg-green-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                         {autoReplyingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                         Auto Reply All
                      </button>
                   </div>
                )}
                {agentLoading && agentEmails.length === 0 && (
                  <div className="flex items-center justify-center h-32 gap-2 text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-bold">Scanning Gmail...</span>
                  </div>
                )}
                {agentError && !agentLoading && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
                    <AlertCircle className="w-6 h-6 text-red-400/70" />
                    <p className="text-xs text-muted-foreground">{agentError}</p>
                    <button onClick={fetchAgentEmails} className="text-xs text-indigo-400 hover:underline">Retry</button>
                  </div>
                )}
                {!agentLoading && filteredAgentEmails.length === 0 && !agentError && (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full border border-white/[0.05] flex items-center justify-center bg-white/[0.02]">
                       <CheckCircle className="w-6 h-6 text-green-500/50" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground/80">Inbox Zero</p>
                      <p className="text-xs mt-0.5">No unreplied emails</p>
                    </div>
                  </div>
                )}
                {!agentLoading && filteredAgentEmails.map((e, i) => (
                  <motion.button
                    key={e._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveAgentEmail(e)}
                    className={`w-full text-left p-4 border-b border-white/[0.04] transition-colors relative ${
                      activeAgentEmail?._id === e._id ? "bg-indigo-500/[0.05]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {activeAgentEmail?._id === e._id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 text-xs font-bold border border-indigo-500/20 text-indigo-300">
                        {initials(e.customerId?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-sm truncate text-white">{e.customerId?.name || "Unknown Sender"}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0 ml-1 font-mono uppercase bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                            Unreplied
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-foreground/80 truncate">{e.subject}</div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">{timeAgo(e.emailDate)}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
             </>
          )}
        </div>
      </div>

      {/* ── ACTIVE VIEW AREA ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* === RENDER OMNI MODE === */}
        {inboxMode === 'omni' && selectedCustomerId && customerProfile ? (
          <>
            {/* L1: Omni Static Profile */}
            <div className="w-72 lg:w-80 border-r border-white/[0.06] flex flex-col overflow-y-auto scrollbar-thin bg-background/50">
              <div className="p-8 flex flex-col items-center text-center border-b border-white/[0.06]">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center text-3xl font-bold mb-4 border-2 border-white/[0.08] shadow-[0_0_15px_rgba(0,255,255,0.05)]">
                  {initials(customerProfile.name)}
                </div>
                <h2 className="text-lg font-bold tracking-tight">{customerProfile.name}</h2>
                <div className="flex items-center gap-2 mt-3">
                   {customerProfile.channel_ids?.whatsapp && <span className="p-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm" title="WhatsApp Active"><MessageSquare className="w-4 h-4" /></span>}
                   {customerProfile.email && <span className="p-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm" title="Email Active"><Mail className="w-4 h-4" /></span>}
                </div>
                {customerProfile.email && (
                  <button onClick={handleOpenEmailAgent} className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider hover:bg-indigo-500/10 transition-colors mb-2">
                    <Bot className="w-3.5 h-3.5" /> Run Email Agent
                  </button>
                )}
                <button onClick={handleOpenOmniIntelligence} className={`${!customerProfile.email ? 'mt-4' : ''} w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all`}>
                  <Zap className="w-3.5 h-3.5" /> Omni Intelligence
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                <div className="p-4 rounded-xl bg-gradient-to-br from-neon-cyan/[0.05] to-neon-purple/[0.02] border border-neon-cyan/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                     <Sparkles className="w-4 h-4 text-neon-cyan shrink-0" />
                     <span className="text-xs font-bold text-neon-cyan uppercase tracking-widest">AI Summary</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     <strong className="text-foreground/80">{customerProfile.name}</strong> — joined{" "}
                     {new Date(customerProfile.createdAt).toLocaleDateString()}.{" "}
                     {customerProfile.channel_ids?.whatsapp
                       ? "Active heavily on WhatsApp."
                       : customerProfile.phone
                       ? "Reachable by phone calls."
                       : "Prefers contact via email."}
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/[0.04] pb-2">Contact Details</h3>
                  <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-neon-cyan shrink-0" /><span className="truncate text-foreground/80">{customerProfile.email}</span></div>
                  {customerProfile.phone && <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-neon-purple shrink-0" /><span className="text-foreground/80">{customerProfile.phone}</span></div>}
                </div>
              </div>
            </div>

            {/* R1: Omni Unified Timeline */}
             <div className="flex-1 flex flex-col bg-grid-white/[0.01] bg-[size:32px_32px] relative overflow-hidden">
               <div className="h-16 px-6 border-b border-white/[0.06] bg-background/50 backdrop-blur-md flex items-center justify-between shrink-0">
                 <h2 className="font-semibold text-foreground/90 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 text-neon-purple" /> Timeline Engine
                 </h2>
                 <div className="flex items-center gap-3">
                   {customerProfile.email && filter === 'email' && (
                     <button onClick={handleOpenEmailAgent} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all">
                       <Sparkles className="w-3 h-3" /> Email Agent
                     </button>
                   )}
                   {filter === 'whatsapp' && (
                     <button onClick={handleOpenWaAgent} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all">
                       <MessageSquare className="w-3 h-3" /> WA Agent
                     </button>
                   )}
                   <div className="flex bg-white/[0.02] rounded-lg p-1 border border-white/[0.06]">
                     {['all', 'whatsapp', 'email'].map(f => (
                       <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 text-[11px] font-bold tracking-wide uppercase rounded-md transition-all ${filter === f ? 'bg-white/[0.1] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}>
                         {f}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col space-y-6">
                 {(waError || emailError) && (
                   <div className="p-3 mb-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" /> 
                      {waError && emailError ? "All communication channels are currently offline." : waError ? "WhatsApp channel sync failed. Showing email logs only." : "Email sync failed. Showing WhatsApp logs only."}
                   </div>
                 )}
                 {timelineLoading && timeline.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-neon-cyan" /></div>
                 ) : filteredTimeline.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground"><MessageSquare className="w-8 h-8 opacity-40" /><p className="text-sm font-medium">No messages yet on this filter.</p></div>
                 ) : (
                   filteredTimeline.map((msg, i) => (
                     <motion.div key={msg.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
                       className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                     >
                       <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm flex flex-col gap-1.5 shadow-md border ${
                         msg.direction === 'outbound' ? "bg-gradient-to-br from-neon-purple/10 to-neon-cyan/5 border-neon-cyan/20 rounded-tr-sm" : msg.type === 'whatsapp' ? "bg-green-500/10 border-green-500/20 rounded-tl-sm" : "bg-blue-500/10 border-blue-500/20 rounded-tl-sm"
                       }`}>
                         <div className="flex items-center gap-4 mb-2 justify-between">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase opacity-90">
                             {msg.type === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-green-400" /> : <Mail className="w-3.5 h-3.5 text-blue-400" />}
                             <span className={msg.type === 'whatsapp' ? 'text-green-400' : 'text-blue-400'}>{msg.type}</span>
                           </div>
                           <span className="text-[10px] opacity-50 text-foreground font-mono">{new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                         </div>
                         {msg.type === 'email' && msg.subject && <h4 className="font-bold text-foreground/90 text-xs mb-2 border-b border-white/[0.05] pb-2 leading-relaxed tracking-wide">Subject: <span className="opacity-80 font-medium">{msg.subject}</span></h4>}
                         <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium">{msg.body}</div>
                         {msg.type === 'email' && msg.direction === 'inbound' && !['resolved', 'closed'].includes(msg.status) && (
                            <div className="mt-2 flex gap-2 pt-2 border-t border-white/[0.06]">
                               <button onClick={() => handleUpdateEmailStatus(msg.id, 'resolved')} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-400 hover:text-green-300 transition-colors"><CheckCircle className="w-3 h-3" /> Mark Resolved</button>
                               <button onClick={() => handleUpdateEmailStatus(msg.id, 'closed')} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-white transition-colors">Mark Closed</button>
                            </div>
                         )}
                         {msg.aiReply && msg.type === 'email' && (
                           <div className="mt-3 pt-3 border-t border-neon-cyan/10 bg-neon-cyan/5 -mx-5 px-5 -mb-4 pb-4 rounded-b-xl flex flex-col gap-1.5">
                             <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neon-cyan font-bold"><Sparkles className="w-3.5 h-3.5" /> AI Reply:</div>
                             <p className="text-xs text-foreground/80 italic leading-relaxed">{msg.aiReply}</p>
                           </div>
                         )}
                       </div>
                     </motion.div>
                   ))
                 )}
                 <div ref={endOfMessagesRef} className="h-1 shrink-0" />
               </div>

               <div className="bg-background border-t border-white/[0.06] shrink-0 sticky bottom-0 z-20">
                 <div className="px-6 py-4 bg-white/[0.01]">
                   <div className="flex items-center gap-3">
                     <button className="p-2.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-all"><Paperclip className="w-5 h-5" /></button>
                     <input value={messageText} onChange={e => setMessageText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }} className="flex-1 bg-white/[0.03] border border-white/[0.08] shadow-inner rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-neon-cyan/50 focus:bg-white/[0.05] transition-all" placeholder={filter === 'email' ? `Reply via Email to ${customerProfile.name}…` : `Message ${customerProfile.name} via WhatsApp…`} />
                     <button disabled={sending || !messageText.trim()} onClick={handleSendMessage} className="p-3.5 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple text-background shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/40 transition-all scale-100 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:grayscale">
                       {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                     </button>
                   </div>
                 </div>
               </div>

               {/* === EMAIL AGENT SLIDING PANEL === */}
               <AnimatePresence>
                 {emailAgentOpen && (
                   <motion.div
                     initial={{ y: "100%", opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: "100%", opacity: 0 }}
                     transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="absolute bottom-0 left-0 right-0 z-50 bg-[#1e1b4b]/95 backdrop-blur-xl border-t-[3px] border-indigo-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto flex flex-col"
                   >
                     {/* Header */}
                     <div className="flex items-center justify-between p-5 border-b border-indigo-500/20 shrink-0">
                       <div className="flex items-center gap-2">
                         <Sparkles className="w-5 h-5 text-indigo-400" />
                         <span className="font-bold text-sm text-indigo-100 uppercase tracking-widest">AI Email Agent</span>
                       </div>
                       <button onClick={() => setEmailAgentOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-indigo-200 transition-colors">
                         <span className="text-xl leading-none">&times;</span>
                       </button>
                     </div>

                     <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
                       {/* Context Section */}
                       <div className="mb-4">
                         <button onClick={() => setEmailAgentContextOpen(!emailAgentContextOpen)} className="text-[10px] font-bold text-indigo-300 hover:text-indigo-200 uppercase tracking-wider mb-2 flex items-center gap-1 transition-colors">
                           {emailAgentContextOpen ? '▼ Hide Context' : '▶ View Context'}
                         </button>
                         {emailAgentContextOpen && (
                           <div className="p-3 bg-black/40 rounded-lg border border-indigo-500/20 space-y-3 mb-2 max-h-48 overflow-y-auto text-xs shadow-inner">
                             {emailAgentContext.map(m => (
                               <div key={m.id} className={`flex flex-col ${m.direction === 'inbound' ? 'text-indigo-200' : 'text-indigo-100/50'}`}>
                                 <span className="font-bold opacity-80 uppercase tracking-wider text-[9px] mb-0.5">{m.direction === 'inbound' ? 'Customer:' : 'Bank:'}</span>
                                 <span className="truncate whitespace-normal leading-relaxed">{m.body}</span>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>

                       {/* Main Textarea */}
                       <div className="border-l-4 border-indigo-500 pl-4 mb-6 relative">
                         {emailAgentLoading ? (
                           <div className="w-full h-32 bg-indigo-500/10 animate-pulse rounded-xl border border-indigo-500/20" />
                         ) : (
                           <textarea
                             value={emailAgentSuggestion}
                             onChange={e => setEmailAgentSuggestion(e.target.value)}
                             className="w-full bg-black/30 border border-indigo-500/30 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-400 text-indigo-50 min-h-[140px] resize-none leading-relaxed transition-all shadow-inner"
                           />
                         )}
                       </div>

                       {/* Buttons */}
                       <div className="flex flex-wrap items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={handleEmailAgentRegenerate}
                             disabled={emailAgentLoading || emailAgentRegenerating}
                             className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-indigo-500/50 text-indigo-300 font-bold hover:bg-indigo-500/20 transition-all text-[11px] uppercase tracking-wider disabled:opacity-50"
                           >
                             <RefreshCw className={`w-3.5 h-3.5 ${emailAgentRegenerating ? 'animate-spin' : ''}`} />
                             Regenerate
                           </button>
                           <button 
                             onClick={handleEmailAgentSend}
                             disabled={emailAgentLoading || emailAgentRegenerating || emailAgentSending || !emailAgentSuggestion.trim()}
                             className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:grayscale"
                           >
                             {emailAgentSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                             Send Reply
                           </button>
                         </div>
                         
                         <button 
                           onClick={handleEmailAgentAutoReplyAll}
                           disabled={emailAgentSending || emailAgentLoading || emailAgentRegenerating}
                           className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all text-[11px] shadow-[0_0_15px_rgba(34,197,94,0.4)] uppercase tracking-wider disabled:opacity-50"
                         >
                           <Zap className="w-3.5 h-3.5" />
                           Auto Reply All
                         </button>
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* === WA AGENT SLIDING PANEL === */}
               <AnimatePresence>
                 {waAgentOpen && (
                   <motion.div
                     initial={{ y: "100%", opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: "100%", opacity: 0 }}
                     transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="absolute bottom-0 left-0 right-0 z-[60] bg-[#022c22]/95 backdrop-blur-xl border-t-[3px] border-green-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto flex flex-col"
                   >
                     {/* Header */}
                     <div className="flex items-center justify-between p-5 border-b border-green-500/20 shrink-0">
                       <div className="flex items-center gap-2">
                         <MessageSquare className="w-5 h-5 text-green-400" />
                         <span className="font-bold text-sm text-green-100 uppercase tracking-widest">AI WhatsApp Agent</span>
                       </div>
                       <button onClick={() => setWaAgentOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-green-200 transition-colors">
                         <span className="text-xl leading-none">&times;</span>
                       </button>
                     </div>

                     <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
                       {/* Main Textarea */}
                       <div className="border-l-4 border-green-500 pl-4 mb-6 relative">
                         {waAgentLoading ? (
                           <div className="w-full h-32 bg-green-500/10 animate-pulse rounded-xl border border-green-500/20" />
                         ) : (
                           <textarea
                             value={waAgentSuggestion}
                             onChange={e => setWaAgentSuggestion(e.target.value)}
                             className="w-full bg-black/30 border border-green-500/30 rounded-xl p-4 text-sm focus:outline-none focus:border-green-400 text-green-50 min-h-[140px] resize-none leading-relaxed transition-all shadow-inner"
                           />
                         )}
                       </div>

                       {/* Buttons */}
                       <div className="flex flex-wrap items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={handleWaAgentRegenerate}
                             disabled={waAgentLoading || waAgentRegenerating}
                             className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-green-500/50 text-green-300 font-bold hover:bg-green-500/20 transition-all text-[11px] uppercase tracking-wider disabled:opacity-50"
                           >
                             <RefreshCw className={`w-3.5 h-3.5 ${waAgentRegenerating ? 'animate-spin' : ''}`} />
                             Regenerate
                           </button>
                           <button 
                             onClick={handleWaAgentSend}
                             disabled={waAgentLoading || waAgentRegenerating || waAgentSending || !waAgentSuggestion?.trim()}
                             className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold transition-all text-sm shadow-[0_0_15px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:grayscale"
                           >
                             {waAgentSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                             Send Reply
                           </button>
                         </div>
                         
                         <button 
                           onClick={handleWaAgentAutoReplyAll}
                           disabled={waAgentSending || waAgentLoading || waAgentRegenerating}
                           className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.4)] uppercase tracking-wider disabled:opacity-50"
                         >
                           <Zap className="w-3.5 h-3.5" />
                           Auto Reply All
                         </button>
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* === OMNI MODAL OVERLAY === */}
               <AnimatePresence>
                 {omniModalOpen && (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                   >
                     <motion.div
                       initial={{ scale: 0.95, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.95, opacity: 0 }}
                       className="bg-[#1e1b4b] border border-indigo-500/40 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
                     >
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-indigo-500/20">
                           <h3 className="flex items-center gap-2 text-indigo-100 font-bold"><Sparkles className="w-4 h-4 text-purple-400"/> Customer Intelligence Report</h3>
                           <button onClick={() => setOmniModalOpen(false)} className="text-indigo-300 hover:text-white transition-colors" disabled={omniDrafting}><span className="text-xl leading-none">&times;</span></button>
                        </div>
                        <div className="p-6">
                           {omniLoading ? (
                              <div className="flex flex-col items-center justify-center py-8 gap-3 text-indigo-300">
                                 <Loader2 className="w-8 h-8 animate-spin" />
                                 <span className="text-sm font-medium">Generating Report...</span>
                              </div>
                           ) : omniReport ? (
                              <div className="space-y-5">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1 block">Sentiment</span>
                                       <div className={`text-sm font-bold flex items-center gap-1.5 ${
                                         ['angry', 'negative'].includes(omniReport.sentiment?.toLowerCase()) ? 'text-red-400' :
                                         ['positive'].includes(omniReport.sentiment?.toLowerCase()) ? 'text-green-400' : 'text-yellow-400'
                                       }`}>
                                          <Smile className="w-4 h-4"/> {omniReport.sentiment}
                                       </div>
                                    </div>
                                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1 block">Urgency</span>
                                       <div className={`text-sm font-bold flex items-center gap-1.5 ${
                                         omniReport.urgency?.toLowerCase() === 'high' ? 'text-red-400' :
                                         omniReport.urgency?.toLowerCase() === 'low' ? 'text-green-400' : 'text-yellow-400'
                                       }`}>
                                          <Zap className="w-4 h-4"/> {omniReport.urgency}
                                       </div>
                                    </div>
                                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1 block">Resolved Status</span>
                                       <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                          {omniReport.isResolved ? <CheckCircle className="w-4 h-4 text-green-400"/> : <AlertCircle className="w-4 h-4 text-red-400"/>}
                                          {omniReport.isResolved ? 'Resolved' : 'Needs Action'}
                                       </div>
                                    </div>
                                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1 block">Channels</span>
                                       <div className="flex gap-2">
                                          {(omniReport.channelsUsed || []).map((ch: string) => (
                                             <span key={ch} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white/90">{ch}</span>
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1 block">Main Issue</span>
                                    <p className="text-sm font-medium text-indigo-50/90 leading-relaxed">{omniReport.mainIssue || "Unknown"}</p>
                                 </div>
                                 <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
                                    <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold mb-1 block flex items-center gap-1"><Sparkles className="w-3 h-3"/> Recommendation</span>
                                    <p className="text-sm font-medium text-indigo-100 leading-relaxed">{omniReport.recommendation || "N/A"}</p>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center py-6 text-red-400 text-sm">Could not load report.</div>
                           )}
                           
                           <div className="mt-6 flex gap-3">
                              <button onClick={handleOmniDraftWa} disabled={omniLoading || omniDrafting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50">
                                {omniDrafting ? <Loader2 className="w-4 h-4 animate-spin"/> : <MessageSquare className="w-4 h-4"/>} Draft WA Reply
                              </button>
                              <button onClick={handleOmniDraftEmail} disabled={omniLoading || omniDrafting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50">
                                {omniDrafting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4"/>} Draft Email Reply
                              </button>
                           </div>
                        </div>
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>

             </div>
          </>
        ) : inboxMode === 'agent' && activeAgentEmail ? (
          /* === RENDER AGENT DEDICATED VIEW === */
          <>
             {/* Simple Email History View */}
             <div className="flex-1 flex flex-col bg-grid-white/[0.01] bg-[size:32px_32px]">
               <div className="h-16 px-6 border-b border-white/[0.06] bg-background/50 backdrop-blur-md flex items-center shrink-0">
                 <h2 className="font-semibold text-foreground/90 flex items-center gap-2">
                   <Bot className="w-5 h-5 text-indigo-400" /> Thread History — <span className="opacity-80 font-normal ml-1"> {activeAgentEmail.customerId?.name}</span>
                 </h2>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col space-y-6">
                 {agentHistoryLoading ? (
                   <div className="flex-1 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                   </div>
                 ) : (
                   agentHistory.map((msg, i) => (
                     <div
                       key={msg.id}
                       className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                     >
                       <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm flex flex-col gap-1.5 shadow-md border ${
                         msg.direction === 'outbound' ? "bg-white/[0.03] border-white/[0.08] rounded-tr-sm" : "bg-blue-500/10 border-blue-500/20 rounded-tl-sm"
                       }`}>
                         <div className="flex items-center gap-4 mb-2 justify-between">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase opacity-90 text-blue-400">
                             <Mail className="w-3.5 h-3.5" /> EMAIL
                           </div>
                           <span className="text-[10px] opacity-50 text-foreground font-mono">{new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                         </div>
                         {msg.subject && <h4 className="font-bold text-foreground/90 text-xs mb-2 border-b border-white/[0.05] pb-2 leading-relaxed tracking-wide">Subject: <span className="opacity-80 font-medium">{msg.subject}</span></h4>}
                         <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium">{msg.body}</div>
                       </div>
                     </div>
                   ))
                 )}
                 <div ref={endOfMessagesRef} className="h-1 shrink-0" />
               </div>

               {/* AI REPLY PANEL */}
               <div className="shrink-0 p-6 bg-background border-t border-white/[0.06]">
                  <div className="bg-[#1e1b4b]/30 border-l-[3px] border-indigo-500 rounded-r-xl p-5 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                           <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-500/20 text-indigo-400">
                              <Sparkles className="w-3.5 h-3.5" />
                           </div>
                           <span className="font-bold text-sm text-indigo-100 uppercase tracking-widest">AI Suggested Reply</span>
                        </div>
                     </div>
                     <textarea 
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        placeholder="AI suggested response will appear here..."
                        className="w-full bg-black/20 border border-indigo-500/20 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors mb-4 min-h-[120px] resize-none text-indigo-50/90 leading-relaxed font-medium block relative z-10"
                     />
                     <div className="flex items-center justify-end gap-3 relative z-10">
                        <button 
                           onClick={handleAgentRegenerate}
                           disabled={regenerating}
                           className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-500/30 text-indigo-300 font-bold hover:bg-indigo-500/10 transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
                        >
                           <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                           Regenerate
                        </button>
                        <button 
                           onClick={handleAgentSend}
                           disabled={sendingAgent || !editReplyText.trim()}
                           className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:grayscale"
                        >
                           {sendingAgent && <Loader2 className="w-4 h-4 animate-spin" />}
                           Send Reply <Send className="w-4 h-4 ml-1" />
                        </button>
                     </div>
                  </div>
               </div>
             </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center bg-background/50">
            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-lg">
                {inboxMode === 'agent' ? <Bot className="w-8 h-8 text-indigo-500/50" /> : <MessageSquare className="w-8 h-8 text-neon-cyan/50" />}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Select a {inboxMode === 'agent' ? 'pending AI email ticket' : 'customer from the inbox'} to orchestrate communication.</p>
          </div>
        )}
      </div>
    </div>
  );
}
