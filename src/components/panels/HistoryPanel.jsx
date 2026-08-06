import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, TrendingUp, X, Info, ChevronRight, Trash2, Lock } from "lucide-react";
import { TD, TL } from "../../lib/constants";
import { fmtTime } from "../../lib/utils";

export default function HistoryPanel({ history, onClose, isPro, onUpgrade, onClearHistory, theme }) {
  const T = theme === "light" ? TL : TD;

  const icon = (action) => {
    if (action?.includes("added"))   return { ic: <CheckCircle size={11}/>, color: "text-emerald-500" };
    if (action?.includes("moved"))   return { ic: <TrendingUp size={11}/>,  color: "text-blue-500"    };
    if (action?.includes("deleted")) return { ic: <X size={11}/>,           color: "text-red-500"     };
    if (action?.includes("joined"))  return { ic: <ChevronRight size={11}/>,color: "text-purple-500"  };
    return                                  { ic: <Info size={11}/>,        color: T.label            };
  };
  const statusTone = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("done")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (normalized.includes("progress")) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };
  const statusLabel = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("done")) return "DONE";
    if (normalized.includes("progress")) return "IN PROGRESS";
    return "TODO";
  };
  const renderAction = (action) => {
    if (!action) return null;
    const taskMatch = action.match(/^(created|added|moved|deleted|removed) task '(.+?)'(?: to (To Do|In Progress|Done))?$/i);
    if (taskMatch) {
      const [, verb, taskTitle, targetStatus] = taskMatch;
      const normalizedVerb = verb.toLowerCase();
      const verbLabel = normalizedVerb === "moved"
        ? "moved task"
        : normalizedVerb === "deleted"
          ? "deleted task"
          : normalizedVerb === "removed"
            ? "removed task"
            : "created task";
      const resolvedTargetStatus = targetStatus || (normalizedVerb === "created" || normalizedVerb === "added" ? "To Do" : "");
      return (
        <>
          <span className="whitespace-nowrap">{`${verbLabel} :`}</span>
          <span className={`block mt-0.5 font-semibold ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{`"${taskTitle}"`}</span>
          {resolvedTargetStatus && (
            <span className={`block w-fit mt-1 px-2 py-0.5 rounded-md border text-[8px] font-medium uppercase tracking-widest ${statusTone(resolvedTargetStatus)}`}>
              {`→ ${statusLabel(resolvedTargetStatus)}`}
            </span>
          )}
        </>
      );
    }
    return action.split(/(To Do|In Progress|Done)/g).map((part, i) => {
      if (part === "To Do")       return <span key={i} className="block w-fit mt-1 px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-500/10 text-red-400 border border-red-500/30">{part}</span>;
      if (part === "In Progress") return <span key={i} className="block w-fit mt-1 px-1.5 py-0.5 rounded text-[8px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">{part}</span>;
      if (part === "Done")        return <span key={i} className="block w-fit mt-1 px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={`fixed right-2 top-2 sm:right-4 sm:top-16 z-[120] w-[min(15rem,calc(100vw-0.75rem))] ${T.panelBg} rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className={`text-[9px] sm:text-[10px] font-medium ${T.label} uppercase tracking-widest`}>Action Log</p>
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
        <div className="relative max-h-[calc(70vh-3.5rem)] sm:max-h-[calc(80vh-4rem)] overflow-y-auto pr-1">
          <div className="space-y-1.5 blur-[5px] opacity-40 select-none pointer-events-none">
            {[1,2,3,4,5].map((_, i) => (
              <div key={i} className={`flex gap-2 p-2 rounded-xl ${T.historyBg} border`}>
                <span className={`text-emerald-500 shrink-0 mt-0.5`}><CheckCircle size={11}/></span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] sm:text-[10px] font-medium ${T.text} break-words leading-relaxed`}>
                    <span className="text-blue-500 font-medium">{"XXXXX"}</span> {" added task"}
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
            <p className={`text-xs font-medium ${T.text} mb-1`}>History is Pro only</p>
            <p className={`text-[9px] ${T.label} mb-3`}>Track every team action</p>
            <button onClick={onUpgrade} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium text-[9px] uppercase tracking-widest transition cursor-pointer">Upgrade</button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[calc(70vh-3.5rem)] sm:max-h-[calc(80vh-4rem)] overflow-y-auto pr-1">
          {(!history || history.length === 0) && <p className={`text-[10px] ${T.label} text-center py-4`}>No actions yet</p>}
          {(history || []).map((h, i) => {
            const { ic, color } = icon(h.action);
            return (
              <div
                key={i}
                className={`flex gap-2 p-2 rounded-xl ${T.historyBg} border`}
              >
                <span className={`${color} shrink-0 mt-0.5`}>{ic}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] sm:text-[10px] font-medium ${T.text} break-words leading-relaxed`}>
                    <span className={h.userRole === "admin" ? "text-purple-500 font-medium" : "text-blue-500 font-medium"}>{h.userName}</span>{" "}
                    {renderAction(h.action)}
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
