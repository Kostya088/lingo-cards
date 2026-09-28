import { useState, useEffect, useCallback } from 'react';
import { getAllDecksWithStats } from '../db';
import { type DeckWithStats } from '../types';

export function useDecks() {
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllDecksWithStats();
      setDecks(data);
    } catch (err) {
      console.error('Failed to load decks:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading decks'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { decks, isLoading, error, refresh };
}
