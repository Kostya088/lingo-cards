import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { StudySession } from '../components/StudySession';
import { SessionSummary } from '../components/SessionSummary';
import { getDeckById, getDeckCards } from '../db';
import { type DeckWithStats, type Card, type SessionStats } from '../types';

interface OutletContextType {
  setHideBottomNav?: (hide: boolean) => void;
  setHideTopNav?: (hide: boolean) => void;
}

export const StudyScreen: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { setHideBottomNav, setHideTopNav } = useOutletContext<OutletContextType>() || {};

  const [deck, setDeck] = useState<DeckWithStats | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!deckId) return;
      try {
        setIsLoading(true);
        const currentDeck = await getDeckById(deckId);
        const deckCards = await getDeckCards(deckId);
        if (!isMounted) return;
        setDeck(currentDeck || null);
        setCards(deckCards);
      } catch (err) {
        console.error('Failed to load study data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
      setHideBottomNav?.(false);
      setHideTopNav?.(false);
    };
  }, [deckId, setHideBottomNav, setHideTopNav]);

  const handleSessionComplete = (stats: SessionStats, retryDifficult: () => void) => {
    setSessionStats(stats);
    setRetryAction(() => retryDifficult);
    setHideBottomNav?.(false);
    setHideTopNav?.(false);
  };

  const handleRetry = () => {
    setSessionStats(null);
    if (retryAction) {
      retryAction();
    }
  };

  const handleExit = () => {
    setHideBottomNav?.(false);
    setHideTopNav?.(false);
    navigate(deckId ? `/deck/${deckId}` : '/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!deck || cards.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
          No Cards to Study
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This deck does not contain any flashcards yet. Add some cards before studying!
        </p>
        <button
          onClick={handleExit}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          Return to Deck
        </button>
      </div>
    );
  }

  // Summary Phase
  if (sessionStats) {
    return (
      <div className="flex-1 flex flex-col justify-center py-6">
        <SessionSummary
          stats={sessionStats}
          onRetryDifficult={handleRetry}
          onReturnToDeck={handleExit}
          onReturnHome={() => {
            setHideBottomNav?.(false);
            setHideTopNav?.(false);
            navigate('/');
          }}
        />
      </div>
    );
  }

  // Active / Config Study Phase
  return (
    <div className="flex-1 flex flex-col justify-center">
      <StudySession
        deck={deck}
        allCards={cards}
        onExit={handleExit}
        onSessionComplete={handleSessionComplete}
        onStateChange={(isConfiguring) => {
          // Hide navigation ONLY during active card review
          setHideBottomNav?.(!isConfiguring);
          setHideTopNav?.(!isConfiguring);
        }}
      />
    </div>
  );
};
