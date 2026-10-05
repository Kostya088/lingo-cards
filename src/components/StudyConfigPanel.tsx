import React from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { type DeckWithStats, type Card, type StudyDirection, type StudyFilter } from '../types';

interface StudyConfigPanelProps {
  deck: DeckWithStats;
  allCards: Card[];
  direction: StudyDirection;
  filter: StudyFilter;
  shuffle: boolean;
  eligibleCount: number;
  onDirectionChange: (d: StudyDirection) => void;
  onFilterChange: (f: StudyFilter) => void;
  onShuffleChange: (s: boolean) => void;
  onStart: () => void;
  onExit: () => void;
}

export const StudyConfigPanel: React.FC<StudyConfigPanelProps> = ({
  deck,
  allCards,
  direction,
  filter,
  shuffle,
  eligibleCount,
  onDirectionChange,
  onFilterChange,
  onShuffleChange,
  onStart,
  onExit,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-7 shadow-xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {deck.targetLanguage} &rarr; {deck.nativeLanguage}
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1 truncate" title={deck.title}>
              Study: {deck.title}
            </h1>
          </div>
          <button
            onClick={onExit}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Cancel"
            aria-label="Cancel study session"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direction Toggle */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Study Direction
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onDirectionChange('front-to-back')}
              className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all ${
                direction === 'front-to-back'
                  ? 'border-slate-900 dark:border-slate-400 bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white ring-2 ring-slate-900/10 dark:ring-slate-400/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="truncate">{deck.targetLanguage}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{deck.nativeLanguage}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                See foreign word &rarr; Speak translation
              </p>
            </button>

            <button
              type="button"
              onClick={() => onDirectionChange('back-to-front')}
              className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all ${
                direction === 'back-to-front'
                  ? 'border-slate-900 dark:border-slate-400 bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white ring-2 ring-slate-900/10 dark:ring-slate-400/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="truncate">{deck.nativeLanguage}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{deck.targetLanguage}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                See translation &rarr; Speak foreign word
              </p>
            </button>
          </div>
        </div>

        {/* Cards Filter */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Cards to Include
          </label>
          <div className="space-y-2">
            <label
              className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                filter === 'all'
                  ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="radio"
                  name="studyFilter"
                  checked={filter === 'all'}
                  onChange={() => onFilterChange('all')}
                  className="text-slate-900 dark:text-white focus:ring-slate-500 shrink-0"
                />
                <span className="text-xs font-medium truncate">All Cards in Deck</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                {allCards.length} cards
              </span>
            </label>

            <label
              className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                filter === 'needs-review'
                  ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="radio"
                  name="studyFilter"
                  checked={filter === 'needs-review'}
                  onChange={() => onFilterChange('needs-review')}
                  className="text-slate-900 dark:text-white focus:ring-slate-500 shrink-0"
                />
                <span className="text-xs font-medium leading-tight">Needs Review / Due</span>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                {allCards.filter((c) => c.level === 0 || c.level === 1 || c.nextReviewDate <= Date.now()).length} cards
              </span>
            </label>

            <label
              className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                filter === 'unmastered'
                  ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="radio"
                  name="studyFilter"
                  checked={filter === 'unmastered'}
                  onChange={() => onFilterChange('unmastered')}
                  className="text-slate-900 dark:text-white focus:ring-slate-500 shrink-0"
                />
                <span className="text-xs font-medium leading-tight">Unmastered Words</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                {allCards.filter((c) => c.level < 3).length} cards
              </span>
            </label>
          </div>
        </div>

        {/* Shuffle Option */}
        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold">Shuffle card order</span>
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => onShuffleChange(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </div>

        {/* Start CTA */}
        <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onExit}
            className="w-full sm:w-auto px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            disabled={eligibleCount === 0}
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl shadow-lg shadow-brand-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            Start Learning ({eligibleCount} Cards)
          </button>
        </div>
      </div>
    </div>
  );
};
