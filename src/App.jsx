import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { io } from "socket.io-client";
import {
  DndContext, PointerSensor, TouchSensor,  
  useSensor, useSensors, closestCorners, pointerWithin, DragOverlay,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sun, Moon, Plus, ChevronRight, ArrowLeft, AlertTriangle, Eye, EyeOff, Info, Shield,
  Search, Lock, X,
} from "lucide-react";

// ─── CONSTANTS ───
const WORKER_URL = import.meta.env?.VITE_WORKER_URL || "https://rana-ai.ak3807654.workers.dev";
const DEFAULT_SERVER_URL = import.meta.env?.DEV
  ? "http://localhost:3001"
  : (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");
const SERVER_URL = import.meta.env?.VITE_SERVER_URL || DEFAULT_SERVER_URL;
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || "";
const SESSION_KEY = "sb_workspace_session";
const WORKSPACE_SESSION_KEY = "sb_workspace_active";
const LAST_AUTH_EMAIL_KEY = "sb_last_auth_email";
const PRO_PIN_KEY = "sb_pro_pin";
const PRO_EXPIRES_KEY = "sb_pro_expires_at";
const PRO_ACTIVE_KEY = "sb_pro_active";
const THEME_KEY = "sb_theme";
const FREE_TASK_LIMIT = 3;
const PRO_TASK_LIMIT = 3000;

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#ef4444", badge: "text-red-400 bg-red-500/10 border-red-500/30", ring: "border-red-500/40 bg-red-500/5", dot: "bg-red-500" },
  { id: "in-progress", label: "In Progress", color: "#f59e0b", badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", ring: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-500" },
  { id: "done", label: "Done", color: "#10b981", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", ring: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-500" },
];

const COLUMNS_LIGHT = [
  { id: "todo", label: "To Do", color: "#dc2626", badge: "text-red-700 bg-red-100 border-red-300", ring: "border-red-300 bg-red-50", dot: "bg-red-500" },
  { id: "in-progress", label: "In Progress", color: "#d97706", badge: "text-amber-700 bg-amber-100 border-amber-300", ring: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
  { id: "done", label: "Done", color: "#059669", badge: "text-emerald-700 bg-emerald-100 border-emerald-300", ring: "border-emerald-300 bg-emerald-50", dot: "bg-emerald-500" },
];

const TD = {
  bg: "bg-[#080c14]", nav: "bg-slate-900/80 border-slate-800/60",
  card: "bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60",
  cardText: "text-slate-200", subText: "text-slate-400",
  input: "bg-slate-800/80 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-blue-500",
  modal: "bg-slate-900 border-slate-700/60",
  colBg: "border-slate-800/50 bg-slate-900/30",
  badge: "bg-slate-800/60 border-slate-700/50 text-slate-400",
  historyBg: "bg-slate-800/50 border-slate-700/40",
  panelBg: "bg-slate-900/95 border-slate-700/60",
  text: "text-slate-200", loginCard: "bg-slate-900/90 border-slate-800",
  label: "text-slate-500", divider: "border-slate-700/80",
};

const TL = {
  bg: "bg-gray-50", nav: "bg-white/90 border-gray-300",
  card: "bg-white border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md",
  cardText: "text-gray-800", subText: "text-gray-600",
  input: "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500",
  modal: "bg-white border-gray-200",
  colBg: "border-gray-200 bg-white/70 shadow-sm",
  badge: "bg-gray-100 border-gray-200 text-gray-600",
  historyBg: "bg-gray-50 border-gray-200",
  panelBg: "bg-white border-gray-200 shadow-sm",
  text: "text-gray-800", loginCard: "bg-white/95 border-gray-200",
  label: "text-gray-500", divider: "border-gray-200",
};

let googleIdentityScriptPromise = null;

const loadGoogleIdentityScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) return Promise.resolve();

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-identity="true"]');
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        const handleLoad = () => resolve();
        const handleError = () => reject(new Error("Failed to load Google sign-in script."));
        existing.addEventListener("load", handleLoad, { once: true });
        existing.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google sign-in script."));
      document.head.appendChild(script);
    });
  }

  return googleIdentityScriptPromise;
};

// ─── UTILS ───
const normEmail = (e) => (e || "").trim().toLowerCase();
const normName = (n) => (n || "").trim();

const validateEmail = (e) => {
  if (!e?.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) return "Enter a valid email.";
  return null;
};

const validateWorkspaceName = (n) => {
  if (!n) return "Workspace name is required.";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_]{2,28}[a-zA-Z0-9]$/.test(n)) return "3–30 chars, letters/numbers/underscores.";
  return null;
};

const validatePin = (p, isCreating) => {
  if (!p?.trim()) return "Password is required.";
  if (isCreating && p.trim().length < 8) return "Password must be at least 8 characters.";
  return null;
};

const getStoredSessionEmail = () => {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return normEmail(parsed?.userEmail || parsed?.email || "");
  } catch {
    return "";
  }
};

const getStoredWorkspaceEmail = () => {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(WORKSPACE_SESSION_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return normEmail(parsed?.userEmail || parsed?.email || "");
  } catch {
    return "";
  }
};

const getStoredProfileEmail = () => {
  if (typeof window === "undefined") return "";
  return normEmail(getStoredSessionEmail() || getStoredWorkspaceEmail() || localStorage.getItem(LAST_AUTH_EMAIL_KEY) || "");
};

const getProStorageKey = (baseKey, email) => {
  const safeEmail = normEmail(email || getStoredSessionEmail());
  return safeEmail ? `${baseKey}:${safeEmail}` : "";
};

const clearPersistedProState = (email) => {
  if (typeof window === "undefined") return;
  const activeKey = getProStorageKey(PRO_ACTIVE_KEY, email);
  const pinKey = getProStorageKey(PRO_PIN_KEY, email);
  const expiresKey = getProStorageKey(PRO_EXPIRES_KEY, email);
  if (activeKey) localStorage.removeItem(activeKey);
  if (pinKey) localStorage.removeItem(pinKey);
  if (expiresKey) localStorage.removeItem(expiresKey);
  localStorage.removeItem(PRO_ACTIVE_KEY);
  localStorage.removeItem(PRO_PIN_KEY);
  localStorage.removeItem(PRO_EXPIRES_KEY);
};

const persistProState = (email, { isPro, proExpiresAt = null, proPin = null } = {}) => {
  if (typeof window === "undefined") return;
  const activeKey = getProStorageKey(PRO_ACTIVE_KEY, email);
  const pinKey = getProStorageKey(PRO_PIN_KEY, email);
  const expiresKey = getProStorageKey(PRO_EXPIRES_KEY, email);
  if (!activeKey) return;
  if (isPro) {
    localStorage.setItem(activeKey, "true");
    if (proPin) localStorage.setItem(pinKey, proPin);
    else localStorage.removeItem(pinKey);
    if (proExpiresAt) localStorage.setItem(expiresKey, proExpiresAt);
    else localStorage.removeItem(expiresKey);
  } else {
    localStorage.removeItem(activeKey);
    localStorage.removeItem(pinKey);
    localStorage.removeItem(expiresKey);
  }
  localStorage.removeItem(PRO_ACTIVE_KEY);
  localStorage.removeItem(PRO_PIN_KEY);
  localStorage.removeItem(PRO_EXPIRES_KEY);
};

const getPersistedProState = (email) => {
  if (typeof window === "undefined") return { isPro: false, proExpiresAt: null };
  const safeEmail = normEmail(email || getStoredSessionEmail());
  const activeKey = getProStorageKey(PRO_ACTIVE_KEY, safeEmail);
  const expiresKey = getProStorageKey(PRO_EXPIRES_KEY, safeEmail);
  const legacyActive = localStorage.getItem(PRO_ACTIVE_KEY) === "true";
  const legacyExpiresAt = localStorage.getItem(PRO_EXPIRES_KEY);

  const persistedActive = activeKey ? localStorage.getItem(activeKey) === "true" : false;
  const persistedExpiresAt = expiresKey ? localStorage.getItem(expiresKey) : null;

  if (!persistedActive && !legacyActive) return { isPro: false, proExpiresAt: null };

  const effectiveExpiresAt = persistedExpiresAt || legacyExpiresAt || null;
  if (effectiveExpiresAt) {
    const expiresAtMs = new Date(effectiveExpiresAt).getTime();
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      clearPersistedProState(safeEmail);
      return { isPro: false, proExpiresAt: null };
    }
  }

  if (!persistedActive && legacyActive && safeEmail) {
    persistProState(safeEmail, { isPro: true, proExpiresAt: effectiveExpiresAt });
  }

  return { isPro: true, proExpiresAt: effectiveExpiresAt };
};


