import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Send, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { TD, TL } from "../../lib/constants";

const MAX_CHARS = 1000;          // must match the server cap
const MAX_HISTORY_SENT = 10;     // must match the server cap
const MAX_STORED = 20;
const REQUEST_TIMEOUT_MS = 45000;
const SUGGESTIONS = [
  "Summarize the board",
  "What's overdue?",
  "What should I work on next?",
  "How many tasks are in each column?",
];

const localDateISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const storageKey = (email, ws) => `sb_ai_chat:${String(email || "").toLowerCase()}|${ws}`;

function loadStored(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

function saveStored(key, msgs) {
  try {
    sessionStorage.setItem(key, JSON.stringify(msgs.slice(-MAX_STORED)));
  } catch {
    /* storage unavailable (e.g. private mode): chat just won't persist */
  }
}

// Safe renderer: only React text nodes, **bold** and bullets. Never uses innerHTML.
function renderText(text) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    const bullet = /^\s*[*-]\s+/.test(line);
    const body = bullet ? line.replace(/^\s*[*-]\s+/, "") : line;
    const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      /^\*\*[^*]+\*\*$/.test(p)
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : <React.Fragment key={j}>{p}</React.Fragment>
    );
    return bullet
      ? <div key={i} className="flex gap-1.5"><span>•</span><span className="min-w-0">{parts}</span></div>
      : <div key={i}>{parts}</div>;
  });
}

export default function AIChatPanel({ onClose, theme, serverUrl, workspaceName, userEmail }) {
  const T = theme === "light" ? TL : TD;
  const light = theme === "light";
  const key = storageKey(userEmail, workspaceName);

  const [messages, setMessages] = useState(() => loadStored(key));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [vvh, setVvh] = useState(null);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => { saveStored(key, messages); }, [key, messages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, errorMsg]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => setVvh(vv.height);
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    el.style.overflowY = el.scrollHeight > 96 ? "auto" : "hidden";
  }, [input]);

  const send = useCallback(async (raw) => {
    const text = String(raw ?? "").trim();
    if (!text || text.length > MAX_CHARS || sendingRef.current) return;
    sendingRef.current = true;
    setErrorMsg("");
    setSlow(false);
    setLoading(true);

    const history = messages.slice(-MAX_HISTORY_SENT).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const slowTimer = setTimeout(() => { if (mountedRef.current) setSlow(true); }, 8000);

    // On failure: undo the optimistic message and give the text back so nothing is lost.
    const fail = (msg) => {
      setMessages((prev) => prev.slice(0, -1));
      setInput((prev) => prev || text);
      setErrorMsg(msg);
    };

    try {
      const res = await fetch(`${serverUrl}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName, message: text, history, today: localDateISO() }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!mountedRef.current) return;

      if (res.ok && typeof data?.reply === "string") {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      } else if (res.status === 401) {
        fail("Your session expired. Please log in again.");
      } else if (res.status === 403) {
        fail("You're not a member of this workspace.");
      } else {
        fail(typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.name === "AbortError") fail("The AI took too long to answer. Please try again.");
      else fail("Can't reach the server. Check your connection and try again.");
    } finally {
      clearTimeout(timeoutTimer);
      clearTimeout(slowTimer);
      sendingRef.current = false;
      if (mountedRef.current) { setLoading(false); setSlow(false); }
    }
  }, [messages, serverUrl, workspaceName]);

  const onKeyDown = (e) => {
    // Enter sends on desktop; on phones Enter is a newline and the button sends.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.innerWidth >= 768) {
      e.preventDefault();
      send(input);
    }
  };

  const heightStyle =
    typeof window !== "undefined" && window.innerWidth < 640 && vvh
      ? { height: Math.max(320, vvh - 16) }
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      role="dialog"
      aria-label="Ghostfreak AI"
      style={heightStyle}
      className={`fixed right-2 top-2 sm:right-4 sm:top-16 z-[120] flex flex-col w-[min(24rem,calc(100vw-1rem))] h-[calc(100dvh-1rem)] sm:h-[min(36rem,calc(100dvh-5rem))] ${T.panelBg} rounded-2xl border shadow-2xl overflow-hidden`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between gap-2 px-3.5 py-3 border-b ${T.divider}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#14171F" }}
          >
            <img
              src="/ghostfreak.png"
              alt=""
              width={24}
              height={24}
              draggable={false}
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <p className={`text-[13px] font-semibold ${T.text} leading-none truncate`}>Ghostfreak AI</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMessages([]); setErrorMsg(""); }}
            disabled={loading || messages.length === 0}
            className={`p-1.5 rounded-lg ${T.label} hover:text-red-500 disabled:opacity-30 disabled:hover:text-inherit transition cursor-pointer`}
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${T.label} hover:text-blue-500 transition cursor-pointer`}
            title="Close"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>



      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="pt-1">
            <p className={`text-[12px] font-medium ${T.text} mb-1`}>Ask about your board</p>
            <p className={`text-[10.5px] ${T.label} mb-3`}>
              I can summarize, count tasks, spot overdue work and suggest what to do next. I can't change tasks.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className={`text-left text-[11px] px-3 py-2 rounded-xl border ${T.historyBg} ${T.text} hover:border-blue-500/50 transition cursor-pointer disabled:opacity-50`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-md text-[12px] leading-relaxed text-white whitespace-pre-wrap break-words"
                style={{ background: "linear-gradient(135deg,#6E9BF4,#4F7BE0)" }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className={`max-w-[92%] px-3 py-2 rounded-2xl rounded-bl-md border text-[12px] leading-relaxed break-words ${T.historyBg} ${T.text}`}>
                {renderText(m.text)}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className={`flex items-center gap-2 text-[11px] ${T.label}`}>
            <Loader2 size={13} className="animate-spin" />
            <span>{slow ? "Still working… the server may be slow right now" : "Thinking…"}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex gap-2 items-start rounded-xl border px-3 py-2 text-[11px]"
            style={{
              background: "rgba(240,87,107,0.10)",
              borderColor: "rgba(240,87,107,0.35)",
              color: light ? "#B91C1C" : "#F0576B",
            }}
          >
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`border-t ${T.divider} p-2.5`} style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => { setInput(e.target.value); if (errorMsg) setErrorMsg(""); }}
            onKeyDown={onKeyDown}
            placeholder="Ask about your board…"
            aria-label="Message"
            className={`flex-1 resize-none rounded-xl border px-3 py-2 text-base sm:text-[12.5px] outline-none ${T.input}`}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition cursor-pointer"
            style={{ background: "linear-gradient(135deg,#6E9BF4,#4F7BE0)" }}
          >
            <Send size={15} />
          </button>
        </div>
        {input.length >= 800 && (
          <p className={`text-[9px] mt-1 text-right ${input.length >= MAX_CHARS ? "text-red-500" : T.label}`}>
            {input.length}/{MAX_CHARS}
          </p>
        )}
      </div>
    </motion.div>
  );
}