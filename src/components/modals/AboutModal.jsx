import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function AboutModal({ onClose, theme }) {
  const T = theme === "light" ? TL : TD;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`${T.modal} border rounded-2xl p-7 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className={`text-base font-black ${T.text}`}>How SyncBoard Works</h2>
            <p className={`text-[10px] ${T.label} mt-0.5`}>Everything you need to know</p>
          </div>
          <button onClick={onClose} className={`w-7 h-7 rounded-lg ${theme === "light" ? "bg-gray-100" : "bg-slate-800"} flex items-center justify-center ${T.label} hover:text-red-500 transition cursor-pointer`}><X size={14}/></button>
        </div>
        <ul className={`space-y-3 list-disc pl-5 ${theme === "light" ? "text-gray-700" : "text-slate-200"}`}>
          {[
            { title: "Workspaces", body: "Create private task boards for your team. Each workspace has a unique handle, 6-digit PIN, and project title. Share the handle and PIN with team members to collaborate." },
            { title: "Workspace Handle + PIN", body: "The handle identifies your workspace (used in URLs). The 6-digit PIN protects it from unauthorized access. Only share the PIN with trusted team members." },
            { title: "Task Management", body: "Organize work in three columns: To Do, In Progress, Done. Drag & drop tasks between columns. Changes sync instantly to all connected team members." },
            { title: "Your Account", body: "Sign in with email and password. Your account tracks task usage and Pro status. You can view your team's online status (Pro feature)." },
            { title: "Free vs Pro", body: "Free: 3 tasks/month, basic features. Pro: 3,000 tasks/month, smart search, full history, timestamps, live notifications, team analytics, file attachments, and more." },
            { title: "Security", body: "PIN-protected workspaces prevent unauthorized access. Passwords are hashed server-side. Your email and workspace data are never shared publicly." },
            { title: "Real-Time Sync", body: "All team members see updates instantly. When someone adds, moves, or deletes a task, everyone's board updates immediately without refreshing." },
            { title: "Team Insights", body: "Pro users can see who's online, view complete action history, and access member details. Track all changes with full timestamps and audit trails." },
          ].map((s, i) => (
            <li key={i} className={`p-4 rounded-xl border ${theme === "light" ? "bg-gray-50 border-gray-200" : "bg-slate-800/40 border-slate-700/40"}`}>
              <p className={`text-xs font-black ${T.text} mb-1`}>{s.title}</p>
              <p className={`text-[11px] ${T.subText} leading-relaxed`}>{s.body}</p>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className={`w-full mt-5 text-[10px] font-black uppercase ${T.label} hover:text-blue-500 transition py-2 cursor-pointer`}>Got it →</button>
      </motion.div>
    </motion.div>
  );
}
