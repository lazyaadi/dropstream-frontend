import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function AboutModal({ onClose, theme }) {
  const T = theme === "light" ? TL : TD;
  const steps = [
    { icon: "🚀", title: "Overview", body: "SyncBoard is a real-time team task board that keeps everyone synced across devices without page refreshes." },
    { icon: "🔑", title: "Workspaces & PIN", body: "Workspaces are private team project hubs. Each workspace has a unique Handle for URL access and a 6-digit PIN to prevent unauthorized access." },
    { icon: "⚡", title: "Task Columns & Live Drag", body: "Organize work in To Do, In Progress, and Done. Drag and drop tasks between columns to update everyone instantly." },
    { icon: "👤", title: "Real-Time Presence & Activity", body: "See online status indicators for active team members and review the complete audit log of task actions with exact timestamps." },
    { icon: "💎", title: "Pro Features & Security", body: "Free accounts include standard task management, while Pro upgrades unlock expanded task capacity, smart search, full history logs, and image file attachments." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-100 p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`${T.modal} border rounded-2xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto font-sans`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className={`text-lg sm:text-xl font-semibold tracking-tight ${T.text}`}>How SyncBoard Works</h2>
            <p className={`text-[10px] sm:text-xs ${T.label} mt-0.5`}>A short guide for first-time users</p>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg ${theme === "light" ? "bg-gray-100" : "bg-slate-800"} flex items-center justify-center ${T.label} hover:text-red-500 transition cursor-pointer`}><X size={14}/></button>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.title} className={`flex gap-3 p-4 rounded-xl border ${theme === "light" ? "bg-gray-50 border-gray-200" : "bg-slate-800/40 border-slate-700/80"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/15 text-blue-300"}`}>
                <span aria-hidden="true">{step.icon}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold tracking-tight ${T.text} mb-1`}>{step.title}</p>
                <p className={`text-[11px] sm:text-[12px] ${T.subText} leading-relaxed`}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className={`w-full mt-5 text-[10px] font-semibold uppercase ${T.label} hover:text-blue-500 transition py-2 cursor-pointer tracking-[0.2em]`}>Got it</button>
      </motion.div>
    </motion.div>
  );
}