import ToastContainer from "./components/ui/ToastContainer.jsx";
import ActionBanner from "./components/ui/ActionBanner.jsx";
import LiveActionCard from "./components/ui/LiveActionCard.jsx";
import TaskCard from "./components/board/TaskCard.jsx";
import Column from "./components/board/Column.jsx";
import AddTaskModal from "./components/modals/AddTaskModal.jsx";
import ErrorModal from "./components/modals/ErrorModal.jsx";
import DeleteWorkspaceModal from "./components/modals/DeleteWorkspaceModal.jsx";
import AboutModal from "./components/modals/AboutModal.jsx";
import ContactModal from "./components/modals/ContactModal.jsx";
import ProModal from "./components/modals/ProModal.jsx";
import WorkspaceErrorModal from "./components/modals/WorkspaceErrorModal.jsx";
import HistoryPanel from "./components/panels/HistoryPanel.jsx";
import MembersPanel from "./components/panels/MembersPanel.jsx";
import OnlineUsersPanel from "./components/panels/OnlineUsersPanel.jsx";
import PinInput from "./components/ui/PinInput.jsx";
import QuotaBanner from "./components/ui/QuotaBanner.jsx";
import SearchBar from "./components/ui/SearchBar.jsx";
import Navbar from "./components/ui/Navbar.jsx";
import MobileMenu from "./components/ui/MobileMenu.jsx";
import TypingIndicator from "./components/ui/TypingIndicator.jsx";

const ErrorBoundary = ({ children }) => {
  return <ErrorModal>{children}</ErrorModal>;
};

