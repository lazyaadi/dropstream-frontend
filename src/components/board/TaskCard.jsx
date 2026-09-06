
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lock, Clock, AlertTriangle, X, Paperclip } from "lucide-react";
import { PRIORITY, TD, TL } from "../../lib/constants";
import { fmtFull, obfuscateText } from "../../lib/utils";
import DotsIcon from "../ui/DotsIcon";

export default function TaskCard({ task, onDelete, role, isPro, isOverlay = false, theme, onUpgrade }) {
  const T   = theme === "light" ? TL : TD;
  const p   = PRIORITY[task.priority] || PRIORITY.medium;
  const pCls = theme === "light" ? p.clsLight : p.cls;
  const canEdit = role === "member" || role === "admin";
  const isDone = task.status === "done";
  const statusMeta = isDone
    ? { label: "DONE", color: theme === "light" ? "text-emerald-700" : "text-emerald-400", dot: theme === "light" ? "bg-emerald-600" : "bg-emerald-400", shadow: theme === "light" ? "0 0 0 3px rgba(5,150,105,0.12)" : "0 0 0 3px rgba(74,222,143,0.15)" }
    : task.status === "in-progress"
      ? { label: "IN PROGRESS", color: theme === "light" ? "text-amber-700" : "text-amber-400", dot: theme === "light" ? "bg-amber-600" : "bg-amber-400", shadow: theme === "light" ? "0 0 0 3px rgba(180,83,9,0.12)" : "0 0 0 3px rgba(217,164,65,0.15)" }
      : { label: "TO DO", color: theme === "light" ? "text-red-700" : "text-red-400", dot: theme === "light" ? "bg-red-600" : "bg-red-400", shadow: theme === "light" ? "0 0 0 3px rgba(220,38,38,0.12)" : "0 0 0 3px rgba(240,87,107,0.15)" };
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const [showImage, setShowImage] = useState(false);
  const isDueToday = task.dueDate && !isOverdue && (() => {
    const due = new Date(task.dueDate), now = new Date();
    return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
  })();
  const creatorInitials = (task.addedBy || "")
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const completedInitials = (task.completedBy || "")
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const lockedMetaCls = "blur-[3px] opacity-40 select-none pointer-events-none";
  const fmtCardTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    transition: { duration: 220, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
  });

  if (isOverlay) {
    return (
      <div className={`p-4 rounded-xl border shadow-2xl mb-3 rotate-1 opacity-95 select-none
        ${theme === "light" ? "bg-blue-50 border-blue-400 shadow-blue-200" : "bg-slate-700 border-blue-500/60 shadow-blue-500/20"}`}>
        <p className={`text-sm font-semibold ${T.cardText}`}>{task.title}</p>
        <span className={`inline-block mt-2 text-[8px] font-black px-2 py-0.5 rounded-md border ${pCls}`}>{p.label}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0.35 : 1,
        contentVisibility: "auto",
        containIntrinsicSize: "0 140px",
      }}
      className={`${T.card} backdrop-blur-none md:backdrop-blur-sm p-3 rounded-xl border mb-4 shadow-md group relative
        ${isDragging ? "z-0" : "transition-shadow duration-200"}
        ${isOverdue ? (theme === "light" ? "border-red-300 bg-red-50 shadow-red-100" : "border-red-500/50 shadow-red-900/20 bg-red-950/20") : ""}`}
    >
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
        {isDone && (
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} style={{ boxShadow: statusMeta.shadow }} />
            <span className={`text-[10px] font-medium tracking-wide ${statusMeta.color}`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{statusMeta.label}</span>
          </div>
        )}
        <button
          {...(canEdit ? { ...attributes, ...listeners } : {})}
          className={`shrink-0 p-1 rounded transition-colors touch-none
            ${canEdit
              ? `${theme === "light" ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"} cursor-grab active:cursor-grabbing`
              : `${theme === "light" ? "text-gray-300" : "text-slate-700"} cursor-not-allowed`}`}
          disabled={!canEdit}
          aria-label="Drag task"
        ><DotsIcon /></button>
        {canEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-sm backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100
              ${theme === "light" ? "border-gray-200 bg-white/90 text-gray-500 hover:text-red-500 hover:bg-red-50" : "border-slate-700/60 bg-slate-900/85 text-slate-300 hover:text-red-300 hover:bg-red-500/15"}`}
            title="Delete task"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {isOverdue && isPro && (
        <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg border pr-14 ${theme === "light" ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20"}`}>
          <AlertTriangle size={9} className="text-red-500 shrink-0" />
          <span className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest">Overdue</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border ${theme === "light" ? p.pillLight : p.pill}`}>
            <span className={`w-[3px] h-3 rounded-sm ${p.bar}`} />
            {p.label}
          </span>
        </div>

        <div className="flex sm:hidden items-center gap-1.5 mt-2.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} style={{ boxShadow: statusMeta.shadow }} />
          <span className={`text-[10px] font-medium tracking-wide ${statusMeta.color}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{statusMeta.label}</span>
        </div>

        <p className={`mt-3 text-sm font-semibold leading-snug ${isDone ? "line-through text-slate-400" : T.cardText}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.005em" }}>{task.title}</p>

        {task.description ? (
          <p className={`text-xs mt-1.5 leading-relaxed whitespace-pre-wrap break-words ${isDone ? "line-through text-slate-400/80" : T.subText}`}>
            {task.description}
          </p>
        ) : (
          <p className={`text-xs mt-1.5 italic ${theme === "light" ? "text-gray-400" : "text-slate-600"}`}>
            No description
          </p>
        )}

        <div className={`flex items-center gap-1.5 mt-2.5 text-[11px] ${isDone ? "line-through text-slate-400" : isOverdue ? "text-red-500" : isDueToday ? "text-amber-500" : T.label}`}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <Clock size={11} className="opacity-70" />
          {task.dueDate
            ? <>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{isDueToday && !isDone && " · Today"}</>
            : "No due date"}
        </div>

        {task.image && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowImage(true); }}
            className={`mt-3 w-full rounded-xl overflow-hidden border cursor-zoom-in text-left block
              ${theme === "light" ? "border-gray-200 bg-gray-50" : "border-slate-700/50 bg-slate-900/40"}`}
          >
            <img src={task.image} alt="attachment" className="w-full max-h-52 object-cover" />
            <div className={`flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border-t ${theme === "light" ? "border-gray-200 text-gray-500" : "border-slate-700/50 text-slate-500"}`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <Paperclip size={11} className="opacity-70" />
              1 attachment
            </div>
          </button>
        )}

        <div className={`mt-3.5 pt-3.5 border-t ${theme === "light" ? "border-gray-200" : "border-slate-700/50"}`}>
          {isDone ? (
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border p-3 relative overflow-hidden ${theme === "light" ? "border-gray-200 bg-gray-50" : "border-slate-700/50 bg-slate-900/40"}`}>
                <p className={`text-[9px] uppercase tracking-widest mb-2.5 ${T.label}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Created</p>
                <div className={`flex items-center gap-2 mb-2 ${!isPro ? lockedMetaCls : ""}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-300"}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {isPro ? (creatorInitials || "?") : obfuscateText(0, "name").charAt(0)}
                  </span>
                  <span className={`text-[11px] font-medium leading-tight truncate ${theme === "light" ? "text-gray-800" : "text-slate-100"}`}>
                    {isPro ? (task.addedBy || "Unknown") : obfuscateText(0, "name")}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] ${T.label} ${!isPro ? lockedMetaCls : ""}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <Clock size={9} className="opacity-70 shrink-0" />
                  <span>{isPro ? (task.createdAt ? fmtCardTime(task.createdAt) : "—") : obfuscateText(1, "number")}</span>
                </div>
                {!isPro && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button type="button" onClick={() => onUpgrade?.()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-500 border border-amber-500/40 hover:bg-amber-500/25 transition cursor-pointer shadow-sm">
                      <Lock size={9} />Pro
                    </button>
                  </div>
                )}
              </div>
              <div className={`rounded-xl border p-3 relative overflow-hidden ${theme === "light" ? "border-gray-200 bg-gray-50" : "border-slate-700/50 bg-slate-900/40"}`}>
                <p className={`text-[9px] uppercase tracking-widest mb-2.5 ${T.label}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Completed</p>
                <div className={`flex items-center gap-2 mb-2 ${!isPro ? lockedMetaCls : ""}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${theme === "light" ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-300"}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {isPro ? (completedInitials || "?") : obfuscateText(2, "name").charAt(0)}
                  </span>
                  <span className={`text-[11px] font-medium leading-tight truncate ${theme === "light" ? "text-gray-800" : "text-slate-100"}`}>
                    {isPro ? (task.completedBy || "Unknown") : obfuscateText(2, "name")}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] ${T.label} ${!isPro ? lockedMetaCls : ""}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <Clock size={9} className="opacity-70 shrink-0" />
                  <span>{isPro ? (task.completedAt ? fmtCardTime(task.completedAt) : "—") : obfuscateText(3, "number")}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isPro && task.addedBy ? (
                  <>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-300"}`}
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {creatorInitials || "?"}
                    </span>
                    <span className={`text-[11px] font-medium truncate ${theme === "light" ? "text-gray-800" : "text-slate-100"}`}>{task.addedBy}</span>
                  </>
                ) : (
                  <div className="flex items-center gap-2 blur-[3px] opacity-40 select-none pointer-events-none">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-300"}`}>{obfuscateText(0, "name").charAt(0)}</span>
                    <span className={`text-[11px] font-medium ${theme === "light" ? "text-gray-800" : "text-slate-100"}`}>{obfuscateText(0, "name")}</span>
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {isPro && task.createdAt ? (
                  <div className={`flex items-center gap-1.5 text-[10px] ${T.label}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    <Clock size={10} className="opacity-70" />
                    <span>{fmtFull(task.createdAt)}</span>
                  </div>
                ) : !isPro ? (
                  <button type="button" onClick={() => onUpgrade?.()}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-500 border border-amber-500/40 hover:bg-amber-500/25 transition cursor-pointer">
                    <Lock size={10} />Pro
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImage && task.image && createPortal(
        <div className="fixed inset-0 z-99999 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-lg"
            onClick={() => setShowImage(false)}
          />
          <button
            onClick={() => setShowImage(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-xl cursor-pointer bg-black/70 text-white border border-white/20 backdrop-blur-md p-0.5"
            aria-label="Close image preview"
          >
            <X size={18} />
          </button>
          <img
            src={task.image}
            alt="full attachment"
            className="relative z-10 max-w-[94vw] max-h-[94vh] object-contain"
          />
        </div>,
        document.body
      )}
    </div>
  );


}

