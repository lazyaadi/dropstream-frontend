import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, TrendingUp, X, Bell } from "lucide-react";
import { TD, TL } from "../../lib/constants";
import { playNotifSound } from "../../lib/utils";

export default function ActionBanner({ entry, onDismiss, theme }) {
  const T = theme === "light" ? TL : TD;
  const [isMobile, setIsMobile] = React.useState(false);
  useEffect(() => {
    playNotifSound();
    const t = setTimeout(onDismiss, 5000);
    const check = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);
    check();
    window.addEventListener('resize', check);

    // Some mobile browsers block autoplay; retry playing on first user gesture
    const handleUserGesture = () => {
      try { playNotifSound(); } catch {}
      document.removeEventListener('click', handleUserGesture, true);
      document.removeEventListener('touchstart', handleUserGesture, true);
    };
    document.addEventListener('click', handleUserGesture, true);
    document.addEventListener('touchstart', handleUserGesture, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', check);
      document.removeEventListener('click', handleUserGesture, true);
      document.removeEventListener('touchstart', handleUserGesture, true);
    };
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

  if (isMobile) {
    // Compact pill for mobile
    const label = isCreated ? "TASK CREATED" : (isDeleted ? "TASK DELETED" : (isMoved ? "TASK MOVED" : "LIVE ACTION"));
    const pillClass = isCreated ? "bg-blue-600 text-white" : (isDeleted ? "bg-red-700 text-pink-100" : (isMoved ? "bg-amber-500 text-slate-900" : "bg-purple-600 text-white"));
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[150] rounded-xl px-4 py-2 shadow-lg border ${pillClass}`}
      >
        <div className="font-black text-sm uppercase tracking-widest text-center">{label}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60 }}
      className={`fixed top-20 right-4 z-[150] w-80 border rounded-2xl p-4 shadow-2xl backdrop-blur-xl
        ${theme === "light" ? "bg-white border-gray-200" : "bg-slate-900/95 border-slate-700/60"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0 ${color}`}>{ic}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === "light" ? "text-gray-400" : "text-slate-500"}`}>Live Action</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className={`text-xs ${T.subText} leading-relaxed`}>
            <span className={`font-black ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}>{entry?.userName}</span>{" "}{entry?.action}
          </p>
        </div>
        <button onClick={onDismiss} className={`${T.label} hover:text-red-500 transition cursor-pointer`}><X size={14}/></button>
      </div>
      <motion.div className="h-0.5 bg-blue-500/30 mt-3 rounded-full overflow-hidden">
        <motion.div className="h-full bg-blue-500" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }} />
      </motion.div>
    </motion.div>
  );
}
