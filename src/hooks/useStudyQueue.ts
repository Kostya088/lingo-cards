import { useState, useCallback, useMemo } from "react";
import {
  type DeckWithStats,
  type Card,
  type Rating,
  type StudyDirection,
  type StudyFilter,
  type SessionStats,
} from "../types";
import { calculateNextReview } from "../lib/spacedRepetition";
import { updateCard } from "../db";

export interface QueueItem {
  card: Card;
  isRetry: boolean;
  attempt: number;
}

export interface StudyQueueState {
  isConfiguring: boolean;
  direction: StudyDirection;
  filter: StudyFilter;
  shuffle: boolean;
  eligibleCards: Card[];
  queue: QueueItem[];
  currentIndex: number;
  currentItem: QueueItem | undefined;
  currentCard: Card | undefined;
  progressPercent: number;
  isFlipped: boolean;
  frontCard: Card | null;
  backCard: Card | null;
  frontText: string;
  backText: string;
  backNotes: string | undefined;
  frontLangLabel: string;
  backLangLabel: string;
}

export interface StudyQueueActions {
  setDirection: (d: StudyDirection) => void;
  setFilter: (f: StudyFilter) => void;
  setShuffle: (s: boolean) => void;
  startSession: (customCards?: Card[]) => void;
  flip: () => void;
  rate: (rating: Rating) => Promise<void>;
}

