import React from "react";
import { motion } from "framer-motion";
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
  
  const memberByEmail = new Map();
  const memberByName = new Map();
  memberList.forEach(m => {
    const me = (typeof m === 'object' && m !== null) ? m : { email: m, name: '' };
    if (me?.email) memberByEmail.set(normEmail(me.email), me);
    const n = normName(me.name || me.displayName || '');
    if (n) memberByName.set(n.toLowerCase(), me);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className={`fixed right-2 top-2 sm:right-4 sm:top-16 z-[120] w-[min(15rem,calc(100vw-0.75rem))] ${T.panelBg} rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[calc(100dvh-2rem)] sm:max-h-[80vh] flex flex-col overflow-hidden touch-pan-y`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className={`text-[10px] font-medium ${T.label} uppercase tracking-widest`}>Online</p>
        </div>
        <button onClick={onClose} className={`${T.label} hover:text-blue-500 transition cursor-pointer p-1`}>
          <X size={14}/>
        </button>
      </div>

      {!isPro ? (
        <>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0 touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
            {safeCurrent && (
              <div className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg}`}>
                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-400 animate-pulse" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0
                  ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                >{(safeCurrent.name || "?").charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${T.text}`}>{safeCurrent.name || "You"}</p>
                  {safeCurrent.email && <p className={`text-[9px] truncate ${theme === "light" ? "text-slate-500" : "text-slate-300"}`}>{safeCurrent.email}</p>}
                </div>
              </div>
            )}
            {[1, 2].map((i) => (
              <div key={i} className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg}`}>
                <span className="w-2 h-2 rounded-full shrink-0 bg-slate-600" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium blur-[5px] opacity-40 shrink-0
                  ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                >?</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${T.text} blur-[5px] opacity-40`}>XXXXX XXXXX</p>
                  <p className={`text-[9px] truncate ${theme === "light" ? "text-slate-500" : "text-slate-300"} blur-[5px] opacity-40`}>xxx@xxx.com</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onUpgrade} className="w-full mt-3 py-2 shrink-0 rounded-xl font-medium text-[9px] uppercase tracking-widest cursor-pointer bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition border border-amber-500/20">
            See full online list
          </button>
        </>
      ) : (
        <div className="overflow-y-auto pr-1 flex-1 min-h-0 space-y-2 touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
          {displayUsers.length === 0 && <p className={`text-xs ${T.label} text-center py-4`}>No one online</p>}
          {displayUsers.map((u, i) => {
            const isSelf = safeCurrent && isSameOnlineUser(u, safeCurrent);
            const memberMatch = (u?.email && memberByEmail.get(normEmail(u.email))) || (u?.name && memberByName.get(normName(u.name).toLowerCase()));
            const resolvedName = (u?.name || u?.displayName || memberMatch?.name || "").trim();
            const nameText = resolvedName || (u?.email && u.email.includes("@") ? u.email.split("@")[0] : "Unknown");
            const displayEmail = u.email || memberMatch?.email || (isSelf ? (safeCurrent?.email || null) : null);
            const displayName = isSelf ? `${nameText} (You)` : nameText;
            return (
              <div key={normEmail(u.email) || normName(u.name) || i} className={`p-2 rounded-xl border flex items-center gap-2 ${T.historyBg} transition-all hover:${theme === "light" ? "bg-gray-100" : "bg-slate-700/50"}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0
                  ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                >{displayName.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-medium truncate ${T.text}`}>{displayName}</p>
                  </div>
                  {displayEmail && (
                    <p className={`text-[9px] truncate ${theme === "light" ? "text-slate-500" : "text-slate-300"}`}>{displayEmail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}