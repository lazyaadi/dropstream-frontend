import React from "react";
import { Search, X } from "lucide-react";
import { TD, TL } from "../../lib/constants";

export default function SearchBar({ value, onChange, theme }) {
  const T = theme === "light" ? TL : TD;
  return (
    <div className="relative">
      <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${T.label}`} />
      <input type="text" placeholder="Search tasks or creator…"
        className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all shadow-sm ${T.input}`}
        value={value} onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange("")} className={`absolute right-3 top-1/2 -translate-y-1/2 ${T.label} hover:text-blue-500 transition cursor-pointer`}>
          <X size={13}/>
        </button>
      )}
    </div>
  );
}
