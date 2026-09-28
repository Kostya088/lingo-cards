import { useLiveQuery } from 'dexie-react-hooks';
import { getAllDecksWithStats } from '../db';

export function useDecks() {
  // useLiveQuery handles the subscription to Dexie and automatically 
  // returns the fresh data whenever the database changes.
  const decks = useLiveQuery(() => getAllDecksWithStats());

  return {
    decks: decks ?? [],
    isLoading: decks === undefined,
    error: null,
    // refresh is kept as a no-op so we don't break existing components 
    // that call it after a manual mutation, though it's no longer necessary.
    refresh: async () => {}, 
  };
}
