import React, { useRef } from "react";
import { TD, TL } from "../../lib/constants";

export default function PinInput({ value, onChange, onEnter, label, hint, theme }) {
  const T = theme === "light" ? TL : TD;
  const digits = (value || "").split("").concat(Array(6).fill("")).slice(0, 6);
  const refs = useRef([]);
  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      onChange(value.slice(0, -1));
      if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === "Enter") {
      onEnter?.();
    } else if (/^[0-9]$/.test(e.key)) {
      const next = (value + e.key).slice(0, 6);
      onChange(next);
      if (i < 5) refs.current[i + 1]?.focus();
    }
    e.preventDefault();
  };
  return (
    <div>
      {label && <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1.5 block`}>{label}</label>}
      {hint  && <p className={`text-[9px] ${T.label} mb-2`}>{hint}</p>}
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <div key={i} onClick={() => refs.current[Math.min(i, value.length)]?.focus()}
            className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black cursor-text transition-all
              ${value.length === i ? "border-blue-500 shadow-lg shadow-blue-500/20" :
                d ? (theme === "light" ? "border-gray-400 bg-gray-100" : "border-slate-600 bg-slate-700") :
                    (theme === "light" ? "border-gray-300 bg-white" : "border-slate-700 bg-slate-800/80")}
              ${theme === "light" ? "text-gray-800" : "text-slate-200"}`}
          >
            <input ref={el => refs.current[i] = el} type="text" inputMode="numeric"
              className="w-full h-full bg-transparent outline-none text-center text-lg font-black caret-transparent"
              value={d} readOnly onKeyDown={e => handleKey(i, e)}
              onFocus={() => refs.current[Math.min(i, value.length)]?.focus()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
