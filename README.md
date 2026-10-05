# LingoCards

An offline-first spaced repetition flashcard application.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Storage:** Dexie.js (IndexedDB) for local storage, Supabase (PostgreSQL) for cloud sync
- **Testing:** Vitest

## Architecture Highlights

- **Offline-First:** Runs entirely locally via IndexedDB. No network connection required to study.
- **Authentication & Sync:** Supabase Auth for user management, paired with a custom sync service that pushes/pulls only changed records when online.
- **Spaced Repetition System (SRS):** Custom algorithm to calculate optimal review intervals based on user ratings.

## User Experience

LingoCards is designed to be fast and distraction-free:

1. **Create:** Users start with a blank slate and build custom decks, either individually or by pasting vocabulary lists.
2. **Study:** Users test their recall by viewing the front of a card and rating how well they remembered the back (Bad, Medium, Good).
3. **Sync (Optional):** While fully functional offline, users can log in to seamlessly sync their decks and progress across devices.

## Setup & Scripts

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run unit tests (tests SRS algorithm)
npm run test

# Build for production
npm run build
```

## Features

- **Study Workflow:** Review cards, rate recall (Bad/Medium/Good), and the SRS algorithm adjusts intervals automatically.
- **Filters:** Study specific directions (Foreign -> Native) or filter by unmastered cards.
- **Bulk Add:** Paste multiline vocabulary lists for rapid deck creation.
- **Keyboard Shortcuts:**
  - `Space` / `Enter`: Flip card
  - `1`: Rate Bad
  - `2`: Rate Medium
  - `3`: Rate Good
  - `Escape`: Exit session
