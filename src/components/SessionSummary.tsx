import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  Layers,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import { type SessionStats } from '../types';

interface SessionSummaryProps {
  stats: SessionStats;
  onRetryDifficult: () => void;
  onReturnToDeck: () => void;
  onReturnHome: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  stats,
  onRetryDifficult,
  onReturnToDeck,
  onReturnHome,
}) => {
  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const totalResponses = stats.badCount + stats.mediumCount + stats.goodCount;
  const accuracyRate =
    totalResponses > 0 ? Math.round(((stats.goodCount + stats.mediumCount * 0.5) / totalResponses) * 100) : 100;

  const durationMin = Math.round(stats.durationMs / 60000);
  const durationSec = Math.round((stats.durationMs % 60000) / 1000);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-7 shadow-xl text-center space-y-5 sm:space-y-6">
        {/* Celebration Trophy */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Session Complete!
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white truncate" title={stats.deckTitle}>
            Great Work on {stats.deckTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You completed this learning session and practiced your recall
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Studied</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.totalCardsStudied}
            </p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">cards</p>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Accuracy</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {accuracyRate}%
            </p>
            <p className="text-[9px] sm:text-[10px] text-emerald-600/70 dark:text-emerald-400/70">recall rate</p>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Time</p>
            <p className="text-base sm:text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5 flex items-center justify-center gap-0.5 sm:gap-1">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>{durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`}</span>
            </p>
            <p className="text-[9px] sm:text-[10px] text-blue-600/70 dark:text-blue-400/70">spent</p>
          </div>
        </div>

        {/* Breakdown by Rating */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300 text-left">
            Recall Performance Breakdown:
          </p>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-left">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white leading-tight">{stats.goodCount}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-none">Good</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white leading-tight">{stats.mediumCount}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-none">Medium</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white leading-tight">{stats.badCount}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-none">Bad</p>
              </div>
            </div>
          </div>

          {stats.newMasteredCount > 0 && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{stats.newMasteredCount} word{stats.newMasteredCount > 1 ? 's' : ''} promoted to Mastered!</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {stats.badCount + stats.mediumCount > 0 && (
            <button
              onClick={onRetryDifficult}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Practice Needs-Review Words Again
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onReturnToDeck}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Return to Deck
            </button>

            <button
              onClick={onReturnHome}
              className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              All Decks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
