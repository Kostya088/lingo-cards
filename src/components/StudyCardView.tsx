import React, { useEffect } from 'react';
import { X, RotateCw, CheckCircle, HelpCircle, XCircle, RefreshCw } from 'lucide-react';
import { type Rating, type StudyDirection } from '../types';

interface StudyCardViewProps {
  deckTitle: string;
  isRetry: boolean;
  currentIndex: number;
  totalCards: number;
  progressPercent: number;
  isFlipped: boolean;
  frontText: string;
  backText: string;
  backNotes?: string;
  frontLangLabel: string;
  backLangLabel: string;
  activeFrontWord: string;
  activeBackWord: string;
  direction: StudyDirection;
  onFlip: () => void;
  onRate: (rating: Rating) => void;
  onExit: () => void;
}

export const StudyCardView: React.FC<StudyCardViewProps> = ({
  deckTitle,
  isRetry,
  currentIndex,
  totalCards,
  progressPercent,
  isFlipped,
  frontText,
  backText,
  backNotes,
  frontLangLabel,
  backLangLabel,
  activeFrontWord,
  activeBackWord,
  direction,
  onFlip,
  onRate,
  onExit,
}) => {
  // Prevent any document scrolling, gestures or bounce on physical devices during active study
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-hidden overscroll-none select-none flex flex-col pt-safe pb-safe pl-safe pr-safe animate-fade-in">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between h-full min-h-0 px-4 sm:px-6 py-2 sm:py-3 gap-2 sm:gap-3">
        {/* Top Session Progress Bar & Controls (Sticks to top) */}
        <div className="shrink-0 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={deckTitle}>
                {deckTitle}
              </span>
              {isRetry && (
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0">
                  <RefreshCw className="w-2.5 h-2.5" />
                  Retry
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Card <strong className="text-slate-900 dark:text-white">{currentIndex + 1}</strong> of {totalCards}
              </span>
              <button
                onClick={onExit}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Exit study session (Esc)"
                aria-label="Exit study session"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 transition-all duration-300"
            />
          </div>
        </div>

        {/* 3D Flashcard Container (Centered, proportional, fills remaining vertical height) */}
        <div className="flex-1 w-full min-h-0 flex flex-col my-1 sm:my-2">
          <div className="flip-card-container w-full h-full flex-1 min-h-0">
            <div
              onClick={onFlip}
              className={`flip-card-inner h-full w-full cursor-pointer select-none touch-manipulation ${
                isFlipped ? 'is-flipped' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="flip-card-front bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-7 flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl h-full">
                {/* Top info */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium gap-1 shrink-0">
                  <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                    {frontLangLabel}
                  </span>
                  <span className="text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                    Tap or Space
                  </span>
                </div>

                {/* Center: Foreign Word */}
                <div className="text-center my-auto space-y-2 sm:space-y-3 py-2 flex-1 flex flex-col justify-center items-center">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight break-words max-w-full px-1">
                    {frontText}
                  </h2>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-semibold">
                    <span>🗣️ Speak aloud</span>
                  </div>
                </div>

                {/* Bottom prompt */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-400 shrink-0">
                  <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Tap to flip</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="flip-card-back bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl p-4 sm:p-7 flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl h-full">
                {/* Top info */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium gap-1 shrink-0">
                  <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                    {backLangLabel}
                  </span>
                  <span className="text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold shrink-0">
                    Revealed
                  </span>
                </div>

                {/* Center: Translation + Notes */}
                <div className="text-center my-auto space-y-1.5 sm:space-y-2 py-2 flex-1 flex flex-col justify-center items-center">
                  <div className="text-[11px] sm:text-xs text-slate-400 font-medium line-through">
                    {direction === 'front-to-back' ? activeFrontWord : activeBackWord}
                  </div>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight break-words max-w-full px-1">
                    {backText}
                  </h2>
                  {backNotes && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic max-w-md mx-auto line-clamp-3 sm:line-clamp-4">
                      &ldquo;{backNotes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Bottom info */}
                <div className="text-center text-[11px] sm:text-xs text-slate-400 shrink-0">
                  Rate your recall below
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls (Pinned to bottom - fixed matching height to eliminate layout shift) */}
        <div className="shrink-0 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 shadow-sm h-[86px] sm:h-[92px] flex flex-col justify-center overflow-hidden">
          {!isFlipped ? (
            <div className="flex flex-col justify-between h-full space-y-1 sm:space-y-1.5 animate-fade-in">
              <p className="text-[11px] sm:text-xs font-semibold text-center text-slate-500 dark:text-slate-400 truncate leading-tight">
                Recall the word, then flip to check
              </p>
              <button
                onClick={onFlip}
                className="w-full flex-1 min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2"
              >
                <RotateCw className="w-5 h-5 shrink-0" />
                <span>Turn Over Card</span>
                <span className="hidden sm:inline text-xs opacity-75 font-normal">(Space)</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full space-y-1 sm:space-y-1.5 animate-fade-in">
              <p className="text-[11px] sm:text-xs font-semibold text-center text-slate-500 dark:text-slate-400 truncate leading-tight">
                How was your spoken recall?
              </p>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 flex-1 min-h-[48px]">
                {/* BAD (1) */}
                <button
                  onClick={() => onRate('bad')}
                  className="flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 min-h-[48px] rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-center transition-all active:scale-95 touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-1 font-bold text-xs sm:text-sm leading-tight">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>Bad</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 truncate leading-none">
                    Forgot <kbd className="hidden sm:inline font-mono font-bold">(1)</kbd>
                  </p>
                </button>

                {/* MEDIUM (2) */}
                <button
                  onClick={() => onRate('medium')}
                  className="flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 min-h-[48px] rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-center transition-all active:scale-95 touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-1 font-bold text-xs sm:text-sm leading-tight">
                    <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Medium</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 truncate leading-none">
                    Hesitated <kbd className="hidden sm:inline font-mono font-bold">(2)</kbd>
                  </p>
                </button>

                {/* GOOD (3) */}
                <button
                  onClick={() => onRate('good')}
                  className="flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 min-h-[48px] rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center transition-all active:scale-95 touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-1 font-bold text-xs sm:text-sm leading-tight">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Good</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 truncate leading-none">
                    Recalled <kbd className="hidden sm:inline font-mono font-bold">(3)</kbd>
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
