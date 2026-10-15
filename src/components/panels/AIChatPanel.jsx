import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Send, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { sbVars } from "../../lib/sbTheme";

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

const mono = { fontFamily: "var(--sb-mono)" };
const display = { fontFamily: "var(--sb-display)" };

const ICON_BTN =
  "w-[30px] h-[30px] rounded-lg flex items-center justify-center transition cursor-pointer text-[color:var(--sb-text-3)] hover:bg-[color:var(--sb-surface-2)] hover:text-[color:var(--sb-text-2)] disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent";

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

// Safe renderer: only React text nodes, **bold**, bullets and date/time chips. Never uses innerHTML.
const TOKEN_SPLIT = /(\*\*[^*]+\*\*|\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?)/g;
const BOLD_TEST = /^\*\*[^*]+\*\*$/;
const DATE_TEST = /^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?$/;

function renderText(text) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    const bullet = /^\s*[*-]\s+/.test(line);
    const body = bullet ? line.replace(/^\s*[*-]\s+/, "") : line;
    const parts = body.split(TOKEN_SPLIT).map((p, j) => {
      if (BOLD_TEST.test(p)) return <strong key={j}>{p.slice(2, -2)}</strong>;
      if (DATE_TEST.test(p)) {
        return (
          <span
            key={j}
            className="text-[11.5px] px-1.5 py-px rounded-[5px] bg-[color:var(--sb-blue-soft)] text-[color:var(--sb-blue)]"
            style={mono}
          >
            {p}
          </span>
        );
      }
      return <React.Fragment key={j}>{p}</React.Fragment>;
    });
    return bullet
      ? <div key={i} className="flex gap-1.5"><span>•</span><span className="min-w-0">{parts}</span></div>
      : <div key={i}>{parts}</div>;
  });
}

export default function AIChatPanel({ onClose, theme, serverUrl, workspaceName, userEmail }) {
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
        body: JSON.stringify({
          workspaceName,
          message: text,
          history,
          today: localDateISO(),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
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
      style={{ ...sbVars(theme), ...heightStyle, fontFamily: "var(--sb-body)", boxShadow: "var(--sb-shadow)" }}
      className="fixed right-2 top-2 sm:right-4 sm:top-16 z-[120] flex flex-col w-[min(25rem,calc(100vw-1rem))] h-[calc(100dvh-1rem)] sm:h-[min(40rem,calc(100dvh-5rem))] rounded-[20px] border overflow-hidden bg-[color:var(--sb-surface)] border-[color:var(--sb-border)] text-[color:var(--sb-text)]"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 py-3.5 shrink-0 border-b border-[color:var(--sb-border-soft)]">
        <div className="flex items-center gap-[11px] min-w-0">
          <div
            className="relative w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 border border-[color:var(--sb-blue-line)]"
            style={{ background: "#14171F" }}
          >
            <img
              src="/ghostfreak.png"
              alt=""
              width={26}
              height={26}
              draggable={false}
              style={{ imageRendering: "pixelated" }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-2 border-[color:var(--sb-surface)] bg-[color:var(--sb-green)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[14.5px] font-semibold tracking-[-0.005em] leading-tight truncate" style={display}>
              Ghostfreak AI
            </p>
            <p className="text-[10px] tracking-[0.04em] mt-0.5 leading-none text-[color:var(--sb-text-3)]" style={mono}>
              BOARD ASSISTANT
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMessages([]); setErrorMsg(""); }}
            disabled={loading || messages.length === 0}
            className={ICON_BTN}
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={15} />
          </button>
          <button onClick={onClose} className={ICON_BTN} title="Close" aria-label="Close">
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-[18px] flex flex-col gap-3 [scrollbar-width:thin] [scrollbar-color:var(--sb-border)_transparent]"
      >
        {messages.length === 0 && (
          <div className="pt-1">
            <p className="text-[13px] font-medium mb-1" style={display}>Ask about your board</p>
            <p className="text-[11.5px] leading-relaxed mb-3.5 text-[color:var(--sb-text-2)]">
              I can summarize, count tasks, spot overdue work and suggest what to do next. I can't change tasks.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="text-left text-[12px] px-3.5 py-2.5 rounded-xl border transition cursor-pointer disabled:opacity-50 bg-[color:var(--sb-surface-2)] border-[color:var(--sb-border-soft)] text-[color:var(--sb-text)] hover:border-[color:var(--sb-blue)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="self-end max-w-[82%] px-3.5 py-2.5 text-[13px] leading-[1.5] font-medium whitespace-pre-wrap break-words rounded-[16px_16px_4px_16px] bg-[color:var(--sb-blue)] text-[color:var(--sb-on-blue)]"
            >
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="self-start max-w-[88%] px-3.5 py-2.5 text-[13px] leading-[1.5] break-words rounded-[16px_16px_16px_4px] border bg-[color:var(--sb-surface-2)] border-[color:var(--sb-border-soft)] text-[color:var(--sb-text)]"
            >
              {renderText(m.text)}
            </div>
          )
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[11.5px] text-[color:var(--sb-text-2)]">
            <Loader2 size={13} className="animate-spin" />
            <span>{slow ? "Still working… the server may be slow right now" : "Thinking…"}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex gap-2 items-start rounded-xl border px-3 py-2 text-[11.5px] bg-[color:var(--sb-red-soft)] border-[color:var(--sb-red-line)] text-[color:var(--sb-red)]"
          >
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        className="shrink-0 px-3.5 pt-3 border-t border-[color:var(--sb-border-soft)]"
        style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-end gap-[9px]">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => { setInput(e.target.value); if (errorMsg) setErrorMsg(""); }}
            onKeyDown={onKeyDown}
            placeholder="Ask about your board…"
            aria-label="Message"
            className="flex-1 resize-none rounded-xl border px-3.5 py-[11px] text-base sm:text-[13px] outline-none transition bg-[color:var(--sb-surface-2)] border-[color:var(--sb-border)] text-[color:var(--sb-text)] placeholder:text-[color:var(--sb-text-3)] focus:border-[color:var(--sb-blue)] focus:shadow-[0_0_0_3px_var(--sb-blue-soft)]"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-default bg-[color:var(--sb-blue)] text-[color:var(--sb-on-blue)]"
          >
            <Send size={16} />
          </button>
        </div>
        {input.length >= 800 && (
          <p
            className={`text-[9px] mt-1 text-right ${input.length >= MAX_CHARS ? "text-[color:var(--sb-red)]" : "text-[color:var(--sb-text-3)]"}`}
            style={mono}
          >
            {input.length}/{MAX_CHARS}
          </p>
        )}
      </div>
    </motion.div>
  );
}