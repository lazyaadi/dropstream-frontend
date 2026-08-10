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
    // stronger guard for mobile: shared window flag + timestamp debounce
    if (typeof window !== "undefined") {
      if (window.__syncboard_playing) return;
      if (!playNotifSound._last) playNotifSound._last = 0;
      const now = Date.now();
      // allow one beep per 700ms
      if (now - playNotifSound._last < 700) return;
      playNotifSound._last = now;
      window.__syncboard_playing = true;
      // clear playing flag after safe interval
      setTimeout(() => { try { window.__syncboard_playing = false; } catch {} }, 800);
    }

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

// Play a short chime for live-action events. Uses a shared AudioContext and
// resumes on first user gesture to work on mobile browsers.
export const playChime = (() => {
  let ctx = null;
  let resumed = false;

  const ensure = async () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (!resumed && ctx.state === 'suspended') {
      const resumeOnce = () => { try { ctx.resume(); } catch {} document.removeEventListener('click', resumeOnce); document.removeEventListener('touchstart', resumeOnce); resumed = true; };
      document.addEventListener('click', resumeOnce, { once: true });
      document.addEventListener('touchstart', resumeOnce, { once: true });
    }
    return ctx;
  };

  return async () => {
    try {
      const c = await ensure();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1000, c.currentTime);
      o.frequency.setValueAtTime(1200, c.currentTime + 0.06);
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + 0.001);
      o.stop(c.currentTime + 0.2);
    } catch {}
  };
})();
