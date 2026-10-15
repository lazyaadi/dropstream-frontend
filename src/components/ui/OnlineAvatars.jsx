import React from "react";
import { normEmail, normName, isSameOnlineUser } from "../../lib/utils";
import { sbVars } from "../../lib/sbTheme";

// Soft tinted avatars (blue / purple / amber), same look as the navbar mockup.
const TONES = [
  "bg-[color:var(--sb-blue-soft)] text-[color:var(--sb-blue)]",
  "bg-[color:var(--sb-purple-soft)] text-[color:var(--sb-purple)]",
  "bg-[color:var(--sb-amber-soft)] text-[color:var(--sb-amber)]",
];

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

  // Ring color matches the navbar background so avatars look cut out of it.
  const ring = theme === "light" ? "#FFFFFF" : "#0B0D12";
  const mono = { fontFamily: "var(--sb-mono)" };

  return (
    <button
      onClick={onClick}
      style={sbVars(theme)}
      className="flex items-center justify-center px-2 py-1.5 rounded-lg transition cursor-pointer hover:bg-[color:var(--sb-surface-2)]"
      title="Online users"
      aria-label="Online users"
    >
      <div className="flex -space-x-2">
        {list.slice(0, 3).map((u, i) => (
          <div
            key={i}
            className={`w-[27px] h-[27px] rounded-full border-2 flex items-center justify-center text-[9.5px] font-semibold transition hover:scale-110 ${TONES[i % TONES.length]}`}
            style={{ ...mono, borderColor: ring }}
          >
            {isPro ? u.name?.charAt(0).toUpperCase() : "?"}
          </div>
        ))}
        {list.length > 3 && (
          <div
            className="w-[27px] h-[27px] rounded-full border-2 flex items-center justify-center text-[9px] font-semibold bg-[color:var(--sb-surface-3)] text-[color:var(--sb-text-2)]"
            style={{ ...mono, borderColor: ring }}
          >
            +{list.length - 3}
          </div>
        )}
      </div>
      <span
        className="-ml-1.5 w-2 h-2 rounded-full border-2 animate-pulse bg-[color:var(--sb-green)]"
        style={{ borderColor: ring }}
        aria-hidden="true"
      />
    </button>
  );
}