'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MockStore } from '@/lib/data/mock-store';
import { Booking } from '@/lib/types';
import { formatRWF, formatUSD, formatDate } from '@/lib/utils/format';
import { useMemento } from '@/lib/context/memento-context';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Users,
  Building,
  Phone,
  Mail,
  Printer,
  ChevronLeft,
  AlertCircle,
  Home,
  ShieldCheck,
} from 'lucide-react';

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;
  const { currency } = useMemento();

  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (bookingId) {
      const state = MockStore.getState();
      const b = state.bookings.find((item) => item.id === bookingId);
      if (b) setBooking(b);
    }
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Booking Record Not Found</h2>
        <p className="mt-2 text-sm text-stone-500">
          The requested booking reference could not be located.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === 'confirmed';
  const isPending = booking.status === 'pending';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>My Trips Dashboard</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Voucher</span>
        </button>
      </div>

      {/* Confirmation Hero Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-lg ${
          isConfirmed
            ? 'bg-gradient-to-r from-[#1f4e3d] to-[#163a2d]'
            : 'bg-gradient-to-r from-stone-800 to-stone-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {isConfirmed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-stone-900">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-stone-900">
                  <Clock className="h-5 w-5" />
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {isConfirmed ? 'Booking Confirmed' : 'Booking Request Submitted'}
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold font-serif">
              {isConfirmed
                ? 'Your stay in Rwanda is officially booked!'
                : 'Waiting for Host Confirmation'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-200 font-light">
              {isConfirmed
                ? 'Pack your bags! We’ve sent your reservation voucher to your host.'
                : 'The host has received your request and will approve it within 24 hours.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-right border border-white/20">
            <span className="block text-[10px] uppercase font-bold text-stone-300 tracking-wider">
              Booking Reference
            </span>
            <span className="font-mono text-xl font-extrabold text-amber-300">
              {booking.booking_ref}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Details Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
        {/* Accommodation Summary */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-stone-100 pb-6">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 capitalize">
              {booking.property?.property_type.replace('_', ' ')}
            </span>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              {booking.property?.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <MapPin className="h-4 w-4 text-[#b94726]" />
              <span>
                {booking.property?.address}, {booking.property?.city}, {booking.property?.province}, Rwanda
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#b94726]">
                Reserved Unit: {booking.unit?.name}
              </span>
              {booking.unit?.is_entire_property && (
                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">
                  Entire Property
                </span>
              )}
            </div>
          </div>

          {booking.property?.images?.[0] && (
            <div className="h-28 w-44 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booking.property.images[0].image_url}
                alt={booking.property.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Dates & Capacity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-stone-100 pb-6">
          <div className="rounded-2xl bg-stone-50 p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Check-In Date
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-900">
              {formatDate(booking.check_in_date)}
            </span>
            <span className="text-xs text-stone-500">After {booking.property?.check_in_time}</span>
          </div>

          <div className="rounded-2xl bg-stone-50 p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Check-Out Date
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-900">
              {formatDate(booking.check_out_date)}
            </span>
            <span className="text-xs text-stone-500">By {booking.property?.check_out_time}</span>
          </div>

          <div className="rounded-2xl bg-stone-50 p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Duration & Guests
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-900">
              {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} • {booking.num_guests} Guests
            </span>
            <span className="text-xs text-stone-500">Standard Room Occupancy</span>
          </div>
        </div>

        {/* Financial & Payment Arrangement */}
        <div className="border-b border-stone-100 pb-6 space-y-3">
          <h3 className="text-base font-bold text-stone-900">Payment Breakdown</h3>
          <div className="space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>
                Nightly rate ({formatRWF(booking.nightly_rate_rwf)} × {booking.nights} nights)
              </span>
              <span className="font-medium text-stone-900">{formatRWF(booking.subtotal_rwf)}</span>
            </div>
            {booking.discount_rwf > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Extended Stay Discount</span>
                <span>-{formatRWF(booking.discount_rwf)}</span>
              </div>
            )}
            {booking.cleaning_fee_rwf > 0 && (
              <div className="flex justify-between">
                <span>Cleaning Fee</span>
                <span className="font-medium text-stone-900">{formatRWF(booking.cleaning_fee_rwf)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Service Fee (8%)</span>
              <span className="font-medium text-stone-900">{formatRWF(booking.service_fee_rwf)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
              <span>Total Payable</span>
              <span className="text-base text-[#b94726]">
                {formatRWF(booking.total_price_rwf)} ({formatUSD(booking.total_price_rwf)})
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
            <span className="block text-xs font-bold text-emerald-900">
              Payment Terms: Settle Upon Check-In
            </span>
            <p className="mt-0.5 text-xs text-emerald-800">
              Payment Method: <strong>{booking.payment_method.replace('_', ' ').toUpperCase()}</strong>. Settle with your host upon arrival via Mobile Money (MTN / Airtel) or Cash in RWF.
            </p>
          </div>
        </div>

        {/* Host Contact Information */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-stone-900">Host Contact & Instructions</h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-stone-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f4e3d] text-white font-bold">
                {booking.property?.host?.full_name.charAt(0) || 'H'}
              </div>
              <div>
                <span className="block text-xs font-bold text-stone-900">
                  {booking.property?.host?.full_name}
                </span>
                <span className="block text-[11px] text-stone-500">Host & Property Manager</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-stone-700">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#b94726]" />
                <span>{booking.property?.host?.phone_number || '+250 788 123 456'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-stone-400" />
                <span>{booking.property?.host?.email || 'host@memento.rw'}</span>
              </div>
            </div>
          </div>

          {booking.special_requests && (
            <div className="rounded-xl border border-stone-200 p-3 text-xs text-stone-700">
              <span className="font-bold text-stone-900 block mb-0.5">Your Special Requests:</span>
              <span>{booking.special_requests}</span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-6">
          <Link
            href="/dashboard"
            className="rounded-2xl border border-stone-300 px-5 py-2.5 text-xs font-bold text-stone-800 hover:border-stone-800 transition-colors"
          >
            Go to My Bookings
          </Link>
          <Link
            href={`/properties/${booking.property_id}`}
            className="rounded-2xl bg-[#b94726] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e] transition-colors"
          >
            View Property Details
          </Link>
        </div>
      </div>
    </div>
  );
}
