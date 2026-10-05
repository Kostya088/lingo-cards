import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { getDeckById, getCardById, createCard, updateCard } from '../db';
import { type DeckWithStats, type Card } from '../types';

export const CardEditorScreen: React.FC = () => {
  const { deckId, cardId } = useParams<{ deckId: string; cardId?: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<DeckWithStats | null>(null);
  const [existingCard, setExistingCard] = useState<Card | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(cardId);

  // Load deck & existing card if editing
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!deckId) return;
      try {
        setIsLoading(true);
        const currentDeck = await getDeckById(deckId);
        if (!isMounted) return;
        setDeck(currentDeck);

        if (cardId) {
          const card = await getCardById(cardId);
          if (!isMounted) return;
          if (card) {
            setExistingCard(card);
            setFront(card.front);
            setBack(card.back);
            setNotes(card.notes || '');
          }
        }
      } catch (err) {
        console.error('Failed to load card editor data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [deckId, cardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId) return;

    if (!front.trim()) {
      setError(`Front text is required.`);
      return;
    }
    if (!back.trim()) {
      setError(`Translation is required.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && existingCard) {
        await updateCard(existingCard.id, {
          front: front.trim(),
          back: back.trim(),
          notes: notes.trim() || undefined,
        });
      } else {
        await createCard(
          deckId,
          front.trim(),
          back.trim(),
          notes.trim() || undefined
        );
      }

      navigate(`/decks/${deckId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save flashcard.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const targetLang = deck?.targetLanguage || 'Target Word';
  const nativeLang = deck?.nativeLanguage || 'Translation';

  return (
    <div className="flex-1 flex flex-col -mx-4 sm:mx-0">
      {/* Top Header with Notch Clearance */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sm:backdrop-blur-none border-b border-slate-200 dark:border-slate-800 header-safe-top pb-3 px-4 sm:px-0 sm:border-0 sm:bg-transparent sm:dark:bg-transparent sm:static">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/decks/${deckId}`)}
              className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all shrink-0"
              aria-label="Back to deck"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-heading font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Flashcard' : 'Add Flashcard'}
              </h1>
              {deck && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deck.title} ({targetLang} &rarr; {nativeLang})
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-0 sm:my-6 pb-safe">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm sm:shadow-xl space-y-4 sm:space-y-5"
        >
          {error && (
            <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Front Word */}
          <div>
            <label htmlFor="front-input" className="flex text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 items-center justify-between">
              <span>Card Front ({targetLang}) *</span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-normal">
                Prompt during review
              </span>
            </label>
            <input
              id="front-input"
              type="text"
              required
              autoFocus
              placeholder={`e.g. buongiorno, la mela, s'il vous plaît...`}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium transition-all"
            />
          </div>

          {/* Back Translation */}
          <div>
            <label htmlFor="back-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Card Back ({nativeLang}) *
            </label>
            <input
              id="back-input"
              type="text"
              required
              placeholder="e.g. good morning, the apple, please..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium transition-all"
            />
          </div>

          {/* Notes / Example */}
          <div>
            <label htmlFor="notes-input" className="flex text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 items-center gap-1.5">
              <span>Context & Notes (Optional)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </label>
            <textarea
              id="notes-input"
              rows={3}
              placeholder="e.g. Buongiorno a tutti! (Good morning everyone!)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-normal resize-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate(`/decks/${deckId}`)}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Card' : 'Save Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
