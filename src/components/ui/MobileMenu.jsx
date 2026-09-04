import React from "react";
import { X, History, Users, Moon, LogOut, ChevronRight, Trash2, Lock, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MobileMenu = ({
  theme,
  toggleTheme,
  userName,
  userEmail,
  role,
  isPro,
  proExpiresAt,
  workspaceName,
  tasks,
  progress,
  onlineUsers,
  isPanelOpen,
  setShowHistory,
  setShowMembers,
  setShowOnlineUsers,
  onOpenProModal,
  onActivatePro,
  onDeactivatePro,
  handleLeave,
  setIsMenuOpen,
  soundEnabled,
  onDeleteWorkspace,
  onToggleSound,
}) => {
  const T = theme === "light" ? {
    bg: "bg-gray-50",
    text: "text-gray-800",
    subText: "text-gray-600",
    card: "bg-white border-gray-200",
    divider: "border-gray-200",
    iconBg: "bg-gray-100",
  } : {
    bg: "bg-[#1a1a1a]",
    text: "text-white",
    subText: "text-gray-400",
    card: "bg-gray-800/50 border-gray-700/50",
    divider: "border-gray-700",
    iconBg: "bg-gray-700/50",
  };

  const daysLeft = proExpiresAt
    ? Math.max(0, Math.ceil((new Date(proExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const hasExpiry = daysLeft !== null;
  const daysLabel = daysLeft === 1 ? "Day Left" : "Days Left";
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setIsMenuOpen(false)}
      />
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 bottom-0 w-4/5 max-w-sm z-60 ${T.bg} p-4 flex flex-col font-sans box-border`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${theme === "light" ? "bg-blue-100 border-blue-300" : "bg-blue-600/15 border-blue-500/25"}`}>
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
              </svg>
            </div>
            <div>
                <p className="text-[8px] font-semibold text-blue-500 uppercase tracking-[0.24em]">SyncBoard</p>
                <p className={`text-sm font-semibold ${T.text}`}>Workspace</p>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-lg ${T.card}`}>
            <X size={20} />
          </button>
        </div>

        <div className={`flex-1 ${isPanelOpen ? "overflow-hidden" : "overflow-y-auto mobile-scrollbar-hide"} space-y-3.5`}>

          {/* Profile card */}
          <div className={`w-full p-4 rounded-2xl border ${T.card}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-base font-bold text-white shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[14.5px] font-semibold ${T.text} truncate`}>{userName}</p>
                {userEmail && <p className={`text-[11.5px] ${T.subText} truncate`}>{userEmail}</p>}
              </div>
              {isPro && (
                <span className="shrink-0 text-[10px] font-bold bg-amber-500 text-black px-2.5 py-1.5 rounded-lg uppercase tracking-wide">PRO</span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${role === "admin" ? "text-purple-400" : "text-blue-400"}`}>{role}</span>
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Online
              </span>
            </div>
          </div>

          {/* Pro status box */}
          {isPro ? (
            <div className={`rounded-2xl border p-4 ${theme === "light" ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30"}`}>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-[22px] font-bold ${theme === "light" ? "text-amber-600" : "text-amber-400"}`}>{daysLeft === null ? "--" : daysLeft}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide opacity-85 ${theme === "light" ? "text-amber-700" : "text-amber-400"}`}>{daysLabel}</span>
              </div>
              {hasExpiry && daysLeft > 0 && (
                <p className={`text-xs mt-0.5 mb-3.5 ${T.subText}`}>
                  Expires on {new Date(proExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
              <button
                onClick={() => { setIsMenuOpen(false); onOpenProModal?.(); }}
                className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wide border transition ${theme === "light" ? "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200" : "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"}`}
              >
                View Pro Details
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setIsMenuOpen(false); onActivatePro?.(); }}
              className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition ${theme === "light" ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15"}`}
            >
              <Lock size={18} className={theme === "light" ? "text-amber-600" : "text-amber-400"} />
              <div className="flex-1">
                <p className={`text-[13px] font-semibold ${theme === "light" ? "text-amber-700" : "text-amber-400"}`}>Activate Pro</p>
                <p className={`text-[11px] ${T.subText}`}>Unlock history, team insights & more</p>
              </div>
            </button>
          )}

          {/* Workspace progress */}
          <div className={`w-full p-4 rounded-2xl border ${T.card}`}>
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-[12.5px] font-mono ${T.subText}`}>#{workspaceName}</span>
              <span className={`text-[11.5px] ${T.subText}`}>{tasks.length} tasks · {progress}% done</span>
            </div>
            <div className={`w-full rounded-full h-[5px] ${theme === "light" ? "bg-gray-200" : "bg-slate-800"}`}>
              <div className="bg-emerald-400 h-[5px] rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Menu */}
          <div>
            <p className={`text-[10px] font-semibold uppercase ${T.subText} mb-2 tracking-[0.16em] px-0.5`}>Menu</p>
            <div className={`rounded-2xl border overflow-hidden ${T.card}`}>
              <button
                onClick={() => {
                  if (!isPro) { setIsMenuOpen(false); onOpenProModal?.(); return; }
                  onToggleSound?.();
                }}
                className={`w-full flex items-center gap-3.5 p-3.5 border-b transition ${T.divider} ${theme === "light" ? "hover:bg-gray-50" : "hover:bg-white/5"}`}
              >
                <div className={`p-2.5 rounded-xl ${T.iconBg} relative`}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  {!isPro && <Lock size={10} className="absolute -top-1 -right-1 opacity-70"/>}
                </div>
                <p className={`flex-1 text-left text-[13.5px] font-medium ${T.text}`}>Live alert sounds</p>
                <span className={`text-[10.5px] font-bold uppercase tracking-wide ${soundEnabled ? "text-emerald-400" : T.subText}`}>{soundEnabled ? "On" : "Off"}</span>
              </button>

              <button
                onClick={() => setShowHistory(v => !v)}
                className={`w-full flex items-center gap-3.5 p-3.5 border-b transition ${T.divider} ${theme === "light" ? "hover:bg-gray-50" : "hover:bg-white/5"}`}
              >
                <div className={`p-2.5 rounded-xl ${T.iconBg}`}><History size={18} /></div>
                <p className={`flex-1 text-left text-[13.5px] font-medium ${T.text}`}>History</p>
                <ChevronRight size={16} className={T.subText} />
              </button>

              <button
                onClick={() => setShowMembers(v => !v)}
                className={`w-full flex items-center gap-3.5 p-3.5 border-b transition ${T.divider} ${theme === "light" ? "hover:bg-gray-50" : "hover:bg-white/5"}`}
              >
                <div className={`p-2.5 rounded-xl ${T.iconBg}`}><Users size={18} /></div>
                <p className={`flex-1 text-left text-[13.5px] font-medium ${T.text}`}>Team</p>
                <ChevronRight size={16} className={T.subText} />
              </button>

              <button
                onClick={() => setShowOnlineUsers(v => !v)}
                className={`w-full flex items-center gap-3.5 p-3.5 border-b transition ${T.divider} ${theme === "light" ? "hover:bg-gray-50" : "hover:bg-white/5"}`}
              >
                <div className={`p-2.5 rounded-xl ${T.iconBg}`}><Users size={18} /></div>
                <p className={`flex-1 text-left text-[13.5px] font-medium ${T.text}`}>Who&apos;s Online</p>
                <ChevronRight size={16} className={T.subText} />
              </button>

              <button
                onClick={isPro ? onDeactivatePro : onActivatePro}
                className={`w-full flex items-center gap-3.5 p-3.5 transition ${theme === "light" ? "hover:bg-red-50" : "hover:bg-red-500/5"}`}
              >
                <div className={`p-2.5 rounded-xl ${theme === "light" ? "bg-red-100" : "bg-red-500/15"}`}>
                  <Lock size={18} className={theme === "light" ? "text-red-600" : "text-red-400"} />
                </div>
                <p className={`flex-1 text-left text-[13.5px] font-medium ${theme === "light" ? "text-red-600" : "text-red-400"}`}>{isPro ? "Deactivate Pro" : "Activate Pro"}</p>
                <ChevronRight size={16} className={theme === "light" ? "text-red-300" : "text-red-500/50"} />
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <p className={`text-[10px] font-semibold uppercase ${T.subText} mb-2 tracking-[0.16em] px-0.5`}>Tasks</p>
            <div className={`rounded-2xl border overflow-hidden ${T.card}`}>
              {tasks && tasks.length > 0 ? (
                tasks.map((task, idx) => {
                  const rawStatus = String(task.status || "pending").toLowerCase();
                  const isDoneT = rawStatus.includes("done");
                  const isProgT = rawStatus.includes("progress");
                  const pillClass = isDoneT
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                    : isProgT
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                      : "text-red-400 bg-red-500/10 border-red-500/30";
                  const pillLabel = isDoneT ? "DONE" : isProgT ? "IN PROGRESS" : "TODO";
                  return (
                    <div key={idx} className={`flex items-center justify-between gap-3 p-3.5 ${idx !== tasks.length - 1 ? `border-b ${T.divider}` : ""}`}>
                      <p className={`text-[13.5px] font-semibold ${T.text} truncate min-w-0 flex-1`}>{task.title || "Untitled Task"}</p>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${pillClass}`}>
                        {pillLabel}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className={`text-sm ${T.subText} italic p-3.5`}>No tasks yet</p>
              )}
            </div>
          </div>

          {/* Dark mode */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${T.card}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${T.iconBg}`}><Moon size={18} /></div>
              <p className={`text-[14px] font-semibold ${T.text}`}>Dark mode</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Danger actions */}
          <div className="flex flex-col gap-1 pb-1">
            {role === "admin" && (
              <button
                onClick={() => { setIsMenuOpen(false); onDeleteWorkspace?.(); }}
                className={`w-full flex items-center gap-3.5 py-1.5 px-0.5 rounded-lg transition ${theme === "light" ? "hover:bg-red-50" : "hover:bg-red-500/5"}`}
              >
                <div className={`p-2.5 rounded-xl border ${theme === "light" ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/25"}`}>
                  <Trash2 size={18} className={theme === "light" ? "text-red-600" : "text-red-400"} />
                </div>
                <p className={`flex-1 text-left text-[14px] font-semibold ${theme === "light" ? "text-red-600" : "text-red-400"}`}>Delete workspace</p>
                <ChevronRight size={16} className={theme === "light" ? "text-red-300" : "text-red-500/50"} />
              </button>
            )}
            <button onClick={handleLeave} className={`w-full flex items-center gap-3.5 py-1.5 px-0.5 rounded-lg transition ${theme === "light" ? "hover:bg-red-50" : "hover:bg-red-500/5"}`}>
              <div className={`p-2.5 rounded-xl border ${theme === "light" ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/25"}`}>
                <LogOut size={18} className={theme === "light" ? "text-red-600" : "text-red-400"} />
              </div>
              <p className={`flex-1 text-left text-[14px] font-semibold ${theme === "light" ? "text-red-600" : "text-red-400"}`}>Log out</p>
              <ChevronRight size={16} className={theme === "light" ? "text-red-300" : "text-red-500/50"} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default MobileMenu;
