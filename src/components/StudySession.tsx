import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  RotateCw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  type DeckWithStats,
  type Card,
  type Rating,
  type StudyDirection,
  type StudyFilter,
  type SessionStats,
} from '../types';
import { calculateNextReview } from '../lib/spacedRepetition';
import { updateCard } from '../db/db';

interface StudySessionProps {
  deck: DeckWithStats;
  allCards: Card[];
  onExit: () => void;
  onSessionComplete: (stats: SessionStats, retryDifficultCards: () => void) => void;
}

interface QueueItem {
  card: Card;
  isRetry: boolean;
  attempt: number;
}

export const StudySession: React.FC<StudySessionProps> = ({
  deck,
  allCards,
  onExit,
  onSessionComplete,
}) => {
  // Setup phase vs active phase
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [direction, setDirection] = useState<StudyDirection>('front-to-back');
  const [filter, setFilter] = useState<StudyFilter>('needs-review');
  const [shuffle, setShuffle] = useState(true);

  // Active study state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontCard, setFrontCard] = useState<Card | null>(null);
  const [backCard, setBackCard] = useState<Card | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  // Session stats tracking
  const [badCount, setBadCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [requeuedCount, setRequeuedCount] = useState(0);
  const [newMasteredCount, setNewMasteredCount] = useState(0);
  const [uniqueCardsStudied, setUniqueCardsStudied] = useState<Set<number>>(new Set());

  // Filter eligible cards
  const eligibleCards = useMemo(() => {
    const now = Date.now();
    return allCards.filter((card) => {
      if (filter === 'needs-review') {
        return card.level === 0 || card.level === 1 || card.nextReviewDate <= now;
      }
      if (filter === 'unmastered') {
        return card.level < 3;
      }
      return true;
    });
  }, [allCards, filter]);

  // Start study session
  const handleStartSession = useCallback(
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
    [eligibleCards, shuffle]
  );

  const currentItem = queue[currentIndex];
  const currentCard = currentItem?.card;
  const activeFrontCard = frontCard || currentCard;
  const activeBackCard = backCard || currentCard;

  // Determine what to display on Front and Back based on Direction
  const frontText = useMemo(() => {
    if (!activeFrontCard) return '';
    return direction === 'front-to-back' ? activeFrontCard.front : activeFrontCard.back;
  }, [activeFrontCard, direction]);

  const backText = useMemo(() => {
    if (!activeBackCard) return '';
    return direction === 'front-to-back' ? activeBackCard.back : activeBackCard.front;
  }, [activeBackCard, direction]);

  const backNotes = useMemo(() => {
    return activeBackCard?.notes;
  }, [activeBackCard]);

  const frontLangLabel = useMemo(() => {
    return direction === 'front-to-back' ? deck.targetLanguage : deck.nativeLanguage;
  }, [deck, direction]);

  const backLangLabel = useMemo(() => {
    return direction === 'front-to-back' ? deck.nativeLanguage : deck.targetLanguage;
  }, [deck, direction]);

  // Flip card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Handle rating a card
  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentCard || !currentCard.id) return;

      // 1. Calculate spaced repetition updates
      const result = calculateNextReview(currentCard, rating);
      if (result.level === 3 && currentCard.level !== 3) {
        setNewMasteredCount((prev) => prev + 1);
      }

      // Update database asynchronously
      await updateCard(currentCard.id, result);

      // Track stats
      if (!currentItem.isRetry) {
        if (rating === 'bad') setBadCount((prev) => prev + 1);
        else if (rating === 'medium') setMediumCount((prev) => prev + 1);
        else if (rating === 'good') setGoodCount((prev) => prev + 1);
        setUniqueCardsStudied((prev) => new Set(prev).add(currentCard.id!));
      }

      // 2. Queue handling
      let updatedQueue = [...queue];

      if (rating === 'bad') {
        // Re-queue card at the end of the session until learned!
        setRequeuedCount((prev) => prev + 1);
        updatedQueue.push({
          card: { ...currentCard, ...result },
          isRetry: true,
          attempt: currentItem.attempt + 1,
        });
      }

      // Move to next card or complete session
      const nextIndex = currentIndex + 1;
      if (nextIndex >= updatedQueue.length) {
        // Session complete!
        const finalStats: SessionStats = {
          deckTitle: deck.title,
          totalCardsStudied: uniqueCardsStudied.size + (currentItem.isRetry ? 0 : 1),
          badCount: badCount + (rating === 'bad' && !currentItem.isRetry ? 1 : 0),
          mediumCount: mediumCount + (rating === 'medium' && !currentItem.isRetry ? 1 : 0),
          goodCount: goodCount + (rating === 'good' && !currentItem.isRetry ? 1 : 0),
          requeuedCount: requeuedCount + (rating === 'bad' ? 1 : 0),
          durationMs: Date.now() - sessionStartTime,
          newMasteredCount: newMasteredCount + (result.level === 3 && currentCard.level !== 3 ? 1 : 0),
        };

        const retryDifficult = () => {
          // Find all cards from this deck that were marked Bad or Medium
          const difficultCards = allCards.filter(
            (c) => c.level === 0 || c.level === 1
          );
          handleStartSession(difficultCards.length > 0 ? difficultCards : allCards);
        };

        onSessionComplete(finalStats, retryDifficult);
      } else {
        const nextCardItem = updatedQueue[nextIndex];
        // 1. Keep backCard showing the reviewed card's answer
        setBackCard(currentCard);
        // 2. Pre-load frontCard with the next card's word
        setFrontCard(nextCardItem.card);
        // 3. Initiate the smooth 3D return flip
        setIsFlipped(false);

        // 4. Once the flip finishes rotating (800ms), sync backCard with the active card
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
      handleStartSession,
      onSessionComplete,
    ]
  );

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (isConfiguring) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate('bad');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate('medium');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate('good');
        }
      }

      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfiguring, isFlipped, handleFlip, handleRate, onExit]);

  // CONFIGURATION SCREEN (Before starting)
  if (isConfiguring) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 animate-fade-in space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {deck.targetLanguage} &rarr; {deck.nativeLanguage}
              </span>
              <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1.5">
                Study: {deck.title}
              </h1>
            </div>
            <button
              onClick={onExit}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Direction Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Study Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDirection('front-to-back')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  direction === 'front-to-back'
                    ? 'border-slate-900 dark:border-slate-400 bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white ring-2 ring-slate-900/10 dark:ring-slate-400/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{deck.targetLanguage}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{deck.nativeLanguage}</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  See foreign word &rarr; Speak translation
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDirection('back-to-front')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  direction === 'back-to-front'
                    ? 'border-slate-900 dark:border-slate-400 bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white ring-2 ring-slate-900/10 dark:ring-slate-400/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{deck.nativeLanguage}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{deck.targetLanguage}</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  See translation &rarr; Speak foreign word
                </p>
              </button>
            </div>
          </div>

          {/* Cards Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Cards to Include
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  filter === 'all'
                    ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="studyFilter"
                    checked={filter === 'all'}
                    onChange={() => setFilter('all')}
                    className="text-slate-900 dark:text-white focus:ring-slate-500"
                  />
                  <span className="text-xs font-medium">All Cards in Deck</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {allCards.length} cards
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  filter === 'needs-review'
                    ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="studyFilter"
                    checked={filter === 'needs-review'}
                    onChange={() => setFilter('needs-review')}
                    className="text-slate-900 dark:text-white focus:ring-slate-500"
                  />
                  <span className="text-xs font-medium">Needs Review / Difficult Only</span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {allCards.filter((c) => c.level === 0 || c.level === 1 || c.nextReviewDate <= Date.now()).length} cards
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  filter === 'unmastered'
                    ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="studyFilter"
                    checked={filter === 'unmastered'}
                    onChange={() => setFilter('unmastered')}
                    className="text-slate-900 dark:text-white focus:ring-slate-500"
                  />
                  <span className="text-xs font-medium">Unmastered Words Only (Exclude Level 3)</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {allCards.filter((c) => c.level < 3).length} cards
                </span>
              </label>
            </div>
          </div>

          {/* Shuffle Option */}
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-semibold">Shuffle card order</span>
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>

          {/* Start CTA */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onExit}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStartSession()}
              disabled={eligibleCards.length === 0}
              className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl shadow-lg shadow-brand-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Learning ({eligibleCards.length} Cards)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE STUDY CARD VIEW
  const progressPercent = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Session Progress Bar & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {deck.title}
            </span>
            {currentItem?.isRetry && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" />
                Retry Word
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Card <strong className="text-slate-900 dark:text-white">{currentIndex + 1}</strong> of {queue.length}
            </span>
            <button
              onClick={onExit}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Exit study session (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 transition-all duration-300"
          />
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div className="flip-card-container w-full min-h-[360px]">
        <div
          onClick={handleFlip}
          className={`flip-card-inner cursor-pointer select-none ${
            isFlipped ? 'is-flipped' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="flip-card-front bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-10 flex flex-col justify-between">
            {/* Top info */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="uppercase tracking-wider text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {frontLangLabel}
              </span>
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                Click or Space to flip
              </span>
            </div>

            {/* Center: Foreign Word */}
            <div className="text-center my-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {frontText}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                <span>🗣️ Speak translation aloud before flipping</span>
              </div>
            </div>

            {/* Bottom prompt */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card or press <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">Space</kbd> to reveal</span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="flip-card-back bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl p-8 sm:p-10 flex flex-col justify-between">
            {/* Top info */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="uppercase tracking-wider text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {backLangLabel}
              </span>
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                Answer Revealed
              </span>
            </div>

            {/* Center: Translation + Notes */}
            <div className="text-center my-auto space-y-3">
              <div className="text-xs text-slate-400 font-medium line-through">
                {direction === 'front-to-back' ? activeBackCard?.front : activeBackCard?.back}
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {backText}
              </h2>
              {backNotes && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic max-w-md mx-auto">
                  &ldquo;{backNotes}&rdquo;
                </p>
              )}
            </div>

            {/* Bottom info */}
            <div className="text-center text-xs text-slate-400">
              Rate how well you recalled this word below
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Turn Over Card <span className="text-xs opacity-75 font-normal">(Space)</span>
          </button>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs font-semibold text-center text-slate-500 dark:text-slate-400">
              How was your spoken recall?
            </p>

            <div className="grid grid-cols-3 gap-3">
              {/* BAD (1) */}
              <button
                onClick={() => handleRate('bad')}
                className="py-3 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-center transition-all group"
              >
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Bad</span>
                </div>
                <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  Forgot / Re-queue <kbd className="font-mono font-bold">(1)</kbd>
                </p>
              </button>

              {/* MEDIUM (2) */}
              <button
                onClick={() => handleRate('medium')}
                className="py-3 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-center transition-all group"
              >
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Medium</span>
                </div>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                  Hesitated <kbd className="font-mono font-bold">(2)</kbd>
                </p>
              </button>

              {/* GOOD (3) */}
              <button
                onClick={() => handleRate('good')}
                className="py-3 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center transition-all group"
              >
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Good</span>
                </div>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  Recalled well <kbd className="font-mono font-bold">(3)</kbd>
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
