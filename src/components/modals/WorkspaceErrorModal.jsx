import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function WorkspaceErrorModal({ type, wsName, onClose, theme }) {
  const T = theme === "light" ? TL : TD;
  const isNotFound = type === "notFound";
  const accent = isNotFound ? { border:"border-red-500/30",bg:"bg-red-500/10",icon:"text-red-400",btn:"text-red-400",color:"text-red-500" } : { border:"border-amber-500/30",bg:"bg-amber-500/10",icon:"text-amber-400",btn:"text-amber-400",color:"text-amber-500" };
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}
    >
      <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className={`${T.modal} border ${accent.border} rounded-2xl p-8 max-w-sm w-full shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${accent.bg} border ${accent.border}`}>
            {isNotFound ? <AlertTriangle size={24} className={accent.icon} /> : <Lock size={24} className={accent.icon} />}
          </div>
          <h3 className={`text-xl font-black ${T.text} mb-2`}>{isNotFound ? "Workspace Not Found" : "Incorrect PIN"}</h3>
          <p className={`text-sm ${T.subText} leading-relaxed`}>
            {isNotFound
              ? <>The workspace <span className={`font-black ${accent.color}`}>"{wsName}"</span> does not exist.</>
              : <>The PIN for <span className={`font-black ${accent.color}`}>"{wsName}"</span> is incorrect.</>
            }
          </p>
        </div>
        <div className={`p-3 rounded-xl mb-5 ${accent.bg} border ${accent.border}`}>
          <p className={`text-[9px] font-black ${accent.color} uppercase tracking-widest mb-2`}>What to do:</p>
          <ul className={`text-xs ${accent.color} space-y-1`}>
            {isNotFound
              ? [<>• Check the workspace name (case-sensitive)</>,<>• Ask your admin for the correct name</>,<>• Or create a new workspace</>]
              : [<>• Double-check the 6-digit PIN</>,<>• Ask your workspace admin</>]
            }
          </ul>
        </div>
        <button onClick={onClose} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer">Try Again</button>
      </motion.div>
    </motion.div>
  );
}