const socket = io(
  SERVER_URL,
  {
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    timeout: 60000,
    transports: ["polling", "websocket"],
    forceNew: false,
  }
);

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const T    = theme === "light" ? TL : TD;
  const toggleTheme = useCallback(() => {
    setTheme(t => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem(THEME_KEY, n); return n; });
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document.body.style.backgroundColor = theme === "dark" ? "#07080B" : "#f9fafb";
  }, [theme]);

  const [userName, setUserName]       = useState("");
  const [workspaceDisplayName, setWorkspaceDisplayName] = useState("");
  const [userEmail, setUserEmail]     = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [authReady, setAuthReady]     = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");
  const [authStep, setAuthStep]       = useState("name");
  const [authMethod, setAuthMethod]   = useState("password");
  const [showPass, setShowPass]       = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [wsPin, setWsPin]               = useState("");
  const [wsPinConfirm, setWsPinConfirm] = useState("");
  const [showWsPin, setShowWsPin]       = useState(false);
  const [showActivatePro, setShowActivatePro] = useState(false);
  const [activatePinInput, setActivatePinInput] = useState("");
  const [activateError, setActivateError] = useState("");
  const [activateLoading, setActivateLoading] = useState(false);
  const [projectName, setProjectName]   = useState("");
  const [view, setView]                 = useState("start");
  const [workspaceStepLoading, setWorkspaceStepLoading] = useState(false);
    const persistedProState = useMemo(() => getPersistedProState(getStoredProfileEmail()), []);
  const [isPro, setIsPro]               = useState(() => persistedProState.isPro);
  const [proHydrating, setProHydrating] = useState(() => localStorage.getItem(WORKSPACE_SESSION_KEY) !== null);

  const [isJoined, setIsJoined]       = useState(() => {
    const activeSession = localStorage.getItem(WORKSPACE_SESSION_KEY);
    return activeSession !== null;
  });
  const [tasks, setTasks]             = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [members, setMembers]         = useState([]);
  const [history, setHistory]         = useState([]);
  const [role, setRole]               = useState("member");
  const [error, setError]             = useState("");
  const [userTaskCount, setUserTaskCount] = useState(0);
  const [userResetDate, setUserResetDate] = useState(null);
  const [proExpiresAt, setProExpiresAt]   = useState(() => persistedProState.proExpiresAt);

  const [showAdd, setShowAdd]               = useState(false);
  const [showHistory, setShowHistory]       = useState(false);
  const [showMembers, setShowMembers]       = useState(false);
  const [showProModal, setShowProModal]     = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showAbout, setShowAbout]           = useState(false);
  const [showContact, setShowContact]       = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [profileHydrating, setProfileHydrating] = useState(() => {
    return localStorage.getItem(WORKSPACE_SESSION_KEY) !== null;
  });
  const [activeTask, setActiveTask]         = useState(null);
  const [toasts, setToasts]                 = useState([]);
  const [, setSyncPulse]           = useState(false);

  const validMembers = useMemo(() => {
    return (Array.isArray(members) ? members : []).filter((member) => {
      const email = typeof member === "string" ? member : member?.email;
      return email && typeof email === "string" && email.includes("@") && !email.startsWith("AAAAA");
    });
  }, [members]);

  const displayMembers = useMemo(() => {
    return validMembers.map((member) => {
      const email = typeof member === "string" ? member : member?.email;
      const explicitName = typeof member === "string" ? "" : String(member?.name || member?.displayName || "").trim();
      const fallbackName = typeof email === "string" && email.includes("@") ? email.split("@")[0] : "";
      return {
        ...(typeof member === "object" && member !== null ? member : {}),
        email: typeof email === "string" ? email : "",
        name: explicitName || fallbackName,
        displayName: explicitName || fallbackName,
      };
    });
  }, [validMembers]);

  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, input: "" });
  const [searchQ, setSearchQ]               = useState("");
  const [typers, setTypers]                 = useState([]);
  const [taskAddedPulse, setTaskAddedPulse] = useState(false);
  const [autoJoining, setAutoJoining]       = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("sb_sound_enabled") !== "0");
  const soundEnabledRef = useRef(soundEnabled);
  const audioCtxRef = useRef(null);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { localStorage.setItem("sb_sound_enabled", soundEnabled ? "1" : "0"); }, [soundEnabled]);
  const [boardHydrating, setBoardHydrating]   = useState(false);
  const boardHydrateTimerRef = useRef(null);
  const finishBoardHydrationRef = useRef(() => {});

  const overlayIsActive = showAdd || showHistory || showMembers || showProModal || showOnlineUsers || showAbout || showContact || showMobileMenu || deleteConfirmation.show;

  // Mobile-only scroll locking designed for iOS Safari dynamic viewports
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return undefined;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    if (overlayIsActive) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = previousHtmlOverflow || "";
      document.body.style.overflow = previousBodyOverflow || "";
    }

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [overlayIsActive]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!isJoined) return undefined;

    document.documentElement.classList.add("workspace-scrollbar-hide");
    document.body.classList.add("workspace-scrollbar-hide");

    const noticeDelay = 3000;
    let timerId = null;
    const hideNowHandler = () => setShowOfflineNotice(false);

    const triggerNotice = () => {
      setShowOfflineNotice(true);
      if (timerId) window.clearTimeout(timerId);
      timerId = window.setTimeout(() => setShowOfflineNotice(false), noticeDelay);
    };

    if (!window.navigator.onLine) {
      triggerNotice();
    }

    window.addEventListener("offline", triggerNotice);
    window.addEventListener("online", hideNowHandler);

    return () => {
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener("offline", triggerNotice);
      window.removeEventListener("online", hideNowHandler);
      document.documentElement.classList.remove("workspace-scrollbar-hide");
      document.body.classList.remove("workspace-scrollbar-hide");
    };
  }, [isJoined]);

  finishBoardHydrationRef.current = () => {
    if (boardHydrateTimerRef.current) clearTimeout(boardHydrateTimerRef.current);
    boardHydrateTimerRef.current = setTimeout(() => {
      setBoardHydrating(false);
      boardHydrateTimerRef.current = null;
    }, 380);
  };

  const [actionBanner, setActionBanner]     = useState(null);
  const [liveAction, setLiveAction]         = useState(null);
  const [wsErrorType, setWsErrorType]       = useState(null);
   const [handleStatus, setHandleStatus]     = useState(null);
  const [wsErrorName, setWsErrorName]       = useState("");
  const [wsUnlockAt, setWsUnlockAt]         = useState(null);

  const isProRef    = useRef(isPro);
  const effectiveIsProRef = useRef(isPro);
  const userNameRef = useRef(userName);
  const workspaceNameRef = useRef(workspaceName);
  const userEmailRef = useRef(userEmail);
  const authMethodRef = useRef(authMethod);
  const googleButtonRef = useRef(null);
  const pendingGoogleAuthTokenRef = useRef("");
  
  const notificationQueueRef = useRef([]);
  const notificationProcessingRef = useRef(false);
  const recentNotifSignaturesRef = useRef([]);

  const activateSubmittingRef = useRef(false);
  useEffect(() => { isProRef.current    = isPro;    }, [isPro]);
  useEffect(() => { effectiveIsProRef.current = isPro || proHydrating; }, [isPro, proHydrating]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { workspaceNameRef.current = workspaceName; }, [workspaceName]);
  useEffect(() => { userEmailRef.current = userEmail; }, [userEmail]);
  useEffect(() => { authMethodRef.current = authMethod; }, [authMethod]);

  const enqueueNotification = (entry, isSelf = false) => {
    if (isSelf) return;
    try {
      const sig = `${(entry.action||"").toString().trim().toLowerCase()}|${(entry.taskTitle||"").toString().trim()}|${(entry.userName||"").toString().trim()}`;
      const now = Date.now();
      recentNotifSignaturesRef.current = recentNotifSignaturesRef.current.filter(x => now - x.ts < 1000);
      const dupInRecent = recentNotifSignaturesRef.current.some(x => x.sig === sig && now - x.ts < 500);
      const dupInQueue = notificationQueueRef.current.some(q => {
        const e = q.entry || {};
        const qs = `${(e.action||"").toString().trim().toLowerCase()}|${(e.taskTitle||"").toString().trim()}|${(e.userName||"").toString().trim()}`;
        return qs === sig;
      });
      if (dupInRecent || dupInQueue) return;
      notificationQueueRef.current.push({ entry, isSelf, sig, ts: now });
    } catch {
      notificationQueueRef.current.push({ entry, isSelf });
    }
    if (notificationProcessingRef.current) return;
    notificationProcessingRef.current = true;

    (async function processQueue() {
      while (notificationQueueRef.current.length) {
        const { entry: item, isSelf: self, sig } = notificationQueueRef.current.shift();
        const act = (item.action || "").toLowerCase();
        if (act.includes("created") || act.includes("added")) setActionBanner({ action: "TASK CREATED" });
        else if (act.includes("moved")) setActionBanner({ action: "TASK MOVED" });
        else if (act.includes("deleted") || act.includes("removed")) setActionBanner({ action: "TASK DELETED" });
        if (!self) {
          setLiveAction({ ...item, __uid: Date.now() });
          if (effectiveIsProRef.current && soundEnabledRef.current) playNotificationSound();
        }
        
        try { if (sig) recentNotifSignaturesRef.current.push({ sig, ts: Date.now() }); } catch {}
        await new Promise(r => setTimeout(r, 3000));
        setLiveAction(null);
        setActionBanner(null);
        await new Promise(r => setTimeout(r, 160));
      }
      notificationProcessingRef.current = false;
    })();
  };

  useEffect(() => {
    if (!authReady || !userEmail) return;
    const persisted = getPersistedProState(userEmail);
    setIsPro(persisted.isPro);
    setProExpiresAt(persisted.proExpiresAt);
  }, [authReady, userEmail]);

  // Touch sensor tuned specifically for iOS Safari drag operations
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    return pointerHits.length ? pointerHits : closestCorners(args);
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx && !audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const addToast = useCallback((msg, type = "sync") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  useEffect(() => {
    sessionStorage.removeItem("sb_workspace_pin");
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("sb_left_workspace") === "1") {
      sessionStorage.removeItem("sb_left_workspace");
      return;
    }

    const activeSession = localStorage.getItem(WORKSPACE_SESSION_KEY);
    if (activeSession) {
      try {
        setProfileHydrating(true);
        const s = JSON.parse(activeSession);
        if (s.workspaceName && s.userEmail && s.userName) {
          setWorkspaceName(s.workspaceName);
          setUserEmail(s.userEmail);
          setUserName(s.userName);
          setWorkspaceDisplayName(s.displayName || s.userName || "");
          if (s.projectName) setProjectName(s.projectName);
          if (s.role) setRole(s.role);
          if (s.tasks) setTasks(s.tasks);
          if (s.members) setMembers(s.members);
          if (s.history) setHistory(s.history);
          if (s.taskCount !== undefined) setUserTaskCount(s.taskCount);
          if (s.resetAt !== undefined) setUserResetDate(s.resetAt);
          setBoardHydrating(!(s.tasks && s.tasks.length > 0));

          (async () => {
            try {
              const response = await fetch(`${SERVER_URL}/api/user/profile?email=${encodeURIComponent(s.userEmail)}`, {
                credentials: "include",
              });
              if (response.ok) {
                const result = await response.json();
                const profile = result?.profile || null;
                const serverIsPro = !!profile?.isPro;
                const serverExpiresAt = profile?.proExpiresAt || null;
                setIsPro(prev => serverIsPro || prev);
                setProExpiresAt(prev => serverExpiresAt || prev || null);
                if (serverIsPro) {
                    persistProState(s.userEmail, { isPro: true, proExpiresAt: serverExpiresAt });
                } else {
                    clearPersistedProState(s.userEmail);
                }
              }
            } catch (profileErr) {
              console.warn("[profile hydrate] Failed to refresh profile:", profileErr?.message || profileErr);
            } finally {
              if (socket.connected) {
                setAutoJoining(true);
                socket.emit("rejoin_workspace", {
                  workspaceName: s.workspaceName,
                  userName: s.userName,
                  email: s.userEmail,
                });
              }

             setAuthReady(true);
              setProfileHydrating(false);
              setProHydrating(false);
            }
          })();
        } else {
          localStorage.removeItem(WORKSPACE_SESSION_KEY);
          setProfileHydrating(false);
        }
      } catch {
        localStorage.removeItem(WORKSPACE_SESSION_KEY);
        setProfileHydrating(false);
      }
    }

    const googleParams = new URLSearchParams(window.location.search);
    const googleToken = googleParams.get("google_auth_token");
    const googleError = googleParams.get("google_auth_error");
    if (googleToken) {
      pendingGoogleAuthTokenRef.current = googleToken;
      googleParams.delete("google_auth_token");
      googleParams.delete("google_auth_error");
      const cleanUrl = `${window.location.pathname}${googleParams.toString() ? `?${googleParams.toString()}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, document.title, cleanUrl);
      setAuthMethod("google");
      setAuthLoading(true);
      setAuthError("");
      if (socket.connected) {
        socket.emit("auth_google_redirect_token", { token: googleToken });
      }
    } else if (googleError) {
      googleParams.delete("google_auth_token");
      googleParams.delete("google_auth_error");
      const cleanUrl = `${window.location.pathname}${googleParams.toString() ? `?${googleParams.toString()}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, document.title, cleanUrl);
      setAuthError(decodeURIComponent(googleError));
    }

    const us = localStorage.getItem(SESSION_KEY);
    if (us) {
      try {
        const s = JSON.parse(us);
        if (s.userEmail) setUserEmail(s.userEmail);
        else localStorage.removeItem(SESSION_KEY);
      } catch { localStorage.removeItem(SESSION_KEY); }
    }
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      if (!isJoined) { setError(""); setAuthError(""); }

      if (pendingGoogleAuthTokenRef.current) {
        const token = pendingGoogleAuthTokenRef.current;
        pendingGoogleAuthTokenRef.current = "";
        socket.emit("auth_google_redirect_token", { token });
      }

      const activeSession = localStorage.getItem(WORKSPACE_SESSION_KEY);
      if (activeSession) {
        try {
          const s = JSON.parse(activeSession);
          if (s.workspaceName && s.userEmail && s.userName) {
            setBoardHydrating(true);
            socket.emit("rejoin_workspace", {
              workspaceName: s.workspaceName,
              userName: s.userName,
              email: s.userEmail,
            });
          }
        } catch {}
      }
    });

    socket.on("auth_success", (data) => {
      setAuthLoading(false); setAuthError(""); setAuthMethod("password"); setAutoJoining(false); pendingGoogleAuthTokenRef.current = "";
      const serverIsPro = !!data.isPro;
      const serverProExpiresAt = data.proExpiresAt || null;
      localStorage.setItem(LAST_AUTH_EMAIL_KEY, normEmail(data.email || userEmailRef.current || userEmail || ""));
      setIsPro(prev => serverIsPro || prev);
      setUserTaskCount(data.taskCount || 0);
      setUserResetDate(data.resetAt || null);
      setProExpiresAt(prev => serverProExpiresAt || prev || null);
      if (serverIsPro) {
        persistProState(data.email || userEmailRef.current, { isPro: true, proExpiresAt: serverProExpiresAt });
      } else {
        clearPersistedProState(data.email || userEmailRef.current);
      }
      const pendingName = localStorage.getItem("sb_pending_name");
      setUserName(userNameRef.current?.trim() || pendingName || data.name || "");
      localStorage.removeItem("sb_pending_name");
      setUserEmail(data.email);
      setAuthReady(true);
    });

    socket.on("auth_error", (msg) => {
      setAuthLoading(false); setAutoJoining(false);
      pendingGoogleAuthTokenRef.current = "";
      setAuthError(msg || "Authentication failed.");
      setAuthStep(authMethodRef.current === "google" ? "email" : "name");
      setAuthMethod("password");
    });

    socket.on("auth_google_error", (msg) => {
      setAuthLoading(false); setAutoJoining(false);
      pendingGoogleAuthTokenRef.current = "";
      setAuthError(msg || "Google sign-in failed.");
      setAuthStep("email");
      setAuthMethod("google");
    });

    socket.on("task_count_update", ({ taskCount, resetAt }) => {
      setUserTaskCount(taskCount); setUserResetDate(resetAt);
    });

    socket.on("task_limit_reached", ({ taskCount, resetAt }) => {
      setUserTaskCount(taskCount || 0);
      setUserResetDate(resetAt || null);
      if (!isProRef.current) setShowProModal(true);
      addToast("Monthly task limit reached", "warn");
    });

    socket.on("pro_activated", ({ taskCount, resetAt, proExpiresAt: exp }) => {
      setIsPro(true); setUserTaskCount(taskCount || 0); setUserResetDate(resetAt || null);
      setProExpiresAt(exp || null);
      persistProState(userEmailRef.current, { isPro: true, proExpiresAt: exp || null });
      addToast("Pro activated!", "success");
      setShowActivatePro(false);
      setActivatePinInput("");
      setActivateError("");
      setActivateLoading(false);
      activateSubmittingRef.current = false;
    });

    socket.on("pro_activate_error", (msg) => {
      setActivateLoading(false);
      setActivateError(msg || "Invalid or expired PIN.");
      addToast(msg || "Pro activation failed", "warn");
      activateSubmittingRef.current = false;
    });

    socket.on("pro_deactivated", () => {
      setIsPro(false);
      setProExpiresAt(null);
      clearPersistedProState(userEmailRef.current);
      addToast("Pro deactivated", "warn");
    });

       socket.on("load_workspace", ({ tasks: t, projectName: pn, role: r, history: h, members: m, taskCount, resetAt, isPro: sp, proExpiresAt: exp }) => {
      setProHydrating(false);
      setTasks(t || []); setProjectName(pn); setIsJoined(true); setAutoJoining(false);
      finishBoardHydrationRef.current();
      setRole(r || "member"); setHistory(h || []); setMembers(m || []);
      setError(""); setWsErrorType(null);
      localStorage.setItem(LAST_AUTH_EMAIL_KEY, normEmail(userEmailRef.current || ""));
      if (taskCount !== undefined) setUserTaskCount(taskCount);
      if (resetAt !== undefined) setUserResetDate(resetAt);
      const serverIsPro = !!sp;
      const serverProExpiresAt = exp || null;
      const resolvedIsPro = serverIsPro || isProRef.current;
      setIsPro(resolvedIsPro);
      setProExpiresAt(prev => serverProExpiresAt || prev || null);
      if (resolvedIsPro) {
        persistProState(userEmailRef.current, { isPro: true, proExpiresAt: serverProExpiresAt || proExpiresAtRef?.current || null });
      } else {
        clearPersistedProState(userEmailRef.current);
      }

      localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify({
        workspaceName: workspaceNameRef.current,
        userName: userNameRef.current,
        userEmail: userEmailRef.current,
        projectName: pn,
        role: r,
        tasks: t || [],
        members: m || [],
        history: h || [],
        taskCount: taskCount || 0,
        resetAt: resetAt || null,
        isPro: serverIsPro,
        proExpiresAt: serverProExpiresAt,
        joinedAt: new Date().toISOString()
      }));
    });

    socket.on("receive_update", ({ tasks: updated, history: h }) => {
      setTasks(updated || []);
      finishBoardHydrationRef.current();
      if (h) setHistory(h);
      setSyncPulse(true); setTimeout(() => setSyncPulse(false), 1200);
      if (h && h[0] && effectiveIsProRef.current) {
        const latest = h[0];
        const latestUser = (latest.userName || "").toString().trim().toLowerCase();
        const me = (userNameRef.current || "").toString().trim().toLowerCase();
        const isSelf = latestUser && me && latestUser === me;
        enqueueNotification(latest, isSelf);
      } else if (!h || !h[0]) {
        addToast("Board synced", "sync");
      }
    });

    socket.on("users_update", (users) => {
      const uniqueUsersMap = new Map();
      users.forEach(user => {
        const key = user.email || user.name;
        if (!key) return;
        if (!uniqueUsersMap.has(key)) {
          uniqueUsersMap.set(key, { ...user });
        }
      });
      setOnlineUsers(Array.from(uniqueUsersMap.values()));
    });

    socket.on("members_update", setMembers);

    socket.on("history_update", (h) => {
      setHistory(h || []);
      const latest = h && h[0];
      if (!latest || !effectiveIsProRef.current) return;
      const latestUser = (latest.userName || "").toString().trim().toLowerCase();
      const me = (userNameRef.current || "").toString().trim().toLowerCase();
      const isSelf = latestUser && me && latestUser === me;
      enqueueNotification(latest, isSelf);
    });

    socket.on("history_cleared", () => {
      setHistory([]);
    });

    socket.on("error_msg", (msg) => {
      setAutoJoining(false);
      const lower = (msg || "").toLowerCase();
      if (lower.includes("not found") || lower.includes("does not exist") || lower.includes("workspace not found")) {
        localStorage.removeItem(SESSION_KEY); localStorage.removeItem(WORKSPACE_SESSION_KEY);
        setWsErrorName(workspaceName); setWsErrorType("notFound");
      } else if (lower.includes("wrong pin") || lower.includes("incorrect pin") || lower.includes("wrong password") || lower.includes("invalid pin") || lower.includes("different pin")) {
        localStorage.removeItem(SESSION_KEY); localStorage.removeItem(WORKSPACE_SESSION_KEY);
        setWsErrorName(workspaceName); setWsErrorType("wrongPin");
      } else {
        setError(msg);
      }
    });

    socket.on("join_locked_out", ({ unlockAt } = {}) => {
      setAutoJoining(false);
      setWorkspaceStepLoading(false);
      setBoardHydrating(false);
      localStorage.removeItem(SESSION_KEY); localStorage.removeItem(WORKSPACE_SESSION_KEY);
      setWsErrorName(workspaceName);
      setWsUnlockAt(unlockAt);
      setWsErrorType("lockedOut");
    });

    socket.on("permission_denied", (msg) => addToast(msg || "Permission denied", "warn"));

    socket.on("kicked", (msg) => {
      localStorage.removeItem(SESSION_KEY);
      setError(msg || "You were removed from this workspace.");
      setTimeout(() => window.location.reload(), 2500);
    });

    socket.on("typing_update", ({ name, role: r, context }) => {
      setTypers(prev => [...prev.filter(t => t.name !== name), { name, role: r, context }]);
    });

    socket.on("typing_clear", ({ name }) => setTypers(prev => prev.filter(t => t.name !== name)));

    socket.on("reconnect", () => {
      const ws = localStorage.getItem(WORKSPACE_SESSION_KEY);
      if (ws) {
        try {
          const s = JSON.parse(ws);
          socket.emit("rejoin_workspace", { workspaceName: s.workspaceName, userName: s.userName, email: s.userEmail });
        } catch {}
      }
    });

    return () => {
      if (boardHydrateTimerRef.current) clearTimeout(boardHydrateTimerRef.current);
      const socketEvents = [
        "connect", "auth_success", "auth_error", "auth_google_error",
        "task_count_update", "task_limit_reached", "pro_activated", "load_workspace",
        "receive_update", "users_update", "members_update", "history_update",
        "history_cleared", "pro_activate_error", "pro_deactivated", "pro_deactivate_error",
        "error_msg", "permission_denied", "kicked", "typing_update", "typing_clear", "reconnect",
      ];

      socketEvents.forEach(ev => socket.off(ev));
    };
  }, [addToast, workspaceName]);

  useEffect(() => {
    if (authReady || authStep !== "email" || !GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    const initGoogle = async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "redirect",
          login_uri: `${SERVER_URL}/auth/google/callback`,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = "";
          const btnWidth = Math.floor(googleButtonRef.current.offsetWidth) || 300;
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "filled_blue",
            size: "large",
            shape: "rectangular",
            width: btnWidth,
            locale: "en",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setAuthError(err?.message || "Google sign-in failed to load.");
        }
      }
    };

    initGoogle();

    return () => {
      cancelled = true;
    };
  }, [authReady, authStep]);

  const handleNameNext = useCallback(() => {
    if (!userName.trim()) return setAuthError("Your name is required.");
    localStorage.setItem("sb_pending_name", userName.trim());
    setAuthError(""); setAuthMethod("password"); setAuthStep("email");
  }, [userName]);

  const openWorkspaceStep = useCallback((nextView) => {
    setWorkspaceStepLoading(true);
    setError("");
    setTimeout(() => {
      setView(nextView);
      setWorkspaceStepLoading(false);
    }, 450);
  }, []);

  const handleAuth = useCallback(() => {
    const emailErr = validateEmail(userEmail);
    if (emailErr) return setAuthError(emailErr);
    if (!userPassword.trim()) return setAuthError("Password is required.");
    setAuthMethod("password"); setAuthLoading(true); setAuthError("");
    socket.emit("auth_user", { email: userEmail.trim(), password: userPassword.trim(), name: userName.trim() });
  }, [userEmail, userPassword, userName]);

  const handleAction = useCallback(() => {
    if (!authReady) return setError("Please sign in first.");
    const nameErr = validateWorkspaceName(workspaceName);
    if (nameErr) return setError(nameErr);
    const isCreating = view === "create";
    const pinErr = validatePin(wsPin, isCreating);
    if (pinErr) return setError(pinErr);
    if (isCreating && wsPin !== wsPinConfirm) return setError("Passwords do not match.");
    if (isCreating && !projectName.trim()) return setError("Project title is required.");
    const customName = userName.trim();
    localStorage.setItem("sb_user_name", customName);
    setWorkspaceDisplayName(customName);
    setWorkspaceStepLoading(true);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userName: customName, displayName: customName, userEmail, workspaceName, projectName }));
    setBoardHydrating(true);
    socket.emit("join_workspace", {
      workspaceName: workspaceName.toLowerCase(),
      password: wsPin, projectName, userName: customName, name: customName,
      email: userEmail, isCreating,
    });
  }, [authReady, workspaceName, wsPin, view, projectName, userName, userEmail]);

  useEffect(() => {
    if (view !== "create" || workspaceName.length < 3) {
      setHandleStatus(null);
      return;
    }
    setHandleStatus("checking");
    const t = setTimeout(() => {
      socket.emit("check_workspace_handle", { workspaceName: workspaceName.toLowerCase() });
    }, 400);
    return () => clearTimeout(t);
  }, [workspaceName, view]);

  useEffect(() => {
    const onHandleStatus = ({ workspaceName: name, taken }) => {
      if (name !== workspaceName.toLowerCase()) return;
      setHandleStatus(taken ? "taken" : "available");
    };
    socket.on("workspace_handle_status", onHandleStatus);
    return () => socket.off("workspace_handle_status", onHandleStatus);
  }, [workspaceName]);

  const handleLeave = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(WORKSPACE_SESSION_KEY);
    sessionStorage.removeItem("sb_workspace_pin");

    if (workspaceName) {
      socket.emit("leave_room", { workspaceName, email: userEmail });
    }

    if (boardHydrateTimerRef.current) clearTimeout(boardHydrateTimerRef.current);

    setTasks([]);
    setOnlineUsers([]);
    setMembers([]);
    setHistory([]);
    setShowHistory(false);
    setShowMembers(false);
    setShowOnlineUsers(false);
    setShowAdd(false);
    setActiveTask(null);
    setSearchQ("");
    setAutoJoining(false);
    setBoardHydrating(false);
    setAuthReady(false);
    setAuthStep("name");
    setView("start");
    setIsJoined(false);
    setWorkspaceName("");
    setWsPin("");
    setWsPinConfirm("");
    setProjectName("");
    setError("");
    setWsErrorType(null);
  };

  const handleDeleteWorkspace = useCallback(() => {
    setDeleteConfirmation({ show: true, input: "" });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmation.input.trim() !== workspaceName) {
      addToast("Workspace name doesn't match", "warn");
      return;
    }
    setDeleteConfirmation({ show: false, input: "" });
    socket.emit("delete_workspace", { workspaceName, email: userEmail });
    socket.once("workspace_deleted_success", () => {
      addToast("Workspace deleted", "delete");
      setTimeout(handleLeave, 1000);
    });
  }, [deleteConfirmation.input, workspaceName, userEmail, addToast]);

  const handleDragStart = ({ active }) => {
    if (role === "viewer") return;
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over || (role !== "member" && role !== "admin")) return;
    let newStatus = over?.data?.current?.columnId;
    if (!newStatus && typeof over.id === "string" && over.id.startsWith("column-")) {
      newStatus = over.id.replace("column-", "");
    }
    if (!newStatus) newStatus = COLUMNS.find(c => c.id === over.id)?.id;
    if (!newStatus) newStatus = tasks.find(t => t.id === over.id)?.status;
    if (!newStatus) return;
    const task = tasks.find(t => t.id === active.id);
    if (!task || task.status === newStatus) return;
    const colLabel = COLUMNS.find(c => c.id === newStatus)?.label || newStatus;
    const completedMeta = newStatus === "done"
      ? { completedAt: new Date().toISOString(), completedBy: userName }
      : { completedAt: null, completedBy: null };
    const updated = tasks.map(t => t.id === active.id
      ? { ...t, status: newStatus, log: `Moved by ${userName}`, ...completedMeta }
      : t
    );
    setTasks(updated);
    socket.emit("update_tasks", { workspaceName, updatedTasks: updated, actionMeta: { action: "move_task", taskTitle: task.title, targetStatus: colLabel } });
    setActionBanner({ action: "TASK MOVED" });
  };

  const displayName = workspaceDisplayName || userName;

   const addTask = useCallback((taskData) => {
    const { title, description, priority, dueDate, image } = taskData;
    const limit = (isPro || proHydrating) ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
    if (userTaskCount >= limit) { setShowProModal(true); return; }
    const taskId = `task-${Date.now()}`;
    const safeCreatorName = displayName;
    const creatorInitials = safeCreatorName
      .split(" ")
      .filter(Boolean)
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newTask = {
      id: taskId,
      title,
      description,
      priority,
      status: "todo",
      log: `Added by ${safeCreatorName}`,
      addedBy: safeCreatorName,
      addedByRole: role,
      creatorName: safeCreatorName,
      creatorInitials,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null,
      image: image || null,
      completedAt: null,
      completedBy: null,
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    setTaskAddedPulse(true); setTimeout(() => setTaskAddedPulse(false), 1500);
    socket.emit("update_tasks", { workspaceName, updatedTasks: updated, actionMeta: { action: "create_task", taskTitle: title }, newTaskId: taskId });
    setActionBanner({ action: "TASK CREATED" });
  }, [tasks, isPro, userTaskCount, displayName, role, workspaceName]);

  const deleteTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    socket.emit("update_tasks", { workspaceName, updatedTasks: updated, actionMeta: { action: "delete_task", taskTitle: task?.title || "" } });
    setActionBanner({ action: "TASK DELETED" });
  }, [tasks, workspaceName]);

     const tryOpenAdd = useCallback(() => {
    const limit = (isPro || proHydrating) ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
    if (userTaskCount >= limit) { setShowProModal(true); return; }
    if (role !== "member" && role !== "admin") { addToast("Only members/admins can add tasks", "warn"); return; }
    setShowAdd(true);
  }, [isPro, proHydrating, userTaskCount, role, addToast]);

  const handleProActivated = useCallback((proPin) => {
    setIsPro(true);
    setShowProModal(false);
    persistProState(userEmailRef.current, { isPro: true, proPin, proExpiresAt: proExpiresAt || null });
    socket.emit("set_user_pro", { email: userEmail, proPin });
  }, [userEmail, proExpiresAt]);

  const submitActivatePin = useCallback(() => {
    const pin = activatePinInput.trim();
    if (!pin || activateSubmittingRef.current) return;
    activateSubmittingRef.current = true;
    setActivateLoading(true);
    setActivateError("");
    socket.emit("set_user_pro", { email: userEmail, proPin: pin });
  }, [activatePinInput, userEmail]);

  const openUpgradeProModal = useCallback(() => {
    setShowProModal(true);
  }, []);

  const filteredTasks = useMemo(() => {
    if (!searchQ.trim()) return tasks;
    const q = searchQ.toLowerCase();
    return tasks.filter(t => t.title?.toLowerCase().includes(q) || t.addedBy?.toLowerCase().includes(q));
  }, [tasks, searchQ]);

  const done     = tasks.filter(t => t.status === "done").length;
  const total    = tasks.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const otherTypers = typers.filter(t => t.name !== displayName);
  const effectiveIsPro = isPro || proHydrating;
  const limit = effectiveIsPro ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
  const proExpiryLabel = useMemo(() => {
    if (!proExpiresAt) return "";
    const msLeft = new Date(proExpiresAt).getTime() - Date.now();
    const reminderWindowMs = 5 * 24 * 60 * 60 * 1000;
    if (msLeft <= 0 || msLeft > reminderWindowMs) return "";
    return new Date(proExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [proExpiresAt]);

  if ((autoJoining && !isJoined) || authLoading) {
    return (
      <div className={`min-h-screen ${T.bg} flex items-center justify-center`}>
        
        <div className="relative z-10 w-full max-w-sm px-4">
          <style>{`@keyframes sbDotPulse { 0%, 80%, 100% { transform: scale(0.55); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }`}</style>
          <div className={`rounded-3xl shadow-2xl px-6 py-5 text-center backdrop-blur-xl ${T.loginCard}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${T.label}`}>Opening workspace</p>
            <p className={`text-sm mt-2 ${T.text}`}>Syncing your board and loading your session.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" style={{ animation: "sbDotPulse 1.2s ease-in-out infinite", animationDelay: "0ms" }} />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ animation: "sbDotPulse 1.2s ease-in-out infinite", animationDelay: "160ms" }} />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" style={{ animation: "sbDotPulse 1.2s ease-in-out infinite", animationDelay: "320ms" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileHydrating && isJoined) {
    return (
      <div className={`min-h-screen ${T.bg} flex items-center justify-center`}>
        
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-[11px] font-black ${T.label} uppercase tracking-widest`}>Restoring profile…</p>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className={`relative min-h-screen ${T.bg} font-sans ${T.text} flex items-center justify-center overflow-x-hidden p-4`}>
        

        <button onClick={toggleTheme}
          className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-widest
            ${theme === "dark" ? "bg-slate-900/40 border-slate-700/50 text-slate-300 hover:border-slate-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400"}`}
        >
          {theme === "dark" ? <><Sun size={11} className="text-yellow-400"/><span className="text-yellow-400">Light</span></> : <><Moon size={11}/><span>Dark</span></>}
        </button>

        <AnimatePresence>
          {error && <ErrorModal key="error-modal" message={error} theme={theme} onClose={() => { setError(""); setView("start"); setWorkspaceName(""); setWsPin(""); }} />}
          {wsErrorType && <WorkspaceErrorModal key="ws-error-modal" type={wsErrorType} wsName={wsErrorName} unlockAt={wsUnlockAt} theme={theme} onClose={() => { setWsErrorType(null); setWsUnlockAt(null); setWsPin(""); setWsPinConfirm(""); }} />}
          {showAbout && <AboutModal key="about-modal" onClose={() => setShowAbout(false)} theme={theme} />}
          {showContact && (
            <ContactModal
              key="contact-modal"
              onClose={() => setShowContact(false)}
              theme={theme}
              serverUrl={SERVER_URL}
              context={{
                workspaceName,
                userName,
                userEmail,
                role,
              }}
            />
          )}
          {showProModal && <ProModal key="pro-modal"  isPro={effectiveIsPro} onClose={() => setShowProModal(false)} onActivatePin={handleProActivated} userEmail={userEmail} theme={theme} proExpiresAt={proExpiresAt} />}
        </AnimatePresence>

        <div className={`relative z-10 w-full max-w-md`}>
          <div className={`absolute -inset-2 ${theme === "light" ? "bg-blue-100/60" : "bg-slate-800/15"} rounded-3xl blur-xl`} />
          <div className={`relative ${T.loginCard} backdrop-blur-xl p-8 rounded-2xl border shadow-2xl`}>

            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border ${theme === "light" ? "bg-blue-100 border-blue-300" : "bg-blue-600/15 border-blue-500/25"}`}>
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                </svg>
              </div>
              <h1 className={`text-2xl font-semibold ${T.text} tracking-tight`}>SyncBoard</h1>
              <p className={`text-[10px] ${T.label} uppercase tracking-[0.45em] mt-1 font-black`}>Team Task Manager</p>
            </div>


           

            {!authReady && authStep === "name" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-500/15 text-blue-400"}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>1</div>
                  <div>
                    <p className={`text-[13px] font-semibold uppercase tracking-wide ${T.text}`}>Your Name</p>
                    <p className={`text-[11px] ${T.label} mt-0.5`}>What should we call you?</p>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-semibold ${T.label} uppercase tracking-widest mb-2 block`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Full Name</label>
                  <input type="text" autoComplete="name" placeholder="Enter your name" autoFocus
                    className={`w-full p-3.5 rounded-xl border border-blue-500 outline-none transition-all text-sm ${theme === "light" ? "bg-white text-gray-800" : "bg-slate-800/80 text-slate-100"} placeholder:text-slate-500`}
                    style={{ boxShadow: "0 0 0 3px rgba(110,155,244,0.14)" }}
                    value={userName} onChange={e => { setUserName(e.target.value); setAuthError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleNameNext()}
                  />
                </div>
                {authError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle size={13} className="text-red-400 shrink-0" />
                    <p className="text-[10px] text-red-400 font-bold">{authError}</p>
                  </div>
                )}
                <button onClick={handleNameNext} disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3.5 rounded-full font-bold text-[13px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                  Continue<span aria-hidden="true">→</span>
                </button>
              </div>
            )}

            {!authReady && authStep === "email" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-500/15 text-blue-400"}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>2</div>
                  <div>
                    <p className={`text-[13px] font-semibold uppercase tracking-wide ${T.text}`}>Login</p>
                    <p className={`text-[11px] ${T.label} mt-0.5`}>Enter your credentials to access SyncBoard</p>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-semibold ${T.label} uppercase tracking-widest mb-2 block`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Email Address</label>
                  <input type="email" autoComplete="email" placeholder="e.g. ahmed@gmail.com" autoFocus
                    className={`w-full p-3.5 rounded-xl border outline-none transition-all text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-800 focus:border-blue-500" : "bg-slate-800/80 border-slate-700 text-slate-100 focus:border-blue-500"} placeholder:text-slate-500`}
                    value={userEmail} onChange={e => { setUserEmail(e.target.value); setAuthError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleAuth()}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold ${T.label} uppercase tracking-widest mb-2 block`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} autoComplete="current-password" placeholder="Your password"
                      className={`w-full p-3.5 pr-11 rounded-xl border outline-none transition-all text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-800 focus:border-blue-500" : "bg-slate-800/80 border-slate-700 text-slate-100 focus:border-blue-500"} placeholder:text-slate-500`}
                      value={userPassword} onChange={e => { setUserPassword(e.target.value); setAuthError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleAuth()}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer">
                      {showPass ? <Eye size={16}/> : <Eye size={16} className="opacity-50"/>}
                    </button>
                  </div>
                </div>
                {authError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle size={13} className="text-red-400 shrink-0" />
                    <p className="text-[10px] text-red-400 font-bold">{authError}</p>
                  </div>
                )}
                <button onClick={() => { setAuthStep("name"); setAuthError(""); setAuthMethod("password"); }}
                  className={`inline-flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-lg border transition cursor-pointer ${theme === "light" ? "text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100" : "text-slate-300 border-slate-700 bg-slate-800/70 hover:bg-slate-700/70"}`}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <ArrowLeft size={12} />
                  Back
                </button>
                <button onClick={handleAuth} disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer">
                  {authLoading ? "Loading…" : "Login"}
                </button>
                <div className={`flex items-center gap-3 py-1 ${theme === "light" ? "text-gray-300" : "text-slate-700"}`}>
                  <div className="flex-1 h-px bg-current opacity-50" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>or</span>
                  <div className="flex-1 h-px bg-current opacity-50" />
                </div>
                <div
                  ref={googleButtonRef}
                  className="w-full overflow-hidden flex justify-center"
                />
                <button onClick={() => { setAuthStep("name"); setAuthError(""); }}
                  className={`w-full text-[11px] font-medium p-2 rounded-lg transition cursor-pointer ${theme === "light" ? "text-gray-600 hover:bg-gray-100" : "text-slate-400 hover:bg-slate-800"}`}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  ← Back
                </button>
              </div>
            )}

            {authReady && (
              <div className="space-y-3">
                {view === "start" ? (
                  <div className="space-y-0">
                    <div className="flex items-start gap-3 mb-6 text-left">
                      <div className={`w-8 h-8 rounded-full ${theme === "light" ? "bg-blue-600" : "bg-blue-500"} text-white flex items-center justify-center font-semibold text-sm shrink-0`}>3</div>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>WORKSPACE</p>
                        <p className={`text-[10px] ${T.label} mt-0.5`}>Create new or join existing.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => openWorkspaceStep("create")}
                        style={{ background: "linear-gradient(to bottom right, #5A82D6, #4A6BB3)" }}
                        className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border border-blue-500/25 font-semibold text-sm text-white transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-500/30">
                        <Plus size={18}/><span>New Workspace</span>
                      </button>
                      <button onClick={() => openWorkspaceStep("join")}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 cursor-pointer backdrop-blur-sm border-2
                          ${theme === "light" ? "bg-white border-blue-600 text-blue-600 hover:bg-blue-50" : "bg-slate-800/50 border-blue-500 text-blue-300 hover:bg-slate-700/60"}`}>
                        <ChevronRight size={18}/><span>Join Workspace</span>
                      </button>
                    </div>

                    <div className={`flex items-center gap-3 my-5 ${theme === "light" ? "text-gray-300" : "text-slate-700"}`}>
                      <div className="flex-1 h-px bg-current" />
                      <span className="text-xs font-black uppercase tracking-wider opacity-60">Account</span>
                      <div className="flex-1 h-px bg-current" />
                    </div>

                    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${theme === "light" ? "bg-white border-gray-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"}`}>
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 ${theme === "light" ? "border-white" : "border-slate-800"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${theme === "light" ? "text-gray-800" : "text-slate-100"}`}>{userName}</p>
                        <p className={`text-[11px] font-medium ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>Online</p>
                      </div>
                      <button onClick={() => { setAuthReady(false); setAuthError(""); setAuthStep("name"); }}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition cursor-pointer shrink-0 ${theme === "light" ? "border-gray-300 text-gray-600 hover:bg-gray-50" : "border-slate-600 text-slate-300 hover:bg-slate-700/60"}`}>Switch</button>
                    </div>

                    <button onClick={() => effectiveIsPro ? setShowProModal(true) : setShowActivatePro(true)}
                      style={effectiveIsPro ? undefined : { background: theme === "light" ? "linear-gradient(to right, #FBBF24, #F59E0B)" : "linear-gradient(to right, #F59E0B, #D97706)" }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer mt-4 border
                        ${effectiveIsPro
                          ? `${theme === "light" ? "bg-white border-amber-300 shadow-sm" : "bg-slate-800/50 border-amber-500/30"}`
                          : `${theme === "light" ? "border-amber-400 shadow-lg shadow-amber-500/25" : "border-amber-500/50 shadow-lg shadow-amber-500/30"}`
                        }`}
                    >
                      <div className="flex-1 text-left">
                        <p className={`text-xs font-black uppercase tracking-widest ${effectiveIsPro ? (theme === "light" ? "text-amber-700" : "text-amber-400") : "text-white"}`}>
                          {effectiveIsPro ? "Pro Active" : "Activate Pro"}
                        </p>
                        <p className={`text-[10px] font-medium mt-0.5 ${effectiveIsPro ? (theme === "light" ? "text-amber-600/80" : "text-amber-300/70") : "text-white/80"}`}>
                          {effectiveIsPro ? "Tap to view your plan details" : "Unlock history, team insights & more"}
                        </p>
                      </div>
                      {effectiveIsPro && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearPersistedProState(userEmail);
                            setIsPro(false);
                            setProExpiresAt(null);
                            socket.emit("deactivate_pro", { email: userEmail });
                          }}
                          className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${theme === "light" ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"}`}>
                          Deactivate
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                    workspaceStepLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <style>{`@keyframes sbDotPulse { 0%, 80%, 100% { transform: scale(0.55); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }`}</style>
                      <div className={`rounded-3xl shadow-2xl px-6 py-5 text-center backdrop-blur-xl w-full max-w-sm ${T.loginCard}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${T.label}`}> Preparing work space </p>
                        <p className={`text-sm mt-2 ${T.text}`}>Loading the workspace form…</p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" style={{ animation: "sbDotPulse 1.2s ease-in-out infinite", animationDelay: "0ms" }} />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ animation: "sbDotPulse 1.2s ease-in-out infinite", animationDelay: "160ms" }} />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" style={{ animation: "sbDotPulse 1.2s ease-in-out infinite", animationDelay: "320ms" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    <div>
                      <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1 block`}>Workspace Handle</label>
                      <p className={`text-[9px] ${T.label} mb-1.5`}>{view === "create" ? "Create a unique handle e.g. sprint_2025" : "The handle shared by your team"}</p>
                      <input type="text" autoComplete="off" placeholder="e.g. sprint_2025"
                        className={`w-full p-2.5 rounded-xl border font-mono tracking-wider outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                        value={workspaceName} onChange={e => setWorkspaceName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      />
                      {view === "create" && workspaceName.length >= 3 && (
                        <p className={`text-[9px] mt-1 font-bold ${
                          handleStatus === "taken" ? "text-red-500" : handleStatus === "available" ? "text-emerald-500" : T.label
                        }`}>
                          {handleStatus === "checking" ? "Checking availability…" : handleStatus === "taken" ? "This handle is already taken." : handleStatus === "available" ? "Handle is available." : ""}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1 block`}>{view === "create" ? "Create Workspace Password" : "Workspace Password"}</label>
                      <p className={`text-[9px] ${T.label} mb-1.5`}>{view === "create" ? "At least 8 characters — share only with your team." : "Ask your workspace admin for the password."}</p>
                      <div className="relative">
                        <input type={showWsPin ? "text" : "password"} autoComplete="off" placeholder="Enter password"
                          className={`w-full p-2.5 pr-12 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                          value={wsPin} onChange={e => setWsPin(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && view !== "create") handleAction(); }}
                        />
                        <button type="button" onClick={() => setShowWsPin(v => !v)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${T.label} hover:text-blue-500 transition cursor-pointer`}>
                          {showWsPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {view === "create" && (
                      <div>
                        <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1 block`}>Re-enter Password</label>
                        <div className="relative">
                          <input type={showWsPin ? "text" : "password"} autoComplete="off" placeholder="Confirm password"
                            className={`w-full p-2.5 pr-12 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                            value={wsPinConfirm} onChange={e => setWsPinConfirm(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleAction(); }}
                          />
                          <button type="button" onClick={() => setShowWsPin(v => !v)}
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${T.label} hover:text-blue-500 transition cursor-pointer`}>
                            {showWsPin ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {wsPinConfirm && (
                          <p className={`text-[9px] mt-1 font-bold ${wsPin === wsPinConfirm ? "text-emerald-500" : "text-red-500"}`}>
                            {wsPin === wsPinConfirm ? "Passwords match." : "Passwords do not match."}
                          </p>
                        )}
                      </div>
                    )}
                    {view === "create" && (
                      <div>
                        <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-1 block`}>Project Title</label>
                        <input type="text" autoComplete="off" placeholder="e.g. Sprint 3, Backend, Design…"
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                          value={projectName} onChange={e => setProjectName(e.target.value)}
                        />
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle size={13} className="text-red-400 shrink-0" />
                        <p className="text-[10px] text-red-400 font-bold">{error}</p>
                      </div>
                    )}
                    <button onClick={handleAction}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/40">
                      {view === "create" ? "Initialize Workspace" : "Connect to Workspace"}
                    </button>
                    <button onClick={() => { setWorkspaceStepLoading(false); setView("start"); setError(""); setWsPin(""); setWorkspaceName(""); }}
                      className={`inline-flex items-center justify-center gap-2 w-full text-[10px] ${T.label} font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition cursor-pointer ${theme === "light" ? "border-gray-200 bg-gray-50 hover:bg-gray-100" : "border-slate-700 bg-slate-800/70 hover:bg-slate-700/70"}`}>
                      <ArrowLeft size={12} />
                      Back
                    </button>
                  </div>
                  )
                )}
              </div>
            )}

            <div className={`mt-7 pt-4 border-t ${T.divider} flex items-center justify-between`}>
              <button onClick={() => setShowAbout(true)}
                className={`loop-bob inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${theme === "light" ? "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100" : "border-slate-700/80 bg-slate-800/70 text-slate-300 hover:bg-slate-800"}`}>
                <Info size={13} className="opacity-70"/>How it works
              </button>
              <button onClick={() => setShowContact(true)}
                className={`text-[11px] font-normal ${T.label} hover:text-blue-500 transition flex items-center gap-1.5 cursor-pointer`}>
                <Shield size={13} className="opacity-70"/>Questions?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${T.bg} ${T.text} font-sans pb-safe`}>
      
      <ToastContainer toasts={toasts} />

      <AnimatePresence>
        {actionBanner && <ActionBanner key="action-banner" entry={actionBanner} onDismiss={() => setActionBanner(null)} theme={theme} />}
        {liveAction && <LiveActionCard key={liveAction.__uid || liveAction.id || liveAction.timestamp || liveAction.taskTitle} entry={liveAction} onDismiss={() => setLiveAction(null)} theme={theme} />}
        {error && <ErrorModal key="error-modal" message={error} theme={theme} onClose={() => setError("")} />}
        {showAbout && <AboutModal key="about-modal" onClose={() => setShowAbout(false)} theme={theme} />}
        {showContact && (
          <ContactModal
            key="contact-modal"
            onClose={() => setShowContact(false)}
            theme={theme}
            serverUrl={SERVER_URL}
            context={{
              workspaceName,
              userName: displayName,
              userEmail,
              role,
            }}
          />
        )}
        {showAdd && <AddTaskModal key="add-task-modal" onAdd={addTask} onClose={() => setShowAdd(false)} theme={theme} isPro={effectiveIsPro} onUpgrade={() => setShowProModal(true)} />}
        {showProModal && <ProModal key="pro-modal" isPro={effectiveIsPro} onClose={() => setShowProModal(false)} onActivatePin={handleProActivated} userEmail={userEmail} theme={theme} proExpiresAt={proExpiresAt} />}
        {showActivatePro && (
          <motion.div key="activate-pro-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            onClick={() => { setShowActivatePro(false); setActivateError(""); setActivatePinInput(""); }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`${T.modal} border rounded-2xl p-7 max-w-sm w-full shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${theme === "light" ? "bg-amber-100" : "bg-amber-500/15"}`}>
                    <Lock size={16} className={theme === "light" ? "text-amber-600" : "text-amber-400"} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${T.text}`}>Activate Pro</p>
                    <p className={`text-[10px] ${T.label}`}>Enter your activation PIN</p>
                  </div>
                </div>
                <button onClick={() => { setShowActivatePro(false); setActivateError(""); setActivatePinInput(""); }}
                  className={`${T.label} hover:text-red-500 transition cursor-pointer`}>
                  <X size={16} />
                </button>
              </div>

              <input type="text" autoComplete="off" placeholder="Enter 14-digit PIN" maxLength={14} autoFocus
                className={`w-full p-3.5 rounded-xl border font-mono tracking-widest text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm mb-3 ${T.input}`}
                value={activatePinInput}
                onChange={e => { setActivatePinInput(e.target.value.replace(/\s/g, "")); setActivateError(""); }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitActivatePin(); } }}
              />

              {activateError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
                  <AlertTriangle size={13} className="text-red-400 shrink-0" />
                  <p className="text-[10px] text-red-400 font-bold">{activateError}</p>
                </div>
              )}

              <button
                onClick={submitActivatePin}
                disabled={!activatePinInput.trim() || activateLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 cursor-pointer">
                {activateLoading ? "Verifying…" : "Activate"}
              </button>
            </motion.div>
          </motion.div>
        )}
        {deleteConfirmation.show && <DeleteWorkspaceModal key="delete-ws-modal" wsName={workspaceName} input={deleteConfirmation.input} onChange={(input) => setDeleteConfirmation(prev => ({ ...prev, input }))} onConfirm={handleConfirmDelete} onCancel={() => setDeleteConfirmation({ show: false, input: "" })} theme={theme} />}
        {showHistory && <HistoryPanel key="history-panel" history={history} isPro={effectiveIsPro} onClose={() => setShowHistory(false)} onUpgrade={openUpgradeProModal} onClearHistory={() => socket.emit("clear_history", { workspaceName })} theme={theme} />}
        {showMembers && <MembersPanel key="members-panel" members={displayMembers} onlineUsers={onlineUsers} onClose={() => setShowMembers(false)} isPro={effectiveIsPro} onUpgrade={openUpgradeProModal} theme={theme} />}
        {showOnlineUsers && (
          <OnlineUsersPanel key="online-users-panel"
            users={onlineUsers}
            members={displayMembers}
            isPro={effectiveIsPro}
            onClose={() => setShowOnlineUsers(false)}
            onUpgrade={openUpgradeProModal}
            theme={theme}
            currentUser={{ name: displayName, email: userEmail }}
          />
        )}
        {otherTypers.length > 0 && <TypingIndicator key="typing-indicator" typers={otherTypers} />}
      </AnimatePresence>

      <AnimatePresence>
        {showOfflineNotice && (
          <motion.div
            key="offline-notice"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl border border-red-500/40 bg-red-500/15 text-red-200 shadow-2xl backdrop-blur-md"
            style={{ zIndex: 260 }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]">No internet connection</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {total > 0 && (
        <div className={`fixed top-0 left-0 z-50 h-0.5 w-full ${theme === "light" ? "bg-gray-200" : "bg-slate-800"}`}>
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      <Navbar
        T={T}
        theme={theme}
        toggleTheme={toggleTheme}
        projectName={projectName}
        workspaceName={workspaceName}
         isPro={effectiveIsPro}
        proExpiryLabel={proExpiryLabel}
        onlineUsers={onlineUsers}
        userName={displayName}
        userEmail={userEmail}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        setShowOnlineUsers={setShowOnlineUsers}
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        role={role}
        handleLeave={handleLeave}
        handleDeleteWorkspace={handleDeleteWorkspace}
        setShowProModal={setShowProModal}
        tasks={tasks}
        progress={progress}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(v => !v)}
      />

      {showMobileMenu && (
        <MobileMenu
          theme={theme}
          toggleTheme={toggleTheme}
          userName={displayName}
          userEmail={userEmail}
          role={role}
           isPro={effectiveIsPro}
          proExpiresAt={proExpiresAt}
          workspaceName={workspaceName}
          tasks={tasks || []}
          progress={progress || 0}
          onlineUsers={onlineUsers || []}
          isPanelOpen={showHistory || showMembers || showOnlineUsers}
          setShowHistory={setShowHistory}
          setShowMembers={setShowMembers}
          setShowOnlineUsers={setShowOnlineUsers}
          onOpenProModal={openUpgradeProModal}
          handleLeave={handleLeave}
          onDeleteWorkspace={handleDeleteWorkspace}
          setIsMenuOpen={setShowMobileMenu}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(v => !v)}
        />
      )}

      <QuotaBanner userTaskCount={userTaskCount} limit={limit} userResetDate={userResetDate}  isPro={effectiveIsPro} onUpgrade={() => setShowProModal(true)} theme={theme} />

      <main className="relative z-10 w-full px-3 sm:px-6 md:px-8 py-5 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-sm sm:text-base font-black ${T.text} tracking-tight`}>Project Board</h2>
              {isPro && <span className="text-[7px] sm:text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 uppercase tracking-widest">PRO</span>}
              {isPro && proExpiryLabel && (
                <span className={`sm:hidden text-[7px] font-black ${T.label}`}>
                  Pro expires on {proExpiryLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {taskAddedPulse
                  ? <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" /></>
                  : <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500/40" />}
              </span>
              <p className={`text-xs ${T.subText}`}>{tasks.length} task{tasks.length !== 1 ? "s" : ""} · {progress}% done</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {effectiveIsPro ? (
              <div className="flex-1 sm:w-52">
                <SearchBar value={searchQ} onChange={setSearchQ} theme={theme} />
              </div>
            ) : (
              <button onClick={() => setShowProModal(true)}
                className={`flex items-center gap-2 flex-1 sm:flex-none sm:w-52 pl-3 pr-3 py-2.5 rounded-xl border cursor-pointer transition shadow-sm
                  ${theme === "light" ? "border-gray-300 bg-white text-gray-500 hover:border-amber-400 hover:text-amber-600" : "border-slate-600 bg-slate-800/80 text-slate-400 hover:border-amber-500/40 hover:text-amber-400/70"}`}>
                <Search size={14} className={T.label} />
                <span className="text-xs flex-1 text-left">Search tasks…</span>
                <Lock size={12} className="opacity-50"/>
              </button>
            )}

            {!effectiveIsPro && (
              <button onClick={() => setShowProModal(true)}
                className="flex items-center gap-1 border border-amber-500/30 text-amber-500 px-3 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer hover:bg-amber-500/10 transition-all whitespace-nowrap shadow-sm">
                Pro
              </button>
            )}

            {(role === "member" || role === "admin") && (
              <button onClick={tryOpenAdd}
                title="Press 'N' to add task"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-900/30 active:scale-95 transition-all whitespace-nowrap">
                <Plus size={12}/><span className="hidden sm:inline">New Task</span><span className="sm:hidden">Add</span>
                <span className="hidden lg:inline text-[8px] opacity-60 ml-1 border border-white/20 px-1 py-0.5 rounded">N</span>
              </button>
            )}
          </div>
        </div>

        {searchQ && (
          <div className="mb-4 flex items-center gap-2">
            <span className={`text-[10px] font-black ${T.label} uppercase tracking-widest`}>
              {filteredTasks.length} result{filteredTasks.length !== 1 ? "s" : ""} for "{searchQ}"
            </span>
            <button onClick={() => setSearchQ("")} className="text-[9px] text-blue-500 hover:text-blue-400 font-black cursor-pointer">Clear</button>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              const isProgressColumn = col.id === "in-progress";
              return (
                <Column key={col.id} col={col}
                  tasks={colTasks}
                  isLoading={boardHydrating && colTasks.length === 0 && !isProgressColumn}
                  onDelete={deleteTask} role={role}  isPro={effectiveIsPro} theme={theme}
                  onUpgrade={() => setShowProModal(true)}
                />
              );
            })}   
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.18, 0.67, 0.6, 1)" }}>
            {activeTask ? (
              <div className="scale-[1.02] rotate-1 shadow-2xl will-change-transform">
                <TaskCard task={activeTask} onDelete={() => {}} role={role}  isPro={effectiveIsPro} isOverlay theme={theme} onUpgrade={() => setShowProModal(true)} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className={`mt-10 pt-5 border-t ${T.divider}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
              <span className={`text-[9px] font-semibold uppercase tracking-widest ${T.label}`}>SyncBoard · Real-time · Always Synced</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
            </div>
            <button onClick={() => setShowAbout(true)}
              className={`loop-bob inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition cursor-pointer
                ${theme === "light" ? "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 shadow-sm" : "border-slate-700/80 bg-slate-800/70 text-blue-300 hover:border-blue-500/40 hover:bg-slate-800"}`}>
              <Info size={11}/>About SyncBoard
            </button>
            <button onClick={() => setShowContact(true)}
              className={`text-[9px] font-semibold text-blue-500 hover:text-blue-400 transition underline underline-offset-2 flex items-center gap-1 cursor-pointer`}>
              <Shield size={11}/>Contact
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}