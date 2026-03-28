import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  Phone,
  Hash,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.VITE_API_URL;

type FormDataType = {
  name: string;
  email: string;
  company: string;
  phone: string;
  phoneNumberId: string;
  password: string;
};

const styles = {
  page: {
    minHeight: "100%",
    padding: "32px",
    background:
      "radial-gradient(circle at top left, rgba(62,207,106,0.08), transparent 22%), radial-gradient(circle at top right, rgba(96,165,250,0.08), transparent 24%), #020617",
    overflowY: "auto" as const,
  },
  shell: {
    maxWidth: "1080px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: "24px",
  },
  card: {
    background: "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.88))",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  sideCard: {
    padding: "24px",
    position: "sticky" as const,
    top: "24px",
    height: "fit-content",
  },
  mainCard: {
    padding: "28px",
  },
  badge: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(62,207,106,0.18), rgba(96,165,250,0.12))",
    border: "1px solid rgba(62,207,106,0.22)",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    color: "#F8FAFC",
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1.15,
    fontFamily: "'DM Sans', sans-serif",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#94A3B8",
    fontSize: "14px",
    lineHeight: 1.6,
    fontFamily: "'DM Sans', sans-serif",
  },
  sideSection: {
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(148,163,184,0.1)",
  },
  sideLabel: {
    color: "#64748B",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
    fontFamily: "'DM Sans', sans-serif",
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#CBD5E1",
    fontSize: "14px",
    padding: "10px 0",
    fontFamily: "'DM Sans', sans-serif",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#22C55E",
    boxShadow: "0 0 0 6px rgba(34,197,94,0.12)",
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "26px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(148,163,184,0.1)",
  },
  formTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  formIconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(96,165,250,0.1)",
    border: "1px solid rgba(96,165,250,0.18)",
  },
  formTitle: {
    margin: 0,
    color: "#F8FAFC",
    fontSize: "20px",
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
  },
  formDesc: {
    margin: "4px 0 0",
    color: "#94A3B8",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
  },
  section: {
    marginBottom: "20px",
    padding: "22px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(148,163,184,0.1)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    color: "#E2E8F0",
    fontSize: "15px",
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
  },
  fieldsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  fullSpan: {
    gridColumn: "1 / -1",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    color: "#94A3B8",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontFamily: "'DM Sans', sans-serif",
  },
  inputShell: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    height: "50px",
    borderRadius: "14px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(15,23,42,0.85)",
    color: "#F8FAFC",
    padding: "0 16px 0 46px",
    outline: "none",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s ease",
    boxSizing: "border-box" as const,
  },
  icon: {
    position: "absolute" as const,
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "18px",
    height: "18px",
    color: "#64748B",
    pointerEvents: "none" as const,
  },
  helper: {
    margin: 0,
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.5,
    fontFamily: "'DM Sans', sans-serif",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "28px",
    flexWrap: "wrap" as const,
  },
  saveButton: {
    height: "50px",
    border: "none",
    borderRadius: "14px",
    padding: "0 22px",
    background: "linear-gradient(135deg, #22C55E, #16A34A)",
    color: "#03120A",
    fontWeight: 700,
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(34,197,94,0.22)",
    fontFamily: "'DM Sans', sans-serif",
  },
  secondaryText: {
    color: "#64748B",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
  },
  alertBase: {
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
  },
};

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  icon,
  children,
  helper,
  full = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  helper?: string;
  full?: boolean;
}) {
  return (
    <div style={{ ...styles.fieldWrap, ...(full ? styles.fullSpan : {}) }}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputShell}>
        <div style={styles.icon}>{icon}</div>
        {children}
      </div>
      {helper ? <p style={styles.helper}>{helper}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const { user, login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    company: "",
    phone: "",
    phoneNumberId: "",
    password: "",
  });

  const employeeId = user?._id || (user as any)?.id;

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    []
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!employeeId) {
        setInitialLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${BASE}/employers/${employeeId}`, {
          headers: authHeaders,
        });

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
        setError(
          err.response?.data?.message || "Failed to load profile details."
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [employeeId, authHeaders]);

  const handleChange =
    (key: keyof FormDataType) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [key]: e.target.value }));
      if (success) setSuccess(false);
      if (error) setError("");
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      if (!employeeId) throw new Error("Invalid session identity");

      const updateData: Partial<FormDataType> = { ...formData };

      if (!updateData.password) delete updateData.password;
      if (!updateData.company) delete updateData.company;
      if (!updateData.phone) delete updateData.phone;
      if (!updateData.phoneNumberId) delete updateData.phoneNumberId;

      const res = await axios.put(`${BASE}/employers/${employeeId}`, updateData, {
        headers: authHeaders,
      });

      const token = localStorage.getItem("token") || "";
      login(token, res.data.data);

      setSuccess(true);
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div
        style={{
          minHeight: "100%",
          display: "grid",
          placeItems: "center",
          background: "#020617",
          padding: "32px",
        }}
      >
        <div
          style={{
            ...styles.card,
            padding: "28px",
            width: "100%",
            maxWidth: "420px",
            textAlign: "center",
          }}
        >
          <Loader2
            style={{
              width: "34px",
              height: "34px",
              color: "#22C55E",
              animation: "spin 1s linear infinite",
              marginBottom: "14px",
            }}
          />
          <h2
            style={{
              margin: 0,
              color: "#F8FAFC",
              fontSize: "18px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Loading profile
          </h2>
          <p style={{ ...styles.subtitle, marginTop: "8px" }}>
            Fetching your account settings and communication details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          input::placeholder {
            color: #64748B;
          }

          input:focus {
            border-color: rgba(34, 197, 94, 0.35) !important;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.08);
          }

          @media (max-width: 960px) {
            .settings-shell {
              grid-template-columns: 1fr !important;
            }

            .settings-side {
              position: relative !important;
              top: 0 !important;
            }
          }

          @media (max-width: 700px) {
            .settings-grid {
              grid-template-columns: 1fr !important;
            }

            .settings-main {
              padding: 20px !important;
            }

            .settings-side {
              padding: 20px !important;
            }

            .settings-page {
              padding: 18px !important;
            }
          }
        `}
      </style>

      <div className="settings-shell" style={styles.shell}>
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="settings-side"
          style={{ ...styles.card, ...styles.sideCard }}
        >
          <div style={styles.badge}>
            <Settings size={26} color="#4ADE80" />
          </div>

          <h1 style={styles.title}>Employee Profile</h1>
          <p style={styles.subtitle}>
            Clean account settings for identity, communication, and security.
          </p>

          <div style={styles.sideSection}>
            <div style={styles.sideLabel}>Account overview</div>

            <div style={styles.statRow}>
              <span>Name</span>
              <span style={{ color: "#F8FAFC", fontWeight: 600 }}>
                {formData.name || "—"}
              </span>
            </div>

            <div style={styles.statRow}>
              <span>Email</span>
              <span
                style={{
                  color: "#CBD5E1",
                  fontWeight: 600,
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={formData.email}
              >
                {formData.email || "—"}
              </span>
            </div>

            <div style={styles.statRow}>
              <span>Status</span>
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={styles.dot} />
                <span style={{ color: "#86EFAC", fontWeight: 600 }}>Active</span>
              </span>
            </div>
          </div>

          <div style={styles.sideSection}>
            <div style={styles.sideLabel}>Security note</div>
            <p
              style={{
                margin: 0,
                color: "#94A3B8",
                fontSize: "13px",
                lineHeight: 1.7,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Leave the password field empty if you do not want to change current credentials.
            </p>
          </div>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...styles.card, ...styles.mainCard }}
          className="settings-main"
        >
          <div style={styles.formHeader}>
            <div style={styles.formTitleWrap}>
              <div style={styles.formIconWrap}>
                <ShieldCheck size={22} color="#60A5FA" />
              </div>
              <div>
                <h2 style={styles.formTitle}>Manage settings</h2>
                <p style={styles.formDesc}>
                  Update employee profile data and save changes securely.
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  ...styles.alertBase,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#FCA5A5",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  ...styles.alertBase,
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.22)",
                  color: "#86EFAC",
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Profile updated successfully.</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <Section icon={<User size={16} color="#60A5FA" />} title="Professional Identity">
              <div className="settings-grid" style={styles.fieldsGrid}>
                <Field label="Full Name *" icon={<User size={18} />} full>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange("name")}
                    style={styles.input}
                    placeholder="Enter full name"
                  />
                </Field>

                <Field label="Email Address *" icon={<Mail size={18} />} full>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange("email")}
                    style={styles.input}
                    placeholder="Enter email address"
                  />
                </Field>

                <Field label="Company / Division" icon={<Briefcase size={18} />} full>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={handleChange("company")}
                    style={styles.input}
                    placeholder="e.g. Acme Corp Division"
                  />
                </Field>
              </div>
            </Section>

            <Section icon={<Phone size={16} color="#22C55E" />} title="Communication Details">
              <div className="settings-grid" style={styles.fieldsGrid}>
                <Field label="Phone Number" icon={<Phone size={18} />}>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    style={styles.input}
                    placeholder="+91 98765 43210"
                  />
                </Field>

                <Field
                  label="Phone Identity ID"
                  icon={<Hash size={18} />}
                  helper="Integration identifier associated with the telecom provider."
                >
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={handleChange("phoneNumberId")}
                    style={styles.input}
                    placeholder="e.g. TWILIO-123"
                  />
                </Field>
              </div>
            </Section>

            <Section icon={<Lock size={16} color="#F59E0B" />} title="Security">
              <div className="settings-grid" style={styles.fieldsGrid}>
                <Field
                  label="Change Password"
                  icon={<Lock size={18} />}
                  full
                  helper="Minimum 6 characters. Leave blank to keep the current password."
                >
                  <input
                    type="password"
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange("password")}
                    style={styles.input}
                    placeholder="Enter new password"
                  />
                </Field>
              </div>
            </Section>

            <div style={styles.actions}>
              <span style={styles.secondaryText}>
                Review changes before saving. Empty optional fields are ignored.
              </span>

              <button type="submit" disabled={loading} style={styles.saveButton}>
                {loading ? (
                  <Loader2
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Save size={18} />
                )}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.main>
      </div>
    </div>
  );
}