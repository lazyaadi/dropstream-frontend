import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { io } from "socket.io-client";
import {
  DndContext, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCorners, pointerWithin, DragOverlay,
} from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Plus, ChevronRight, AlertTriangle, Eye, Info, Shield,
  History, Users, LogOut, Trash2, Search, Lock,
} from "lucide-react";

// ─── CONSTANTS ───
const WORKER_URL = import.meta.env?.VITE_WORKER_URL || "https://rana-ai.ak3807654.workers.dev";
const SERVER_URL = import.meta.env?.VITE_SERVER_URL || "http://localhost:3001";
const SESSION_KEY = "sb_workspace_session";
const WORKSPACE_SESSION_KEY = "sb_workspace_active";
const PRO_PIN_KEY = "sb_pro_pin";
const THEME_KEY = "sb_theme";
const FREE_TASK_LIMIT = 3;
const PRO_TASK_LIMIT = 3000;

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#3b82f6", badge: "text-blue-400 bg-blue-500/10 border-blue-500/20", ring: "border-blue-500/40 bg-blue-500/5", dot: "bg-blue-500" },
  { id: "in-progress", label: "In Progress", color: "#f59e0b", badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", ring: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-500" },
  { id: "done", label: "Done", color: "#10b981", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", ring: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-500" },
];

