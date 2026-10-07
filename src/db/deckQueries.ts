import { db, generateUUID, getNextTimestamp } from "./schema";
import { type Deck, type DeckWithStats } from "../types";
import { getDeckCards } from "./cardQueries";

export async function getAllDecksWithStats(): Promise<DeckWithStats[]> {
  const decks = await db.decks.toArray();
  const now = Date.now();

  const activeDecks = decks
    .filter((d) => !d.isDeleted)
    .sort((a, b) => b.createdAt - a.createdAt);

  const results: DeckWithStats[] = [];

  for (const deck of activeDecks) {
    if (!deck.id) continue;
    const cards = await db.cards
      .where("deckId")
      .equals(deck.id)
      .filter((c) => !c.isDeleted)
      .toArray();

    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;
    let masteredCount = 0;
    let dueCount = 0;

    for (const card of cards) {
      if (card.level === 0) newCount++;
      else if (card.level === 1) learningCount++;
      else if (card.level === 2) reviewCount++;
      else if (card.level === 3) masteredCount++;

      if (card.nextReviewDate <= now) {
        dueCount++;
      }
    }

    results.push({
      ...deck,
      totalCards: cards.length,
      newCount,
      learningCount,
      reviewCount,
      masteredCount,
      dueCount,
    });
  }

  return results;
}

export async function getDeckById(
  deckId: string,
): Promise<DeckWithStats | null> {
  const all = await getAllDecksWithStats();
  return all.find((d) => d.id === deckId) || null;
}

export async function createDeck(
  data: Omit<Deck, "id" | "createdAt" | "updatedAt" | "isDeleted">,
): Promise<string> {
  const now = Date.now();
  const nextTimestamp = await getNextTimestamp();
  const id = generateUUID();
  const newDeck: Deck = {
    ...data,
    id,
    createdAt: now,
    updatedAt: nextTimestamp,
    isDeleted: false,
  };
  await db.decks.add(newDeck);
  return id;
}

export async function updateDeck(
  id: string,
  data: Partial<Deck>,
): Promise<number> {
  return await db.decks.update(id, {
    ...data,
    updatedAt: await getNextTimestamp(),
  });
}

export async function deleteDeck(id: string): Promise<void> {
  const nextTimestamp = await getNextTimestamp();
  await db.transaction("rw", db.decks, db.cards, async () => {
    const cards = await getDeckCards(id);
    for (const card of cards) {
      if (card.id) {
        await db.cards.update(card.id, {
          isDeleted: true,
          updatedAt: nextTimestamp,
        });
      }
    }
    await db.decks.update(id, { isDeleted: true, updatedAt: nextTimestamp });
  });
}
