import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, Clock, Check, RefreshCw } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function WorkspaceErrorModal({ type, wsName, unlockAt, onClose, theme }) {
  const T = theme === "light" ? TL : TD;
  const isNotFound = type === "notFound";
  const isLockedOut = type === "lockedOut";
  const accent = { border:"border-red-500/30",bg:"bg-red-500/10",icon:"text-red-400",btn:"text-red-400",color:"text-red-500" };

  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, (unlockAt || 0) - Date.now()));
  const totalMsRef = useRef(null);
  if (isLockedOut && totalMsRef.current === null) {
    totalMsRef.current = Math.max(1000, (unlockAt || 0) - Date.now());
  }

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
  if (isLockedOut) {
    const CIRC = 251.2;
    const pct = Math.max(0, Math.min(1, remainingMs / totalMsRef.current));
    const dashOffset = CIRC * (1 - pct);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
        onClick={isUnlocked ? onClose : undefined}
      >
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-2xl p-9 shadow-2xl"
          style={{ background: "#12141B", border: "1px solid #242833", boxShadow: "0 40px 80px -32px rgba(0,0,0,0.6)" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-7">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D9A441", boxShadow: "0 0 0 3px rgba(217,164,65,0.10)" }} />
            <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#5C6274" }}>Account Security</span>
          </div>

          <div className="relative w-22 h-22 mx-auto mb-6" style={{ width: 88, height: 88 }}>
            <svg viewBox="0 0 92 92" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="46" cy="46" r="40" fill="none" stroke="#1C1F29" strokeWidth="4" />
              <circle cx="46" cy="46" r="40" fill="none" stroke="#D9A441" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[13px] font-medium tabular-nums" style={{ color: "#ECEEF2" }}>
              {mm}:{ss}
            </div>
          </div>

          <h3 className="text-center text-[22px] font-semibold mb-2.5" style={{ color: "#ECEEF2", letterSpacing: "-0.01em" }}>Too many attempts</h3>
          <p className="text-center text-sm leading-relaxed mb-7" style={{ color: "#8A90A0" }}>
            We've temporarily locked sign-in for{" "}
            <span className="inline-flex text-[12.5px] px-1.5 py-0.5 rounded" style={{ color: "#D9A441", background: "rgba(217,164,65,0.10)", border: "1px solid rgba(217,164,65,0.22)" }}>
              {wsName}
            </span>{" "}
            to protect the account. This happens automatically after repeated failed attempts.
          </p>

          <div className="h-[3px] rounded-full mb-5.5 overflow-hidden" style={{ background: "#1C1F29" }}>
            <div className="h-full" style={{ width: `${pct * 100}%`, background: "linear-gradient(90deg, #8A6B2E, #D9A441)", transition: "width 1s linear" }} />
          </div>
          <div className="flex justify-between text-[11px] mb-7" style={{ color: "#5C6274" }}>
            <span>Locked</span>
            <span style={{ color: "#8A90A0" }}>{isUnlocked ? "Unlocked" : `Unlocks in ${mm}:${ss}`}</span>
          </div>

          <button onClick={onClose} disabled={!isUnlocked}
            className="w-full py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
            style={{
              background: "#171A22", border: "1px solid #242833",
              color: isUnlocked ? "#ECEEF2" : "#5C6274",
              cursor: isUnlocked ? "pointer" : "not-allowed",
            }}
          >
            {!isUnlocked && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#5C6274" }} />}
            {isUnlocked ? "Try again" : "Please wait…"}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  const todos = isNotFound
    ? ["Check the workspace name (case-sensitive)", "Ask your admin for the correct name", "Or create a new workspace"]
    : ["Double-check the password", "Ask your workspace admin"];

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}
    >
      <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="w-full max-w-sm rounded-2xl p-9 shadow-2xl"
        style={{ background: "#12141B", border: "1px solid #232733", boxShadow: "0 40px 80px -32px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-2.5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(240,87,107,0.12)", border: "1px solid rgba(240,87,107,0.28)" }}>
            {isNotFound ? <AlertTriangle size={24} style={{ color: "#F0576B" }} /> : <Lock size={24} style={{ color: "#F0576B" }} />}
          </div>
          <h3 className="text-[21px] font-bold mb-2.5" style={{ color: "#ECEEF2", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
            {isNotFound ? "Workspace Not Found" : "Incorrect Password"}
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#8A90A0" }}>
            {isNotFound ? "The workspace" : "The password for"}{" "}
            <span className="inline-flex text-[12.5px] px-1.5 py-0.5 rounded" style={{ color: "#F0576B", background: "rgba(240,87,107,0.12)", border: "1px solid rgba(240,87,107,0.24)" }}>
              {wsName}
            </span>{" "}
            {isNotFound ? "does not exist." : "is incorrect."}
          </p>
        </div>

        <div className="rounded-xl p-4 mb-5.5" style={{ background: "rgba(240,87,107,0.10)", border: "1px solid rgba(240,87,107,0.24)" }}>
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#F0576B", fontFamily: "'IBM Plex Mono', monospace" }}>
            <AlertTriangle size={12} />
            What to do
          </div>
          <div className="flex flex-col gap-2">
            {todos.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] leading-snug" style={{ color: "#8A90A0" }}>
                <Check size={13} style={{ color: "#F0576B", opacity: 0.85, marginTop: 2, flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {!isNotFound && (
          <div className="flex items-center gap-2 mb-5 px-1">
            <Clock size={13} style={{ color: "#D9A441", opacity: 0.85, flexShrink: 0 }} />
            <p className="text-[11.5px] leading-snug" style={{ color: "#8A90A0" }}>
              3 wrong attempts will temporarily lock this workspace for everyone.
            </p>
          </div>
        )}

        {!isNotFound && (
          <div className="flex items-center gap-2 mb-5 px-1">
            <Clock size={13} style={{ color: "#D9A441", opacity: 0.85, flexShrink: 0 }} />
            <p className="text-[11.5px] leading-snug" style={{ color: "#8A90A0" }}>
              3 wrong attempts will temporarily lock this workspace.
            </p>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition cursor-pointer"
          style={{ background: "#6E9BF4", color: "#0B0D12" }}>
          Try Again
          <RefreshCw size={15} />
        </button>
      </motion.div>
    </motion.div>
  );
}
