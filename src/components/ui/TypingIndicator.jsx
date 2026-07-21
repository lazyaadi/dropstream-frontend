import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TypingIndicator({ typers }) {
  if (!typers?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/50 backdrop-blur-xl"
    >
      <div className="flex gap-0.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-1 h-1 rounded-full bg-blue-400"
            animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }} />
        ))}
      </div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {typers.map(t => t.name).join(", ")} {typers.length === 1 ? "is" : "are"} typing…
      </span>
    </motion.div>
  );
}