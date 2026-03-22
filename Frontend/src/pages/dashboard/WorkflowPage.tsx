import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, GitBranch, Brain, Route, Shield, Send, BarChart3,
  ArrowRight, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  CreditCard, Landmark, UserCheck, FileText, PhoneCall, Bell, Lock
} from "lucide-react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .wf-root {
    --green:      #2db84e;
    --green-mid:  #4ec76e;
    --green-deep: #1a5c2e;
    --green-sage: #a8f0b8;
    --green-glow: rgba(45,184,78,0.15);
    --bg:         #f7fbf8;
    --bg-card:    #ffffff;
    --text:       #0d1f13;
    --text-muted: #3d6b4a;
    --text-dim:   #7aab88;
    --mono:       'Space Mono', monospace;
    --display:    'Bebas Neue', sans-serif;
    --body:       'Syne', sans-serif;
    font-family: var(--body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 32px 40px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .wf-grid-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(45,184,78,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45,184,78,0.05) 1px, transparent 1px);
    background-size: 64px 64px;
  }
  .wf-blob { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; filter: blur(70px); }
  .wf-blob-1 { width:380px;height:380px;bottom:-60px;right:-60px;background:linear-gradient(135deg,rgba(78,199,110,0.18),rgba(26,92,46,0.10)); }
  .wf-blob-2 { width:280px;height:280px;top:40px;left:-50px;background:linear-gradient(135deg,rgba(45,184,78,0.12),rgba(168,240,184,0.06)); }

  .wf-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }

  .wf-header { margin-bottom: 40px; }
  .wf-tag { font-family:var(--mono);font-size:0.64rem;letter-spacing:0.28em;color:var(--green);text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;margin-bottom:12px; }
  .wf-tag::before { content:'';display:inline-block;width:22px;height:1.5px;background:var(--green); }
  .wf-title { font-family:var(--display);font-size:clamp(2.8rem,6vw,5rem);line-height:0.9;letter-spacing:0.02em;background:linear-gradient(135deg,#0b2e14,#1a5c2e,#2db84e,#4ec76e,#a8f0b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px; }
  .wf-subtitle { font-size:0.95rem;line-height:1.75;color:var(--text-muted);max-width:680px;font-weight:500; }
  .wf-subtitle strong { color:var(--green); }

  .wf-section-label { font-family:var(--mono);font-size:0.64rem;letter-spacing:0.24em;color:var(--text-dim);text-transform:uppercase;margin-bottom:20px;display:flex;align-items:center;gap:10px; }
  .wf-section-label::after { content:'';flex:1;height:1px;background:rgba(45,184,78,0.12); }

  .wf-tabs { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px; }
  .wf-tab { font-family:var(--mono);font-size:0.65rem;letter-spacing:0.12em;padding:8px 16px;border-radius:4px;cursor:pointer;transition:all 0.2s;border:1px solid rgba(45,184,78,0.20);color:var(--text-muted);background:#fff;text-transform:uppercase; }
  .wf-tab.active, .wf-tab:hover { background:rgba(45,184,78,0.10);border-color:var(--green);color:var(--green); }

  .wf-scenario-card { background:#fff;border:1px solid rgba(45,184,78,0.16);border-radius:12px;padding:28px 28px 24px;margin-bottom:48px;position:relative;overflow:hidden;box-shadow:0 4px 24px rgba(45,184,78,0.07); }
  .wf-scenario-card::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#0b2e14,#2db84e,#4ec76e,transparent); }
  .wf-scenario-header { display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;flex-wrap:wrap; }
  .wf-scenario-badge { display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:0.60rem;letter-spacing:0.16em;padding:4px 12px;border-radius:20px;text-transform:uppercase;background:rgba(45,184,78,0.10);border:1px solid rgba(45,184,78,0.22);color:var(--green);white-space:nowrap; }
  .wf-scenario-badge.alert { background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.22);color:#dc2626; }
  .wf-scenario-badge.warn  { background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.22);color:#d97706; }
  .wf-scenario-title { font-family:var(--display);font-size:clamp(1.4rem,2.5vw,2rem);letter-spacing:0.04em;color:var(--text);line-height:1; }
  .wf-scenario-subtitle { font-size:0.82rem;color:var(--text-muted);margin-top:4px; }

  .wf-scenario-flow { display:flex;align-items:stretch;gap:0;overflow-x:auto;padding-bottom:8px;margin-bottom:20px; }
  .wf-flow-node { flex-shrink:0;width:140px;background:#fff;border:1px solid rgba(45,184,78,0.14);border-radius:8px;padding:16px 12px;text-align:center;box-shadow:0 2px 8px rgba(45,184,78,0.05);transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s; }
  .wf-flow-node:hover { transform:translateY(-4px);border-color:rgba(45,184,78,0.30);box-shadow:0 10px 24px rgba(45,184,78,0.12); }
  .wf-flow-node.highlight { border-color:rgba(45,184,78,0.35);background:rgba(45,184,78,0.04); }
  .wf-flow-node.alert-node { border-color:rgba(239,68,68,0.25);background:rgba(239,68,68,0.03); }
  .wf-flow-icon { width:40px;height:40px;border-radius:8px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;background:rgba(45,184,78,0.09);border:1px solid rgba(45,184,78,0.15); }
  .wf-flow-icon.alert-icon { background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.18); }
  .wf-flow-title { font-family:var(--mono);font-size:0.65rem;font-weight:700;letter-spacing:0.10em;color:var(--text);margin-bottom:4px; }
  .wf-flow-sub { font-size:0.68rem;line-height:1.45;color:var(--text-muted); }
  .wf-flow-arrow { display:flex;align-items:center;padding:0 4px;flex-shrink:0;align-self:center; }
  .wf-flow-arrow-line { width:24px;height:1.5px;background:linear-gradient(90deg,rgba(45,184,78,0.25),rgba(45,184,78,0.55)); }
  .wf-flow-arrow-head { width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:6px solid rgba(45,184,78,0.55); }

  .wf-outcome-row { display:flex;gap:10px;flex-wrap:wrap;margin-top:4px; }
  .wf-outcome-chip { display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:6px;font-size:0.78rem;font-weight:500;line-height:1.4;border:1px solid rgba(45,184,78,0.18);background:rgba(45,184,78,0.06);color:var(--text-muted); }
  .wf-outcome-chip.green { background:rgba(45,184,78,0.10);border-color:rgba(45,184,78,0.28);color:#1a5c2e; }
  .wf-outcome-chip.red   { background:rgba(239,68,68,0.07);border-color:rgba(239,68,68,0.20);color:#b91c1c; }
  .wf-outcome-chip.amber { background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.22);color:#92400e; }

  .wf-usecase-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:48px; }
  .wf-usecase-card { background:#fff;border:1px solid rgba(45,184,78,0.12);border-radius:10px;padding:22px 20px;position:relative;overflow:hidden;box-shadow:0 2px 10px rgba(45,184,78,0.05);transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s; }
  .wf-usecase-card:hover { transform:translateY(-4px);border-color:rgba(45,184,78,0.28);box-shadow:0 12px 30px rgba(45,184,78,0.10); }
  .wf-usecase-bar { position:absolute;bottom:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,#4ec76e,#1a5c2e);transition:width 0.4s; }
  .wf-usecase-card:hover .wf-usecase-bar { width:100%; }
  .wf-usecase-top { display:flex;align-items:center;gap:12px;margin-bottom:14px; }
  .wf-usecase-icon { width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(45,184,78,0.09);border:1px solid rgba(45,184,78,0.16);flex-shrink:0; }
  .wf-usecase-label { font-family:var(--mono);font-size:0.68rem;font-weight:700;letter-spacing:0.12em;color:var(--text);text-transform:uppercase; }
  .wf-usecase-channel { font-family:var(--mono);font-size:0.58rem;letter-spacing:0.10em;color:var(--text-dim);margin-top:2px; }
  .wf-usecase-body { font-size:0.82rem;line-height:1.7;color:var(--text-muted);margin-bottom:14px; }
  .wf-usecase-steps { display:flex;flex-direction:column;gap:7px; }
  .wf-usecase-step { display:flex;align-items:flex-start;gap:9px;font-size:0.77rem;line-height:1.55;color:var(--text-muted); }
  .wf-step-num-badge { width:18px;height:18px;border-radius:50%;background:rgba(45,184,78,0.12);border:1px solid rgba(45,184,78,0.22);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:0.55rem;color:var(--green);flex-shrink:0;margin-top:1px; }

  .wf-compliance-table { width:100%;border-collapse:collapse;margin-bottom:48px;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(45,184,78,0.06); }
  .wf-compliance-table th { font-family:var(--mono);font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;padding:13px 16px;background:rgba(45,184,78,0.07);color:var(--text-muted);border-bottom:1px solid rgba(45,184,78,0.14);text-align:left; }
  .wf-compliance-table td { padding:12px 16px;font-size:0.81rem;color:var(--text-muted);border-bottom:1px solid rgba(45,184,78,0.07);background:#fff;line-height:1.55; }
  .wf-compliance-table tr:last-child td { border-bottom:none; }
  .wf-compliance-table tr:hover td { background:rgba(45,184,78,0.03); }
  .wf-pill { display:inline-flex;align-items:center;padding:2px 10px;border-radius:20px;font-family:var(--mono);font-size:0.58rem;letter-spacing:0.10em;font-weight:700; }
  .wf-pill.auto    { background:rgba(45,184,78,0.12);color:#1a5c2e; }
  .wf-pill.manual  { background:rgba(245,158,11,0.10);color:#92400e; }
  .wf-pill.blocked { background:rgba(239,68,68,0.08);color:#b91c1c; }

  .wf-impact-strip { background:linear-gradient(135deg,#e8f5e9 0%,#f0faf2 50%,#e6f4ea 100%);border:1px solid rgba(45,184,78,0.16);border-radius:14px;padding:32px 28px;margin-bottom:48px;position:relative;overflow:hidden; }
  .wf-impact-strip::after { content:'';position:absolute;bottom:-40px;right:-30px;width:200px;height:200px;border-radius:50%;background:linear-gradient(135deg,rgba(78,199,110,0.25),rgba(26,92,46,0.12));filter:blur(36px);pointer-events:none; }
  .wf-impact-title { font-family:var(--display);font-size:clamp(1.6rem,3vw,2.4rem);letter-spacing:0.04em;color:var(--text);margin-bottom:22px;line-height:1; }
  .wf-impact-title span { background:linear-gradient(135deg,#0b2e14,#2db84e,#a8f0b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .wf-impact-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;position:relative;z-index:1; }
  .wf-impact-item { background:rgba(255,255,255,0.80);border:1px solid rgba(45,184,78,0.14);border-radius:8px;padding:16px;text-align:center; }
  .wf-impact-num { font-family:var(--display);font-size:2.2rem;letter-spacing:0.04em;background:linear-gradient(135deg,#4ec76e,#1a5c2e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:4px; }
  .wf-impact-label { font-family:var(--mono);font-size:0.58rem;letter-spacing:0.14em;color:var(--text-muted);text-transform:uppercase; }

  .wf-helps-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:48px; }
  .wf-helps-card { background:#fff;border:1px solid rgba(45,184,78,0.12);border-radius:10px;padding:20px 18px;box-shadow:0 2px 8px rgba(45,184,78,0.05); }
  .wf-helps-card-title { font-family:var(--mono);font-size:0.65rem;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px; }
  .wf-helps-card-title span { background:linear-gradient(90deg,#2db84e,#1a5c2e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .wf-helps-list { display:flex;flex-direction:column;gap:9px; }
  .wf-helps-row { display:flex;align-items:flex-start;gap:9px; }
  .wf-check { color:var(--green);flex-shrink:0;margin-top:2px; }
  .wf-helps-text { font-size:0.80rem;line-height:1.6;color:var(--text-muted); }
  .wf-helps-text strong { color:var(--text);font-weight:600; }

  @media(max-width:900px){ .wf-helps-grid{grid-template-columns:1fr 1fr;} .wf-root{padding:20px 16px 60px;} }
  @media(max-width:600px){ .wf-helps-grid{grid-template-columns:1fr;} }
`;

const scenarios = [
  {
    id: "fraud", badge: "alert", badgeLabel: "Fraud Alert",
    title: "SUSPECTED FRAUDULENT TRANSACTION",
    subtitle: "Customer reports an unauthorised debit of ₹48,000 via WhatsApp at 11:42 PM",
    nodes: [
      { icon: MessageSquare, title: "WhatsApp",   sub: "Customer sends 'I did not make this transaction'",        highlight: false, alert: false },
      { icon: Brain,         title: "AI Engine",  sub: "Fraud keyword detected + high negative sentiment",        highlight: true,  alert: false },
      { icon: Bell,          title: "Escalation", sub: "Auto-flagged Priority 1 — fraud category",               highlight: true,  alert: false },
      { icon: Route,         title: "Routing",    sub: "Bypasses standard queue — direct to Fraud Response Team", highlight: false, alert: false },
      { icon: Lock,          title: "Compliance", sub: "Account freeze workflow triggered for review",            highlight: false, alert: true  },
      { icon: Send,          title: "Response",   sub: "Agent responds + automated FIR reference number shared",  highlight: false, alert: false },
    ],
    outcomes: [
      { label: "Response time: under 4 minutes", type: "green" },
      { label: "Account freeze initiated",        type: "amber" },
      { label: "Full audit trail created",        type: "green" },
    ],
  },
  {
    id: "loan", badge: "normal", badgeLabel: "Loan Enquiry",
    title: "HOME LOAN PRE-APPROVAL REQUEST",
    subtitle: "Existing customer enquires about home loan eligibility via Email on a weekday morning",
    nodes: [
      { icon: MessageSquare, title: "Email",    sub: "Customer emails re: home loan for ₹45L property",             highlight: false, alert: false },
      { icon: GitBranch,     title: "Hub",      sub: "Linked to customer's existing savings account thread",         highlight: false, alert: false },
      { icon: Brain,         title: "AI Engine",sub: "Intent: Loan Enquiry. Sentiment: Positive / eager",            highlight: true,  alert: false },
      { icon: UserCheck,     title: "Routing",  sub: "Assigned to Home Loan specialist — Branch: Thane West",        highlight: false, alert: false },
      { icon: Send,          title: "Response", sub: "Eligibility checklist + document list sent within 6 minutes",  highlight: false, alert: false },
      { icon: BarChart3,     title: "Insights", sub: "Logged as qualified lead — tracked in analytics dashboard",    highlight: false, alert: false },
    ],
    outcomes: [
      { label: "Lead captured & assigned", type: "green" },
      { label: "Agent responded in 6 min", type: "green" },
      { label: "Conversion tracked",       type: "green" },
    ],
  },
  {
    id: "dnd", badge: "warn", badgeLabel: "Compliance Block",
    title: "OUTBOUND CAMPAIGN — DND REGISTRY CHECK",
    subtitle: "Branch attempts to send a loan offer SMS to 1,200 customers — 84 are on the DND list",
    nodes: [
      { icon: FileText,  title: "Campaign",  sub: "Branch initiates SMS loan offer to 1,200 numbers",              highlight: false, alert: false },
      { icon: Shield,    title: "DND Check", sub: "TRAI DND registry cross-check run on all numbers in real time",  highlight: true,  alert: false },
      { icon: Lock,      title: "Blocked",   sub: "84 numbers flagged — messages held, compliance officer notified",highlight: false, alert: true  },
      { icon: UserCheck, title: "Approval",  sub: "Compliance officer reviews flagged list before any action",      highlight: false, alert: false },
      { icon: Send,      title: "Delivery",  sub: "Remaining 1,116 messages delivered with consent stamp",          highlight: false, alert: false },
      { icon: BarChart3, title: "Audit Log", sub: "Full delivery report with timestamps archived for RBI review",   highlight: false, alert: false },
    ],
    outcomes: [
      { label: "84 DND violations prevented",    type: "red"   },
      { label: "1,116 compliant deliveries sent", type: "green" },
      { label: "RBI-ready audit trail archived",  type: "green" },
    ],
  },
];

const useCases = [
  {
    icon: CreditCard, label: "Credit Card Dispute", channel: "WhatsApp · SMS",
    body: "A customer disputes a ₹12,000 charge on their Union Bank credit card. The AI detects the dispute intent and negative sentiment, classifies it as a financial complaint, and routes it to the Cards Dispute team — all before a human reads the message.",
    steps: ["Customer sends WhatsApp message with transaction screenshot", "AI classifies: Complaint → Credit Card → High Priority", "Auto-routed to Cards Dispute team with 2-hour SLA flag", "Agent responds with dispute reference number and resolution timeline"],
  },
  {
    icon: Landmark, label: "Locker Appointment Booking", channel: "Voice · SMS",
    body: "A senior citizen customer calls to book a bank locker appointment at their home branch. Voice transcription is processed, intent is detected as 'branch service', and the nearest available slot is confirmed via SMS — without the customer needing to call back.",
    steps: ["IVR transcribes customer request for locker appointment", "AI intent: Branch Service → Locker → Thane Main Branch", "System checks branch calendar and confirms available slot", "Confirmation SMS sent with branch address, date, and time"],
  },
  {
    icon: PhoneCall, label: "Balance & Mini-Statement", channel: "WhatsApp · IVR",
    body: "High-volume self-service queries such as balance checks and mini-statements are resolved by the AI without agent involvement — freeing agents to focus on complex or sensitive cases that genuinely require human judgment.",
    steps: ["Customer sends 'balance' on WhatsApp Business number", "AI classifies: Self-Service → Balance → Auto-resolve", "Masked balance fetched via core banking API integration", "Balance delivered to customer in under 8 seconds, no agent needed"],
  },
  {
    icon: FileText, label: "KYC Document Submission", channel: "Email · WhatsApp",
    body: "A customer submits updated KYC documents ahead of a regulatory deadline. The AI detects the attachment, classifies the intent as compliance-related, and routes it to the KYC Operations team — logging receipt with a timestamped acknowledgement sent to the customer.",
    steps: ["Customer emails Aadhaar + PAN scans for KYC update", "AI classifies: Compliance → KYC → Document Submission", "Routed to KYC Ops with auto-acknowledgement sent to customer", "Document logged with timestamp for regulatory audit trail"],
  },
  {
    icon: TrendingUp, label: "Fixed Deposit Renewal", channel: "SMS · Email",
    body: "15 days before an FD maturity date, the system proactively contacts the customer on their preferred channel. If they express interest in renewal, the AI routes them to a Relationship Manager with full FD history context — no manual follow-up required.",
    steps: ["System triggers FD maturity reminder 15 days in advance", "Customer responds 'renew for 1 year' via SMS", "AI intent: FD Renewal → Existing Customer → High Value flag", "Assigned to Relationship Manager with complete FD history"],
  },
  {
    icon: AlertTriangle, label: "EMI Overdue — Distress Detection", channel: "SMS · WhatsApp",
    body: "When a home loan EMI is missed, a personalised reminder is sent rather than a generic alert. If the customer responds indicating financial difficulty, the AI detects distress signals and routes them to the Loan Restructuring team before the case escalates.",
    steps: ["EMI overdue detected — personalised reminder sent on Day 1", "Customer responds: 'lost job, unable to pay this month'", "AI flags: Financial Distress → Loan Restructuring referral", "Specialist contacts customer with moratorium options before NPA"],
  },
];

const complianceRows = [
  { scenario: "Outbound promotional SMS campaign",       check: "TRAI DND Registry scan",                action: "Block DND numbers — notify compliance officer",    type: "blocked" },
  { scenario: "Customer consent for WhatsApp comms",     check: "Consent database lookup",               action: "Auto-approve if valid consent record exists",      type: "auto"    },
  { scenario: "Financial complaint above ₹10,000",       check: "RBI grievance classification",          action: "Escalate with mandatory 48-hour SLA trigger",      type: "auto"    },
  { scenario: "Loan offer to dormant account holder",    check: "Account status + consent flag check",   action: "Hold for Relationship Manager approval",           type: "manual"  },
  { scenario: "Customer-submitted KYC document",        check: "Document type & format validation",     action: "Route to KYC Ops + timestamp acknowledgement",    type: "auto"    },
  { scenario: "Fraud or suspicious keyword detected",    check: "Fraud keyword + sentiment analysis",    action: "Flag Priority 1 + alert Fraud Response Team",      type: "auto"    },
  { scenario: "Bulk broadcast campaign (500+ numbers)",  check: "Maker-checker authorisation workflow",  action: "Hold until approved by Branch Head or Compliance", type: "manual"  },
];

const impactStats = [
  { num: "84%",  label: "Faster first response" },
  { num: "0",    label: "DND violations" },
  { num: "₹0",   label: "Compliance penalties" },
  { num: "4×",   label: "Channels covered" },
  { num: "24/7", label: "AI availability" },
  { num: "100%", label: "Audit coverage" },
];

const benefitData = [
  {
    icon: UserCheck, title: "Agents & Front-line Staff",
    items: [
      ["No manual triage",       "AI classifies and routes every message before an agent reads it."],
      ["Context on arrival",     "Agent sees customer history, sentiment, and intent before responding."],
      ["Faster resolutions",     "AI-suggested replies reduce average handle time significantly."],
      ["Fewer escalations",      "Urgent cases are auto-flagged — agents focus on what matters most."],
    ],
  },
  {
    icon: TrendingUp, title: "Branch Managers & Supervisors",
    items: [
      ["Live queue visibility",     "Real-time view of all conversations, SLA timers, and agent workloads."],
      ["Sentiment trend reports",   "Identify dissatisfied customers before they escalate or churn."],
      ["Agent performance data",    "Response times, resolution rates, and CSAT score per agent."],
      ["Campaign outcome tracking", "Delivery rates, response rates, and conversion metrics per channel."],
    ],
  },
  {
    icon: Shield, title: "Compliance & IT Teams",
    items: [
      ["Zero DND violations",       "Every outbound message is checked against the TRAI DND registry automatically."],
      ["RBI-ready audit trails",    "Every action timestamped and logged — exportable for regulatory review."],
      ["Maker-checker workflows",   "Bulk campaigns require authorisation before any message is dispatched."],
      ["Data residency compliance", "All customer data processed within India — no cross-border data transfer."],
    ],
  },
];

export default function WorkflowPage() {
  const [activeScenario, setActiveScenario] = useState(0);

  return (
    <div className="wf-root">
      <style>{styles}</style>
      <div className="wf-grid-bg" />
      <div className="wf-blob wf-blob-1" />
      <div className="wf-blob wf-blob-2" />

      <div className="wf-inner">

        {/* Header */}
        <motion.div className="wf-header" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55 }}>
          <div className="wf-tag">Union Bank · ConvoSphere AI</div>
          <h1 className="wf-title">BANKING<br />USE CASES</h1>
          <p className="wf-subtitle">
            How ConvoSphere AI handles <strong>real customer interactions</strong> across Union Bank —
            from fraud alerts and loan enquiries to compliance-critical outbound campaigns
            and KYC submissions. Every scenario below reflects an actual banking workflow.
          </p>
        </motion.div>

        {/* Live Scenario Walkthroughs */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
          <div className="wf-section-label">Live scenario walkthroughs — select a case</div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
          <div className="wf-tabs">
            {scenarios.map((s, i) => (
              <div key={s.id} className={`wf-tab${activeScenario === i ? " active" : ""}`} onClick={() => setActiveScenario(i)}>
                {s.badgeLabel}
              </div>
            ))}
          </div>
        </motion.div>

        {scenarios.map((s, si) =>
          activeScenario === si ? (
            <motion.div key={s.id} className="wf-scenario-card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.38 }}>
              <div className="wf-scenario-header">
                <div className={`wf-scenario-badge${s.badge === "alert" ? " alert" : s.badge === "warn" ? " warn" : ""}`}>
                  {s.badge === "alert" ? <AlertTriangle size={10}/> : s.badge === "warn" ? <Shield size={10}/> : <CheckCircle2 size={10}/>}
                  {s.badgeLabel}
                </div>
                <div>
                  <div className="wf-scenario-title">{s.title}</div>
                  <div className="wf-scenario-subtitle">{s.subtitle}</div>
                </div>
              </div>
              <div className="wf-scenario-flow">
                {s.nodes.map((node, ni) => (
                  <motion.div key={ni} style={{ display:"flex", alignItems:"center" }}
                    initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
                    transition={{ delay: ni * 0.07, duration:0.32 }}>
                    <div className={`wf-flow-node${node.highlight?" highlight":""}${node.alert?" alert-node":""}`}>
                      <div className={`wf-flow-icon${node.alert?" alert-icon":""}`}>
                        <node.icon size={17} color={node.alert ? "#dc2626" : "#2db84e"} />
                      </div>
                      <div className="wf-flow-title">{node.title}</div>
                      <div className="wf-flow-sub">{node.sub}</div>
                    </div>
                    {ni < s.nodes.length - 1 && (
                      <div className="wf-flow-arrow">
                        <div className="wf-flow-arrow-line"/>
                        <div className="wf-flow-arrow-head"/>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="wf-outcome-row">
                {s.outcomes.map((o) => (
                  <div key={o.label} className={`wf-outcome-chip ${o.type}`}>
                    {o.type === "green" ? <CheckCircle2 size={13}/> : o.type === "red" ? <AlertTriangle size={13}/> : <Clock size={13}/>}
                    {o.label}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null
        )}

        {/* Use Case Cards */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}>
          <div className="wf-section-label">Common banking interaction types — how each is handled</div>
        </motion.div>

        <div className="wf-usecase-grid">
          {useCases.map((uc, i) => (
            <motion.div key={uc.label} className="wf-usecase-card"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: 0.4 + i * 0.07, duration:0.4 }}>
              <div className="wf-usecase-top">
                <div className="wf-usecase-icon"><uc.icon size={18} color="#2db84e"/></div>
                <div>
                  <div className="wf-usecase-label">{uc.label}</div>
                  <div className="wf-usecase-channel">{uc.channel}</div>
                </div>
              </div>
              <p className="wf-usecase-body">{uc.body}</p>
              <div className="wf-usecase-steps">
                {uc.steps.map((step, si) => (
                  <div key={si} className="wf-usecase-step">
                    <div className="wf-step-num-badge">{si + 1}</div>
                    {step}
                  </div>
                ))}
              </div>
              <div className="wf-usecase-bar"/>
            </motion.div>
          ))}
        </div>

        {/* Compliance Table */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}>
          <div className="wf-section-label">Compliance gate — how outbound messages are governed</div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}>
          <table className="wf-compliance-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Compliance Check</th>
                <th>System Action</th>
                <th>Handling</th>
              </tr>
            </thead>
            <tbody>
              {complianceRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.scenario}</td>
                  <td>{row.check}</td>
                  <td>{row.action}</td>
                  <td><span className={`wf-pill ${row.type}`}>{row.type === "auto" ? "Automated" : row.type === "manual" ? "Manual Review" : "Blocked"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Impact Stats */}
        <motion.div className="wf-impact-strip" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
          <div className="wf-impact-title">MEASURED <span>OUTCOMES</span></div>
          <div className="wf-impact-grid">
            {impactStats.map((s, i) => (
              <motion.div key={s.label} className="wf-impact-item"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.65 + i * 0.06 }}>
                <div className="wf-impact-num">{s.num}</div>
                <div className="wf-impact-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stakeholder Benefits */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}>
          <div className="wf-section-label">How this platform benefits each stakeholder</div>
        </motion.div>

        <div className="wf-helps-grid">
          {benefitData.map((group, gi) => (
            <motion.div key={group.title} className="wf-helps-card"
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.72 + gi * 0.07 }}>
              <div className="wf-helps-card-title">
                <group.icon size={13} color="#2db84e"/>
                <span>{group.title}</span>
              </div>
              <div className="wf-helps-list">
                {group.items.map(([title, body]) => (
                  <div key={title} className="wf-helps-row">
                    <CheckCircle2 size={13} className="wf-check"/>
                    <div className="wf-helps-text"><strong>{title}</strong> — {body}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9 }}
          style={{ background:"#fff", border:"1px solid rgba(45,184,78,0.16)", borderRadius:"12px", padding:"26px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"16px", boxShadow:"0 4px 20px rgba(45,184,78,0.07)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:"linear-gradient(90deg,transparent,#2db84e,#4ec76e,transparent)" }}/>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.62rem", letterSpacing:"0.22em", color:"#2db84e", textTransform:"uppercase", marginBottom:"6px" }}>Ready to proceed</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem", letterSpacing:"0.04em", color:"#0d1f13", lineHeight:1 }}>VIEW LIVE CONVERSATIONS ON YOUR DASHBOARD</div>
            <div style={{ fontSize:"0.81rem", color:"#3d6b4a", marginTop:"6px" }}>Monitor active customer interactions, SLA timers, and agent queues in real time.</div>
          </div>
          <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
            <button style={{ padding:"11px 22px", background:"linear-gradient(135deg,#4ec76e,#1a5c2e)", border:"none", color:"#fff", fontFamily:"'Space Mono',monospace", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", borderRadius:"6px", cursor:"pointer", boxShadow:"0 4px 16px rgba(45,184,78,0.28)", display:"flex", alignItems:"center", gap:"8px" }}>
              Open Dashboard <ArrowRight size={13}/>
            </button>
            <button style={{ padding:"11px 22px", background:"transparent", border:"1.5px solid rgba(45,184,78,0.30)", color:"#2db84e", fontFamily:"'Space Mono',monospace", fontSize:"0.68rem", letterSpacing:"0.12em", borderRadius:"6px", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}>
              <FileText size={13}/> Export Audit Report
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}