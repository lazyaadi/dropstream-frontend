import React from "react";

export default function TaskCardSkeleton({ theme }) {
  const sk = theme === "light" ? "skeleton-shimmer-light" : "skeleton-shimmer-dark";
  return (
    <div className={`p-3 rounded-xl border mb-4 overflow-hidden ${theme === "light" ? "border-gray-200 bg-white/80" : "border-slate-700/50 bg-slate-800/40"}`}>
      <div className={`h-4 w-14 rounded-md mb-3 ${sk}`} />
      <div className={`h-3.5 w-[85%] rounded-md mb-2 ${sk}`} />
      <div className={`h-3 w-[60%] rounded-md ${sk}`} />
    </div>
  );
}
