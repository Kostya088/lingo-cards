import Dexie, { type Table } from 'dexie';
import { type Deck, type Card, type DeckWithStats } from '../types';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class FlashcardDatabase extends Dexie {
  decks!: Table<Deck, any>;
  cards!: Table<Card, any>;

  constructor() {
    super('LingoCardsDB');

    // Schema V1 (legacy auto-incrementing numbers)
    this.version(1).stores({
      decks: '++id, title, targetLanguage, createdAt',
      cards: '++id, deckId, level, nextReviewDate, createdAt',
    });

    // Schema V2 & V3: Keep ++id for IndexedDB primary key compatibility across all versions
    this.version(2).stores({
      decks: '++id, title, targetLanguage, createdAt, updatedAt, isDeleted, userId',
      cards: '++id, deckId, level, nextReviewDate, createdAt, updatedAt, isDeleted, userId',
    });

    this.version(3).stores({
      decks: '++id, title, targetLanguage, createdAt, updatedAt, isDeleted, userId',
      cards: '++id, deckId, level, nextReviewDate, createdAt, updatedAt, isDeleted, userId',
    });
  }
}

export const db = new FlashcardDatabase();

// Runtime fallback migration: ensures that any existing legacy numerical IDs
// are converted to UUIDs and foreign keys are re-linked even if the Dexie
// upgrade event was skipped by the browser
let migrationPromise: Promise<void> | null = null;
export async function ensureLegacyDataMigrated(): Promise<void> {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    try {
      await db.open();
      const allDecks = await db.decks.toArray();
      const hasNumericDecks = allDecks.some((d) => typeof d.id === 'number');

      const allCards = await db.cards.toArray();
      const hasNumericCards = allCards.some(
        (c) => typeof c.id === 'number' || typeof c.deckId === 'number'
      );

      if (!hasNumericDecks && !hasNumericCards) {
        return;
      }

      console.log('Migrating legacy numeric decks and cards to UUIDs...');
      const idMap = new Map<number | string, string>();

      await db.transaction('rw', db.decks, db.cards, async () => {
        // 1. Migrate Decks
        for (const deck of allDecks) {
          if (typeof deck.id === 'number') {
            const newId = generateUUID();
            idMap.set(deck.id, newId);
            await db.decks.delete(deck.id as any);
            await db.decks.put({
              ...deck,
              id: newId,
              updatedAt: deck.updatedAt || deck.createdAt || Date.now(),
              isDeleted: Boolean(deck.isDeleted),
            });
          }
        }

        // 2. Migrate Cards
        for (const card of allCards) {
          const isNumId = typeof card.id === 'number';
          const isNumDeckId = typeof card.deckId === 'number';

          if (isNumId || isNumDeckId) {
            const newCardId = isNumId ? generateUUID() : card.id;
            const mappedDeckId = isNumDeckId
              ? (idMap.get(card.deckId) || String(card.deckId))
              : card.deckId;

            if (isNumId) {
              await db.cards.delete(card.id as any);
            }
            await db.cards.put({
              ...card,
              id: newCardId,
              deckId: mappedDeckId,
              updatedAt: card.updatedAt || card.createdAt || Date.now(),
              isDeleted: Boolean(card.isDeleted),
            });
          }
        }
      });
      console.log('Legacy data migration completed successfully.');
    } catch (err) {
      console.error('Error during legacy data migration:', err);
    }
  })();

  return migrationPromise;
}

// --- Database Helper Methods ---

export async function getAllDecksWithStats(): Promise<DeckWithStats[]> {
  await ensureLegacyDataMigrated();
  const decks = await db.decks.toArray();
  const now = Date.now();

  // Filter out soft-deleted decks
  const activeDecks = decks
    .filter((d) => !d.isDeleted)
    .sort((a, b) => b.createdAt - a.createdAt);

  const results: DeckWithStats[] = [];

  for (const deck of activeDecks) {
    if (!deck.id) continue;
    let cards = await db.cards
      .where('deckId')
      .equals(deck.id)
      .filter((c) => !c.isDeleted)
      .toArray();

    // Fallback in-memory match if type casting differences exist
    if (cards.length === 0) {
      cards = await db.cards
        .filter((c) => !c.isDeleted && String(c.deckId) === String(deck.id))
        .toArray();
    }

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
  const id = generateUUID();
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
  await db.transaction('rw', db.decks, db.cards, async () => {
    const cards = await getDeckCards(id);
    for (const card of cards) {
      await db.cards.update(card.id, { isDeleted: true, updatedAt: now });
    }
    await db.decks.update(id, { isDeleted: true, updatedAt: now });
  });
}

export async function getDeckCards(deckId: string): Promise<Card[]> {
  await ensureLegacyDataMigrated();
  let cards = await db.cards
    .where('deckId')
    .equals(deckId)
    .filter((c) => !c.isDeleted)
    .toArray();

  if (cards.length === 0 && !isNaN(Number(deckId))) {
    const numCards = await db.cards
      .where('deckId')
      .equals(Number(deckId))
      .filter((c) => !c.isDeleted)
      .toArray();
    if (numCards.length > 0) return numCards;
  }

  if (cards.length === 0) {
    cards = await db.cards
      .filter((c) => !c.isDeleted && String(c.deckId) === String(deckId))
      .toArray();
  }

  return cards;
}

export async function createCard(
  deckId: string,
  front: string,
  back: string,
  notes?: string
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
  cardsData: Array<{ front: string; back: string; notes?: string }>
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
  await ensureLegacyDataMigrated();
  return await db.decks.where('updatedAt').above(timestamp).toArray();
}

export async function getModifiedCardsSince(timestamp: number): Promise<Card[]> {
  await ensureLegacyDataMigrated();
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
  await ensureLegacyDataMigrated();
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
  await ensureLegacyDataMigrated();
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
  await ensureLegacyDataMigrated();
  const deck = await db.decks.get(deckId);
  if (!deck || deck.isDeleted) throw new Error('Deck not found');
  const cards = await getDeckCards(deckId);

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
  await ensureLegacyDataMigrated();
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
    const newDeckId = generateUUID();

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
      id: generateUUID(),
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
      const newDeckId = mode === 'replace' && d.id ? String(d.id) : generateUUID();

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
          id: mode === 'replace' && c.id ? String(c.id) : generateUUID(),
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

// Fetch single deck with statistics directly for /deck/:deckId
export async function getDeckById(deckId: string): Promise<DeckWithStats | null> {
  const all = await getAllDecksWithStats();
  return all.find((d) => d.id === deckId) || null;
}

// Fetch single card directly for /deck/:deckId/cards/:cardId/edit
export async function getCardById(cardId: string): Promise<Card | null> {
  await ensureLegacyDataMigrated();
  return (await db.cards.get(cardId)) || null;
}

// Export deck as readable text list (front - back)
export async function exportDeckAsText(deckId: string): Promise<string> {
  const deck = await getDeckById(deckId);
  const cards = await getDeckCards(deckId);
  const header = `# ${deck?.title || 'Vocabulary'}\n# Format: Front - Back\n\n`;
  const body = cards
    .map((c) => `${c.front} - ${c.back}${c.notes ? ` // ${c.notes}` : ''}`)
    .join('\n');
  return header + body;
}
