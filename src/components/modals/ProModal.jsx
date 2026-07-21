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

  const handleActivate = async () => {
    if (!pinInput || pinInput.length !== 14) { setMessage("PIN must be 14 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.valid) {
        setMessage("✓ Pro activated!");
        setTimeout(() => { onActivatePin?.(pinInput.trim()); onClose(); }, 800);
      } else {
        setMessage("Invalid PIN. Contact support.");
      }
    } catch (e) {
      setMessage("Error verifying PIN. Try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        className="fixed inset-0 flex items-center justify-center z-[100] p-3"
        style={{ background: isDark ? "rgba(2,6,23,0.86)" : "rgba(15,23,42,0.35)", backdropFilter: "blur(14px)" }}
        onClick={onClose}
      >
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="relative w-full max-w-[420px] rounded-2xl overflow-hidden pro-activated-card"
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
              fontFamily: "\"Plus Jakarta Sans\", \"Segoe UI\", sans-serif",
            }}
          >
            <style>{`
              @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap");
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
                  fontSize: 22, fontWeight: 800, marginBottom: 2,
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
          className="fixed inset-0 flex items-center justify-center z-[110] p-4"
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
          .grid-auto-stack { grid-template-columns: 1fr !important; gap: 24px !important; }
          .pro-modal-content { padding: 20px !important; padding-bottom: 32px !important; }
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
        className="fixed inset-0 flex items-center justify-center z-[100] p-2 sm:p-4"
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
          <div style={{ height: 3, background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)" }} />

          <div className="px-8 py-6 pro-modal-header" style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="pro-modal-title" style={{ fontSize: 28, fontWeight: 900, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 4 }}>Pro Plan</h1>
                <p className="pro-modal-subtitle" style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500 }}>Unlock 3,000 tasks/month and premium features</p>
              </div>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", cursor: "pointer", fontSize: 20, color: isDark ? "#94a3b8" : "#64748b", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"; }}>×</button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "32px", paddingBottom: "48px" }} className="pro-modal-content">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="grid-auto-stack">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgb(59, 130, 246)" }}>How It Works</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { step: 1, title: "Choose Your Method", desc: "Copy our payment details below. We currently accept Binance Pay ID or UBL Bank Transfer." },
                    { step: 2, title: "Complete the Transfer", desc: "Send the exact amount for the Pro plan.Take a clear screenshot or save your successful transaction receipt." },
                    { step: 3, title: "Submit Verification", desc: "Click the UPLOAD RECIEPT button. Fill in your email and attach your screenshot. This links your payment to your account." },
                    { step: 4, title: "Await Your PIN", desc: "Our team will verify the transaction. Once confirmed, a unique 14-digit Activation PIN will be sent to your email address (usually within 15–60 minutes)." },
                    { step: 5, title: "Activate Pro", desc: `Open your Workspace, click "Activate Pro," and enter your PIN. Your account will be upgraded instantly!` },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{item.step}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 2 }}>{item.title}</p>
                        <p style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.05)", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(59, 130, 246, 0.15)", display: "flex", gap: 12 }}>
                  <AlertCircle size={18} style={{ color: isDark ? "#60a5fa" : "#2563eb", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#60a5fa" : "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Manual Processing</p>
                    <p style={{ fontSize: 11, color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.6 }}>Payments are processed manually. If you don't receive your PIN within 3 hours, please contact support via the app settings.</p>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: isDark ? "#f1f5f9" : "#0f172a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Premium Pro Features</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="grid-auto-stack">
                    {[
                      { title: "3,000 Tasks", desc: "Massive capacity for large-scale projects and high-volume teams." },
                      { title: "File Upload", desc: "Attach documents, images, and assets directly to your tasks." },
                      { title: "Advanced Search", desc: "Find exactly what you need with powerful filters and global indexing." },
                      { title: "Full History", desc: "Track every change with a complete, permanent audit log of all activity." },
                      { title: "Real-time Notifications", desc: "Stay updated instantly with live desktop and email alerts." },
                      { title: "Team View", desc: "Collaborate seamlessly with shared workspace visibility for all members." },
                    ].map((feature, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
                        style={{ 
                          display: "flex", gap: 12, padding: "14px 16px", borderRadius: 12,
                          border: isDark ? "1px solid rgba(16,185,129,0.15)" : "1px solid rgba(16,185,129,0.1)",
                          background: isDark ? "rgba(16,185,129,0.04)" : "rgba(16,185,129,0.02)",
                          cursor: "pointer", transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";
                          e.currentTarget.style.borderColor = isDark ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.25)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDark ? "rgba(16,185,129,0.04)" : "rgba(16,185,129,0.02)";
                          e.currentTarget.style.borderColor = isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#cbd5e1" : "#0f172a" }}>{feature.title}</span>
                          <span style={{ fontSize: 11, fontWeight: 400, color: isDark ? "#94a3b8" : "#64748b", lineHeight: 1.4 }}>{feature.desc}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Choose Payment Method</h3>
                  <AnimatePresence mode="wait">
                    {selectedMethod === "binance" && (
                      <motion.div key="binance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}
                        style={{ borderRadius: 16, background: isDark ? "rgba(255,255,255,0.03)" : "#fff", border: isDark ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid rgba(0,0,0,0.08)", padding: 24, marginBottom: 20, position: "relative" }}>
                        <h4 style={{ fontSize: 16, fontWeight: 900, color: isDark ? "#f59e0b" : "#d97706", marginBottom: 8 }}>Binance Pay</h4>
                        <p style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 20, fontWeight: 500 }}>Fast crypto transfer to activate your Pro account</p>
                        <div style={{ borderRadius: 10, background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", padding: 16, marginBottom: 16 }}>
                          <p style={{ fontSize: 9, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Binance Account ID</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                            <p style={{ fontSize: 18, fontWeight: 900, color: isDark ? "#f59e0b" : "#d97706", fontFamily: "'Courier New', monospace", letterSpacing: "0.05em", flex: 1, wordBreak: "break-all" }}>853693254</p>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                              onClick={() => copyToClipboard("853693254", "binance")}
                              style={{
                                width: 40, height: 40, border: "none", borderRadius: 10,
                                background: copied === "binance" ? (isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)") : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
                                color: copied === "binance" ? "#10b981" : (isDark ? "#f59e0b" : "#d97706"),
                                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                padding: 0, fontSize: 18,
                              }}
                              title="Copy Account ID"
                            >
                              {copied === "binance" ? <Check size={18} /> : <Copy size={18} />}
                            </motion.button>
                          </div>
                        </div>
                        <div style={{ background: isDark ? "rgba(255,165,0,0.08)" : "rgba(255,165,0,0.05)", border: isDark ? "1px solid rgba(255,165,0,0.15)" : "1px solid rgba(255,165,0,0.1)", padding: 12, borderRadius: 10, marginBottom: 20 }}>
                          <p style={{ fontSize: 11, color: isDark ? "#fbbf24" : "#f59e0b", fontWeight: 700, marginBottom: 4 }}>Important:</p>
                          <p style={{ fontSize: 11, color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.5 }}>Include your email address in the payment note for account linking.</p>
                        </div>
                        <div style={{ background: isDark ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))" : "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))", border: isDark ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(245,158,11,0.15)", padding: 14, borderRadius: 10, textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Total Payment</p>
                          <p style={{ fontSize: 24, fontWeight: 900, color: isDark ? "#f59e0b" : "#d97706" }}>$11 USD</p>
                        </div>
                      </motion.div>
                    )}
                    
                    {selectedMethod === "ubl" && (
                      <motion.div key="ubl" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}
                        style={{ borderRadius: 16, background: isDark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.02)", border: isDark ? "1.5px solid rgba(16,185,129,0.3)" : "1.5px solid rgba(16,185,129,0.2)", padding: 24, marginBottom: 20, position: "relative" }}>
                        <div style={{ position: "absolute", top: 12, right: 12, background: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)", color: isDark ? "#6ee7b7" : "#10b981", padding: "4px 12px", borderRadius: 6, fontSize: 7, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>Recommended</div>
                        <h4 style={{ fontSize: 16, fontWeight: 900, color: isDark ? "#10b981" : "#059669", marginBottom: 8 }}>UBL Bank Transfer</h4>
                        <p style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 20, fontWeight: 500 }}>Local bank transfer in Pakistani Rupees (PKR)</p>
                        <div style={{ borderRadius: 10, background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", padding: 16, marginBottom: 16 }}>
                          <p style={{ fontSize: 9, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Account Number</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                            <p style={{ fontSize: 18, fontWeight: 900, color: isDark ? "#10b981" : "#059669", fontFamily: "'Courier New', monospace", letterSpacing: "0.05em", flex: 1, wordBreak: "break-all" }}>1951324646652</p>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                              onClick={() => copyToClipboard("1951324646652", "ubl")}
                              style={{
                                width: 40, height: 40, border: "none", borderRadius: 10,
                                background: copied === "ubl" ? (isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)") : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
                                color: copied === "ubl" ? "#10b981" : (isDark ? "#10b981" : "#059669"),
                                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                padding: 0, fontSize: 18,
                              }}
                              title="Copy Account Number"
                            >
                              {copied === "ubl" ? <Check size={18} /> : <Copy size={18} />}
                            </motion.button>
                          </div>
                        </div>
                        <div style={{ background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)", border: isDark ? "1px solid rgba(16,185,129,0.15)" : "1px solid rgba(16,185,129,0.1)", padding: 12, borderRadius: 10, marginBottom: 20 }}>
                          <p style={{ fontSize: 11, color: isDark ? "#6ee7b7" : "#10b981", fontWeight: 700, marginBottom: 4 }}>Important:</p>
                          <p style={{ fontSize: 11, color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.5 }}>Include your email address in the bank transfer note for account linking.</p>
                        </div>
                        <div style={{ background: isDark ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))" : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))", border: isDark ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(16,185,129,0.15)", padding: 14, borderRadius: 10, textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Total Payment</p>
                          <p style={{ fontSize: 24, fontWeight: 900, color: isDark ? "#10b981" : "#059669" }}>PKR 2,800</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    {[
                      { id: "binance", label: "Binance Pay" },
                      { id: "ubl", label: "UBL Bank" },
                    ].map(m => (
                      <motion.button key={m.id} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMethod(m.id)}
                        style={{
                          flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${selectedMethod === m.id ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}`,
                          background: selectedMethod === m.id ? (isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.08)") : (isDark ? "rgba(255,255,255,0.02)" : "#fff"),
                          color: selectedMethod === m.id ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#cbd5e1" : "#475569"), fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        {m.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: isDark ? "#475569" : "#cbd5e1", textTransform: "uppercase" }}>Submit Receipt or Enter PIN</span>
                  <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }} />
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ borderRadius: 16, background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", padding: 20 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isDark ? "#475569" : "#94a3b8", display: "block", marginBottom: 8 }}>Email Address</label>
                    <input type="email" value={receiptEmail} onChange={e => setReceiptEmail(e.target.value)}
                      style={{
                        width: "100%", padding: 11, borderRadius: 10,
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                        background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                        color: isDark ? "#e2e8f0" : "#0f172a",
                        fontSize: 12, fontWeight: 500, outline: "none", transition: "all 0.2s",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isDark ? "#475569" : "#94a3b8", display: "block", marginBottom: 8 }}>Payment Receipt (Image)</label>
                    <div
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        borderRadius: 12, border: isDark ? "2px dashed rgba(255,255,255,0.15)" : "2px dashed rgba(0,0,0,0.15)",
                        padding: 20, cursor: "pointer", transition: "all 0.2s",
                        background: receiptFile ? (isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)") : (isDark ? "rgba(255,255,255,0.02)" : "#fff"),
                        borderColor: receiptFile ? (isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)") : "inherit",
                        minHeight: 80,
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)"; }}
                      onDragLeave={(e) => { e.currentTarget.style.background = receiptFile ? (isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)") : (isDark ? "rgba(255,255,255,0.02)" : "#fff"); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = e.dataTransfer.files;
                        if (files && files[0]) setReceiptFile(files[0]);
                      }}
                    >
                      <input type="file" id="receipt-upload" accept="image/*" onChange={e => { if (e.target.files?.[0]) setReceiptFile(e.target.files[0]); }} style={{ display: "none" }} />
                      <label htmlFor="receipt-upload" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: "100%" }}>
                        <Upload size={20} style={{ color: isDark ? "#64748b" : "#94a3b8", flexShrink: 0 }} />
                        <div style={{ textAlign: "left", flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#cbd5e1" : "#0f172a", margin: 0 }}>
                            {receiptFile ? `✓ ${receiptFile.name}` : "Click to upload or drag receipt"}
                          </p>
                          <p style={{ fontSize: 10, color: isDark ? "#64748b" : "#94a3b8", margin: "4px 0 0 0" }}>
                            {receiptFile ? `${(receiptFile.size / 1024).toFixed(1)} KB` : "PNG, JPG, GIF (max 5MB)"}
                          </p>
                        </div>
                        {receiptFile && (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReceiptFile(null); setMessage(""); }}
                            style={{
                              width: 28, height: 28, borderRadius: 6, border: "none", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                              color: isDark ? "#cbd5e1" : "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, transition: "all 0.2s"
                            }} title="Remove file"
                          >
                            <X size={16} />
                          </motion.button>
                        )}
                      </label>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleReceiptUpload} disabled={submittingReceipt || !receiptFile || !receiptEmail}
                    style={{
                      width: "100%", padding: 12, borderRadius: 10, border: "none",
                      background: receiptFile && receiptEmail ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : (isDark ? "rgba(255,255,255,0.04)" : "#e2e8f0"),
                      color: receiptFile && receiptEmail ? "#fff" : (isDark ? "#334155" : "#94a3b8"),
                      fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                      cursor: receiptFile && receiptEmail && !submittingReceipt ? "pointer" : "not-allowed",
                      transition: "all 0.2s", marginBottom: 12,
                    }}
                  >
                    {submittingReceipt ? "Submitting…" : "Submit Receipt & Get PIN"}
                  </motion.button>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                    <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: isDark ? "#334155" : "#cbd5e1", textTransform: "uppercase" }}>Or</span>
                    <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isDark ? "#475569" : "#94a3b8", display: "block", marginBottom: 8 }}>Enter 14-Digit PIN</label>
                    <input type="text" placeholder="ABC123!@#$%ABC"
                      value={pinInput} onChange={e => { setPinInput(e.target.value.slice(0, 14).toUpperCase()); setMessage(""); }}
                      maxLength={14}
                      style={{
                        width: "100%", padding: 11, borderRadius: 10,
                        border: isDark ? `1.5px solid ${message && !message.includes("✓") ? "rgba(239,68,68,0.5)" : pinInput.length === 14 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}` : `1.5px solid ${message && !message.includes("✓") ? "rgba(239,68,68,0.4)" : pinInput.length === 14 ? "rgba(16,185,129,0.35)" : "rgba(0,0,0,0.08)"}`,
                        background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                        color: isDark ? "#e2e8f0" : "#0f172a",
                        fontSize: 14, fontWeight: 700, textAlign: "center", letterSpacing: "0.12em", outline: "none", transition: "all 0.2s", fontFamily: "monospace", marginBottom: 12,
                      }}
                    />
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleActivate} disabled={loading || pinInput.length !== 14}
                      style={{
                        width: "100%", padding: 12, borderRadius: 10, border: "none",
                        background: pinInput.length === 14 && !loading ? "linear-gradient(135deg, #10b981, #059669)" : (isDark ? "rgba(255,255,255,0.04)" : "#e2e8f0"),
                        color: pinInput.length === 14 && !loading ? "#fff" : (isDark ? "#334155" : "#94a3b8"),
                        fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                        cursor: pinInput.length === 14 && !loading ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                      }}
                    >
                      {loading ? "Verifying…" : "Activate Pro"}
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {message && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ fontSize: 11, fontWeight: 700, textAlign: "center", marginTop: 12, color: message.includes("✓") ? "#10b981" : "#ef4444" }}
                      >{message}</motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        <SuccessModal isOpen={showSuccessModal} email={successEmail || receiptEmail || userEmail} onClose={() => setShowSuccessModal(false)} />
      </motion.div>
    </>
  );
}
