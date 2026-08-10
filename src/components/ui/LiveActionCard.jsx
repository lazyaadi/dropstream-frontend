import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Bell } from "lucide-react";

export default function LiveActionCard({ entry, onDismiss, theme }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, [entry, onDismiss]);

  if (!entry) return null;
  const action = (entry.action || "").toString().toLowerCase();
  const user = entry.userName || entry.user || "Someone";
  const taskTitle = entry.taskTitle || entry.title || null;
  const targetStatus = entry.targetStatus || entry.target || null;

  const renderDetail = () => {
    if (action.includes("joined")) return (<>{" "}<strong>{user}</strong> joined the workspace.</>);
    if (action.includes("left")) return (<>{" "}<strong>{user}</strong> left the workspace.</>);
    if (action.includes("moved")) return (<>{" "}<strong>{user}</strong> moved task <strong>{taskTitle ? `'${taskTitle}'` : ""}</strong>{targetStatus ? ` to ${targetStatus}` : ""}.</>);
    if (action.includes("created") || action.includes("added")) return (<>{" "}<strong>{user}</strong> created task <strong>{taskTitle ? `'${taskTitle}'` : ""}</strong>.</>);
    if (action.includes("deleted") || action.includes("removed")) return (<>{" "}<strong>{user}</strong> deleted task <strong>{taskTitle ? `'${taskTitle}'` : ""}</strong>.</>);
    return (<>{" "}<strong>{user}</strong> {entry.action}</>);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`fixed top-[70px] sm:top-6 right-4 z-[160] w-[88%] max-w-[280px] sm:w-80 sm:max-w-none rounded-2xl p-2 sm:p-4 shadow-2xl backdrop-blur-xl transform sm:scale-100 scale-95 ${theme === "light" ? "bg-white border-gray-200" : "bg-slate-900/95 border-slate-700/60"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800/30 border border-slate-700 flex items-center justify-center text-white font-black">{/* icon placeholder */}
          <Bell size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${theme === "light" ? "text-gray-400" : "text-slate-500"}`}>Live Action</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className={`text-sm sm:text-xs ${theme === "light" ? "text-gray-900" : "text-slate-200"} leading-relaxed`}><span className="font-normal">{renderDetail()}</span></p>
        </div>
        <button onClick={onDismiss} className={`text-slate-400 hover:text-red-500 transition cursor-pointer`}><X size={14} /></button>
      </div>
      <div className="h-0.5 bg-blue-500/30 mt-3 rounded-full overflow-hidden">
        <motion.div className="h-full bg-blue-500" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 2, ease: "linear" }} />
      </div>
    </motion.div>
  );
}
