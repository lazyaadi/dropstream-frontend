import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Send, Trash2, Loader2, AlertTriangle, Check } from "lucide-react";
import { sbVars } from "../../lib/sbTheme";

const MAX_CHARS = 1000;          // must match the server cap
const MAX_HISTORY_SENT = 10;     // must match the server cap
const MAX_STORED = 20;
const REQUEST_TIMEOUT_MS = 45000;

const ACTION_TIMEOUT_MS = 30000;
const ACTION_GAP_MS = 400;       // pause between moves so Log + banner show them one by one
const MAX_MOVES = 5;             // must match the server cap
const LABELS = { todo: "To Do", "in-progress": "In Progress", done: "Done" };

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const makeCid = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const ROW_STATES = ["wait", "moving", "moved", "failed", "skipped", "already"];

// Only accepts the exact shape the server sends. Anything else is dropped.
function sanitizeProposals(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const p of raw) {
    if (out.length >= MAX_MOVES) break;
    if (!p || typeof p !== "object") continue;
    if (typeof p.taskId !== "string" || !p.taskId || p.taskId.length > 100) continue;
    if (typeof p.title !== "string") continue;
    if (!LABELS[p.from] || !LABELS[p.to] || p.from === p.to) continue;
    if (seen.has(p.taskId)) continue;
    seen.add(p.taskId);
    out.push({ taskId: p.taskId, title: p.title.slice(0, 200), from: p.from, to: p.to });
  }
  return out;
}

// Cards that were pending or running when stored come back as expired.
function restoreMsg(m) {
  if (m.role !== "assistant" || !Array.isArray(m.proposals)) return { role: m.role, text: m.text };
  const proposals = sanitizeProposals(m.proposals);
  if (proposals.length === 0) return { role: m.role, text: m.text };
  const cardStatus = m.cardStatus === "done" || m.cardStatus === "cancelled" ? m.cardStatus : "expired";
  const results =
    Array.isArray(m.results) && m.results.length === proposals.length
      ? m.results.map((r) => ({
          state: ROW_STATES.includes(r?.state) ? r.state : "wait",
          ...(typeof r?.msg === "string" ? { msg: r.msg.slice(0, 120) } : {}),
        }))
      : undefined;
  return {
    role: "assistant",
    text: m.text,
    proposals,
    cardStatus,
    cid: typeof m.cid === "string" ? m.cid : makeCid(),
    ...(results ? { results } : {}),
  };
}

const expirePending = (m) => (m.cardStatus === "pending" ? { ...m, cardStatus: "expired" } : m);

function describeActionError(res, data, p) {
  const serverMsg = typeof data?.error === "string" ? data.error.slice(0, 120) : "";
  switch (res.status) {
    case 401: return { stop: true, msg: "Your session expired. Please log in again." };
    case 403: return { stop: true, msg: serverMsg || "You can't do this action." };
    case 409:
      if (data?.code === "already") return { stop: false, already: true, msg: `Already in ${LABELS[p.to]}.` };
      return { stop: false, msg: "This task changed since I proposed it. Ask again." };
    case 404: return { stop: false, msg: "This task no longer exists." };
    case 400: return { stop: false, msg: "The request was rejected." };
    case 429: {
      const s = parseInt(res.headers.get("Retry-After"), 10);
      return { stop: true, msg: Number.isFinite(s) && s > 0 ? `Too many actions. Try again in ${s}s.` : "Too many actions. Try again in a moment." };
    }
    case 503: return { stop: true, msg: "Can't verify your plan right now. Try again later." };
    default: return { stop: true, msg: serverMsg || "Something went wrong." };
  }
}

