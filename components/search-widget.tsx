'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users, X, ChevronRight } from 'lucide-react';
import { DEMO_DESTINATIONS } from '@/lib/data/mock-data';

interface SearchWidgetProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  compact?: boolean;
  className?: string;
}

export function SearchWidget({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 1,
  compact = false,
  className = '',
}: SearchWidgetProps) {
  const router = useRouter();

  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false);
        setShowGuestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDestinations = DEMO_DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(destination.toLowerCase()) ||
      d.province.toLowerCase().includes(destination.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', guests.toString());

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSearch}
        className={`mx-auto flex flex-col md:flex-row items-stretch rounded-3xl border border-stone-200/90 bg-white p-2 shadow-xl shadow-stone-900/5 transition-all focus-within:shadow-2xl focus-within:border-stone-300 ${
          compact ? 'py-1.5 px-2' : 'py-2 px-3'
        }`}
      >
        {/* Destination Field with Rwandan Autocomplete */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-stone-100 px-4 py-2 hover:bg-stone-50 rounded-2xl transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Where in Rwanda?
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <MapPin className="h-4 w-4 text-[#b94726] shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => setShowDestDropdown(true)}
              placeholder="Kigali, Musanze, Lake Kivu..."
              className="w-full bg-transparent text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Rwandan Destination Autocomplete Menu */}
          {showDestDropdown && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Popular Rwandan Destinations
              </div>
              <div className="mt-1 max-h-60 overflow-y-auto space-y-1">
                {filteredDestinations.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => {
                      setDestination(dest.name);
                      setShowDestDropdown(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#b94726]">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">{dest.name}</div>
                        <div className="text-[11px] text-stone-500">{dest.province}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Check-In Date */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-stone-100 px-4 py-2 hover:bg-stone-50 rounded-2xl transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Check-In
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="h-4 w-4 text-[#1f4e3d] shrink-0" />
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-stone-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Check-Out Date */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-stone-100 px-4 py-2 hover:bg-stone-50 rounded-2xl transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Check-Out
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="h-4 w-4 text-[#1f4e3d] shrink-0" />
            <input
              type="date"
              value={checkOut}
              min={checkIn || new Date().toISOString().split('T')[0]}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-stone-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Guests Field */}
        <div className="relative flex-1 px-4 py-2 hover:bg-stone-50 rounded-2xl transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Guests
          </label>
          <button
            type="button"
            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
            className="flex items-center gap-2 mt-0.5 w-full text-left"
          >
            <Users className="h-4 w-4 text-[#d99b26] shrink-0" />
            <span className="text-sm font-medium text-stone-900">
              {guests} {guests === 1 ? 'Guest' : 'Guests'}
            </span>
          </button>

          {/* Guest Selector Popover */}
          {showGuestDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-stone-900">Number of Guests</div>
                  <div className="text-xs text-stone-500">Adults and children</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={guests <= 1}
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-600 disabled:opacity-40 hover:border-stone-800"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-stone-900">{guests}</span>
                  <button
                    type="button"
                    disabled={guests >= 16}
                    onClick={() => setGuests(guests + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:border-stone-800"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Submit Button */}
        <div className="flex items-center p-1">
          <button
            type="submit"
            className="flex h-12 w-full md:w-auto items-center justify-center gap-2 rounded-2xl bg-[#b94726] px-6 text-sm font-semibold text-white shadow-md shadow-[#b94726]/20 transition-all hover:bg-[#9e3b1e] hover:shadow-lg active:scale-95"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}

