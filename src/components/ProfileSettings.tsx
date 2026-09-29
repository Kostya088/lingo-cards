import React, { useState } from "react";
import {
  ArrowLeft,
  CloudOff,
  RefreshCw,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  HardDrive,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { type DeckWithStats } from "../types";

interface ProfileSettingsProps {
  user: any;
  syncStatus: string;
  lastSyncedAt: number | null;
  syncError: string | null;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  isConfigured: boolean;
  decks: DeckWithStats[];
  refreshDecks: () => Promise<void>;
  onNavigateHome: () => void;
  onNavigateAuth: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  syncStatus,
  lastSyncedAt,
  syncError,
  signOut,
  syncNow,
  isConfigured,
  decks,
  refreshDecks,
  onNavigateHome,
  onNavigateAuth,
}) => {
  const [isSyncingManual, setIsSyncingManual] = useState(false);

  const totalCards = decks.reduce((acc, d) => acc + d.totalCards, 0);

  const handleManualSync = async () => {
    try {
      setIsSyncingManual(true);
      await syncNow();
      await refreshDecks();
    } finally {
      setIsSyncingManual(false);
    }
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff} seconds ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm transition-all"
          aria-label="Back to decks"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-slate-100">
            Account & Cloud Sync
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your profile and cross-device sync
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      {user ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xl border border-brand-200 dark:border-brand-800 shadow-inner">
                {user.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] xs:max-w-[240px] sm:max-w-none">
                  {user.email}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Cloud Connected</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full sm:w-auto justify-center px-4 py-2 text-sm font-semibold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Sync Status Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Cloud Synchronization
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Last synced: {formatLastSync(lastSyncedAt)}
                </p>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncingManual || syncStatus === "syncing"}
                className="w-full sm:w-auto justify-center px-4 py-2 sm:px-3.5 text-sm sm:text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all active:scale-95"
              >
                <RefreshCw
                  className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${
                    isSyncingManual || syncStatus === "syncing"
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Sync Now
              </button>
            </div>

            {/* Sync State Badge */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start sm:items-center gap-3">
              {syncStatus === "synced" && (
                <>
                  <div className="p-2 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      All changes synchronized
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Your flashcards are backed up and up-to-date across all
                      devices.
                    </div>
                  </div>
                </>
              )}

              {syncStatus === "syncing" && (
                <>
                  <div className="p-2 shrink-0 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mt-0.5 sm:mt-0">
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Syncing with cloud...
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Uploading local progress and downloading updates.
                    </div>
                  </div>
                </>
              )}

              {syncStatus === "offline" && (
                <>
                  <div className="p-2 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0">
                    <CloudOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Working Offline
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Changes are saved locally and will auto-sync once you
                      reconnect.
                    </div>
                  </div>
                </>
              )}

              {syncStatus === "error" && (
                <>
                  <div className="p-2 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-0">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                      Sync Error
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {syncError || "Could not connect to Supabase."}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Guest Mode Promo Card */
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Guest Mode (Local Storage Only)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            Sync across your phone, tablet, and PC
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
            You are currently using LingoCards offline as a guest. Create a free
            account or sign in to automatically back up your cards and study
            seamlessly across all your devices.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateAuth}
              disabled={!isConfigured}
              className="w-full sm:w-auto justify-center py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-50 flex items-center"
            >
              Sign In or Create Account
            </button>
          </div>
        </div>
      )}

      {/* Local Storage Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-brand-500 shrink-0" />
          Local Storage & Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Decks
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {decks.length}
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Flashcards
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {totalCards}
            </div>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          Cards are stored with 0ms latency in your browser’s IndexedDB and
          mirrored to PostgreSQL whenever an internet connection is available.
        </p>
      </div>
    </div>
  );
};
