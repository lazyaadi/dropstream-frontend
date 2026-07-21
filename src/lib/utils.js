export const fmtTime = (date) => {
  if (!date) return "";
  const d = new Date(date), now = new Date(), diff = now - d;
  if (diff < 60000)    return "just now";
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const fmtFull = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export const fmtDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
};

export const obfuscateText = (seed = 0, type = "name") => {
  return type === "number" ? "••••••••••" : "••••••••••";
};

export const FLOAT_PANEL_CLASS = "fixed left-4 top-20 z-[90] w-64 sm:w-72 rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto";

export const normEmail = (e) => (e || "").trim().toLowerCase();
export const normName = (n) => (n || "").trim();
export const isSameOnlineUser = (a, b) => {
  if (!a || !b) return false;
  const ae = normEmail(a.email);
  const be = normEmail(b.email);
  if (ae && be && ae === be) return true;
  const an = normName(a.name);
  const bn = normName(b.name);
  return !!(an && bn && an === bn);
};

export const validateEmail = (e) => {
  if (!e?.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) return "Enter a valid email.";
  return null;
};

export const validateWorkspaceName = (n) => {
  if (!n) return "Workspace name is required.";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_]{2,28}[a-zA-Z0-9]$/.test(n)) return "3–30 chars, letters/numbers/underscores.";
  return null;
};

export const validatePin = (p) => {
  if (!p?.trim()) return "PIN is required.";
  if (p.trim().length < 6) return "PIN must be 6 digits.";
  return null;
};

export const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
  } catch {}
};
