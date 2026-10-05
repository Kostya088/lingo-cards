import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { getDeckById, createDeck, updateDeck } from '../db';
import { type DeckWithStats } from '../types';

const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-600', ring: 'ring-emerald-500' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-600', ring: 'ring-blue-500' },
  { id: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-600', ring: 'ring-indigo-500' },
  { id: 'purple', bg: 'bg-purple-500', border: 'border-purple-600', ring: 'ring-purple-500' },
  { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-600', ring: 'ring-rose-500' },
  { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-600', ring: 'ring-amber-500' },
];

export const DeckEditorScreen: React.FC = () => {
  const { deckId } = useParams<{ deckId?: string }>();
  const navigate = useNavigate();

  const [existingDeck, setExistingDeck] = useState<DeckWithStats | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [color, setColor] = useState('emerald');
  const [isLoading, setIsLoading] = useState(Boolean(deckId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(deckId);

  useEffect(() => {
    let isMounted = true;
    if (!deckId) return;

    async function loadDeck() {
      try {
        setIsLoading(true);
        const deck = await getDeckById(deckId!);
        if (!isMounted) return;
        if (deck) {
          setExistingDeck(deck);
          setTitle(deck.title);
          setDescription(deck.description || '');
          setTargetLanguage(deck.targetLanguage || '');
          setNativeLanguage(deck.nativeLanguage || 'English');
          setColor(deck.color || 'emerald');
        }
      } catch (err) {
        console.error('Failed to load deck:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDeck();
    return () => {
      isMounted = false;
    };
  }, [deckId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a deck title.');
      return;
    }
    if (!targetLanguage.trim()) {
      setError('Please specify the language you are learning.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && existingDeck) {
        await updateDeck(existingDeck.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          targetLanguage: targetLanguage.trim(),
          nativeLanguage: nativeLanguage.trim() || 'English',
          color,
        });
        navigate(`/decks/${existingDeck.id}`);
      } else {
        const newDeckId = await createDeck({
          title: title.trim(),
          description: description.trim() || undefined,
          targetLanguage: targetLanguage.trim(),
          nativeLanguage: nativeLanguage.trim() || 'English',
          color,
        });
        navigate(`/decks/${newDeckId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save deck.');
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

  return (
    <div className="flex-1 flex flex-col -mx-4 sm:mx-0 animate-fade-in">
      {/* Top Header with Dynamic Island & Notch Clearance */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 header-safe-top pb-3 px-4 sm:px-0 sm:border-0 sm:bg-transparent sm:static">
        <div className="flex items-center justify-between max-w-xl mx-auto w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate(isEditing ? `/decks/${deckId}` : '/');
                }
              }}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-heading font-bold text-slate-900 dark:text-white leading-tight truncate">
                {isEditing ? 'Edit Deck' : 'Create New Deck'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isEditing ? 'Update deck settings and languages' : 'Set up a new vocabulary deck'}
              </p>
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
            <div className="p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Deck Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Deck Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Italian Essentials, French B2 Verbs..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Daily conversational vocabulary and phrases"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-normal transition-all"
            />
          </div>

          {/* Languages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Language *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Italian, Spanish, German"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Native Language (Translation)
              </label>
              <input
                type="text"
                placeholder="e.g. English, Ukrainian"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium transition-all"
              />
            </div>
          </div>

          {/* Color theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${c.bg} transition-all flex items-center justify-center text-white ${
                    color === c.id
                      ? `ring-2 ring-offset-2 ${c.ring} dark:ring-offset-slate-900 scale-105 shadow-md`
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  aria-label={`Select ${c.id} color`}
                >
                  {color === c.id && <Check className="w-4 h-4 stroke-[2.5]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 sm:pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate(isEditing ? `/decks/${deckId}` : '/');
                }
              }}
              className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/25 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Deck' : 'Create Deck'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
