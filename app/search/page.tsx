'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchWidget } from '@/components/search-widget';
import { CategoryBar } from '@/components/category-bar';
import { PropertyCard } from '@/components/property-card';
import { MockStore } from '@/lib/data/mock-store';
import { useMemento } from '@/lib/context/memento-context';
import { Property, SearchFilters } from '@/lib/types';
import { formatRWF, formatUSD } from '@/lib/utils/format';
import {
  SlidersHorizontal,
  X,
  Compass,
  ArrowUpDown,
  Check,
  Building,
} from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { currency } = useMemento();

  const urlDest = searchParams.get('destination') || '';
  const urlCheckIn = searchParams.get('checkIn') || '';
  const urlCheckOut = searchParams.get('checkOut') || '';
  const urlGuests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : 1;
  const urlType = searchParams.get('type') || 'all';

  const [destination, setDestination] = useState(urlDest);
  const [propertyType, setPropertyType] = useState(urlType);
  const [guests, setGuests] = useState(urlGuests);
  const [minPrice, setMinPrice] = useState<number>(10000);
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('recommended');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const [results, setResults] = useState<Property[]>([]);

  useEffect(() => {
    setDestination(urlDest);
    setPropertyType(urlType);
    setGuests(urlGuests);
  }, [urlDest, urlType, urlGuests]);

  useEffect(() => {
    const filters: SearchFilters = {
      destination: destination || undefined,
      propertyType: propertyType === 'all' ? undefined : propertyType,
      guests: guests > 1 ? guests : undefined,
      minPrice,
      maxPrice,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      sortBy,
    };

    const data = MockStore.getProperties(filters);
    setResults(data);
  }, [destination, propertyType, guests, minPrice, maxPrice, selectedAmenities, sortBy]);

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const clearAllFilters = () => {
    setDestination('');
    setPropertyType('all');
    setGuests(1);
    setMinPrice(10000);
    setMaxPrice(300000);
    setSelectedAmenities([]);
    setSortBy('recommended');
  };

  const amenitiesList = MockStore.getAmenities();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Search Bar */}
      <div className="rounded-3xl bg-white p-4 shadow-sm border border-stone-200">
        <SearchWidget
          initialDestination={destination}
          initialGuests={guests}
          compact={true}
        />
      </div>

      {/* Category Pills Bar */}
      <CategoryBar
        selectedType={propertyType}
        onSelect={(t) => setPropertyType(t)}
        className="rounded-2xl border border-stone-200 shadow-sm"
      />

      {/* Search Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            {destination ? `Stays in ${destination}` : 'All Verified Stays in Rwanda'}
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            {results.length} accommodation {results.length === 1 ? 'option' : 'options'} found
            {destination && ` for "${destination}"`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Modal Trigger */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:border-stone-800 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#b94726]" />
            <span>Filters</span>
            {selectedAmenities.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b94726] text-[10px] text-white">
                {selectedAmenities.length}
              </span>
            )}
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-stone-900 focus:outline-none cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Lowest Price</option>
              <option value="price_desc">Highest Price</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {(destination || propertyType !== 'all' || selectedAmenities.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-stone-400">Active filters:</span>
          {destination && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-800">
              Location: {destination}
              <button onClick={() => setDestination('')} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {propertyType !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-800 capitalize">
              Type: {propertyType.replace('_', ' ')}
              <button onClick={() => setPropertyType('all')} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedAmenities.map((amId) => {
            const am = amenitiesList.find((a) => a.id === amId);
            return (
              <span
                key={amId}
                className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-800"
              >
                {am?.name || amId}
                <button onClick={() => toggleAmenity(amId)} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-[#b94726] hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Property Cards Grid */}
      {results.length === 0 ? (
        <div className="my-16 rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <Compass className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-lg font-bold text-stone-900">No properties matched your search</h3>
          <p className="mt-1 text-sm text-stone-500">
            Try adjusting your location, price range or selected amenities.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 rounded-xl bg-[#b94726] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#9e3b1e]"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}

      {/* FILTERS MODAL */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h2 className="text-lg font-bold text-stone-900">Search Filters</h2>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="rounded-full p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Price Range Slider */}
            <div className="mt-6 border-b border-stone-100 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-900">Price Range (RWF per night)</span>
                <span className="text-xs text-stone-500 font-semibold">
                  {currency === 'RWF' ? formatRWF(minPrice) : formatUSD(minPrice)} —{' '}
                  {currency === 'RWF' ? formatRWF(maxPrice) : formatUSD(maxPrice)}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-stone-400 font-bold uppercase">Min (RWF)</label>
                    <input
                      type="number"
                      value={minPrice}
                      step={5000}
                      min={0}
                      max={maxPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-stone-200 p-2 text-xs font-semibold text-stone-900"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-stone-400 font-bold uppercase">Max (RWF)</label>
                    <input
                      type="number"
                      value={maxPrice}
                      step={10000}
                      min={minPrice}
                      max={1000000}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-stone-200 p-2 text-xs font-semibold text-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="mt-6 border-b border-stone-100 pb-6">
              <span className="text-sm font-bold text-stone-900">Amenities & Features</span>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {amenitiesList.map((am) => {
                  const isChecked = selectedAmenities.includes(am.id);
                  return (
                    <button
                      key={am.id}
                      type="button"
                      onClick={() => toggleAmenity(am.id)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-colors ${
                        isChecked
                          ? 'border-[#b94726] bg-[#b94726]/5 font-semibold text-[#b94726]'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{am.name}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-[#b94726]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="rounded-2xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-stone-500">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
