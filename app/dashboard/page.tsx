'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MockStore } from '@/lib/data/mock-store';
import { useMemento } from '@/lib/context/memento-context';
import { PropertyCard } from '@/components/property-card';
import { formatRWF, formatUSD, formatDate } from '@/lib/utils/format';
import { Booking } from '@/lib/types';
import {
  Calendar,
  Clock,
  Heart,
  Star,
  User,
  CheckCircle,
  XCircle,
  MapPin,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function TravellerDashboardPage() {
  const { currentUser, favourites, currency } = useMemento();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past' | 'favourites' | 'profile'>('upcoming');

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const state = MockStore.getState();
  const myBookings = state.bookings.filter((b) => b.guest_id === currentUser.id);

  const upcomingBookings = myBookings.filter((b) => b.status === 'confirmed');
  const pendingBookings = myBookings.filter((b) => b.status === 'pending');
  const pastBookings = myBookings.filter((b) => b.status === 'completed');
  const cancelledBookings = myBookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected');

  const favouritedProperties = state.properties.filter((p) => favourites.includes(p.id));

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      MockStore.updateBookingStatus(bookingId, 'cancelled', 'Cancelled by guest');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);

    if (!reviewBooking) return;
    if (!comment || comment.trim().length < 5) {
      setReviewError('Please provide a descriptive review (at least 5 characters).');
      return;
    }

    const res = MockStore.addReview({
      bookingId: reviewBooking.id,
      rating,
      cleanliness: rating,
      accuracy: rating,
      communication: rating,
      location: rating,
      value: rating,
      comment,
    });

    if (res.success) {
      setReviewSuccess('Thank you! Your verified review has been published.');
      setReviewBooking(null);
      setComment('');
      setTimeout(() => setReviewSuccess(null), 4000);
    } else {
      setReviewError(res.error || 'Failed to submit review.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#b94726]">
            Traveller Hub
          </span>
          <h1 className="text-3xl font-extrabold font-serif text-stone-900">
            Welcome, {currentUser.full_name}
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Manage your accommodation reservations and verified guest reviews across Rwanda.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#b94726] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
        >
          <span>Find Another Stay</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {reviewSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{reviewSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-stone-200 space-x-6 text-xs font-bold">
        {[
          { id: 'upcoming', label: `Upcoming Trips (${upcomingBookings.length})` },
          { id: 'pending', label: `Pending Requests (${pendingBookings.length})` },
          { id: 'past', label: `Past & Reviews (${pastBookings.length + upcomingBookings.length})` },
          { id: 'favourites', label: `Saved Favourites (${favouritedProperties.length})` },
          { id: 'profile', label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#b94726] text-[#b94726]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: UPCOMING TRIPS */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center space-y-3">
              <Calendar className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="text-base font-bold text-stone-900">No upcoming trips booked</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Time to plan your next journey in Rwanda! Discover unique lodges near Volcanoes or beachfront cottages on Lake Kivu.
              </p>
              <Link
                href="/search"
                className="inline-block rounded-xl bg-[#b94726] px-5 py-2 text-xs font-bold text-white shadow-sm"
              >
                Explore Accommodations
              </Link>
            </div>
          ) : (
            upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#b94726]">
                      {b.booking_ref}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                      Confirmed
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-serif text-stone-900">
                    {b.property?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <MapPin className="h-3.5 w-3.5 text-[#b94726]" />
                    <span>
                      {b.property?.city}, {b.property?.province} • Reserved Unit: <strong>{b.unit?.name}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {formatDate(b.check_in_date)} to {formatDate(b.check_out_date)} ({b.nights} nights, {b.num_guests} guests)
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0 gap-2">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-extrabold text-stone-900">
                      {formatRWF(b.total_price_rwf)}
                    </div>
                    <div className="text-[10px] text-stone-400">Pay at check-in</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
                    >
                      View Voucher
                    </Link>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingBookings.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
              No pending booking requests.
            </div>
          ) : (
            pendingBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-800">
                      {b.booking_ref}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                      Awaiting Host Approval
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-stone-900">
                    {b.property?.title} ({b.unit?.name})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Dates: {formatDate(b.check_in_date)} to {formatDate(b.check_out_date)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-stone-900">{formatRWF(b.total_price_rwf)}</span>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PAST STAYS & REVIEWS (Eligible guests can review) */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-orange-50/70 p-4 border border-orange-100 text-xs text-stone-700">
            <span className="font-bold text-[#b94726] block">Verified Review Policy:</span>
            To maintain high trust across Rwanda, Memento allows reviews exclusively from guests with verified, confirmed reservations.
          </div>

          {[...upcomingBookings, ...pastBookings].map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div>
                <h3 className="text-base font-bold text-stone-900">{b.property?.title}</h3>
                <p className="text-xs text-stone-500">{b.unit?.name} • Stayed in {b.property?.city}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewBooking(b)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#b94726] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#9e3b1e]"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: FAVOURITES */}
      {activeTab === 'favourites' && (
        <div className="space-y-4">
          {favouritedProperties.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
              You haven&apos;t saved any accommodation favorites yet. Tap the heart icon on any listing!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favouritedProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-stone-900 font-serif">Personal Profile</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-400 uppercase">Full Name</label>
              <span className="block text-sm font-semibold text-stone-900">{currentUser.full_name}</span>
            </div>
            <div>
              <label className="block font-bold text-stone-400 uppercase">Email Address</label>
              <span className="block text-sm font-semibold text-stone-900">{currentUser.email}</span>
            </div>
            <div>
              <label className="block font-bold text-stone-400 uppercase">Phone Number</label>
              <span className="block text-sm font-semibold text-stone-900">{currentUser.phone_number || '+250 788 111 222'}</span>
            </div>
            <div>
              <label className="block font-bold text-stone-400 uppercase">Platform Role</label>
              <span className="rounded bg-stone-100 px-2 py-0.5 font-bold uppercase text-stone-700">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Write a Review for {reviewBooking.property?.title}
              </h3>
              <button
                onClick={() => setReviewBooking(null)}
                className="rounded-full p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-stone-700">{rating} out of 5 stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                  Your Stay Feedback
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share details of your experience with the room, host hospitality, cleanliness, WiFi and location..."
                  className="w-full rounded-xl border border-stone-200 p-3 text-xs text-stone-900 focus:outline-none focus:border-stone-800"
                  required
                />
              </div>

              {reviewError && (
                <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                  {reviewError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#b94726] px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

