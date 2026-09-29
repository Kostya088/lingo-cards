import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDecks } from "../hooks/useDecks";
import { ProfileSettings } from "../components/ProfileSettings";

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    syncStatus,
    lastSyncedAt,
    syncError,
    signOut,
    syncNow,
    isConfigured,
  } = useAuth();
  
  const { decks, refresh } = useDecks();

  return (
    <ProfileSettings
      user={user}
      syncStatus={syncStatus}
      lastSyncedAt={lastSyncedAt}
      syncError={syncError}
      signOut={signOut}
      syncNow={syncNow}
      isConfigured={isConfigured}
      decks={decks}
      refreshDecks={refresh}
      onNavigateHome={() => navigate("/")}
      onNavigateAuth={() => navigate("/auth")}
    />
  );
};
