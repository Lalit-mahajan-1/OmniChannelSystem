import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Mail, Phone, Smartphone,
  Sparkles, Send, Smile, Paperclip, Loader2, AlertCircle, Users, CheckCircle, Zap, RefreshCw, Bot,
  Inbox, Clock, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const BASE = import.meta.env.VITE_API_URL;
const API_ROOT = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const AGENT_BASE    = import.meta.env.VITE_AGENT_URL ? import.meta.env.VITE_AGENT_URL + "/agent" : API_ROOT + "/agent";
const WA_AGENT_BASE = import.meta.env.VITE_WA_AGENT_URL ? import.meta.env.VITE_WA_AGENT_URL + "/wa-agent" : API_ROOT + "/wa-agent";
const OMNI_BASE     = import.meta.env.VITE_OMNI_AGENT_URL ? import.meta.env.VITE_OMNI_AGENT_URL + "/omni-agent" : API_ROOT + "/omni-agent";

/* ─── palette — matches the Campaigns page ─── */
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
  amber: "#EF9F27",
  amberBg: "#FAEEDA",
  amberBorder: "#FAC775",
  green:    "#B8860B",
  greenBg:  "#FFF3CD",
  greenBorder: "#FFE082",
  blue: "#185FA5",
  blueBg: "#E6F1FB",
  blueBorder: "#B5D4F4",
  purple: "#534AB7",
  purpleBg: "#EEEDFE",
  purpleBorder: "#CECBF6",
  red: "#A32D2D",
  redBg: "#FCEBEB",
  redBorder: "#F7C1C1",
};

const channelStyle = {
  whatsapp: { color: C.green, bg: C.greenBg, border: C.greenBorder, label: "WhatsApp" },
  email: { color: C.blue, bg: C.blueBg, border: C.blueBorder, label: "Email" },
};

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

interface TicketInsight {
  sentiment: string;
  urgency: string;
  priority: string;
  category: string;
  assignedTeam: string;
  suggestedAction: string;
  escalationRequired: boolean;
  confidence: number;
  createdAt: string;
}

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

/* ─── small style helpers (mirrors Campaigns page conventions) ─── */
function pill(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
    borderRadius: 999, background: bg, border: `0.5px solid ${border}`,
    fontSize: 9.5, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.04em",
  };
}

function ghostBtn(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 11,
    color, background: bg, border: `0.5px solid ${border}`, borderRadius: 8, cursor: "pointer",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
  };
}

function primaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10,
    background: C.textMain, color: C.yellow, border: "none", fontSize: 11.5, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.04em",
    opacity: disabled ? 0.5 : 1,
  };
}

function metaLine(color: string): React.CSSProperties {
  return { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color };
}

function toggleTrack(on: boolean, color: string): React.CSSProperties {
  return {
    position: "relative", display: "inline-flex", height: 24, width: 42, flexShrink: 0,
    alignItems: "center", borderRadius: 999, cursor: "pointer", transition: "all 0.25s",
    background: on ? color : C.border, border: `1px solid ${on ? color : C.border}`,
  };
}

function toggleThumb(on: boolean): React.CSSProperties {
  return {
    display: "inline-block", height: 16, width: 16, borderRadius: "50%", background: C.white,
    boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transform: `translateX(${on ? 22 : 3}px)`,
    transition: "transform 0.25s",
  };
}

