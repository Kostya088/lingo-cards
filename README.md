# LingoCards 🗂️✨

A clean, modern, local-first flashcards web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Dexie.js (IndexedDB)** for mastering languages with spaced recall.

---

## 🚀 Getting Started

### 1. Run Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000` (or the port displayed in your terminal).

### 2. Build for Production

```bash
npm run build
```

---

## 🎯 Key Features & Workflow

- **Clean State**: Starts completely clean without preloaded dummy packs. Create your own custom decks (e.g. Italian, French, German, Spanish).
- **Spoken Self-Recall Workflow**:
  1. See the word on the front of the flashcard.
  2. Speak the translation aloud.
  3. Turn over the card (press `Space` or click).
  4. Rate your recall: **Bad (`1`)**, **Medium (`2`)**, **Good (`3`)**.
- **Adaptive Spaced Repetition**:
  - **Bad (`1`)**: Re-queues the card within the same session until learned, and shortens future review intervals.
  - **Medium (`2`)**: Short interval boost.
  - **Good (`3`)**: Advances review interval and promotes words to **Mastered**.
- **Flexible Study Filters**:
  - Study Direction: Foreign &rarr; Native or Native &rarr; Foreign.
  - Filter: All Cards, Needs Review / Difficult Only, or Unmastered Only.
- **Card Creation**:
  - Single card add/edit modal.
  - **Quick Bulk Add**: Paste multi-line vocabulary lists (`ciao - hello`, `merci : thank you`, etc.) with live preview.
- **Local-First & Portable**:
  - 100% offline browser storage using IndexedDB.
- **Keyboard Shortcuts**:
  - `Space` / `Enter`: Flip card
  - `1`: Rate Bad (Forgot / Re-queue)
  - `2`: Rate Medium (Hesitated)
  - `3`: Rate Good (Recalled well)
  - `Escape`: Exit study session

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas-Confetti
- **Storage**: IndexedDB (via Dexie.js)
- **Bundler**: Vite
