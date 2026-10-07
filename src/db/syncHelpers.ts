import { db, getNextTimestamp } from "./schema";
import { type Deck, type Card } from "../types";

export async function getModifiedDecksSince(
  timestamp: number,
): Promise<Deck[]> {
  return await db.decks.where("updatedAt").above(timestamp).toArray();
}

export async function getModifiedCardsSince(
  timestamp: number,
): Promise<Card[]> {
  return await db.cards.where("updatedAt").above(timestamp).toArray();
}

export async function bulkUpsertDecks(decks: Deck[]): Promise<void> {
  if (decks.length === 0) return;
  await db.decks.bulkPut(decks);
}

export async function bulkUpsertCards(cards: Card[]): Promise<void> {
  if (cards.length === 0) return;
  await db.cards.bulkPut(cards);
}

export async function linkGuestDataToUser(
  userId: string,
): Promise<{ decksCount: number; cardsCount: number }> {
  let decksCount = 0;
  let cardsCount = 0;
  await db.transaction("rw", db.decks, db.cards, async () => {
    const nextTimestamp = await getNextTimestamp();
    const allDecks = await db.decks.toArray();
    for (const d of allDecks) {
      if (!d.userId && d.id) {
        await db.decks.update(d.id, { userId, updatedAt: nextTimestamp });
        decksCount++;
      }
    }
    const allCards = await db.cards.toArray();
    for (const c of allCards) {
      if (!c.userId && c.id) {
        await db.cards.update(c.id, { userId, updatedAt: nextTimestamp });
        cardsCount++;
      }
    }
  });
  return { decksCount, cardsCount };
}
