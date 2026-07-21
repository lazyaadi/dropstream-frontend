import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -20, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.94 }}
            layout
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border backdrop-blur-md whitespace-nowrap max-w-xs ${
              t.type === "sync"
                ? "bg-slate-900/90 border-blue-500/40 text-blue-300"
                : t.type === "success"
                ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
                : t.type === "delete"
                ? "bg-slate-900/90 border-red-500/35 text-red-300"
                : t.type === "warn"
                ? "bg-slate-900/90 border-amber-500/40 text-amber-300"
                : "bg-slate-900/90 border-amber-500/50 text-amber-200"
            }`}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
