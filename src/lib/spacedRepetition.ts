import { type Card, type Rating, type MasteryLevel } from '../types';

export interface ReviewResult {
  level: MasteryLevel;
  consecutiveCorrect: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: number;
  lastReviewedDate: number;
  totalReviews: number;
}

export function calculateNextReview(card: Card, rating: Rating): ReviewResult {
  const now = Date.now();
  let consecutiveCorrect = card.consecutiveCorrect || 0;
  let intervalDays = card.intervalDays || 0;
  let easeFactor = card.easeFactor || 2.5;
  let level: MasteryLevel = card.level;

  if (rating === 'bad') {
    // Reset streak on failure
    consecutiveCorrect = 0;
    intervalDays = 0;
    // Lower ease factor (minimum 1.3)
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    level = 1; // Mark as Learning / Needs practice
    // Due again soon (same day / 10 mins)
    const nextReviewDate = now + 10 * 60 * 1000;

    return {
      level,
      consecutiveCorrect,
      intervalDays,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReviewDate,
      lastReviewedDate: now,
      totalReviews: (card.totalReviews || 0) + 1,
    };
  }

  if (rating === 'medium') {
    // Retained, but with difficulty
    consecutiveCorrect = Math.max(1, consecutiveCorrect);
    if (intervalDays === 0) {
      intervalDays = 1;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * 1.3));
    }
    // Slight ease penalty
    easeFactor = Math.max(1.3, easeFactor - 0.08);
    // Level stays at least 1 or 2
    level = card.level === 0 ? 1 : card.level === 3 ? 2 : card.level;
    const nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;

    return {
      level,
      consecutiveCorrect,
      intervalDays,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReviewDate,
      lastReviewedDate: now,
      totalReviews: (card.totalReviews || 0) + 1,
    };
  }

  // rating === 'good'
  consecutiveCorrect += 1;
  if (consecutiveCorrect === 1) {
    intervalDays = 1;
  } else if (consecutiveCorrect === 2) {
    intervalDays = 3;
  } else {
    intervalDays = Math.max(4, Math.round((intervalDays || 3) * easeFactor));
  }

  // Reward ease factor (up to 3.0)
  easeFactor = Math.min(3.0, easeFactor + 0.1);

  // Promote to Mastered if 3+ consecutive correct or >= 10 day interval
  if (consecutiveCorrect >= 3 || intervalDays >= 10) {
    level = 3; // Mastered
  } else {
    level = 2; // In Review
  }

  const nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;

  return {
    level,
    consecutiveCorrect,
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate,
    lastReviewedDate: now,
    totalReviews: (card.totalReviews || 0) + 1,
  };
}
