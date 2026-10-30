'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { useMemento } from '@/lib/context/memento-context';
import {
  Bell,
  Globe,
  Menu,
  X,
  User,
  Heart,
  Calendar,
  Building,
  ShieldCheck,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    switchRole,
    notifications,
    markNotificationRead,
    favourites,
    currency,
    setCurrency,
  } = useMemento();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Logo showTagline={true} />

        {/* Center Navigation Links */}
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

        {/* Right Navigation & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill (Great for reviewer testing) */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-100 transition-colors"
              title="Test Memento as different personas"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="capitalize">{currentUser.role}</span>
              <ChevronDown className="h-3 w-3 text-stone-400" />
            </button>

            {roleSwitcherOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setRoleSwitcherOpen(false)}
              >
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Switch Active Persona
                </div>
                {(['traveller', 'host', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      currentUser.role === r
                        ? 'bg-[#b94726]/10 font-semibold text-[#b94726]'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="capitalize font-medium">{r}</span>
                      <span className="text-[11px] text-stone-400">
                        {r === 'traveller'
                          ? 'David Karemera'
                          : r === 'host'
                          ? 'Jean-Paul (Host)'
                          : 'Diane (Marketplace Admin)'}
                      </span>
                    </div>
                    {currentUser.role === r && <Check className="h-4 w-4 text-[#b94726]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Toggle */}
          <button
            onClick={() => setCurrency(currency === 'RWF' ? 'USD' : 'RWF')}
            className="flex items-center gap-1 rounded-full p-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            title="Switch display currency"
          >
            <Globe className="h-4 w-4" />
            <span>{currency}</span>
          </button>

          {/* Become a Host CTA */}
          <Link
            href="/become-a-host"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800 hover:border-stone-900 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#b94726]" />
            <span>Become a host</span>
          </Link>

          {/* In-App Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileDropdownOpen(false);
              }}
              className="relative rounded-full p-2 text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b94726] text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
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
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3 text-left transition-colors hover:bg-stone-50 cursor-pointer rounded-xl ${
                          !notif.is_read ? 'bg-[#b94726]/5 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
                          <span>{notif.title}</span>
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-[#b94726]"></span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-stone-600 leading-snug">{notif.message}</p>
                        <span className="mt-1.5 block text-[10px] text-stone-400">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 px-3 shadow-sm hover:shadow transition-shadow"
            >
              <Menu className="h-4 w-4 text-stone-600" />
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#b94726] to-[#d99b26] text-xs font-bold text-white overflow-hidden">
                {currentUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="h-full w-full object-cover" />
                ) : (
                  currentUser.full_name.charAt(0)
                )}
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl z-50"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="border-b border-stone-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-stone-900">{currentUser.full_name}</p>
                  <p className="text-xs text-stone-500">{currentUser.email}</p>
                  <span className="mt-1 inline-flex items-center rounded-md bg-[#1f4e3d]/10 px-2 py-0.5 text-[11px] font-medium text-[#1f4e3d] capitalize">
                    {currentUser.role} Account
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-stone-400" />
                    <span>My Trips & Bookings</span>
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

                  <div className="my-1 border-t border-stone-100" />

                  {/* Host Section */}
                  <Link
                    href="/host"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
                  >
                    <Building className="h-4 w-4 text-[#b94726]" />
                    <span>Host Dashboard</span>
                  </Link>

                  {/* Admin Section */}
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#1f4e3d]" />
                    <span>Admin Portal</span>
                  </Link>

                  <div className="my-1 border-t border-stone-100" />

                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-stone-400" />
                    <span>Account Settings / Login</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-full p-2 text-stone-700 hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            Explore Accommodations
          </Link>
          <Link
            href="/become-a-host"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-semibold text-[#b94726] hover:bg-orange-50"
          >
            List your accommodation (Become a host)
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            My Trips & Bookings
          </Link>
          <Link
            href="/host"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            Host Dashboard
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-stone-900 hover:bg-stone-50"
          >
            Marketplace Admin
          </Link>
        </div>
      )}
    </header>
  );
}
