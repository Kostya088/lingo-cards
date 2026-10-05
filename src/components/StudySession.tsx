import React, { useEffect } from "react";
import { type DeckWithStats, type Card, type SessionStats } from "../types";
import { useStudyQueue } from "../hooks/useStudyQueue";
import { StudyConfigPanel } from "./StudyConfigPanel";
import { StudyCardView } from "./StudyCardView";

interface StudySessionProps {
  deck: DeckWithStats;
  allCards: Card[];
  onExit: () => void;
  onSessionComplete: (
    stats: SessionStats,
    retryDifficultCards: () => void,
  ) => void;
  onStateChange?: (isConfiguring: boolean) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  deck,
  allCards,
  onExit,
  onSessionComplete,
  onStateChange,
}) => {
  const [state, actions] = useStudyQueue(deck, allCards, onSessionComplete);

  useEffect(() => {
    onStateChange?.(state.isConfiguring);
  }, [state.isConfiguring, onStateChange]);

  useEffect(() => {
    if (state.isConfiguring) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ["input", "textarea"].includes(
          (e.target as HTMLElement)?.tagName?.toLowerCase(),
        )
      ) {
        return;
      }

      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        actions.flip();
      } else if (state.isFlipped) {
        if (e.key === "1") {
          e.preventDefault();
          actions.rate("bad");
        } else if (e.key === "2") {
          e.preventDefault();
          actions.rate("medium");
        } else if (e.key === "3") {
          e.preventDefault();
          actions.rate("good");
        }
      }

      if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isConfiguring, state.isFlipped, actions, onExit]);

  if (state.isConfiguring) {
    return (
      <StudyConfigPanel
        deck={deck}
        allCards={allCards}
        direction={state.direction}
        filter={state.filter}
        shuffle={state.shuffle}
        eligibleCount={state.eligibleCards.length}
        onDirectionChange={actions.setDirection}
        onFilterChange={actions.setFilter}
        onShuffleChange={actions.setShuffle}
        onStart={() => actions.startSession()}
        onExit={onExit}
      />
    );
  }

  const activeBackCard = state.backCard || state.currentCard;

  return (
    <StudyCardView
      deckTitle={deck.title}
      isRetry={state.currentItem?.isRetry ?? false}
      currentIndex={state.currentIndex}
      totalCards={state.queue.length}
      progressPercent={state.progressPercent}
      isFlipped={state.isFlipped}
      frontText={state.frontText}
      backText={state.backText}
      backNotes={state.backNotes}
      frontLangLabel={state.frontLangLabel}
      backLangLabel={state.backLangLabel}
      activeFrontWord={activeBackCard?.front || ""}
      activeBackWord={activeBackCard?.back || ""}
      direction={state.direction}
      onFlip={actions.flip}
      onRate={actions.rate}
      onExit={onExit}
    />
  );
};
