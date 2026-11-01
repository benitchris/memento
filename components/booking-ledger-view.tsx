'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  Globe,
  Inbox,
  LayoutList,
  MessageCircle,
  Phone,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { LedgerChannel, LedgerEntry, LedgerStatus } from '@/lib/types';
import { formatDate, formatRWF } from '@/lib/utils/format';
import { isSupabaseConfigured } from '@/lib/data/service';
import { StayCalendar } from '@/components/stay-calendar';

interface BookingLedgerViewProps {
  entries: LedgerEntry[];
  ledgerAvailable: boolean | null;
}

type StatusGroup = 'all' | 'active' | 'confirmed' | 'closed';
type ChannelFilter = 'all' | LedgerChannel;

const STATUS_STYLES: Record<LedgerStatus, string> = {
  inquiry: 'bg-sky-100 text-sky-800',
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-stone-200 text-stone-700',
};

const STATUS_LABELS: Record<LedgerStatus, string> = {
  inquiry: 'Enquiry',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
};

const CHANNEL_META: Record<
  LedgerChannel,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  platform: { label: 'Memento', className: 'bg-stone-100 text-stone-700', Icon: Globe },
  whatsapp: { label: 'WhatsApp', className: 'bg-emerald-50 text-emerald-800', Icon: MessageCircle },
  call: { label: 'Phone call', className: 'bg-sky-50 text-sky-800', Icon: Phone },
  manual: { label: 'Manual', className: 'bg-violet-50 text-violet-800', Icon: Inbox },
};