function loadStored(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .map(restoreMsg)
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

function MoveCard({ m, busy, onConfirm, onCancel }) {
  const list = m.proposals;
  const results = m.results || [];
  const status = m.cardStatus;
  const many = list.length > 1;
  const movedCount = results.filter((r) => r?.state === "moved").length;
  return (
    <div
      className="self-start w-[88%] rounded-[14px] border p-3 flex flex-col gap-2.5 bg-[color:var(--sb-surface)] border-[color:var(--sb-border)]"
      style={{ opacity: status === "expired" || status === "cancelled" ? 0.6 : 1 }}
    >
      <p className="text-[10px] tracking-[0.04em] text-[color:var(--sb-text-3)]" style={mono}>
        {many ? `MOVE ${list.length} TASKS` : "MOVE TASK"}
      </p>
      <ul className="flex flex-col gap-2 m-0 p-0 list-none">
        {list.map((p, k) => {
          const r = results[k];
          const st = r?.state;
          return (
            <li key={p.taskId} className="flex items-start gap-2 min-w-0">
              {many && (
                <span className="text-[10.5px] mt-[3px] w-3 shrink-0 text-[color:var(--sb-text-3)]" style={mono}>
                  {k + 1}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium leading-snug break-words">{p.title}</p>
                <p className="text-[10.5px] mt-0.5 text-[color:var(--sb-text-2)]" style={mono}>
                  {LABELS[p.from]} → {LABELS[p.to]}
                </p>
                {st === "failed" && r.msg && (
                  <p className="text-[11px] mt-0.5 text-[color:var(--sb-red)]">{r.msg}</p>
                )}
                {st === "skipped" && (
                  <p className="text-[11px] mt-0.5 text-[color:var(--sb-text-3)]">Not moved</p>
                )}
                {st === "already" && (
                  <p className="text-[11px] mt-0.5 text-[color:var(--sb-text-3)]">{r.msg || "Already there"}</p>
                )}
              </div>
              <span className="shrink-0 mt-0.5 w-4 flex justify-center">
                {st === "moving" && status === "running" && (
                  <Loader2 size={13} className="animate-spin text-[color:var(--sb-text-2)]" />
                )}
                {st === "moved" && <Check size={14} className="text-[color:var(--sb-green)]" />}
                {st === "failed" && <AlertTriangle size={13} className="text-[color:var(--sb-red)]" />}
              </span>
            </li>
          );
        })}
      </ul>

      {status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={busy}
            className="h-9 px-4 rounded-[10px] text-[12.5px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-default bg-[color:var(--sb-blue)] text-[color:var(--sb-on-blue)]"
          >
            {many ? "Confirm all" : "Confirm"}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-4 rounded-[10px] border text-[12.5px] font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-default border-[color:var(--sb-border)] text-[color:var(--sb-text-2)] hover:bg-[color:var(--sb-surface-2)]"
          >
            Cancel
          </button>
        </div>
      )}
      {status === "running" && <p className="text-[11px] text-[color:var(--sb-text-2)]">Moving tasks…</p>}
      {status === "done" && many && (
        <p className="text-[11px] text-[color:var(--sb-text-2)]" style={mono}>
          {movedCount} of {list.length} moved
        </p>
      )}
      {status === "done" && !many && movedCount === 1 && (
        <p className="text-[11px] text-[color:var(--sb-green)]">Moved to {LABELS[list[0].to]}</p>
      )}
      {status === "cancelled" && <p className="text-[11px] text-[color:var(--sb-text-3)]">Cancelled</p>}
      {status === "expired" && (
        <p className="text-[11px] text-[color:var(--sb-text-3)]">Expired. Ask again if you still want this.</p>
      )}
    </div>
  );
}

export default function AIChatPanel({ onClose, theme, serverUrl, workspaceName, userEmail }) {
  const key = storageKey(userEmail, workspaceName);

  const [messages, setMessages] = useState(() => loadStored(key));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [vvh, setVvh] = useState(null);
 const [actionRunning, setActionRunning] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
    const actionRef = useRef(false);

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
    if (!text || text.length > MAX_CHARS || sendingRef.current || actionRef.current) return;
    sendingRef.current = true;
    setErrorMsg("");
    setSlow(false);
    setLoading(true);

    const history = messages.slice(-MAX_HISTORY_SENT).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev.map(expirePending), { role: "user", text }]);
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
        const proposals = sanitizeProposals(data.proposals);
        setMessages((prev) => [
          ...prev,
          proposals.length
            ? { role: "assistant", text: data.reply, proposals, cardStatus: "pending", cid: makeCid() }
            : { role: "assistant", text: data.reply },
        ]);
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

    const confirmCard = useCallback(async (cid) => {
    if (actionRef.current || sendingRef.current) return;
    const card = messages.find((m) => m.cid === cid);
    if (!card || card.cardStatus !== "pending" || !card.proposals?.length) return;
    actionRef.current = true; // set before any await: a double click can't start twice
    setActionRunning(true);
    setErrorMsg("");
    const props = card.proposals;
    const patchCard = (fn) => setMessages((prev) => prev.map((m) => (m.cid === cid ? fn(m) : m)));
    const setRow = (idx, row) =>
      patchCard((m) => ({ ...m, results: (m.results || []).map((r, k) => (k === idx ? row : r)) }));
    patchCard((m) => ({ ...m, cardStatus: "running", results: props.map(() => ({ state: "wait" })) }));

    let stop = false;
    try {
      for (let i = 0; i < props.length; i++) {
        if (stop) { setRow(i, { state: "skipped" }); continue; }
        if (i > 0) await sleep(ACTION_GAP_MS);
        setRow(i, { state: "moving" });
        const p = props[i];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ACTION_TIMEOUT_MS);
        try {
          const res = await fetch(`${serverUrl}/api/ai/action`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceName,
              action: "move_task",
              taskId: p.taskId,
              targetStatus: p.to,
              expectedFrom: p.from,
            }),
            signal: controller.signal,
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.ok) { setRow(i, { state: "moved" }); continue; }
          const r = describeActionError(res, data, p);
          setRow(i, { state: r.already ? "already" : "failed", msg: r.msg });
          if (r.stop) stop = true;
        } catch (err) {
          setRow(i, {
            state: "failed",
            msg: err?.name === "AbortError"
              ? "No answer from the server. Check the board before trying again."
              : "Can't reach the server.",
          });
          stop = true;
        } finally {
          clearTimeout(timer);
        }
      }
    } finally {
      actionRef.current = false;
      patchCard((m) => ({ ...m, cardStatus: "done" }));
      if (mountedRef.current) setActionRunning(false);
    }
  }, [messages, serverUrl, workspaceName]);

  const cancelCard = useCallback((cid) => {
    if (actionRef.current) return;
    setMessages((prev) =>
      prev.map((m) => (m.cid === cid && m.cardStatus === "pending" ? { ...m, cardStatus: "cancelled" } : m))
    );
  }, []);

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
      className="fixed right-2 top-2 sm:right-6 sm:top-auto sm:bottom-24 z-[120] flex flex-col w-[min(25rem,calc(100vw-1rem))] h-[calc(100dvh-1rem)] sm:h-[min(40rem,calc(100dvh-8rem))] rounded-[20px] border overflow-hidden bg-[color:var(--sb-surface)] border-[color:var(--sb-border)] text-[color:var(--sb-text)]"
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
            disabled={loading || actionRunning || messages.length === 0}
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
              I can summarize, count tasks, spot overdue work and suggest what to do next. Pro users can also ask me to move tasks, and you confirm before anything changes.
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
            <React.Fragment key={i}>
              <div className="self-start max-w-[88%] px-3.5 py-2.5 text-[13px] leading-[1.5] break-words rounded-[16px_16px_16px_4px] border bg-[color:var(--sb-surface-2)] border-[color:var(--sb-border-soft)] text-[color:var(--sb-text)]">
                {renderText(m.text)}
              </div>
              {m.proposals && m.cardStatus && (
                <MoveCard
                  m={m}
                  busy={loading || actionRunning}
                  onConfirm={() => confirmCard(m.cid)}
                  onCancel={() => cancelCard(m.cid)}
                />
              )}
            </React.Fragment>
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