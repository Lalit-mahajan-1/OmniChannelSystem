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
    background: #EDEEF0;
    color: #0D0D0D;
    overflow-x: hidden;
  }
  
  .highlight-word {
    display: inline;
    background: #D4FAE6;
    color: #1A7A40;
    border-radius: 6px;
    padding: 0 6px 2px 6px;
  }
  
  .highlight-italic {
    font-style: italic;
    font-family: var(--font-display, 'Instrument Serif', serif);
    background: #A8F5C2;
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
    color: #9EA3AE;
    margin-bottom: 16px;
  }
  .section-label .dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #3ECF6A; flex-shrink: 0;
  }

  .floating-card {
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 2px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .mesh-blob {
    position: absolute; pointer-events: none; border-radius: 50%;
    filter: blur(60px); opacity: 0.55; z-index: 0;
  }

  .icon-box {
    width: 40px; height: 40px; border-radius: 10px; background: #D4FAE6;
    display: flex; align-items: center; justify-content: center; color: #1A7A40;
  }

  .marquee-wrapper {
    overflow: hidden; white-space: nowrap;
    border-top: 1px solid #E4E6EB; border-bottom: 1px solid #E4E6EB;
    padding: 14px 0; background: #FFFFFF;
  }
  .marquee-inner { display: inline-flex; animation: marquee 35s linear infinite; }
  .marquee-item {
    font-size: 13px; font-weight: 500; letter-spacing: 0.04em; color: #555860; padding: 0 24px;
  }

  .btn-primary {
    font-size: 14px; font-weight: 500; color: #FFFFFF; background: #0D0D0D;
    border-radius: 100px; padding: 8px 20px; border: none; cursor: pointer; transition: all 0.2s;
  }
  .btn-primary:hover { background: #222222; }

  .btn-secondary {
    font-size: 14px; font-weight: 500; color: #0D0D0D; border: 1px solid #E4E6EB;
    border-radius: 100px; padding: 8px 20px; background: transparent; cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: #3ECF6A; color: #3ECF6A; }

  .hero-wrapper {
    position: relative; min-height: 100vh; background: #EDEEF0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding-top: 64px; overflow: hidden;
  }

  .btn-hero-primary {
    background: #0D0D0D; color: #FFFFFF; border-radius: 100px; padding: 14px 28px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.06em; border: none; cursor: pointer; transition: all 0.3s;
  }
  .btn-hero-primary:hover { background: #3ECF6A; color: #0D0D0D; }

  .btn-hero-secondary {
    background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
    border: 1px solid #C8CACE; color: #555860; border-radius: 100px; padding: 14px 28px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.06em; cursor: pointer; transition: all 0.3s;
  }
  .btn-hero-secondary:hover { border-color: #0D0D0D; color: #0D0D0D; background: white; }
`;

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    initReveal();
    // Replaced manual generic tilts/blobs with the complex 3D CSS manager file initialization
    init3DInteractions();
  }, []);

  return (
    <div className="lc-root">
      <style>{STYLES}</style>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '64px',
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(1.8)',
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div style={{
          maxWidth: '1160px', margin: '0 auto', padding: '0 32px', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', background: '#0D0D0D',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '15px', fontWeight: 500, color: '#0D0D0D', letterSpacing: '-0.01em' }}>ConvoSphere</div>
              <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '10px', fontWeight: 400, color: '#9EA3AE', letterSpacing: '0.08em' }}>ENTERPRISE</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            {/* Nav links omitted for brevity as per design */}
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
            <div className='hero-sphere-glow'></div>
            <div className='hero-sphere-core'></div>
            <div className='hero-sphere-ring hero-sphere-ring-1'></div>
            <div className='hero-sphere-ring hero-sphere-ring-2'></div>
            <div className='hero-sphere-ring hero-sphere-ring-3'></div>
            <div className='hero-sphere-highlight'></div>
          </div>
        </div>

        <div className="mesh-blob" style={{ top: '8%', left: '-4%', width: '500px', height: '500px', background: 'radial-gradient(circle,#AAFACB,transparent)' }} />
        <div className="mesh-blob" style={{ bottom: '10%', right: '-5%', width: '380px', height: '380px', background: 'radial-gradient(circle,#BEF0FF,transparent)' }} />

        <div className="section-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0FDF4',
            border: '1px solid #BBF7D0', color: '#166534', fontSize: '11px', fontWeight: 500,
            letterSpacing: '0.08em', borderRadius: '100px', padding: '8px 16px', marginBottom: '32px',
            animation: 'fadeIn 0.4s ease 0.1s both'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF6A' }} />
            NEW: AI INTELLIGENCE 2.0
          </div>

          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(64px,10vw,120px)',
            fontWeight: 400, lineHeight: 1.0, letterSpacing: '-0.03em', color: '#0D0D0D', margin: 0,
            animation: 'fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both'
          }}>
             CONVO<span className="highlight-italic">SPHERE</span>
          </h1>

          <div style={{
            fontFamily: "var(--font-body, 'Inter')", fontSize: 'clamp(13px,1.5vw,17px)', fontWeight: 300,
            letterSpacing: '0.12em', color: '#9EA3AE', textTransform: 'uppercase', marginTop: '16px',
            animation: 'fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both'
          }}>
            The Ultimate Support Operating System
          </div>

          <div className="floating-card tilt-card scroll-tilt-card stagger-1" style={{
            padding: '28px 32px', maxWidth: '520px', margin: '40px auto', fontSize: '16px',
            color: '#555860', lineHeight: 1.7, textAlign: 'left',
          }}>
            <div className='tilt-shine'></div>
            Combine <strong style={{ fontWeight: 600, color: '#0D0D0D' }}>WhatsApp, Email, SMS, and Calls</strong> into a single seamless interface. Let autonomous intelligence handle <em style={{ fontStyle: 'italic', color: '#3ECF6A' }}>context, sentiment, and intent</em> effortlessly.
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s both' }}>
            <button className="btn-hero-primary" onClick={() => navigate("/login")}>Start Free Trial</button>
            <button className="btn-hero-secondary" onClick={() => navigate("/login")}>Book Demo</button>
          </div>

          <div style={{
            marginTop: '48px', fontSize: '11px', letterSpacing: '0.1em', color: '#9EA3AE',
            textTransform: 'uppercase', animation: 'bounce 2s infinite'
          }}>
            scroll to explore &darr;
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="perspective-section" style={{ background: '#FFFFFF', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB', padding: '40px 0' }}>
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
              borderRight: i < 3 ? '1px solid #E4E6EB' : 'none'
            }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 400, color: '#0D0D0D', lineHeight: 1 }}>
                <span className="stat-value" data-count={s.count} data-suffix={s.suffix} data-prefix={s.prefix}>{s.v}</span>
              </div>
              <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9EA3AE', marginTop: '8px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrapper marquee-3d">
        <div className="marquee-inner">
          <span className="marquee-item">WHATSAPP BUSINESS &rarr; EMAIL SMTP &rarr; SMS GATEWAY &rarr; VOICE API &rarr; AI ENGINE &rarr; COMPLIANCE READY &rarr; UNION BANK &rarr; OMNICHANNEL &rarr;</span>
          <span className="marquee-item">WHATSAPP BUSINESS &rarr; EMAIL SMTP &rarr; SMS GATEWAY &rarr; VOICE API &rarr; AI ENGINE &rarr; COMPLIANCE READY &rarr; UNION BANK &rarr; OMNICHANNEL &rarr;</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="perspective-section" style={{ background: '#EDEEF0', padding: '120px 0' }}>
        <div className="section-inner" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px' }}>
          
          <div className="scroll-tilt-card stagger-1">
            <div className="reveal section-label"><div className="dot" />PLATFORM FEATURES</div>
            <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#0D0D0D', lineHeight: 1.1 }}>
              Built for modern <span className="highlight-italic">BANKING</span> teams.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', marginTop: '64px' }}>
            {/* Feature 1 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-1" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div className="mesh-blob" style={{ top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle,#C8F9DC,transparent)', opacity: 0.4 }} />
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#E4E6EB', lineHeight: 1, userSelect: 'none' }}>01</div>
              <div className="icon-box" style={{ marginBottom: '24px' }}><MessageSquare className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#3ECF6A', marginBottom: '8px' }}><div className="dot" />UNIFIED INBOX</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#0D0D0D', marginBottom: '12px' }}>Everything in one place</h3>
              <p style={{ fontSize: '15px', color: '#555860', lineHeight: 1.7 }}>Manage WhatsApp, Email, SMS, and Calls from one intelligent dashboard without missing context.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-2" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#E4E6EB', lineHeight: 1, userSelect: 'none' }}>02</div>
              <div className="icon-box" style={{ marginBottom: '24px', background: '#e0f2fe', color: '#0284c7' }}><Brain className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#0284c7', marginBottom: '8px' }}><div className="dot" style={{ background: '#0284c7' }} />SENTIMENT ENGINE</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#0D0D0D', marginBottom: '12px' }}>AI Sentiment Analysis</h3>
              <p style={{ fontSize: '15px', color: '#555860', lineHeight: 1.7 }}>Real-time deep analysis on every customer message so your team knows exactly how to respond natively.</p>
            </div>

            {/* Feature 3 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-3" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div className="mesh-blob" style={{ top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle,#C8F9DC,transparent)', opacity: 0.4 }} />
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#E4E6EB', lineHeight: 1, userSelect: 'none' }}>03</div>
              <div className="icon-box" style={{ marginBottom: '24px', background: '#fef08a', color: '#a16207' }}><Zap className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#a16207', marginBottom: '8px' }}><div className="dot" style={{ background: '#a16207' }} />INTENT DETECTION</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#0D0D0D', marginBottom: '12px' }}>Automated Classification</h3>
              <p style={{ fontSize: '15px', color: '#555860', lineHeight: 1.7 }}>Dynamically classify incoming requests as support, query, or technical routing instantly to appropriate buckets.</p>
            </div>

            {/* Feature 4 */}
            <div className="tilt-card scroll-tilt-card floating-card page-card-reveal stagger-4" style={{ padding: '40px', position: 'relative' }}>
              <div className='tilt-shine'></div>
              <div style={{ position: 'absolute', top: '24px', right: '32px', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '80px', color: '#E4E6EB', lineHeight: 1, userSelect: 'none' }}>04</div>
              <div className="icon-box" style={{ marginBottom: '24px', background: '#f3e8ff', color: '#7e22ce' }}><Database className="w-5 h-5"/></div>
              <div className="section-label" style={{ color: '#7e22ce', marginBottom: '8px' }}><div className="dot" style={{ background: '#7e22ce' }} />MEMORY CORE</div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#0D0D0D', marginBottom: '12px' }}>Contextual History</h3>
              <p style={{ fontSize: '15px', color: '#555860', lineHeight: 1.7 }}>Maintains an interconnected graph of conversations natively so the AI recalls every historic interaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="perspective-section" style={{ background: '#FFFFFF', padding: '120px 0' }}>
        <div className="section-inner" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          
          <div className="scroll-tilt-card stagger-1 reveal">
            <div className="section-label"><div className="dot" />INTEGRATIONS</div>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0D0D0D' }}>
              The omnichannel <br/><span className="highlight-italic">PLATFORM</span>
            </h2>
            <p style={{ fontSize: '16px', color: '#555860', lineHeight: 1.7, marginTop: '24px', maxWidth: '420px' }}>
              Connect into the ecosystems you already live inside natively without missing a beat regarding context loss or API limits.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '32px' }}>
              {["WhatsApp API", "SendGrid Email", "Twilio SMS", "Voice PBX", "Zendesk"].map(t => (
                <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', background: '#F7F8FA', border: '1px solid #E4E6EB', borderRadius: '100px', padding: '8px 16px', color: '#555860' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF6A' }} /> {t}
                </div>
              ))}
            </div>

            <a href="#" className="btn-secondary" style={{ display: 'inline-flex', marginTop: '32px', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
              View Developer Docs &rarr;
            </a>
          </div>

          {/* Right Orbit Diagram */}
          <div className="scroll-tilt-card stagger-2 reveal" data-delay="200" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '480px' }}>
             <div className="orbit-ring-1" />
             <div className="orbit-ring-2" />
             
             <div className="tilt-card" style={{
               width: '120px', height: '120px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #E4E6EB',
               boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2
             }}>
                <div className='tilt-shine'></div>
                <MessageSquare className="w-8 h-8 text-green-500 mb-1" />
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em' }}>CORE</span>
             </div>

             {/* Added channel-node float-depth per JSON rule block */}
             <div className="channel-node float-depth" style={{ top: '5%', left: '50%', transform: 'translate(-50%,-50%)', '--base-transform': 'translate(-50%,-50%)' } as React.CSSProperties}>💬</div>
             <div className="channel-node float-depth" style={{ top: '50%', right: '2%', transform: 'translate(50%,-50%)', '--base-transform': 'translate(50%,-50%)' } as React.CSSProperties}>✉️</div>
             <div className="channel-node float-depth" style={{ bottom: '5%', left: '50%', transform: 'translate(-50%,50%)', '--base-transform': 'translate(-50%,50%)' } as React.CSSProperties}>📱</div>
             <div className="channel-node float-depth" style={{ top: '50%', left: '2%', transform: 'translate(-50%,-50%)', '--base-transform': 'translate(-50%,-50%)' } as React.CSSProperties}>📞</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="perspective-section" style={{ background: '#EDEEF0', padding: '120px 0' }}>
        <div className="section-inner" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px' }}>
          
          <div className="reveal section-label"><div className="dot" />HOW IT WORKS</div>
          <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#0D0D0D' }}>
            Bring <span className="highlight-italic">CLARITY</span> to chaos
          </h2>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '48px auto 32px', maxWidth: '600px' }}>
             {["Connect", "Analyze", "Route", "Respond"].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i!==3 ? 1 : 'unset' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0D0D0D', color: '#FFFFFF', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      {i+1}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9EA3AE', textAlign: 'center', marginTop: '6px', position: 'absolute', transform: 'translateY(45px)' }}>{s}</div>
                  </div>
                  {i !== 3 && <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right,#0D0D0D,#C8CACE)', margin: '0 -1px', marginBottom: '22px' }} />}
                </div>
             ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', marginTop: '48px' }}>
            {[
              { t: 'Connect Channels', d: 'Link WhatsApp, Email, SMS, and call systems in minutes securely with API keys.' },
              { t: 'AI Processes Everything', d: 'Every inbound payload is scanned aggressively for emotional sentiment.' },
              { t: 'Smart Routing', d: 'Tasks automatically shuffle intelligently directly to idle representative endpoints.' },
              { t: 'Respond & Improve', d: 'Analytics dynamically iterate recommendations back into your workflows globally.' }
            ].map((s, i) => (
               <div key={i} className={`tilt-card scroll-tilt-card page-card-reveal stagger-${i+1} floating-card`} data-delay={i*100} style={{
                 padding: '48px 40px', borderLeft: i===0 ? '3px solid #3ECF6A' : 'none',
                 background: i===3 ? 'linear-gradient(135deg,#F0FFF7,#FFFFFF)' : '#FFFFFF'
               }}>
                 <div className="tilt-shine"></div>
                 <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '72px', color: '#E4E6EB', lineHeight: 1, display: 'block', marginBottom: '16px' }}>0{i+1}</span>
                 <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#0D0D0D', marginBottom: '12px' }}>{s.t}</h3>
                 <p style={{ fontSize: '15px', color: '#555860', lineHeight: 1.7 }}>{s.d}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E4E6EB', padding: '32px 0' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: '#9EA3AE' }}>&copy; {new Date().getFullYear()} ConvoSphere Inc.</div>
          <div style={{ fontFamily: "var(--font-body, 'Inter')", fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', color: '#0D0D0D', textTransform: 'uppercase' }}>
            CONVOSPHERE
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '100px', padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#166534', letterSpacing: '0.04em' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF6A', animation: 'pulse 2s infinite' }} /> Systems Nominal
          </div>
        </div>
      </footer>
    </div>
  );
}