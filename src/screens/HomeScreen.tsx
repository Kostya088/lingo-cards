import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DeckList } from '../components/DeckList';
import { deleteDeck, exportDeckAsText } from '../db';
import { useDecks } from '../hooks/useDecks';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { decks, isLoading, refresh } = useDecks();

  const handleDeleteDeck = async (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${deck?.title || 'this deck'}" and all its flashcards?`
    );
    if (!confirmed) return;

    try {
      await deleteDeck(deckId);
      await refresh();
    } catch (err) {
      console.error('Failed to delete deck:', err);
      alert('Failed to delete deck. Please try again.');
    }
  };

  const handleExportDeck = async (deckId: string) => {
    try {
      const text = await exportDeckAsText(deckId);
      const deck = decks.find((d) => d.id === deckId);
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

  return (
    <div className="flex-1">
      <DeckList
        decks={decks}
        onSelectDeck={(deck) => navigate(`/deck/${deck.id}`)}
        onStartStudy={(deck) => navigate(`/deck/${deck.id}/study`)}
        onOpenCreateModal={() => navigate('/decks/new')}
        onEditDeck={(deck) => navigate(`/decks/${deck.id}/edit`)}
        onDeleteDeck={handleDeleteDeck}
        onExportDeck={handleExportDeck}
      />
    </div>
  );
};
