import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Inbox, Users, BarChart3, Megaphone, Settings, Sparkles, LogOut, ChevronLeft, ChevronRight, AlertTriangle, ClipboardList, FileText, Brain, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { to: "/dashboard", icon: Inbox, label: "Inbox", end: true },
  { to: "/dashboard/customers", icon: Users, label: "Customers" },
  { to: "/dashboard/complaints", icon: AlertTriangle, label: "Complaint Box" },
  { to: "/dashboard/ticket-intelligence", icon: Brain, label: "AI Tickets" },
  { to: "/dashboard/my-tasks", icon: ClipboardList, label: "My Tasks" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/dashboard/reports", icon: FileText, label: "Reports" },
  { to: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns" },
  { to: "/dashboard/compliance", icon: Shield, label: "Compliance" },
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#F5F7FA', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '80px' : '200px', 
        background: '#FFFFFF', 
        borderRight: '1px solid #E5E7EB', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        position: 'relative', 
        padding: '20px 12px', 
        zIndex: 100,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.03)'
      }}>
        
        {/* Logo Area */}
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: collapsed ? '4px 0 20px' : '4px 8px 20px', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid #E5E7EB', 
          marginBottom: '12px'
        }}>
          <div style={{
            width: '32px', 
            height: '32px', 
            borderRadius: '9px', 
            background: 'linear-gradient(135deg,#FFC107,#B8860B)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#1A1A1A', 
            fontSize: '16px', 
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(255,193,7,0.3)'
          }}>
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: '14px', color: '#111827', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              ConvoSphere
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`nav-item-db`}
              style={(props) => {
                const isActive = props.isActive;
                return {
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: collapsed ? '9px 0' : '9px 12px', 
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  fontFamily: "DM Sans", 
                  fontSize: '13px', 
                  marginBottom: '2px',
                  background: isActive ? 'rgba(255,193,7,0.12)' : 'transparent',
                  color: isActive ? '#B8860B' : '#475569',
                  fontWeight: isActive ? 500 : 400,
                  border: isActive ? '1px solid rgba(255,193,7,0.3)' : '1px solid transparent',
                  color: isActive ? '#B8860B' : '#6B7280'
                };
              }}
            >
              {(props) => {
                const isActive = props.isActive;
                return (
                  <>
                    {/* Hover styles added via global dashboard CSS, but we apply base color here safely */}
                    <item.icon style={{ width: '16px', height: '16px', flexShrink: 0, color: isActive ? '#B8860B' : '#6B7280' }} />
                    {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Area */}
        <div style={{
          borderTop: '1px solid #E5E7EB', 
          paddingTop: '12px', 
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {!collapsed && user && (
            <div style={{ padding: '0 8px 8px' }}>
              <div style={{ fontFamily: "DM Sans", fontWeight: 500, fontSize: '13px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontFamily: "DM Sans", fontWeight: 400, fontSize: '11px', color: '#B8860B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {user.role}
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: collapsed ? '8px 0' : '8px 12px', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px', 
              fontFamily: "DM Sans", 
              fontWeight: 400, 
              fontSize: '12px', 
              color: '#6B7280', 
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
          >
            {collapsed ? <ChevronRight style={{ width: '16px', height: '16px' }} /> : <ChevronLeft style={{ width: '16px', height: '16px' }} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: collapsed ? '8px 0' : '8px 12px', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px', 
              fontFamily: "DM Sans", 
              fontWeight: 400, 
              fontSize: '12px', 
              color: '#6B7280', 
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header Bar */}
        <header style={{
          height: '64px',
          borderBottom: '1px solid #E5E7EB',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 28px',
          gap: '12px',
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <NotificationBell />
          
          {/* User Avatar */}
          {user && (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #FFC107, #B8860B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1A1A1A',
              fontFamily: 'DM Sans',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.25)'
            }}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

    </div>
  );
}
