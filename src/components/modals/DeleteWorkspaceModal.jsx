import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function DeleteWorkspaceModal({ wsName, input, onChange, onConfirm, onCancel, theme }) {
  const T = theme === "light" ? TL : TD;
  const isMatched = input.trim() === wsName;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4"
      onClick={onCancel}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${T.modal} border rounded-2xl p-7 max-w-md w-full shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === "light" ? "bg-red-100" : "bg-red-500/20"}`}>
            <Trash2 size={20} className={theme === "light" ? "text-red-600" : "text-red-400"} />
          </div>
          <h3 className={`text-lg font-black ${theme === "light" ? "text-red-600" : "text-red-400"}`}>Delete Workspace</h3>
        </div>
        
        <p className={`${T.text} text-sm mb-4`}>This action is <strong>permanent</strong> and cannot be undone. All tasks, history, and data will be deleted.</p>
        
        <p className={`${T.label} text-xs mb-2 font-bold uppercase tracking-widest`}>Type the workspace name to confirm:</p>
        <input 
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={wsName}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono mb-4 transition-all
            ${isMatched 
              ? (theme === "light" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-300")
              : (theme === "light" ? "bg-gray-100 border-gray-300 text-gray-700" : "bg-slate-800/50 border-slate-700 text-slate-300")
            }`}
        />
        
        <p className={`text-[11px] ${T.label} mb-4 font-bold`}>Workspace name: <code className="font-black">{wsName}</code></p>
        
        <div className="flex gap-3">
          <button onClick={onCancel}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest transition cursor-pointer
              ${theme === "light" ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >Cancel</button>
          <button onClick={onConfirm} disabled={!isMatched}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest transition cursor-pointer
              ${isMatched 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : (theme === "light" ? "bg-red-200 text-red-500 cursor-not-allowed" : "bg-red-500/20 text-red-700 cursor-not-allowed")
              }`}
          >Delete Workspace</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
