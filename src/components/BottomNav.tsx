import React from 'react';
import { Layers, Clock, User as UserIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type DeckWithStats } from '../types';

interface BottomNavProps {
  currentView: 'deck-list' | 'deck-detail' | 'study-session' | 'session-summary' | 'profile';
  decks: DeckWithStats[];
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onStartDueStudy: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  decks,
  onNavigateHome,
  onNavigateProfile,
  onStartDueStudy,
}) => {
  const { user, syncStatus } = useAuth();

  const totalDue = decks.reduce((acc, d) => acc + d.dueCount, 0);

  // Hide bottom nav during active full-screen study session to maximize focus
  if (currentView === 'study-session') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe">
      <div className="grid grid-cols-3 h-16 max-w-lg mx-auto px-4 items-center">
        {/* Tab 1: Decks */}
        <button
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentView === 'deck-list' || currentView === 'deck-detail'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          aria-label="Decks"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Decks</span>
        </button>

        {/* Tab 2: Study Due */}
        <button
          onClick={onStartDueStudy}
          className={`flex flex-col items-center justify-center gap-1 py-1 relative transition-colors ${
            currentView === 'session-summary'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          aria-label="Study Due Cards"
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {totalDue > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white min-w-[16px] text-center shadow-sm">
                {totalDue > 99 ? '99+' : totalDue}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">Study Due</span>
        </button>

        {/* Tab 3: Account / Profile */}
        <button
          onClick={onNavigateProfile}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentView === 'profile'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          aria-label="Account Profile"
        >
          <div className="relative">
            <UserIcon className="w-5 h-5" />
            {/* Sync Status Dot Indicator */}
            {user && (
              <span className="absolute -bottom-0.5 -right-1 flex h-2.5 w-2.5">
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-2.5 h-2.5 text-brand-500 animate-spin" />
                ) : syncStatus === 'synced' ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                ) : syncStatus === 'offline' ? (
                  <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                ) : null}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">
            {user ? 'Account' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
