import { db, generateUUID } from "./schema";
import { type Deck, type Card } from "../types";
import { getDeckCards } from "./cardQueries";
import { getDeckById } from "./deckQueries";

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
  if (!deck || deck.isDeleted) throw new Error("Deck not found");
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
  mode: "merge" | "replace",
): Promise<{ decksImported: number; cardsImported: number }> {
  const parsed = JSON.parse(jsonContent);

  if (mode === "replace") {
    await db.transaction("rw", db.decks, db.cards, async () => {
      await db.decks.clear();
      await db.cards.clear();
    });
  }

  let decksImported = 0;
  let cardsImported = 0;
  const now = Date.now();

  if (parsed.deck && Array.isArray(parsed.cards)) {
    const originalDeck: Deck = parsed.deck;
    const originalCards: Card[] = parsed.cards;
    const newDeckId = generateUUID();

    await db.decks.add({
      id: newDeckId,
      title:
        mode === "replace"
          ? originalDeck.title
          : `${originalDeck.title} (Imported)`,
      description: originalDeck.description,
      targetLanguage: originalDeck.targetLanguage || "Foreign",
      nativeLanguage: originalDeck.nativeLanguage || "English",
      color: originalDeck.color || "emerald",
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
  } else if (Array.isArray(parsed.decks) && Array.isArray(parsed.cards)) {
    const deckIdMap = new Map<string, string>();

    for (const d of parsed.decks as Deck[]) {
      const oldId = String(d.id);
      const newDeckId =
        mode === "replace" && d.id ? String(d.id) : generateUUID();

      await db.decks.put({
        id: newDeckId,
        title: d.title,
        description: d.description,
        targetLanguage: d.targetLanguage || "Foreign",
        nativeLanguage: d.nativeLanguage || "English",
        color: d.color || "emerald",
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
          id: mode === "replace" && c.id ? String(c.id) : generateUUID(),
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
    throw new Error("Invalid JSON format: missing decks or cards array");
  }

  return { decksImported, cardsImported };
}

export async function exportDeckAsText(deckId: string): Promise<string> {
  const deck = await getDeckById(deckId);
  const cards = await getDeckCards(deckId);
  const header = `# ${deck?.title || "Vocabulary"}\n# Format: Front - Back\n\n`;
  const body = cards
    .map((c) => `${c.front} - ${c.back}${c.notes ? ` // ${c.notes}` : ""}`)
    .join("\n");
  return header + body;
}
