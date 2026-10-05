import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { getDeckById, createCardsBulk } from '../db';
import { type DeckWithStats } from '../types';

export const BulkAddScreen: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<DeckWithStats | null>(null);
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState<'auto' | '-' | ',' | ':' | '\t'>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!deckId) return;

    async function loadDeck() {
      try {
        setIsLoading(true);
        const currentDeck = await getDeckById(deckId!);
        if (!isMounted) return;
        setDeck(currentDeck);
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

  // Parse text live
  const parsedCards = useMemo(() => {
    if (!text.trim()) return [];

    const lines = text.split('\n');
    const results: Array<{ front: string; back: string; notes?: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      let delimiter = separator;
      if (delimiter === 'auto') {
        if (line.includes('\t')) delimiter = '\t';
        else if (line.includes(' - ')) delimiter = '-';
        else if (line.includes(' : ')) delimiter = ':';
        else if (line.includes('-')) delimiter = '-';
        else if (line.includes(':')) delimiter = ':';
        else if (line.includes(',')) delimiter = ',';
        else delimiter = '-';
      }

      let parts: string[] = [];
      if (delimiter === '-') {
        if (line.includes(' - ')) {
          parts = line.split(' - ');
        } else {
          parts = line.split('-');
        }
      } else if (delimiter === ':') {
        if (line.includes(' : ')) {
          parts = line.split(' : ');
        } else {
          parts = line.split(':');
        }
      } else {
        parts = line.split(delimiter);
      }

      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts[1].trim();
        const notes = parts.slice(2).join(' ').trim() || undefined;

        if (front && back) {
          results.push({ front, back, notes });
        }
      }
    }

    return results;
  }, [text, separator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId) return;
    if (parsedCards.length === 0) {
      setError('No valid flashcards found. Please check your text format.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createCardsBulk(deckId, parsedCards);
      navigate(`/decks/${deckId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to bulk import cards.');
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
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 header-safe-top pb-3 px-4 sm:px-0 sm:border-0 sm:bg-transparent sm:static">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/decks/${deckId}`)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Back to deck"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Quick Bulk Add Flashcards
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

      {/* Main Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-0 sm:my-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-800 sm:p-6 sm:shadow-sm space-y-5"
        >
          {error && (
            <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Separator selector */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Delimiter:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(['auto', '-', ',', ':', '\t'] as const).map((sep) => (
                <button
                  key={sep}
                  type="button"
                  onClick={() => setSeparator(sep)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    separator === sep
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sep === 'auto' ? 'Auto' : sep === '\t' ? 'Tab' : sep}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              rows={8}
              autoFocus
              placeholder={`Paste your vocabulary list here, one per line:\n\nhello - ciao\napple - mela\ngood morning - buongiorno\nthank you - grazie`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Preview Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <span>Preview Parsed Cards</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">
                {parsedCards.length} detected
              </span>
            </div>

            {parsedCards.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
                Paste lines formatted like <code className="text-brand-500">word - translation</code> to preview cards
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                {parsedCards.slice(0, 20).map((card, idx) => (
                  <div key={idx} className="p-2.5 px-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {card.front}
                      </span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {card.back}
                      </span>
                    </div>
                    {card.notes && (
                      <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                        {card.notes}
                      </span>
                    )}
                  </div>
                ))}
                {parsedCards.length > 20 && (
                  <div className="p-2 text-center text-xs text-slate-400 italic bg-slate-100/50 dark:bg-slate-800/40">
                    ...and {parsedCards.length - 20} more
                  </div>
                )}
              </div>
            )}
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
              disabled={isSubmitting || parsedCards.length === 0}
              className="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Importing...' : `Add ${parsedCards.length} Cards`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
