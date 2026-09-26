import Dexie, { type Table } from 'dexie';
import { type Deck, type Card, type DeckWithStats } from '../types';

export class FlashcardDatabase extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;

  constructor() {
    super('LingoCardsDB');

    // Schema V1 (legacy auto-incrementing numbers)
    this.version(1).stores({
      decks: '++id, title, targetLanguage, createdAt',
      cards: '++id, deckId, level, nextReviewDate, createdAt',
    });

    // Schema V2 (UUID strings, soft-deletes, and sync indexes)
    this.version(2)
      .stores({
        decks: 'id, title, targetLanguage, createdAt, updatedAt, isDeleted, userId',
        cards: 'id, deckId, level, nextReviewDate, createdAt, updatedAt, isDeleted, userId',
      })
      .upgrade(async (tx) => {
        // Safe migration: Convert any existing legacy numerical IDs to UUIDs
        const decksTable = tx.table('decks');
        const cardsTable = tx.table('cards');

        const existingDecks = await decksTable.toArray();
        const idMap = new Map<number | string, string>();

        for (const deck of existingDecks) {
          const legacyId = deck.id;
          const newId = typeof legacyId === 'number' ? crypto.randomUUID() : (legacyId || crypto.randomUUID());
          idMap.set(legacyId, newId);

          await decksTable.put({
            ...deck,
            id: newId,
            updatedAt: deck.updatedAt || deck.createdAt || Date.now(),
            isDeleted: false,
          });
        }

        const existingCards = await cardsTable.toArray();
        for (const card of existingCards) {
          const newCardId = typeof card.id === 'number' ? crypto.randomUUID() : (card.id || crypto.randomUUID());
          const mappedDeckId = idMap.get(card.deckId) || String(card.deckId);

          await cardsTable.put({
            ...card,
            id: newCardId,
            deckId: mappedDeckId,
            updatedAt: card.updatedAt || card.createdAt || Date.now(),
            isDeleted: false,
          });
        }
      });
  }
}

export const db = new FlashcardDatabase();

// --- Database Helper Methods ---