function statusInGroup(status: LedgerStatus, group: StatusGroup): boolean {
  if (group === 'all') return true;
  if (group === 'active') return status === 'pending' || status === 'inquiry';
  if (group === 'confirmed') return status === 'confirmed' || status === 'completed';
  return status === 'rejected' || status === 'cancelled';
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function isStayActive(entry: LedgerEntry): boolean {
  return entry.status === 'confirmed' || entry.status === 'pending' || entry.status === 'completed';
}

export function BookingLedgerView({ entries, ledgerAvailable }: BookingLedgerViewProps) {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all');
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const confirmedEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'confirmed' || entry.status === 'completed'),
    [entries]
  );

  const gmv = confirmedEntries.reduce((sum, entry) => sum + entry.total_price_rwf, 0);
  const fees = confirmedEntries
    .filter((entry) => entry.channel === 'platform')
    .reduce((sum, entry) => sum + entry.service_fee_rwf, 0);
  const bookedNights = confirmedEntries.reduce((sum, entry) => sum + entry.nights, 0);

  const directEnquiries = useMemo(
    () => entries.filter((entry) => entry.channel === 'whatsapp' || entry.channel === 'call'),
    [entries]
  );
  const directWon = directEnquiries.filter(
    (entry) => entry.status === 'confirmed' || entry.status === 'completed'
  ).length;
  const directConversion = directEnquiries.length
    ? Math.round((directWon / directEnquiries.length) * 100)
    : 0;

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!statusInGroup(entry.status, statusGroup)) return false;
      if (channel !== 'all' && entry.channel !== channel) return false;
      if (!query) return true;
      return [
        entry.booking_ref,
        entry.property_title,
        entry.unit_name,
        entry.guest_name,
        entry.host_name,
        entry.city,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [entries, statusGroup, channel, search]);

  const selectedDayEntries = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEntries.filter(
      (entry) =>
        entry.check_in_date &&
        entry.check_out_date &&
        entry.check_in_date <= selectedDate &&
        selectedDate < entry.check_out_date &&
        (isStayActive(entry) || entry.status === 'inquiry')
    );
  }, [filteredEntries, selectedDate]);

  const exportCsv = () => {
    const header = [
      'Reference',
      'Logged at',
      'Channel',
      'Status',
      'Property',
      'Unit',
      'City',
      'Host',
      'Host phone',
      'Guest',
      'Guest phone',
      'Check-in',
      'Check-out',
      'Nights',
      'Guests',
      'Nightly rate RWF',
      'Total RWF',
      'Platform fee RWF',
      'Payment method',
      'Special requests',
    ];

    const rows = filteredEntries.map((entry) => [
      entry.booking_ref,
      entry.created_at,
      entry.channel,
      entry.status,
      entry.property_title,
      entry.unit_name,
      entry.city,
      entry.host_name,
      entry.host_phone,
      entry.guest_name,
      entry.guest_phone,
      entry.check_in_date,
      entry.check_out_date,
      entry.nights,
      entry.num_guests,
      entry.nightly_rate_rwf,
      entry.total_price_rwf,
      entry.service_fee_rwf,
      entry.payment_method,
      entry.special_requests,
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memento-booking-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const showSetupHint = isSupabaseConfigured() && ledgerAvailable === false;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#1f4e3d]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1f4e3d]">
              Investor ledger
            </span>
            <span className="text-[11px] font-semibold text-stone-400">
              Activity recorded since day one
            </span>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-extrabold text-stone-900">
            Booking &amp; enquiry ledger
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-stone-500">
            Every platform booking plus every WhatsApp and phone request is appended here with the
            property, unit, stay dates, guest and value. Use it as the single source of truth for
            bookings and demand.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-stone-200 p-1">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                view === 'table' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Ledger
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                view === 'calendar' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredEntries.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-[#b94726] px-4 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-[#9e3b1e] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {showSetupHint && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-[11px] font-medium text-amber-900">
          The shared ledger table is not connected yet, so new rows are only saved on this device.
          Run <span className="font-mono font-bold">supabase/migrations/006_booking_ledger.sql</span>{' '}
          in the Supabase SQL Editor to record ledger activity across every browser.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed GMV</span>
            <Wallet className="h-4 w-4 text-[#b94726]" />
          </div>
          <div className="mt-3 text-xl font-extrabold text-stone-900">{formatRWF(gmv)}</div>
          <p className="mt-1 text-[11px] text-stone-400">
            {confirmedEntries.length} confirmed {confirmedEntries.length === 1 ? 'stay' : 'stays'}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Platform fees</span>
            <TrendingUp className="h-4 w-4 text-[#1f4e3d]" />
          </div>
          <div className="mt-3 text-xl font-extrabold text-emerald-800">{formatRWF(fees)}</div>
          <p className="mt-1 text-[11px] text-stone-400">Booked-night gross commission</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Booked nights</span>
            <Calendar className="h-4 w-4 text-stone-600" />
          </div>
          <div className="mt-3 text-xl font-extrabold text-stone-900">{bookedNights}</div>
          <p className="mt-1 text-[11px] text-stone-400">Confirmed room-nights on the ledger</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Direct enquiries</span>
            <MessageCircle className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-3 text-xl font-extrabold text-stone-900">{directEnquiries.length}</div>
          <p className="mt-1 text-[11px] text-stone-400">
            WhatsApp + calls · {directConversion}% converted
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ref, property, guest or host..."
            className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusGroup}
            onChange={(event) => setStatusGroup(event.target.value as StatusGroup)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-[11px] font-semibold text-stone-700 focus:border-stone-900 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Needs action</option>
            <option value="confirmed">Confirmed stays</option>
            <option value="closed">Declined / cancelled</option>
          </select>

          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as ChannelFilter)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-[11px] font-semibold text-stone-700 focus:border-stone-900 focus:outline-none"
          >
            <option value="all">All channels</option>
            <option value="platform">Memento bookings</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">Phone calls</option>
            <option value="manual">Manual</option>
          </select>

          <span className="text-[11px] font-semibold text-stone-400">
            {filteredEntries.length} of {entries.length} rows
          </span>
        </div>
      </div>

      {view === 'table' ? (
        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          {filteredEntries.length === 0 ? (
            <div className="py-14 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-stone-300" />
              <p className="text-sm font-bold text-stone-700">No ledger rows match this filter</p>
              <p className="mt-1 text-xs text-stone-500">
                Bookings and WhatsApp/call requests will appear here as soon as they happen.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Stay</th>
                  <th className="pb-3">Accommodation</th>
                  <th className="pb-3">Guest</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredEntries.map((entry) => {
                  const channelMeta = CHANNEL_META[entry.channel];
                  const ChannelIcon = channelMeta.Icon;

                  return (
                    <tr key={entry.booking_ref} className="align-top hover:bg-stone-50">
                      <td className="py-3.5">
                        <div className="font-mono text-[11px] font-bold text-[#b94726]">
                          {entry.booking_ref}
                        </div>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${channelMeta.className}`}
                        >
                          <ChannelIcon className="h-2.5 w-2.5" />
                          {channelMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-stone-900">
                          {formatDate(entry.check_in_date)}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          to {formatDate(entry.check_out_date)} · {entry.nights}n ·{' '}
                          {entry.num_guests} guest{entry.num_guests === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="max-w-[220px] truncate font-semibold text-stone-900">
                          {entry.property_title}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {entry.unit_name || 'Unit'} · {entry.city || 'Rwanda'}
                        </div>
                        {entry.host_name && (
                          <div className="text-[10px] text-stone-400">Host: {entry.host_name}</div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-stone-900">{entry.guest_name}</div>
                        {entry.guest_phone && (
                          <div className="text-[11px] text-stone-500">{entry.guest_phone}</div>
                        )}
                        {entry.special_requests && (
                          <div
                            className="max-w-[200px] truncate text-[10px] italic text-stone-400"
                            title={entry.special_requests}
                          >
                            “{entry.special_requests}”
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-stone-900">
                          {formatRWF(entry.total_price_rwf)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Fee {formatRWF(entry.service_fee_rwf)}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[entry.status]}`}
                        >
                          {STATUS_LABELS[entry.status]}
                        </span>
                      </td>
                      <td className="py-3.5 text-[11px] text-stone-500">
                        {formatDate(entry.created_at)}
                        <div className="text-[10px] text-stone-400">
                          {new Date(entry.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <StayCalendar
              entries={filteredEntries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900">
              {selectedDate ? formatDate(selectedDate) : 'Pick a day'}
            </h3>
            <p className="mt-0.5 text-[11px] text-stone-400">
              Stays and enquiries overlapping the selected date.
            </p>

            <div className="mt-4 space-y-2">
              {selectedDayEntries.length === 0 ? (
                <p className="rounded-xl bg-stone-50 px-3 py-6 text-center text-[11px] text-stone-400">
                  {selectedDate ? 'No stays or enquiries on this date.' : 'Click a date on the calendar.'}
                </p>
              ) : (
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
                    <div className="mt-1 text-stone-500">
                      {formatDate(entry.check_in_date)} → {formatDate(entry.check_out_date)}
                    </div>
                    {entry.channel !== 'platform' && (
                      <div className="mt-1 text-[10px] font-semibold text-sky-700">
                        Direct {CHANNEL_META[entry.channel].label.toLowerCase()} enquiry
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
