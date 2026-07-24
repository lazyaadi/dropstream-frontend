import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { TD, TL } from "../../lib/constants";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function ContactModal({ onClose, theme, serverUrl, context }) {
  const T = theme === "light" ? TL : TD;
  const isDark = theme !== "light";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (context?.userName && !name) setName(context.userName);
    if (context?.userEmail && !email) setEmail(context.userEmail);
  }, [context, name, email]);

  const apiBase = useMemo(() => {
    if (!serverUrl) return "";
    return String(serverUrl).replace(/\/$/, "");
  }, [serverUrl]);

  const submitToContact = async (baseUrl, payload, signal) => {
    const target = baseUrl ? `${baseUrl}/api/contact` : "/api/contact";
    console.log("[contact-ui] submitting to:", target, { baseUrl, hasSignal: Boolean(signal) });
    return fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Contact-Request-ID": payload.requestId,
      },
      body: JSON.stringify(payload),
      signal,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setStatus({ type: "error", text: "Enter a valid email." });
      return;
    }
    if (trimmedMessage.length < 8) {
      setStatus({ type: "error", text: "Message is too short." });
      return;
    }
    if (trimmedMessage.length > 500) {
      setStatus({ type: "error", text: "Message is too long (500 characters max)." });
      return;
    }

    setIsSubmitting(true);
    const requestId = globalThis.crypto?.randomUUID?.() || `contact-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const controller = new AbortController();
    const timeoutMs = 60000;
    const timeout = setTimeout(() => {
      console.warn("[contact-ui] timeout reached, aborting request", { timeoutMs, requestId });
      controller.abort("contact request timeout");
    }, timeoutMs);
    try {
      const payload = {
        requestId,
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
        website,
        workspaceName: context?.workspaceName || "",
        userName: context?.userName || "",
        userEmail: context?.userEmail || "",
        role: context?.role || "",
      };

      console.groupCollapsed("[contact-ui] submit attempt", requestId);
      console.log("[contact-ui] payload summary:", {
        requestId,
        apiBase,
        target: apiBase ? `${apiBase}/api/contact` : "/api/contact",
        origin: globalThis.location?.origin || "",
        online: navigator.onLine,
        visibilityState: document.visibilityState,
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        messageLength: trimmedMessage.length,
      });
      console.log("[contact-ui] sending request body keys:", Object.keys(payload));

      console.time(`[contact-ui] fetch ${requestId}`);
      let res = await submitToContact(apiBase, payload, controller.signal);
      console.timeEnd(`[contact-ui] fetch ${requestId}`);
      if (res.status === 404 && apiBase) {
        console.warn("[contact-ui] primary contact URL returned 404, falling back to relative /api/contact");
        console.time(`[contact-ui] fallback fetch ${requestId}`);
        res = await submitToContact("", payload, controller.signal);
        console.timeEnd(`[contact-ui] fallback fetch ${requestId}`);
      }

      clearTimeout(timeout);

      console.log("[contact-ui] contact response:", {
        requestId,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send message.");
      }

      setMessage("");
      setStatus({ type: "success", text: "Message sent. We will get back to you soon." });
    } catch (err) {
      console.warn("[contact-ui] submit error details:", {
        requestId,
        name: err?.name,
        message: err?.message,
        cause: err?.cause,
        stack: err?.stack,
      });
      const messageText = err?.name === "AbortError"
        ? "Request timed out before the server responded."
        : (err?.message || "Failed to send message.");
      console.error("[contact-ui] submit failed:", { requestId, error: err });
      setStatus({ type: "error", text: messageText });
    } finally {
      console.groupEnd();
      clearTimeout(timeout);
      setIsSubmitting(false);
    }
  };

  const isVerifiedEmail = Boolean(
    context?.userEmail && email.trim() && context.userEmail.trim().toLowerCase() === email.trim().toLowerCase()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 ${isDark ? "bg-slate-950/80" : "bg-slate-900/40"} backdrop-blur-md flex items-center justify-center z-100 p-4`}
      onClick={onClose}
    >
      <style>{`
        @media (max-width: 640px) {
          .contact-modal-card { max-width: 360px !important; border-radius: 20px !important; }
          .contact-modal-header { padding: 16px !important; }
          .contact-modal-form { padding: 16px !important; }
          .contact-modal-title { font-size: 13px !important; }
          .contact-modal-subtitle { font-size: 10px !important; }
          .contact-modal-input { padding: 8px 10px !important; font-size: 12px !important; }
          .contact-modal-textarea { min-height: 110px !important; font-size: 12px !important; }
          .contact-modal-actions button { padding: 10px !important; font-size: 10px !important; }
        }
      `}</style>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`max-w-lg w-full overflow-hidden rounded-[26px] border shadow-2xl contact-modal-card ${isDark ? "bg-[#0b1120] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-900/10"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${isDark ? "bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600" : "bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600"} px-6 sm:px-7 py-5 relative contact-modal-header`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <MessageCircle size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-black tracking-wide text-white contact-modal-title">Contact Support</h2>
                <p className="text-[11px] text-white/80 contact-modal-subtitle">We will reply within 24 hours</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/25 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-7 py-6 space-y-4 contact-modal-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1.5 block`}>Name</label>
              <input
                type="text"
                placeholder="Your name"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition contact-modal-input ${isDark ? "bg-[#111827]/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1.5 block`}>Subject</label>
              <input
                type="text"
                placeholder="Bug report..."
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition contact-modal-input ${isDark ? "bg-[#111827]/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1.5 block`}>Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full pr-24 rounded-xl border px-3 py-2.5 text-sm outline-none transition contact-modal-input ${isDark ? "bg-[#111827]/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {isVerifiedEmail && (
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-bold border ${isDark ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-100 border-emerald-200"}`}>
                  Verified
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1.5 block`}>Message</label>
              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{message.length}/500</span>
            </div>
            <textarea
              rows={5}
              maxLength={500}
              placeholder="Describe your issue in detail..."
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition contact-modal-textarea ${isDark ? "bg-[#111827]/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            className="hidden"
            aria-hidden="true"
          />

          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-200" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
            <span className={`w-2 h-2 rounded-full ${isDark ? "bg-blue-400" : "bg-blue-600"}`} />
            Your email is only used to reply. We never share it.
          </div>

          {status.text && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] font-bold ${status.type === "success"
                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"}`}
            >
              {status.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1 contact-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className={`w-full p-3 rounded-xl font-black text-[11px] uppercase tracking-[0.18em] transition border ${isDark ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-black text-[11px] uppercase tracking-[0.18em] transition-all cursor-pointer shadow-lg border ${
                isDark
                  ? isSubmitting
                    ? "bg-violet-500/60 text-white border-violet-400/30"
                    : "bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white border-white/10"
                  : isSubmitting
                    ? "bg-slate-700 text-white border-slate-500"
                    : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
              }`}
            >
              <Send size={14} />
              {isSubmitting ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
