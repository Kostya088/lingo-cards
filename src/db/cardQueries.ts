import { db, generateUUID } from "./schema";
import { type Card } from "../types";

export async function getDeckCards(deckId: string): Promise<Card[]> {
  return await db.cards
    .where("deckId")
    .equals(deckId)
    .filter((c) => !c.isDeleted)
    .toArray();
}

export async function getCardById(cardId: string): Promise<Card | null> {
  return (await db.cards.get(cardId)) || null;
}

export async function createCard(
  deckId: string,
  front: string,
  back: string,
  notes?: string,
): Promise<string> {
  const now = Date.now();
  const id = generateUUID();
  const newCard: Card = {
    id,
    deckId,
    front: front.trim(),
    back: back.trim(),
    notes: notes?.trim() || undefined,
    level: 0,
    consecutiveCorrect: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: now,
    totalReviews: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };
  await db.cards.add(newCard);
  return id;
}

export async function createCardsBulk(
  deckId: string,
  cardsData: Array<{ front: string; back: string; notes?: string }>,
): Promise<number> {
  const now = Date.now();
  const newCards: Card[] = cardsData.map((c) => ({
    id: generateUUID(),
    deckId,
    front: c.front.trim(),
    back: c.back.trim(),
    notes: c.notes?.trim() || undefined,
    level: 0,
    consecutiveCorrect: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: now,
    totalReviews: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }));

  await db.cards.bulkAdd(newCards);
  return newCards.length;
}

export async function updateCard(
  id: string,
  data: Partial<Card>,
): Promise<number> {
  return await db.cards.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.update(id, {
    isDeleted: true,
    updatedAt: Date.now(),
  });
}
