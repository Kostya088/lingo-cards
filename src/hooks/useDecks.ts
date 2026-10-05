import { useLiveQuery } from "dexie-react-hooks";
import { getAllDecksWithStats } from "../db";

export function useDecks() {
  const decks = useLiveQuery(() => getAllDecksWithStats());

  return {
    decks: decks ?? [],
    isLoading: decks === undefined,
    error: null,
    refresh: async () => {},
  };
}
