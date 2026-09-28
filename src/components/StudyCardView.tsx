import React from 'react';
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
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Session Progress Bar & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {deckTitle}
            </span>
            {isRetry && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" />
                Retry Word
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Card <strong className="text-slate-900 dark:text-white">{currentIndex + 1}</strong> of {totalCards}
            </span>
            <button
              onClick={onExit}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Exit study session (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 transition-all duration-300"
          />
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div className="flip-card-container w-full min-h-[320px] sm:min-h-[380px] h-[48vh] max-h-[480px]">
        <div
          onClick={onFlip}
          className={`flip-card-inner h-full w-full cursor-pointer select-none touch-manipulation ${
            isFlipped ? 'is-flipped' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="flip-card-front bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-8 flex flex-col justify-between overflow-hidden">
            {/* Top info */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="uppercase tracking-wider text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {frontLangLabel}
              </span>
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                Tap or Space to flip
              </span>
            </div>

            {/* Center: Foreign Word */}
            <div className="text-center my-auto space-y-3 py-2">
              <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight break-words max-w-full px-2">
                {frontText}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                <span>🗣️ Speak translation aloud</span>
              </div>
            </div>

            {/* Bottom prompt */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tap card to reveal answer</span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="flip-card-back bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl p-5 sm:p-8 flex flex-col justify-between overflow-hidden">
            {/* Top info */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="uppercase tracking-wider text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {backLangLabel}
              </span>
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                Answer Revealed
              </span>
            </div>

            {/* Center: Translation + Notes */}
            <div className="text-center my-auto space-y-2 py-2">
              <div className="text-xs text-slate-400 font-medium line-through">
                {direction === 'front-to-back' ? activeFrontWord : activeBackWord}
              </div>
              <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight break-words max-w-full px-2">
                {backText}
              </h2>
              {backNotes && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic max-w-md mx-auto line-clamp-3">
                  &ldquo;{backNotes}&rdquo;
                </p>
              )}
            </div>

            {/* Bottom info */}
            <div className="text-center text-xs text-slate-400">
              Rate your recall below
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
        {!isFlipped ? (
          <button
            onClick={onFlip}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Turn Over Card <span className="hidden sm:inline text-xs opacity-75 font-normal">(Space)</span>
          </button>
        ) : (
          <div className="space-y-2.5 animate-fade-in">
            <p className="text-xs font-semibold text-center text-slate-500 dark:text-slate-400">
              How was your spoken recall?
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* BAD (1) */}
              <button
                onClick={() => onRate('bad')}
                className="py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-center transition-all active:scale-95 touch-manipulation group"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Bad</span>
                </div>
                <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 truncate">
                  Forgot <kbd className="hidden sm:inline font-mono font-bold">(1)</kbd>
                </p>
              </button>

              {/* MEDIUM (2) */}
              <button
                onClick={() => onRate('medium')}
                className="py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-center transition-all active:scale-95 touch-manipulation group"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Medium</span>
                </div>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 truncate">
                  Hesitated <kbd className="hidden sm:inline font-mono font-bold">(2)</kbd>
                </p>
              </button>

              {/* GOOD (3) */}
              <button
                onClick={() => onRate('good')}
                className="py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center transition-all active:scale-95 touch-manipulation group"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Good</span>
                </div>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 truncate">
                  Recalled <kbd className="hidden sm:inline font-mono font-bold">(3)</kbd>
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
