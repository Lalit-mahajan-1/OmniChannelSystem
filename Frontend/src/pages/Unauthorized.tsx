import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <ShieldOff className="w-12 h-12 text-red-400" />
      <h1 className="text-2xl font-bold text-white">Access Denied</h1>
      <p className="text-white/60 text-sm">You don't have permission to view this page.</p>
      <button onClick={() => navigate(-1)} className="bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-lg !py-2 !px-5 mt-2">Go back</button>
    </div>
  );
}
