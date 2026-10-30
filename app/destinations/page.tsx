'use client';

import React from 'react';
import Link from 'next/link';
import { DEMO_DESTINATIONS } from '@/lib/data/mock-data';
import { MapPin, ArrowRight, Compass } from 'lucide-react';

export default function DestinationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-[#1f4e3d]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1f4e3d]">
          Explore Rwanda
        </span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold font-serif text-stone-900">
          Destinations in the Land of a Thousand Hills
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-500">
          Discover unique accommodation across every province in Rwanda—from peaceful lakeshores to vibrant city ridges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_DESTINATIONS.map((dest) => (
          <Link
            key={dest.id}
            href={`/search?destination=${encodeURIComponent(dest.name)}`}
            className="group relative overflow-hidden rounded-3xl bg-white border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dest.image_url}
                alt={dest.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  {dest.province}
                </span>
                <h3 className="text-xl font-bold font-serif">{dest.name}</h3>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between text-xs text-stone-600">
              <p className="line-clamp-2 leading-relaxed">{dest.description}</p>
              <div className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700 group-hover:bg-[#b94726] group-hover:text-white transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

