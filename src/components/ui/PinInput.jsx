import React, { useRef } from "react";
import { TD, TL } from "../../lib/constants";

export default function PinInput({ value, onChange, onEnter, label, hint, theme }) {
  const T = theme === "light" ? TL : TD;
  const digits = (value || "").split("").concat(Array(6).fill("")).slice(0, 6);
  const refs = useRef([]);

  const focusDigit = (index) => {
    refs.current[Math.max(0, Math.min(index, 5))]?.focus();
  };

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

  const handleChange = (i, e) => {
    const digit = (e.target.value || "").replace(/\D/g, "").slice(-1);
    if (!digit) {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next.slice(0, 6));
      return;
    }

    const next = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, 6);
    onChange(next);
    if (i < 5) focusDigit(i + 1);
  };

  const handlePaste = (i, e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = (value.slice(0, i) + pasted + value.slice(i + pasted.length)).slice(0, 6);
    onChange(next);
    focusDigit(Math.min(i + pasted.length, 5));
  };

  return (
    <div>
      {label && <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1.5 block`}>{label}</label>}
      {hint  && <p className={`text-[9px] ${T.label} mb-2`}>{hint}</p>}
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <div key={i} onClick={() => focusDigit(i)}
            className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black cursor-text transition-all
              ${value.length === i ? "border-blue-500 shadow-lg shadow-blue-500/20" :
                d ? (theme === "light" ? "border-gray-400 bg-gray-100" : "border-slate-600 bg-slate-700") :
                    (theme === "light" ? "border-gray-300 bg-white" : "border-slate-700 bg-slate-800/80")}
              ${theme === "light" ? "text-gray-800" : "text-slate-200"}`}
          >
            <input
              ref={el => refs.current[i] = el}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              className="w-full h-full bg-transparent outline-none text-center text-lg font-black caret-transparent"
              value={d}
              onChange={e => handleChange(i, e)}
              onKeyDown={e => handleKey(i, e)}
              onPaste={e => handlePaste(i, e)}
              onFocus={() => focusDigit(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
