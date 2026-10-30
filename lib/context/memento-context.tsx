'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, InAppNotification, UserRole } from '@/lib/types';
import { MockStore } from '@/lib/data/mock-store';
import { DEMO_USERS } from '@/lib/data/mock-data';

interface MementoContextType {
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
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
  switchRole: () => {},
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
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [favourites, setFavourites] = useState<string[]>(['prop-kigali-nyarutarama', 'prop-rubavu-kivu-lodge']);
  const [currency, setCurrency] = useState<'RWF' | 'USD'>('RWF');

  useEffect(() => {
    const update = () => {
      const state = MockStore.getState();
      setCurrentUser(state.currentUser);
      setNotifications(MockStore.getNotifications(state.currentUser.id));
      setFavourites([...state.favourites]);
    };

    update();
    const unsub = MockStore.subscribe(update);
    return () => unsub();
  }, []);

  const switchRole = (role: UserRole) => {
    MockStore.setCurrentUserRole(role);
    const user = MockStore.getCurrentUser();
    setCurrentUser(user);
    setNotifications(MockStore.getNotifications(user.id));
  };

  const markNotificationRead = (id: string) => {
    MockStore.markNotificationRead(id);
  };

  const toggleFavourite = (propertyId: string) => {
    MockStore.toggleFavourite(propertyId);
  };

  const isFavourite = (propertyId: string) => {
    return favourites.includes(propertyId);
  };

  const refresh = () => {
    const state = MockStore.getState();
    setCurrentUser(state.currentUser);
    setNotifications(MockStore.getNotifications(state.currentUser.id));
    setFavourites([...state.favourites]);
  };

  return (
    <MementoContext.Provider
      value={{
        currentUser,
        switchRole,
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
