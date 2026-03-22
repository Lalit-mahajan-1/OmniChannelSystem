import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Mail, Phone, Smartphone,
  Sparkles, Send, Smile, Paperclip, Loader2, AlertCircle, Users, CheckCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const BASE = import.meta.env.VITE_API_URL;

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

const aiSuggestions = [
  "Your order has been processed successfully.",
  "Is there anything else I can help you with today?",
];

function initials(name: string) {
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

  const [inboxMap, setInboxMap] = useState<Map<string, InboxItem>>(new Map());
  const [inboxLoading, setInboxLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  const [timeline, setTimeline] = useState<TimelineMessage[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  
  const [waError, setWaError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email'>('all');

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // 1. Inbox Logic + Polling
  const fetchInbox = useCallback(async () => {
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

      // Merge WA
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

      // Merge Emails
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
      toast.error("Inbox sync failed");
    } finally {
      setInboxLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    fetchInbox();
    const int = setInterval(fetchInbox, 30000);
    return () => clearInterval(int);
  }, [fetchInbox]);

  // 2. Customer Profile
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
        toast.error("Failed to fetch customer profile");
      }
    };
    fetchProfile();
  }, [selectedCustomerId]);

  // 3. Timeline Logic + Polling
  const fetchTimeline = useCallback(async () => {
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
      let wErr = false;
      let eErr = false;

      if (waRes.status === 'fulfilled') {
        waMessages = waRes.value.data.data || [];
        setWaError(false);
      } else {
        wErr = true;
        setWaError(true);
      }

      if (emailRes.status === 'fulfilled') {
        emailMessages = emailRes.value.data.data || [];
        setEmailError(false);
      } else {
        eErr = true;
        setEmailError(true);
      }

      if (wErr && eErr) throw new Error("Both channels failed to load");

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
      toast.error(err.message || "Failed to load timeline");
    } finally {
      setTimelineLoading(false);
    }
  }, [selectedCustomerId, employerId, timeline.length]);

  useEffect(() => {
    fetchTimeline();
    const int = setInterval(fetchTimeline, 15000);
    return () => clearInterval(int);
  }, [fetchTimeline]);

  // Scroll to bottom trigger
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [timeline, filter]);

  // Actions
  const handleUpdateEmailStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${BASE}/emails/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Marked as ${status}`);
      fetchTimeline();
    } catch(err: any) {
      toast.error("Status update failed");
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

      // Optimistic upate
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
        fetchTimeline();
      }, 2000);

    } catch (err: any) {
      console.error("Direct send error:", err);
      toast.error(err.response?.data?.message || err.message || "Message delivery failed");
    } finally {
      setSending(false);
    }
  };

  const filteredTimeline = timeline.filter(msg => filter === 'all' || msg.type === filter);

  const inboxArray = Array.from(inboxMap.values())
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── INBOX LIST ── */}
      <div className="w-80 border-r border-white/[0.06] flex flex-col shrink-0 bg-background z-10">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">Inbox</h1>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {inboxArray.length}
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
        </div>
      </div>

      {/* ── ACTIVE VIEW AREA ── */}
      <div className="flex-1 flex overflow-hidden">
        {selectedCustomerId && customerProfile ? (
          <>
            {/* L1: Customer Profile Static Left Panel */}
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
              </div>
              
              <div className="p-6 space-y-8">
                {/* AI Summary Widget */}
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
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-neon-cyan shrink-0" />
                    <span className="truncate text-foreground/80">{customerProfile.email}</span>
                  </div>
                  {customerProfile.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-neon-purple shrink-0" />
                      <span className="text-foreground/80">{customerProfile.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/[0.04] pb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">Joined</span>
                      <span className="text-foreground/80 font-mono text-xs">{new Date(customerProfile.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">Language</span>
                      <span className="uppercase text-foreground/80 font-mono text-xs">{customerProfile.language}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">Timezone</span>
                      <span className="text-foreground/80 font-mono text-xs">{customerProfile.timezone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* R1: Unified Chat Timeline Right Panel */}
            <div className="flex-1 flex flex-col bg-grid-white/[0.01] bg-[size:32px_32px]">
               {/* Timeline Header Filters */}
               <div className="h-16 px-6 border-b border-white/[0.06] bg-background/50 backdrop-blur-md flex items-center justify-between shrink-0">
                 <h2 className="font-semibold text-foreground/90 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 text-neon-purple" />
                   Timeline Engine
                 </h2>
                 <div className="flex bg-white/[0.02] rounded-lg p-1 border border-white/[0.06]">
                   {['all', 'whatsapp', 'email'].map(f => (
                     <button
                       key={f}
                       onClick={() => setFilter(f as any)}
                       className={`px-4 py-1.5 text-[11px] font-bold tracking-wide uppercase rounded-md transition-all ${filter === f ? 'bg-white/[0.1] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
                     >
                       {f}
                     </button>
                   ))}
                 </div>
               </div>
               
               {/* Timeline Thread Component */}
               <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col space-y-6">
                 
                 {/* Channel Error Warnings */}
                 {(waError || emailError) && (
                   <div className="p-3 mb-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" /> 
                      {waError && emailError ? "All communication channels are currently offline." : waError ? "WhatsApp channel sync failed. Showing email logs only." : "Email sync failed. Showing WhatsApp logs only."}
                   </div>
                 )}

                 {timelineLoading && timeline.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                     <p className="text-sm text-neon-cyan/70 font-medium">Syncing Omnichannel History...</p>
                   </div>
                 ) : filteredTimeline.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                     <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center">
                       <MessageSquare className="w-8 h-8 opacity-40" />
                     </div>
                     <p className="text-sm font-medium">No messages yet on this channel.</p>
                   </div>
                 ) : (
                   filteredTimeline.map((msg, i) => (
                     <motion.div
                       key={msg.id}
                       initial={{ opacity: 0, y: 15 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
                       className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                     >
                       <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm flex flex-col gap-1.5 shadow-md border ${
                         msg.direction === 'outbound'
                           ? "bg-gradient-to-br from-neon-purple/10 to-neon-cyan/5 border-neon-cyan/20 rounded-tr-sm"
                           : msg.type === 'whatsapp' 
                             ? "bg-green-500/10 border-green-500/20 rounded-tl-sm"
                             : "bg-blue-500/10 border-blue-500/20 rounded-tl-sm"
                       }`}>
                         
                         {/* Bubble Meta Header */}
                         <div className="flex items-center gap-4 mb-2 justify-between">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase opacity-90">
                             {msg.type === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-green-400" /> : <Mail className="w-3.5 h-3.5 text-blue-400" />}
                             <span className={msg.type === 'whatsapp' ? 'text-green-400' : 'text-blue-400'}>{msg.type}</span>
                           </div>
                           <span className="text-[10px] opacity-50 text-foreground font-mono">
                             {new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                           </span>
                         </div>

                         {/* Content Execution */}
                         {msg.type === 'email' && msg.subject && (
                           <h4 className="font-bold text-foreground/90 text-xs mb-2 border-b border-white/[0.05] pb-2 leading-relaxed tracking-wide">
                             Subject: <span className="opacity-80 font-medium">{msg.subject}</span>
                           </h4>
                         )}

                         <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium">
                            {msg.body}
                         </div>

                         {/* Inline Email Status Actions */}
                         {msg.type === 'email' && msg.direction === 'inbound' && !['resolved', 'closed'].includes(msg.status) && (
                            <div className="mt-2 flex gap-2 pt-2 border-t border-white/[0.06]">
                               <button onClick={() => handleUpdateEmailStatus(msg.id, 'resolved')} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-400 hover:text-green-300 transition-colors">
                                 <CheckCircle className="w-3 h-3" /> Mark Resolved
                               </button>
                               <button onClick={() => handleUpdateEmailStatus(msg.id, 'closed')} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-white transition-colors">
                                  Mark Closed
                               </button>
                            </div>
                         )}
                         
                         {/* AI Orchestration Addon */}
                         {msg.aiReply && msg.type === 'email' && (
                           <div className="mt-3 pt-3 border-t border-neon-cyan/10 bg-neon-cyan/5 -mx-5 px-5 -mb-4 pb-4 rounded-b-xl flex flex-col gap-1.5">
                             <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neon-cyan font-bold">
                               <Sparkles className="w-3.5 h-3.5" /> AI Reply:
                             </div>
                             <p className="text-xs text-foreground/80 italic leading-relaxed">{msg.aiReply}</p>
                           </div>
                         )}
                       </div>
                     </motion.div>
                   ))
                 )}
                 <div ref={endOfMessagesRef} className="h-1 shrink-0" />
               </div>

               {/* ── Fixed Bottom Bar Setup ── */}
               <div className="bg-background border-t border-white/[0.06] shrink-0 sticky bottom-0 z-20">
                 {/* Suggested Tags Tracker */}
                 <div className="px-6 py-3 border-b border-white/[0.04] bg-background">
                   <div className="flex items-center gap-2 mb-2.5">
                     <Sparkles className="w-4 h-4 text-neon-purple" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-neon-purple">Autocompletes</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {aiSuggestions.map((s, i) => (
                       <button key={i} onClick={() => setMessageText(s)} className="text-xs px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-all font-medium truncate max-w-sm shadow-sm">
                         {s}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Entry Terminal */}
                 <div className="px-6 py-4 bg-white/[0.01]">
                   <div className="flex items-center gap-3">
                     <button className="p-2.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-all"><Paperclip className="w-5 h-5" /></button>
                     <input
                       value={messageText}
                       onChange={e => setMessageText(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                       className="flex-1 bg-white/[0.03] border border-white/[0.08] shadow-inner rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-neon-cyan/50 focus:bg-white/[0.05] transition-all"
                       placeholder={filter === 'email' ? `Reply via Email to ${customerProfile.name}…` : `Message ${customerProfile.name} via WhatsApp…`}
                     />
                     <button className="p-2.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-all"><Smile className="w-5 h-5" /></button>
                     <button disabled={sending || !messageText.trim()} onClick={handleSendMessage} className="p-3.5 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple text-background shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/40 transition-all scale-100 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:grayscale">
                       {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center bg-background/50">
            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-lg">
                <MessageSquare className="w-8 h-8 text-neon-cyan/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Select a customer from the inbox to orchestrate communication.</p>
          </div>
        )}
      </div>
    </div>
  );
}
