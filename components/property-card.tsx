'use client';

import React from 'react';
import Link from 'next/link';
import { Property } from '@/lib/types';
import { formatRWF, formatUSD } from '@/lib/utils/format';
import { useMemento } from '@/lib/context/memento-context';
import { Star, Heart, Layers, Sparkles } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className = '' }: PropertyCardProps) {
  const { toggleFavourite, isFavourite, currency } = useMemento();
  const favourited = isFavourite(property.id);

  // Determine starting price from units
  const unitPrices = property.units?.map((u) => u.base_price_rwf) || [0];
  const minPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : 0;

  const primaryImage =
    property.images.find((img) => img.is_primary)?.image_url ||
    property.images[0]?.image_url ||
    '/images/kigali-loft.png';

  const unitCount = property.units?.length || 0;

  return (
    <div className={`group relative flex flex-col rounded-3xl bg-white border border-stone-200/80 p-3 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${className}`}>
      {/* Property Photo with Badges & Favourites */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavourite(property.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-stone-700 shadow-md transition-all hover:scale-110 active:scale-90"
          aria-label="Save stay"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              favourited ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
            }`}
          />
        </button>

        {/* Property Type Badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-stone-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white capitalize shadow-sm">
          <span>{property.property_type.replace('_', ' ')}</span>
        </div>

        {/* Multi-Unit Architecture Indicator */}
        {unitCount > 1 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-stone-800 shadow-sm">
            <Layers className="h-3 w-3 text-[#b94726]" />
            <span>{unitCount} Bookable Units</span>
          </div>
        )}

        {/* Instant Book Badge */}
        {property.instant_book && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[#1f4e3d]/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            <span>Instant Book</span>
          </div>
        )}
      </div>

      {/* Property Metadata */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          {/* Location & Rating Header */}
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">
              {property.city}, {property.province}
            </span>
            <div className="flex items-center gap-1 font-bold text-stone-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{property.rating_average > 0 ? property.rating_average.toFixed(1) : 'New'}</span>
              {property.review_count > 0 && (
                <span className="text-stone-400 font-normal">({property.review_count})</span>
              )}
            </div>
          </div>

          {/* Title */}
          <Link href={`/properties/${property.id}`} className="mt-1 block">
            <h3 className="line-clamp-1 font-semibold text-stone-900 transition-colors group-hover:text-[#b94726]">
              {property.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="mt-1 line-clamp-1 text-xs text-stone-500">
            {property.description}
          </p>
        </div>

        {/* Price Footer */}
        <div className="mt-3 flex items-baseline justify-between border-t border-stone-100 pt-3">
          <div>
            <span className="text-xs text-stone-400">From </span>
            <span className="text-base font-bold text-stone-900">
              {currency === 'RWF' ? formatRWF(minPrice) : formatUSD(minPrice)}
            </span>
            <span className="text-xs text-stone-500"> / night</span>
            {currency === 'RWF' && (
              <span className="ml-1.5 text-[11px] text-stone-400">
                ({formatUSD(minPrice)})
              </span>
            )}
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-[#b94726] hover:text-white"
          >
            View Stays
          </Link>
        </div>
      </div>
    </div>
  );
}

