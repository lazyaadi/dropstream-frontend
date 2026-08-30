import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, AlertCircle, Upload, X, CheckCircle2 } from "lucide-react";
import { WORKER_URL, PRO_FEATURES, TD, TL } from "../../lib/constants";

export default function ProModal({ isPro, onClose, onActivatePin, userEmail, theme, proExpiresAt }) {
  const [pinInput, setPinInput]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptEmail, setReceiptEmail] = useState(userEmail);
  const [successEmail, setSuccessEmail] = useState("");
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("binance");
  const [copied, setCopied] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const isDark = theme !== "light";
  const T = isDark ? TD : TL;

  useEffect(() => {
    if (!isPro) return undefined;
    const id = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [isPro]);

  const daysLeft = proExpiresAt
    ? Math.max(0, Math.ceil((new Date(proExpiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;
  const daysLabel = daysLeft === 1 ? "Day Left" : "Days Left";
  const featuresCount = PRO_FEATURES.length;

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    if (!window.matchMedia("(min-width: 768px)").matches) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlOverflowY = html.style.overflowY;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverflowY = body.style.overflowY;

    html.style.overflow = "hidden";
    html.style.overflowY = "hidden";
    body.style.overflow = "hidden";
    body.style.overflowY = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      html.style.overflowY = previousHtmlOverflowY;
      body.style.overflow = previousBodyOverflow;
      body.style.overflowY = previousBodyOverflowY;
    };
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const validateFile = (file) => {
    if (!file) return "No file selected";
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return "File must be smaller than 5MB";
    if (!["image/png", "image/jpeg", "image/gif"].includes(file.type)) return "Only PNG, JPG, GIF allowed";
    return null;
  };

  const handleActivate = () => {
    if (!pinInput || pinInput.length !== 14) { setMessage("PIN must be 14 characters"); return; }
    setLoading(true);
    setMessage("Verifying with server…");
    // Server owns the real check (validity + single-use lock). No optimistic
    // success here — App.jsx's pro_activated/pro_activate_error listeners
    // handle the toast and close this modal only once the server confirms.
    onActivatePin?.(pinInput.trim());
  };

  const handleReceiptUpload = async () => {
    setMessage("");
    if (!receiptFile || !receiptEmail) {
      setMessage("Please attach receipt and enter email");
      return;
    }
    const fileError = validateFile(receiptFile);
    if (fileError) { setMessage(fileError); return; }
    if (!receiptEmail.includes("@")) { setMessage("Please enter a valid email address"); return; }
    setSubmittingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("name", receiptEmail.split("@")[0]);
      formData.append("email", receiptEmail);
      formData.append("method", selectedMethod);
      formData.append("image", receiptFile);
      const res = await fetch(`${WORKER_URL}/api/request-pro`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setSuccessEmail(receiptEmail.trim());
        setShowSuccessModal(true);
        setReceiptFile(null);
        setReceiptEmail("");
        setPinInput("");
      } else {
        setMessage(data.error || "Error submitting receipt. Try again.");
      }
    } catch (e) {
      setMessage(`Network error: ${e.message}`);
      console.error(e);
    } finally {
      setSubmittingReceipt(false);
    }
  };

  if (isPro) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-220 flex items-center justify-center px-3 py-6 sm:px-6 sm:py-8"
        style={{ background: isDark ? "rgba(2,6,23,0.86)" : "rgba(15,23,42,0.35)", backdropFilter: "blur(14px)" }}
        onClick={onClose}
      >
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="relative w-full max-w-105 rounded-2xl overflow-hidden pro-activated-card"
          style={{
            background: isDark ? "linear-gradient(160deg, #0b1020 0%, #0f172a 55%, #0a0f1e 100%)" : "linear-gradient(180deg, #fff7dd 0%, #fff8e7 35%, #fff 100%)",
            border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(245,200,120,0.55)",
            boxShadow: isDark ? "0 30px 70px rgba(0,0,0,0.7)" : "0 24px 60px rgba(145,100,20,0.15)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="pro-activated-inner"
            style={{
              padding: "26px 24px 22px",
              borderRadius: 18,
              background: isDark
                ? "radial-gradient(120% 120% at 0% 0%, rgba(30,41,59,0.7) 0%, rgba(11,17,32,0.98) 50%, rgba(8,12,22,1) 100%)"
                : "radial-gradient(120% 120% at 0% 0%, rgba(253,239,200,0.7) 0%, rgba(255,250,230,1) 55%, rgba(255,255,255,1) 100%)",
              border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(245,200,120,0.55)",
              boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.65)" : "0 20px 50px rgba(140,95,20,0.15)",
              position: "relative",
              overflow: "hidden",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            <style>{`
              @keyframes sbFloat { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} }
              @keyframes sbGlow { 0%,100%{ opacity: .35;} 50%{ opacity: .7;} }
              @media (max-width: 520px) {
                .pro-activated-card { max-width: 340px !important; }
                .pro-activated-inner { padding: 18px 16px 16px !important; }
                .pro-activated-title { font-size: 18px !important; }
                .pro-activated-sub { font-size: 11px !important; }
                .pro-activated-stats { gap: 8px !important; }
                .pro-activated-stat { padding: 10px 8px !important; border-radius: 12px !important; }
                .pro-activated-stat-value { font-size: 15px !important; }
                .pro-activated-stat-label { font-size: 9px !important; letter-spacing: 0.08em !important; }
                .pro-activated-feature-grid { gap: 8px !important; }
                .pro-activated-feature-card { padding: 10px !important; }
                .pro-activated-feature-title { font-size: 11px !important; }
                .pro-activated-feature-desc { font-size: 9px !important; }
              }
            `}</style>

            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{
                position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: "50%",
                background: isDark ? "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)" : "radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)",
                animation: "sbGlow 4s ease-in-out infinite",
              }} />
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, marginBottom: 14,
              background: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.2)",
              border: isDark ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(245,158,11,0.45)",
              color: isDark ? "#fbbf24" : "#b45309", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              <span>Pro Activated</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div>
                <p className="pro-activated-title" style={{
                  fontSize: 22, fontWeight: 700, marginBottom: 2, letterSpacing: "-0.02em",
                  color: isDark ? "#f8fafc" : "#1f2937",
                }}>You're a Pro now.</p>
                <p className="pro-activated-sub" style={{ fontSize: 12, color: isDark ? "#cbd5f5" : "#6b7280", fontWeight: 600 }}>
                  {daysLeft === null
                    ? "Pro is active."
                    : daysLeft === 0
                      ? "Your Pro window just ended."
                      : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} of full power left. No limits.`}
                </p>
              </div>
            </div>

            <div className="pro-activated-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                { value: "3,000", label: "Tasks/mo", color: isDark ? "#f59e0b" : "#d97706" },
                { value: daysLeft === null ? "--" : `${daysLeft}`, label: daysLabel, color: isDark ? "#8b5cf6" : "#7c3aed" },
                { value: `${featuresCount}`, label: "Features", color: isDark ? "#10b981" : "#059669" },
              ].map((s, i) => (
                <div key={i} className="pro-activated-stat" style={{
                  borderRadius: 14, padding: "12px 10px", textAlign: "center",
                  background: isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.9)",
                  border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                }}>
                  <div className="pro-activated-stat-value" style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
                  <div className="pro-activated-stat-label" style={{ fontSize: 10, color: isDark ? "#94a3b8" : "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 10, color: isDark ? "#d1d5db" : "#9a6b1f", fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Everything Unlocked
            </div>

            <div className="pro-activated-feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {PRO_FEATURES.map((f, i) => {
                const Icon = f.icon;
                const iconColor = isDark ? f.iconDark : f.iconLight;
                return (
                <div key={i}
                  className="pro-activated-feature-card"
                  style={{
                    padding: "12px 12px", borderRadius: 12,
                    background: isDark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.95)",
                    border: isDark ? "1px solid rgba(148,163,184,0.15)" : "1px solid rgba(0,0,0,0.06)",
                    boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.02)" : "0 6px 16px rgba(203,153,55,0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: iconColor }}>
                    <Icon size={14} style={{ color: iconColor }} />
                    <span className="pro-activated-feature-title" style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#e2e8f0" : "#0f172a" }}>{f.title}</span>
                  </div>
                  <div className="pro-activated-feature-desc" style={{ fontSize: 10, color: isDark ? "#94a3b8" : "#64748b" }}>{f.desc}</div>
                </div>
                );
              })}
              <div
                style={{
                  padding: "12px 12px", borderRadius: 12,
                  background: isDark ? "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))" : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
                  border: isDark ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(245,158,11,0.35)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#fbbf24" : "#b45309" }}>More coming</div>
                <div style={{ fontSize: 10, color: isDark ? "#cbd5e1" : "#7c6a4a" }}>Stay tuned</div>
              </div>
            </div>

            <button onClick={onClose}
              style={{
                width: "100%", padding: "12px 14px", marginTop: 18, borderRadius: 12,
                background: isDark ? "linear-gradient(135deg, #f59e0b, #f97316)" : "linear-gradient(135deg, #f59e0b, #ea580c)",
                border: "none",
                color: isDark ? "#0b1020" : "#fff",
                fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer",
                boxShadow: isDark ? "0 16px 30px rgba(245,158,11,0.25)" : "0 16px 30px rgba(245,158,11,0.28)",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Start using Pro</button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  const SuccessModal = ({ isOpen, email, onClose }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-230 p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: isDark ? "linear-gradient(160deg, #0f172a 0%, #0a0f1e 100%)" : "#f8fafc",
              border: isDark ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(16,185,129,0.2)",
              boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.8)" : "0 20px 50px rgba(0,0,0,0.2)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                style={{
                  width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%",
                  background: isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)",
                  border: isDark ? "2px solid rgba(16,185,129,0.4)" : "2px solid rgba(16,185,129,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <Check size={32} style={{ color: "#10b981" }} />
              </motion.div>

              <h2 style={{ fontSize: 22, fontWeight: 900, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 12 }}>
                Receipt Submitted Successfully!
              </h2>

              <p style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.7, marginBottom: 24 }}>
                Our team is now verifying your payment. Your unique <strong>14-digit Activation PIN</strong> will be sent to your email (<strong>{email}</strong>) within <strong>15–60 minutes</strong>.
              </p>

              <div style={{ background: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)", border: isDark ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(59,130,246,0.15)", padding: 16, borderRadius: 12, marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#60a5fa" : "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>What's next?</p>
                <p style={{ fontSize: 11, color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.6 }}>Check your email for the PIN and paste it in the "Enter PIN" field below to activate Pro instantly.</p>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                style={{
                  width: "100%", padding: 14, borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em",
                  textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                Got It!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .grid-auto-stack { grid-template-columns: 1fr !important; }
          .pro-modal-col-left { border-right: none !important; border-bottom: 1px solid #1B1E28 !important; }
        }
        @media (max-width: 640px) {
          .pro-modal-shell { max-width: 360px !important; border-radius: 20px !important; }
          .pro-modal-header { padding: 16px !important; }
          .pro-modal-title { font-size: 20px !important; }
          .pro-modal-subtitle { font-size: 11px !important; }
          .pro-modal-content { padding: 16px !important; padding-bottom: 24px !important; }
        }
      `}</style>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-220 flex items-center justify-center px-3 py-6 sm:px-6 sm:py-8"
        style={{ background: isDark ? "rgba(2,6,23,0.88)" : "rgba(15,23,42,0.6)", backdropFilter: "blur(14px)", overflow: "auto" }}
        onClick={onClose}
      >
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="relative w-full rounded-3xl overflow-hidden pro-modal-shell"
          style={{
            background: isDark ? "linear-gradient(160deg, #0f172a 0%, #0a0f1e 100%)" : "#f8fafc",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
            boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.7)" : "0 20px 50px rgba(0,0,0,0.15)",
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            width: "100%", maxWidth: "900px", overflowY: "auto", overflowX: "hidden",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ height: 2, background: "linear-gradient(90deg, #6E9BF4, #D9A441)" }} />

          <div className="px-6 py-5 pro-modal-header" style={{ borderBottom: "1px solid #1B1E28", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 className="pro-modal-title" style={{ fontSize: 19, fontWeight: 700, color: "#ECEEF2", marginBottom: 3, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>Pro Plan</h1>
              <p className="pro-modal-subtitle" style={{ fontSize: 12, color: "#8A90A0" }}>Unlock 3,000 tasks/month and premium features</p>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #232733", background: "#171A22", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#565C6E", flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 0 }} className="pro-modal-content">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="grid-auto-stack">
              <div style={{ padding: "18px 22px", borderRight: "1px solid #1B1E28" }} className="pro-modal-col-left">
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E9BF4", marginBottom: 12 }}>How it works</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
                  {[
                    { step: 1, title: "Choose a method", desc: "Binance Pay or UBL Bank Transfer." },
                    { step: 2, title: "Send payment", desc: "and save your transaction receipt." },
                    { step: 3, title: "Upload receipt", desc: "with your email to link the payment." },
                    { step: 4, title: "Get your PIN", desc: "by email, usually within 15–60 min." },
                    { step: 5, title: "Activate Pro", desc: "in your workspace using the PIN." },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <div style={{ width: 19, height: 19, borderRadius: "50%", background: "rgba(110,155,244,0.14)", color: "#6E9BF4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{item.step}</div>
                      <p style={{ fontSize: 12, lineHeight: 1.45, color: "#8A90A0" }}><b style={{ fontWeight: 600, color: "#ECEEF2" }}>{item.title}</b> {item.desc}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(110,155,244,0.14)", border: "1px solid rgba(110,155,244,0.22)", borderRadius: 10, padding: "10px 12px", marginBottom: 18 }}>
                  <AlertCircle size={13} style={{ color: "#6E9BF4", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 11, color: "#8A90A0", lineHeight: 1.5 }}><b style={{ color: "#6E9BF4", fontWeight: 600 }}>Manual processing</b> — no PIN after 3 hours? Contact support in app settings.</p>
                </div>

                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4ADE8F", marginBottom: 12 }}>Premium features</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    "3,000 tasks/month", "File upload on tasks", "Advanced search & filters",
                    "Full activity history", "Real-time notifications", "Shared team view",
                  ].map((label, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: "#171A22", border: "1px solid #1B1E28", borderRadius: 9, padding: "8px 10px" }}>
                      <Check size={13} style={{ color: "#4ADE8F", flexShrink: 0 }} strokeWidth={3} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#ECEEF2" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "18px 22px" }} className="pro-modal-col-right">
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D9A441", marginBottom: 12 }}>Payment</p>

                <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
                  {[
                    { id: "binance", label: "Binance Pay" },
                    { id: "ubl", label: "UBL Bank" },
                  ].map(m => (
                    <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                      style={{
                        flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                        background: selectedMethod === m.id ? "rgba(217,164,65,0.12)" : "#171A22",
                        border: selectedMethod === m.id ? "1px solid #D9A441" : "1px solid #232733",
                        color: selectedMethod === m.id ? "#D9A441" : "#8A90A0",
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {selectedMethod === "binance" && (
                    <motion.div key="binance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#565C6E", marginBottom: 6 }}>Binance Account ID</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#171A22", border: "1px solid #1B1E28", borderRadius: 10, padding: "10px 10px 10px 12px", marginBottom: 10 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14.5, fontWeight: 600, color: "#D9A441" }}>853693254</span>
                        <motion.button whileTap={{ scale: 0.92 }} onClick={() => copyToClipboard("853693254", "binance")}
                          style={{ width: 26, height: 26, borderRadius: 7, background: "#1B1F29", border: "1px solid #232733", display: "flex", alignItems: "center", justifyContent: "center", color: "#D9A441", cursor: "pointer", flexShrink: 0 }}>
                          {copied === "binance" ? <Check size={12} /> : <Copy size={12} />}
                        </motion.button>
                      </div>
                      <p style={{ fontSize: 11, color: "#8A90A0", marginBottom: 12 }}><b style={{ color: "#D9A441", fontWeight: 600 }}>Note:</b> include your email in the payment note.</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(217,164,65,0.12)", border: "1px solid rgba(217,164,65,0.25)", borderRadius: 10, padding: "11px 13px", marginBottom: 16 }}>
                        <span style={{ fontSize: 11.5, color: "#8A90A0", fontWeight: 500 }}>Total payment</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#D9A441" }}>$11 USD</span>
                      </div>
                    </motion.div>
                  )}

                  {selectedMethod === "ubl" && (
                    <motion.div key="ubl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#565C6E", marginBottom: 6 }}>Account Number</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#171A22", border: "1px solid #1B1E28", borderRadius: 10, padding: "10px 10px 10px 12px", marginBottom: 10 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14.5, fontWeight: 600, color: "#4ADE8F" }}>1951324646652</span>
                        <motion.button whileTap={{ scale: 0.92 }} onClick={() => copyToClipboard("1951324646652", "ubl")}
                          style={{ width: 26, height: 26, borderRadius: 7, background: "#1B1F29", border: "1px solid #232733", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ADE8F", cursor: "pointer", flexShrink: 0 }}>
                          {copied === "ubl" ? <Check size={12} /> : <Copy size={12} />}
                        </motion.button>
                      </div>
                      <p style={{ fontSize: 11, color: "#8A90A0", marginBottom: 12 }}><b style={{ color: "#4ADE8F", fontWeight: 600 }}>Note:</b> include your email in the transfer note.</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(74,222,143,0.12)", border: "1px solid rgba(74,222,143,0.25)", borderRadius: 10, padding: "11px 13px", marginBottom: 16 }}>
                        <span style={{ fontSize: 11.5, color: "#8A90A0", fontWeight: 500 }}>Total payment</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#4ADE8F" }}>PKR 2,800</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#565C6E", display: "block", marginBottom: 8 }}>Email Address</label>
                <input type="email" value={receiptEmail} onChange={e => setReceiptEmail(e.target.value)}
                  style={{ width: "100%", background: "#171A22", border: "1px solid #232733", borderRadius: 9, padding: "9px 11px", color: "#ECEEF2", fontFamily: "'Inter', sans-serif", fontSize: 12, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
                />

                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 9, border: "1.5px dashed #232733", borderRadius: 9,
                    padding: "11px 12px", marginBottom: 10, cursor: "pointer",
                    background: receiptFile ? "rgba(74,222,143,0.06)" : "transparent",
                    borderColor: receiptFile ? "rgba(74,222,143,0.3)" : "#232733",
                  }}
                  onDrop={(e) => { e.preventDefault(); const files = e.dataTransfer.files; if (files && files[0]) setReceiptFile(files[0]); }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input type="file" id="receipt-upload" accept="image/*" onChange={e => { if (e.target.files?.[0]) setReceiptFile(e.target.files[0]); }} style={{ display: "none" }} />
                  <label htmlFor="receipt-upload" style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", width: "100%" }}>
                    <Upload size={15} style={{ color: "#565C6E", flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: "#8A90A0", flex: 1 }}>
                      {receiptFile ? `✓ ${receiptFile.name}` : "Upload receipt (PNG, JPG, max 5MB)"}
                    </span>
                    {receiptFile && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReceiptFile(null); setMessage(""); }}
                        style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "#1B1F29", color: "#8A90A0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <X size={12} />
                      </motion.button>
                    )}
                  </label>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleReceiptUpload} disabled={submittingReceipt || !receiptFile || !receiptEmail}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 9, border: "none",
                    background: receiptFile && receiptEmail ? "#6E9BF4" : "#171A22",
                    color: receiptFile && receiptEmail ? "#0B0D12" : "#565C6E",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase",
                    cursor: receiptFile && receiptEmail && !submittingReceipt ? "pointer" : "not-allowed", marginBottom: 6,
                  }}
                >
                  {submittingReceipt ? "Submitting…" : "Submit & Get PIN"}
                </motion.button>

                <p style={{ textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", color: "#565C6E", textTransform: "uppercase", margin: "10px 0" }}>Or</p>

                <input type="text" className="mono" placeholder="Enter 14-digit PIN"
                  value={pinInput} onChange={e => { setPinInput(e.target.value.slice(0, 14).toUpperCase()); setMessage(""); }}
                  maxLength={14}
                  style={{
                    width: "100%", background: "#171A22", borderRadius: 9, padding: "9px 11px", color: "#ECEEF2",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, textAlign: "center", letterSpacing: "0.1em", outline: "none", marginBottom: 8, boxSizing: "border-box",
                    border: `1px solid ${message && !message.includes("Verifying") ? "rgba(240,87,107,0.5)" : pinInput.length === 14 ? "rgba(74,222,143,0.4)" : "#232733"}`,
                  }}
                />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleActivate} disabled={loading || pinInput.length !== 14}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 9, border: "none",
                    background: pinInput.length === 14 && !loading ? "#D9A441" : "#171A22",
                    color: pinInput.length === 14 && !loading ? "#0B0D12" : "#565C6E",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase",
                    cursor: pinInput.length === 14 && !loading ? "pointer" : "not-allowed",
                  }}
                >
                  {loading ? "Verifying…" : "Activate Pro"}
                </motion.button>

                <AnimatePresence>
                  {message && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 11, fontWeight: 600, textAlign: "center", marginTop: 10, color: "#F0576B" }}
                    >{message}</motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
        <SuccessModal isOpen={showSuccessModal} email={successEmail || receiptEmail || userEmail} onClose={() => setShowSuccessModal(false)} />
      </motion.div>
    </>
  );
}
