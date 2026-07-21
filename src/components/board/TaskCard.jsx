import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lock, Clock, AlertTriangle, X } from "lucide-react";
import { PRIORITY, TD, TL } from "../../lib/constants";
import { fmtFull, obfuscateText } from "../../lib/utils";
import DotsIcon from "../ui/DotsIcon";

export default function TaskCard({ task, onDelete, role, isPro, isOverlay = false, theme, onUpgrade }) {
  const T   = theme === "light" ? TL : TD;
  const p   = PRIORITY[task.priority] || PRIORITY.medium;
  const pCls = theme === "light" ? p.clsLight : p.cls;
  const canEdit = role === "member" || role === "admin";
  const isDone = task.status === "done";
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
      {canEdit && (
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer
              ${theme === "light" ? "border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50" : "border-slate-700/60 text-slate-400 hover:text-red-400 hover:bg-red-500/10"}`}
            title="Delete task"
          >
            <X size={10} />
          </button>
        </div>
      )}
      {isOverdue && isPro && (
        <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg border ${theme === "light" ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20"}`}>
          <AlertTriangle size={9} className="text-red-500 shrink-0" />
          <span className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest">Overdue</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 pr-7">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center text-[7px] sm:text-[8px] font-black px-2 py-0.5 rounded-md border ${pCls} ${isDone ? "line-through text-slate-400 opacity-75" : ""}`}>{p.label}</span>
          </div>
          <button
            {...(canEdit ? { ...attributes, ...listeners } : {})}
            className={`shrink-0 p-1 rounded transition-colors touch-none
              ${canEdit
                ? `${theme === "light" ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"} cursor-grab active:cursor-grabbing`
                : `${theme === "light" ? "text-gray-300" : "text-slate-700"} cursor-not-allowed`}`}
            disabled={!canEdit}
            aria-label="Drag task"
          ><DotsIcon /></button>
        </div>

        <div className={`mt-2 border-b ${theme === "light" ? "border-gray-200" : "border-slate-700/50"}`} />

        <p className={`mt-2 text-[11px] sm:text-sm font-semibold leading-snug ${isDone ? "line-through text-slate-400" : T.cardText}`}>{task.title}</p>
        {task.description ? (
          <p className={`text-[10px] sm:text-xs mt-1.5 leading-relaxed line-clamp-3 ${isDone ? "line-through text-slate-400/80" : T.subText}`}>
            {task.description}
          </p>
        ) : (
          <p className={`text-[10px] sm:text-xs mt-1.5 leading-relaxed ${isDone ? "line-through text-slate-400/80" : T.subText}`}>
            No description
          </p>
        )}

        {task.dueDate ? (
          <div className={`flex items-center gap-1 mt-1.5 text-[8px] sm:text-[9px] font-bold
            ${isDone ? "line-through text-slate-400" : isOverdue ? "text-red-500" : isDueToday ? "text-amber-500" : T.label}`}>
            <Clock size={8} />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {isDueToday && !isDone && " · Today"}
          </div>
        ) : (
          <div className={`flex items-center gap-1 mt-1.5 text-[8px] sm:text-[9px] font-bold ${isDone ? "line-through text-slate-400" : T.label}`}>
            <Clock size={8} />
            No due date
          </div>
        )}

        {task.image && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowImage(true); }}
            className={`mt-2 mb-1 w-full rounded-lg overflow-hidden border transition cursor-zoom-in p-1
              ${theme === "light" ? "border-gray-200 bg-white" : "border-slate-700/50 bg-slate-900/40"}`}
          >
            <img src={task.image} alt="attachment" className="w-full max-h-40 object-contain" />
          </button>
        )}

        <div className={`mt-3 pt-3 pb-2 border-t border-b ${theme === "light" ? "border-gray-200" : "border-slate-700/50"}`}>
          {isDone ? (
            <div className={`relative w-full rounded-lg border overflow-hidden
              ${theme === "light" ? "border-gray-200 bg-white" : "border-slate-700/60 bg-slate-900/40"}`}
            >
              <div className={`relative flex items-stretch gap-0 px-4 py-3 min-h-[92px]
                ${theme === "light" ? "border-gray-200" : "border-slate-700/60"}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                    ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                  >{isPro ? (creatorInitials || "?") : obfuscateText(0, "name").charAt(0)}</span>
                  <div className={`flex flex-col gap-1 min-w-0 flex-1 ${!isPro ? lockedMetaCls : ""}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${T.label}`}>Created</span>
                    <span className={`text-[10px] font-semibold truncate ${theme === "light" ? "text-gray-700" : "text-slate-200"}`}>
                      {isPro ? (task.addedBy || "Unknown") : obfuscateText(0, "name")}
                    </span>
                    <div className={`flex items-center gap-1 text-[9px] ${theme === "light" ? "text-gray-700" : "text-slate-200"}`}>
                      <Clock size={9} className="shrink-0" />
                      <span>{isPro ? (task.createdAt ? fmtFull(task.createdAt) : "—") : obfuscateText(1, "number")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`ml-12 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                    ${theme === "light" ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-200"}`}
                  >{isPro ? (completedInitials || "?") : obfuscateText(2, "name").charAt(0)}</span>
                  <div className={`flex flex-col gap-1 min-w-0 flex-1 items-start  ${!isPro ? lockedMetaCls : ""}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${T.label}`}>Completed</span>
                    <span className={`text-[10px] font-semibold truncate ${theme === "light" ? "text-gray-700" : "text-slate-200"}`}>
                      {isPro ? (task.completedBy || "Unknown") : obfuscateText(2, "name")}
                    </span>
                    <div className={`flex items-center gap-1 text-[9px] ${theme === "light" ? "text-gray-700" : "text-slate-200"}`}>
                      <Clock size={9} className="shrink-0" />
                      <span>{isPro ? (task.completedAt ? fmtFull(task.completedAt) : "—") : obfuscateText(3, "number")}</span>
                    </div>
                  </div>
                </div>

                {!isPro && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onUpgrade?.()}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-500 border border-amber-500/40 hover:bg-amber-500/25 transition cursor-pointer shadow-sm"
                    >
                      <Lock size={10} />Pro
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {isPro && task.addedBy && (
                  <span className={`inline-flex items-center gap-2 text-[9px] font-black px-2.5 py-1 rounded-lg border w-fit whitespace-nowrap
                    ${theme === "light" ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-slate-800/70 border-slate-700/60 text-slate-200"}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black
                      ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                    >{creatorInitials || "?"}</span>
                    <span>{task.addedBy}</span>
                  </span>
                )}
                {!isPro && (
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black blur-[3px] opacity-40
                      ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-200"}`}
                    >{obfuscateText(0, "name").charAt(0)}</span>
                    <span className={`text-[9px] font-black blur-[3px] opacity-40 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}>
                      {obfuscateText(0, "name")}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {isPro && task.createdAt && (
                  <div className={`flex items-center gap-1 text-[9px] ${T.label} leading-none self-center`}>
                    <Clock size={9} />
                    <span>{fmtFull(task.createdAt)}</span>
                  </div>
                )}
                {!isPro && (
                  <button
                    type="button"
                    onClick={() => onUpgrade?.()}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-500 border border-amber-500/40 hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Lock size={10} />Pro
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImage && task.image && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-lg"
            onClick={() => setShowImage(false)}
          />
          <button
            onClick={() => setShowImage(false)}
            className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md cursor-pointer
              ${theme === "light" ? "bg-white text-gray-700 border border-gray-200" : "bg-slate-800 text-slate-200 border border-slate-700"}`}
            aria-label="Close image preview"
          >
            <X size={16} />
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

