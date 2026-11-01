'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Inbox,
  MessageCircle,
  Phone,
  XCircle,
} from 'lucide-react';
import { LedgerEntry, LedgerStatus, Property } from '@/lib/types';
import { formatDate, formatRWF } from '@/lib/utils/format';
import { isSupabaseConfigured } from '@/lib/data/service';
import { toDialablePhone } from '@/lib/data/booking-ledger';
import { StayCalendar } from '@/components/stay-calendar';

interface HostCalendarPanelProps {
  entries: LedgerEntry[];
  properties: Property[];
  ledgerAvailable: boolean | null;
  onStatusChange: (bookingRef: string, status: 'confirmed' | 'rejected') => void;
  busyRef?: string | null;
}

const STATUS_STYLES: Record<LedgerStatus, string> = {
  inquiry: 'bg-sky-100 text-sky-800',
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-stone-200 text-stone-700',
};

const STATUS_LABELS: Record<LedgerStatus, string> = {
  inquiry: 'Direct enquiry',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
};

function isActive(entry: LedgerEntry): boolean {
  return entry.status === 'confirmed' || entry.status === 'pending' || entry.status === 'completed';
}

export function HostCalendarPanel({
  entries,
  properties,
  ledgerAvailable,
  onStatusChange,
  busyRef,
}: HostCalendarPanelProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [propertyFilter, setPropertyFilter] = useState<'all' | string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const scopedEntries = useMemo(
    () =>
      propertyFilter === 'all'
        ? entries
        : entries.filter((entry) => entry.property_id === propertyFilter),
    [entries, propertyFilter]
  );

  const confirmed = scopedEntries.filter(
    (entry) => entry.status === 'confirmed' || entry.status === 'completed'
  );
  const pending = scopedEntries.filter((entry) => entry.status === 'pending');
  const direct = scopedEntries.filter(
    (entry) => entry.channel === 'whatsapp' || entry.channel === 'call'
  );

  const selectedDayEntries = useMemo(() => {
    if (!selectedDate) return [];
    return scopedEntries
      .filter(
        (entry) =>
          entry.check_in_date &&
          entry.check_out_date &&
          entry.check_in_date <= selectedDate &&
          selectedDate < entry.check_out_date
      )
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
  }, [scopedEntries, selectedDate]);

  const upcoming = useMemo(
    () =>
      scopedEntries
        .filter((entry) => entry.check_out_date >= today && entry.status !== 'cancelled')
        .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))
        .slice(0, 12),
    [scopedEntries, today]
  );

  const showSetupHint = isSupabaseConfigured() && ledgerAvailable === false;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b94726]">
            Availability control
          </span>
          <h2 className="mt-1 font-serif text-2xl font-extrabold text-stone-900">
            Booking calendar
          </h2>
          <p className="mt-1 max-w-xl text-xs text-stone-500">
            Confirmed stays, pending requests and direct WhatsApp/call enquiries on one calendar.
            Confirm a request here and the dates become booked for everyone.
          </p>
        </div>

        <select
          value={propertyFilter}
          onChange={(event) => setPropertyFilter(event.target.value)}
          className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 focus:border-stone-900 focus:outline-none"
        >
          <option value="all">All properties</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.title}
            </option>
          ))}
        </select>
      </div>

      {showSetupHint && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-[11px] font-medium text-amber-900">
          The shared calendar is not connected yet. Run{' '}
          <span className="font-mono font-bold">supabase/migrations/006_booking_ledger.sql</span> in
          Supabase to sync bookings and requests across devices.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            <CheckCircle className="h-3.5 w-3.5" />
            Confirmed
          </div>
          <div className="mt-1 text-xl font-extrabold text-emerald-900">{confirmed.length}</div>
          <div className="text-[10px] text-emerald-700">
            {confirmed.reduce((sum, entry) => sum + entry.nights, 0)} booked nights
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </div>
          <div className="mt-1 text-xl font-extrabold text-amber-900">{pending.length}</div>
          <div className="text-[10px] text-amber-700">awaiting your action</div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
            <MessageCircle className="h-3.5 w-3.5" />
            Direct
          </div>
          <div className="mt-1 text-xl font-extrabold text-sky-900">{direct.length}</div>
          <div className="text-[10px] text-sky-700">WhatsApp &amp; call requests</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StayCalendar
            entries={scopedEntries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {selectedDate ? formatDate(selectedDate) : 'Requests & stays'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {selectedDate
                  ? `${selectedDayEntries.length} overlapping ${selectedDayEntries.length === 1 ? 'item' : 'items'}`
                  : 'Upcoming activity'}
              </p>
            </div>
            <Calendar className="h-4 w-4 text-stone-400" />
          </div>

          <div className="mt-4 space-y-2">
            {selectedDate && selectedDayEntries.length === 0 && (
              <p className="rounded-xl bg-stone-50 px-3 py-6 text-center text-[11px] text-stone-400">
                No stays or requests on this date.
              </p>
            )}

            {selectedDate &&
              selectedDayEntries.map((entry) => (
                <div
                  key={entry.booking_ref}
                  className="rounded-xl border border-stone-200 p-3 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#b94726]">
                      {entry.booking_ref}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[entry.status]}`}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-stone-900">{entry.property_title}</div>
                  <div className="text-stone-500">
                    {entry.guest_name} · {entry.unit_name || 'Unit'}
                  </div>
                  <div className="text-stone-500">
                    {formatDate(entry.check_in_date)} → {formatDate(entry.check_out_date)}
                  </div>
                </div>
              ))}

            {!selectedDate && upcoming.length === 0 && (
              <p className="rounded-xl bg-stone-50 px-3 py-6 text-center text-[11px] text-stone-400">
                No bookings or requests yet.
              </p>
            )}

            {!selectedDate &&
              upcoming.map((entry) => (
                <div
                  key={entry.booking_ref}
                  className="rounded-xl border border-stone-200 p-3 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#b94726]">
                      {entry.booking_ref}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[entry.status]}`}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-stone-900">{entry.property_title}</div>
                  <div className="text-stone-500">
                    {entry.guest_name} · {formatDate(entry.check_in_date)} →{' '}
                    {formatDate(entry.check_out_date)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Upcoming requests &amp; stays</h3>
            <p className="text-[11px] text-stone-400">
              Confirm or decline pending platform requests and direct enquiries.
            </p>
          </div>
          <Inbox className="h-4 w-4 text-stone-400" />
        </div>

        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-xl bg-stone-50 px-3 py-8 text-center text-[11px] text-stone-400">
            When a traveller books or sends a WhatsApp/call request, it will appear here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((entry) => {
              const actionable = entry.status === 'pending' || entry.status === 'inquiry';
              const busy = busyRef === entry.booking_ref;
              const guestDialable = toDialablePhone(entry.guest_phone);

              return (
                <div
                  key={entry.booking_ref}
                  className="flex flex-col gap-3 rounded-2xl border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#b94726]">
                        {entry.booking_ref}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[entry.status]}`}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>
                      {entry.channel !== 'platform' && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-800">
                          {entry.channel === 'whatsapp' ? 'WhatsApp' : 'Phone'}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 truncate text-sm font-bold text-stone-900">
                      {entry.property_title}
                      <span className="font-normal text-stone-400"> · {entry.unit_name}</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {entry.guest_name} · {formatDate(entry.check_in_date)} →{' '}
                      {formatDate(entry.check_out_date)} · {entry.nights} nights ·{' '}
                      {entry.num_guests} guests
                    </div>
                    {entry.special_requests && (
                      <div className="mt-1 line-clamp-2 text-[10px] italic text-stone-400">
                        “{entry.special_requests}”
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <div className="mr-1 text-right">
                      <div className="text-xs font-extrabold text-stone-900">
                        {formatRWF(entry.total_price_rwf)}
                      </div>
                      <div className="text-[9px] uppercase text-stone-400">Stay value</div>
                    </div>

                    {guestDialable && (
                      <>
                        <a
                          href={`https://wa.me/${guestDialable}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          aria-label={`WhatsApp ${entry.guest_name}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href={`tel:+${guestDialable}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50"
                          aria-label={`Call ${entry.guest_name}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}

                    {actionable && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusChange(entry.booking_ref, 'confirmed')}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {busy ? 'Saving...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(entry.booking_ref, 'rejected')}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-xl border border-stone-300 px-2.5 py-1.5 text-[10px] font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
