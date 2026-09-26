import Dexie, { type Table } from 'dexie';
import { type Deck, type Card, type DeckWithStats } from '../types';

export class FlashcardDatabase extends Dexie {
  decks!: Table<Deck, number>;
  cards!: Table<Card, number>;

  constructor() {
    super('LingoCardsDB');
    this.version(1).stores({
      decks: '++id, title, targetLanguage, createdAt',
      cards: '++id, deckId, level, nextReviewDate, createdAt',
    });
  }
}

export const db = new FlashcardDatabase();

// --- Database Helper Methods ---

export async function getAllDecksWithStats(): Promise<DeckWithStats[]> {
  const decks = await db.decks.orderBy('createdAt').reverse().toArray();
  const now = Date.now();

  const results: DeckWithStats[] = [];

  for (const deck of decks) {
    if (!deck.id) continue;
    const cards = await db.cards.where('deckId').equals(deck.id).toArray();

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

export async function createDeck(data: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = Date.now();
  return await db.decks.add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateDeck(id: number, data: Partial<Deck>): Promise<number> {
  return await db.decks.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteDeck(id: number): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.cards.where('deckId').equals(id).delete();
    await db.decks.delete(id);
  });
}

export async function getDeckCards(deckId: number): Promise<Card[]> {
  return await db.cards.where('deckId').equals(deckId).toArray();
}

export async function createCard(deckId: number, front: string, back: string, notes?: string): Promise<number> {
  const now = Date.now();
  return await db.cards.add({
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
  });
}

export async function createCardsBulk(
  deckId: number,
  cardsData: Array<{ front: string; back: string; notes?: string }>
): Promise<number> {
  const now = Date.now();
  const newCards: Omit<Card, 'id'>[] = cardsData.map((c) => ({
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
  }));

  await db.cards.bulkAdd(newCards as Card[]);
  return newCards.length;
}

export async function updateCard(id: number, data: Partial<Card>): Promise<number> {
  return await db.cards.update(id, data);
}

export async function deleteCard(id: number): Promise<void> {
  await db.cards.delete(id);
}

export async function exportAllData(): Promise<string> {
  const decks = await db.decks.toArray();
  const cards = await db.cards.toArray();

  const exportPayload = {
    version: 1,
    exportDate: new Date().toISOString(),
    decks,
    cards,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function exportDeckData(deckId: number): Promise<string> {
  const deck = await db.decks.get(deckId);
  if (!deck) throw new Error('Deck not found');
  const cards = await db.cards.where('deckId').equals(deckId).toArray();

  const exportPayload = {
    version: 1,
    exportDate: new Date().toISOString(),
    deck,
    cards,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function importData(jsonContent: string, mode: 'merge' | 'replace'): Promise<{ decksImported: number; cardsImported: number }> {
  const parsed = JSON.parse(jsonContent);

  if (mode === 'replace') {
    await db.transaction('rw', db.decks, db.cards, async () => {
      await db.decks.clear();
      await db.cards.clear();
    });
  }

  let decksImported = 0;
  let cardsImported = 0;

  // Single Deck Import Format
  if (parsed.deck && Array.isArray(parsed.cards)) {
    const originalDeck: Deck = parsed.deck;
    const originalCards: Card[] = parsed.cards;

    const newDeckId = await db.decks.add({
      title: mode === 'replace' ? originalDeck.title : `${originalDeck.title} (Imported)`,
      description: originalDeck.description,
      targetLanguage: originalDeck.targetLanguage || 'Foreign',
      nativeLanguage: originalDeck.nativeLanguage || 'Native',
      color: originalDeck.color || 'emerald',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    decksImported++;

    const cardsToInsert = originalCards.map((c) => ({
      deckId: newDeckId,
      front: c.front,
      back: c.back,
      notes: c.notes,
      level: c.level ?? 0,
      consecutiveCorrect: c.consecutiveCorrect ?? 0,
      intervalDays: c.intervalDays ?? 0,
      easeFactor: c.easeFactor ?? 2.5,
      nextReviewDate: c.nextReviewDate ?? Date.now(),
      lastReviewedDate: c.lastReviewedDate,
      totalReviews: c.totalReviews ?? 0,
      createdAt: Date.now(),
    }));

    await db.cards.bulkAdd(cardsToInsert as Card[]);
    cardsImported += cardsToInsert.length;
  }
  // Full Database Import Format
  else if (Array.isArray(parsed.decks) && Array.isArray(parsed.cards)) {
    const deckIdMap = new Map<number, number>();

    for (const d of parsed.decks as Deck[]) {
      const oldId = d.id;
      const newDeckId = await db.decks.add({
        title: d.title,
        description: d.description,
        targetLanguage: d.targetLanguage || 'Foreign',
        nativeLanguage: d.nativeLanguage || 'Native',
        color: d.color || 'emerald',
        createdAt: d.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
      if (oldId !== undefined) {
        deckIdMap.set(oldId, newDeckId);
      }
      decksImported++;
    }

    const cardsToInsert: Omit<Card, 'id'>[] = [];
    for (const c of parsed.cards as Card[]) {
      const mappedDeckId = deckIdMap.get(c.deckId);
      if (mappedDeckId !== undefined) {
        cardsToInsert.push({
          deckId: mappedDeckId,
          front: c.front,
          back: c.back,
          notes: c.notes,
          level: c.level ?? 0,
          consecutiveCorrect: c.consecutiveCorrect ?? 0,
          intervalDays: c.intervalDays ?? 0,
          easeFactor: c.easeFactor ?? 2.5,
          nextReviewDate: c.nextReviewDate ?? Date.now(),
          lastReviewedDate: c.lastReviewedDate,
          totalReviews: c.totalReviews ?? 0,
          createdAt: c.createdAt || Date.now(),
        });
      }
    }

    if (cardsToInsert.length > 0) {
      await db.cards.bulkAdd(cardsToInsert as Card[]);
      cardsImported += cardsToInsert.length;
    }
  } else {
    throw new Error('Invalid JSON format: missing decks or cards array');
  }

  return { decksImported, cardsImported };
}
