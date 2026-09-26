import React, { useState, useRef, useEffect } from 'react';
import { Play, MoreVertical, Edit2, Trash2, Download, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { type DeckWithStats } from '../types';

interface DeckCardProps {
  deck: DeckWithStats;
  onSelect: (deck: DeckWithStats) => void;
  onStartStudy: (deck: DeckWithStats) => void;
  onEdit: (deck: DeckWithStats) => void;
  onDelete: (deckId: number) => void;
  onExport: (deckId: number) => void;
}

const COLOR_MAP: Record<string, { bg: string; text: string; lightBg: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', lightBg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', lightBg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', lightBg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
};

export const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  onSelect,
  onStartStudy,
  onEdit,
  onDelete,
  onExport,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const theme = COLOR_MAP[deck.color] || COLOR_MAP.emerald;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const masteredPercent = deck.totalCards > 0 ? (deck.masteredCount / deck.totalCards) * 100 : 0;
  const learningPercent = deck.totalCards > 0 ? ((deck.learningCount + deck.reviewCount) / deck.totalCards) * 100 : 0;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Color Accent Line */}
      <div className={`h-1.5 w-full ${theme.bg}`} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {deck.targetLanguage}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                &rarr; {deck.nativeLanguage}
              </span>
            </div>

            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Deck Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-7 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20 animate-fade-in text-xs font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit(deck);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Deck
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      if (deck.id) onExport(deck.id);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      if (deck.id && confirm(`Are you sure you want to delete deck "${deck.title}" and all its ${deck.totalCards} cards?`)) {
                        onDelete(deck.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Deck
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div
            onClick={() => onSelect(deck)}
            className="cursor-pointer group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
          >
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1 line-clamp-1">
              {deck.title}
            </h3>
            {deck.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {deck.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats & Progress */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          {/* Card Counts */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <BookOpen className="w-3.5 h-3.5" />
              {deck.totalCards} card{deck.totalCards === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              {deck.masteredCount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5" title="Mastered">
                  <CheckCircle className="w-3 h-3" /> {deck.masteredCount}
                </span>
              )}
              {deck.dueCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium" title="Due for review">
                  <Clock className="w-3 h-3" /> {deck.dueCount} due
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {deck.totalCards > 0 ? (
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${masteredPercent}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Mastered: ${deck.masteredCount}`}
              />
              <div
                style={{ width: `${learningPercent}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Learning: ${deck.learningCount + deck.reviewCount}`}
              />
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic">No cards added yet</div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSelect(deck)}
              className="flex-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center"
            >
              View Cards
            </button>
            <button
              onClick={() => onStartStudy(deck)}
              disabled={deck.totalCards === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 rounded-xl shadow-sm shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Start Study Session"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Study
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
