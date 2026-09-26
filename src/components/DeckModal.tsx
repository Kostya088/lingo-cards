import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { type Deck } from '../types';

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deckData: {
    title: string;
    description?: string;
    targetLanguage: string;
    nativeLanguage: string;
    color: string;
  }) => Promise<void>;
  editingDeck?: Deck | null;
}

const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-600', ring: 'ring-emerald-500' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-600', ring: 'ring-blue-500' },
  { id: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-600', ring: 'ring-indigo-500' },
  { id: 'purple', bg: 'bg-purple-500', border: 'border-purple-600', ring: 'ring-purple-500' },
  { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-600', ring: 'ring-rose-500' },
  { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-600', ring: 'ring-amber-500' },
];

export const DeckModal: React.FC<DeckModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDeck,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [color, setColor] = useState('emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingDeck) {
      setTitle(editingDeck.title);
      setDescription(editingDeck.description || '');
      setTargetLanguage(editingDeck.targetLanguage || '');
      setNativeLanguage(editingDeck.nativeLanguage || 'English');
      setColor(editingDeck.color || 'emerald');
    } else {
      setTitle('');
      setDescription('');
      setTargetLanguage('');
      setNativeLanguage('English');
      setColor('emerald');
    }
    setError('');
  }, [editingDeck, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Deck title is required.');
      return;
    }
    if (!targetLanguage.trim()) {
      setError('Target language is required (e.g. Italian, French).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        targetLanguage: targetLanguage.trim(),
        nativeLanguage: nativeLanguage.trim() || 'English',
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save deck.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
            {editingDeck ? 'Edit Deck' : 'Create New Deck'}
          </h2>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Deck Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Italian Food & Travel, French B1..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base sm:text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Language *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Italian, French"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base sm:text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Your Language
              </label>
              <input
                type="text"
                placeholder="e.g. English, Ukrainian"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base sm:text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Short description or goal for this deck..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Deck Accent Color
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center text-white transition-all ${
                    color === c.id
                      ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900 scale-110 shadow-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
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
              {isSubmitting ? 'Saving...' : editingDeck ? 'Update Deck' : 'Create Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
