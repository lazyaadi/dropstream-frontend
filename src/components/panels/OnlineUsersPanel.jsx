import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { TD, TL } from "../../lib/constants";
import { normEmail, normName, isSameOnlineUser } from "../../lib/utils";

export default function OnlineUsersPanel({ users, members, isPro, onClose, onUpgrade, theme, currentUser }) {
  const T = theme === "light" ? TL : TD;
  const safeCurrent = (currentUser?.email || currentUser?.name) ? currentUser : null;
  const selfRow = safeCurrent
    ? { name: safeCurrent.name, email: safeCurrent.email || null, locked: false }
    : null;
  const fromServer = safeCurrent
    ? users.filter(u => !isSameOnlineUser(u, safeCurrent))
    : users;
  const merged = selfRow ? [selfRow, ...fromServer] : fromServer;
  const unique = [];
  const seen = new Set();
  merged.forEach(u => {
    const key = normEmail(u.email) || normName(u.name).toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(u);
  });
  const displayUsers = unique.filter(u => u?.name || u?.email);
  const memberList = Array.isArray(members) ? members : [];
  const onlineEmails = new Set(displayUsers.map(u => normEmail(u.email)));
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className={`fixed right-4 top-20 z-[90] w-64 sm:w-72 ${T.panelBg} rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className={`text-[10px] font-black ${T.label} uppercase tracking-widest`}>Online</p>
        </div>
        <button onClick={onClose} className={`${T.label} hover:text-blue-500 transition cursor-pointer`}><X size={14}/></button>
      </div>
      {!isPro ? (
        <>
          <div className="space-y-2">
            {safeCurrent && (
              <div className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg}`}>
                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-400 animate-pulse" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black
                  ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                >{(safeCurrent.name || "?").charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black truncate ${T.text}`}>{safeCurrent.name || "You"}</p>
                  {safeCurrent.email && <p className={`text-[9px] truncate ${T.label}`}>{safeCurrent.email}</p>}
                </div>
              </div>
            )}
            {[1, 2].map((i) => (
              <div key={i} className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg}`}>
                <span className="w-2 h-2 rounded-full shrink-0 bg-slate-600" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black blur-[5px] opacity-40
                  ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                >?</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black truncate ${T.text} blur-[5px] opacity-40`}>XXXXX XXXXX</p>
                  <p className={`text-[9px] truncate ${T.label} blur-[5px] opacity-40`}>xxx@xxx.com</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onUpgrade} className="w-full mt-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition border border-amber-500/20">
            See full online list
          </button>
        </>
      ) : (
        <>
          {displayUsers.length === 0 && <p className={`text-xs ${T.label} text-center py-4`}>No one online</p>}
          <div className="space-y-2">
            {displayUsers.map((u, i) => {
              const isSelf = safeCurrent && isSameOnlineUser(u, safeCurrent);
              const nameText = u.name || "Unknown";
              const displayEmail = u.email || (isSelf ? (safeCurrent?.email || null) : null);
              return (
              <div key={normEmail(u.email) || normName(u.name) || i} className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg} transition-all hover:${theme === "light" ? "bg-gray-100" : "bg-slate-700/50"}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black
                  ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                >{nameText.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-black truncate ${T.text}`}>{nameText}</p>
                  </div>
                  {displayEmail && (
                    <p className={`text-[9px] truncate ${T.label}`}>{displayEmail}</p>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
