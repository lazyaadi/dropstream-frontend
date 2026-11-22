import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, Upload, X } from "lucide-react";
import { PRIORITY, TD, TL } from "../../lib/constants";
import { getMentionQuery, getMentionSuggestions, applyMentionPick } from "../../lib/mentions";

export default function AddTaskModal({ onAdd, onClose, theme, isPro, onUpgrade, members, userEmail, userName }) {
  const T = theme === "light" ? TL : TD;
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate]   = useState("");
  const [image, setImage]       = useState(null);
  const [imgError, setImgError] = useState("");
  const fileRef = useRef(null);
  const titleRef = useRef(null);
  const descRef  = useRef(null);
  const [picker, setPicker]   = useState(null);
  const [pickIdx, setPickIdx] = useState(0);

  // @mention picker (Pro only). Shows after "@" + 2 letters; the server does the real matching.
  const refreshPicker = (field, value, caret) => {
    if (!isPro) { setPicker(null); return; }
    const range = getMentionQuery(value, caret);
    const items = range ? getMentionSuggestions(members, range.query, userEmail, userName) : [];
    if (items.length === 0) { setPicker(null); return; }
    setPicker({ field, range, items });
    setPickIdx(0);
  };

  const pickMention = (name) => {
    if (!picker) return;
    const isTitle = picker.field === "title";
    const { value: next, caret } = applyMentionPick(isTitle ? title : desc, picker.range, name);
    if (isTitle) setTitle(next); else setDesc(next);
    setPicker(null);
    const el = (isTitle ? titleRef : descRef).current;
    requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(caret, caret); } });
  };

  // Returns true when the key was used by the picker.
  const handlePickerKey = (e, field) => {
    if (e.nativeEvent?.isComposing || !picker || picker.field !== field) return false;
    const n = picker.items.length;
    if (e.key === "ArrowDown") { e.preventDefault(); setPickIdx(i => (i + 1) % n); return true; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setPickIdx(i => (i - 1 + n) % n); return true; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(picker.items[pickIdx] || picker.items[0]); return true; }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setPicker(null); return true; }
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) setPicker(null);
    return false;
  };

  const renderPicker = (field) => {
    if (!picker || picker.field !== field) return null;
    return (
      <ul role="listbox" className={`mt-1.5 rounded-xl border overflow-hidden ${theme === "light" ? "bg-white border-gray-200" : "bg-slate-800 border-slate-700"}`}>
        {picker.items.map((name, i) => (
          <li key={name} role="option" aria-selected={i === pickIdx}
            onMouseDown={e => { e.preventDefault(); pickMention(name); }}
            onMouseEnter={() => setPickIdx(i)}
            className={`px-3 py-2.5 text-sm cursor-pointer ${i === pickIdx
              ? (theme === "light" ? "bg-blue-50 text-blue-700" : "bg-blue-500/20 text-blue-300")
              : (theme === "light" ? "text-gray-700" : "text-slate-200")}`}
          >{"@" + name}</li>
        ))}
      </ul>
    );
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setImgError("Max 5MB allowed."); return; }
    setImgError("");
    const img = new Image();
    const reader = new FileReader();
    reader.onload = ev => {
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        setImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: desc.trim(), priority, dueDate: dueDate || null, image: isPro ? image : null });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${T.modal} border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <h2 className={`text-xl font-black mb-5 ${T.text}`}>Add New Task</h2>
        <div className="space-y-4">
          <div>
            <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Task Title *</label>
            <input type="text" placeholder="e.g. Fix login bug" autoFocus
              className={`w-full p-3 rounded-xl border outline-none transition-all text-sm ${T.input}`}
              ref={titleRef}
              value={title}
              onChange={e => { setTitle(e.target.value); refreshPicker("title", e.target.value, e.target.selectionStart); }}
              onClick={e => refreshPicker("title", e.target.value, e.target.selectionStart)}
              onKeyDown={e => { if (handlePickerKey(e, "title")) return; if (e.key === "Enter" && title.trim()) handleAdd(); }}
              onBlur={() => setPicker(null)}
            />
            {renderPicker("title")}
          </div>

          <div>
            <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Description</label>
            <textarea placeholder="Add details…"
              className={`w-full p-3 rounded-xl border outline-none transition-all h-20 resize-none text-sm ${T.input}`}
              ref={descRef}
              value={desc}
              onChange={e => { setDesc(e.target.value); refreshPicker("desc", e.target.value, e.target.selectionStart); }}
              onClick={e => refreshPicker("desc", e.target.value, e.target.selectionStart)}
              onKeyDown={e => { handlePickerKey(e, "desc"); }}
              onBlur={() => setPicker(null)} />
            {renderPicker("desc")}
          </div>

          <div>
            <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Priority</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY).map(([key, val]) => (
                <button key={key} onClick={() => setPriority(key)}
                  className={`flex-1 py-2 rounded-xl font-black text-xs uppercase transition-all cursor-pointer
                    ${priority === key
                      ? theme === "light" ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                      : theme === "light" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                >{val.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Due Date (Optional)</label>
            <input type="date"
              className={`w-full p-3 rounded-xl border outline-none transition-all text-sm ${T.input}`}
              value={dueDate} onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
              Image Attachment
              {!isPro && <Lock size={10} className={T.label} />}
            </label>
            {isPro ? (
              <div>
                <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()}
                  className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all
                    ${theme === "light" ? "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600" : "border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-400"}`}>
                  <Upload size={14} />{image ? "Change Image" : "Upload Image (max 5MB)"}
                </button>
                {imgError && <p className="text-red-500 text-xs mt-1">{imgError}</p>}
                {image && (
                  <div className="mt-2 relative rounded-xl overflow-hidden">
                    <img src={image} alt="preview" className="w-full max-h-40 object-contain rounded-xl" />
                    <button onClick={() => setImage(null)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer hover:bg-red-600 transition">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onUpgrade}
                className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs cursor-pointer transition hover:border-amber-400 hover:text-amber-500
                  ${theme === "light" ? "border-gray-200 text-gray-400 bg-gray-50" : "border-slate-700 text-slate-600 bg-slate-800/40"}`}>
                <Lock size={12} /><span>Pro feature — upgrade to attach images</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer
              ${theme === "light" ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>Cancel</button>
          <button onClick={handleAdd} disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer">Add Task</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
