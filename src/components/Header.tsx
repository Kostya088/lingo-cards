import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Layers,
  Moon,
  Sun,
  Cloud,
  CloudOff,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  hideOnMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  hideOnMobile,
}) => {
  const { user, syncStatus } = useAuth();
  const location = useLocation();

  const isSubScreen =
    location.pathname.startsWith("/decks/new") ||
    location.pathname.includes("/edit") ||
    location.pathname.includes("/cards/") ||
    location.pathname.includes("/bulk-add") ||
    location.pathname === "/auth";

  const shouldHide = isSubScreen || hideOnMobile;

  return (
    <header
      className={`sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors pt-safe ${
        shouldHide ? "hidden sm:block" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 group text-left focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                LingoCards
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              Speak, flip & master vocabulary
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80"
              title="Account & Cloud Sync"
            >
              {syncStatus === "syncing" ? (
                <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
              ) : syncStatus === "synced" ? (
                <Cloud className="w-5 h-5 text-emerald-500" />
              ) : syncStatus === "offline" ? (
                <CloudOff className="w-5 h-5 text-amber-500" />
              ) : (
                <Cloud className="w-5 h-5 text-slate-400" />
              )}
              <span className="hidden sm:inline font-medium max-w-[120px] md:max-w-[200px] truncate">
                {user.user_metadata?.display_name || user.email?.split("@")[0]}
              </span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-xl transition-colors border border-brand-200 dark:border-brand-800"
            >
              <UserIcon className="w-5 h-5" />
              <span>Sign In / Sync</span>
            </Link>
          )}

          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
