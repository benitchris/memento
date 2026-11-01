'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LedgerEntry, LedgerStatus } from '@/lib/types';

interface StayCalendarProps {
  entries: LedgerEntry[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  /** Compact mode hides the legend for dense dashboard cards. */
  compact?: boolean;
}

const ACTIVE_STATUSES: LedgerStatus[] = ['confirmed', 'completed', 'pending'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function barClasses(status: LedgerStatus): string {
  if (status === 'confirmed' || status === 'completed') return 'bg-emerald-100 text-emerald-900 border-emerald-200';
  if (status === 'pending') return 'bg-amber-100 text-amber-900 border-amber-200';
  return 'bg-sky-100 text-sky-900 border-sky-200';
}

export function StayCalendar({
  entries,
  selectedDate,
  onSelectDate,
  compact = false,
}: StayCalendarProps) {
  const today = new Date();
  const todayKey = dateKey(today);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(year, monthIndex, index + 1 - firstWeekday);
      return {
        date,
        key: dateKey(date),
        inMonth: date.getMonth() === monthIndex,
      };
    });
  }, [month]);

  const staysForDay = (day: string) =>
    entries.filter(
      (entry) =>
        ACTIVE_STATUSES.includes(entry.status) &&
        entry.check_in_date &&
        entry.check_out_date &&
        entry.check_in_date <= day &&
        day < entry.check_out_date
    );

  const enquiriesForDay = (day: string) =>
    entries.filter(
      (entry) =>
        entry.status === 'inquiry' &&
        entry.check_in_date &&
        entry.check_out_date &&
        entry.check_in_date <= day &&
        day < entry.check_out_date
    );

  const moveMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate?.(todayKey);
  };

  const handleSelect = (key: string, inMonth: boolean) => {
    if (!inMonth) {
      const [y, m] = key.split('-').map(Number);
      setMonth(new Date(y, m - 1, 1));
    }
    onSelectDate?.(key);
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Occupancy calendar
          </span>
          <h3 className="mt-0.5 text-base font-bold text-stone-900">{monthLabel(month)}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-full border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-stone-400">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, key, inMonth }) => {
          const stays = staysForDay(key);
          const enquiries = enquiriesForDay(key);
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const visibleStays = stays.slice(0, 2);

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key, inMonth)}
              title={
                stays.length > 0
                  ? stays.map((entry) => `${entry.guest_name} · ${entry.property_title}`).join('\n')
                  : undefined
              }
              className={`relative flex min-h-[74px] flex-col rounded-xl border p-1.5 text-left transition-colors ${
                inMonth ? 'bg-white' : 'bg-stone-50/60'
              } ${
                isSelected
                  ? 'border-[#b94726] ring-2 ring-[#b94726]/20'
                  : 'border-stone-100 hover:border-stone-300'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isToday
                    ? 'bg-[#1f4e3d] text-white'
                    : inMonth
                    ? 'text-stone-700'
                    : 'text-stone-300'
                }`}
              >
                {date.getDate()}
              </span>

              <span className="mt-1 flex flex-1 flex-col gap-0.5">
                {visibleStays.map((entry) => (
                  <span
                    key={entry.booking_ref}
                    className={`block truncate rounded border px-1 py-0.5 text-[9px] font-semibold leading-tight ${barClasses(
                      entry.status
                    )}`}
                  >
                    {entry.check_in_date === key
                      ? entry.guest_name.split(' ')[0]
                      : '\u00A0'}
                  </span>
                ))}
                {stays.length > visibleStays.length && (
                  <span className="px-1 text-[9px] font-bold text-stone-400">
                    +{stays.length - visibleStays.length} more
                  </span>
                )}
              </span>

              {enquiries.length > 0 && (
                <span
                  className="absolute bottom-1 right-1 flex items-center gap-0.5"
                  title={`${enquiries.length} direct enquiry`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm border border-emerald-200 bg-emerald-100" />
            Confirmed stay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm border border-amber-200 bg-amber-100" />
            Pending request
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Direct WhatsApp / call enquiry
          </span>
        </div>
      )}
    </div>
  );
}
