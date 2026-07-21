import React from "react";
import { motion } from "framer-motion";

export default function QuotaBanner({ userTaskCount, limit, userResetDate, isPro, onUpgrade, theme }) {
  if (isPro) return null;
  const isExhausted = userTaskCount >= limit;
  const isWarning   = !isExhausted && userTaskCount >= limit - 1;
  
  const bgClass = isExhausted
    ? "bg-red-500/10 border-red-500/30"
    : isWarning
    ? "bg-amber-500/10 border-amber-500/30"
    : theme === "light"
    ? "bg-white border-gray-200 shadow-sm"
    : "bg-slate-800/60 border-slate-700/50";

  const textClass = isExhausted
    ? "text-red-500"
    : isWarning
    ? "text-amber-500"
    : theme === "light"
    ? "text-gray-500"
    : "text-slate-500";

  const btnClass = isExhausted
    ? "bg-red-500 border-red-400 text-white hover:bg-red-400"
    : "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-30 flex justify-center mt-2.5 px-3"
    >
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${bgClass}`}>
        <span className="text-[11px]">
          {isExhausted ? "" : isWarning ? "" : ""}
        </span>
        <p className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${textClass}`}>
          {isExhausted ? "Limit reached" : `${userTaskCount}/${limit} tasks this month`}
        </p>
        <button
          onClick={onUpgrade}
          className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border transition cursor-pointer whitespace-nowrap ${btnClass}`}
        >
          Go Pro
        </button>
      </div>
    </motion.div>
  );
}
