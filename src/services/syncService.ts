import { supabase } from '../lib/supabase';
import {
  type Deck,
  type Card,
} from '../types';
import {
  db,
  getModifiedDecksSince,
  getModifiedCardsSince,
  bulkUpsertDecks,
  bulkUpsertCards,
  linkGuestDataToUser,
} from '../db';

export interface SyncResult {
  success: boolean;
  uploadedDecks: number;
  uploadedCards: number;
  downloadedDecks: number;
  downloadedCards: number;
  timestamp: number;
  error?: string;
}

// Convert camelCase Deck model to Postgres snake_case table row
export function deckToDbRow(deck: Deck, userId: string) {
  return {
    id: deck.id,
    user_id: userId,
    title: deck.title,
    description: deck.description || null,
    target_language: deck.targetLanguage,
    native_language: deck.nativeLanguage,
    color: deck.color,
    created_at: deck.createdAt,
    updated_at: deck.updatedAt,
    is_deleted: Boolean(deck.isDeleted),
  };
}

// Convert Postgres snake_case table row to camelCase Deck model
export function dbRowToDeck(row: any): Deck {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    targetLanguage: row.target_language,
    nativeLanguage: row.native_language,
    color: row.color,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
  };
}

// Convert camelCase Card model to Postgres snake_case table row
export function cardToDbRow(card: Card, userId: string) {
  return {
    id: card.id,
    deck_id: card.deckId,
    user_id: userId,
    front: card.front,
    back: card.back,
    notes: card.notes || null,
    level: card.level,
    consecutive_correct: card.consecutiveCorrect,
    interval_days: card.intervalDays,
    ease_factor: card.easeFactor,
    next_review_date: card.nextReviewDate,
    last_reviewed_date: card.lastReviewedDate || null,
    total_reviews: card.totalReviews,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
    is_deleted: Boolean(card.isDeleted),
  };
}

// Convert Postgres snake_case table row to camelCase Card model
export function dbRowToCard(row: any): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    userId: row.user_id,
    front: row.front,
    back: row.back,
    notes: row.notes || undefined,
    level: row.level,
    consecutiveCorrect: row.consecutive_correct,
    intervalDays: row.interval_days,
    easeFactor: Number(row.ease_factor),
    nextReviewDate: Number(row.next_review_date),
    lastReviewedDate: row.last_reviewed_date ? Number(row.last_reviewed_date) : undefined,
    totalReviews: row.total_reviews,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
  };
}

export function getLastSyncTime(userId: string): number {
  const stored = localStorage.getItem(`lingocards_last_sync_${userId}`);
  return stored ? Number(stored) : 0;
}

export function setLastSyncTime(userId: string, timestamp: number): void {
  localStorage.setItem(`lingocards_last_sync_${userId}`, String(timestamp));
}

/**
 * Bidirectional delta synchronization between local IndexedDB and Supabase PostgreSQL.
 */
export async function syncWithCloud(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return {
      success: false,
      uploadedDecks: 0,
      uploadedCards: 0,
      downloadedDecks: 0,
      downloadedCards: 0,
      timestamp: Date.now(),
      error: 'Supabase client is not configured.',
    };
  }

  if (!navigator.onLine) {
    return {
      success: false,
      uploadedDecks: 0,
      uploadedCards: 0,
      downloadedDecks: 0,
      downloadedCards: 0,
      timestamp: Date.now(),
      error: 'Device is offline.',
    };
  }

  const syncStartTime = Date.now();
  let lastSyncTime = getLastSyncTime(userId);

  try {
    // Smart Empty-State Detection: If local database is completely empty, force full download
    const localDecksCount = await db.decks.count();
    if (localDecksCount === 0) {
      lastSyncTime = 0;
    }

    // Step 1: Claim any guest decks and cards created prior to authentication
    await linkGuestDataToUser(userId);

    // Step 2: Upload local modifications (decks and cards where updatedAt > lastSyncTime)
    const modifiedDecks = await getModifiedDecksSince(lastSyncTime);
    let uploadedDecks = 0;
    if (modifiedDecks.length > 0) {
      const deckRows = modifiedDecks.map((d) => deckToDbRow(d, userId));
      const { error: deckUploadError } = await supabase.from('decks').upsert(deckRows);
      if (deckUploadError) {
        throw new Error(`Failed to upload decks: ${deckUploadError.message}`);
      }
      uploadedDecks = deckRows.length;
    }

    const modifiedCards = await getModifiedCardsSince(lastSyncTime);
    let uploadedCards = 0;
    if (modifiedCards.length > 0) {
      const cardRows = modifiedCards.map((c) => cardToDbRow(c, userId));
      const { error: cardUploadError } = await supabase.from('cards').upsert(cardRows);
      if (cardUploadError) {
        throw new Error(`Failed to upload cards: ${cardUploadError.message}`);
      }
      uploadedCards = cardRows.length;
    }

    // Step 3: Download remote changes created/modified since lastSyncTime
    let downloadedDecks = 0;
    let downloadedCards = 0;

    // Add a 1-hour safety buffer to account for PC vs Server clock drift
    const CLOCK_DRIFT_BUFFER = 60 * 60 * 1000;
    const safeSyncTime = Math.max(0, lastSyncTime - CLOCK_DRIFT_BUFFER);

    // Fetch remote decks updated since last sync
    const { data: remoteDecks, error: decksFetchError } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', safeSyncTime);

    if (decksFetchError) {
      throw new Error(`Failed to download remote decks: ${decksFetchError.message}`);
    }

    if (remoteDecks && remoteDecks.length > 0) {
      const convertedDecks = remoteDecks.map(dbRowToDeck);
      await bulkUpsertDecks(convertedDecks);
      downloadedDecks = convertedDecks.length;
    }

    // Fetch remote cards updated since last sync
    const { data: remoteCards, error: cardsFetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', safeSyncTime);

    if (cardsFetchError) {
      throw new Error(`Failed to download remote cards: ${cardsFetchError.message}`);
    }

    if (remoteCards && remoteCards.length > 0) {
      const convertedCards = remoteCards.map(dbRowToCard);
      await bulkUpsertCards(convertedCards);
      downloadedCards = convertedCards.length;
    }

    // Step 4: Record successful sync completion timestamp
    // We MUST use the maxServerTime to prevent the engine from thinking the newly downloaded server timestamps are local modifications!
    let maxServerTime = syncStartTime;
    if (remoteDecks) {
      for (const d of remoteDecks) {
        if (Number(d.updated_at) > maxServerTime) maxServerTime = Number(d.updated_at);
      }
    }
    if (remoteCards) {
      for (const c of remoteCards) {
        if (Number(c.updated_at) > maxServerTime) maxServerTime = Number(c.updated_at);
      }
    }

    setLastSyncTime(userId, maxServerTime);

    return {
      success: true,
      uploadedDecks,
      uploadedCards,
      downloadedDecks,
      downloadedCards,
      timestamp: maxServerTime,
    };
  } catch (err: any) {
    console.error('Cloud sync error:', err);
    return {
      success: false,
      uploadedDecks: 0,
      uploadedCards: 0,
      downloadedDecks: 0,
      downloadedCards: 0,
      timestamp: Date.now(),
      error: err.message || 'Unknown sync error',
    };
  }
}
