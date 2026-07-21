import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, TrendingUp, X, Info, ChevronRight, Trash2, Lock } from "lucide-react";
import { TD, TL } from "../../lib/constants";
import { fmtTime } from "../../lib/utils";

export default function HistoryPanel({ history, onClose, isPro, onUpgrade, onClearHistory, theme }) {
  const T = theme === "light" ? TL : TD;
  const [flashKey, setFlashKey] = useState(null);

  useEffect(() => {
    const latest = history && history[0];
    if (!latest) {
      return;
    }

    const key = `${latest.timestamp || ""}-${latest.userName || ""}-${latest.action || ""}`;
    setFlashKey(key);
    const timer = setTimeout(() => setFlashKey(null), 4000);
    return () => clearTimeout(timer);
  }, [history]);

  const icon = (action) => {
    if (action?.includes("added"))   return { ic: <CheckCircle size={11}/>, color: "text-emerald-500" };
    if (action?.includes("moved"))   return { ic: <TrendingUp size={11}/>,  color: "text-blue-500"    };
    if (action?.includes("deleted")) return { ic: <X size={11}/>,           color: "text-red-500"     };
    if (action?.includes("joined"))  return { ic: <ChevronRight size={11}/>,color: "text-purple-500"  };
    return                                  { ic: <Info size={11}/>,        color: T.label            };
  };
  const highlight = (action) => {
    if (!action) return null;
    return action.split(/(To Do|In Progress|Done)/g).map((part, i) => {
      if (part === "To Do")       return <span key={i} className="px-1 py-0.5 rounded text-[8px] font-black bg-blue-100 text-blue-600 border border-blue-200">{part}</span>;
      if (part === "In Progress") return <span key={i} className="px-1 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-700 border border-amber-200">{part}</span>;
      if (part === "Done")        return <span key={i} className="px-1 py-0.5 rounded text-[8px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={`fixed right-4 top-20 z-[90] w-64 sm:w-72 ${T.panelBg} rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className={`text-[9px] sm:text-[10px] font-black ${T.label} uppercase tracking-widest`}>Action Log</p>
          {!isPro && <p className="text-[9px] text-amber-500/70 mt-0.5">Pro feature</p>}
        </div>
        <div className="flex items-center gap-2">
          {isPro && history && history.length > 0 && (
            <button onClick={onClearHistory} className={`${T.label} hover:text-red-500 transition cursor-pointer`} title="Clear all history"><Trash2 size={14}/></button>
          )}
          <button onClick={onClose} className={`${T.label} hover:text-blue-500 transition cursor-pointer`}><X size={14}/></button>
        </div>
      </div>
      {!isPro ? (
        <div className="relative">
          <div className="space-y-1.5 blur-[5px] opacity-40 select-none pointer-events-none">
            {[1,2,3,4,5].map((_, i) => (
              <div key={i} className={`flex gap-2 p-2 rounded-xl ${T.historyBg} border`}>
                <span className={`text-emerald-500 shrink-0 mt-0.5`}><CheckCircle size={11}/></span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] sm:text-[10px] font-bold ${T.text} break-words leading-relaxed`}>
                    <span className="text-blue-500 font-black">{"XXXXX"}</span> {" added task"}
                  </p>
                  <p className={`text-[8px] sm:text-[9px] ${T.label} mt-0.5`}>{"2m ago"}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-3 ${theme === "light" ? "bg-gray-100 border-gray-200" : "bg-slate-800 border-slate-700"}`}>
              <Lock size={16} className={T.label} />
            </div>
            <p className={`text-xs font-bold ${T.text} mb-1`}>History is Pro only</p>
            <p className={`text-[9px] ${T.label} mb-3`}>Track every team action</p>
            <button onClick={onUpgrade} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest transition cursor-pointer">Upgrade</button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {(!history || history.length === 0) && <p className={`text-[10px] ${T.label} text-center py-4`}>No actions yet</p>}
          {(history || []).map((h, i) => {
            const { ic, color } = icon(h.action);
            const entryKey = `${h.timestamp || ""}-${h.userName || ""}-${h.action || ""}`;
            const isFlashing = flashKey === entryKey;
            return (
              <div
                key={i}
                className={`flex gap-2 p-2 rounded-xl ${T.historyBg} border transition-all duration-300 ${isFlashing ? "ring-2 ring-emerald-400/70 shadow-lg shadow-emerald-500/20 scale-[1.01]" : ""}`}
              >
                <span className={`${color} shrink-0 mt-0.5`}>{ic}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] sm:text-[10px] font-bold ${T.text} break-words leading-relaxed`}>
                    <span className={h.userRole === "admin" ? "text-purple-500 font-black" : "text-blue-500 font-black"}>{h.userName}</span>{" "}
                    {highlight(h.action)}
                  </p>
                  <p className={`text-[8px] sm:text-[9px] ${T.label} mt-0.5`}>{fmtTime(h.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
