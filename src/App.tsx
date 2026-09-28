import React, { useState, useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { DeckDetailScreen } from './screens/DeckDetailScreen';
import { DeckEditorScreen } from './screens/DeckEditorScreen';
import { CardEditorScreen } from './screens/CardEditorScreen';
import { BulkAddScreen } from './screens/BulkAddScreen';
import { StudyScreen } from './screens/StudyScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AuthScreen } from './screens/AuthScreen';

export interface RootOutletContext {
  setHideBottomNav: (hide: boolean) => void;
}

const RootLayout: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('lingocards_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lingocards_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lingocards_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Dynamic bottom nav visibility controlled by child routes (e.g. StudyScreen active card review)
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Determine if BottomNav is present on this route for bottom padding
  const isBottomNavRoute =
    !hideBottomNav &&
    (location.pathname === '/' ||
      /^\/deck\/[^/]+$/.test(location.pathname) ||
      location.pathname === '/profile' ||
      location.pathname.includes('/study'));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />

      <main
        className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col ${
          isBottomNavRoute ? 'pb-24 md:pb-6' : ''
        }`}
      >
        <Outlet context={{ setHideBottomNav }} />
      </main>

      <BottomNav hideBottomNav={hideBottomNav} />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'decks/new', element: <DeckEditorScreen /> },
      { path: 'decks/:deckId/edit', element: <DeckEditorScreen /> },
      { path: 'deck/:deckId', element: <DeckDetailScreen /> },
      { path: 'deck/:deckId/edit', element: <DeckEditorScreen /> },
      { path: 'deck/:deckId/cards/new', element: <CardEditorScreen /> },
      { path: 'deck/:deckId/cards/:cardId/edit', element: <CardEditorScreen /> },
      { path: 'deck/:deckId/bulk-add', element: <BulkAddScreen /> },
      { path: 'deck/:deckId/study', element: <StudyScreen /> },
      { path: 'study/due', element: <StudyScreen /> },
      { path: 'profile', element: <ProfileScreen /> },
      { path: 'auth', element: <AuthScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
