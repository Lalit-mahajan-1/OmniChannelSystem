import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";



export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.employer.login(email, password);
      login(res.token, res.data);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-canvas-bg, #EDEEF0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Mesh Blobs */}
      <div className="mesh-blob" style={{
        position: 'absolute', top: '-10%', left: '-8%', width: '480px', height: '480px',
        background: 'radial-gradient(circle, #AAFACB, transparent)', borderRadius: '50%',
        filter: 'blur(70px)', opacity: 0.5, pointerEvents: 'none', zIndex: 0
      }} />
      <div className="mesh-blob" style={{
        position: 'absolute', bottom: '-10%', right: '-8%', width: '360px', height: '360px',
        background: 'radial-gradient(circle, #BEF0FF, transparent)', borderRadius: '50%',
        filter: 'blur(60px)', opacity: 0.45, pointerEvents: 'none', zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="floating-card"
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 4px 48px rgba(0,0,0,0.1), 0 1px 6px rgba(0,0,0,0.06)',
          width: '440px',
          padding: '48px'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', background: '#0D0D0D',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', color: 'white'
          }}>
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '32px', fontWeight: 400,
            color: '#0D0D0D', letterSpacing: '-0.02em', margin: '0'
          }}>Welcome Back</h1>
          <p style={{
            fontFamily: "var(--font-body, 'Inter')", fontSize: '15px', fontWeight: 400,
            color: '#9EA3AE', marginTop: '4px'
          }}>Sign in to ConvoSphere AI</p>
        </div>



        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555860', marginBottom: '8px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#C8CACE', width: '16px', height: '16px', pointerEvents: 'none' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{
                  width: '100%', background: '#F7F8FA', border: '1px solid #E4E6EB', borderRadius: '12px',
                  padding: '12px 16px 12px 44px', fontSize: '15px', color: '#0D0D0D', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3ECF6A'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px #D4FAE6'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E4E6EB'; e.target.style.background = '#F7F8FA'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555860', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#C8CACE', width: '16px', height: '16px', pointerEvents: 'none' }} />
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', background: '#F7F8FA', border: '1px solid #E4E6EB', borderRadius: '12px',
                  padding: '12px 44px 12px 44px', fontSize: '15px', color: '#0D0D0D', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3ECF6A'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px #D4FAE6'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E4E6EB'; e.target.style.background = '#F7F8FA'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9EA3AE', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ fontSize: '14px', color: '#f87171', textAlign: 'center', marginBottom: '16px' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #0D0D0D, #333333)', color: '#FFFFFF',
              border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Back */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => navigate("/")}
            style={{ fontSize: '13px', color: '#9EA3AE', cursor: 'pointer', textDecoration: 'none', transition: 'color 0.2s', background: 'none', border: 'none' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#555860'}
            onMouseOut={(e) => e.currentTarget.style.color = '#9EA3AE'}
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
