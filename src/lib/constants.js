import { Zap, Search, Bell, Users, Clock, History, Paperclip, Image as ImageIcon } from "lucide-react";

export const WORKER_URL = import.meta.env?.VITE_WORKER_URL || "https://rana-ai.ak3807654.workers.dev";
export const SESSION_KEY = "sb_workspace_session";
export const WORKSPACE_SESSION_KEY = "sb_workspace_active";
export const PRO_PIN_KEY = "sb_pro_pin";
export const THEME_KEY = "sb_theme";
export const FREE_TASK_LIMIT = 3;
export const PRO_TASK_LIMIT = 3000;

export const COLUMNS = [
  { id: "todo", label: "To Do", color: "#3b82f6", badge: "text-blue-400 bg-blue-500/10 border-blue-500/20", ring: "border-blue-500/40 bg-blue-500/5", dot: "bg-blue-500" },
  { id: "in-progress", label: "In Progress", color: "#f59e0b", badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", ring: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-500" },
  { id: "done", label: "Done", color: "#10b981", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", ring: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-500" },
];

export const COLUMNS_LIGHT = [
  { id: "todo", label: "To Do", color: "#2563eb", badge: "text-blue-700 bg-blue-100 border-blue-300", ring: "border-blue-300 bg-blue-50", dot: "bg-blue-500" },
  { id: "in-progress", label: "In Progress", color: "#d97706", badge: "text-amber-700 bg-amber-100 border-amber-300", ring: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
  { id: "done", label: "Done", color: "#059669", badge: "text-emerald-700 bg-emerald-100 border-emerald-300", ring: "border-emerald-300 bg-emerald-50", dot: "bg-emerald-500" },
];

export const PRIORITY = {
  low:    { label: "Low",    cls: "text-white bg-emerald-500 border-emerald-600/60", clsLight: "text-white bg-emerald-500 border-emerald-600/60" },
  medium: { label: "Medium", cls: "text-white bg-amber-500 border-amber-600/60",     clsLight: "text-white bg-amber-500 border-amber-600/60" },
  high:   { label: "High",   cls: "text-white bg-red-500 border-red-600/60",         clsLight: "text-white bg-red-500 border-red-600/60" },
};

export const PAYMENT_METHODS = [
  { id: "binance", label: "Binance Pay",       account: "794251090",     price: "$11",    currency: "USDT", note: "Include your email in the payment note" },
  { id: "ubl",     label: "UBL Bank Transfer", account: "1951324646652", price: "Rs 2800",currency: "PKR",  note: "Include your email in the transfer description" },
];

export const PRO_FEATURES = [
  { icon: Search,    title: "Smart Search",          desc: "Find tasks instantly",              iconDark: "#fbbf24", iconLight: "#d97706" },
  { icon: Bell,      title: "Live Notifications",    desc: "Real-time alerts with sound",       iconDark: "#60a5fa", iconLight: "#2563eb" },
  { icon: Users,     title: "Team Insights",         desc: "See who's online + member list",   iconDark: "#34d399", iconLight: "#059669" },
  { icon: Clock,     title: "Timestamps",            desc: "Full audit trail with times",       iconDark: "#f472b6", iconLight: "#db2777" },
  { icon: History,   title: "Action Logs",           desc: "Complete activity history",        iconDark: "#fb923c", iconLight: "#ea580c" },
  { icon: Paperclip, title: "File Attachments",      desc: "Upload images up to 5MB",          iconDark: "#a78bfa", iconLight: "#7c3aed" },
  { icon: ImageIcon, title: "Image Previews",        desc: "Inline image thumbnails on cards", iconDark: "#22d3ee", iconLight: "#0891b2" },
];

export const TD = {
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

export const TL = {
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

