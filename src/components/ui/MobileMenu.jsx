import React from "react";
import { X, History, Users, Moon, LogOut, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MobileMenu = ({
  theme,
  toggleTheme,
  userName,
  role,
  isPro,
  proExpiresAt,
  workspaceName,
  tasks,
  progress,
  onlineUsers,
  setShowHistory,
  setShowMembers,
  setShowOnlineUsers,
  onOpenProModal,
  handleLeave,
  setIsMenuOpen,
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
  const taskGroups = [
    { id: "todo", label: "TO DO", color: "text-blue-500", ring: "border-blue-500/20 bg-blue-500/10" },
    { id: "in-progress", label: "IN PROGRESS", color: "text-amber-500", ring: "border-amber-500/20 bg-amber-500/10" },
    { id: "done", label: "DONE", color: "text-emerald-500", ring: "border-emerald-500/20 bg-emerald-500/10" },
  ];

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
        className={`fixed top-0 left-0 bottom-0 w-4/5 max-w-sm z-60 ${T.bg} p-4 flex flex-col`}
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

        <div className="overflow-y-auto flex-1">
          <div className={`p-4 rounded-xl ${T.card} mb-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-black text-white shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`font-bold ${T.text}`}>{userName}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${role === "admin" ? "text-purple-500" : "text-blue-500"}`}>{role}</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Online
                  </span>
                </div>
              </div>
              {isPro && (
                <span className="ml-auto text-xs font-bold bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md">PRO</span>
              )}
            </div>
            {isPro && (
              <div className={`mt-4 rounded-xl border px-3 py-3 ${theme === "light" ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme === "light" ? "text-amber-700" : "text-amber-400"}`}>Pro Active</p>
                    <p className={`text-[11px] font-semibold mt-1 ${T.text}`}>You have {daysLeft === null ? "full Pro access" : `${daysLeft} ${daysLabel.toLowerCase()}`}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[18px] font-black leading-none ${theme === "light" ? "text-amber-600" : "text-amber-400"}`}>{daysLeft === null ? "--" : daysLeft}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${T.subText}`}>{daysLabel}</p>
                  </div>
                </div>
                {hasExpiry && daysLeft > 0 && (
                  <p className={`mt-2 text-[10px] font-bold ${theme === "light" ? "text-amber-700" : "text-amber-300"}`}>
                    Expires on {new Date(proExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProModal?.();
                  }}
                  className={`mt-3 w-full rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${theme === "light" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"}`}
                >
                  View Pro details
                </button>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-xl ${T.card} mb-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-mono ${T.subText}`}>#{workspaceName}</span>
              <span className={`text-sm ${T.subText}`}>{tasks.length} tasks · {progress}% done</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${T.card}`}>
            <p className={`text-[10px] font-semibold uppercase ${T.subText} mb-3 tracking-[0.24em]`}>MENU</p>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  setShowHistory(v => !v);
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${theme === "light" ? "hover:bg-gray-100" : "hover:bg-gray-700/50"}`}
              >
                <div className={`p-2 rounded-lg ${T.iconBg}`}><History size={20} /></div>
                <div className="flex-1 text-left">
                  <p className={`text-[13px] font-semibold ${T.text}`}>History</p>
                  <p className={`text-[10px] ${T.subText}`}>Recent activity log</p>
                </div>
                <ChevronRight size={18} className={T.subText} />
              </button>

              <button 
                onClick={() => {
                  setShowMembers(v => !v);
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${theme === "light" ? "hover:bg-gray-100" : "hover:bg-gray-700/50"}`}
              >
                <div className={`p-2 rounded-lg ${T.iconBg}`}><Users size={20} /></div>
                <div className="flex-1 text-left">
                  <p className={`text-[13px] font-semibold ${T.text}`}>Team</p>
                  <p className={`text-[10px] ${T.subText}`}>Members & permissions</p>
                </div>
                <ChevronRight size={18} className={T.subText} />
              </button>

              <button
                onClick={() => {
                  setShowOnlineUsers(v => !v);
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${theme === "light" ? "hover:bg-gray-100" : "hover:bg-gray-700/50"}`}
              >
                <div className={`p-2 rounded-lg ${theme === "light" ? "bg-blue-100" : "bg-blue-500/15"}`}>
                  <Users size={20} className={theme === "light" ? "text-blue-600" : "text-blue-300"} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-[13px] font-semibold ${T.text}`}>Who&apos;s Online</p>
                  <p className={`text-[10px] ${T.subText}`}>{(onlineUsers || []).length} active teammate{(onlineUsers || []).length === 1 ? "" : "s"}</p>
                </div>
                <ChevronRight size={18} className={T.subText} />
              </button>

            </div>
          </div>

          <div className={`p-4 rounded-xl ${T.card} mt-4`}>
            <p className={`text-[10px] font-semibold uppercase ${T.subText} mb-3 tracking-[0.24em]`}>TASKS</p>
            <div className="space-y-3">
              {taskGroups.map(group => {
                const groupTasks = (tasks || []).filter(task => task.status === group.id).slice(0, 2);
                const groupCount = (tasks || []).filter(task => task.status === group.id).length;
                return (
                  <div key={group.id} className={`rounded-xl border p-3 ${group.ring} ${theme === "light" ? "bg-white" : "bg-slate-800/40"}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${group.color}`}>{group.label}</p>
                      <span className={`text-[9px] font-semibold ${T.subText}`}>{groupCount}</span>
                    </div>
                    <div className="space-y-1.5">
                      {groupTasks.length > 0 ? (
                        groupTasks.map((task, idx) => (
                          <div key={`${group.id}-${idx}`} className={`p-2 rounded-lg ${theme === "light" ? "bg-gray-50" : "bg-gray-700/30"}`}>
                            <p className={`text-[10px] font-semibold ${T.text} truncate`}>{task.title || "Untitled Task"}</p>
                            <p className={`text-[8px] ${T.subText}`}>{task.status || "pending"}</p>
                          </div>
                        ))
                      ) : (
                        <p className={`text-[9px] ${T.subText} italic`}>No tasks</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-4 rounded-xl ${T.card} mt-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${T.iconBg}`}><Moon size={20} /></div>
                <p className={`font-bold ${T.text}`}>Dark mode</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <button onClick={handleLeave} className={`w-full flex items-center gap-3 p-3 mt-4 rounded-lg transition ${theme === "light" ? "hover:bg-gray-100" : "hover:bg-gray-700/50"}`}>
            <div className={`p-2 rounded-lg ${T.iconBg} text-red-500`}><LogOut size={20} /></div>
            <p className="font-bold text-red-500">Log out</p>
            <ChevronRight size={20} className="ml-auto text-red-500" />
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default MobileMenu;