const COLUMNS_LIGHT = [
  { id: "todo", label: "To Do", color: "#2563eb", badge: "text-blue-700 bg-blue-100 border-blue-300", ring: "border-blue-300 bg-blue-50", dot: "bg-blue-500" },
  { id: "in-progress", label: "In Progress", color: "#d97706", badge: "text-amber-700 bg-amber-100 border-amber-300", ring: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
  { id: "done", label: "Done", color: "#059669", badge: "text-emerald-700 bg-emerald-100 border-emerald-300", ring: "border-emerald-300 bg-emerald-50", dot: "bg-emerald-500" },
];

const PRIORITY = {
  low:    { label: "Low",    cls: "text-white bg-emerald-500 border-emerald-600/60", clsLight: "text-white bg-emerald-500 border-emerald-600/60" },
  medium: { label: "Medium", cls: "text-white bg-amber-500 border-amber-600/60",     clsLight: "text-white bg-amber-500 border-amber-600/60" },
  high:   { label: "High",   cls: "text-white bg-red-500 border-red-600/60",         clsLight: "text-white bg-red-500 border-red-600/60" },
};

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
  label: "text-slate-500", divider: "border-slate-800",
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

// ─── UTILS ───
const fmtTime = (date) => {
  if (!date) return "";
  const d = new Date(date), now = new Date(), diff = now - d;
  if (diff < 60000)    return "just now";
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtFull = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const fmtDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
};

const obfuscateText = (seed = 0, type = "name") => {
  return type === "number" ? "••••••••••" : "••••••••••";
};

const FLOAT_PANEL_CLASS = "fixed left-4 top-20 z-[90] w-64 sm:w-72 rounded-2xl border shadow-2xl p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto";

const normEmail = (e) => (e || "").trim().toLowerCase();
const normName = (n) => (n || "").trim();
const isSameOnlineUser = (a, b) => {
  if (!a || !b) return false;
  const ae = normEmail(a.email);
  const be = normEmail(b.email);
  if (ae && be && ae === be) return true;
  const an = normName(a.name);
  const bn = normName(b.name);
  return !!(an && bn && an === bn);
};

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

const validatePin = (p) => {
  if (!p?.trim()) return "PIN is required.";
  if (p.trim().length < 6) return "PIN must be 6 digits.";
  return null;
};

import ParticleBg from "./components/effects/ParticleBg.jsx";
import ToastContainer from "./components/ui/ToastContainer.jsx";
import ActionBanner from "./components/ui/ActionBanner.jsx";
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
import OnlineAvatars from "./components/ui/OnlineAvatars.jsx";
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
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    timeout: 60000,
    transports: ["websocket", "polling"],
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
  const COLS = theme === "light" ? COLUMNS_LIGHT : COLUMNS;
  const toggleTheme = useCallback(() => {
    setTheme(t => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem(THEME_KEY, n); return n; });
  }, []);

  const [userName, setUserName]       = useState("");
  const [userEmail, setUserEmail]     = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [authReady, setAuthReady]     = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");
  const [authStep, setAuthStep]       = useState("name");
  const [showPass, setShowPass]       = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [wsPin, setWsPin]               = useState("");
  const [projectName, setProjectName]   = useState("");
  const [view, setView]                 = useState("start");
  const [isPro, setIsPro]               = useState(false);

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
  const [proExpiresAt, setProExpiresAt]   = useState(null);

  const [showAdd, setShowAdd]               = useState(false);
  const [showHistory, setShowHistory]       = useState(false);
  const [showMembers, setShowMembers]       = useState(false);
  const [showProModal, setShowProModal]     = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showAbout, setShowAbout]           = useState(false);
  const [showContact, setShowContact]       = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTask, setActiveTask]         = useState(null);
  const [toasts, setToasts]                 = useState([]);
  const [syncPulse, setSyncPulse]           = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, input: "" });
  const [searchQ, setSearchQ]               = useState("");
  const [typers, setTypers]                 = useState([]);
  const [taskAddedPulse, setTaskAddedPulse] = useState(false);
  const [autoJoining, setAutoJoining]       = useState(false);
  const [boardHydrating, setBoardHydrating]   = useState(false);
  const boardHydrateTimerRef = useRef(null);
  const finishBoardHydrationRef = useRef(() => {});
  finishBoardHydrationRef.current = () => {
    if (boardHydrateTimerRef.current) clearTimeout(boardHydrateTimerRef.current);
    boardHydrateTimerRef.current = setTimeout(() => {
      setBoardHydrating(false);
      boardHydrateTimerRef.current = null;
    }, 380);
  };
  const [actionBanner, setActionBanner]     = useState(null);
  const [wsErrorType, setWsErrorType]       = useState(null);
  const [wsErrorName, setWsErrorName]       = useState("");

  const isProRef    = useRef(isPro);
  const userNameRef = useRef(userName);
  const workspaceNameRef = useRef(workspaceName);
  const userEmailRef = useRef(userEmail);
  const wsPinRef = useRef(wsPin);
  useEffect(() => { isProRef.current    = isPro;    }, [isPro]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { workspaceNameRef.current = workspaceName; }, [workspaceName]);
  useEffect(() => { userEmailRef.current = userEmail; }, [userEmail]);
  useEffect(() => { wsPinRef.current = wsPin; }, [wsPin]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    return pointerHits.length ? pointerHits : closestCorners(args);
  }, []);

  const addToast = useCallback((msg, type = "sync") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  useEffect(() => {
    localStorage.removeItem(PRO_PIN_KEY);
    localStorage.removeItem("sb_pro_active");
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
        const s = JSON.parse(activeSession);
        if (s.workspaceName && s.userEmail && s.userName) {
          setWorkspaceName(s.workspaceName);
          setUserEmail(s.userEmail);
          setUserName(s.userName);
          if (s.projectName) setProjectName(s.projectName);
          if (s.role) setRole(s.role);
          if (s.tasks) setTasks(s.tasks);
          if (s.members) setMembers(s.members);
          if (s.history) setHistory(s.history);
          if (s.taskCount !== undefined) setUserTaskCount(s.taskCount);
          if (s.resetAt !== undefined) setUserResetDate(s.resetAt);
          if (s.isPro) setIsPro(s.isPro);
          if (s.proExpiresAt) setProExpiresAt(s.proExpiresAt);
          setBoardHydrating(!(s.tasks && s.tasks.length > 0));

          if (socket.connected) {
            setAutoJoining(true);
            socket.emit("rejoin_workspace", {
              workspaceName: s.workspaceName,
              userName: s.userName,
              email: s.userEmail,
            });
          }

          setAuthReady(true);
        } else {
          // If session data is incomplete, clear it
          localStorage.removeItem(WORKSPACE_SESSION_KEY);
        }
      } catch (err) {
        localStorage.removeItem(WORKSPACE_SESSION_KEY);
      }
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
    const h = (e) => {
      const tag = document.activeElement?.tagName;
      if (isJoined && e.key === "n" && tag !== "INPUT" && tag !== "TEXTAREA") {
        if (role === "member" || role === "admin") tryOpenAdd();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isJoined, role]);

  useEffect(() => {
    socket.on("connect", () => {
      if (!isJoined) { setError(""); setAuthError(""); }

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
      setAuthLoading(false); setAuthError("");
      setIsPro(!!data.isPro);
      setUserTaskCount(data.taskCount || 0);
      setUserResetDate(data.resetAt || null);
      setProExpiresAt(data.proExpiresAt || null);
      setUserName(data.name);
      setUserEmail(data.email);
      setAuthReady(true);
    });

    socket.on("auth_error", (msg) => {
      setAuthLoading(false); setAutoJoining(false);
      setAuthError(msg || "Authentication failed."); setAuthStep("name");
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
      addToast("Pro activated!", "success");
    });

    socket.on("pro_activate_error", (msg) => {
      setIsPro(false);
      addToast(msg || "Pro activation failed", "warn");
    });

    socket.on("pro_deactivated", () => {
      setIsPro(false);
      setProExpiresAt(null);
      addToast("Pro deactivated", "warn");
    });

    socket.on("pro_deactivate_error", (msg) => {
      addToast(msg || "Pro deactivation failed", "warn");
    });

    socket.on("load_workspace", ({ tasks: t, projectName: pn, role: r, history: h, members: m, taskCount, resetAt, isPro: sp, proExpiresAt: exp }) => {
      setTasks(t || []); setProjectName(pn); setIsJoined(true); setAutoJoining(false);
      finishBoardHydrationRef.current();
      setRole(r || "member"); setHistory(h || []); setMembers(m || []);
      setError(""); setWsErrorType(null);
      if (taskCount !== undefined) setUserTaskCount(taskCount);
      if (resetAt !== undefined) setUserResetDate(resetAt);
      setIsPro(!!sp);
      setProExpiresAt(exp || null);

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
        isPro: !!sp,
        proExpiresAt: exp || null,
        joinedAt: new Date().toISOString()
      }));
    });

    socket.on("receive_update", ({ tasks: updated, history: h }) => {
      setTasks(updated || []);
      finishBoardHydrationRef.current();
      if (h) setHistory(h);
      setSyncPulse(true); setTimeout(() => setSyncPulse(false), 1200);
      if (isProRef.current && h && h[0] && h[0].userName !== userNameRef.current) {
        setActionBanner(h[0]);
        const a = h[0].action || "";
        if (a.includes("In Progress") || a.includes("Done")) {
          addToast(`${h[0].userName}: ${h[0].action}`, "pro");
        }
      } else {
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
      const action = latest?.action || "";
      const isPresenceEvent = action.includes("joined") || action.includes("left");
      if (isPresenceEvent && latest?.userName && latest.userName !== userNameRef.current) {
        if (isProRef.current) {
          setActionBanner(latest);
        }
      }
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
      ["connect","auth_success","auth_error","task_count_update","task_limit_reached","pro_activated",
       "load_workspace","receive_update","users_update","members_update","history_update","history_cleared",
       "pro_activate_error","pro_deactivated","pro_deactivate_error","error_msg","permission_denied","kicked",
       "typing_update","typing_clear","reconnect"]
        .forEach(ev => socket.off(ev));
    };
  }, []);

  const handleNameNext = useCallback(() => {
    if (!userName.trim()) return setAuthError("Your name is required.");
    setAuthError(""); setAuthStep("email");
  }, [userName]);

  const handleAuth = useCallback(() => {
    const emailErr = validateEmail(userEmail);
    if (emailErr) return setAuthError(emailErr);
    if (!userPassword.trim()) return setAuthError("Password is required.");
    setAuthLoading(true); setAuthError("");
    socket.emit("auth_user", { email: userEmail.trim(), password: userPassword.trim(), name: userName.trim() });
  }, [userEmail, userPassword, userName]);

  const handleAction = useCallback(() => {
    if (!authReady) return setError("Please sign in first.");
    const nameErr = validateWorkspaceName(workspaceName);
    if (nameErr) return setError(nameErr);
    const pinErr = validatePin(wsPin);
    if (pinErr) return setError(pinErr);
    const isCreating = view === "create";
    if (isCreating && !projectName.trim()) return setError("Project title is required.");
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userName, userEmail, workspaceName, projectName }));
    setBoardHydrating(true);
    socket.emit("join_workspace", {
      workspaceName: workspaceName.toLowerCase(),
      password: wsPin, projectName, userName,
      email: userEmail, isCreating,
    });
  }, [authReady, workspaceName, wsPin, view, projectName, userName, userEmail]);

  const handleLeave = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(WORKSPACE_SESSION_KEY);
    sessionStorage.removeItem("sb_workspace_pin");
    sessionStorage.removeItem(PRO_PIN_KEY);
    sessionStorage.removeItem("sb_pro_active");
    localStorage.removeItem(PRO_PIN_KEY);
    localStorage.removeItem("sb_pro_active");

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
    socket.emit("update_tasks", { workspaceName, updatedTasks: updated, actionMeta: { action: `moved "${task.title}" → ${colLabel}`, taskTitle: task.title } });
  };

  const addTask = useCallback((taskData) => {
    const { title, description, priority, dueDate, image } = taskData;
    const limit = isPro ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
    if (userTaskCount >= limit) { setShowProModal(true); return; }
    const taskId = `task-${Date.now()}`;
    const safeCreatorName = userName;
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
    const updated = [...tasks, newTask];
    setTasks(updated);
    setTaskAddedPulse(true); setTimeout(() => setTaskAddedPulse(false), 1500);
    socket.emit("update_tasks", { workspaceName, updatedTasks: updated, actionMeta: { action: "added task", taskTitle: title }, newTaskId: taskId });
    addToast("Task created", "success");
  }, [tasks, isPro, userTaskCount, userName, role, workspaceName, addToast]);

  const deleteTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    socket.emit("update_tasks", { workspaceName, updatedTasks: updated, actionMeta: { action: "deleted task", taskTitle: task?.title || "" } });
    addToast("Task deleted", "delete");
  }, [tasks, workspaceName, addToast]);

  const tryOpenAdd = useCallback(() => {
    const limit = isPro ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
    if (userTaskCount >= limit) { setShowProModal(true); return; }
    if (role !== "member" && role !== "admin") { addToast("Only members/admins can add tasks", "warn"); return; }
    setShowAdd(true);
  }, [isPro, userTaskCount, role, addToast]);

  const handleProActivated = useCallback((proPin) => {
    setShowProModal(false);
    socket.emit("set_user_pro", { email: userEmail, proPin });
  }, [userEmail]);

  const filteredTasks = useMemo(() => {
    if (!searchQ.trim()) return tasks;
    const q = searchQ.toLowerCase();
    return tasks.filter(t => t.title?.toLowerCase().includes(q) || t.addedBy?.toLowerCase().includes(q));
  }, [tasks, searchQ]);

  const done     = tasks.filter(t => t.status === "done").length;
  const total    = tasks.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const otherTypers = typers.filter(t => t.name !== userName);
  const limit = isPro ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
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
        <ParticleBg theme={theme} />
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-[11px] font-black ${T.label} uppercase tracking-widest`}>Connecting…</p>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className={`relative min-h-screen ${T.bg} font-sans ${T.text} flex items-center justify-center overflow-hidden p-4`}>
        <ParticleBg theme={theme} />

        <button onClick={toggleTheme}
          className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-widest
            ${theme === "dark" ? "bg-slate-900/40 border-slate-700/50 text-slate-300 hover:border-slate-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400"}`}
        >
          {theme === "dark" ? <><Sun size={11} className="text-yellow-400"/><span className="text-yellow-400">Light</span></> : <><Moon size={11}/><span>Dark</span></>}
        </button>

        <AnimatePresence>
          {error && <ErrorModal key="error-modal" message={error} theme={theme} onClose={() => { setError(""); setView("start"); setWorkspaceName(""); setWsPin(""); }} />}
          {wsErrorType && <WorkspaceErrorModal key="ws-error-modal" type={wsErrorType} wsName={wsErrorName} theme={theme} onClose={() => { setWsErrorType(null); setView("start"); setWsPin(""); setWorkspaceName(""); }} />}
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
          {showProModal && <ProModal key="pro-modal" isPro={isPro} onClose={() => setShowProModal(false)} onActivatePin={handleProActivated} userEmail={userEmail} theme={theme} proExpiresAt={proExpiresAt} />}
        </AnimatePresence>

        <div className={`relative z-10 w-full max-w-md`}>
          <div className={`absolute -inset-2 ${theme === "light" ? "bg-blue-100/60" : "bg-blue-500/8"} rounded-3xl blur-2xl`} />
          <div className={`relative ${T.loginCard} backdrop-blur-xl p-8 rounded-2xl border shadow-2xl`}>

            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border ${theme === "light" ? "bg-blue-100 border-blue-300" : "bg-blue-600/15 border-blue-500/25"}`}>
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                </svg>
              </div>
              <h1 className={`text-2xl font-black ${T.text} tracking-tight`}>SyncBoard</h1>
              <p className={`text-[10px] ${T.label} uppercase tracking-[0.45em] mt-1 font-black`}>Team Task Manager</p>
            </div>

            {isPro && (
              <div className="flex flex-col gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pro Active</p>
                  <button onClick={() => {
                    localStorage.removeItem(PRO_PIN_KEY);
                    localStorage.removeItem("sb_pro_active");
                    setIsPro(false);
                    setProExpiresAt(null);
                    socket.emit("deactivate_pro", { email: userEmail });
                  }}
                    className={`ml-auto text-[9px] ${T.label} hover:text-red-500 transition font-black cursor-pointer`}>Deactivate</button>
                </div>
                {proExpiryLabel && (
                  <div className="flex items-center gap-2 text-[9px] font-black text-amber-500">
                    <span className="ml-4 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 uppercase tracking-widest">Reminder</span>
                    <span>Remainder: Pro expires on {proExpiryLabel}</span>
                  </div>
                )}
              </div>
            )}

            {!authReady && authStep === "name" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${theme === "light" ? "bg-blue-600" : "bg-blue-500"}`}>1</div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>Your Name</p>
                    <p className={`text-[9px] ${T.label}`}>What should we call you?</p>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Full Name</label>
                  <input type="text" autoComplete="name" placeholder="e.g. Ahmed Khan" autoFocus
                    className={`w-full p-3 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
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
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/30">
                  Continue →
                </button>
              </div>
            )}

            {!authReady && authStep === "email" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${theme === "light" ? "bg-blue-600" : "bg-blue-500"}`}>2</div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>Login</p>
                    <p className={`text-[9px] ${T.label}`}>Enter your credentials to access SyncBoard</p>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Email Address</label>
                  <input type="email" autoComplete="email" placeholder="e.g. ahmed@gmail.com" autoFocus
                    className={`w-full p-3 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                    value={userEmail} onChange={e => { setUserEmail(e.target.value); setAuthError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleAuth()}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-2 block`}>Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} autoComplete="current-password" placeholder="Your password"
                      className={`w-full p-3 pr-10 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                      value={userPassword} onChange={e => { setUserPassword(e.target.value); setAuthError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleAuth()}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition cursor-pointer">
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
                <button onClick={handleAuth} disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/30">
                  {authLoading ? "Loading…" : "Login"}
                </button>
                <button onClick={() => { setAuthStep("name"); setAuthError(""); }}
                  className={`w-full text-[9px] font-black uppercase tracking-widest p-2 rounded-lg transition cursor-pointer ${theme === "light" ? "text-gray-600 hover:bg-gray-100" : "text-slate-400 hover:bg-slate-800"}`}>
                  ← Back
                </button>
              </div>
            )}

            {authReady && (
              <div className="space-y-3">
                {view === "start" ? (
                  <div className="space-y-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 ${theme === "light" ? "bg-blue-600" : "bg-blue-500"}`}>3</div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-[0.15em] ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>Workspace</p>
                        <p className={`text-[9px] ${T.label} mt-0.5`}>Create new or join existing.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setView("create")}
                        className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl font-black text-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-500/30">
                        <Plus size={18}/><span>New Workspace</span>
                      </button>
                      <button onClick={() => setView("join")}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer backdrop-blur-sm border-2
                          ${theme === "light" ? "bg-white border-blue-600 text-blue-600 hover:bg-blue-50" : "bg-slate-800/50 border-blue-500 text-blue-300 hover:bg-slate-700/60"}`}>
                        <ChevronRight size={18}/><span>Join Workspace</span>
                      </button>
                    </div>

                    <div className={`flex items-center gap-3 my-5 ${theme === "light" ? "text-gray-300" : "text-slate-700"}`}>
                      <div className="flex-1 h-px bg-current" />
                      <span className="text-xs font-black uppercase tracking-wider opacity-60">Account</span>
                      <div className="flex-1 h-px bg-current" />
                    </div>

                    <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${theme === "light" ? "bg-emerald-50/50 border-emerald-300" : "bg-emerald-500/10 border-emerald-500/30"}`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-black uppercase tracking-wider ${theme === "light" ? "text-emerald-700" : "text-emerald-400"}`}>{userName}</p>
                        <p className={`text-[9px] ${theme === "light" ? "text-emerald-600" : "text-emerald-500/70"}`}>Logged in</p>
                      </div>
                      <button onClick={() => { setAuthReady(false); setAuthError(""); setAuthStep("name"); }}
                        className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${theme === "light" ? "bg-emerald-200/50 text-emerald-700 hover:bg-emerald-300" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40"}`}>Switch User</button>
                    </div>

                    <button onClick={() => setShowProModal(true)}
                      className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer mt-4
                        ${isPro
                          ? `${theme === "light" ? "bg-amber-100 border-2 border-amber-400 text-amber-700" : "bg-amber-500/15 border-2 border-amber-500/50 text-amber-400"}`
                          : `bg-gradient-to-r ${theme === "light" ? "from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30" : "from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/40"}`
                        }`}
                    >
                      <span>{isPro ? "Pro Activated" : "Upgrade to Pro"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="mb-5">
                      <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-3.5 block`}>Workspace Handle</label>
                      <p className={`text-[9px] ${T.label} mb-4`}>{view === "create" ? "Create a unique handle e.g. sprint_2025" : "The handle shared by your team"}</p>
                      <input type="text" autoComplete="off" placeholder="e.g. sprint_2025"
                        className={`w-full p-3.5 rounded-xl border font-mono tracking-wider outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                        value={workspaceName} onChange={e => setWorkspaceName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      />
                    </div>
                    <div className="mb-5">
                      <PinInput label="6-Digit Workspace PIN" hint={view === "create" ? "Set a 6-digit PIN — share only with your team." : "Ask your workspace admin for the PIN."} value={wsPin} onChange={setWsPin} onEnter={handleAction} theme={theme} />
                    </div>
                    {view === "create" && (
                      <div className="mt-1">
                        <label className={`text-[10px] font-black ${T.label} uppercase tracking-widest mb-3 block`}>Project Title</label>
                        <input type="text" autoComplete="off" placeholder="e.g. Sprint 3, Backend, Design…"
                          className={`w-full p-3.5 rounded-xl border outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${T.input}`}
                          value={projectName} onChange={e => setProjectName(e.target.value)}
                        />
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle size={13} className="text-red-400 shrink-0" />
                        <p className="text-[10px] text-red-400 font-bold">{error}</p>
                      </div>
                    )}
                    <button onClick={handleAction}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-900/40 mt-2">
                      {view === "create" ? "Initialize Workspace" : "Connect to Workspace"}
                    </button>
                    <button onClick={() => { setView("start"); setError(""); setWsPin(""); setWorkspaceName(""); }}
                      className={`w-full text-[10px] ${T.label} font-black uppercase hover:text-blue-500 cursor-pointer transition py-1`}>← Back</button>
                  </div>
                )}
              </div>
            )}

            <div className={`mt-8 pt-4 border-t ${T.divider} flex items-center justify-between`}>
              <button onClick={() => setShowAbout(true)}
                className={`text-[9px] font-black uppercase tracking-widest ${T.label} hover:text-blue-500 transition cursor-pointer flex items-center gap-1`}>
                <Info size={11}/>How it works
              </button>
              <button onClick={() => setShowContact(true)}
                className={`text-[9px] font-black uppercase tracking-widest ${T.label} hover:text-blue-500 transition flex items-center gap-1 cursor-pointer`}>
                <Shield size={11}/>Questions?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${T.bg} ${T.text} font-sans`}>
      <ParticleBg theme={theme} />
      <ToastContainer toasts={toasts} />

      <AnimatePresence>
        {actionBanner && isPro && <ActionBanner key="action-banner" entry={actionBanner} onDismiss={() => setActionBanner(null)} theme={theme} />}
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
              userName,
              userEmail,
              role,
            }}
          />
        )}
        {showAdd && <AddTaskModal key="add-task-modal" onAdd={addTask} onClose={() => setShowAdd(false)} theme={theme} isPro={isPro} onUpgrade={() => setShowProModal(true)} />}
        {showProModal && <ProModal key="pro-modal" isPro={isPro} onClose={() => setShowProModal(false)} onActivatePin={handleProActivated} userEmail={userEmail} theme={theme} proExpiresAt={proExpiresAt} />}
        {deleteConfirmation.show && <DeleteWorkspaceModal key="delete-ws-modal" wsName={workspaceName} input={deleteConfirmation.input} onChange={(input) => setDeleteConfirmation(prev => ({ ...prev, input }))} onConfirm={handleConfirmDelete} onCancel={() => setDeleteConfirmation({ show: false, input: "" })} theme={theme} />}
        {showHistory && <HistoryPanel key="history-panel" history={history} isPro={isPro} onClose={() => setShowHistory(false)} onUpgrade={() => setShowProModal(true)} onClearHistory={() => socket.emit("clear_history", { workspaceName })} theme={theme} />}
        {showMembers && <MembersPanel key="members-panel" members={members} onlineUsers={onlineUsers} onClose={() => setShowMembers(false)} isPro={isPro} onUpgrade={() => setShowProModal(true)} theme={theme} />}
        {showOnlineUsers && (
          <OnlineUsersPanel key="online-users-panel"
            users={onlineUsers}
            members={members}
            isPro={isPro}
            onClose={() => setShowOnlineUsers(false)}
            onUpgrade={() => { setShowOnlineUsers(false); setShowProModal(true); }}
            theme={theme}
            currentUser={{ name: userName, email: userEmail }}
          />
        )}
        {otherTypers.length > 0 && <TypingIndicator key="typing-indicator" typers={otherTypers} />}
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
        isPro={isPro}
        proExpiryLabel={proExpiryLabel}
        onlineUsers={onlineUsers}
        userName={userName}
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
      />

      {showMobileMenu && (
        <MobileMenu
          theme={theme}
          toggleTheme={toggleTheme}
          userName={userName}
          role={role}
          isPro={isPro}
          workspaceName={workspaceName}
          tasks={tasks || []}
          progress={progress || 0}
          setShowHistory={setShowHistory}
          setShowMembers={setShowMembers}
          handleLeave={handleLeave}
          setIsMenuOpen={setShowMobileMenu}
        />
      )}

      <QuotaBanner userTaskCount={userTaskCount} limit={limit} userResetDate={userResetDate} isPro={isPro} onUpgrade={() => setShowProModal(true)} theme={theme} />

      <main className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-6 md:px-8 py-5 sm:py-8">
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
            {isPro ? (
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

            {!isPro && (
              <button onClick={() => setShowProModal(true)}
                className="flex items-center gap-1 border border-amber-500/30 text-amber-500 px-3 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer hover:bg-amber-500/10 transition-all whitespace-nowrap shadow-sm">
                Pro
              </button>
            )}

            {(role === "member" || role === "admin") && (
              <button onClick={tryOpenAdd}
                title="Press 'N' to add task"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] cursor-pointer shadow-lg shadow-blue-900/30 active:scale-95 transition-all whitespace-nowrap">
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
              return (
                <Column key={col.id} col={col}
                  tasks={colTasks}
                  isLoading={boardHydrating && colTasks.length === 0}
                  onDelete={deleteTask} role={role} isPro={isPro} theme={theme}
                  onUpgrade={() => setShowProModal(true)}
                />
              );
            })}
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.18, 0.67, 0.6, 1)" }}>
            {activeTask ? (
              <div className="scale-[1.02] rotate-1 shadow-2xl will-change-transform">
                <TaskCard task={activeTask} onDelete={() => {}} role={role} isPro={isPro} isOverlay theme={theme} onUpgrade={() => setShowProModal(true)} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className={`mt-10 pt-5 border-t ${T.divider}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
              <span className={`text-[9px] font-black uppercase tracking-widest ${T.label}`}>SyncBoard · Real-time · Always Synced</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
            </div>
            <button onClick={() => setShowAbout(true)}
              className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition cursor-pointer
                ${theme === "light" ? "text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600 bg-white shadow-sm" : "text-slate-600 border-slate-800 hover:border-blue-500/40 hover:text-blue-400"}`}>
              <Info size={11}/>About SyncBoard
            </button>
            <button onClick={() => setShowContact(true)}
              className={`text-[9px] font-black text-blue-500 hover:text-blue-400 transition underline underline-offset-2 flex items-center gap-1 cursor-pointer`}>
              <Shield size={11}/>Contact
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}