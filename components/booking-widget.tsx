'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Property, BookableUnit } from '@/lib/types';
import { calculateNights, formatRWF, formatUSD } from '@/lib/utils/format';
import { useMemento } from '@/lib/context/memento-context';
import { MockStore } from '@/lib/data/mock-store';
import {
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';

interface BookingWidgetProps {
  property: Property;
  selectedUnit: BookableUnit;
}

export function BookingWidget({ property, selectedUnit }: BookingWidgetProps) {
  const router = useRouter();
  const { currency } = useMemento();

  // Default to tomorrow and 3 nights stay
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextThreeDays = new Date(tomorrow);
  nextThreeDays.setDate(nextThreeDays.getDate() + 3);

  const defaultCheckIn = tomorrow.toISOString().split('T')[0];
  const defaultCheckOut = nextThreeDays.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [numGuests, setNumGuests] = useState(Math.min(2, selectedUnit.max_guests));
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_property' | 'momo_mtn' | 'momo_airtel'>('pay_at_property');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const nights = calculateNights(checkIn, checkOut);

  // Validate availability in real-time
  const availability = MockStore.checkUnitAvailability(selectedUnit.id, checkIn, checkOut);

  // Pricing calculations
  const nightlyRate = selectedUnit.base_price_rwf;
  const subtotal = nightlyRate * Math.max(1, nights);

  let discount = 0;
  if (nights >= 28 && selectedUnit.monthly_discount_rate > 0) {
    discount = Math.round(subtotal * selectedUnit.monthly_discount_rate);
  } else if (nights >= 7 && selectedUnit.weekly_discount_rate > 0) {
    discount = Math.round(subtotal * selectedUnit.weekly_discount_rate);
  }

  const cleaningFee = selectedUnit.cleaning_fee_rwf;
  const serviceFee = Math.round((subtotal - discount) * 0.08); // 8% platform fee
  const totalPrice = subtotal - discount + cleaningFee + serviceFee;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (nights <= 0) {
      setBookingError('Check-out date must be after check-in date.');
      return;
    }

    if (numGuests > selectedUnit.max_guests) {
      setBookingError(`Guest count exceeds maximum capacity of ${selectedUnit.max_guests}.`);
      return;
    }

    if (!availability.available) {
      setBookingError(availability.reason || 'This unit is unavailable for the selected dates.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = MockStore.createBooking({
        propertyId: property.id,
        unitId: selectedUnit.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numGuests,
        paymentMethod,
        specialRequests,
      });

      if (res.success && res.booking) {
        // Direct redirect to the booking confirmation voucher
        router.push(`/bookings/${res.booking.id}`);
      } else {
        setBookingError(res.error || 'Failed to complete booking.');
      }
    } catch {
      setBookingError('An unexpected error occurred during reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sticky top-28 rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xl shadow-stone-900/5">
      {/* Price Header */}
      <div className="flex items-baseline justify-between border-b border-stone-100 pb-4">
        <div>
          <span className="text-2xl font-extrabold text-stone-900">
            {currency === 'RWF' ? formatRWF(nightlyRate) : formatUSD(nightlyRate)}
          </span>
          <span className="text-xs text-stone-500 font-medium"> / night</span>
          {currency === 'RWF' && (
            <span className="ml-2 text-xs text-stone-400">({formatUSD(nightlyRate)})</span>
          )}
        </div>

        <div className="text-right">
          <span className="inline-block rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700">
            {selectedUnit.name}
          </span>
        </div>
      </div>

      <form onSubmit={handleBookingSubmit} className="mt-5 space-y-4">
        {/* Date Selection Box */}
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-stone-200 divide-x divide-stone-200">
          <div className="p-3 bg-stone-50/50">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Check-In
            </label>
            <div className="mt-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#b94726]" />
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-stone-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-stone-50/50">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Check-Out
            </label>
            <div className="mt-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#1f4e3d]" />
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-stone-900 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Guests selector */}
        <div className="rounded-2xl border border-stone-200 p-3 bg-stone-50/50">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Guests
          </label>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#d99b26]" />
              <span className="text-xs font-semibold text-stone-900">
                {numGuests} {numGuests === 1 ? 'Guest' : 'Guests'} (Max {selectedUnit.max_guests})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={numGuests <= 1}
                onClick={() => setNumGuests(Math.max(1, numGuests - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-xs font-bold text-stone-700 disabled:opacity-40"
              >
                -
              </button>
              <button
                type="button"
                disabled={numGuests >= selectedUnit.max_guests}
                onClick={() => setNumGuests(Math.min(selectedUnit.max_guests, numGuests + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-xs font-bold text-stone-700 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Payment Arrangement (Pay at property / MoMo) */}
        <div className="rounded-2xl border border-stone-200 p-3 bg-stone-50/50">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Payment Arrangement
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="mt-1 w-full bg-transparent text-xs font-semibold text-stone-900 focus:outline-none"
          >
            <option value="pay_at_property">Pay at Property (Cash or Host POS upon check-in)</option>
            <option value="momo_mtn">MTN Mobile Money (Direct to Host on Arrival)</option>
            <option value="momo_airtel">Airtel Money (Direct to Host on Arrival)</option>
          </select>
          <p className="mt-1 text-[10px] text-stone-500">
            Zero upfront fee required now. Settle securely upon arrival in Rwanda.
          </p>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Special Requests (Optional)
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
            placeholder="Late check-in, airport pickup from Kigali International, dietary needs..."
            className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-800 focus:outline-none"
          />
        </div>

        {/* Availability status check warning / success */}
        {!availability.available ? (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{availability.reason}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Available for your selected dates</span>
          </div>
        )}

        {/* Booking Error */}
        {bookingError && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 font-medium">
            {bookingError}
          </div>
        )}

        {/* Price Breakdown */}
        {nights > 0 && (
          <div className="space-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>
                {currency === 'RWF' ? formatRWF(nightlyRate) : formatUSD(nightlyRate)} × {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="font-medium text-stone-900">
                {currency === 'RWF' ? formatRWF(subtotal) : formatUSD(subtotal)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Extended Stay Discount</span>
                <span>-{currency === 'RWF' ? formatRWF(discount) : formatUSD(discount)}</span>
              </div>
            )}

            {cleaningFee > 0 && (
              <div className="flex justify-between">
                <span>One-time Cleaning Fee</span>
                <span className="font-medium text-stone-900">
                  {currency === 'RWF' ? formatRWF(cleaningFee) : formatUSD(cleaningFee)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Memento Guest Service Fee (8%)</span>
              <span className="font-medium text-stone-900">
                {currency === 'RWF' ? formatRWF(serviceFee) : formatUSD(serviceFee)}
              </span>
            </div>

            <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
              <span>Total ({currency})</span>
              <span className="text-base text-[#b94726]">
                {currency === 'RWF' ? formatRWF(totalPrice) : formatUSD(totalPrice)}
              </span>
            </div>
            {currency === 'RWF' && (
              <div className="text-right text-[11px] text-stone-400">
                Approx. {formatUSD(totalPrice)}
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={!availability.available || isSubmitting || nights <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b94726] py-3.5 text-sm font-bold text-white shadow-md shadow-[#b94726]/20 transition-all hover:bg-[#9e3b1e] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span>Processing Reservation...</span>
          ) : property.instant_book ? (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Instant Confirmation</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Request to Book</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-stone-400">
          {property.instant_book
            ? 'Guaranteed confirmation immediately. Pay upon check-in.'
            : 'Host will review and confirm within 24 hours.'}
        </p>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1f4e3d]" />
            Verified Property
          </span>
          <span>•</span>
          <span>No Cancellation Penalties (Flexible)</span>
        </div>
      </form>
    </div>
  );
}
