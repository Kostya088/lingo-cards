import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { type SyncStatus } from '../types';
import { syncWithCloud, getLastSyncTime } from '../services/syncService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  syncError: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('unauthenticated');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isConfigured = isSupabaseConfigured();

  // Trigger sync for current user
  const runSync = useCallback(async (targetUserId: string) => {
    if (!isConfigured || !supabase) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      setSyncStatus('syncing');
      setSyncError(null);
      const result = await syncWithCloud(targetUserId);

      if (result.success) {
        setSyncStatus('synced');
        setLastSyncedAt(result.timestamp);
      } else {
        setSyncStatus('error');
        setSyncError(result.error || 'Failed to sync with cloud.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'Sync encountered an error.');
    }
  }, [isConfigured]);

  const syncNow = useCallback(async () => {
    if (user?.id) {
      await runSync(user.id);
    }
  }, [user?.id, runSync]);

  // Initial Auth Session & Subscription
  useEffect(() => {
    if (!isConfigured || !supabase) {
      setIsLoading(false);
      setSyncStatus('unauthenticated');
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLastSyncedAt(getLastSyncTime(session.user.id) || null);
        runSync(session.user.id);
      } else {
        setSyncStatus('unauthenticated');
      }
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          setLastSyncedAt(getLastSyncTime(newUser.id) || null);
          await runSync(newUser.id);
        } else {
          setSyncStatus('unauthenticated');
          setLastSyncedAt(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, runSync]);

  // Network connection status listeners
  useEffect(() => {
    const handleOnline = () => {
      if (user?.id) {
        runSync(user.id);
      } else {
        setSyncStatus('unauthenticated');
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, runSync]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  // Sign Up
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  // Sign Out
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSyncStatus('unauthenticated');
    setLastSyncedAt(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        syncStatus,
        lastSyncedAt,
        syncError,
        isConfigured,
        isLoading,
        signIn,
        signUp,
        signOut,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
