import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DeckList } from './components/DeckList';
import { DeckDetail } from './components/DeckDetail';
import { StudySession } from './components/StudySession';
import { SessionSummary } from './components/SessionSummary';
import { DeckModal } from './components/DeckModal';
import { CardModal } from './components/CardModal';
import { BulkAddModal } from './components/BulkAddModal';
import { BackupModal } from './components/BackupModal';
import {
  type DeckWithStats,
  type Deck,
  type Card,
  type SessionStats,
} from './types';
import {
  getAllDecksWithStats,
  getDeckCards,
  createDeck,
  updateDeck,
  deleteDeck,
  createCard,
  createCardsBulk,
  updateCard,
  deleteCard,
  exportDeckData,
} from './db/db';

type ViewMode = 'deck-list' | 'deck-detail' | 'study-session' | 'session-summary';

export const App: React.FC = () => {
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('lingocards_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lingocards_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lingocards_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // App Navigation & Selected Data State
  const [view, setView] = useState<ViewMode>('deck-list');
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Study Session & Summary State
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  // Load Decks
  const loadDecks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllDecksWithStats();
      setDecks(data);
    } catch (err) {
      console.error('Failed to load decks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load Cards for currently selected deck
  const loadCards = useCallback(async (deckId: string) => {
    try {
      const data = await getDeckCards(deckId);
      setCards(data);
    } catch (err) {
      console.error('Failed to load cards:', err);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) || null;

  // Navigate to Deck Detail
  const handleSelectDeck = async (deck: DeckWithStats) => {
    if (!deck.id) return;
    setSelectedDeckId(deck.id);
    await loadCards(deck.id);
    setView('deck-detail');
  };

  // Start Study
  const handleStartStudy = async (deck: DeckWithStats) => {
    if (!deck.id) return;
    setSelectedDeckId(deck.id);
    await loadCards(deck.id);
    setView('study-session');
  };

  // Deck CRUD Handlers
  const handleSaveDeck = async (deckData: {
    title: string;
    description?: string;
    targetLanguage: string;
    nativeLanguage: string;
    color: string;
  }) => {
    if (editingDeck && editingDeck.id) {
      await updateDeck(editingDeck.id, deckData);
    } else {
      await createDeck(deckData);
    }
    await loadDecks();
  };

  const handleDeleteDeck = async (deckId: string) => {
    await deleteDeck(deckId);
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null);
      setView('deck-list');
    }
    await loadDecks();
  };

  const handleExportSingleDeck = async (deckId: string) => {
    try {
      const json = await exportDeckData(deckId);
      const deck = decks.find((d) => d.id === deckId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = deck?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'deck';
      link.href = url;
      link.download = `lingocards_deck_${safeTitle}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // Card CRUD Handlers
  const handleSaveCard = async (cardData: { front: string; back: string; notes?: string }) => {
    if (!selectedDeckId) return;
    if (editingCard && editingCard.id) {
      await updateCard(editingCard.id, cardData);
    } else {
      await createCard(selectedDeckId, cardData.front, cardData.back, cardData.notes);
    }
    await loadCards(selectedDeckId);
    await loadDecks();
  };

  const handleSaveBulkCards = async (cardsData: Array<{ front: string; back: string; notes?: string }>) => {
    if (!selectedDeckId) return;
    await createCardsBulk(selectedDeckId, cardsData);
    await loadCards(selectedDeckId);
    await loadDecks();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    await deleteCard(cardId);
    if (selectedDeckId) {
      await loadCards(selectedDeckId);
    }
    await loadDecks();
  };

  // Study Session Complete Handler
  const handleSessionComplete = (stats: SessionStats, retryDifficultCards: () => void) => {
    setSessionStats(stats);
    setRetryAction(() => retryDifficultCards);
    setView('session-summary');
    loadDecks();
    if (selectedDeckId) loadCards(selectedDeckId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onNavigateHome={() => {
          setView('deck-list');
          setSelectedDeckId(null);
        }}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : (
          <>
            {/* VIEW 1: Decks List (Dashboard) */}
            {view === 'deck-list' && (
              <DeckList
                decks={decks}
                onSelectDeck={handleSelectDeck}
                onStartStudy={handleStartStudy}
                onOpenCreateModal={() => {
                  setEditingDeck(null);
                  setIsDeckModalOpen(true);
                }}
                onEditDeck={(deck) => {
                  setEditingDeck(deck);
                  setIsDeckModalOpen(true);
                }}
                onDeleteDeck={handleDeleteDeck}
                onExportDeck={handleExportSingleDeck}
              />
            )}

            {/* VIEW 2: Deck Detail & Cards Manager */}
            {view === 'deck-detail' && selectedDeck && (
              <DeckDetail
                deck={selectedDeck}
                cards={cards}
                onBack={() => {
                  setView('deck-list');
                  setSelectedDeckId(null);
                }}
                onStartStudy={() => setView('study-session')}
                onAddCard={() => {
                  setEditingCard(null);
                  setIsCardModalOpen(true);
                }}
                onBulkAddCards={() => setIsBulkAddModalOpen(true)}
                onEditCard={(card) => {
                  setEditingCard(card);
                  setIsCardModalOpen(true);
                }}
                onDeleteCard={handleDeleteCard}
                onExportDeck={handleExportSingleDeck}
              />
            )}

            {/* VIEW 3: Active Study Session */}
            {view === 'study-session' && selectedDeck && (
              <StudySession
                deck={selectedDeck}
                allCards={cards}
                onExit={() => setView('deck-detail')}
                onSessionComplete={handleSessionComplete}
              />
            )}

            {/* VIEW 4: Session Summary Screen */}
            {view === 'session-summary' && sessionStats && (
              <SessionSummary
                stats={sessionStats}
                onRetryDifficult={() => {
                  if (retryAction) {
                    retryAction();
                    setView('study-session');
                  }
                }}
                onReturnToDeck={() => setView('deck-detail')}
                onReturnHome={() => {
                  setView('deck-list');
                  setSelectedDeckId(null);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* MODALS */}
      {/* Create / Edit Deck Modal */}
      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => {
          setIsDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSave={handleSaveDeck}
        editingDeck={editingDeck}
      />

      {/* Create / Edit Single Card Modal */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
        editingCard={editingCard}
        targetLanguage={selectedDeck?.targetLanguage}
        nativeLanguage={selectedDeck?.nativeLanguage}
      />

      {/* Quick Bulk Add Modal */}
      <BulkAddModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onSaveBulk={handleSaveBulkCards}
        targetLanguage={selectedDeck?.targetLanguage}
        nativeLanguage={selectedDeck?.nativeLanguage}
      />

      {/* Backup / Export / Import Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={() => {
          loadDecks();
          if (selectedDeckId) loadCards(selectedDeckId);
        }}
      />
    </div>
  );
};
export default App;