export default function InboxPage() {
  const { user } = useAuth();
  const employerId = user?._id || (user as any)?.id;

  // mode is fixed to 'omni' — the standalone "AI Agent" inbox view has been removed.
  // (Per-customer AI agents — Email Agent / WA Agent / Omni Intelligence — are still
  // available from within a conversation, see the buttons in the profile column.)
  const inboxMode = 'omni' as const;
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
  const [ticketInsight, setTicketInsight] = useState<TicketInsight | null>(null);
  const [ticketInsightLoading, setTicketInsightLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [omniGenerating, setOmniGenerating] = useState(false);

  // AUTO-REPLY TOGGLE STATE
  const [autoReplyEmail, setAutoReplyEmail] = useState(false);
  const [autoReplyWhatsapp, setAutoReplyWhatsapp] = useState(false);
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);
  const [togglingEmail, setTogglingEmail] = useState(false);
  const [togglingWa, setTogglingWa] = useState(false);
  const [isAutoReplying, setIsAutoReplying] = useState(false);
  const [lastAutoReplyType, setLastAutoReplyType] = useState<'whatsapp' | 'email' | null>(null);

  // ── KEY FIX: Track known message IDs BEFORE the session start so we never
  //   reply to old messages, but DO reply to messages that arrive after the
  //   user opens the conversation. We use a "seeded" flag per customer so the
  //   very first fetch just populates the set without triggering replies.
  const seededCustomersRef = useRef<Set<string>>(new Set());
  const processedIdsRef    = useRef<Set<string>>(new Set());

  // Keep latest toggle values accessible inside polling callback without stale closure
  const autoReplyEmailRef    = useRef(false);
  const autoReplyWhatsappRef = useRef(false);
  useEffect(() => { autoReplyEmailRef.current = autoReplyEmail; }, [autoReplyEmail]);
  useEffect(() => { autoReplyWhatsappRef.current = autoReplyWhatsapp; }, [autoReplyWhatsapp]);

  // EMAIL AGENT MODAL STATE
  const [emailAgentOpen, setEmailAgentOpen] = useState(false);
  const [emailAgentLoading, setEmailAgentLoading] = useState(false);
  const [emailAgentSuggestion, setEmailAgentSuggestion] = useState("");
  const [emailAgentContext, setEmailAgentContext] = useState<any[]>([]);
  const [emailAgentId, setEmailAgentId] = useState("");
  const [emailAgentRegenerating, setEmailAgentRegenerating] = useState(false);
  const [emailAgentSending, setEmailAgentSending] = useState(false);
  const [emailAgentContextOpen, setEmailAgentContextOpen] = useState(false);

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
  // OMNI INBOX LOGIC
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

  // When customer changes — reset seeding so new messages are detected properly
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerProfile(null);
      setAutoReplyEmail(false);
      setAutoReplyWhatsapp(false);
      setTimeline([]);
      return;
    }

    // Remove old processed IDs for this customer so we can re-seed fresh
    seededCustomersRef.current.delete(selectedCustomerId);
    const prefix = `${selectedCustomerId}__`;
    for (const id of processedIdsRef.current) {
      if (id.startsWith(prefix)) processedIdsRef.current.delete(id);
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE}/customers/${selectedCustomerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomerProfile(res.data.data);
      } catch (err: any) {
        console.error(err);
      }
    };

    const fetchAutoReplyStatus = async () => {
      setAutoReplyLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE}/customers/${selectedCustomerId}/auto-reply`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const emailOn = res.data.autoReplyEmail ?? false;
        const waOn    = res.data.autoReplyWhatsapp ?? false;
        setAutoReplyEmail(emailOn);
        setAutoReplyWhatsapp(waOn);
        autoReplyEmailRef.current    = emailOn;
        autoReplyWhatsappRef.current = waOn;
      } catch (err: any) {
        console.error("Failed to fetch auto-reply status", err);
      } finally {
        setAutoReplyLoading(false);
      }
    };

    const fetchTicketInsight = async () => {
      if (!selectedCustomerId) return;
      setTicketInsightLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE}/tickets/intelligence?customerId=${selectedCustomerId}&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTicketInsight(res.data.data?.[0] || null);
      } catch (err: any) {
        console.error("Failed to fetch ticket intelligence", err);
        setTicketInsight(null);
      } finally {
        setTicketInsightLoading(false);
      }
    };

    fetchProfile();
    fetchAutoReplyStatus();
    fetchTicketInsight();
  }, [selectedCustomerId]);

  const handleToggleEmailAutoReply = async () => {
    if (!selectedCustomerId || togglingEmail) return;
    setTogglingEmail(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${BASE}/customers/${selectedCustomerId}/toggle-email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newVal = res.data.autoReplyEmail;
      setAutoReplyEmail(newVal);
      autoReplyEmailRef.current = newVal;
      toast.success(`Email auto-reply ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error("Failed to toggle email auto-reply");
    } finally {
      setTogglingEmail(false);
    }
  };

  const handleToggleWaAutoReply = async () => {
    if (!selectedCustomerId || togglingWa) return;
    setTogglingWa(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${BASE}/customers/${selectedCustomerId}/toggle-whatsapp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newVal = res.data.autoReplyWhatsapp;
      setAutoReplyWhatsapp(newVal);
      autoReplyWhatsappRef.current = newVal;
      toast.success(`WhatsApp auto-reply ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error("Failed to toggle WhatsApp auto-reply");
    } finally {
      setTogglingWa(false);
    }
  };

  // ── AUTO-REPLY ENGINE ─────────────────────────────────────────────────────
  const runAutoReplyEngine = useCallback(async (
    customerId: string,
    merged: TimelineMessage[]
  ) => {
    const cidKey = (id: string) => `${customerId}__${id}`;
    const isSeeded = seededCustomersRef.current.has(customerId);

    if (!isSeeded) {
      merged.forEach(m => processedIdsRef.current.add(cidKey(m.id)));
      seededCustomersRef.current.add(customerId);
      return;
    }

    const newInboundWa = merged.filter(m =>
      m.type === 'whatsapp' &&
      m.direction === 'inbound' &&
      !processedIdsRef.current.has(cidKey(m.id))
    );
    const newInboundEmail = merged.filter(m =>
      m.type === 'email' &&
      m.direction === 'inbound' &&
      !processedIdsRef.current.has(cidKey(m.id))
    );

    [...newInboundWa, ...newInboundEmail].forEach(m =>
      processedIdsRef.current.add(cidKey(m.id))
    );

    if (autoReplyWhatsappRef.current && newInboundWa.length > 0) {
      console.log(`[Auto-Reply] ${newInboundWa.length} new WA message(s) → sending reply`);
      setIsAutoReplying(true);
      setLastAutoReplyType('whatsapp');
      try {
        await axios.post(`${WA_AGENT_BASE}/chats/${customerId}/auto-reply`);
        toast.success('🤖 WhatsApp auto-reply sent!', { duration: 3000 });
        setTimeout(() => fetchOmniTimeline(), 2500);
      } catch (err: any) {
        console.warn('[Auto-Reply WA] Agent unavailable');
        console.error('[Auto-Reply WA]', err.message);
      } finally {
        setTimeout(() => { setIsAutoReplying(false); setLastAutoReplyType(null); }, 3500);
      }
    }

    if (autoReplyEmailRef.current && newInboundEmail.length > 0) {
      const latestEmail = newInboundEmail[newInboundEmail.length - 1];
      console.log(`[Auto-Reply] New email from ${latestEmail.id} → sending reply`);
      setIsAutoReplying(true);
      setLastAutoReplyType('email');
      try {
        await axios.post(`${AGENT_BASE}/emails/${latestEmail.id}/auto-reply`);
        toast.success('🤖 Email auto-reply sent!', { duration: 3000 });
        setTimeout(() => fetchOmniTimeline(), 2500);
      } catch (err: any) {
        console.warn('[Auto-Reply Email] Agent unavailable');
        console.error('[Auto-Reply Email]', err.message);
      } finally {
        setTimeout(() => { setIsAutoReplying(false); setLastAutoReplyType(null); }, 3500);
      }
    }
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const fetchOmniTimeline = useCallback(async () => {
    if (!selectedCustomerId || !employerId) return;

    setTimelineLoading(timeline.length === 0);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [waRes, emailRes] = await Promise.allSettled([
        axios.get(`${BASE}/webhook/chats/${selectedCustomerId}?employerId=${employerId}`, { headers }),
        axios.get(`${BASE}/emails/customer/${selectedCustomerId}`, { headers })
      ]);

      let waMessages: any[] = [];
      let emailMessages: any[] = [];

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

      await runAutoReplyEngine(selectedCustomerId, merged);

    } catch (err: any) {
      console.error(err);
    } finally {
      setTimelineLoading(false);
    }
  }, [selectedCustomerId, employerId, timeline.length, runAutoReplyEngine]);

  useEffect(() => {
    fetchOmniTimeline();
    const int = setInterval(fetchOmniTimeline, 15000);
    return () => clearInterval(int);
  }, [fetchOmniTimeline]);

  const handleUpdateEmailStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${BASE}/emails/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Marked as ${status}`);
      fetchOmniTimeline();
    } catch (err: any) {
      toast.error("Status update failed");
    }
  };

  const handleOmniGenerate = async () => {
    if (timeline.length === 0) return;
    setOmniGenerating(true);
    try {
      const historyStr = timeline.slice(-12).map(m =>
        `[${m.type.toUpperCase()}] ${m.direction === 'inbound' ? 'Customer' : 'Bank Support'}: ${m.body}`
      ).join('\n');
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
        const latestInboundEmail = timeline.slice().reverse().find(
          m => m.type === 'email' && m.direction === 'inbound'
        );
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
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    const inboundEmails = emails
      .filter(m => m.direction === 'inbound')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
      toast.error("Email Agent is not available in cloud deployment. Run locally for AI features.");
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
      if (chat?.suggestedReply) {
        setWaAgentSuggestion(chat.suggestedReply);
      } else {
        const suggestRes = await axios.post(`${WA_AGENT_BASE}/chats/suggest`, { customerId: selectedCustomerId });
        setWaAgentSuggestion(suggestRes.data.suggestion);
      }
    } catch (err: any) {
      toast.error("WA Agent is not available in cloud deployment. Run locally for AI features.");
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

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  const filteredTimeline = timeline.filter(msg => filter === 'all' || msg.type === filter);
  const anyArOn = autoReplyWhatsapp || autoReplyEmail;

  const inboxArray = Array.from(inboxMap.values())
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", background: C.cream, fontFamily: "DM Sans, Inter, sans-serif" }}>

      {/* ── UNIFIED SIDEBAR ── */}
      <div style={{ width: 320, flexShrink: 0, borderRight: `0.5px solid ${C.border}`, background: C.creamDeep, display: "flex", flexDirection: "column", zIndex: 10 }}>

        {/* Header — AI Agent toggle removed, just a static "Omni Inbox" label now */}
        <div style={{ padding: 16, borderBottom: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C.white, borderRadius: 10, border: `0.5px solid ${C.border}` }}>
            <Users style={{ width: 14, height: 14, color: C.textMain }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.textMain, letterSpacing: "0.02em", textTransform: "uppercase" }}>
              Omni Inbox
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.textFaint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                borderRadius: 10, background: C.white, border: `0.5px solid ${C.border}`, fontSize: 13,
                color: C.textMain, outline: "none",
              }}
              placeholder="Search customers…"
            />
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} className="scrollbar-thin">
          {inboxLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 128, gap: 8, color: C.textFaint }}>
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
              <span style={{ fontSize: 12 }}>Loading…</span>
            </div>
          )}
          {!inboxLoading && inboxArray.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10, textAlign: "center", color: C.textFaint, padding: "0 24px" }}>
              <Inbox style={{ width: 26, height: 26, opacity: 0.5 }} />
              <p style={{ fontSize: 12.5, color: C.textMid, margin: 0 }}>No active conversations yet. New WhatsApp or email messages will show up here.</p>
            </div>
          )}
          {!inboxLoading && inboxArray.map((c, i) => (
            <motion.button
              key={c.customerId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedCustomerId(c.customerId)}
              style={{
                width: "100%", textAlign: "left", padding: "14px 16px", border: "none",
                borderBottom: `0.5px solid ${C.border}`, cursor: "pointer", position: "relative",
                background: selectedCustomerId === c.customerId ? C.yellowBg : "transparent",
                transition: "background 0.15s",
              }}
            >
              {selectedCustomerId === c.customerId && (
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.yellow }} />
              )}
              {c.unread && (
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: C.yellow, boxShadow: `0 0 0 3px ${C.yellowBg}` }} />
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: C.amberBg, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5,
                  fontWeight: 700, color: C.yellowDark, border: `0.5px solid ${C.yellowBorder}`,
                }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: C.textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: C.textFaint, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{timeAgo(c.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMid, margin: "3px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMessage}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
                    {c.channels.has('whatsapp') && <MessageSquare style={{ width: 12, height: 12, color: C.green }} />}
                    {c.channels.has('email') && <Mail style={{ width: 12, height: 12, color: C.blue }} />}
                    {selectedCustomerId === c.customerId && anyArOn && (
                      <span style={{ ...pill(C.yellowDark, C.yellowBg, C.yellowBorder), marginLeft: "auto" }}>
                        <Bot style={{ width: 10, height: 10 }} /> Auto
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── ACTIVE VIEW AREA ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {selectedCustomerId && customerProfile ? (
          <>
            {/* L1: Omni Static Profile */}
            <div style={{ width: 300, flexShrink: 0, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto", background: C.creamDeep }} className="scrollbar-thin">
              <div style={{ padding: "30px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{
                  width: 84, height: 84, borderRadius: "50%", background: C.amberBg, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700,
                  marginBottom: 14, border: `2px solid ${C.yellowBorder}`, color: C.yellowDark,
                }}>
                  {initials(customerProfile.name)}
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: C.textMain, margin: 0 }}>{customerProfile.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  {customerProfile.channel_ids?.whatsapp && (
                    <span style={{ padding: 7, borderRadius: "50%", background: C.greenBg, color: C.green, border: `0.5px solid ${C.greenBorder}` }} title="WhatsApp Active"><MessageSquare style={{ width: 14, height: 14 }} /></span>
                  )}
                  {customerProfile.email && (
                    <span style={{ padding: 7, borderRadius: "50%", background: C.blueBg, color: C.blue, border: `0.5px solid ${C.blueBorder}` }} title="Email Active"><Mail style={{ width: 14, height: 14 }} /></span>
                  )}
                </div>

                {customerProfile.email && (
                  <button onClick={handleOpenEmailAgent} style={{ ...ghostBtn(C.blue, C.blueBg, C.blueBorder), width: "100%", justifyContent: "center", marginTop: 16 }}>
                    <Bot style={{ width: 13, height: 13 }} /> Run Email Agent
                  </button>
                )}
                <button
                  onClick={handleOpenOmniIntelligence}
                  style={{ ...primaryBtn(), width: "100%", justifyContent: "center", marginTop: customerProfile.email ? 8 : 16 }}
                >
                  <Zap style={{ width: 13, height: 13 }} /> Omni Intelligence
                </button>

                {ticketInsight && (
                  <div style={{ marginTop: 16, width: "100%", padding: 14, borderRadius: 14, border: `0.5px solid ${C.border}`, background: C.white, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textFaint, fontWeight: 700 }}>Ticket Insight</span>
                      <span style={pill(ticketInsight.escalationRequired ? C.red : C.green, ticketInsight.escalationRequired ? C.redBg : C.greenBg, ticketInsight.escalationRequired ? C.redBorder : C.greenBorder)}>
                        {ticketInsight.escalationRequired ? 'Escalation' : 'Normal'}
                      </span>
                    </div>
                    <div style={{ display: "grid", gap: 7 }}>
                      <div style={{ fontSize: 12.5, color: C.textMid }}>Sentiment: <strong style={{ color: C.textMain }}>{ticketInsight.sentiment}</strong></div>
                      <div style={{ fontSize: 12.5, color: C.textMid }}>Urgency: <strong style={{ color: C.textMain }}>{ticketInsight.urgency}</strong></div>
                      <div style={{ fontSize: 12.5, color: C.textMid }}>Priority: <strong style={{ color: C.textMain }}>{ticketInsight.priority}</strong></div>
                      <div style={{ fontSize: 12.5, color: C.textMid }}>Category: <strong style={{ color: C.textMain }}>{ticketInsight.category}</strong></div>
                      <div style={{ fontSize: 12.5, color: C.textMid }}>Team: <strong style={{ color: C.textMain }}>{ticketInsight.assignedTeam}</strong></div>
                      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, fontWeight: 700, marginTop: 4 }}>Suggested Action</div>
                      <div style={{ fontSize: 12, color: C.textMid, background: C.cream, borderRadius: 10, padding: 10, lineHeight: 1.5 }}>{ticketInsight.suggestedAction}</div>
                    </div>
                  </div>
                )}

                {/* ── AUTO REPLY TOGGLES ── */}
                <div style={{
                  width: "100%", marginTop: 12, padding: 14, borderRadius: 14, textAlign: "left",
                  border: `0.5px solid ${anyArOn ? C.yellowBorder : C.border}`,
                  background: anyArOn ? C.yellowBg : C.white,
                  display: "flex", flexDirection: "column", gap: 12, transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Bot style={{ width: 14, height: 14, color: C.yellowDark }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.yellowDark }}>Auto Reply</span>
                    {autoReplyLoading && <Loader2 style={{ width: 12, height: 12, marginLeft: "auto", color: C.textFaint }} className="animate-spin" />}
                    {anyArOn && !autoReplyLoading && (
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: C.green, letterSpacing: "0.06em" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                        Live
                      </span>
                    )}
                  </div>

                  {/* WhatsApp toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <MessageSquare style={{ width: 14, height: 14, color: autoReplyWhatsapp ? C.green : C.textFaint }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: autoReplyWhatsapp ? C.textMain : C.textMid }}>WhatsApp</span>
                    </div>
                    <button
                      onClick={handleToggleWaAutoReply}
                      disabled={togglingWa || autoReplyLoading}
                      title={autoReplyWhatsapp ? 'Disable WhatsApp auto-reply' : 'Enable WhatsApp auto-reply'}
                      style={{ ...toggleTrack(autoReplyWhatsapp, C.green), border: "none", padding: 0, opacity: (togglingWa || autoReplyLoading) ? 0.6 : 1 }}
                    >
                      <span style={toggleThumb(autoReplyWhatsapp)} />
                    </button>
                  </div>

                  {/* Email toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Mail style={{ width: 14, height: 14, color: autoReplyEmail ? C.blue : C.textFaint }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: autoReplyEmail ? C.textMain : C.textMid }}>Email</span>
                    </div>
                    <button
                      onClick={handleToggleEmailAutoReply}
                      disabled={togglingEmail || autoReplyLoading}
                      title={autoReplyEmail ? 'Disable Email auto-reply' : 'Enable Email auto-reply'}
                      style={{ ...toggleTrack(autoReplyEmail, C.blue), border: "none", padding: 0, opacity: (togglingEmail || autoReplyLoading) ? 0.6 : 1 }}
                    >
                      <span style={toggleThumb(autoReplyEmail)} />
                    </button>
                  </div>

                  {anyArOn && (
                    <p style={{ fontSize: 10.5, color: C.textMid, fontStyle: "italic", lineHeight: 1.5, margin: 0, paddingTop: 8, borderTop: `0.5px solid ${C.yellowBorder}` }}>
                      AI will auto-reply to new {[autoReplyWhatsapp && 'WhatsApp', autoReplyEmail && 'Email'].filter(Boolean).join(' & ')} messages within ~15s of arrival.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 22 }}>
                <div style={{ padding: 14, borderRadius: 14, background: C.yellowBg, border: `0.5px solid ${C.yellowBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <Sparkles style={{ width: 14, height: 14, color: C.yellowDark, flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: C.yellowDark, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Summary</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.55, margin: 0 }}>
                    <strong style={{ color: C.textMain }}>{customerProfile.name}</strong> — joined{" "}
                    {new Date(customerProfile.createdAt).toLocaleDateString()}.{" "}
                    {customerProfile.channel_ids?.whatsapp
                      ? "Active heavily on WhatsApp."
                      : customerProfile.phone
                      ? "Reachable by phone calls."
                      : "Prefers contact via email."}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `0.5px solid ${C.border}`, paddingBottom: 8, margin: 0 }}>Contact Details</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><Mail style={{ width: 14, height: 14, color: C.blue, flexShrink: 0 }} /><span style={{ color: C.textMid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customerProfile.email}</span></div>
                  {customerProfile.phone && <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><Phone style={{ width: 14, height: 14, color: C.purple, flexShrink: 0 }} /><span style={{ color: C.textMid }}>{customerProfile.phone}</span></div>}
                </div>
              </div>
            </div>

            {/* R1: Omni Unified Timeline */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: C.cream }}>
              <div style={{ minHeight: 64, padding: "12px 24px", borderBottom: `0.5px solid ${C.border}`, background: C.creamDeep, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: C.textMain, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                    <MessageSquare style={{ width: 15, height: 15, color: C.purple }} /> Timeline Engine
                  </h2>
                  {isAutoReplying && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        ...pill(
                          lastAutoReplyType === 'whatsapp' ? C.green : C.blue,
                          lastAutoReplyType === 'whatsapp' ? C.greenBg : C.blueBg,
                          lastAutoReplyType === 'whatsapp' ? C.greenBorder : C.blueBorder
                        ),
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                      <Bot style={{ width: 11, height: 11 }} />
                      AI Replying via {lastAutoReplyType === 'whatsapp' ? 'WhatsApp' : 'Email'}…
                    </motion.div>
                  )}
                  {!isAutoReplying && anyArOn && (
                    <span style={pill(C.yellowDark, C.yellowBg, C.yellowBorder)}>
                      <Bot style={{ width: 11, height: 11 }} />
                      Auto Reply On
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {customerProfile.email && filter === 'email' && (
                    <button onClick={handleOpenEmailAgent} style={ghostBtn(C.blue, C.blueBg, C.blueBorder)}>
                      <Sparkles style={{ width: 12, height: 12 }} /> Email Agent
                    </button>
                  )}
                  {filter === 'whatsapp' && (
                    <button onClick={handleOpenWaAgent} style={ghostBtn(C.green, C.greenBg, C.greenBorder)}>
                      <MessageSquare style={{ width: 12, height: 12 }} /> WA Agent
                    </button>
                  )}
                  <div style={{ display: "flex", background: C.white, borderRadius: 9, padding: 3, border: `0.5px solid ${C.border}` }}>
                    {(['all', 'whatsapp', 'email'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                          padding: "6px 14px", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                          borderRadius: 7, border: "none", cursor: "pointer", letterSpacing: "0.02em",
                          background: filter === f ? C.textMain : "transparent",
                          color: filter === f ? C.yellow : C.textMid,
                          transition: "all 0.15s",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }} className="scrollbar-thin">
                {(waError || emailError) && (
                  <div style={{ padding: 12, marginBottom: 4, borderRadius: 12, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, color: C.yellowDark, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <AlertCircle style={{ width: 15, height: 15 }} />
                    {waError && emailError ? "All communication channels are currently offline." : waError ? "WhatsApp channel sync failed. Showing email logs only." : "Email sync failed. Showing WhatsApp logs only."}
                  </div>
                )}
                {timelineLoading && timeline.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}><Loader2 style={{ width: 30, height: 30, color: C.yellowDark }} className="animate-spin" /></div>
                ) : filteredTimeline.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: C.textFaint }}>
                    <MessageSquare style={{ width: 30, height: 30, opacity: 0.4 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.textMid, margin: 0 }}>No messages yet on this filter.</p>
                  </div>
                ) : (
                  filteredTimeline.map((msg, i) => {
                    const cs = channelStyle[msg.type];
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
                        style={{ display: "flex", justifyContent: msg.direction === 'outbound' ? "flex-end" : "flex-start" }}
                      >
                        <div style={{
                          maxWidth: "72%", borderRadius: 16, padding: "16px 18px", fontSize: 13.5, display: "flex",
                          flexDirection: "column", gap: 7, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          border: `0.5px solid ${msg.direction === 'outbound' ? C.yellowBorder : cs.border}`,
                          background: msg.direction === 'outbound' ? C.yellowBg : C.white,
                          borderTopRightRadius: msg.direction === 'outbound' ? 4 : 16,
                          borderTopLeftRadius: msg.direction === 'outbound' ? 16 : 4,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4, justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {msg.type === 'whatsapp' ? <MessageSquare style={{ width: 13, height: 13, color: C.green }} /> : <Mail style={{ width: 13, height: 13, color: C.blue }} />}
                              <span style={{ color: cs.color }}>{cs.label}</span>
                              {msg.direction === 'outbound' && (
                                <span style={{ fontSize: 9, color: msg.status === 'simulated' ? C.purple : C.yellowDark, background: msg.status === 'simulated' ? C.purpleBg : C.yellowBg, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>
                                  {msg.status === 'simulated' ? 'AI Agent' : 'Manual'}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: 10, color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>{new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          {msg.type === 'email' && msg.subject && (
                            <h4 style={{ fontWeight: 700, color: C.textMain, fontSize: 12, margin: 0, borderBottom: `0.5px solid ${C.border}`, paddingBottom: 8, lineHeight: 1.5 }}>
                              Subject: <span style={{ fontWeight: 500, color: C.textMid }}>{msg.subject}</span>
                            </h4>
                          )}
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, color: C.textMain, fontWeight: 500 }}>{msg.body}</div>
                          {msg.type === 'email' && msg.direction === 'inbound' && !['resolved', 'closed'].includes(msg.status) && (
                            <div style={{ marginTop: 6, display: "flex", gap: 14, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
                              <button onClick={() => handleUpdateEmailStatus(msg.id, 'resolved')} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, textTransform: "uppercase", fontWeight: 700, color: C.green, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.03em" }}><CheckCircle style={{ width: 12, height: 12 }} /> Mark Resolved</button>
                              <button onClick={() => handleUpdateEmailStatus(msg.id, 'closed')} style={{ fontSize: 10.5, textTransform: "uppercase", fontWeight: 700, color: C.textFaint, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.03em" }}>Mark Closed</button>
                            </div>
                          )}
                          {msg.aiReply && msg.type === 'email' && (
                            <div style={{ marginTop: 8, paddingTop: 10, borderTop: `0.5px solid ${C.yellowBorder}`, background: C.yellowBg, margin: "8px -18px -16px", padding: "10px 18px 14px", borderRadius: "0 0 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.yellowDark, fontWeight: 700 }}><Sparkles style={{ width: 13, height: 13 }} /> AI Reply:</div>
                              <p style={{ fontSize: 12, color: C.textMid, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>{msg.aiReply}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={endOfMessagesRef} style={{ height: 4, flexShrink: 0 }} />
              </div>

              <div style={{ background: C.creamDeep, borderTop: `0.5px solid ${C.border}`, flexShrink: 0, position: "sticky", bottom: 0, zIndex: 20 }}>
                <div style={{ padding: "16px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button style={{ padding: 10, borderRadius: 10, background: "none", border: "none", color: C.textFaint, cursor: "pointer" }}><Paperclip style={{ width: 18, height: 18 }} /></button>
                    <input
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                      style={{
                        flex: 1, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12,
                        padding: "13px 18px", fontSize: 13.5, outline: "none", color: C.textMain,
                      }}
                      placeholder={filter === 'email' ? `Reply via Email to ${customerProfile.name}…` : `Message ${customerProfile.name} via WhatsApp…`}
                    />
                    <button
                      disabled={sending || !messageText.trim()}
                      onClick={handleSendMessage}
                      style={{
                        padding: 13, borderRadius: 12, background: C.textMain, color: C.yellow, border: "none",
                        cursor: sending || !messageText.trim() ? "not-allowed" : "pointer",
                        opacity: sending || !messageText.trim() ? 0.5 : 1, display: "flex", alignItems: "center",
                      }}
                    >
                      {sending ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : <Send style={{ width: 18, height: 18 }} />}
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
                    style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50, background: C.white,
                      borderTop: `3px solid ${C.blue}`, boxShadow: "0 -10px 40px rgba(0,0,0,0.08)",
                      maxHeight: "90%", overflowY: "auto", display: "flex", flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0, background: C.blueBg }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Sparkles style={{ width: 17, height: 17, color: C.blue }} />
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: C.blue, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Email Agent</span>
                      </div>
                      <button onClick={() => setEmailAgentOpen(false)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: "50%", color: C.blue, cursor: "pointer" }}>
                        <X style={{ width: 16, height: 16 }} />
                      </button>
                    </div>

                    <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
                      <div style={{ marginBottom: 14 }}>
                        <button onClick={() => setEmailAgentContextOpen(!emailAgentContextOpen)} style={{ fontSize: 10.5, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}>
                          {emailAgentContextOpen ? '▼ Hide Context' : '▶ View Context'}
                        </button>
                        {emailAgentContextOpen && (
                          <div style={{ padding: 12, background: C.cream, borderRadius: 12, border: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10, marginBottom: 8, maxHeight: 180, overflowY: "auto", fontSize: 12 }}>
                            {emailAgentContext.map(m => (
                              <div key={m.id} style={{ display: "flex", flexDirection: "column", color: m.direction === 'inbound' ? C.textMain : C.textFaint }}>
                                <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 9.5, marginBottom: 2, opacity: 0.7 }}>{m.direction === 'inbound' ? 'Customer:' : 'Bank:'}</span>
                                <span style={{ lineHeight: 1.5, whiteSpace: "normal" }}>{m.body}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ borderLeft: `4px solid ${C.blue}`, paddingLeft: 14, marginBottom: 20 }}>
                        {emailAgentLoading ? (
                          <div style={{ width: "100%", height: 130, background: C.blueBg, borderRadius: 12, border: `0.5px solid ${C.blueBorder}` }} className="animate-pulse" />
                        ) : (
                          <textarea
                            value={emailAgentSuggestion}
                            onChange={e => setEmailAgentSuggestion(e.target.value)}
                            style={{
                              width: "100%", background: C.cream, border: `0.5px solid ${C.blueBorder}`, borderRadius: 12,
                              padding: 14, fontSize: 13.5, outline: "none", color: C.textMain, minHeight: 140,
                              resize: "none", lineHeight: 1.55,
                            }}
                          />
                        )}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            onClick={handleEmailAgentRegenerate}
                            disabled={emailAgentLoading || emailAgentRegenerating}
                            style={ghostBtn(C.blue, C.blueBg, C.blueBorder)}
                          >
                            <RefreshCw style={{ width: 13, height: 13 }} className={emailAgentRegenerating ? "animate-spin" : ""} />
                            Regenerate
                          </button>
                          <button
                            onClick={handleEmailAgentSend}
                            disabled={emailAgentLoading || emailAgentRegenerating || emailAgentSending || !emailAgentSuggestion.trim()}
                            style={primaryBtn(emailAgentLoading || emailAgentRegenerating || emailAgentSending || !emailAgentSuggestion.trim())}
                          >
                            {emailAgentSending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Send style={{ width: 14, height: 14 }} />}
                            Send Reply
                          </button>
                        </div>
                        <button
                          onClick={handleEmailAgentAutoReplyAll}
                          disabled={emailAgentSending || emailAgentLoading || emailAgentRegenerating}
                          style={ghostBtn(C.green, C.greenBg, C.greenBorder)}
                        >
                          <Zap style={{ width: 13, height: 13 }} />
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
                    style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60, background: C.white,
                      borderTop: `3px solid ${C.green}`, boxShadow: "0 -10px 40px rgba(0,0,0,0.08)",
                      maxHeight: "90%", overflowY: "auto", display: "flex", flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0, background: C.greenBg }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MessageSquare style={{ width: 17, height: 17, color: C.green }} />
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: C.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI WhatsApp Agent</span>
                      </div>
                      <button onClick={() => setWaAgentOpen(false)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: "50%", color: C.green, cursor: "pointer" }}>
                        <X style={{ width: 16, height: 16 }} />
                      </button>
                    </div>

                    <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
                      <div style={{ borderLeft: `4px solid ${C.green}`, paddingLeft: 14, marginBottom: 20 }}>
                        {waAgentLoading ? (
                          <div style={{ width: "100%", height: 130, background: C.greenBg, borderRadius: 12, border: `0.5px solid ${C.greenBorder}` }} className="animate-pulse" />
                        ) : (
                          <textarea
                            value={waAgentSuggestion}
                            onChange={e => setWaAgentSuggestion(e.target.value)}
                            style={{
                              width: "100%", background: C.cream, border: `0.5px solid ${C.greenBorder}`, borderRadius: 12,
                              padding: 14, fontSize: 13.5, outline: "none", color: C.textMain, minHeight: 140,
                              resize: "none", lineHeight: 1.55,
                            }}
                          />
                        )}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            onClick={handleWaAgentRegenerate}
                            disabled={waAgentLoading || waAgentRegenerating}
                            style={ghostBtn(C.green, C.greenBg, C.greenBorder)}
                          >
                            <RefreshCw style={{ width: 13, height: 13 }} className={waAgentRegenerating ? "animate-spin" : ""} />
                            Regenerate
                          </button>
                          <button
                            onClick={handleWaAgentSend}
                            disabled={waAgentLoading || waAgentRegenerating || waAgentSending || !waAgentSuggestion?.trim()}
                            style={primaryBtn(waAgentLoading || waAgentRegenerating || waAgentSending || !waAgentSuggestion?.trim())}
                          >
                            {waAgentSending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Send style={{ width: 14, height: 14 }} />}
                            Send Reply
                          </button>
                        </div>
                        <button
                          onClick={handleWaAgentAutoReplyAll}
                          disabled={waAgentSending || waAgentLoading || waAgentRegenerating}
                          style={ghostBtn(C.yellowDark, C.yellowBg, C.yellowBorder)}
                        >
                          <Zap style={{ width: 13, height: 13 }} />
                          Auto Reply All
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === OMNI MODAL === */}
              <AnimatePresence>
                {omniModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(26,26,26,0.45)", padding: 24 }}
                  >
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.96, opacity: 0 }}
                      style={{ background: C.white, border: `0.5px solid ${C.yellowBorder}`, boxShadow: "0 24px 60px rgba(0,0,0,0.18)", borderRadius: 18, width: "100%", maxWidth: 480, overflow: "hidden", display: "flex", flexDirection: "column" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: C.yellowBg, borderBottom: `0.5px solid ${C.yellowBorder}` }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMain, fontWeight: 700, fontSize: 14, margin: 0 }}><Sparkles style={{ width: 15, height: 15, color: C.yellowDark }} /> Customer Intelligence Report</h3>
                        <button onClick={() => setOmniModalOpen(false)} disabled={omniDrafting} style={{ color: C.textMid, background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 17, height: 17 }} /></button>
                      </div>
                      <div style={{ padding: 22 }}>
                        {omniLoading ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 12, color: C.yellowDark }}>
                            <Loader2 style={{ width: 30, height: 30 }} className="animate-spin" />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Generating Report...</span>
                          </div>
                        ) : omniReport ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={{ padding: 12, background: C.cream, borderRadius: 12, border: `0.5px solid ${C.border}` }}>
                                <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, fontWeight: 700, marginBottom: 4, display: "block" }}>Sentiment</span>
                                <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: ['angry', 'negative'].includes(omniReport.sentiment?.toLowerCase()) ? C.red : ['positive'].includes(omniReport.sentiment?.toLowerCase()) ? C.green : C.amber }}>
                                  <Smile style={{ width: 14, height: 14 }} /> {omniReport.sentiment}
                                </div>
                              </div>
                              <div style={{ padding: 12, background: C.cream, borderRadius: 12, border: `0.5px solid ${C.border}` }}>
                                <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, fontWeight: 700, marginBottom: 4, display: "block" }}>Urgency</span>
                                <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: omniReport.urgency?.toLowerCase() === 'high' ? C.red : omniReport.urgency?.toLowerCase() === 'low' ? C.green : C.amber }}>
                                  <Zap style={{ width: 14, height: 14 }} /> {omniReport.urgency}
                                </div>
                              </div>
                              <div style={{ padding: 12, background: C.cream, borderRadius: 12, border: `0.5px solid ${C.border}` }}>
                                <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, fontWeight: 700, marginBottom: 4, display: "block" }}>Resolved Status</span>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.textMain, display: "flex", alignItems: "center", gap: 6 }}>
                                  {omniReport.isResolved ? <CheckCircle style={{ width: 14, height: 14, color: C.green }} /> : <AlertCircle style={{ width: 14, height: 14, color: C.red }} />}
                                  {omniReport.isResolved ? 'Resolved' : 'Needs Action'}
                                </div>
                              </div>
                              <div style={{ padding: 12, background: C.cream, borderRadius: 12, border: `0.5px solid ${C.border}` }}>
                                <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, fontWeight: 700, marginBottom: 4, display: "block" }}>Channels</span>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {(omniReport.channelsUsed || []).map((ch: string) => (
                                    <span key={ch} style={pill(C.textMain, C.border, C.border)}>{ch}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{ padding: 14, background: C.cream, borderRadius: 12, border: `0.5px solid ${C.border}` }}>
                              <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, fontWeight: 700, marginBottom: 4, display: "block" }}>Main Issue</span>
                              <p style={{ fontSize: 13, fontWeight: 500, color: C.textMain, lineHeight: 1.55, margin: 0 }}>{omniReport.mainIssue || "Unknown"}</p>
                            </div>
                            <div style={{ padding: 14, background: C.yellowBg, borderRadius: 12, border: `0.5px solid ${C.yellowBorder}` }}>
                              <span style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.yellowDark, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><Sparkles style={{ width: 11, height: 11 }} /> Recommendation</span>
                              <p style={{ fontSize: 13, fontWeight: 500, color: C.textMain, lineHeight: 1.55, margin: 0 }}>{omniReport.recommendation || "N/A"}</p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "24px 0", color: C.red, fontSize: 13 }}>Could not load report.</div>
                        )}

                        <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                          <button onClick={handleOmniDraftWa} disabled={omniLoading || omniDrafting} style={{ ...ghostBtn(C.green, C.greenBg, C.greenBorder), flex: 1, justifyContent: "center", padding: "11px 0" }}>
                            {omniDrafting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <MessageSquare style={{ width: 14, height: 14 }} />} Draft WA Reply
                          </button>
                          <button onClick={handleOmniDraftEmail} disabled={omniLoading || omniDrafting} style={{ ...ghostBtn(C.blue, C.blueBg, C.blueBorder), flex: 1, justifyContent: "center", padding: "11px 0" }}>
                            {omniDrafting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Mail style={{ width: 14, height: 14 }} />} Draft Email Reply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, textAlign: "center", background: C.cream }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.white, border: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <MessageSquare style={{ width: 30, height: 30, color: C.yellowDark, opacity: 0.6 }} />
            </div>
            <p style={{ fontSize: 13.5, color: C.textMid, fontWeight: 500, maxWidth: 280, margin: 0 }}>
              Select a customer from the inbox to orchestrate communication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}