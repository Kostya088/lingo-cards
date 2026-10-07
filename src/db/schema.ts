import Dexie, { type Table } from "dexie";
import { type Deck, type Card } from "../types";

export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class FlashcardDatabase extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;

  constructor() {
    super("LingoCardsDB_v2");

    this.version(1).stores({
      decks:
        "id, title, targetLanguage, createdAt, updatedAt, isDeleted, userId",
      cards:
        "id, deckId, level, nextReviewDate, createdAt, updatedAt, isDeleted, userId",
    });
  }
}

export const db = new FlashcardDatabase();

export async function getNextTimestamp(): Promise<number> {
  const maxDeck = await db.decks.orderBy("updatedAt").last();
  const maxCard = await db.cards.orderBy("updatedAt").last();
  const maxLocal = Math.max(maxDeck?.updatedAt || 0, maxCard?.updatedAt || 0);
  return Math.max(Date.now(), maxLocal + 1);
}
