import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DeckDetail } from '../components/DeckDetail';
import { getDeckById, getDeckCards, deleteCard, exportDeckAsText } from '../db';
import { type DeckWithStats, type Card } from '../types';

export const DeckDetailScreen: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<DeckWithStats | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeckAndCards = useCallback(async () => {
    if (!deckId) return;
    try {
      setIsLoading(true);
      const [currentDeck, currentCards] = await Promise.all([
        getDeckById(deckId),
        getDeckCards(deckId),
      ]);
      setDeck(currentDeck);
      setCards(currentCards);
    } catch (err) {
      console.error('Failed to load deck data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    loadDeckAndCards();
  }, [loadDeckAndCards]);

  const handleDeleteCard = async (cardId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this flashcard?');
    if (!confirmed) return;

    try {
      await deleteCard(cardId);
      await loadDeckAndCards();
    } catch (err) {
      console.error('Failed to delete card:', err);
      alert('Failed to delete card. Please try again.');
    }
  };

  const handleExportDeck = async (targetDeckId: string) => {
    try {
      const text = await exportDeckAsText(targetDeckId);
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
    <div className="flex-1">
      <DeckDetail
        deck={deck}
        cards={cards}
        onBack={() => navigate('/')}
        onStartStudy={() => navigate(`/deck/${deckId}/study`)}
        onAddCard={() => navigate(`/deck/${deckId}/cards/new`)}
        onBulkAddCards={() => navigate(`/deck/${deckId}/bulk-add`)}
        onEditCard={(card) => navigate(`/deck/${deckId}/cards/${card.id}/edit`)}
        onDeleteCard={handleDeleteCard}
        onExportDeck={handleExportDeck}
        onEditDeck={() => navigate(`/deck/${deckId}/edit`)}
      />
    </div>
  );
};
