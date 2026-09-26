import React, { useState, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBulk: (cards: Array<{ front: string; back: string; notes?: string }>) => Promise<void>;
  targetLanguage?: string;
  nativeLanguage?: string;
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({
  isOpen,
  onClose,
  onSaveBulk,
  targetLanguage = 'Target Word',
  nativeLanguage = 'Translation',
}) => {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState<'auto' | '-' | ',' | ':' | '\t'>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        // split on either ' - ' or '-'
        parts = line.includes(' - ') ? line.split(' - ') : line.split('-');
      } else if (delimiter === ':') {
        parts = line.includes(' : ') ? line.split(' : ') : line.split(':');
      } else {
        parts = line.split(delimiter);
      }

      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts[1].trim();
        const notes = parts.slice(2).join(' - ').trim();

        if (front && back) {
          results.push({
            front,
            back,
            notes: notes || undefined,
          });
        }
      }
    }

    return results;
  }, [text, separator]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCards.length === 0) {
      setError('No valid flashcards found. Please check your text format.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSaveBulk(parsedCards);
      setText('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to bulk import cards.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Quick Bulk Add Flashcards
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste a vocabulary list to add multiple flashcards at once
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    separator === sep
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sep === 'auto' ? 'Auto-detect' : sep === '\t' ? 'Tab' : sep}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Format: <strong>{targetLanguage}</strong> &rarr; <strong>{nativeLanguage}</strong> (optional: context note)</span>
            </div>
            <textarea
              rows={7}
              placeholder={`Paste your list here, one per line. Examples:\nciao - hello\ngrazie - thank you\narrivederci - goodbye\nbuongiorno : good morning : formal greeting`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full font-mono text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-y"
            />
          </div>

          {/* Live Preview */}
          {parsedCards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                  <CheckCircle className="w-4 h-4" />
                  Ready to import {parsedCards.length} flashcard{parsedCards.length > 1 ? 's' : ''}:
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {parsedCards.slice(0, 15).map((c, i) => (
                  <div key={i} className="px-3.5 py-2 text-xs flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[45%]">
                      {c.front}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[45%]">
                      {c.back}
                      {c.notes && <span className="text-slate-400 italic ml-1">({c.notes})</span>}
                    </span>
                  </div>
                ))}
                {parsedCards.length > 15 && (
                  <div className="px-3.5 py-2 text-xs text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40">
                    ...and {parsedCards.length - 15} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || parsedCards.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {isSubmitting ? 'Importing...' : `Add ${parsedCards.length} Cards`}
          </button>
        </div>
      </div>
    </div>
  );
};
