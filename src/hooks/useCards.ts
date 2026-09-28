import { useState, useEffect, useCallback } from 'react';
import { getDeckCards } from '../db';
import { type Card } from '../types';

export function useCards(deckId: string | undefined) {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!deckId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDeckCards(deckId);
      setCards(data);
    } catch (err) {
      console.error(`Failed to load cards for deck ${deckId}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error loading cards'));
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cards, isLoading, error, refresh };
}
