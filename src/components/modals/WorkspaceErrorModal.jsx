import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, Clock } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function WorkspaceErrorModal({ type, wsName, unlockAt, onClose, theme }) {
  const T = theme === "light" ? TL : TD;
  const isNotFound = type === "notFound";
  const isLockedOut = type === "lockedOut";
  const accent = { border:"border-red-500/30",bg:"bg-red-500/10",icon:"text-red-400",btn:"text-red-400",color:"text-red-500" };

  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, (unlockAt || 0) - Date.now()));

  useEffect(() => {
    if (!isLockedOut) return undefined;
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, (unlockAt || 0) - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [isLockedOut, unlockAt]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const isUnlocked = isLockedOut && remainingMs <= 0;
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={isLockedOut && !isUnlocked ? undefined : onClose}
    >
      <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className={`${T.modal} border ${accent.border} rounded-2xl p-8 max-w-sm w-full shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${accent.bg} border ${accent.border}`}>
            {isNotFound ? <AlertTriangle size={24} className={accent.icon} /> : isLockedOut ? <Clock size={24} className={accent.icon} /> : <Lock size={24} className={accent.icon} />}
          </div>
          <h3 className={`text-xl font-black ${T.text} mb-2`}>{isNotFound ? "Workspace Not Found" : isLockedOut ? "Too Many Attempts" : "Incorrect Password"}</h3>
          <p className={`text-sm ${T.subText} leading-relaxed`}>
            {isNotFound
              ? <>The workspace <span className={`font-black ${accent.color}`}>"{wsName}"</span> does not exist.</>
              : isLockedOut
              ? <>Too many failed attempts on <span className={`font-black ${accent.color}`}>"{wsName}"</span>. Access is temporarily locked for everyone's safety.</>
              : <>The password for <span className={`font-black ${accent.color}`}>"{wsName}"</span> is incorrect.</>
            }
          </p>
        </div>
        {isLockedOut ? (
          <div className={`p-4 rounded-xl mb-5 ${accent.bg} border ${accent.border} text-center`}>
            <p className={`text-[9px] font-black ${accent.color} uppercase tracking-widest mb-2`}>{isUnlocked ? "You can try again" : "Try again in"}</p>
            {!isUnlocked && <p className={`text-3xl font-black tabular-nums ${T.text}`}>{mm}:{ss}</p>}
          </div>
        ) : (
          <div className={`p-3 rounded-xl mb-5 ${accent.bg} border ${accent.border}`}>
            <p className={`text-[9px] font-black ${accent.color} uppercase tracking-widest mb-2`}>What to do:</p>
            <ul className={`text-xs ${accent.color} space-y-1`}>
              {isNotFound
                ? [<>• Check the workspace name (case-sensitive)</>,<>• Ask your admin for the correct name</>,<>• Or create a new workspace</>]
                : [<>• Double-check the password</>,<>• Ask your workspace admin</>]
              }
            </ul>
          </div>
        )}
        <button onClick={onClose} disabled={isLockedOut && !isUnlocked}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer">
          {isLockedOut && !isUnlocked ? "Please Wait…" : "Try Again"}
        </button>
      </motion.div>
    </motion.div>
  );
}
