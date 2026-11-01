'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MockStore } from '@/lib/data/mock-store';
import { Property, BookableUnit } from '@/lib/types';
import { UnitSelector } from '@/components/unit-selector';
import { BookingWidget } from '@/components/booking-widget';
import { useMemento } from '@/lib/context/memento-context';
import {
  MapPin,
  Star,
  Heart,
  Share2,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Award,
  Phone,
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const { isFavourite, toggleFavourite, dataRevision } = useMemento();
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<BookableUnit | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (propertyId) {
      const prop = MockStore.getPropertyById(propertyId);
      if (prop) {
        setProperty(prop);
        if (prop.units && prop.units.length > 0) {
          setSelectedUnit(prop.units[0]);
        }
      } else {
        setProperty(null);
        setSelectedUnit(null);
      }
    }
  }, [propertyId, dataRevision]);

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Accommodation not found</h2>
        <p className="mt-2 text-sm text-stone-500">
          The requested property may have been relocated or is currently under review.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
        >
          Return to search
        </Link>
      </div>
    );
  }

  const favourited = isFavourite(property.id);
  const reviews = MockStore.getState().reviews.filter((r) => r.property_id === property.id);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Back Button & Navigation Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to search</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={() => toggleFavourite(property.id)}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                favourited ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
              }`}
            />
            <span>{favourited ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Property Title & Highlights */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white capitalize">
            {property.property_type.replace('_', ' ')}
          </span>
          {property.instant_book && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <Sparkles className="h-3 w-3" />
              Instant Booking Available
            </span>
          )}
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Demonstration Listing
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-stone-900 tracking-tight">
          {property.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-stone-600">
          <div className="flex items-center gap-1 font-bold text-stone-900">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>{property.rating_average > 0 ? property.rating_average.toFixed(2) : 'New'}</span>
            <span className="text-stone-400 font-normal">
              ({property.review_count} {property.review_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-[#b94726]" />
            <span className="font-semibold text-stone-800">
              {property.address}, {property.city}, {property.province}, Rwanda
            </span>
          </div>
        </div>
      </div>

      {/* Modern Accommodation Photo Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 overflow-hidden rounded-3xl">
        <div className="relative md:col-span-2 aspect-[4/3] md:aspect-auto md:h-[460px] overflow-hidden bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.images[activePhotoIdx]?.image_url || property.images[0]?.image_url}
            alt={property.title}
            className="h-full w-full object-cover transition-all duration-300"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-2 gap-3 md:h-[460px]">
          {property.images.slice(0, 4).map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setActivePhotoIdx(idx)}
              className={`relative cursor-pointer overflow-hidden rounded-2xl bg-stone-100 ${
                activePhotoIdx === idx ? 'ring-4 ring-[#b94726]' : 'opacity-80 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.caption || property.title}
                className="h-full w-full object-cover max-h-[220px]"
              />
              {img.caption && (
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        {/* Left Column: Details, Units, Host, Amenities, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* Host Profile Overview */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                Hosted by {property.host?.full_name || 'Verified Rwandan Host'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Verified Host • Responds within 1 hour • Rwandan Hospitality Certified
              </p>
              {property.host?.phone_number && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                  <Phone className="h-3.5 w-3.5 text-[#1f4e3d]" />
                  <span>{property.host.phone_number}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    Direct booking line
                  </span>
                </p>
              )}
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#b94726] to-[#d99b26] text-lg font-bold text-white shadow-md overflow-hidden">
              {property.host?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.host.avatar_url} alt={property.host.full_name} className="h-full w-full object-cover" />
              ) : (
                property.host?.full_name.charAt(0) || 'H'
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-stone-200 pb-8">
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-3">About this accommodation</h3>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* CRITICAL SECTION 4: UNIVERSAL BOOKABLE UNITS */}
          <div className="border-b border-stone-200 pb-8">
            <UnitSelector
              units={property.units || []}
              selectedUnitId={selectedUnit?.id || ''}
              onSelectUnit={(uId) => {
                const found = property.units?.find((u) => u.id === uId);
                if (found) setSelectedUnit(found);
              }}
            />
          </div>

          {/* Amenities & Features */}
          <div className="border-b border-stone-200 pb-8">
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-4">
              What this accommodation offers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {property.amenities?.map((amenity) => (
                <div key={amenity.id} className="flex items-center gap-3 text-xs font-medium text-stone-700">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-[#b94726]">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules & Policies */}
          <div className="border-b border-stone-200 pb-8">
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-4">Stay policies & rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-800">Check-in / Check-out</span>
                  <p className="text-stone-500">
                    Check-in: after {property.check_in_time} • Check-out: by {property.check_out_time}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#1f4e3d] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-800 capitalize">
                    {property.cancellation_policy} Cancellation
                  </span>
                  <p className="text-stone-500">
                    Cancel up to 24 hours before check-in for a full refund.
                  </p>
                </div>
              </div>
            </div>

            {property.house_rules && property.house_rules.length > 0 && (
              <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                <span className="block text-xs font-bold text-stone-800 mb-2">Host House Rules</span>
                <ul className="space-y-1 text-xs text-stone-600 list-disc list-inside">
                  {property.house_rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Guest Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <h3 className="text-xl font-bold text-stone-900 font-serif">
                  {property.rating_average > 0 ? property.rating_average.toFixed(2) : 'No reviews yet'}
                  <span className="text-stone-400 font-normal text-sm ml-2">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </h3>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-stone-500">
                This accommodation is newly listed on Memento. Be among the first guests to review after your stay!
              </p>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-700">
                          {rev.guest?.full_name.charAt(0) || 'G'}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-stone-900">
                            {rev.guest?.full_name || 'Verified Guest'}
                          </span>
                          <span className="block text-[11px] text-stone-400">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>

                    {rev.host_response && (
                      <div className="rounded-xl bg-orange-50/60 p-3 text-xs text-stone-700 border-l-2 border-[#b94726]">
                        <span className="font-bold text-[#b94726] block mb-0.5">Response from Host:</span>
                        <span>{rev.host_response}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Booking Engine Widget */}
        <div className="lg:col-span-1">
          {selectedUnit ? (
            <BookingWidget property={property} selectedUnit={selectedUnit} />
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
              Please select a unit to proceed with booking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