export function useStudyQueue(
  deck: DeckWithStats,
  allCards: Card[],
  onSessionComplete: (
    stats: SessionStats,
    retryDifficultCards: () => void,
  ) => void,
): [StudyQueueState, StudyQueueActions] {
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [direction, setDirection] = useState<StudyDirection>("front-to-back");
  const [filter, setFilter] = useState<StudyFilter>("needs-review");
  const [shuffle, setShuffle] = useState(true);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontCard, setFrontCard] = useState<Card | null>(null);
  const [backCard, setBackCard] = useState<Card | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  const [badCount, setBadCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [requeuedCount, setRequeuedCount] = useState(0);
  const [newMasteredCount, setNewMasteredCount] = useState(0);
  const [uniqueCardsStudied, setUniqueCardsStudied] = useState<Set<string>>(
    new Set(),
  );

  const eligibleCards = useMemo(() => {
    const now = Date.now();
    return allCards.filter((card) => {
      if (filter === "needs-review") {
        return (
          card.level === 0 || card.level === 1 || card.nextReviewDate <= now
        );
      }
      if (filter === "unmastered") {
        return card.level < 3;
      }
      return true;
    });
  }, [allCards, filter]);

  const startSession = useCallback(
    (customCards?: Card[]) => {
      const cardsToUse = customCards || eligibleCards;
      if (cardsToUse.length === 0) return;

      let list = [...cardsToUse];
      if (shuffle) {
        list = list.sort(() => Math.random() - 0.5);
      }

      const initialQueue: QueueItem[] = list.map((c) => ({
        card: c,
        isRetry: false,
        attempt: 1,
      }));

      const firstCard = initialQueue[0]?.card || null;
      setQueue(initialQueue);
      setCurrentIndex(0);
      setFrontCard(firstCard);
      setBackCard(firstCard);
      setIsFlipped(false);
      setSessionStartTime(Date.now());
      setBadCount(0);
      setMediumCount(0);
      setGoodCount(0);
      setRequeuedCount(0);
      setNewMasteredCount(0);
      setUniqueCardsStudied(new Set());
      setIsConfiguring(false);
    },
    [eligibleCards, shuffle],
  );

  const currentItem = queue[currentIndex];
  const currentCard = currentItem?.card;
  const activeFrontCard = frontCard || currentCard;
  const activeBackCard = backCard || currentCard;

  const frontText = useMemo(() => {
    if (!activeFrontCard) return "";
    return direction === "front-to-back"
      ? activeFrontCard.front
      : activeFrontCard.back;
  }, [activeFrontCard, direction]);

  const backText = useMemo(() => {
    if (!activeBackCard) return "";
    return direction === "front-to-back"
      ? activeBackCard.back
      : activeBackCard.front;
  }, [activeBackCard, direction]);

  const backNotes = useMemo(() => {
    return activeBackCard?.notes;
  }, [activeBackCard]);

  const frontLangLabel = useMemo(() => {
    return direction === "front-to-back"
      ? deck.targetLanguage
      : deck.nativeLanguage;
  }, [deck, direction]);

  const backLangLabel = useMemo(() => {
    return direction === "front-to-back"
      ? deck.nativeLanguage
      : deck.targetLanguage;
  }, [deck, direction]);

  const flip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!currentCard || !currentCard.id) return;

      const result = calculateNextReview(currentCard, rating);
      if (result.level === 3 && currentCard.level !== 3) {
        setNewMasteredCount((prev) => prev + 1);
      }

      await updateCard(currentCard.id, result);

      if (currentItem && !currentItem.isRetry) {
        if (rating === "bad") setBadCount((prev) => prev + 1);
        else if (rating === "medium") setMediumCount((prev) => prev + 1);
        else if (rating === "good") setGoodCount((prev) => prev + 1);
        setUniqueCardsStudied((prev) => new Set(prev).add(currentCard.id!));
      }

      let updatedQueue = [...queue];

      if (rating === "bad") {
        setRequeuedCount((prev) => prev + 1);
        updatedQueue.push({
          card: { ...currentCard, ...result },
          isRetry: true,
          attempt: (currentItem?.attempt || 1) + 1,
        });
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= updatedQueue.length) {
        const finalStats: SessionStats = {
          deckTitle: deck.title,
          totalCardsStudied:
            uniqueCardsStudied.size + (currentItem?.isRetry ? 0 : 1),
          badCount:
            badCount + (rating === "bad" && !currentItem?.isRetry ? 1 : 0),
          mediumCount:
            mediumCount +
            (rating === "medium" && !currentItem?.isRetry ? 1 : 0),
          goodCount:
            goodCount + (rating === "good" && !currentItem?.isRetry ? 1 : 0),
          requeuedCount: requeuedCount + (rating === "bad" ? 1 : 0),
          durationMs: Date.now() - sessionStartTime,
          newMasteredCount:
            newMasteredCount +
            (result.level === 3 && currentCard.level !== 3 ? 1 : 0),
        };

        const retryDifficult = () => {
          const difficultCards = allCards.filter(
            (c) => c.level === 0 || c.level === 1,
          );
          startSession(difficultCards.length > 0 ? difficultCards : allCards);
        };

        onSessionComplete(finalStats, retryDifficult);
      } else {
        const nextCardItem = updatedQueue[nextIndex];
        setBackCard(currentCard);
        setFrontCard(nextCardItem.card);
        setIsFlipped(false);
        setTimeout(() => {
          setQueue(updatedQueue);
          setCurrentIndex(nextIndex);
          setBackCard(nextCardItem.card);
        }, 800);
      }
    },
    [
      currentCard,
      currentItem,
      currentIndex,
      queue,
      deck.title,
      uniqueCardsStudied,
      badCount,
      mediumCount,
      goodCount,
      requeuedCount,
      newMasteredCount,
      sessionStartTime,
      allCards,
      startSession,
      onSessionComplete,
    ],
  );

  const progressPercent =
    queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const state: StudyQueueState = {
    isConfiguring,
    direction,
    filter,
    shuffle,
    eligibleCards,
    queue,
    currentIndex,
    currentItem,
    currentCard,
    progressPercent,
    isFlipped,
    frontCard,
    backCard,
    frontText,
    backText,
    backNotes,
    frontLangLabel,
    backLangLabel,
  };

  const actions: StudyQueueActions = {
    setDirection,
    setFilter,
    setShuffle,
    startSession,
    flip,
    rate,
  };

  return [state, actions];
}
