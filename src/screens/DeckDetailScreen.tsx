import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Loader2,
  ArrowLeft,
  Play,
  Plus,
  FileText,
  Search,
  Edit2,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Download,
} from 'lucide-react';
import { getDeckById, getDeckCards, deleteCard, exportDeckAsText } from '../db';
import { type MasteryLevel } from '../types';
import { CardList } from '../components/CardList';

export const DeckDetailScreen: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  // Reactive Data State
  const deck = useLiveQuery(() => (deckId ? getDeckById(deckId) : undefined), [deckId]);
  const cards = useLiveQuery(() => (deckId ? getDeckCards(deckId) : []), [deckId]) ?? [];
  const isLoading = deck === undefined && !!deckId;

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | MasteryLevel>('all');

  const handleDeleteCard = async (cardId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this flashcard?');
    if (!confirmed) return;

    try {
      await deleteCard(cardId);
    } catch (err) {
      console.error('Failed to delete card:', err);
      alert('Failed to delete card. Please try again.');
    }
  };

  const handleExportDeck = async () => {
    if (!deckId) return;
    try {
      const text = await exportDeckAsText(deckId);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = deck?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'deck';
      link.href = url;
      link.download = `${safeTitle}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Derived State (Filters & Stats)
  const now = Date.now();
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (selectedLevelFilter !== 'all' && card.level !== selectedLevelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          card.front.toLowerCase().includes(q) ||
          card.back.toLowerCase().includes(q) ||
          card.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cards, searchQuery, selectedLevelFilter]);

  const dueCount = useMemo(() => cards.filter((c) => c.nextReviewDate <= now).length, [cards, now]);
  const masteredCount = useMemo(() => cards.filter((c) => c.level === 3).length, [cards]);
  const learningCount = useMemo(() => cards.filter((c) => c.level === 1 || c.level === 2).length, [cards]);
  const newCount = useMemo(() => cards.filter((c) => c.level === 0).length, [cards]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
          Deck Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The requested deck could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          Return to All Decks
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 animate-fade-in">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          All Decks
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/deck/${deckId}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
            title="Edit Deck Settings"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Deck</span>
          </button>
          <button
            onClick={handleExportDeck}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
            title="Export Deck as Text"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => navigate(`/deck/${deckId}/bulk-add`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Bulk Add
          </button>
          <button
            onClick={() => navigate(`/deck/${deckId}/cards/new`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </button>
          <button
            onClick={() => navigate(`/deck/${deckId}/study`)}
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No flashcards in this deck yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add vocabulary words one by one or paste a list with Quick Bulk Add.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => navigate(`/deck/${deckId}/bulk-add`)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Bulk Paste Cards
              </button>
              <button
                onClick={() => navigate(`/deck/${deckId}/cards/new`)}
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
          <CardList 
            cards={filteredCards} 
            onEditCard={(card) => navigate(`/deck/${deckId}/cards/${card.id}/edit`)}
            onDeleteCard={handleDeleteCard} 
          />
        )}
      </div>
    </div>
  );
};
