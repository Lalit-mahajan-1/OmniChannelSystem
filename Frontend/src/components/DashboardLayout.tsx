import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Inbox, Users, BarChart3, Megaphone, Shield, Brain, GitBranch, Settings, Sparkles, LogOut, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/dashboard", icon: Inbox, label: "Inbox", end: true },
  { to: "/dashboard/customers", icon: Users, label: "Customers" },
  { to: "/dashboard/complaints", icon: AlertTriangle, label: "Complaint Box" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns" },
  { to: "/dashboard/compliance", icon: Shield, label: "Compliance" },
  { to: "/dashboard/ai-control", icon: Brain, label: "AI Control" },
  { to: "/dashboard/workflow", icon: GitBranch, label: "Workflow" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen gradient-bg overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="h-full border-r border-white/[0.06] bg-background/60 backdrop-blur-xl flex flex-col shrink-0"
      >
        <div className="h-16 flex items-center px-4 border-b border-white/[0.06] gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-background" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="font-bold text-sm whitespace-nowrap overflow-hidden"
              >
                ConvoSphere
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-neon-cyan" : ""}`} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-white/[0.06] space-y-1">
          {/* User info */}
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 py-2 mb-1"
              >
                <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                <span className="text-[10px] text-neon-cyan capitalize">{user.role}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors w-full"
          >
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}

