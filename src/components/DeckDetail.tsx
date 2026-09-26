import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Plus,
  FileText,
  Download,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { type DeckWithStats, type Card, type MasteryLevel } from '../types';

interface DeckDetailProps {
  deck: DeckWithStats;
  cards: Card[];
  onBack: () => void;
  onStartStudy: (deck: DeckWithStats) => void;
  onAddCard: () => void;
  onBulkAddCards: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: number) => void;
  onExportDeck: (deckId: number) => void;
}

const LEVEL_LABELS: Record<MasteryLevel, { label: string; bg: string; text: string }> = {
  0: { label: 'New', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  1: { label: 'Learning', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
  2: { label: 'Review', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
  3: { label: 'Mastered', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
};

export const DeckDetail: React.FC<DeckDetailProps> = ({
  deck,
  cards,
  onBack,
  onStartStudy,
  onAddCard,
  onBulkAddCards,
  onEditCard,
  onDeleteCard,
  onExportDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | MasteryLevel>('all');

  const now = Date.now();

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Level filter
      if (selectedLevelFilter !== 'all' && card.level !== selectedLevelFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFront = card.front.toLowerCase().includes(q);
        const matchesBack = card.back.toLowerCase().includes(q);
        const matchesNotes = card.notes?.toLowerCase().includes(q);
        return matchesFront || matchesBack || matchesNotes;
      }
      return true;
    });
  }, [cards, searchQuery, selectedLevelFilter]);

  const dueCount = useMemo(() => cards.filter((c) => c.nextReviewDate <= now).length, [cards, now]);
  const masteredCount = useMemo(() => cards.filter((c) => c.level === 3).length, [cards]);
  const learningCount = useMemo(() => cards.filter((c) => c.level === 1 || c.level === 2).length, [cards]);
  const newCount = useMemo(() => cards.filter((c) => c.level === 0).length, [cards]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          All Decks
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => deck.id && onExportDeck(deck.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Export this deck to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={onBulkAddCards}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Bulk Add
          </button>
          <button
            onClick={onAddCard}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </button>
          <button
            onClick={() => onStartStudy(deck)}
            disabled={cards.length === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl shadow-md shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Study Deck
          </button>
        </div>
      </div>

      {/* Deck Header & Stat Tiles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {deck.targetLanguage} &rarr; {deck.nativeLanguage}
              </span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {deck.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{cards.length} cards</p>
            </div>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Mastered</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{masteredCount}</p>
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Due For Review</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{dueCount}</p>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Learning / New</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{learningCount + newCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Table & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {(['all', 0, 1, 2, 3] as const).map((lvl) => (
              <button
                key={String(lvl)}
                onClick={() => setSelectedLevelFilter(lvl as any)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedLevelFilter === lvl
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {lvl === 'all'
                  ? `All (${cards.length})`
                  : lvl === 0
                  ? `New (${newCount})`
                  : lvl === 1
                  ? `Learning`
                  : lvl === 2
                  ? `Review`
                  : `Mastered (${masteredCount})`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Card Table / List */}
        {cards.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No flashcards in this deck yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add vocabulary words one by one or paste a list with Quick Bulk Add.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={onBulkAddCards}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Bulk Paste Cards
              </button>
              <button
                onClick={onAddCard}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-sm transition-all"
              >
                Add Single Card
              </button>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No cards found matching your search and filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {filteredCards.map((card) => {
              const lvlInfo = LEVEL_LABELS[card.level] || LEVEL_LABELS[0];
              const isDue = card.nextReviewDate <= now;

              return (
                <div
                  key={card.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                >
                  {/* Left: Front & Back */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {card.front}
                      </span>
                      <span className="text-xs text-slate-400 font-normal">&rarr;</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {card.back}
                      </span>
                    </div>

                    {card.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-1">
                        &ldquo;{card.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Middle: Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvlInfo.bg} ${lvlInfo.text}`}>
                      {lvlInfo.label}
                    </span>
                    {isDue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                        Due Now
                      </span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditCard(card)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit card"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => card.id && onDeleteCard(card.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
