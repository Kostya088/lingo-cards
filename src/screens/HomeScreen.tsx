import React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DeckList } from "../components/DeckList";
import { deleteDeck } from "../db";
import { useDecks } from "../hooks/useDecks";

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { decks, isLoading, refresh } = useDecks();

  const handleDeleteDeck = async (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${deck?.title || "this deck"}" and all its flashcards?`,
    );
    if (!confirmed) return;

    try {
      await deleteDeck(deckId);
      await refresh();
    } catch (err) {
      console.error("Failed to delete deck:", err);
      alert("Failed to delete deck. Please try again.");
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
        onSelectDeck={(deck) => navigate(`/decks/${deck.id}`)}
        onStartStudy={(deck) => navigate(`/decks/${deck.id}/study`)}
        onOpenCreateModal={() => navigate("/decks/new")}
        onEditDeck={(deck) => navigate(`/decks/${deck.id}/edit`)}
        onDeleteDeck={handleDeleteDeck}
      />
    </div>
  );
};
