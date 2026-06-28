import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initReveal } from "@/utils/reveal";
import { init3DInteractions } from "@/utils/3d-interactions";
import { MessageSquare, Database, Brain, Zap } from "lucide-react";

import "@/styles/3d-effects.css";

const STYLES = `
  .lc-root * { margin:0; padding:0; box-sizing:border-box; }
  .lc-root {
    font-family: var(--font-body, 'Inter', sans-serif);
    background: #FFF8E7;
    color: #1A1A1A;
    overflow-x: hidden;
  }

  .highlight-word {
    display: inline;
    background: #FFE082;
    color: #7A4E00;
    border-radius: 6px;
    padding: 0 6px 2px 6px;
  }

  .highlight-italic {
    font-style: italic;
    font-family: var(--font-display, 'Instrument Serif', serif);
    background: #FFC107;
    color: #1A1A1A;
    border-radius: 8px;
    padding: 0 8px 4px;
  }

  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #B0A99A;
    margin-bottom: 16px;
  }
  .section-label .dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #FFC107; flex-shrink: 0;
  }

  .floating-card {
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 2px 24px rgba(26,26,26,0.06), 0 1px 4px rgba(26,26,26,0.04);
    overflow: hidden;
  }

  .mesh-blob {
    position: absolute; pointer-events: none; border-radius: 50%;
    filter: blur(60px); opacity: 0.55; z-index: 0;
  }

  .icon-box {
    width: 40px; height: 40px; border-radius: 10px; background: #FFF3CD;
    display: flex; align-items: center; justify-content: center; color: #B8860B;
  }

  .marquee-wrapper {
    overflow: hidden; white-space: nowrap;
    border-top: 1px solid #F0E4C8; border-bottom: 1px solid #F0E4C8;
    padding: 14px 0; background: #FFFFFF;
  }
  .marquee-inner { display: inline-flex; animation: marquee 35s linear infinite; }
  .marquee-item {
    font-size: 13px; font-weight: 500; letter-spacing: 0.04em; color: #8A8578; padding: 0 24px;
  }

  .btn-primary {
    font-size: 14px; font-weight: 500; color: #1A1A1A; background: #FFC107;
    border-radius: 100px; padding: 8px 20px; border: none; cursor: pointer; transition: all 0.2s;
  }
  .btn-primary:hover { background: #FFB300; }

  .btn-secondary {
    font-size: 14px; font-weight: 500; color: #1A1A1A; border: 1px solid #F0E4C8;
    border-radius: 100px; padding: 8px 20px; background: transparent; cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: #FFC107; color: #B8860B; }

  .hero-wrapper {
    position: relative; min-height: 100vh; background: #FFF8E7;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding-top: 64px; overflow: hidden;
  }

  .btn-hero-primary {
    background: #1A1A1A; color: #FFC107; border-radius: 100px; padding: 14px 28px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.06em; border: none; cursor: pointer; transition: all 0.3s;
  }
  .btn-hero-primary:hover { background: #FFC107; color: #1A1A1A; }

  .btn-hero-secondary {
    background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
    border: 1px solid #E8D9B5; color: #8A8578; border-radius: 100px; padding: 14px 28px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.06em; cursor: pointer; transition: all 0.3s;
  }
  .btn-hero-secondary:hover { border-color: #1A1A1A; color: #1A1A1A; background: white; }

  @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes glideIn { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
`;

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    initReveal();
    init3DInteractions();
  }, []);

  return (
    <div className="lc-root">
      <style>{STYLES}</style>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '64px',
        background: 'rgba(255,248,231,0.72)', backdropFilter: 'blur(20px) saturate(1.8)',
        borderBottom: '1px solid rgba(26,26,26,0.06)'
      }}>
        <div style={{
          maxWidth: '1160px', margin: '0 auto', padding: '0 32px', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', background: '#1A1A1A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC107'
            }}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '15px', fontWeight: 500, color: '#1A1A1A', letterSpacing: '-0.01em' }}>ConvoSphere</div>
              <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '10px', fontWeight: 400, color: '#B0A99A', letterSpacing: '0.08em' }}>ENTERPRISE</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => navigate("/login")}>Login</button>
              <button className="btn-primary" onClick={() => navigate("/login")}>Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-wrapper hero-section perspective-section">
        {/* HERO SPHERE */}
        <div className='hero-sphere-container' aria-hidden='true'>
          <div className='hero-sphere'>
            <div className='hero-sphere-glow' style={{ background: 'radial-gradient(circle, rgba(255,193,7,0.45), transparent 70%)' }}></div>
            <div className='hero-sphere-core' style={{ background: 'linear-gradient(135deg, #FFD54F, #FFC107 40%, #B8860B)' }}></div>
            <div className='hero-sphere-ring hero-sphere-ring-1' style={{ borderColor: 'rgba(255,193,7,0.35)' }}></div>
            <div className='hero-sphere-ring hero-sphere-ring-2' style={{ borderColor: 'rgba(255,193,7,0.22)' }}></div>
            <div className='hero-sphere-ring hero-sphere-ring-3' style={{ borderColor: 'rgba(255,193,7,0.12)' }}></div>
            <div className='hero-sphere-highlight'></div>
          </div>
        </div>

        <div className="mesh-blob" style={{ top: '8%', left: '-4%', width: '500px', height: '500px', background: 'radial-gradient(circle,#FFE082,transparent)' }} />
        <div className="mesh-blob" style={{ bottom: '10%', right: '-5%', width: '380px', height: '380px', background: 'radial-gradient(circle,#FFECB3,transparent)' }} />

        <div className="section-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FFF3CD',
            border: '1px solid #FFE082', color: '#7A4E00', fontSize: '11px', fontWeight: 500,
            letterSpacing: '0.08em', borderRadius: '100px', padding: '8px 16px', marginBottom: '32px',
            animation: 'fadeIn 0.4s ease 0.1s both'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFC107' }} />
            NEW: AI INTELLIGENCE 2.0
          </div>

          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(56px,9vw,100px)',
            fontWeight: 400, lineHeight: 1.0, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0,
            animation: 'slideInLeft 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both'
          }}>
             CONVO<span className="highlight-italic" style={{ animation: 'slideInRight 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both', display: 'inline-block' }}>SPHERE</span>
          </h1>

          <div style={{
            fontFamily: "var(--font-body, 'Inter')", fontSize: 'clamp(13px,1.5vw,17px)', fontWeight: 300,
            letterSpacing: '0.12em', color: '#1A1A1A', textTransform: 'uppercase', marginTop: '16px', textShadow: '0 1px 8px rgba(255,255,255,0.8)',
            animation: 'glideIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both'
          }}>
            The Ultimate Support Operating System
          </div>

          <div className="floating-card tilt-card scroll-tilt-card stagger-1" style={{
            padding: '28px 32px', maxWidth: '520px', margin: '40px auto', fontSize: '16px',
            color: '#8A8578', lineHeight: 1.7, textAlign: 'left',
            animation: 'glideIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.6s both',
          }}>
            <div className='tilt-shine'></div>
            Struggling to manage <strong style={{ fontWeight: 600, color: '#1A1A1A' }}>WhatsApp and Email</strong> support separately? ConvoSphere unifies all customer conversations into one intelligent inbox. <em style={{ fontStyle: 'italic', color: '#B8860B' }}>AI agents auto-reply, classify tickets, and ensure compliance</em> — so your team focuses on what matters.
          </div>

          <div style={{ height: '32px' }} />
        </div>
      </section>

      {/* STATS BAR */}
      <section className="perspective-section" style={{ background: '#FFFFFF', borderTop: '1px solid #F0E4C8', borderBottom: '1px solid #F0E4C8', padding: '40px 0' }}>
        <div className="reveal section-inner" style={{
          maxWidth: '1160px', margin: '0 auto', padding: '0 32px', display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)'
        }}>
          {[
            { v: "99.9%", l: "Uptime SLA", count: "99.9", suffix: "%", prefix: "" },
            { v: "<2s", l: "AI Response", count: "2", suffix: "s", prefix: "<" },
            { v: "4", l: "Unified Channels", count: "4", suffix: "", prefix: "" },
            { v: "∞", l: "Conversations", count: "360", suffix: "°", prefix: "" }
          ].map((s, i) => (
            <div key={i} className={`scroll-tilt-card stagger-${1+i}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 32px',
              borderRight: i < 3 ? '1px solid #F0E4C8' : 'none'
            }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 400, color: '#1A1A1A', lineHeight: 1 }}>
                <span className="stat-value" data-count={s.count} data-suffix={s.suffix} data-prefix={s.prefix}>{s.v}</span>
              </div>
              <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0A99A', marginTop: '8px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEPARATOR */}
      <div style={{ height: 1, background: '#F0E4C8' }} />

      {/* FEATURES */}
      <section className="perspective-section" style={{ background: '#FFF8E7', padding: '120px 0' }}>
        <div className="section-inner" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px' }}>

          <div className="scroll-tilt-card stagger-1">
            <div className="reveal section-label"><div className="dot" />PLATFORM FEATURES</div>
            <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#1A1A1A', lineHeight: 1.1 }}>
              Built for modern <span className="highlight-italic">BANKING</span> teams.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', marginTop: '64px' }}>
            {/* Feature 1 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-1" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div className="mesh-blob" style={{ top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle,#FFECB3,transparent)', opacity: 0.4 }} />
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#F0E4C8', lineHeight: 1, userSelect: 'none' }}>01</div>
              <div className="icon-box" style={{ marginBottom: '24px' }}><MessageSquare className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#B8860B', marginBottom: '8px' }}><div className="dot" />OMNI INBOX</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#1A1A1A', marginBottom: '12px' }}>WhatsApp + Email in one view</h3>
              <p style={{ fontSize: '15px', color: '#8A8578', lineHeight: 1.7 }}>Unified timeline merging WhatsApp and Email conversations per customer. AI agents auto-reply within 15 seconds with contextual responses.</p>
            </div>

            {/* Feature 2 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-2" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#F0E4C8', lineHeight: 1, userSelect: 'none' }}>02</div>
              <div className="icon-box" style={{ marginBottom: '24px', background: '#1A1A1A', color: '#FFC107' }}><Brain className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#1A1A1A', marginBottom: '8px' }}><div className="dot" style={{ background: '#1A1A1A' }} />AI AGENTS</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#1A1A1A', marginBottom: '12px' }}>Autonomous AI Agents</h3>
              <p style={{ fontSize: '15px', color: '#8A8578', lineHeight: 1.7 }}>Three independent AI agents (WhatsApp, Email, Omni) powered by LLaMA 3.3 70B auto-reply to customers using conversation history and RAG knowledge base.</p>
            </div>

            {/* Feature 3 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-3" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div className="mesh-blob" style={{ top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle,#FFECB3,transparent)', opacity: 0.4 }} />
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#F0E4C8', lineHeight: 1, userSelect: 'none' }}>03</div>
              <div className="icon-box" style={{ marginBottom: '24px', background: '#FFC107', color: '#1A1A1A' }}><Zap className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#B8860B', marginBottom: '8px' }}><div className="dot" style={{ background: '#FFC107' }} />TICKET INTELLIGENCE</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#1A1A1A', marginBottom: '12px' }}>AI Ticket Classification</h3>
              <p style={{ fontSize: '15px', color: '#8A8578', lineHeight: 1.7 }}>Every message is auto-analyzed for sentiment, urgency, priority, and category. Critical issues are escalated instantly with suggested actions.</p>
            </div>

            {/* Feature 4 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-4" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#F0E4C8', lineHeight: 1, userSelect: 'none' }}>04</div>
              <div className="icon-box" style={{ marginBottom: '24px', background: '#FFF3CD', color: '#7A4E00' }}><Database className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#7A4E00', marginBottom: '8px' }}><div className="dot" style={{ background: '#7A4E00' }} />COMPLIANCE ENGINE</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#1A1A1A', marginBottom: '12px' }}>Regulatory Compliance</h3>
              <p style={{ fontSize: '15px', color: '#8A8578', lineHeight: 1.7 }}>Built-in TRAI DND blocking, RBI consent framework, campaign approval workflows, and audit logging for full regulatory compliance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CHANNELS & SUPPORT */}
      <section className="perspective-section" style={{ background: '#FFFFFF', padding: '100px 0' }}>
        <div className="section-inner" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}><div className="dot" />WHY CONVOSPHERE</div>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(36px,5vw,56px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#1A1A1A', lineHeight: 1.1 }}>
              One platform for <span className="highlight-italic">ALL</span> customer communication
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div className="scroll-tilt-card stagger-1 reveal" style={{ textAlign: 'center' }}>
              <img src="/whatsapp-email.png" alt="WhatsApp and Email unified" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px', margin: '0 auto', display: 'block' }} />
              <p style={{ fontSize: '15px', color: '#8A8578', marginTop: '20px', lineHeight: 1.6 }}>
                <strong style={{ color: '#1A1A1A' }}>WhatsApp + Email</strong> — both channels unified in a single intelligent inbox. No more switching between apps.
              </p>
            </div>

            <div className="scroll-tilt-card stagger-2 reveal" style={{ textAlign: 'center' }}>
              <img src="/support-team.jpg" alt="AI-powered customer support" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px', margin: '0 auto', display: 'block' }} />
              <p style={{ fontSize: '15px', color: '#8A8578', marginTop: '20px', lineHeight: 1.6 }}>
                <strong style={{ color: '#1A1A1A' }}>AI agents handle the load</strong> — auto-reply to customers, classify tickets, and track compliance while your team focuses on complex issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="perspective-section" style={{ background: '#FFF8E7', padding: '120px 0' }}>
        <div className="section-inner" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px' }}>

          <div className="reveal section-label"><div className="dot" />HOW IT WORKS</div>
          <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#1A1A1A' }}>
            Bring <span className="highlight-italic">CLARITY</span> to chaos
          </h2>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '48px auto 32px', maxWidth: '600px' }}>
             {["Receive", "Analyze", "Auto-Reply", "Track"].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i!==3 ? 1 : 'unset' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1A1A1A', color: '#FFC107', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      {i+1}
                    </div>
                    <div style={{ fontSize: '12px', color: '#B0A99A', textAlign: 'center', marginTop: '6px', position: 'absolute', transform: 'translateY(45px)' }}>{s}</div>
                  </div>
                  {i !== 3 && <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right,#1A1A1A,#E8D9B5)', margin: '0 -1px', marginBottom: '22px' }} />}
                </div>
             ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', marginTop: '48px' }}>
            {[
              { t: 'Customer Messages In', d: 'Customer sends a WhatsApp message or email — it arrives in the unified Omni Inbox instantly.' },
              { t: 'AI Analyzes & Classifies', d: 'Ticket intelligence detects sentiment, urgency, and category. Critical issues are flagged for escalation.' },
              { t: 'AI Agent Auto-Replies', d: 'WhatsApp and Email agents generate specific replies using full conversation history. Customers get answers, not generic greetings.' },
              { t: 'Compliance & Analytics', d: 'Every action is tracked — agent performance, campaign metrics, compliance scores. Export reports as CSV or PDF for audits.' }
            ].map((s, i) => (
               <div key={i} className={`tilt-card scroll-tilt-card page-card-reveal stagger-${i+1} floating-card`} data-delay={i*100} style={{
                 padding: '48px 40px', borderLeft: i===0 ? '3px solid #FFC107' : 'none',
                 background: i===3 ? 'linear-gradient(135deg,#FFF8E7,#FFFFFF)' : '#FFFFFF'
               }}>
                 <div className="tilt-shine"></div>
                 <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '72px', color: '#F0E4C8', lineHeight: 1, display: 'block', marginBottom: '16px' }}>0{i+1}</span>
                 <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#1A1A1A', marginBottom: '12px' }}>{s.t}</h3>
                 <p style={{ fontSize: '15px', color: '#8A8578', lineHeight: 1.7 }}>{s.d}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #F0E4C8', padding: '32px 0' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: '#B0A99A' }}>&copy; {new Date().getFullYear()} ConvoSphere Inc.</div>
          <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', color: '#1A1A1A', textTransform: 'uppercase' }}>
            CONVOSPHERE
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF3CD', border: '1px solid #FFE082', borderRadius: '100px', padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#7A4E00', letterSpacing: '0.04em' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFC107', animation: 'pulse 2s infinite' }} /> Systems Nominal
          </div>
        </div>
      </footer>
    </div>
  );
}