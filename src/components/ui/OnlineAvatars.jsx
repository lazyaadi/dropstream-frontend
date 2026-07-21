import React from "react";
import { normEmail, normName, isSameOnlineUser } from "../../lib/utils";

export default function OnlineAvatars({ users, isPro, onClick, theme, currentUser }) {
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
  const list = isPro ? unique : (safeCurrent ? [selfRow || safeCurrent] : unique.slice(0, 1));
  if (!list.length) return null;
  const colors = ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-pink-600"];
  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition cursor-pointer ${theme === "light" ? "hover:bg-gray-200" : "hover:bg-slate-800/80"}`}
      title="Online users"
    >
      <div className="flex -space-x-2">
        {list.slice(0, 3).map((u, i) => (
          <div key={i} className={`w-6 h-6 rounded-full ${colors[i % colors.length]} border-2 ${theme === "light" ? "border-white" : "border-slate-900"} flex items-center justify-center text-[8px] font-black text-white transition hover:scale-110`}>
            {isPro ? u.name?.charAt(0).toUpperCase() : "?"}
          </div>
        ))}
        {list.length > 3 && (
          <div className={`w-6 h-6 rounded-full ${theme === "light" ? "bg-gray-300" : "bg-slate-700"} border-2 ${theme === "light" ? "border-white" : "border-slate-900"} flex items-center justify-center text-[7px] font-black ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}>
            +{list.length - 3}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </button>
  );
}
