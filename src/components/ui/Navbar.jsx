import React from "react";
import { Sun, Moon, Plus, ChevronRight, AlertTriangle, Eye, Info, Shield, History, Users, LogOut, Trash2, Search, Lock, Menu, X, Volume2, VolumeX } from "lucide-react";
import OnlineAvatars from "./OnlineAvatars";

const Navbar = ({
  T,
  theme,
  toggleTheme,
  projectName,
  workspaceName,
  isPro,
  proExpiryLabel,
  onlineUsers,
  userName,
  userEmail,
  showHistory,
  setShowHistory,
  setShowOnlineUsers,
  showMembers,
  setShowMembers,
  role,
  handleLeave,
  handleDeleteWorkspace,
  setShowProModal,
  onActivatePro,
  onDeactivatePro,
  tasks,
  progress,
  showMobileMenu,
  setShowMobileMenu,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <nav className={`relative z-40 ${T.nav} backdrop-blur-xl sticky top-0 shadow-lg`}>
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Project Name */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${theme === "light" ? "bg-blue-100 border-blue-300" : "bg-blue-600/15 border-blue-500/25"}`}>
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <p className="text-[8px] font-semibold text-blue-500 uppercase tracking-[0.24em] leading-none">SyncBoard</p>
              <h1 className={`text-sm font-semibold ${T.text} leading-snug tracking-tight mt-1`}>{projectName}</h1>
            </div>
          </div>

          {/* Desktop Nav — zone 1: workspace tag */}
          <div className="hidden md:flex items-center gap-3.5">
            <div className={`w-px h-5 ${theme === "light" ? "bg-gray-200" : "bg-slate-800"}`} />
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border ${theme === "light" ? "bg-white border-gray-200 text-gray-500" : "bg-slate-800/60 border-slate-700/60 text-slate-400"}`}>
              <span className="w-[5px] h-[5px] rounded-full bg-emerald-400" />
              #{workspaceName}
            </span>
          </div>

          {/* Desktop Nav — zone 2: links, activate, presence */}
          <div className="hidden md:flex items-center gap-1.5">
            <button onClick={() => { setShowHistory(v => !v); setShowOnlineUsers(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[12px] ${showHistory ? (theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-600/20 text-blue-400") : (theme === "light" ? "text-gray-600 hover:bg-gray-100" : "text-slate-400 hover:bg-slate-800/80")}`}
              title="View History">
              <History size={14} />
              <span>Log</span>
              {!isPro && (
                <span className={`w-[13px] h-[13px] rounded-full flex items-center justify-center -ml-0.5 ${theme === "light" ? "bg-gray-200 text-gray-500" : "bg-slate-700 text-slate-400"}`}>
                  <Lock size={7} />
                </span>
              )}
            </button>
            <button onClick={() => setShowMembers(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[12px] ${showMembers ? (theme === "light" ? "bg-purple-100 text-purple-600" : "bg-purple-600/20 text-purple-400") : (theme === "light" ? "text-gray-600 hover:bg-gray-100" : "text-slate-400 hover:bg-slate-800/80")}`}
              title="View Team">
              <Users size={14} />
              <span>Team</span>
              {!isPro && (
                <span className={`w-[13px] h-[13px] rounded-full flex items-center justify-center -ml-0.5 ${theme === "light" ? "bg-gray-200 text-gray-500" : "bg-slate-700 text-slate-400"}`}>
                  <Lock size={7} />
                </span>
              )}
            </button>

            <div className={`w-px h-5 mx-1 ${theme === "light" ? "bg-gray-200" : "bg-slate-800"}`} />

            {isPro && (
              <button onClick={() => setShowProModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer"
                title={proExpiryLabel ? `Pro expires on ${proExpiryLabel}` : "Pro features"}>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">PRO</span>
              </button>
            )}
            <button onClick={isPro ? onDeactivatePro : onActivatePro}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition cursor-pointer whitespace-nowrap
                ${isPro
                  ? (theme === "light" ? "border-red-300 text-red-600 hover:bg-red-50" : "border-red-500/35 text-red-400 hover:bg-red-500/10")
                  : (theme === "light" ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100" : "bg-amber-500/10 border-amber-500/35 text-amber-400 hover:bg-amber-500/15")}`}
              title={isPro ? "Deactivate Pro" : "Activate Pro"}>
              {!isPro && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.8 6.7L22 9.3l-5.3 4.9L18 22l-6-3.6L6 22l1.3-7.8L2 9.3l7.2-.6z"/></svg>
              )}
              {isPro ? "Deactivate" : "Activate Pro"}
            </button>

            <OnlineAvatars users={onlineUsers} isPro={isPro} onClick={() => setShowOnlineUsers(v => !v)} theme={theme} currentUser={{ name: userName, email: userEmail }} />
          </div>

          {/* Desktop Nav — zone 3: theme, sound, user */}
          <div className="hidden md:flex items-center gap-1.5">
            <button onClick={toggleTheme}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer ${theme === "dark" ? "text-slate-400 hover:bg-slate-800/60" : "text-gray-500 hover:bg-gray-100"}`}
              title="Toggle theme">
              {theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
            <button onClick={() => { if (!isPro) { setShowProModal(true); return; } onToggleSound?.(); }}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer relative ${theme === "dark" ? "text-slate-400 hover:bg-slate-800/60" : "text-gray-500 hover:bg-gray-100"}`}
              title={isPro ? (soundEnabled ? "Mute live alerts" : "Unmute live alerts") : "Pro feature — live alert sounds"}>
              {soundEnabled ? <Volume2 size={15}/> : <VolumeX size={15}/>}
              {!isPro && <Lock size={9} className="absolute -top-0.5 -right-0.5 opacity-70"/>}
            </button>

            <div className={`w-px h-5 mx-1 ${theme === "light" ? "bg-gray-200" : "bg-slate-800"}`} />

            <div className="flex items-center gap-2">
              <div className="w-[30px] h-[30px] rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`text-[12.5px] font-semibold ${T.text} leading-none`}>{userName}</p>
                <p className={`text-[9px] font-bold uppercase mt-1 tracking-wide ${role === "admin" ? "text-purple-500" : "text-blue-500"}`}>{role}</p>
              </div>
            </div>
            <button onClick={handleLeave}
              className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${theme === "light" ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"}`}
              title="Leave workspace">
              <LogOut size={14}/>
            </button>
            {role === "admin" && (
              <button onClick={handleDeleteWorkspace}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${theme === "light" ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-slate-600 hover:text-red-500 hover:bg-red-500/20"}`}
                title="Delete workspace (admin only)">
                <Trash2 size={14}/>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className={`p-2 rounded-lg ${T.text}`}>
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
