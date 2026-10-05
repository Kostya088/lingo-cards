import React, { useState, useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./screens/HomeScreen";
import { DeckDetailScreen } from "./screens/DeckDetailScreen";
import { DeckEditorScreen } from "./screens/DeckEditorScreen";
import { CardEditorScreen } from "./screens/CardEditorScreen";
import { BulkAddScreen } from "./screens/BulkAddScreen";
import { StudyScreen } from "./screens/StudyScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

export interface RootOutletContext {
  setHideBottomNav: (hide: boolean) => void;
  setHideTopNav: (hide: boolean) => void;
}

const RootLayout: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("lingocards_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lingocards_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lingocards_theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [hideTopNav, setHideTopNav] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isHeaderHiddenOnMobile =
    hideTopNav ||
    location.pathname.startsWith("/decks/new") ||
    location.pathname.includes("/edit") ||
    location.pathname.includes("/cards/") ||
    location.pathname.includes("/bulk-add") ||
    location.pathname === "/auth";

  const isBottomNavRoute =
    !hideBottomNav &&
    (location.pathname === "/" ||
      /^\/decks\/[^/]+$/.test(location.pathname) ||
      location.pathname === "/profile" ||
      location.pathname.includes("/study"));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        hideOnMobile={hideTopNav}
      />

      <main
        className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col ${
          isHeaderHiddenOnMobile ? "pt-0 sm:pt-6" : "pt-4 sm:pt-6"
        } ${isBottomNavRoute ? "pb-bottom-nav md:pb-6" : "pb-6"}`}
      >
        <ErrorBoundary>
          <Outlet context={{ setHideBottomNav, setHideTopNav }} />
        </ErrorBoundary>
      </main>

      <BottomNav hideBottomNav={hideBottomNav} />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: "decks/new", element: <DeckEditorScreen /> },
      { path: "decks/:deckId", element: <DeckDetailScreen /> },
      { path: "decks/:deckId/edit", element: <DeckEditorScreen /> },
      { path: "decks/:deckId/cards/new", element: <CardEditorScreen /> },
      {
        path: "decks/:deckId/cards/:cardId/edit",
        element: <CardEditorScreen />,
      },
      { path: "decks/:deckId/bulk-add", element: <BulkAddScreen /> },
      { path: "decks/:deckId/study", element: <StudyScreen /> },
      { path: "profile", element: <ProfileScreen /> },
      { path: "auth", element: <AuthScreen /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
