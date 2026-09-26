export type MasteryLevel = 0 | 1 | 2 | 3;
// 0: New (Never studied or reset)
// 1: Learning (Bad/Medium)
// 2: Review (Good, 1-2 intervals)
// 3: Mastered (Consistent Good / High interval)

export interface Deck {
  id?: number;
  title: string;
  description?: string;
  targetLanguage: string; // e.g. "Italian", "French", "German"
  nativeLanguage: string; // e.g. "English"
  color: string; // e.g. "emerald", "blue", "indigo", "rose", "amber", "purple"
  createdAt: number;
  updatedAt: number;
}

export interface Card {
  id?: number;
  deckId: number;
  front: string; // Target language word / phrase (or front of card)
  back: string; // Translation / Meaning
  notes?: string; // Optional context, example sentence, pronunciation tip
  level: MasteryLevel;
  consecutiveCorrect: number;
  intervalDays: number;
  easeFactor: number; // default 2.5
  nextReviewDate: number; // timestamp in ms
  lastReviewedDate?: number; // timestamp in ms
  totalReviews: number;
  createdAt: number;
}

export type Rating = 'bad' | 'medium' | 'good';

export type StudyDirection = 'front-to-back' | 'back-to-front';
// front-to-back: Show Foreign Word -> User recalls Translation
// back-to-front: Show Translation -> User recalls Foreign Word

export type StudyFilter = 'all' | 'needs-review' | 'unmastered';
// all: all cards in the deck
// needs-review: level 0/1 or due date <= today
// unmastered: level < 3

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
