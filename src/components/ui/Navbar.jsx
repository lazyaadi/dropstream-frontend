import React from "react";
import { Sun, Moon, History, Users, LogOut, Trash2, Lock, Menu, X, Volume2, VolumeX } from "lucide-react";
import OnlineAvatars from "./OnlineAvatars";
import { sbVars } from "../../lib/sbTheme"; // adjust the "../" count to where Navbar.jsx lives

const mono = { fontFamily: "var(--sb-mono)" };
const display = { fontFamily: "var(--sb-display)" };

const ICON_BTN =
  "flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer text-[color:var(--sb-text-3)] hover:bg-[color:var(--sb-surface-2)] hover:text-[color:var(--sb-text-2)]";
const LINK_BASE = "flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer text-[12.5px]";
const LINK_IDLE =
  "text-[color:var(--sb-text-2)] hover:bg-[color:var(--sb-surface-2)] hover:text-[color:var(--sb-text)]";
const LINK_BLUE = "bg-[color:var(--sb-blue-soft)] text-[color:var(--sb-blue)]";
const LINK_PURPLE = "bg-[color:var(--sb-purple-soft)] text-[color:var(--sb-purple)]";
const DIVIDER = "w-px h-[22px] shrink-0 bg-[color:var(--sb-border-soft)]";

const LockBadge = () => (
  <span className="w-[13px] h-[13px] -ml-0.5 rounded-full flex items-center justify-center border border-[color:var(--sb-border)] bg-[color:var(--sb-surface-3)] text-[color:var(--sb-text-3)]">
    <Lock size={7} />
  </span>
);

// Pixel ghost on a dark tile so it stays visible in both themes.
const GhostTile = ({ size = 22 }) => (
  <span
    className="inline-flex items-center justify-center rounded-md shrink-0"
    style={{ width: size, height: size, background: "#14171F" }}
  >
    <img
      src="/ghostfreak.png"
      alt=""
      width={size - 6}
      height={size - 6}
      draggable={false}
      style={{ imageRendering: "pixelated" }}
    />
  </span>
);

