import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeatureIcon3D from "@/components/three/FeatureIcon3D";
import FlowCanvas from "@/components/three/FlowCanvas";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .landing-root {
    --green:      #2db84e;
    --green-mid:  #4ec76e;
    --green-deep: #1a5c2e;
    --green-light:#e8f5e9;
    --green-glow: rgba(45,184,78,0.15);
    --bg:         #f7fbf8;
    --bg2:        #edf7f0;
    --bg-card:    #ffffff;
    --text:       #0d1f13;
    --text-muted: #3d6b4a;
    --text-dim:   #7aab88;
    --border:     rgba(45,184,78,0.14);
    --border-hi:  rgba(45,184,78,0.32);
    --mono:       'Space Mono', monospace;
    --display:    'Bebas Neue', sans-serif;
    --body:       'Syne', sans-serif;
    font-family: var(--body);
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    min-height: 100vh;
    cursor: none;
    position: relative;
  }
  .landing-root * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── CURSOR ── */
  .lc-cursor {
    width: 10px; height: 10px;
    background: var(--green); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    box-shadow: 0 0 12px var(--green), 0 0 24px var(--green-glow);
  }
  .lc-cursor-ring {
    width: 34px; height: 34px;
    border: 1.5px solid var(--green); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9998; opacity: 0.4;
  }

  /* ── NOISE GRAIN ── */
  .lc-grain {
    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.018;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
  }

  /* ── SPOTLIGHT ── */
  .lc-spotlight {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 75% 55% at 50% -10%, rgba(45,184,78,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 50% 40% at 88% 95%,  rgba(26,92,46,0.08)  0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 5%  65%,  rgba(13,61,26,0.07)  0%, transparent 55%);
  }

  /* ── GRID ── */
  .lc-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(45,184,78,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45,184,78,0.06) 1px, transparent 1px);
    background-size: 72px 72px;
  }

  /* ── SVG BG ── */
  .lc-bg-svg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    width: 100%; height: 100%;
  }
  .lc-node { animation: lc-nodePulse 3.5s ease-in-out infinite; }
  @keyframes lc-nodePulse { 0%,100%{opacity:0.12}50%{opacity:0.35} }
  .lc-dash-line { stroke-dasharray:8 16; animation:lc-dashMove 4s linear infinite; }
  .lc-dash-slow { stroke-dasharray:5 20; animation:lc-dashMove 7s linear infinite; }
  @keyframes lc-dashMove { from{stroke-dashoffset:0} to{stroke-dashoffset:-96} }
  .lc-float1 { animation:lc-float 7s ease-in-out infinite; }
  .lc-float2 { animation:lc-float 9s ease-in-out infinite reverse; }
  .lc-float3 { animation:lc-float 8s ease-in-out 1.2s infinite; }
  @keyframes lc-float {
    0%,100%{transform:translateY(0);opacity:0.06}
    50%{transform:translateY(-18px);opacity:0.14}
  }

  /* ── BLOBS ── */
  .lc-blob {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
    filter: blur(60px);
  }
  .lc-blob-1 {
    width: 420px; height: 420px;
    bottom: -80px; right: -80px;
    background: linear-gradient(135deg, rgba(78,199,110,0.22), rgba(26,92,46,0.12));
  }
  .lc-blob-2 {
    width: 320px; height: 320px;
    top: 60px; left: -60px;
    background: linear-gradient(135deg, rgba(45,184,78,0.14), rgba(168,240,184,0.08));
  }
  .lc-blob-3 {
    width: 240px; height: 240px;
    top: 45%; right: 8%;
    background: radial-gradient(circle, rgba(78,199,110,0.10) 0%, transparent 70%);
  }

  /* ── SPHERE ── */
  .lc-sphere-wrap {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2; pointer-events: none;
    width: min(700px, 90vw); height: min(700px, 90vw);
  }
  .lc-sphere-canvas { width: 100%; height: 100%; }

  /* ── NAV ── */
  .lc-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 16px 52px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(45,184,78,0.12);
    backdrop-filter: blur(20px) saturate(1.6);
    background: rgba(247,251,248,0.90);
    box-shadow: 0 1px 20px rgba(45,184,78,0.06);
  }
  .lc-logo {
    display: flex; align-items: center; gap: 13px;
    font-family: var(--mono); font-size: 0.9rem; font-weight: 700;
    letter-spacing: 0.07em; color: var(--text); text-decoration: none;
  }
  .lc-logo-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #4ec76e, #1a5c2e);
    border-radius: 9px; display: flex; align-items: center;
    justify-content: center; font-size: 17px;
    box-shadow: 0 4px 16px rgba(45,184,78,0.30);
  }
  .lc-logo-text span { color: var(--green); }
  .lc-logo-sub {
    font-family: var(--mono); font-size: 0.50rem;
    letter-spacing: 0.18em; opacity: 0.45; display: block; margin-top: 2px;
    color: var(--text-muted);
  }
  .lc-nav-links {
    display: flex; gap: 38px; list-style: none;
    font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.12em;
  }
  .lc-nav-links a {
    color: var(--text-muted); text-decoration: none;
    transition: color 0.2s; cursor: none; position: relative;
  }
  .lc-nav-links a::after {
    content:''; position:absolute; bottom:-3px; left:0; right:0;
    height:1.5px; background:var(--green); transform:scaleX(0); transition:transform 0.25s;
  }
  .lc-nav-links a:hover { color: var(--green); }
  .lc-nav-links a:hover::after { transform: scaleX(1); }
  .lc-nav-btns { display: flex; gap: 12px; align-items: center; }
  .lc-btn-outline {
    padding: 9px 24px; border: 1.5px solid rgba(45,184,78,0.35);
    background: transparent; color: var(--green); font-family: var(--mono);
    font-size: 0.71rem; letter-spacing: 0.12em; cursor: none;
    transition: all 0.2s; border-radius: 4px;
  }
  .lc-btn-outline:hover {
    border-color: var(--green); background: rgba(45,184,78,0.08);
    box-shadow: 0 0 14px rgba(45,184,78,0.12);
  }
  .lc-btn-primary {
    padding: 9px 24px;
    background: linear-gradient(135deg, #4ec76e, #1a5c2e);
    border: none; color: #fff; font-family: var(--mono); font-size: 0.71rem;
    font-weight: 700; letter-spacing: 0.12em; cursor: none;
    transition: transform 0.15s, box-shadow 0.2s, filter 0.2s; border-radius: 4px;
    box-shadow: 0 4px 16px rgba(45,184,78,0.28);
  }
  .lc-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(45,184,78,0.38); filter: brightness(1.05);
  }

  /* ══ HERO ══ */
  .lc-hero {
    position: relative; z-index: 10;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 130px 24px 90px;
    overflow: hidden;
  }

  /* PAIN PHASE */
  .lc-pain-phase {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 5;
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .lc-pain-phase.hidden { opacity: 0; transform: scale(0.95); pointer-events: none; }

  .lc-pain-line {
    font-family: var(--mono);
    font-size: clamp(0.9rem, 2.2vw, 1.3rem);
    letter-spacing: 0.06em;
    color: #a0c4aa;
    line-height: 2.2;
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 0.5s ease, transform 0.5s ease, color 0.4s ease;
  }
  .lc-pain-line.visible { opacity: 1; transform: translateY(0); }
  .lc-pain-line.struck {
    color: #c8dfc9;
    text-decoration: line-through;
    text-decoration-color: var(--green);
    text-decoration-thickness: 2px;
  }
  .lc-pain-boom {
    margin-top: 32px;
    font-family: var(--mono); font-size: 0.75rem;
    letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--green);
    opacity: 0; transform: translateY(10px) scale(0.95);
    transition: opacity 0.5s ease, transform 0.5s ease;
    display: flex; align-items: center; gap: 10px;
  }
  .lc-pain-boom.visible { opacity: 1; transform: translateY(0) scale(1); }
  .lc-pain-boom-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 10px var(--green), 0 0 20px var(--green-glow);
    animation: lc-blink 1s ease-in-out infinite;
  }

  /* REVEAL PHASE */
  .lc-reveal-phase {
    position: relative; z-index: 4;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; width: 100%;
    opacity: 0; transform: translateY(30px) scale(0.97);
    transition: opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1);
    pointer-events: none;
  }
  .lc-reveal-phase.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

  .lc-hero-eyebrow {
    font-family: var(--mono); font-size: 0.67rem; letter-spacing: 0.32em;
    background: linear-gradient(90deg, #4ec76e, #1a5c2e);
    color: #fff; padding: 5px 20px; margin-bottom: 36px; text-transform: uppercase;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(45,184,78,0.25);
  }
  .lc-hero-title {
    font-family: var(--display);
    font-size: clamp(4.5rem, 14vw, 12rem);
    line-height: 0.87; letter-spacing: -0.01em;
    background: linear-gradient(160deg, #0b2e14 0%, #1a5c2e 25%, #2db84e 55%, #4ec76e 75%, #a8f0b8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    filter: drop-shadow(0 4px 24px rgba(45,184,78,0.18));
  }
  .lc-hero-sub {
    font-family: var(--display);
    font-size: clamp(1.1rem, 2.8vw, 2.3rem);
    letter-spacing: 0.14em; color: var(--text-muted); margin-top: 12px;
  }
  .lc-hero-desc {
    margin-top: 44px; max-width: 580px;
    border: 1px solid rgba(45,184,78,0.18);
    background: rgba(255,255,255,0.80);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 40px rgba(45,184,78,0.10), inset 0 1px 0 rgba(78,199,110,0.10);
    padding: 26px 32px;
    text-align: left; font-size: 0.94rem; line-height: 1.82;
    font-weight: 500; color: var(--text-muted);
    border-radius: 10px; position: relative;
  }
  .lc-hero-desc::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px; border-radius:10px 10px 0 0;
    background:linear-gradient(90deg,transparent,#2db84e,transparent); opacity:0.5;
  }
  .lc-hero-desc strong { color: var(--green); }
  .lc-hero-btns {
    margin-top: 42px; display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
  }
  .lc-btn-hero-primary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 36px;
    background: linear-gradient(135deg, #4ec76e 0%, #2db84e 50%, #1a5c2e 100%);
    color: #fff; font-family: var(--mono); font-size: 0.78rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    cursor: none; border: none; border-radius: 6px;
    transition: transform 0.18s, box-shadow 0.2s, filter 0.2s;
    position: relative; overflow: hidden;
    box-shadow: 0 6px 28px rgba(45,184,78,0.32);
  }
  .lc-btn-hero-primary::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent);
    opacity:0; transition:opacity 0.2s;
  }
  .lc-btn-hero-primary:hover::before { opacity:1; }
  .lc-btn-hero-primary:hover {
    transform:translateY(-3px);
    box-shadow:0 14px 40px rgba(45,184,78,0.40);
    filter:brightness(1.06);
  }
  .lc-btn-hero-secondary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 36px; border: 1.5px solid rgba(45,184,78,0.30); color: var(--green);
    background: rgba(45,184,78,0.06); font-family: var(--mono); font-size: 0.78rem;
    letter-spacing: 0.14em; text-transform: uppercase; cursor: none; border-radius: 6px;
    transition: all 0.2s;
  }
  .lc-btn-hero-secondary:hover {
    border-color:var(--green); background:rgba(45,184,78,0.12);
    transform:translateY(-3px); box-shadow:0 8px 24px rgba(45,184,78,0.14);
  }

  @keyframes lc-blink { 0%,100%{opacity:1}50%{opacity:0.3} }

  /* ── STATS ── */
  .lc-stats {
    position: relative; z-index: 10;
    display: flex; justify-content: center;
    border-top: 1px solid rgba(45,184,78,0.12);
    border-bottom: 1px solid rgba(45,184,78,0.12);
    background: rgba(255,255,255,0.70); backdrop-filter: blur(12px);
    box-shadow: 0 4px 30px rgba(45,184,78,0.06);
  }
  .lc-stat {
    flex:1; max-width:260px; padding:32px 24px; text-align:center;
    border-right:1px solid rgba(45,184,78,0.10); transition:background 0.2s;
  }
  .lc-stat:last-child { border-right:none; }
  .lc-stat:hover { background:rgba(45,184,78,0.05); }
  .lc-stat-num {
    font-family:var(--display); font-size:3rem; letter-spacing:0.04em;
    background:linear-gradient(135deg, #4ec76e, #1a5c2e);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    line-height:1; margin-bottom:6px;
  }
  .lc-stat-label {
    font-family:var(--mono); font-size:0.62rem;
    letter-spacing:0.20em; color:var(--text-muted); text-transform:uppercase;
  }

  /* ── DIVIDER ── */
  .lc-divider {
    width:100%; height:1px; position:relative; z-index:10;
    background:linear-gradient(90deg,transparent,rgba(45,184,78,0.22),transparent);
  }

  /* ── SECTION ── */
  .lc-section {
    position:relative; z-index:10;
    padding:100px 52px; max-width:1240px; margin:0 auto;
  }
  .lc-section-tag {
    font-family:var(--mono); font-size:0.67rem;
    letter-spacing:0.30em; color:var(--green);
    margin-bottom:16px; text-transform:uppercase;
    display:flex; align-items:center; gap:10px;
  }
  .lc-section-tag::before {
    content:''; display:inline-block; width:28px; height:1.5px;
    background:var(--green); opacity:0.7;
  }
  .lc-section-title {
    font-family:var(--display);
    font-size:clamp(2.6rem,5.5vw,4.6rem);
    letter-spacing:0.02em; line-height:0.92; margin-bottom:56px; color:var(--text);
  }

  /* ── UPDATED ACCENT — Spectrasoft green gradient ── */
  .lc-accent {
    background: linear-gradient(135deg, #0b2e14, #1e7a38, #3dd160, #a8f0b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── FEATURES ── */
  .lc-features-grid {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:2px;
  }
  .lc-feature-card {
    background: #ffffff;
    border: 1px solid rgba(45,184,78,0.12);
    border-radius: 4px;
    padding: 36px 26px 40px;
    position: relative; overflow: hidden; cursor: pointer;
    transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1), border-color 0.28s, box-shadow 0.28s;
    box-shadow: 0 2px 16px rgba(45,184,78,0.06);
  }
  .lc-feature-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,#2db84e,transparent);
    opacity:0; transition:opacity 0.35s;
  }
  .lc-feature-card::after {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 90% 70% at 50% 0%,rgba(45,184,78,0.06) 0%,transparent 65%);
    opacity:0; transition:opacity 0.35s; pointer-events:none;
  }
  .lc-feature-card:hover {
    transform:translateY(-8px); border-color:rgba(45,184,78,0.30);
    box-shadow:0 20px 50px rgba(45,184,78,0.14),0 0 30px rgba(45,184,78,0.06);
  }
  .lc-feature-card:hover::before, .lc-feature-card:hover::after { opacity:1; }
  .lc-feature-card-bar {
    position:absolute; bottom:0; left:0; height:2px; width:0%;
    background:linear-gradient(90deg, #4ec76e, #1a5c2e);
    transition:width 0.45s cubic-bezier(0.4,0,0.2,1);
  }
  .lc-feature-card:hover .lc-feature-card-bar { width:100%; }
  .lc-feature-corner-dot {
    position:absolute; top:14px; right:14px; width:6px; height:6px; border-radius:50%;
    background:var(--green); opacity:0; box-shadow:0 0 8px var(--green); transition:opacity 0.3s;
  }
  .lc-feature-card:hover .lc-feature-corner-dot { opacity:0.85; }
  .lc-feature-num {
    position:absolute; top:14px; right:18px; font-family:var(--display); font-size:4.5rem;
    line-height:1; color:rgba(45,184,78,0.07); transition:color 0.3s; pointer-events:none;
  }
  .lc-feature-card:hover .lc-feature-num { color:rgba(45,184,78,0.13); }
  .lc-feature-icon-wrap {
    width:58px; height:58px; margin-bottom:20px; display:flex; align-items:center;
    justify-content:center; position:relative; border-radius:12px;
    background:rgba(45,184,78,0.08); border:1px solid rgba(45,184,78,0.16);
    transition:background 0.3s,border-color 0.3s,box-shadow 0.3s;
  }
  .lc-feature-card:hover .lc-feature-icon-wrap {
    background:rgba(45,184,78,0.14); border-color:rgba(45,184,78,0.32);
    box-shadow:0 0 20px rgba(45,184,78,0.18);
  }
  @keyframes lc-ring-pulse { 0%{opacity:0.5;transform:scale(1)}100%{opacity:0;transform:scale(1.55)} }
  .lc-feature-icon-ring {
    position:absolute; inset:0; border-radius:12px;
    border:1px solid rgba(45,184,78,0.35); animation:lc-ring-pulse 2s ease-out infinite; opacity:0;
  }
  .lc-feature-card:hover .lc-feature-icon-ring { opacity:0.5; }
  .lc-feature-title {
    font-family:var(--mono); font-size:0.72rem; letter-spacing:0.18em; color:var(--green);
    text-transform:uppercase; margin-bottom:12px; position:relative; z-index:1; transition:text-shadow 0.3s;
  }
  .lc-feature-card:hover .lc-feature-title { text-shadow:0 0 14px rgba(45,184,78,0.35); }
  .lc-feature-desc {
    font-size:0.87rem; line-height:1.76; color:var(--text-muted);
    position:relative; z-index:1; transition:color 0.3s;
  }
  .lc-feature-card:hover .lc-feature-desc { color:var(--text); }

  /* ── HIGHLIGHT BAND ── */
  .lc-highlight-band {
    position:relative; z-index:10; padding:80px 52px;
    background:linear-gradient(135deg, #e8f5e9 0%, #f0faf2 40%, #e6f4ea 100%);
    border-top:1px solid rgba(45,184,78,0.14);
    border-bottom:1px solid rgba(45,184,78,0.14); overflow:hidden;
  }
  .lc-highlight-band::before {
    content:''; position:absolute; top:-120px; left:50%; transform:translateX(-50%);
    width:700px; height:350px; border-radius:50%;
    background:radial-gradient(ellipse,rgba(45,184,78,0.12) 0%,transparent 70%);
    pointer-events:none;
  }
  .lc-highlight-band::after {
    content:''; position:absolute; bottom:-60px; right:-40px;
    width:280px; height:280px; border-radius:50%;
    background:linear-gradient(135deg, rgba(78,199,110,0.30), rgba(26,92,46,0.15));
    filter:blur(40px); pointer-events:none;
  }
  .lc-highlight-inner {
    max-width:1240px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between; gap:40px; flex-wrap:wrap;
    position:relative; z-index:1;
  }
  .lc-highlight-text { flex:1; min-width:280px; }
  .lc-highlight-title {
    font-family:var(--display); font-size:clamp(2rem,4vw,3.4rem);
    letter-spacing:0.04em; line-height:0.95; color:var(--text); margin-bottom:16px;
  }
  .lc-highlight-desc { font-size:0.92rem; line-height:1.75; color:var(--text-muted); max-width:460px; }
  .lc-highlight-cta {
    display:inline-flex; align-items:center; gap:10px; margin-top:28px; padding:13px 28px;
    background:transparent; border:1.5px solid rgba(45,184,78,0.35);
    color:var(--green); font-family:var(--mono); font-size:0.74rem;
    letter-spacing:0.14em; text-transform:uppercase; cursor:none;
    border-radius:6px; transition:all 0.2s;
  }
  .lc-highlight-cta:hover {
    background:rgba(45,184,78,0.10); border-color:var(--green);
    box-shadow:0 0 20px rgba(45,184,78,0.16);
  }
  .lc-highlight-badges { display:flex; flex-wrap:wrap; gap:12px; flex:0 0 auto; }
  .lc-badge {
    padding:10px 18px; background:rgba(255,255,255,0.80);
    border:1px solid rgba(45,184,78,0.18); border-radius:4px;
    font-family:var(--mono); font-size:0.68rem; letter-spacing:0.14em;
    color:var(--text-muted); text-transform:uppercase; transition:all 0.2s;
    box-shadow:0 2px 8px rgba(45,184,78,0.06);
  }
  .lc-badge:hover {
    border-color:rgba(45,184,78,0.35); color:var(--green);
    background:#fff; box-shadow:0 4px 16px rgba(45,184,78,0.12);
  }
  .lc-badge-dot {
    display:inline-block; width:6px; height:6px; border-radius:50%;
    background:var(--green); margin-right:8px;
    animation:lc-blink 2s ease-in-out infinite; box-shadow:0 0 6px var(--green);
  }

  /* ── STEPS ── */
  .lc-steps-grid { display:grid; grid-template-columns:1fr 1fr; gap:2px; }
  .lc-step-card {
    padding:42px 36px; border:1px solid rgba(45,184,78,0.10);
    background:#ffffff; border-radius:4px;
    transition:all 0.22s; position:relative; overflow:hidden;
    box-shadow:0 2px 12px rgba(45,184,78,0.06);
  }
  .lc-step-card::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,#2db84e,transparent);
    opacity:0; transition:opacity 0.3s;
  }
  .lc-step-card:hover::after { opacity:1; }
  .lc-step-card:hover {
    box-shadow:0 12px 40px rgba(45,184,78,0.14);
    transform:translateY(-3px); border-color:rgba(45,184,78,0.22);
  }
  .lc-step-num {
    font-family:var(--display); font-size:5.5rem;
    background:linear-gradient(135deg, #4ec76e, #1a5c2e);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    line-height:1; margin-bottom:12px;
  }
  .lc-step-title {
    font-family:var(--mono); font-size:0.80rem;
    letter-spacing:0.16em; color:var(--text-muted); margin-bottom:12px; text-transform:uppercase;
  }
  .lc-step-desc { font-size:0.89rem; line-height:1.68; color:var(--text-muted); }

  /* ── FOOTER ── */
  .lc-footer {
    position:relative; z-index:10; padding:32px 52px;
    border-top:1px solid rgba(45,184,78,0.12);
    background:linear-gradient(135deg,#e8f5e9,#f0faf2);
    display:flex; justify-content:space-between; align-items:center;
    font-family:var(--mono); font-size:0.67rem; color:var(--text-muted);
  }
  .lc-footer-brand {
    font-family:var(--display); font-size:1rem; letter-spacing:0.18em;
    background:linear-gradient(90deg, #4ec76e, #1a5c2e);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .lc-footer-live { color:var(--green); font-weight:700; }
  .lc-footer-live::before {
    content:''; display:inline-block; width:6px; height:6px; border-radius:50%;
    background:var(--green); margin-right:7px;
    animation:lc-blink 1.5s ease-in-out infinite; box-shadow:0 0 6px var(--green);
  }

  @media (max-width:768px) {
    .lc-nav { padding:14px 20px; }
    .lc-nav-links { display:none; }
    .lc-section { padding:64px 20px; }
    .lc-steps-grid { grid-template-columns:1fr; }
    .lc-footer { flex-direction:column; gap:12px; text-align:center; padding:24px 20px; }
    .lc-hero { padding:110px 20px 70px; min-height:100vh; }
    .lc-stats { flex-wrap:wrap; }
    .lc-stat { min-width:140px; }
    .lc-highlight-band { padding:60px 20px; }
    .lc-features-grid { grid-template-columns:1fr; }
    .lc-sphere-wrap { width:90vw; height:90vw; }
  }
`;

const PAIN_LINES = [
  "Switching between 5 different platforms...",
  "Messages falling through the cracks...",
  "No visibility. No context. No results.",
  "Your team is exhausted. Customers are frustrated.",
];

const FEATURES = [
  {
    num:"01", shape:"inbox", title:"Unified Inbox",
    desc:"Manage WhatsApp, Email, SMS, and Calls from one intelligent dashboard — no context switching, no missed messages.",
    svgIcon:(
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
        <rect x="2" y="6" width="24" height="16" rx="3" stroke="#2db84e" strokeWidth="1.5"/>
        <path d="M2 10l12 7 12-7" stroke="#2db84e" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="22" cy="7" r="3.5" fill="#2db84e" opacity="0.9"/>
      </svg>
    ),
  },
  {
    num:"02", shape:"brain", title:"AI Sentiment Engine",
    desc:"Real-time sentiment analysis on every customer message so your team always knows how to respond.",
    svgIcon:(
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
        <circle cx="14" cy="13" r="9" stroke="#2db84e" strokeWidth="1.5"/>
        <path d="M10 16c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" stroke="#2db84e" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10.5" cy="11" r="1.2" fill="#2db84e"/>
        <circle cx="17.5" cy="11" r="1.2" fill="#2db84e"/>
        <path d="M14 4v2M14 20v2M4 13h2M20 13h2" stroke="#2db84e" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    num:"03", shape:"lightning", title:"Intent Detection",
    desc:"Automatically classify messages as support, complaint, query, or transaction — and route them instantly.",
    svgIcon:(
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
        <polygon points="14,3 26,24 2,24" stroke="#2db84e" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="14" y1="10" x2="14" y2="17" stroke="#2db84e" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="14" cy="20.5" r="1.3" fill="#2db84e"/>
      </svg>
    ),
  },
  {
    num:"04", shape:"database", title:"Context Memory",
    desc:"Persistent conversation history across all channels. Your AI remembers everything your customers have said.",
    svgIcon:(
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
        <ellipse cx="14" cy="7"  rx="10" ry="3.5" stroke="#2db84e" strokeWidth="1.5"/>
        <ellipse cx="14" cy="14" rx="10" ry="3.5" stroke="#2db84e" strokeWidth="1.5"/>
        <ellipse cx="14" cy="21" rx="10" ry="3.5" stroke="#2db84e" strokeWidth="1.5"/>
        <line x1="4"  y1="7"  x2="4"  y2="21" stroke="#2db84e" strokeWidth="1.5"/>
        <line x1="24" y1="7"  x2="24" y2="21" stroke="#2db84e" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

const STEPS = [
  { num:"01", title:"Connect Channels",        desc:"Link WhatsApp, Email, SMS, and call systems in minutes with zero code required." },
  { num:"02", title:"AI Processes Everything", desc:"Every inbound message is analyzed for sentiment, intent, and context in real time." },
  { num:"03", title:"Smart Routing",           desc:"Conversations are assigned to the right agent or automated flow automatically." },
  { num:"04", title:"Respond & Improve",       desc:"Track response quality, measure sentiment trends, and continuously improve service." },
];
const STATS = [
  { num:"99.9%", label:"Uptime SLA" },
  { num:"4",     label:"Channels Unified" },
  { num:"<120ms",label:"AI Response Time" },
  { num:"360°",  label:"Customer View" },
];
const BADGES = ["WhatsApp Business","Email SMTP","SMS Gateway","Voice API","AI Engine","Compliance Ready"];

/* ── rotating sphere ── */
function RotatingSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const DPR  = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = canvas.offsetWidth;
    canvas.width  = SIZE * DPR;
    canvas.height = SIZE * DPR;
    ctx.scale(DPR, DPR);
    const cx = SIZE / 2, cy = SIZE / 2, R = SIZE * 0.42;
    const LAT = 10, LON = 14;
    let angle = 0;

    function draw(t: number) {
      ctx.clearRect(0, 0, SIZE, SIZE);

      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.15);
      outerGlow.addColorStop(0,   "rgba(45,184,78,0.0)");
      outerGlow.addColorStop(0.7, "rgba(45,184,78,0.05)");
      outerGlow.addColorStop(1,   "rgba(45,184,78,0.14)");
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow; ctx.fill();

      for (let i = 1; i < LAT; i++) {
        const phi = (i / LAT) * Math.PI;
        const y3d = Math.cos(phi), rRing = Math.sin(phi);
        const yScr = cy + R * y3d, rScr = R * rRing;
        if (rScr < 1) continue;
        const depth = (y3d + 1) / 2, alpha = 0.07 + depth * 0.28;
        const grad = ctx.createLinearGradient(cx - rScr, yScr, cx + rScr, yScr);
        grad.addColorStop(0,   `rgba(13,61,26,${alpha * 0.3})`);
        grad.addColorStop(0.4, `rgba(45,184,78,${alpha})`);
        grad.addColorStop(0.6, `rgba(45,184,78,${alpha})`);
        grad.addColorStop(1,   `rgba(13,61,26,${alpha * 0.3})`);
        ctx.beginPath();
        ctx.ellipse(cx, yScr, rScr, rScr * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = grad; ctx.lineWidth = depth > 0.6 ? 1.1 : 0.6; ctx.stroke();
      }

      for (let i = 0; i < LON; i++) {
        const lon = (i / LON) * Math.PI * 2 + t;
        ctx.beginPath(); let first = true;
        for (let j = 0; j <= 60; j++) {
          const phi = (j / 60) * Math.PI;
          const x3d = Math.sin(phi) * Math.cos(lon);
          const y3d = Math.cos(phi);
          const xScr = cx + R * x3d, yScr = cy + R * y3d * 0.5;
          if (first) { ctx.moveTo(xScr, yScr); first = false; } else ctx.lineTo(xScr, yScr);
        }
        const facing = (Math.cos(lon) + 1) / 2, alpha = 0.05 + facing * 0.32;
        const grad2 = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
        grad2.addColorStop(0,   `rgba(13,61,26,${alpha * 0.3})`);
        grad2.addColorStop(0.4, `rgba(45,184,78,${alpha})`);
        grad2.addColorStop(0.6, `rgba(168,240,184,${alpha * 0.6})`);
        grad2.addColorStop(1,   `rgba(13,61,26,${alpha * 0.3})`);
        ctx.strokeStyle = grad2; ctx.lineWidth = facing > 0.6 ? 1.0 : 0.5; ctx.stroke();
      }

      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      const rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
      rim.addColorStop(0, "rgba(45,184,78,0)");
      rim.addColorStop(0.7,"rgba(45,184,78,0.04)");
      rim.addColorStop(1, "rgba(45,184,78,0.18)");
      ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.stroke();

      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
      cg.addColorStop(0, "rgba(45,184,78,0.04)");
      cg.addColorStop(1, "rgba(45,184,78,0)");
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = cg; ctx.fill();
    }

    function loop() { angle += 0.004; draw(angle); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} className="lc-sphere-canvas" />;
}

/* ── SVG background ── */
function LightBackground() {
  return (
    <svg className="lc-bg-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ngG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2db84e" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#2db84e" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="ngA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a5c2e" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#1a5c2e" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1a5c2e" stopOpacity="0.0"/>
          <stop offset="35%"  stopColor="#2db84e" stopOpacity="0.25"/>
          <stop offset="65%"  stopColor="#2db84e" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#1a5c2e" stopOpacity="0.0"/>
        </linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2db84e" stopOpacity="0.0"/>
          <stop offset="45%"  stopColor="#2db84e" stopOpacity="0.18"/>
          <stop offset="55%"  stopColor="#2db84e" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#2db84e" stopOpacity="0.0"/>
        </linearGradient>
        <linearGradient id="lg3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1a5c2e" stopOpacity="0.0"/>
          <stop offset="40%"  stopColor="#1a5c2e" stopOpacity="0.18"/>
          <stop offset="60%"  stopColor="#1a5c2e" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#1a5c2e" stopOpacity="0.0"/>
        </linearGradient>
      </defs>

      <line x1="80"   y1="200" x2="420"  y2="200" stroke="url(#lg1)" strokeWidth="1.2"/>
      <line x1="420"  y1="200" x2="420"  y2="350" stroke="url(#lg2)" strokeWidth="1.0"/>
      <line x1="420"  y1="350" x2="720"  y2="350" stroke="url(#lg1)" strokeWidth="1.0"/>
      <line x1="720"  y1="200" x2="720"  y2="560" stroke="url(#lg2)" strokeWidth="1.0"/>
      <line x1="720"  y1="560" x2="1100" y2="560" stroke="url(#lg1)" strokeWidth="1.0"/>
      <line x1="1100" y1="200" x2="1100" y2="560" stroke="url(#lg2)" strokeWidth="1.0"/>
      <line x1="900"  y1="100" x2="1200" y2="100" stroke="url(#lg3)" strokeWidth="0.8"/>
      <line x1="200"  y1="630" x2="560"  y2="630" stroke="url(#lg3)" strokeWidth="0.8"/>

      <line x1="80"   y1="200" x2="420"  y2="200" stroke="#2db84e" strokeWidth="1.3" strokeOpacity="0.20" className="lc-dash-line"/>
      <line x1="720"  y1="350" x2="1100" y2="350" stroke="#2db84e" strokeWidth="1.1" strokeOpacity="0.16" className="lc-dash-line" style={{animationDelay:"0.9s"}}/>
      <line x1="900"  y1="100" x2="1200" y2="100" stroke="#1a5c2e" strokeWidth="0.9" strokeOpacity="0.14" className="lc-dash-slow" style={{animationDelay:"1.6s"}}/>
      <line x1="200"  y1="630" x2="560"  y2="630" stroke="#1a5c2e" strokeWidth="0.9" strokeOpacity="0.12" className="lc-dash-slow" style={{animationDelay:"2.2s"}}/>

      {[{cx:80,cy:200},{cx:420,cy:200},{cx:420,cy:350},{cx:720,cy:200},{cx:720,cy:350},{cx:720,cy:560},{cx:1100,cy:200},{cx:1100,cy:560},{cx:560,cy:630},{cx:200,cy:630}].map((n,i)=>(
        <g key={i} className="lc-node">
          <circle cx={n.cx} cy={n.cy} r="16" fill="url(#ngG)" opacity="0.28"/>
          <circle cx={n.cx} cy={n.cy} r="4"  fill="#2db84e" opacity="0.32"/>
          <circle cx={n.cx} cy={n.cy} r="2"  fill="#2db84e" opacity="0.65"/>
        </g>
      ))}
      {[{cx:900,cy:100},{cx:1200,cy:100},{cx:1380,cy:280}].map((n,i)=>(
        <g key={`c${i}`} className="lc-node" style={{animationDelay:`${i*0.8}s`}}>
          <circle cx={n.cx} cy={n.cy} r="12" fill="url(#ngA)" opacity="0.20"/>
          <circle cx={n.cx} cy={n.cy} r="3.5" fill="#1a5c2e" opacity="0.28"/>
          <circle cx={n.cx} cy={n.cy} r="1.5" fill="#1a5c2e" opacity="0.60"/>
        </g>
      ))}

      <text x="140" y="460" fontFamily="Georgia,serif" fontSize="82" fill="#2db84e" fillOpacity="0.06" className="lc-float1">₹</text>
      <text x="1180" y="690" fontFamily="Georgia,serif" fontSize="90" fill="#2db84e" fillOpacity="0.05" className="lc-float2">$</text>
      <text x="970"  y="810" fontFamily="Georgia,serif" fontSize="66" fill="#1a5c2e" fillOpacity="0.06" className="lc-float3">€</text>
      <text x="55"   y="770" fontFamily="Georgia,serif" fontSize="70" fill="#1a5c2e" fillOpacity="0.05" className="lc-float3">%</text>

      <g opacity="0.08" transform="translate(30,645)">
        <line x1="0" y1="0" x2="0" y2="155" stroke="#2db84e" strokeWidth="0.8"/>
        <line x1="0" y1="155" x2="195" y2="155" stroke="#2db84e" strokeWidth="0.8"/>
        {[{x:14,o:100,c:60,h:50,l:110,up:false},{x:44,o:60,c:30,h:22,l:68,up:true},{x:74,o:30,c:75,h:20,l:82,up:false},{x:104,o:75,c:45,h:38,l:85,up:true},{x:134,o:45,c:20,h:12,l:52,up:true},{x:164,o:20,c:55,h:10,l:62,up:false}].map((c,i)=>(
          <g key={i}>
            <line x1={c.x+9} y1={c.h} x2={c.x+9} y2={c.l} stroke="#2db84e" strokeWidth="1.1"/>
            <rect x={c.x} y={Math.min(c.o,c.c)} width="18" height={Math.abs(c.o-c.c)||3} fill={c.up?"#1a5c2e":"#2db84e"}/>
          </g>
        ))}
      </g>

      <g opacity="0.08" transform="translate(1108,658)">
        <circle cx="55" cy="55" r="50" fill="none" stroke="#2db84e" strokeWidth="11" strokeDasharray="172 162"/>
        <circle cx="55" cy="55" r="50" fill="none" stroke="#1a5c2e" strokeWidth="11" strokeDasharray="96 238" strokeDashoffset="-172"/>
        <circle cx="55" cy="55" r="33" fill="#f7fbf8"/>
      </g>

      <g opacity="0.10" transform="translate(1284,392)">
        <path d="M0 55 Q28 0 56 55"    fill="none" stroke="#1a5c2e" strokeWidth="2"   strokeLinecap="round"/>
        <path d="M-14 70 Q28-16 70 70" fill="none" stroke="#1a5c2e" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M-28 85 Q28-32 84 85" fill="none" stroke="#1a5c2e" strokeWidth="1"   strokeLinecap="round"/>
        <circle cx="28" cy="55" r="3.5" fill="#1a5c2e"/>
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef   = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const mouse     = useRef({ x:0, y:0 });
  const ring      = useRef({ x:0, y:0 });
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [struckLines,  setStruckLines]  = useState<number[]>([]);
  const [showBoom,     setShowBoom]     = useState(false);
  const [painHidden,   setPainHidden]   = useState(false);
  const [showReveal,   setShowReveal]   = useState(false);

  useEffect(() => {
    document.body.style.cursor = "none";
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current)
        cursorRef.current.style.transform = `translate(${e.clientX-5}px,${e.clientY-5}px)`;
    };
    document.addEventListener("mousemove", onMove);
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${ring.current.x-17}px,${ring.current.y-17}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      document.body.style.cursor = "auto";
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const T: ReturnType<typeof setTimeout>[] = [];
    PAIN_LINES.forEach((_,i) => T.push(setTimeout(() => setVisibleLines(p=>[...p,i]), 400 + i*700)));
    const ss = 400 + PAIN_LINES.length*700 + 300;
    PAIN_LINES.forEach((_,i) => T.push(setTimeout(() => setStruckLines(p=>[...p,i]), ss + i*120)));
    T.push(setTimeout(()=>setShowBoom(true),  ss + PAIN_LINES.length*120 + 400));
    T.push(setTimeout(()=>setPainHidden(true),ss + PAIN_LINES.length*120 + 1200));
    T.push(setTimeout(()=>setShowReveal(true),ss + PAIN_LINES.length*120 + 1800));
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <div className="landing-root">
      <style>{styles}</style>
      <div ref={cursorRef} className="lc-cursor"/>
      <div ref={ringRef}   className="lc-cursor-ring"/>

      <LightBackground/>
      <div className="lc-spotlight"/>
      <div className="lc-grid"/>
      <div className="lc-grain"/>
      <div className="lc-blob lc-blob-1"/>
      <div className="lc-blob lc-blob-2"/>
      <div className="lc-blob lc-blob-3"/>

      {/* NAV */}
      <nav className="lc-nav">
        <div className="lc-logo">
          <div className="lc-logo-icon">⚡</div>
          <div>
            <div className="lc-logo-text">ConvoSphere <span>AI</span></div>
            <span className="lc-logo-sub">UNION BANK · OMNICHANNEL PLATFORM</span>
          </div>
        </div>
        <ul className="lc-nav-links">
          <li><a href="#" onClick={(e)=>{e.preventDefault();navigate("/dashboard");}}>Dashboard</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it Works</a></li>
        </ul>
        <div className="lc-nav-btns">
          <button className="lc-btn-outline" onClick={()=>navigate("/login")}>Log In</button>
          <button className="lc-btn-primary" onClick={()=>navigate("/login")}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="lc-hero">
        <div className="lc-sphere-wrap"><RotatingSphere/></div>

        <div className={`lc-pain-phase${painHidden?" hidden":""}`}>
          {PAIN_LINES.map((line,i)=>(
            <div key={i} className={["lc-pain-line",visibleLines.includes(i)?"visible":"",struckLines.includes(i)?"struck":""].join(" ")}
              style={{transitionDelay:`${i*0.04}s`}}>{line}</div>
          ))}
          <div className={`lc-pain-boom${showBoom?" visible":""}`}>
            <div className="lc-pain-boom-dot"/> Then came ConvoSphere AI
          </div>
        </div>

        <div className={`lc-reveal-phase${showReveal?" visible":""}`}>
          <div className="lc-hero-eyebrow">⚡ AI-Powered · Multi-Channel · Real-Time</div>
          <div className="lc-hero-title">CONVOSPHERE</div>
          <div className="lc-hero-sub">UNIFY EVERY CONVERSATION WITH INTELLIGENCE</div>
          <div className="lc-hero-desc">
            One platform to manage <strong>WhatsApp, Email, SMS, and Calls</strong> — powered by AI
            that understands <strong>context, sentiment, and intent</strong>. Built for Union Bank's
            next generation of customer communication.
          </div>
          <div className="lc-hero-btns">
            <button className="lc-btn-hero-primary" onClick={()=>navigate("/login")}>⚡ Explore Platform →</button>
            <button className="lc-btn-hero-secondary">▶ Watch Demo</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="lc-stats">
        {STATS.map(s=>(
          <div key={s.label} className="lc-stat">
            <div className="lc-stat-num">{s.num}</div>
            <div className="lc-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="lc-divider"/>

      {/* FEATURES */}
      <div className="lc-section" id="features">
        <div className="lc-section-tag">Platform Features</div>
        <div className="lc-section-title">BUILT FOR <span className="lc-accent">MODERN BANKING</span></div>
        <div className="lc-features-grid">
          {FEATURES.map(f=>(
            <div key={f.num} className="lc-feature-card">
              <div className="lc-feature-corner-dot"/>
              <div className="lc-feature-num">{f.num}</div>
              <div className="lc-feature-icon-wrap">
                <div className="lc-feature-icon-ring"/>
                {f.svgIcon}
              </div>
              <div className="lc-feature-title">{f.title}</div>
              <div className="lc-feature-desc">{f.desc}</div>
              <div className="lc-feature-card-bar"/>
            </div>
          ))}
        </div>
      </div>

      {/* HIGHLIGHT BAND */}
      <div className="lc-highlight-band">
        <div className="lc-highlight-inner">
          <div className="lc-highlight-text">
            <div className="lc-section-tag" style={{marginBottom:"14px"}}>Integrations</div>
            <div className="lc-highlight-title">EVERY CHANNEL.<br/><span className="lc-accent">ONE PLATFORM.</span></div>
            <div className="lc-highlight-desc">
              Connect all your communication channels in minutes. No custom code, no complex setup.
              Just plug in and let the AI handle routing, classifying, and responding intelligently
              across every touchpoint.
            </div>
            <button className="lc-highlight-cta" onClick={()=>navigate("/login")}>View All Integrations →</button>
          </div>
          <div className="lc-highlight-badges">
            {BADGES.map(b=>(
              <div key={b} className="lc-badge"><span className="lc-badge-dot"/>{b}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="lc-divider"/>

      {/* HOW IT WORKS */}
      <div className="lc-section" id="how-it-works">
        <div className="lc-section-tag">How It Works</div>
        <div className="lc-section-title">FROM CHAOS <span className="lc-accent">TO CLARITY</span></div>
        <FlowCanvas/>
        <div className="lc-steps-grid">
          {STEPS.map(s=>(
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