import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type Card } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: { front: string; back: string; notes?: string }) => Promise<void>;
  editingCard?: Card | null;
  targetLanguage?: string;
  nativeLanguage?: string;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCard,
  targetLanguage = 'Target Word',
  nativeLanguage = 'Translation',
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front);
      setBack(editingCard.back);
      setNotes(editingCard.notes || '');
    } else {
      setFront('');
      setBack('');
      setNotes('');
    }
    setError('');
  }, [editingCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim()) {
      setError(`Front text (${targetLanguage}) is required.`);
      return;
    }
    if (!back.trim()) {
      setError(`Back text (${nativeLanguage}) is required.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        front: front.trim(),
        back: back.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">
              {editingCard ? 'Edit Flashcard' : 'Add Flashcard'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              One side the word, other side the translation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Card Front ({targetLanguage}) *</span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-normal">Spoken during review</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={`e.g. buongiorno, la mela, s'il vous plaît...`}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Card Back ({nativeLanguage}) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. good morning, the apple, please..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Example sentence / Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Buongiorno a tutti! (Good morning everyone!)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving...' : editingCard ? 'Update Card' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
