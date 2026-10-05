import { describe, it, expect } from "vitest";
import { calculateNextReview } from "./spacedRepetition";
import type { Card } from "../types";

describe("Spaced Repetition Algorithm: calculateNextReview", () => {
  const createMockCard = (overrides?: Partial<Card>): Card => ({
    id: "test-card-1",
    deckId: "deck-1",
    front: "Hola",
    back: "Hello",
    level: 0,
    consecutiveCorrect: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    lastReviewedDate: Date.now(),
    totalReviews: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  it('should reset interval and ease factor when rating is "bad"', () => {
    const card = createMockCard({
      level: 3, // Mastered
      consecutiveCorrect: 5,
      intervalDays: 10,
      easeFactor: 2.6,
      totalReviews: 5,
    });

    const result = calculateNextReview(card, "bad");

    expect(result.level).toBe(1); // Dropped back to learning/failed level
    expect(result.consecutiveCorrect).toBe(0); // Reset
    expect(result.intervalDays).toBe(0); // Reset
    expect(result.easeFactor).toBe(2.4); // 2.6 - 0.2 = 2.4
    expect(result.totalReviews).toBe(6); // Incremented

    // nextReviewDate should be 10 minutes from now (600,000 ms)
    const timeDiff = result.nextReviewDate - result.lastReviewedDate;
    expect(timeDiff).toBe(10 * 60 * 1000);
  });

  it('should slightly decrease ease factor and increase interval when rating is "medium"', () => {
    const card = createMockCard({
      level: 2,
      consecutiveCorrect: 2,
      intervalDays: 3,
      easeFactor: 2.5,
      totalReviews: 2,
    });

    const result = calculateNextReview(card, "medium");

    expect(result.level).toBe(2); // Stays at same level
    expect(result.consecutiveCorrect).toBe(2); // Retains correct count
    // intervalDays = Math.max(1, Math.round(3 * 1.3)) = Math.round(3.9) = 4
    expect(result.intervalDays).toBe(4);
    // easeFactor = Math.max(1.3, 2.5 - 0.08) = 2.42
    expect(result.easeFactor).toBe(2.42);
    expect(result.totalReviews).toBe(3);

    const expectedTimeDiff = 4 * 24 * 60 * 60 * 1000;
    expect(result.nextReviewDate - result.lastReviewedDate).toBe(
      expectedTimeDiff,
    );
  });

  it('should increase ease factor and jump interval when rating is "good"', () => {
    const card = createMockCard({
      level: 2,
      consecutiveCorrect: 2,
      intervalDays: 3,
      easeFactor: 2.5,
      totalReviews: 2,
    });

    const result = calculateNextReview(card, "good");

    // consecutiveCorrect = 2 + 1 = 3
    expect(result.consecutiveCorrect).toBe(3);

    // intervalDays = Math.max(4, Math.round(3 * 2.5)) = Math.round(7.5) = 8
    expect(result.intervalDays).toBe(8);

    // easeFactor = Math.min(3.0, 2.5 + 0.1) = 2.6
    expect(result.easeFactor).toBe(2.6);

    // consecutiveCorrect >= 3, so level should become 3 (Mastered)
    expect(result.level).toBe(3);

    const expectedTimeDiff = 8 * 24 * 60 * 60 * 1000;
    expect(result.nextReviewDate - result.lastReviewedDate).toBe(
      expectedTimeDiff,
    );
  });

  it('should handle brand new cards (level 0) correctly when rated "good"', () => {
    const newCard = createMockCard(); // level 0, 0 interval, 2.5 ease

    const result = calculateNextReview(newCard, "good");

    // First time correct: interval becomes 1, consecutive 1
    expect(result.consecutiveCorrect).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.6); // 2.5 + 0.1
    expect(result.level).toBe(2); // level 2 (learning)
  });
});
