import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Bell } from "lucide-react";

export default function LiveActionCard({ entry, onDismiss, theme }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [entry, onDismiss]);

  if (!entry) return null;
  const action = (entry.action || "").toString();
  const user = entry.userName || entry.user || "Someone";
  // attempt to extract task title / column from action text if present
  let detail = action;
  if (!detail) detail = "performed an action";

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`fixed top-6 right-4 z-[160] w-80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl ${theme === "light" ? "bg-white border-gray-200" : "bg-slate-900/95 border-slate-700/60"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800/30 border border-slate-700 flex items-center justify-center text-white font-black">{/* icon placeholder */}
          <Bell size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === "light" ? "text-gray-400" : "text-slate-500"}`}>Live Action</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className={`text-xs ${theme === "light" ? "text-gray-900" : "text-slate-200"} leading-relaxed`}>{user} {detail}</p>
        </div>
        <button onClick={onDismiss} className={`text-slate-400 hover:text-red-500 transition cursor-pointer`}><X size={14} /></button>
      </div>
      <div className="h-0.5 bg-blue-500/30 mt-3 rounded-full overflow-hidden">
        <motion.div className="h-full bg-blue-500" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }} />
      </div>
    </motion.div>
  );
}
