import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function MembersPanel({ members, onlineUsers, onClose, isPro, onUpgrade, theme }) {
  const T = theme === "light" ? TL : TD;
  const onlineEmails = onlineUsers.map(u => u.email);
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className={`fixed right-4 top-20 z-[90] w-64 sm:w-72 ${T.panelBg} rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto`}
    >
      <div className="flex justify-between items-center mb-4">
        <p className={`text-[9px] sm:text-[10px] font-black ${T.label} uppercase tracking-widest`}>Team{isPro ? ` (${members.length})` : ''}</p>
        <button onClick={onClose} className={`${T.label} hover:text-blue-500 transition cursor-pointer`}><X size={14}/></button>
      </div>
      {!isPro ? (
        <div className="relative">
          <div className="space-y-2 blur-[5px] opacity-40 select-none pointer-events-none">
            {[1,2,3].map((_, i) => (
              <div key={i} className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg}`}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] sm:text-xs font-black truncate ${T.text}`}>{"XXXXX XXXXX"}</p>
                  <p className={`text-[8px] sm:text-[9px] truncate ${T.label}`}>{"xxx@xxx.com"}</p>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest bg-blue-100 text-blue-700`}>{"member"}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Lock size={20} className={`${T.label} mb-3`} />
            <p className={`text-xs font-bold ${T.text} mb-1`}>Members panel is Pro only</p>
            <button onClick={onUpgrade} className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer transition">Upgrade</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {members.length === 0 && <p className={`text-xs ${T.label} text-center py-4`}>No members yet</p>}
          {members.map((m, i) => {
            const online = onlineEmails.includes(m.email);
            return (
              <div key={m.email || i} className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] sm:text-xs font-black truncate ${T.text}`}>{m.name}</p>
                  <p className={`text-[8px] sm:text-[9px] truncate ${T.label}`}>{m.email}</p>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{m.role}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
