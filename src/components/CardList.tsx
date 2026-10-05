import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { type Card, type MasteryLevel } from "../types";

interface CardListProps {
  cards: Card[];
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
}

const LEVEL_LABELS: Record<
  MasteryLevel,
  { label: string; bg: string; text: string }
> = {
  0: {
    label: "New",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
  },
  1: {
    label: "Learning",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  2: {
    label: "Review",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  3: {
    label: "Mastered",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};

export const CardList: React.FC<CardListProps> = ({
  cards,
  onEditCard,
  onDeleteCard,
}) => {
  const now = Date.now();

  return (
    <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
      {cards.map((card) => {
        const lvlInfo = LEVEL_LABELS[card.level] || LEVEL_LABELS[0];
        const isDue = card.nextReviewDate <= now;

        return (
          <div
            key={card.id}
            className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvlInfo.bg} ${lvlInfo.text}`}
                >
                  {lvlInfo.label}
                </span>
                {isDue && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    Due Now
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditCard(card)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit card"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => card.id && onDeleteCard(card.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Delete card"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white break-words">
                {card.front}
              </span>
              <span className="text-xs text-slate-400 font-normal">&rarr;</span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 break-words">
                {card.back}
              </span>
            </div>

            {card.notes && (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-2 pt-0.5">
                &ldquo;{card.notes}&rdquo;
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
