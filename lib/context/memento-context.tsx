'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, InAppNotification, UserRole } from '@/lib/types';
import { MockStore } from '@/lib/data/mock-store';
import { DEMO_USERS } from '@/lib/data/mock-data';
import { isSupabaseConfigured } from '@/lib/data/service';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface MementoContextType {
  currentUser: UserProfile;
  supabaseUser: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  signOut: () => Promise<void>;
  notifications: InAppNotification[];
  markNotificationRead: (id: string) => void;
  favourites: string[];
  toggleFavourite: (propertyId: string) => void;
  isFavourite: (propertyId: string) => boolean;
  currency: 'RWF' | 'USD';
  setCurrency: (c: 'RWF' | 'USD') => void;
  refresh: () => void;
}

const defaultContext: MementoContextType = {
  currentUser: DEMO_USERS.traveller,
  supabaseUser: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  signOut: async () => {},
  notifications: [],
  markNotificationRead: () => {},
  favourites: [],
  toggleFavourite: () => {},
  isFavourite: () => false,
  currency: 'RWF',
  setCurrency: () => {},
  refresh: () => {},
};

const MementoContext = createContext<MementoContextType>(defaultContext);

export function MementoProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.traveller);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [favourites, setFavourites] = useState<string[]>([
    'prop-kigali-nyarutarama',
    'prop-rubavu-kivu-lodge',
  ]);
  const [currency, setCurrency] = useState<'RWF' | 'USD'>('RWF');

  // Build a UserProfile from a Supabase user + optional DB profile row
  const buildProfile = useCallback(
    (user: User, dbProfile?: Record<string, unknown> | null): UserProfile => ({
      id: user.id,
      email: user.email ?? '',
      full_name:
        (dbProfile?.full_name as string) ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Memento Guest',
      avatar_url:
        (dbProfile?.avatar_url as string) ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        undefined,
      role: ((dbProfile?.role as UserRole) ?? 'traveller') as UserRole,
      preferred_currency: ((dbProfile?.preferred_currency as 'RWF' | 'USD') ?? 'RWF') as 'RWF' | 'USD',
      phone_number: (dbProfile?.phone_number as string) || undefined,
      created_at: (dbProfile?.created_at as string) || user.created_at,
    }),
    []
  );

  // Load profile from Supabase DB
  const loadSupabaseProfile = useCallback(
    async (user: User) => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profile = buildProfile(user, data);
        setCurrentUser(profile);
        setSupabaseUser(user);
        setIsAuthenticated(true);
      } catch {
        // Profile table might not exist yet — fall back to metadata
        const profile = buildProfile(user, null);
        setCurrentUser(profile);
        setSupabaseUser(user);
        setIsAuthenticated(true);
      }
    },
    [buildProfile]
  );

  // Bootstrap: listen to Supabase auth changes
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode — read from MockStore
      const update = () => {
        const state = MockStore.getState();
        setCurrentUser(state.currentUser);
        setNotifications(MockStore.getNotifications(state.currentUser.id));
        setFavourites([...state.favourites]);
      };
      update();
      const unsub = MockStore.subscribe(update);
      setIsLoadingAuth(false);
      return () => unsub();
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadSupabaseProfile(session.user).finally(() => setIsLoadingAuth(false));
      } else {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadSupabaseProfile(session.user);
        setIsAuthenticated(true);
      } else {
        setSupabaseUser(null);
        setIsAuthenticated(false);
        setCurrentUser(DEMO_USERS.traveller);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSupabaseProfile]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setSupabaseUser(null);
    setIsAuthenticated(false);
    setCurrentUser(DEMO_USERS.traveller);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    MockStore.markNotificationRead(id);
  }, []);

  const toggleFavourite = useCallback((propertyId: string) => {
    setFavourites((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  }, []);

  const isFavourite = useCallback(
    (propertyId: string) => favourites.includes(propertyId),
    [favourites]
  );

  const refresh = useCallback(async () => {
    if (isSupabaseConfigured() && supabaseUser) {
      await loadSupabaseProfile(supabaseUser);
    } else {
      const state = MockStore.getState();
      setCurrentUser(state.currentUser);
      setNotifications(MockStore.getNotifications(state.currentUser.id));
      setFavourites([...state.favourites]);
    }
  }, [supabaseUser, loadSupabaseProfile]);

  return (
    <MementoContext.Provider
      value={{
        currentUser,
        supabaseUser,
        isAuthenticated,
        isLoadingAuth,
        signOut,
        notifications,
        markNotificationRead,
        favourites,
        toggleFavourite,
        isFavourite,
        currency,
        setCurrency,
        refresh,
      }}
    >
      {children}
    </MementoContext.Provider>
  );
}

export function useMemento() {
  const ctx = useContext(MementoContext);
  return ctx || defaultContext;
}
