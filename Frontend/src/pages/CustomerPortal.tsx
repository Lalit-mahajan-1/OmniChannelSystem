import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";

export default function CustomerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 w-full max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{user?.name}</h1>
          <p className="text-sm text-white/60 mt-1">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-white/[0.04] text-white border border-white/[0.08] capitalize">
            {user?.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto text-sm text-white/60 hover:text-white transition-colors mt-2"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
