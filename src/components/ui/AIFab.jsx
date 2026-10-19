import React from "react";
import { X } from "lucide-react";
import { sbVars } from "../../lib/sbTheme";


export default function AIFab({ open, onToggle, theme }) {
  return (
    <button
      onClick={onToggle}
      aria-label={open ? "Close Ghostfreak AI" : "Open Ghostfreak AI"}
      aria-expanded={open}
      title="Ghostfreak AI"
      style={{
        ...sbVars(theme),
        background: "#14171F",
        right: "max(1.5rem, env(safe-area-inset-right))",
        bottom: "max(1.5rem, env(safe-area-inset-bottom))",
        boxShadow: "0 10px 30px -8px rgba(0,0,0,0.45), 0 0 0 1px rgba(110,155,244,0.12)",
      }}
      className="group fixed z-40 w-14 h-14 rounded-full flex items-center justify-center border border-[color:var(--sb-blue-line)] cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--sb-blue)]"
    >
      {open ? (
        <X size={22} color="#ECEEF2" />
      ) : (
        <img
          src="/ghostfreak.png"
          alt=""
          width={36}
          height={36}
          draggable={false}
          style={{ imageRendering: "pixelated" }}
        />
      )}

      {/* online dot */}
      <span
        className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 bg-[color:var(--sb-green)]"
        style={{ borderColor: "#14171F" }}
        aria-hidden="true"
      />

      {/* hover label (desktop only, hidden while open) */}
      {!open && (
        <span
          className="pointer-events-none absolute right-full mr-3 hidden sm:block whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 bg-[color:var(--sb-surface)] border-[color:var(--sb-border)] text-[color:var(--sb-text)]"
          style={{ fontFamily: "var(--sb-mono)" }}
        >
          Ask Ghostfreak AI
        </span>
      )}
    </button>
  );
}
