'use client';

import React from 'react';
import { BookableUnit } from '@/lib/types';
import { formatRWF, formatUSD } from '@/lib/utils/format';
import { useMemento } from '@/lib/context/memento-context';
import { Users, Bed, Bath, Check, AlertCircle, Home, Sparkles } from 'lucide-react';

interface UnitSelectorProps {
  units: BookableUnit[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  className?: string;
}

export function UnitSelector({
  units,
  selectedUnitId,
  onSelectUnit,
  className = '',
}: UnitSelectorProps) {
  const { currency } = useMemento();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900">Choose Bookable Accommodation</h3>
        <span className="text-xs text-stone-500 font-medium">{units.length} Options Available</span>
      </div>

      <div className="space-y-3">
        {units.map((unit) => {
          const isSelected = selectedUnitId === unit.id;
          const isEntire = unit.is_entire_property;

          return (
            <div
              key={unit.id}
              onClick={() => onSelectUnit(unit.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                isSelected
                  ? 'border-[#b94726] bg-[#b94726]/5 ring-2 ring-[#b94726]/20 shadow-md'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900 text-base">{unit.name}</h4>
                    {isEntire ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <Home className="h-3 w-3" />
                        Entire Property
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 capitalize">
                        {unit.unit_type}
                      </span>
                    )}

                    {unit.total_inventory > 1 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {unit.total_inventory} identical units
                      </span>
                    )}
                  </div>

                  {unit.description && (
                    <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                      {unit.description}
                    </p>
                  )}

                  {/* Capacity & Amenities Breakdown */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-stone-400" />
                      Up to {unit.max_guests} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5 text-stone-400" />
                      {unit.bedrooms} {unit.bedrooms === 1 ? 'bedroom' : 'bedrooms'} ({unit.beds} beds)
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5 text-stone-400" />
                      {unit.bathrooms} bath
                    </span>
                  </div>

                  {/* Discounts Info */}
                  {(unit.weekly_discount_rate > 0 || unit.monthly_discount_rate > 0) && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#1f4e3d] font-semibold">
                      <Sparkles className="h-3 w-3" />
                      {unit.weekly_discount_rate > 0 && (
                        <span>{(unit.weekly_discount_rate * 100).toFixed(0)}% off for 7+ nights</span>
                      )}
                      {unit.monthly_discount_rate > 0 && (
                        <span>• {(unit.monthly_discount_rate * 100).toFixed(0)}% off for 28+ nights</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price & Selection Pill */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-stone-900">
                      {currency === 'RWF' ? formatRWF(unit.base_price_rwf) : formatUSD(unit.base_price_rwf)}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      per night {currency === 'RWF' && `(${formatUSD(unit.base_price_rwf)})`}
                    </div>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#b94726] text-white shadow-sm'
                          : 'border border-stone-300 text-stone-700 hover:border-stone-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hierarchy Overlap Protection Notice */}
              {isSelected && (
                <div className="mt-3 rounded-xl bg-orange-50/80 p-2.5 text-[11px] text-stone-700 flex items-start gap-2 border border-orange-100">
                  <AlertCircle className="h-3.5 w-3.5 text-[#b94726] shrink-0 mt-0.5" />
                  <div>
                    {isEntire ? (
                      <span>
                        <strong>Whole-Property Guarantee:</strong> Reserving this entire property automatically blocks all individual bedrooms during your booked dates to ensure total privacy.
                      </span>
                    ) : (
                      <span>
                        <strong>Individual Unit Booking:</strong> You are booking this specific private unit. The universal engine verifies that no conflicting full-villa reservation exists.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

