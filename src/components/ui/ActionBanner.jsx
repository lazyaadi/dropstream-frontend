import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, TrendingUp, X, Bell } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function ActionBanner({ entry, onDismiss, theme }) {
  const T = theme === "light" ? TL : TD;
  const [isMobile, setIsMobile] = React.useState(false);
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [entry, onDismiss]);

  const a = (entry?.action || "").toLowerCase();
  // Determine action type for display
  const isCreated = a.includes("added") || a.includes("created");
  const isMoved = a.includes("moved");
  const isDeleted = a.includes("deleted") || a.includes("removed");
  const { icon: ic, color, bg, border } = (() => {
    if (isCreated) return { icon: <CheckCircle size={16}/>, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" };
    if (isMoved)   return { icon: <TrendingUp size={16}/>,  color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    if (isDeleted) return { icon: <X size={16}/>,           color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/30" };
    return          { icon: <Bell size={16}/>,              color: "text-purple-400",bg: "bg-purple-500/10",border: "border-purple-500/30" };
  })();

  // Always render a compact pill matching the requested UI
  const label = isCreated ? "TASK CREATED" : (isDeleted ? "TASK DELETED" : (isMoved ? "TASK MOVED" : "LIVE ACTION"));
  const pillClass = isCreated ? "bg-blue-600 text-white" : (isDeleted ? "bg-[#13141a] text-pink-300 border border-[#2b2b33]" : (isMoved ? "bg-amber-500 text-slate-900" : "bg-purple-600 text-white"));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`fixed top-12 left-1/2 -translate-x-1/2 z-[150] rounded-full px-5 py-2 shadow-lg ${pillClass}`}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="font-black text-sm uppercase tracking-widest text-center">{label}</div>
    </motion.div>
  );
}
