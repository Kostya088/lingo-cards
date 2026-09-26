import React, { useState, useMemo } from 'react';
import { Plus, Search, Layers, Sparkles, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { type DeckWithStats } from '../types';
import { DeckCard } from './DeckCard';

interface DeckListProps {
  decks: DeckWithStats[];
  onSelectDeck: (deck: DeckWithStats) => void;
  onStartStudy: (deck: DeckWithStats) => void;
  onOpenCreateModal: () => void;
  onEditDeck: (deck: DeckWithStats) => void;
  onDeleteDeck: (deckId: number) => void;
  onExportDeck: (deckId: number) => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onSelectDeck,
  onStartStudy,
  onOpenCreateModal,
  onEditDeck,
  onDeleteDeck,
  onExportDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Overall collection stats
  const totalCards = useMemo(() => decks.reduce((acc, d) => acc + d.totalCards, 0), [decks]);
  const totalMastered = useMemo(() => decks.reduce((acc, d) => acc + d.masteredCount, 0), [decks]);
  const totalDue = useMemo(() => decks.reduce((acc, d) => acc + d.dueCount, 0), [decks]);

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const query = searchQuery.toLowerCase();
    return decks.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.targetLanguage.toLowerCase().includes(query) ||
        (d.description && d.description.toLowerCase().includes(query))
    );
  }, [decks, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Stats Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Smart Spaced Repetition Learning
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Master New Languages
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Speak the translation aloud before flipping, self-evaluate your recall, and let our adaptive algorithm prioritize the words you need most.
            </p>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create New Deck
          </button>
        </div>

        {/* Global Stats bar */}
        {decks.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Cards</p>
                <p className="text-base sm:text-lg font-bold text-white">{totalCards}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-emerald-300/80 uppercase tracking-wider">Mastered</p>
                <p className="text-base sm:text-lg font-bold text-emerald-400">{totalMastered}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-300/80 uppercase tracking-wider">Due For Review</p>
                <p className="text-base sm:text-lg font-bold text-amber-400">{totalDue}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header controls (Search & Title) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Your Decks</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {decks.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a deck to manage flashcards or start studying
          </p>
        </div>

        {decks.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search decks or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Decks Grid or Empty State */}
      {decks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white">
              No Decks Created Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create your first deck (for example to learn Italian, French, Spanish, etc.) and start adding flashcards!
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Deck
          </button>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
          No decks match your search &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onSelect={onSelectDeck}
              onStartStudy={onStartStudy}
              onEdit={onEditDeck}
              onDelete={onDeleteDeck}
              onExport={onExportDeck}
            />
          ))}
        </div>
      )}
    </div>
  );
};
