import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { COLUMNS, COLUMNS_LIGHT, TD, TL } from "../../lib/constants";
import TaskCard from "./TaskCard";
import TaskCardSkeleton from "./TaskCardSkeleton";

export default function Column({ col, tasks, onDelete, role, isPro, theme, onUpgrade, isLoading }) {
  const T       = theme === "light" ? TL : TD;
  const COLS    = theme === "light" ? COLUMNS_LIGHT : COLUMNS;
  const thisCol = COLS.find(c => c.id === col.id) || col;
  const { setNodeRef, isOver } = useDroppable({ id: `column-${col.id}`, data: { columnId: col.id } });
  const hasActive = col.id === "in-progress" && tasks.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          {col.id === "in-progress" ? (
            <span className="relative flex h-2 w-2 shrink-0">
              {hasActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasActive ? "bg-amber-500" : theme === "light" ? "bg-amber-300" : "bg-amber-500/30"}`} />
            </span>
          ) : (
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: thisCol.color }} />
          )}
          <h3 className={`text-[12px] font-black uppercase tracking-[0.28em] ${theme === "light" ? "text-gray-700" : "text-slate-200"}`}>{col.label}</h3>
        </div>
        <span className={`text-[11px] font-black px-3 py-1 rounded-full border shadow-sm ${thisCol.badge}`}>{tasks.length}</span>
      </div>

      <div ref={setNodeRef}
        className={`rounded-2xl p-3 flex-1 min-h-[380px] sm:min-h-[500px] border-2 transition-all duration-200 backdrop-blur-none md:backdrop-blur-sm ${isOver ? `${thisCol.ring} shadow-lg` : T.colBg}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {isLoading ? (
            <>
              <TaskCardSkeleton theme={theme} />
              <TaskCardSkeleton theme={theme} />
              <TaskCardSkeleton theme={theme} />
            </>
          ) : (
            tasks.map(t => (
              <div key={t.id} className="mb-4 last:mb-0">
                <TaskCard task={t} onDelete={onDelete} role={role} isPro={isPro} theme={theme} onUpgrade={onUpgrade} />
              </div>
            ))
          )}
          {!isLoading && tasks.length === 0 && (
            <div className={`flex flex-col items-center justify-center h-32 transition-opacity ${isOver ? "opacity-60" : "opacity-25"}`}>
              <Plus size={18} style={{ color: thisCol.color }} className="mb-2" />
              <p className={`text-[9px] uppercase tracking-widest font-black ${theme === "light" ? "text-gray-400" : "text-slate-500"}`}>Drop here</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
