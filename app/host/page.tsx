'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MockStore } from '@/lib/data/mock-store';
import { useMemento } from '@/lib/context/memento-context';
import { PropertyImage } from '@/lib/types';
import { PropertyPhotoManager } from '@/components/property-photo-manager';
import { formatRWF, formatUSD, formatDate } from '@/lib/utils/format';
import {
  Building,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Layers,
  MessageSquare,
  ShieldCheck,
  Eye,
  Check,
  Send,
  Camera,
  X,
} from 'lucide-react';

export default function HostDashboardPage() {
  const { currentUser, currency } = useMemento();
  const [activeTab, setActiveTab] = useState<'bookings' | 'properties' | 'calendar' | 'reviews'>('bookings');
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [photoEditorId, setPhotoEditorId] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [, bumpPhotoVersion] = useState(0);

  // A fresh listing submission lands here with ?submitted=<id>. Open the
  // property tab and confirm the submission, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const submitted = params.get('submitted');
    if (!submitted) return;

    setSubmittedId(submitted);
    setActiveTab('properties');

    const url = new URL(window.location.href);
    url.searchParams.delete('submitted');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  // Admins can audit any listing; hosts only ever see properties they own.
  const isAdmin = currentUser.role === 'admin';

  const state = MockStore.getState();
  const hostProperties = state.properties.filter(
    (p) => isAdmin || p.host_id === currentUser.id
  );
  const hasListings = hostProperties.length > 0;
  const editingProperty = photoEditorId
    ? hostProperties.find((property) => property.id === photoEditorId)
    : undefined;

  const handlePropertyPhotosChange = (images: PropertyImage[]) => {
    if (!photoEditorId) return;
    MockStore.updatePropertyImages(photoEditorId, images);
    bumpPhotoVersion((version) => version + 1);
  };

  // Fetch bookings for this host's properties
  const hostBookings = state.bookings.filter((b) =>
    hostProperties.some((p) => p.id === b.property_id)
  );

  const pendingBookings = hostBookings.filter((b) => b.status === 'pending');
  const confirmedBookings = hostBookings.filter((b) => b.status === 'confirmed');

  // Total earnings in RWF
  const totalEarningsRWF = confirmedBookings.reduce((sum, b) => sum + (b.total_price_rwf - b.service_fee_rwf), 0);

  const handleBookingAction = (bookingId: string, status: 'confirmed' | 'rejected') => {
    MockStore.updateBookingStatus(bookingId, status);
    setActionSuccessMsg(`Booking ${status === 'confirmed' ? 'confirmed' : 'declined'} successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleHostReviewResponse = (reviewId: string) => {
    const text = responseTexts[reviewId];
    if (!text || text.trim() === '') return;

    const rev = state.reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.host_response = text;
      rev.host_responded_at = new Date().toISOString();
      MockStore.subscribe(() => {})();
      setActionSuccessMsg('Response posted to guest review!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const hostReviews = state.reviews.filter((r) =>
    hostProperties.some((p) => p.id === r.property_id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Empty state for guests who have not listed a property yet */}
      {!hasListings && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-bold text-stone-900 text-sm">You don&apos;t have a listing yet</span>
            <p className="mt-1 text-xs text-stone-500 max-w-xl">
              Submit your first accommodation for verification. It will appear here once the
              Memento team has reviewed it.
            </p>
          </div>
          <Link
            href="/become-a-host"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#b94726] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#9e3b1e]"
          >
            <Plus className="h-4 w-4" />
            <span>Create a listing</span>
          </Link>
        </div>
      )}

      {/* Submission confirmation */}
      {submittedId && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-start">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <span className="text-sm font-bold">Listing submitted for review</span>
            <p className="mt-1 text-xs text-emerald-800">
              Your property and photos are with the Memento verification team. You can keep
              editing the photos below while the listing is under review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedId(null)}
            className="self-start rounded-xl border border-emerald-300 px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Success Alert */}
      {actionSuccessMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#b94726]">
            Host Operations Center
          </span>
          <h1 className="text-3xl font-extrabold font-serif text-stone-900">
            Host Dashboard
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Manage your Rwandan accommodation inventory, respond to booking requests and track revenue.
          </p>
        </div>

        <Link
          href="/become-a-host"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#b94726] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Listing</span>
        </Link>
      </div>

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Earnings</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-stone-900">
            {currency === 'RWF' ? formatRWF(totalEarningsRWF) : formatUSD(totalEarningsRWF)}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Net payouts after platform fee</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Requests</span>
            <Clock className="h-4 w-4 text-[#b94726]" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-[#b94726]">
            {pendingBookings.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Requires your approval</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Bookings</span>
            <CheckCircle className="h-4 w-4 text-[#1f4e3d]" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-stone-900">
            {confirmedBookings.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Upcoming arrivals</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Managed Listings</span>
            <Building className="h-4 w-4 text-stone-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-stone-900">
            {hostProperties.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Active & under review</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 space-x-6 text-xs font-bold">
        {[
          { id: 'bookings', label: `Reservations (${hostBookings.length})` },
          { id: 'properties', label: `My Properties & Units (${hostProperties.length})` },
          { id: 'calendar', label: 'Availability & Calendar' },
          { id: 'reviews', label: `Guest Reviews (${hostReviews.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#b94726] text-[#b94726]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BOOKING REQUESTS & RESERVATIONS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Pending Approval Requests */}
          {pendingBookings.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#b94726]" />
                <h3 className="text-base font-bold text-amber-900">
                  Pending Booking Requests Awaiting Your Action ({pendingBookings.length})
                </h3>
              </div>

              <div className="space-y-3">
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-4 border border-amber-200 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-800">
                          {b.booking_ref}
                        </span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                          Action Required
                        </span>
                      </div>
                      <h4 className="mt-1 font-bold text-stone-900 text-sm">
                        {b.property?.title} — <span className="text-[#b94726]">{b.unit?.name}</span>
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Guest: <strong>{b.guest?.full_name}</strong> • {b.nights} nights ({formatDate(b.check_in_date)} to {formatDate(b.check_out_date)}) • {b.num_guests} guests
                      </p>
                      {b.special_requests && (
                        <p className="mt-1 text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg italic">
                          &quot;{b.special_requests}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <div className="text-sm font-extrabold text-stone-900">
                          {formatRWF(b.total_price_rwf)}
                        </div>
                        <div className="text-[10px] text-stone-400">{b.payment_method}</div>
                      </div>

                      <button
                        onClick={() => handleBookingAction(b.id, 'confirmed')}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Confirm</span>
                      </button>

                      <button
                        onClick={() => handleBookingAction(b.id, 'rejected')}
                        className="flex items-center gap-1.5 rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Reservations List */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-4">All Reservations</h3>
            {hostBookings.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No reservations received yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-400">
                    <tr>
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Accommodation</th>
                      <th className="pb-3">Guest</th>
                      <th className="pb-3">Dates</th>
                      <th className="pb-3">Payout</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {hostBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="py-3 font-mono font-bold text-stone-900">
                          <Link href={`/bookings/${b.id}`} className="hover:underline text-[#b94726]">
                            {b.booking_ref}
                          </Link>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-stone-900">{b.property?.title}</div>
                          <div className="text-[11px] text-stone-500">{b.unit?.name}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-stone-900">{b.guest?.full_name}</div>
                          <div className="text-[11px] text-stone-500">{b.guest?.phone_number}</div>
                        </td>
                        <td className="py-3">
                          <div>{formatDate(b.check_in_date)} — {formatDate(b.check_out_date)}</div>
                          <div className="text-[11px] text-stone-400">{b.nights} nights</div>
                        </td>
                        <td className="py-3 font-bold text-stone-900">
                          {formatRWF(b.total_price_rwf)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY PROPERTIES & UNITS */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hostProperties.map((prop) => (
              <div
                key={prop.id}
                className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          prop.images.find((image) => image.is_primary)?.image_url ||
                          prop.images[0]?.image_url ||
                          '/images/kigali-loft.png'
                        }
                        alt={prop.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-stone-700">
                          {prop.property_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            prop.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prop.status}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-base font-bold text-stone-900">{prop.title}</h3>
                      <p className="text-xs text-stone-500">
                        {prop.city}, {prop.province}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        {prop.images.length} photo{prop.images.length === 1 ? '' : 's'} ·{' '}
                        {prop.units?.length || 0} unit{(prop.units?.length || 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoEditorId(prop.id)}
                      className="flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-[#b94726] hover:text-[#b94726]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Photos</span>
                    </button>
                    <Link
                      href={`/properties/${prop.id}`}
                      className="flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </Link>
                  </div>
                </div>

                {/* Units List */}
                <div className="rounded-2xl bg-stone-50 p-4 space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Bookable Units ({prop.units?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {prop.units?.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between text-xs font-medium text-stone-700 border-b border-stone-200/50 pb-1.5 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-[#b94726]" />
                          <span>{u.name}</span>
                          {u.is_entire_property && (
                            <span className="text-[10px] text-emerald-700 font-bold">(Entire)</span>
                          )}
                          {u.total_inventory > 1 && (
                            <span className="text-[10px] text-blue-700">({u.total_inventory} rooms)</span>
                          )}
                        </div>
                        <span className="font-bold text-stone-900">{formatRWF(u.base_price_rwf)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR & AVAILABILITY */}
      {activeTab === 'calendar' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center space-y-4">
          <Calendar className="mx-auto h-12 w-12 text-[#1f4e3d]" />
          <h3 className="text-lg font-bold text-stone-900">Universal Availability Synchronization</h3>
          <p className="max-w-md mx-auto text-xs text-stone-500">
            Whenever a booking is confirmed on an entire property, individual room availability is automatically blocked. When an individual room is booked, the whole-residence reservation is blocked.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            <span>Database Hierarchy Locks: Active</span>
          </div>
        </div>
      )}

      {/* TAB 4: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {hostReviews.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
              No guest reviews received yet.
            </div>
          ) : (
            hostReviews.map((rev) => (
              <div key={rev.id} className="rounded-3xl border border-stone-200 bg-white p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900">{rev.guest?.full_name}</span>
                    <span className="ml-2 text-[11px] text-stone-400">{formatDate(rev.created_at)}</span>
                  </div>
                  <div className="font-bold text-amber-500 text-xs">★ {rev.rating}/5</div>
                </div>

                <p className="text-xs text-stone-600 italic">&quot;{rev.comment}&quot;</p>

                {rev.host_response ? (
                  <div className="rounded-xl bg-orange-50/70 p-3 text-xs text-stone-800">
                    <span className="font-bold text-[#b94726] block">Your Response:</span>
                    <span>{rev.host_response}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Respond to this review..."
                      value={responseTexts[rev.id] || ''}
                      onChange={(e) =>
                        setResponseTexts({ ...responseTexts, [rev.id]: e.target.value })
                      }
                      className="flex-1 rounded-xl border border-stone-200 p-2 text-xs text-stone-900"
                    />
                    <button
                      onClick={() => handleHostReviewResponse(rev.id)}
                      className="flex items-center gap-1 rounded-xl bg-[#b94726] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#9e3b1e]"
                    >
                      <Send className="h-3 w-3" />
                      <span>Post</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Photo manager modal */}
      {editingProperty && (
        <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="my-6 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b94726]">
                  Property Photos
                </span>
                <h3 className="mt-1 text-lg font-bold text-stone-900">{editingProperty.title}</h3>
                <p className="mt-1 text-[11px] text-stone-500">
                  Add up to 8 photos. The cover photo appears on search results and your listing page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoEditorId(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
                aria-label="Close photo manager"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
              <PropertyPhotoManager
                images={editingProperty.images || []}
                onChange={handlePropertyPhotosChange}
                ownerId={currentUser.id}
                maxPhotos={8}
                compact
              />
            </div>

            <div className="flex justify-end border-t border-stone-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setPhotoEditorId(null)}
                className="rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

