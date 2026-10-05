export type MasteryLevel = 0 | 1 | 2 | 3;

export interface Deck {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  targetLanguage: string;
  nativeLanguage: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
}

export interface Card {
  id: string;
  deckId: string;
  userId?: string;
  front: string;
  back: string;
  notes?: string;
  level: MasteryLevel;
  consecutiveCorrect: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: number;
  lastReviewedDate?: number;
  totalReviews: number;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
}

export type Rating = "bad" | "medium" | "good";

export type StudyDirection = "front-to-back" | "back-to-front";

export type StudyFilter = "all" | "needs-review" | "unmastered";

export interface StudyConfig {
  direction: StudyDirection;
  filter: StudyFilter;
  shuffle: boolean;
  limit?: number;
}

export interface SessionCardItem {
  card: Card;
  initialReviewDone: boolean;
  retryCount: number;
}

export interface SessionStats {
  deckTitle: string;
  totalCardsStudied: number;
  badCount: number;
  mediumCount: number;
  goodCount: number;
  requeuedCount: number;
  durationMs: number;
  newMasteredCount: number;
}

export interface DeckWithStats extends Deck {
  totalCards: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  masteredCount: number;
  dueCount: number;
}

export type SyncStatus =
  | "synced"
  | "syncing"
  | "offline"
  | "error"
  | "unauthenticated";

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
}
