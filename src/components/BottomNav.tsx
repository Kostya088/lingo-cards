import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Clock, User as UserIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllDecksWithStats } from '../db/db';

interface BottomNavProps {
  hideBottomNav?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ hideBottomNav }) => {
  const { user, syncStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [totalDue, setTotalDue] = useState(0);

  // Fetch due cards count on path change or mount
  useEffect(() => {
    let isMounted = true;
    async function fetchDueCount() {
      try {
        const decks = await getAllDecksWithStats();
        if (isMounted) {
          const due = decks.reduce((acc, d) => acc + d.dueCount, 0);
          setTotalDue(due);
        }
      } catch (e) {
        console.error('Failed to get due count:', e);
      }
    }
    fetchDueCount();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Hide BottomNav if requested by child screen (e.g. during active study review)
  if (hideBottomNav) {
    return null;
  }

  const path = location.pathname;

  // Hide BottomNav on editor and auth screens
  const isEditorOrAuth =
    path.startsWith('/decks/new') ||
    path.includes('/edit') ||
    path.includes('/cards/') ||
    path.includes('/bulk-add') ||
    path === '/auth';

  if (isEditorOrAuth) {
    return null;
  }

  const isDecksActive = path === '/' || /^\/deck\/[^/]+$/.test(path);
  const isStudyActive = path === '/study/due' || path.endsWith('/study');
  const isProfileActive = path === '/profile';

  const handleStudyDueClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/study/due');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe">
      <div className="grid grid-cols-3 h-16 max-w-lg mx-auto px-4 items-center">
        {/* Tab 1: Decks */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            isDecksActive
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          aria-label="Decks"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Decks</span>
        </Link>

        {/* Tab 2: Study Due */}
        <button
          onClick={handleStudyDueClick}
          className={`flex flex-col items-center justify-center gap-1 py-1 relative transition-colors ${
            isStudyActive
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
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            isProfileActive
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
        </Link>
      </div>
    </nav>
  );
};