export async function getAllDecksWithStats(): Promise<DeckWithStats[]> {
  const decks = await db.decks.toArray();
  const now = Date.now();

  // Filter out soft-deleted decks
  const activeDecks = decks
    .filter((d) => !d.isDeleted)
    .sort((a, b) => b.createdAt - a.createdAt);

  const results: DeckWithStats[] = [];

  for (const deck of activeDecks) {
    if (!deck.id) continue;
    const cards = await db.cards
      .where('deckId')
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

export async function createDeck(data: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<string> {
  const now = Date.now();
  const id = crypto.randomUUID();
  const newDeck: Deck = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };
  await db.decks.add(newDeck);
  return id;
}

export async function updateDeck(id: string, data: Partial<Deck>): Promise<number> {
  return await db.decks.update(id, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteDeck(id: string): Promise<void> {
  const now = Date.now();
  // Soft-delete deck and its child cards to propagate deletions to cloud
  await db.transaction('rw', db.decks, db.cards, async () => {
    const cards = await db.cards.where('deckId').equals(id).toArray();
    for (const card of cards) {
      await db.cards.update(card.id, { isDeleted: true, updatedAt: now });
    }
    await db.decks.update(id, { isDeleted: true, updatedAt: now });
  });
}

export async function getDeckCards(deckId: string): Promise<Card[]> {
  return await db.cards
    .where('deckId')
    .equals(deckId)
    .filter((c) => !c.isDeleted)
    .toArray();
}

export async function createCard(
  deckId: string,
  front: string,
  back: string,
  notes?: string
): Promise<string> {
  const now = Date.now();
  const id = crypto.randomUUID();
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
  cardsData: Array<{ front: string; back: string; notes?: string }>
): Promise<number> {
  const now = Date.now();
  const newCards: Card[] = cardsData.map((c) => ({
    id: crypto.randomUUID(),
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

export async function updateCard(id: string, data: Partial<Card>): Promise<number> {
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

// --- Sync Engine Helpers ---

export async function getModifiedDecksSince(timestamp: number): Promise<Deck[]> {
  return await db.decks.where('updatedAt').above(timestamp).toArray();
}

export async function getModifiedCardsSince(timestamp: number): Promise<Card[]> {
  return await db.cards.where('updatedAt').above(timestamp).toArray();
}

export async function bulkUpsertDecks(decks: Deck[]): Promise<void> {
  if (decks.length === 0) return;
  await db.decks.bulkPut(decks);
}

export async function bulkUpsertCards(cards: Card[]): Promise<void> {
  if (cards.length === 0) return;
  await db.cards.bulkPut(cards);
}

export async function linkGuestDataToUser(userId: string): Promise<{ decksCount: number; cardsCount: number }> {
  let decksCount = 0;
  let cardsCount = 0;
  await db.transaction('rw', db.decks, db.cards, async () => {
    const allDecks = await db.decks.toArray();
    for (const d of allDecks) {
      if (!d.userId) {
        await db.decks.update(d.id, { userId, updatedAt: Date.now() });
        decksCount++;
      }
    }
    const allCards = await db.cards.toArray();
    for (const c of allCards) {
      if (!c.userId) {
        await db.cards.update(c.id, { userId, updatedAt: Date.now() });
        cardsCount++;
      }
    }
  });
  return { decksCount, cardsCount };
}

// --- Export & Import ---

export async function exportAllData(): Promise<string> {
  const decks = await db.decks.filter((d) => !d.isDeleted).toArray();
  const cards = await db.cards.filter((c) => !c.isDeleted).toArray();

  const exportPayload = {
    version: 2,
    exportDate: new Date().toISOString(),
    decks,
    cards,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function exportDeckData(deckId: string): Promise<string> {
  const deck = await db.decks.get(deckId);
  if (!deck || deck.isDeleted) throw new Error('Deck not found');
  const cards = await db.cards
    .where('deckId')
    .equals(deckId)
    .filter((c) => !c.isDeleted)
    .toArray();

  const exportPayload = {
    version: 2,
    exportDate: new Date().toISOString(),
    deck,
    cards,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function importData(
  jsonContent: string,
  mode: 'merge' | 'replace'
): Promise<{ decksImported: number; cardsImported: number }> {
  const parsed = JSON.parse(jsonContent);

  if (mode === 'replace') {
    await db.transaction('rw', db.decks, db.cards, async () => {
      await db.decks.clear();
      await db.cards.clear();
    });
  }

  let decksImported = 0;
  let cardsImported = 0;
  const now = Date.now();

  // Single Deck Import Format
  if (parsed.deck && Array.isArray(parsed.cards)) {
    const originalDeck: Deck = parsed.deck;
    const originalCards: Card[] = parsed.cards;
    const newDeckId = crypto.randomUUID();

    await db.decks.add({
      id: newDeckId,
      title: mode === 'replace' ? originalDeck.title : `${originalDeck.title} (Imported)`,
      description: originalDeck.description,
      targetLanguage: originalDeck.targetLanguage || 'Foreign',
      nativeLanguage: originalDeck.nativeLanguage || 'English',
      color: originalDeck.color || 'emerald',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });
    decksImported++;

    const cardsToInsert: Card[] = originalCards.map((c) => ({
      id: crypto.randomUUID(),
      deckId: newDeckId,
      front: c.front,
      back: c.back,
      notes: c.notes,
      level: c.level ?? 0,
      consecutiveCorrect: c.consecutiveCorrect ?? 0,
      intervalDays: c.intervalDays ?? 0,
      easeFactor: c.easeFactor ?? 2.5,
      nextReviewDate: c.nextReviewDate ?? now,
      lastReviewedDate: c.lastReviewedDate,
      totalReviews: c.totalReviews ?? 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }));

    await db.cards.bulkAdd(cardsToInsert);
    cardsImported += cardsToInsert.length;
  }
  // Full Database Import Format
  else if (Array.isArray(parsed.decks) && Array.isArray(parsed.cards)) {
    const deckIdMap = new Map<string, string>();

    for (const d of parsed.decks as Deck[]) {
      const oldId = String(d.id);
      const newDeckId = mode === 'replace' && d.id ? d.id : crypto.randomUUID();

      await db.decks.put({
        id: newDeckId,
        title: d.title,
        description: d.description,
        targetLanguage: d.targetLanguage || 'Foreign',
        nativeLanguage: d.nativeLanguage || 'English',
        color: d.color || 'emerald',
        createdAt: d.createdAt || now,
        updatedAt: now,
        isDeleted: false,
      });
      deckIdMap.set(oldId, newDeckId);
      decksImported++;
    }

    const cardsToInsert: Card[] = [];
    for (const c of parsed.cards as Card[]) {
      const mappedDeckId = deckIdMap.get(String(c.deckId));
      if (mappedDeckId !== undefined) {
        cardsToInsert.push({
          id: mode === 'replace' && c.id ? c.id : crypto.randomUUID(),
          deckId: mappedDeckId,
          front: c.front,
          back: c.back,
          notes: c.notes,
          level: c.level ?? 0,
          consecutiveCorrect: c.consecutiveCorrect ?? 0,
          intervalDays: c.intervalDays ?? 0,
          easeFactor: c.easeFactor ?? 2.5,
          nextReviewDate: c.nextReviewDate ?? now,
          lastReviewedDate: c.lastReviewedDate,
          totalReviews: c.totalReviews ?? 0,
          createdAt: c.createdAt || now,
          updatedAt: now,
          isDeleted: false,
        });
      }
    }

    if (cardsToInsert.length > 0) {
      await db.cards.bulkPut(cardsToInsert);
      cardsImported += cardsToInsert.length;
    }
  } else {
    throw new Error('Invalid JSON format: missing decks or cards array');
  }

  return { decksImported, cardsImported };
}