const Navbar = ({
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
  showAI,
  onToggleAI,
  role,
  handleLeave,
  handleDeleteWorkspace,
  setShowProModal,
  onActivatePro,
  onDeactivatePro,
  showMobileMenu,
  setShowMobileMenu,
  soundEnabled,
  onToggleSound,
}) => {
  const initial = String(userName || "?").charAt(0).toUpperCase();

  return (
    <nav
      className="sticky top-0 z-40 backdrop-blur-xl border-b border-[color:var(--sb-border-soft)] text-[color:var(--sb-text)]"
      style={{ ...sbVars(theme), background: "var(--sb-nav-bg)", fontFamily: "var(--sb-body)" }}
    >
      <div style={{ height: 2, background: "linear-gradient(90deg, var(--sb-green), var(--sb-amber))" }} />

      <div className="px-4 sm:px-7 py-3">
        <div className="flex items-center justify-between gap-5">
          {/* Zone 1: brand + workspace */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex items-center gap-[11px] min-w-0">
              <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 border border-[color:var(--sb-border)] bg-[color:var(--sb-surface-2)]">
                <svg className="w-[17px] h-[17px]" style={{ color: "var(--sb-blue)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9.5px] uppercase tracking-[0.16em] leading-none text-[color:var(--sb-text-3)]" style={mono}>
                  SyncBoard
                </p>
                <h1 className="text-[15.5px] font-semibold tracking-[-0.01em] leading-tight mt-[3px] truncate max-w-[11rem] sm:max-w-[16rem]" style={display}>
                  {projectName}
                </h1>
              </div>
            </div>
            <div className={`hidden xl:block ${DIVIDER}`} />
            <span
              className="hidden xl:flex items-center gap-[7px] px-3 py-1.5 rounded-lg text-[11.5px] border border-[color:var(--sb-border)] bg-[color:var(--sb-surface-2)] text-[color:var(--sb-text-2)]"
              style={mono}
            >
              <span className="w-[5px] h-[5px] rounded-full bg-[color:var(--sb-green)]" />
              #{workspaceName}
            </span>
          </div>

          {/* Zone 2: links, activate, presence */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => { setShowHistory((v) => !v); setShowOnlineUsers(false); }}
              className={`${LINK_BASE} ${showHistory ? LINK_BLUE : LINK_IDLE}`}
              title="View History"
              aria-label="Log"
            >
              <History size={14} />
              <span className="hidden lg:inline">Log</span>
              {!isPro && <LockBadge />}
            </button>
            <button
              onClick={() => setShowMembers((v) => !v)}
              className={`${LINK_BASE} ${showMembers ? LINK_PURPLE : LINK_IDLE}`}
              title="View Team"
              aria-label="Team"
            >
              <Users size={14} />
              <span className="hidden lg:inline">Team</span>
              {!isPro && <LockBadge />}
            </button>
            <button
              onClick={onToggleAI}
              className={`${LINK_BASE} ${showAI ? LINK_BLUE : LINK_IDLE}`}
              title="Ghostfreak AI"
              aria-label="Ghostfreak AI"
            >
              <GhostTile size={22} />
              <span className="hidden lg:inline">AI</span>
            </button>

            <div className={`${DIVIDER} mx-2`} />

            {isPro && (
              <button
                onClick={() => setShowProModal(true)}
                className="mr-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition cursor-pointer bg-[color:var(--sb-amber-soft)] border-[color:var(--sb-amber-line)] text-[color:var(--sb-amber)]"
                style={mono}
                title={proExpiryLabel ? `Pro expires on ${proExpiryLabel}` : "Pro features"}
              >
                PRO
              </button>
            )}
            <button
              onClick={isPro ? onDeactivatePro : onActivatePro}
              className={`flex items-center gap-1.5 px-3 py-[7px] rounded-lg border text-[11px] font-bold tracking-[0.04em] transition cursor-pointer whitespace-nowrap ${
                isPro
                  ? "border-[color:var(--sb-red-line)] text-[color:var(--sb-red)] hover:bg-[color:var(--sb-red-soft)]"
                  : "bg-[color:var(--sb-amber-soft)] border-[color:var(--sb-amber-line)] text-[color:var(--sb-amber)]"
              }`}
              style={mono}
              title={isPro ? "Deactivate Pro" : "Activate Pro"}
            >
              {!isPro && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.8 6.7L22 9.3l-5.3 4.9L18 22l-6-3.6L6 22l1.3-7.8L2 9.3l7.2-.6z" />
                </svg>
              )}
              {isPro ? "Deactivate" : "Activate Pro"}
            </button>

            <div className="ml-2">
              <OnlineAvatars
                users={onlineUsers}
                isPro={isPro}
                onClick={() => setShowOnlineUsers((v) => !v)}
                theme={theme}
                currentUser={{ name: userName, email: userEmail }}
              />
            </div>
          </div>

          {/* Zone 3: theme, sound, user */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={toggleTheme} className={ICON_BTN} title="Toggle theme" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => { if (!isPro) { setShowProModal(true); return; } onToggleSound?.(); }}
              className={`${ICON_BTN} relative`}
              title={isPro ? (soundEnabled ? "Mute live alerts" : "Unmute live alerts") : "Pro feature: live alert sounds"}
              aria-label="Live alert sound"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              {!isPro && <Lock size={9} className="absolute -top-0.5 -right-0.5 opacity-70" />}
            </button>

            <div className={`${DIVIDER} mx-2`} />

            <div className="flex items-center gap-[9px] pl-1 pr-1.5">
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 bg-[color:var(--sb-blue-soft)] text-[color:var(--sb-blue)]"
                style={mono}
              >
                {initial}
              </div>
              <div className="hidden xl:block">
                <p className="text-[12.5px] font-semibold leading-[1.3]">{userName}</p>
                <p
                  className={`text-[9px] uppercase tracking-[0.05em] ${role === "admin" ? "text-[color:var(--sb-purple)]" : "text-[color:var(--sb-blue)]"}`}
                  style={mono}
                >
                  {role}
                </p>
              </div>
            </div>

            <button onClick={handleLeave} className={`${ICON_BTN} hover:!text-[color:var(--sb-red)]`} title="Leave workspace" aria-label="Leave workspace">
              <LogOut size={14} />
            </button>
            {role === "admin" && (
              <button
                onClick={handleDeleteWorkspace}
                className={`${ICON_BTN} hover:!text-[color:var(--sb-red)]`}
                title="Delete workspace (admin only)"
                aria-label="Delete workspace"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={onToggleAI}
              aria-label="Ghostfreak AI"
              title="Ghostfreak AI"
              className={`p-1.5 rounded-lg transition ${showAI ? LINK_BLUE : ""}`}
            >
              <GhostTile size={26} />
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Menu"
              className="p-2 rounded-lg text-[color:var(--sb-text)]"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;