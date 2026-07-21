import React from "react";
import { Sun, Moon, Plus, ChevronRight, AlertTriangle, Eye, Info, Shield, History, Users, LogOut, Trash2, Search, Lock, Menu, X } from "lucide-react";
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
  tasks,
  progress,
  showMobileMenu,
  setShowMobileMenu,
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
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none">SyncBoard</p>
              <h1 className={`text-sm font-bold ${T.text} leading-snug tracking-tight mt-1`}>{projectName}</h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <span className={`hidden sm:inline-flex items-center ml-2 px-3.5 py-1 rounded-md border text-[8px] font-black font-mono tracking-widest shrink-0 ${theme === "light" ? "bg-gray-50 border-gray-300 text-gray-400" : "bg-slate-700/50 border-slate-600 text-slate-400"}`}>
              #{workspaceName}
            </span>
            {isPro && (
              <div className="flex items-center gap-2 shrink-0">
                {proExpiryLabel && (
                  <span className={`hidden sm:inline-flex text-[10px] font-bold ${T.label} whitespace-nowrap`}>
                    Pro expires on {proExpiryLabel}
                  </span>
                )}
                <button onClick={() => setShowProModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer"
                  title="Pro features">
                  <span className="text-[7px] font-black text-amber-400 uppercase tracking-wider">PRO</span>
                </button>
              </div>
            )}
            <OnlineAvatars users={onlineUsers} isPro={isPro} onClick={() => setShowOnlineUsers(v => !v)} theme={theme} currentUser={{ name: userName, email: userEmail }} />
            <button onClick={() => { setShowHistory(v => !v); setShowOnlineUsers(false); }}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${showHistory ? (theme === "light" ? "bg-blue-100 text-blue-600 border border-blue-300" : "bg-blue-600/20 text-blue-400 border border-blue-500/30") : (theme === "light" ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-transparent" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent")}`}
              title="View History">
              <History size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Log</span>
              {!isPro && <Lock size={10} className="opacity-60"/>}
            </button>
            <button onClick={() => setShowMembers(v => !v)}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${showMembers ? (theme === "light" ? "bg-purple-100 text-purple-600 border border-purple-300" : "bg-purple-600/20 text-purple-400 border border-purple-500/30") : (theme === "light" ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-transparent" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent")}`}
              title="View Team">
              <Users size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Team</span>
              {!isPro && <Lock size={10} className="opacity-50"/>}
            </button>
          </div>

          {/* User Info and Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleTheme}
              className={`flex items-center justify-center p-2 rounded-lg border transition cursor-pointer ${theme === "dark" ? "bg-slate-800/40 border-slate-700/50 text-yellow-400 hover:border-slate-600 hover:bg-slate-800/60" : "bg-gray-100 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-200"}`}
              title="Toggle theme">
              {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
            </button>
            <div className={`flex items-center gap-2 pl-3 border-l ${T.divider}`}>
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`text-xs font-bold ${T.text} leading-none`}>{userName}</p>
                <p className={`text-[9px] font-black uppercase mt-1 ${role === "admin" ? "text-purple-500" : "text-blue-500"}`}>{role}</p>
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
