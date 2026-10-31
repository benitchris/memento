'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './logo';
import { useMemento } from '@/lib/context/memento-context';
import {
  Bell,
  Globe,
  Menu,
  X,
  Heart,
  Calendar,
  Building,
  ShieldCheck,
  Sparkles,
  LogOut,
  LogIn,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    isLoadingAuth,
    signOut,
    notifications,
    markNotificationRead,
    favourites,
    currency,
    setCurrency,
  } = useMemento();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const isAdmin = currentUser.role === 'admin';
  const isHost = currentUser.role === 'host' || isAdmin;

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo showTagline={true} />

        <nav className="hidden md:flex items-center gap-1 font-medium text-stone-700">
          <Link
            href="/search"
            className={`rounded-full px-4 py-2 text-sm transition-colors hover:bg-stone-100 ${
              pathname === '/search' ? 'font-semibold text-[#b94726]' : ''
            }`}
          >
            Explore Rwanda
          </Link>
          <Link
            href="/destinations"
            className="rounded-full px-4 py-2 text-sm transition-colors hover:bg-stone-100"
          >
            Destinations
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full px-4 py-2 text-sm transition-colors hover:bg-stone-100"
          >
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setCurrency(currency === 'RWF' ? 'USD' : 'RWF')}
            className="flex items-center gap-1 rounded-full p-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            title="Switch display currency"
          >
            <Globe className="h-4 w-4" />
            <span>{currency}</span>
          </button>

          <Link
            href="/become-a-host"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800 hover:border-stone-900 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#b94726]" />
            <span>Become a host</span>
          </Link>

          {isLoadingAuth ? (
            <div
              className="h-9 w-9 animate-pulse rounded-full bg-stone-100"
              aria-label="Loading account"
            />
          ) : isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="relative rounded-full p-2 text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b94726] text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2 px-2">
                      <h3 className="font-semibold text-stone-800 text-sm">Notifications</h3>
                      <span className="text-xs text-stone-500">{notifications.length} total</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 py-1">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-xs text-stone-400">No notifications yet</p>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => markNotificationRead(notif.id)}
                            className={`block w-full p-3 text-left transition-colors hover:bg-stone-50 rounded-xl ${
                              !notif.is_read ? 'bg-[#b94726]/5 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-900">
                              <span>{notif.title}</span>
                              {!notif.is_read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#b94726]" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-stone-600 leading-snug">{notif.message}</p>
                            <span className="mt-1.5 block text-[10px] text-stone-400">
                              {new Date(notif.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 px-3 shadow-sm hover:shadow transition-shadow"
                  aria-label="Open account menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <Menu className="h-4 w-4 text-stone-600" />
                  <span className="hidden max-w-[90px] truncate text-xs font-semibold text-stone-700 lg:block">
                    {currentUser.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#b94726] to-[#d99b26] text-xs font-bold text-white">
                    {currentUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      currentUser.full_name?.charAt(0)?.toUpperCase() || 'M'
                    )}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="border-b border-stone-100 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {currentUser.full_name}
                      </p>
                      <p className="truncate text-xs text-stone-500">{currentUser.email}</p>
                      {isHost && (
                        <span className="mt-1 inline-flex items-center rounded-md bg-[#1f4e3d]/10 px-2 py-0.5 text-[11px] font-medium text-[#1f4e3d]">
                          {isAdmin ? 'Administrator' : 'Host'}
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-stone-400" />
                        <span>My Trips &amp; Bookings</span>
                      </Link>
                      <Link
                        href="/dashboard/favourites"
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Heart className="h-4 w-4 text-stone-400" />
                          <span>Saved Favourites</span>
                        </div>
                        {favourites.length > 0 && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                            {favourites.length}
                          </span>
                        )}
                      </Link>

                      {isHost ? (
                        <>
                          <div className="my-1 border-t border-stone-100" />
                          <Link
                            href="/host"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
                          >
                            <Building className="h-4 w-4 text-[#b94726]" />
                            <span>Host Dashboard</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <div className="my-1 border-t border-stone-100" />
                          <Link
                            href="/become-a-host"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
                          >
                            <Building className="h-4 w-4 text-[#b94726]" />
                            <span>Start hosting</span>
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4 text-[#1f4e3d]" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      <div className="my-1 border-t border-stone-100" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/auth/login"
                className="rounded-full px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-[#1f4e3d] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#173c2f] transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-full p-2 text-stone-700 hover:bg-stone-100"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-1">
          <Link
            href="/search"
            className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            Explore accommodations
          </Link>
          <Link
            href="/destinations"
            className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            Destinations
          </Link>
          <Link
            href="/how-it-works"
            className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            How it works
          </Link>
          <Link
            href="/become-a-host"
            className="block rounded-lg px-3 py-2.5 text-base font-semibold text-[#b94726] hover:bg-orange-50"
          >
            List your accommodation
          </Link>

          <div className="my-2 border-t border-stone-100" />

          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
              >
                My trips &amp; bookings
              </Link>
              <Link
                href="/dashboard/favourites"
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
              >
                Saved favourites
              </Link>
              {isHost && (
                <Link
                  href="/host"
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
                >
                  Host dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
                >
                  Admin portal
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-stone-900 hover:bg-stone-50"
              >
                <LogIn className="h-4 w-4 text-stone-400" />
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="mx-3 mt-1 block rounded-xl bg-[#1f4e3d] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#173c2f]"
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
