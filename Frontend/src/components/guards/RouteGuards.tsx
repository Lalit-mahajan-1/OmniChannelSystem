import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// ─── Blocks unauthenticated users ────────────────────────────────────────────
export function RequireAuth({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// ─── Redirects already-logged-in users away from /login ──────────────────────
export function RedirectIfAuth() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === "employer" ? "/dashboard" : "/portal"} replace />;
  }

  return <Outlet />;
}
