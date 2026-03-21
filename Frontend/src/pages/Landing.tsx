import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HeroCanvas from "@/components/three/HeroCanvas";
import FeatureIcon3D from "@/components/three/FeatureIcon3D";
import FlowCanvas from "@/components/three/FlowCanvas";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .landing-root {
   --pink: #1a3cc4;
    --pink-glow: #2d55f5;
    --pink-light: rgba(26,60,196,0.08);
    --cyan: #007a8c;
    --dark: #18182a;
    --text: #1a1a2e;
    --text-muted: #5a5a7a;
    --bg: #f2f3fa;
    --bg2: #e9eaf5;
    --card: #ffffff;
    --border: rgba(214,0,106,0.12);
    --mono: 'Space Mono', monospace;
    --display: 'Bebas Neue', sans-serif;
    --body: 'Syne', sans-serif;
    font-family: var(--body);
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    min-height: 100vh;
    cursor: none;
    position: relative;
  }
  .landing-root * { box-sizing: border-box; margin: 0; padding: 0; }

  /* CURSOR */
  .lc-cursor {
    width: 12px; height: 12px;
    background: var(--pink); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
  }
  .lc-cursor-ring {
    width: 36px; height: 36px;
    border: 1.5px solid var(--pink); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9998; opacity: 0.4;
  }

  /* BANKING SVG BACKGROUND */
  .lc-bg-svg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    width: 100%; height: 100%;
  }

  /* ANIMATED NODES */
  .lc-node { animation: lc-nodePulse 3s ease-in-out infinite; }
  @keyframes lc-nodePulse {
    0%, 100% { opacity: 0.12; }
    50% { opacity: 0.35; }
  }

  /* ANIMATED DATA LINES */
  .lc-dash-line {
    stroke-dasharray: 8 14;
    animation: lc-dashMove 3s linear infinite;
  }
  .lc-dash-line-slow {
    stroke-dasharray: 6 18;
    animation: lc-dashMove 5s linear infinite;
  }
  @keyframes lc-dashMove {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -88; }
  }

  .lc-float1 { animation: lc-float 6s ease-in-out infinite; }
  .lc-float2 { animation: lc-float 8s ease-in-out infinite reverse; }
  .lc-float3 { animation: lc-float 7s ease-in-out 1s infinite; }
  @keyframes lc-float {
    0%, 100% { transform: translateY(0px); opacity: 0.04; }
    50%       { transform: translateY(-16px); opacity: 0.09; }
  }

  /* SUBTLE GRID */
  .lc-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(214,0,106,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(214,0,106,0.05) 1px, transparent 1px);
    background-size: 64px 64px;
  }

  /* LIGHT ORBS */
  .lc-orb1 {
    position: fixed; bottom: -140px; right: -120px;
    width: 560px; height: 560px; border-radius: 50%; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(214,0,106,0.10) 0%, transparent 70%);
  }
  .lc-orb2 {
    position: fixed; top: 0; left: -100px;
    width: 400px; height: 400px; border-radius: 50%; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(0,122,140,0.07) 0%, transparent 70%);
  }
  .lc-orb3 {
    position: fixed; top: 40%; right: 10%;
    width: 300px; height: 300px; border-radius: 50%; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(214,0,106,0.06) 0%, transparent 70%);
  }

  /* NAV */
  .lc-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 16px 48px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(214,0,106,0.12);
    backdrop-filter: blur(16px);
    background: rgba(242,243,250,0.88);
  }
  .lc-logo {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--mono); font-size: 0.92rem; font-weight: 700;
    letter-spacing: 0.06em; color: var(--text);
  }
  .lc-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--pink), var(--cyan));
    border-radius: 8px; display: flex; align-items: center;
    justify-content: center; font-size: 16px;
  }
  .lc-logo-text span { color: var(--pink); }
  .lc-logo-sub {
    font-family: var(--mono); font-size: 0.52rem;
    letter-spacing: 0.16em; opacity: 0.4; display: block; margin-top: 2px;
  }
  .lc-nav-links {
    display: flex; gap: 36px; list-style: none;
    font-family: var(--mono); font-size: 0.73rem; letter-spacing: 0.1em;
  }
  .lc-nav-links a {
    color: var(--text-muted); text-decoration: none;
    transition: color 0.2s;
  }
  .lc-nav-links a:hover { color: var(--pink); }
  .lc-nav-btns { display: flex; gap: 12px; align-items: center; }
  .lc-btn-outline {
    padding: 9px 22px; border: 1.5px solid rgba(214,0,106,0.3);
    background: transparent; color: var(--pink); font-family: var(--mono);
    font-size: 0.72rem; letter-spacing: 0.1em; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .lc-btn-outline:hover { border-color: var(--pink); background: rgba(214,0,106,0.06); }
  .lc-btn-primary {
    padding: 9px 22px; background: var(--pink); border: none;
    color: #fff; font-family: var(--mono); font-size: 0.72rem;
    font-weight: 700; letter-spacing: 0.1em; cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .lc-btn-primary:hover {
    background: var(--pink-glow); transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(214,0,106,0.25);
  }

  /* HERO */
  .lc-hero {
    position: relative; z-index: 10;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 80px;
  }
  .lc-hero-eyebrow {
    font-family: var(--mono); font-size: 0.68rem;
    letter-spacing: 0.28em; background: var(--pink); color: #fff;
    padding: 5px 18px; margin-bottom: 32px; text-transform: uppercase;
    animation: lc-fadeUp 0.6s 0.1s both;
  }
  .lc-hero-title {
    font-family: var(--display);
    font-size: clamp(4rem, 13vw, 11rem);
    line-height: 0.88; letter-spacing: -0.01em; color: var(--pink);
    text-shadow: 0 2px 40px rgba(214,0,106,0.18);
    animation: lc-titleIn 0.9s cubic-bezier(0.16,1,0.3,1) both;
  }
  .lc-hero-title:hover {
    text-shadow: 4px 0 rgba(0,122,140,0.4), -4px 0 rgba(214,0,106,0.4);
  }
  @keyframes lc-titleIn {
    from { opacity: 0; transform: translateY(38px) skewX(-3deg); }
    to   { opacity: 1; transform: translateY(0) skewX(0); }
  }
  .lc-hero-sub {
    font-family: var(--display);
    font-size: clamp(1.2rem, 3vw, 2.5rem);
    letter-spacing: 0.1em; color: var(--text-muted);
    margin-top: 10px;
    animation: lc-fadeUp 0.7s 0.3s both;
  }
  .lc-hero-desc {
    margin-top: 40px; max-width: 560px;
    border: 1.5px solid rgba(214,0,106,0.15);
    background: var(--card);
    box-shadow: 0 4px 24px rgba(214,0,106,0.06);
    padding: 24px 30px;
    text-align: left; font-size: 0.93rem; line-height: 1.78;
    font-weight: 500; color: var(--text-muted);
    animation: lc-fadeUp 0.7s 0.45s both;
    border-radius: 2px;
  }
  .lc-hero-desc strong { color: var(--text); }
  .lc-hero-btns {
    margin-top: 38px; display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
    animation: lc-fadeUp 0.7s 0.6s both;
  }
  @keyframes lc-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lc-btn-hero-primary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 32px; background: var(--pink); color: #fff;
    font-family: var(--mono); font-size: 0.78rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; border: none; border-radius: 2px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .lc-btn-hero-primary:hover {
    background: var(--pink-glow); transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(214,0,106,0.28);
  }
  .lc-btn-hero-secondary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 32px; border: 2px solid rgba(26,26,42,0.25); color: var(--text);
    background: transparent; font-family: var(--mono); font-size: 0.78rem;
    letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px;
    transition: border-color 0.2s, color 0.2s, transform 0.15s;
  }
  .lc-btn-hero-secondary:hover { border-color: var(--pink); color: var(--pink); transform: translateY(-2px); }

  /* DIVIDER */
  .lc-divider {
    width: 100%; height: 1px; position: relative; z-index: 10;
    background: linear-gradient(90deg, transparent, rgba(214,0,106,0.25), transparent);
  }

  /* SECTION */
  .lc-section {
    position: relative; z-index: 10;
    padding: 90px 48px; max-width: 1200px; margin: 0 auto;
  }
  .lc-section-tag {
    font-family: var(--mono); font-size: 0.68rem;
    letter-spacing: 0.28em; color: var(--pink);
    margin-bottom: 14px; text-transform: uppercase;
  }
  .lc-section-title {
    font-family: var(--display);
    font-size: clamp(2.4rem, 5vw, 4.2rem);
    letter-spacing: 0.02em; line-height: 0.92; margin-bottom: 52px;
    color: var(--text);
  }
  .lc-accent { color: var(--pink); }

  /* FEATURES */
  .lc-features-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 3px;
  }
  .lc-feature-card {
    border: 1px solid rgba(214,0,106,0.1);
    background: var(--card);
    box-shadow: 0 2px 16px rgba(26,26,42,0.06);
    padding: 36px 28px; position: relative; overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
    border-radius: 2px;
  }
  .lc-feature-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(214,0,106,0.04) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s;
  }
  .lc-feature-card:hover::before { opacity: 1; }
  .lc-feature-card:hover {
    border-color: rgba(214,0,106,0.25);
    box-shadow: 0 8px 32px rgba(214,0,106,0.10);
    transform: translateY(-2px);
  }
  .lc-feature-num {
    position: absolute; top: 16px; right: 20px;
    font-family: var(--display); font-size: 3.5rem;
    color: rgba(214,0,106,0.06);
  }
  .lc-feature-icon { font-size: 1.6rem; margin-bottom: 14px; }
  .lc-feature-title {
    font-family: var(--mono); font-size: 0.78rem;
    letter-spacing: 0.14em; color: var(--pink);
    margin-bottom: 10px; text-transform: uppercase;
  }
  .lc-feature-desc { font-size: 0.88rem; line-height: 1.68; color: var(--text-muted); }

  /* STEPS */
  .lc-steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .lc-step-card {
    padding: 38px 34px;
    border: 1px solid rgba(214,0,106,0.09);
    background: var(--card);
    box-shadow: 0 2px 12px rgba(26,26,42,0.05);
    border-radius: 2px;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .lc-step-card:hover {
    box-shadow: 0 6px 24px rgba(214,0,106,0.09);
    transform: translateY(-2px);
  }
  .lc-step-num {
    font-family: var(--display); font-size: 5rem;
    color: var(--pink); opacity: 0.45;
    line-height: 1; margin-bottom: 10px;
    text-shadow: 0 2px 12px rgba(214,0,106,0.15);
  }
  .lc-step-title {
    font-family: var(--mono); font-size: 0.82rem;
    letter-spacing: 0.14em; color: var(--cyan);
    margin-bottom: 10px; text-transform: uppercase;
  }
  .lc-step-desc { font-size: 0.88rem; line-height: 1.65; color: var(--text-muted); }

  /* FOOTER */
  .lc-footer {
    position: relative; z-index: 10;
    padding: 30px 48px;
    border-top: 1px solid rgba(214,0,106,0.1);
    background: var(--bg2);
    display: flex; justify-content: space-between; align-items: center;
    font-family: var(--mono); font-size: 0.68rem; color: var(--text-muted);
  }
  .lc-footer-brand {
    font-family: var(--display); font-size: 0.95rem;
    letter-spacing: 0.15em; color: var(--pink);
  }
  .lc-footer-live { color: var(--pink); font-weight: 700; }

  @media (max-width: 768px) {
    .lc-nav { padding: 14px 20px; }
    .lc-nav-links { display: none; }
    .lc-section { padding: 60px 20px; }
    .lc-steps-grid { grid-template-columns: 1fr; }
    .lc-footer { flex-direction: column; gap: 10px; text-align: center; padding: 24px 20px; }
    .lc-hero { padding: 100px 20px 60px; }
  }
`;

const FEATURES = [
  { num: "01", icon: "💬", shape: "inbox", title: "Unified Inbox", desc: "Manage WhatsApp, Email, SMS, and Calls from one intelligent dashboard — no context switching, no missed messages." },
  { num: "02", icon: "🧠", shape: "brain", title: "AI Sentiment Engine", desc: "Real-time sentiment analysis on every customer message so your team always knows how to respond." },
  { num: "03", icon: "⚡", shape: "lightning", title: "Intent Detection", desc: "Automatically classify messages as support, complaint, query, or transaction — and route them instantly." },
  { num: "04", icon: "🔗", shape: "database", title: "Context Memory", desc: "Persistent conversation history across all channels. Your AI remembers everything your customers have said." },
];

const STEPS = [
  { num: "01", title: "Connect Channels", desc: "Link WhatsApp, Email, SMS, and call systems in minutes with zero code required." },
  { num: "02", title: "AI Processes Everything", desc: "Every inbound message is analyzed for sentiment, intent, and context in real time." },
  { num: "03", title: "Smart Routing", desc: "Conversations are assigned to the right agent or automated flow automatically." },
  { num: "04", title: "Respond & Improve", desc: "Track response quality, measure sentiment trends, and continuously improve service." },
];

function BankingBackground() {
  return (
    <svg
      className="lc-bg-svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="nodeGlowL" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d6006a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d6006a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cyanGlowL" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#007a8c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#007a8c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <line x1="80"  y1="200" x2="420"  y2="200" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="420" y1="200" x2="420"  y2="340" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="420" y1="340" x2="720"  y2="340" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="720" y1="200" x2="720"  y2="560" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="720" y1="560" x2="1100" y2="560" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="1100" y1="200" x2="1100" y2="560" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="900" y1="100" x2="1200" y2="100" stroke="#007a8c" strokeWidth="0.7" strokeOpacity="0.10" />
      <line x1="1200" y1="100" x2="1380" y2="280" stroke="#007a8c" strokeWidth="0.7" strokeOpacity="0.10" />
      <line x1="200" y1="600" x2="560"  y2="600" stroke="#007a8c" strokeWidth="0.6" strokeOpacity="0.09" />

      <line x1="80"  y1="200" x2="420"  y2="200" stroke="#d6006a" strokeWidth="1.4" strokeOpacity="0.22" className="lc-dash-line" />
      <line x1="720" y1="340" x2="1100" y2="340" stroke="#d6006a" strokeWidth="1.2" strokeOpacity="0.18" className="lc-dash-line" style={{ animationDelay: "0.8s" }} />
      <line x1="900" y1="100" x2="1200" y2="100" stroke="#007a8c" strokeWidth="1"   strokeOpacity="0.16" className="lc-dash-line-slow" style={{ animationDelay: "1.4s" }} />
      <line x1="200" y1="600" x2="560"  y2="600" stroke="#007a8c" strokeWidth="1"   strokeOpacity="0.14" className="lc-dash-line-slow" style={{ animationDelay: "2s" }} />

      {[
        { cx: 80, cy: 200 }, { cx: 420, cy: 200 }, { cx: 420, cy: 340 },
        { cx: 720, cy: 200 }, { cx: 720, cy: 340 }, { cx: 720, cy: 560 },
        { cx: 1100, cy: 200 }, { cx: 1100, cy: 560 },
        { cx: 560, cy: 600 }, { cx: 200, cy: 600 },
      ].map((n, i) => (
        <g key={i} className="lc-node">
          <circle cx={n.cx} cy={n.cy} r="14" fill="url(#nodeGlowL)" opacity="0.3" />
          <circle cx={n.cx} cy={n.cy} r="4" fill="#d6006a" opacity="0.35" />
          <circle cx={n.cx} cy={n.cy} r="2" fill="#d6006a" opacity="0.7" />
        </g>
      ))}

      {[{ cx: 900, cy: 100 }, { cx: 1200, cy: 100 }, { cx: 1380, cy: 280 }].map((n, i) => (
        <g key={`c${i}`} className="lc-node" style={{ animationDelay: `${i * 0.7}s` }}>
          <circle cx={n.cx} cy={n.cy} r="12" fill="url(#cyanGlowL)" opacity="0.25" />
          <circle cx={n.cx} cy={n.cy} r="3.5" fill="#007a8c" opacity="0.35" />
          <circle cx={n.cx} cy={n.cy} r="1.5" fill="#007a8c" opacity="0.7" />
        </g>
      ))}

      <rect x="400" y="185" width="40" height="30" rx="3" fill="none" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.18" />
      <rect x="700" y="325" width="40" height="30" rx="3" fill="none" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.15" />
      <rect x="880" y="85"  width="40" height="30" rx="3" fill="none" stroke="#007a8c" strokeWidth="0.8" strokeOpacity="0.15" />
      <rect x="1080" y="185" width="40" height="30" rx="3" fill="none" stroke="#d6006a" strokeWidth="0.8" strokeOpacity="0.14" />

      <text x="150" y="450" fontFamily="Georgia,serif" fontSize="80" fill="#d6006a" fillOpacity="0.05" className="lc-float1">₹</text>
      <text x="1180" y="680" fontFamily="Georgia,serif" fontSize="90" fill="#d6006a" fillOpacity="0.04" className="lc-float2">$</text>
      <text x="980"  y="800" fontFamily="Georgia,serif" fontSize="65" fill="#007a8c" fillOpacity="0.05" className="lc-float3">€</text>
      <text x="60"   y="760" fontFamily="Georgia,serif" fontSize="68" fill="#007a8c" fillOpacity="0.04" className="lc-float3">%</text>

      <g opacity="0.045" transform="translate(1060,580)">
        <rect x="0"   y="200" width="300" height="18" fill="#d6006a" />
        <rect x="18"  y="185" width="264" height="15" fill="#d6006a" />
        <rect x="36"  y="172" width="228" height="13" fill="#d6006a" />
        {[56,102,148,194,240].map((x,i)=>(
          <rect key={i} x={x} y="60" width="16" height="112" fill="#d6006a" />
        ))}
        <polygon points="0,60 150,10 300,60" fill="#d6006a" />
        <rect x="0" y="55" width="300" height="7" fill="#d6006a" />
      </g>

      <g opacity="0.055" transform="translate(1340,60)">
        <path d="M40 0 L80 15 L80 50 C80 72 60 88 40 95 C20 88 0 72 0 50 L0 15 Z"
          fill="none" stroke="#007a8c" strokeWidth="2" />
        <path d="M25 48 L36 60 L58 35" fill="none" stroke="#007a8c" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g opacity="0.065" transform="translate(30,640)">
        <line x1="0" y1="0"   x2="0"   y2="160" stroke="#d6006a" strokeWidth="0.8" />
        <line x1="0" y1="160" x2="200" y2="160" stroke="#d6006a" strokeWidth="0.8" />
        {[
          { x:14,  o:100, c:60,  h:50,  l:110, up:false },
          { x:44,  o:60,  c:30,  h:22,  l:68,  up:true  },
          { x:74,  o:30,  c:75,  h:20,  l:82,  up:false },
          { x:104, o:75,  c:45,  h:38,  l:85,  up:true  },
          { x:134, o:45,  c:20,  h:12,  l:52,  up:true  },
          { x:164, o:20,  c:55,  h:10,  l:62,  up:false },
        ].map((c,i)=>(
          <g key={i}>
            <line x1={c.x+9} y1={c.h} x2={c.x+9} y2={c.l} stroke="#d6006a" strokeWidth="1.2" />
            <rect x={c.x} y={Math.min(c.o,c.c)} width="18"
              height={Math.abs(c.o-c.c)||3}
              fill={c.up ? "#007a8c" : "#d6006a"} />
          </g>
        ))}
      </g>

      <g opacity="0.055" transform="translate(1110,650)">
        <circle cx="55" cy="55" r="50" fill="none" stroke="#d6006a" strokeWidth="11"
          strokeDasharray="170 164" />
        <circle cx="55" cy="55" r="50" fill="none" stroke="#007a8c" strokeWidth="11"
          strokeDasharray="95 239" strokeDashoffset="-170" />
        <circle cx="55" cy="55" r="33" fill="#f2f3fa" />
      </g>

      <g opacity="0.065" transform="translate(1285,385)">
        <path d="M0 55 Q28 0 56 55"   fill="none" stroke="#007a8c" strokeWidth="2"   strokeLinecap="round" />
        <path d="M-14 70 Q28-16 70 70" fill="none" stroke="#007a8c" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-28 85 Q28-32 84 85" fill="none" stroke="#007a8c" strokeWidth="1"   strokeLinecap="round" />
        <circle cx="28" cy="55" r="3.5" fill="#007a8c" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    document.body.style.cursor = "none";
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current)
        cursorRef.current.style.transform = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`;
    };
    document.addEventListener("mousemove", onMove);
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      document.body.style.cursor = "auto";
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="landing-root">
      <style>{styles}</style>

      <div ref={cursorRef} className="lc-cursor" />
      <div ref={ringRef} className="lc-cursor-ring" />

      <BankingBackground />
      <div className="lc-grid" />
      <div className="lc-orb1" />
      <div className="lc-orb2" />
      <div className="lc-orb3" />

      {/* 3D HERO CANVAS */}
      <HeroCanvas />

      {/* NAV */}
      <nav className="lc-nav">
        <div className="lc-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <div className="lc-logo-icon">⚡</div>
          <div>
            <div className="lc-logo-text">ConvoSphere <span>AI</span></div>
            <span className="lc-logo-sub">UNION BANK · OMNICHANNEL PLATFORM</span>
          </div>
        </div>
        <ul className="lc-nav-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Dashboard</a></li>
          <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}>Features</a></li>
          <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}>How it Works</a></li>
        </ul>
        <div className="lc-nav-btns">
          <button className="lc-btn-outline" onClick={() => navigate("/login")}>Log In</button>
          <button className="lc-btn-primary" onClick={() => navigate("/dashboard")}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="lc-hero">
        <div className="lc-hero-eyebrow">⚡ AI-Powered · Multi-Channel · Real-Time</div>
        <div className="lc-hero-title">CONVOSPHERE</div>
        <div className="lc-hero-sub">UNIFY EVERY CONVERSATION WITH INTELLIGENCE</div>
        <div className="lc-hero-desc">
          One platform to manage <strong>WhatsApp, Email, SMS, and Calls</strong> — powered by AI
          that understands <strong>context, sentiment, and intent</strong>. Built for Union Bank's
          next generation of customer communication.
        </div>
        <div className="lc-hero-btns">
          <button className="lc-btn-hero-primary" onClick={() => navigate("/dashboard")}>⚡ Explore Platform →</button>
          <button className="lc-btn-hero-secondary" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>▶ Watch Demo</button>
        </div>
      </div>

      <div className="lc-divider" />

      {/* FEATURES */}
      <div id="features" className="lc-section">
        <div className="lc-section-tag">— Platform Features —</div>
        <div className="lc-section-title">
          BUILT FOR <span className="lc-accent">MODERN BANKING</span>
        </div>
        <div className="lc-features-grid">
          {FEATURES.map((f) => (
            <div key={f.num} className="lc-feature-card">
              <div className="lc-feature-num">{f.num}</div>
              <FeatureIcon3D shape={f.shape} />
              <div className="lc-feature-icon md:hidden">{f.icon}</div>
              <div className="lc-feature-title">{f.title}</div>
              <div className="lc-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lc-divider" />

      {/* HOW IT WORKS */}
      <div id="how-it-works" className="lc-section">
        <div className="lc-section-tag">— How It Works —</div>
        <div className="lc-section-title">
          FROM CHAOS <span className="lc-accent">TO CLARITY</span>
        </div>

        {/* 3D Flow Visualization */}
        <FlowCanvas />

        <div className="lc-steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="lc-step-card">
              <div className="lc-step-num">{s.num}</div>
              <div className="lc-step-title">{s.title}</div>
              <div className="lc-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lc-footer">
        <div>© 2026 Union Bank of India. All rights reserved.</div>
        <div className="lc-footer-brand">CONVOSPHERE AI</div>
        <div>STATUS: <span className="lc-footer-live">LIVE</span></div>
      </footer>
    </div>
  );
}
