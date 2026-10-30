'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SearchWidget } from '@/components/search-widget';
import { CategoryBar } from '@/components/category-bar';
import { PropertyCard } from '@/components/property-card';
import { useMemento } from '@/lib/context/memento-context';
import { MockStore } from '@/lib/data/mock-store';
import {
  MapPin,
  Sparkles,
  ShieldCheck,
  Building,
  HeartHandshake,
  Compass,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { currency } = useMemento();

  const allApproved = MockStore.getProperties().filter((p) => p.status === 'approved');
  const destinations = MockStore.getDestinations();

  // Category filtering for the live grid
  const filteredProperties =
    selectedCategory === 'all'
      ? allApproved
      : allApproved.filter((p) => p.property_type === selectedCategory);

  // Discovery segments
  const featuredStays = allApproved.filter((p) => p.is_featured);
  const affordableStays = [...allApproved].sort((a, b) => {
    const aMin = Math.min(...(a.units?.map((u) => u.base_price_rwf) || [0]));
    const bMin = Math.min(...(b.units?.map((u) => u.base_price_rwf) || [0]));
    return aMin - bMin;
  });
  const luxuryStays = [...allApproved].sort((a, b) => {
    const aMin = Math.min(...(a.units?.map((u) => u.base_price_rwf) || [0]));
    const bMin = Math.min(...(b.units?.map((u) => u.base_price_rwf) || [0]));
    return bMin - aMin;
  });
  const privateRooms = allApproved.filter(
    (p) =>
      p.property_type === 'private_room' ||
      p.units?.some((u) => !u.is_entire_property && u.unit_type === 'room')
  );
  const entireHomes = allApproved.filter(
    (p) =>
      p.property_type === 'entire_home' ||
      p.property_type === 'apartment' ||
      p.units?.some((u) => u.is_entire_property)
  );

  return (
    <div className="flex flex-col gap-12 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-stone-900 pt-16 pb-24 text-white">
        {/* Background photo & overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-rwanda.png"
            alt="Lake Kivu, Rwanda"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-amber-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Rwanda’s Universal Accommodation Marketplace</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-serif max-w-4xl mx-auto leading-tight">
            Find your place in Rwanda.
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-stone-300 font-light">
            From a private room to a luxury retreat, discover places worth staying across the Land of a Thousand Hills.
          </p>

          {/* Prominent Search Widget */}
          <div className="mt-10 max-w-4xl mx-auto text-left">
            <SearchWidget />
          </div>

          {/* Quick Destination Tags */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-300">
            <span className="font-semibold text-stone-400">Popular:</span>
            {['Kigali', 'Musanze', 'Rubavu', 'Karongi', 'Akagera', 'Huye'].map((dest) => (
              <Link
                key={dest}
                href={`/search?destination=${dest}`}
                className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition-colors"
              >
                {dest}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY BAR */}
      <section className="-mt-6 z-20">
        <CategoryBar
          selectedType={selectedCategory}
          onSelect={(type) => setSelectedCategory(type)}
        />
      </section>

      {/* DEMO NOTICE BANNER (Prominently fulfilling prompt requirements) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold">
              ℹ
            </span>
            <div>
              <p className="font-bold">Clearly Labelled Demonstration Data Environment</p>
              <p className="text-amber-800 text-[11px]">
                These listings demonstrate the universal accommodation engine (from single private bedrooms to whole hotel room inventories). Try searching, selecting units, and placing a booking!
              </p>
            </div>
          </div>
          <button
            onClick={() => MockStore.resetToDemo()}
            className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
          >
            Reset Demo State
          </button>
        </div>
      </div>

      {/* 3. FEATURED STAYS & DISCOVERY GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#b94726]">
              Handpicked Stays
            </span>
            <h2 className="text-2xl font-bold text-stone-900 font-serif">
              {selectedCategory === 'all'
                ? 'Featured Accommodation in Rwanda'
                : `Verified ${selectedCategory.replace('_', ' ')} Options`}
            </h2>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-1 text-xs font-semibold text-[#b94726] hover:underline"
          >
            <span>View all ({allApproved.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="my-12 rounded-3xl border border-stone-200 bg-white p-12 text-center">
            <Compass className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-lg font-bold text-stone-800">No properties in this category yet</h3>
            <p className="mt-1 text-sm text-stone-500">
              Try switching back to &quot;All Stays&quot; or explore another Rwandan region.
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 rounded-xl bg-[#b94726] px-4 py-2 text-xs font-semibold text-white"
            >
              Show all stays
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* 4. POPULAR RWANDAN DESTINATIONS */}
      <section className="bg-stone-100/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1f4e3d]">
                Explore by Region
              </span>
              <h2 className="text-2xl font-bold text-stone-900 font-serif">
                Popular Destinations Across Rwanda
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                From Kigali’s vibrant urban hills to misty mountain gorilla sanctuaries and tropical Lake Kivu beaches.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#1f4e3d] hover:underline"
            >
              <span>Explore map</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {destinations.slice(0, 8).map((dest) => (
              <Link
                key={dest.id}
                href={`/search?destination=${encodeURIComponent(dest.name)}`}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.image_url}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-xs text-stone-300">{dest.province}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOMEPAGE DISCOVERY SEGMENTS: ENTIRE HOMES VS PRIVATE ROOMS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Entire Homes & Luxury Villas */}
        <div>
          <div className="flex items-end justify-between border-b border-stone-200 pb-3 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#b94726]">
                Family & Group Stays
              </span>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                Entire Homes & Private Villas
              </h2>
            </div>
            <Link
              href="/search?type=entire_home"
              className="text-xs font-semibold text-[#b94726] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entireHomes.slice(0, 3).map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        </div>

        {/* Affordable Stays & Private Rooms */}
        <div>
          <div className="flex items-end justify-between border-b border-stone-200 pb-3 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1f4e3d]">
                Budget-Friendly & Homestays
              </span>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                Affordable City Stays & Private Rooms
              </h2>
            </div>
            <Link
              href="/search?type=private_room"
              className="text-xs font-semibold text-[#1f4e3d] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {privateRooms.slice(0, 3).map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. UNIVERSAL HOST CTA (Become a host) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1f4e3d] to-[#163a2d] p-8 sm:p-12 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
              Universal Rwandan Property Management
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold font-serif leading-tight">
              Rent out your spare bedroom or manage a 100-room hotel.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-200 font-light leading-relaxed">
              Memento gives you one universal system. Set nightly RWF rates, manage unit inventories, accept bookings directly, and welcome travellers to Rwanda with confidence.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/become-a-host"
                className="rounded-2xl bg-[#b94726] px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Become a Host Today
              </Link>
              <Link
                href="/host"
                className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                Explore Host Dashboard
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block opacity-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/musanze-lodge.png"
              alt="Rwanda Hospitality"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

