import React from "react";
import { motion } from "framer-motion";
import { X, Rocket, KeyRound, Columns3, Users, Award } from "lucide-react";

export default function AboutModal({ onClose }) {
  const steps = [
    { Icon: Rocket, color: "#6E9BF4", bg: "rgba(110,155,244,0.14)", title: "Overview", body: "SyncBoard is a real-time team task board that keeps everyone synced across devices without page refreshes." },
    { Icon: KeyRound, color: "#D9A441", bg: "rgba(217,164,65,0.14)", title: "Workspaces & Password", body: "Workspaces are private team project hubs. Each workspace has a unique handle for URL access and a password to prevent unauthorized access." },
    { Icon: Columns3, color: "#6E9BF4", bg: "rgba(110,155,244,0.14)", title: "Task Columns & Live Drag", body: "Organize work in To Do, In Progress, and Done. Drag and drop tasks between columns to update everyone instantly." },
    { Icon: Users, color: "#4ADE8F", bg: "rgba(74,222,143,0.14)", title: "Real-Time Presence & Activity", body: "See online status indicators for active team members and review the complete audit log of task actions with exact timestamps." },
    { Icon: Award, color: "#D9A441", bg: "rgba(217,164,65,0.14)", title: "Pro Features & Security", body: "Free accounts include standard task management, while Pro upgrades unlock expanded task capacity, smart search, full history logs, and image file attachments." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-100 p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-xl w-full rounded-2xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#12141B", border: "1px solid #232733", boxShadow: "0 40px 80px -32px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-[21px] font-bold tracking-tight" style={{ color: "#ECEEF2", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>How SyncBoard Works</h2>
            <p className="text-[12.5px] mt-1" style={{ color: "#8A90A0" }}>A short guide for first-time users</p>
          </div>
          <button onClick={onClose}
            className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center transition cursor-pointer shrink-0"
            style={{ background: "#171A22", border: "1px solid #232733", color: "#565C6E" }}>
            <X size={14}/>
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-5">
          {steps.map((step) => (
            <div key={step.title} className="flex gap-3.5 rounded-[13px] p-4"
              style={{ background: "#171A22", border: "1px solid #1B1E28" }}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: step.bg, color: step.color }}>
                <step.Icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold mb-1" style={{ color: "#ECEEF2" }}>{step.title}</p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "#8A90A0" }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-3.5 rounded-[11px] text-[13px] font-bold uppercase tracking-wide transition cursor-pointer"
          style={{ background: "#6E9BF4", color: "#0B0D12" }}>
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}
