import { useLiveQuery } from 'dexie-react-hooks';
import { getDeckCards } from '../db';

export function useCards(deckId: string | undefined) {
  const cards = useLiveQuery(
    () => (deckId ? getDeckCards(deckId) : Promise.resolve([])),
    [deckId]
  );

  return {
    cards: cards ?? [],
    isLoading: cards === undefined && !!deckId,
    error: null,
    refresh: async () => {}, 
  };
}
