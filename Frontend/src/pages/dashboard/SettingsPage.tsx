import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { User, Mail, Briefcase, Phone, Hash, Lock, Loader2, CheckCircle, AlertCircle, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.VITE_API_URL;

export default function SettingsPage() {
  const { user, login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    phoneNumberId: "",
    password: "",
  });

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };

  const employeeId = user?._id || (user as any)?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!employeeId) return;
      try {
        const res = await axios.get(`${BASE}/employers/${employeeId}`, { headers: authHeaders });
        const data = res.data.data;
        setFormData({
          name: data.name || "",
          email: data.email || "",
          company: data.company || "",
          phone: data.phone || "",
          phoneNumberId: data.phoneNumberId || "",
          password: "",
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile parameters");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      if (!employeeId) throw new Error("Invalid session identity");

      const updateData: any = { ...formData };
      if (!updateData.password) delete updateData.password;
      if (!updateData.company) delete updateData.company;
      if (!updateData.phone) delete updateData.phone;
      if (!updateData.phoneNumberId) delete updateData.phoneNumberId;

      const res = await axios.put(`${BASE}/employers/${employeeId}`, updateData, { headers: authHeaders });
      
      // Update session natively so the top left corner name dynamically changes if they edited their name
      const token = localStorage.getItem("token") || "";
      login(token, res.data.data);

      setSuccess(true);
      setFormData(prev => ({ ...prev, password: "" })); // clear password after save
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center bg-background/50">
        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Decrypting Profile Configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6 md:p-8 lg:p-12 relative bg-grid-white/[0.02] bg-[size:32px_32px]">
      <div className="max-w-2xl w-full mx-auto pb-10">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pl-1 border-l-4 border-neon-cyan">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 pl-3">
            Employee Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-2 pl-3">
            Manage your personal settings, contact coordinates, and security configurations.
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 text-green-400">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">Profile updated successfully! Session changes have been synced.</p>
            </div>
          </motion.div>
        )}

        <motion.form 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} 
          className="glass-card p-6 md:p-10 rounded-2xl border border-white/[0.06] shadow-2xl flex flex-col gap-10"
        >
          {/* Identity */}
          <section className="flex flex-col gap-5 border-b border-white/[0.04] pb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-purple-400" /> Professional Identity
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-foreground/80 font-bold tracking-wide">FULL NAME <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground max-w-none" />
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:border-neon-cyan focus:bg-white/[0.04] transition-all focus:ring-1 focus:ring-neon-cyan/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/80 font-bold tracking-wide">EMAIL ADDRESS <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground max-w-none" />
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:border-neon-cyan focus:bg-white/[0.04] transition-all focus:ring-1 focus:ring-neon-cyan/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/80 font-bold tracking-wide">COMPANY EXTENSION</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground max-w-none" />
                  <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} 
                    className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:border-neon-cyan focus:bg-white/[0.04] transition-all focus:ring-1 focus:ring-neon-cyan/50 placeholder:text-muted-foreground/30" placeholder="e.g. Acme Corp Division" />
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="flex flex-col gap-5 border-b border-white/[0.04] pb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-neon-cyan" /> Communication Vectors
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="text-xs text-foreground/80 font-bold tracking-wide">PHONE NUMBER</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground max-w-none" />
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:border-neon-cyan focus:bg-white/[0.04] transition-all focus:ring-1 focus:ring-neon-cyan/50 placeholder:text-muted-foreground/30" placeholder="+1..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/80 font-bold tracking-wide">PHONE IDENTITY ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground max-w-none" />
                  <input type="text" value={formData.phoneNumberId} onChange={e => setFormData({ ...formData, phoneNumberId: e.target.value })} 
                    className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:border-neon-cyan focus:bg-white/[0.04] transition-all focus:ring-1 focus:ring-neon-cyan/50 placeholder:text-muted-foreground/30" placeholder="e.g. TWILIO-123" />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">Integration ID associated with telecom operator.</p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="flex flex-col gap-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-yellow-500" /> Authentication
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs text-foreground/80 font-bold tracking-wide">CHANGE FIREWALL PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground max-w-none" />
                <input type="password" minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:border-yellow-400 focus:bg-white/[0.04] transition-all focus:ring-1 focus:ring-yellow-400/50 placeholder:text-muted-foreground/40" placeholder="Leave blank to maintain current credentials" />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">Must be at least 6 characters if attempting to execute a change.</p>
            </div>
          </section>

          {/* Submit */}
          <div className="pt-6 pb-2">
             <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:px-12 py-3.5 bg-gradient-to-r from-neon-purple to-neon-cyan text-white shadow-[0_0_20px_rgba(0,255,255,0.25)] hover:shadow-[0_0_35px_rgba(0,255,255,0.45)] rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Sync Preferences
             </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
