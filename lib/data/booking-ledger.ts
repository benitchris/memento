'use client';

import {
  BookableUnit,
  Booking,
  LedgerChannel,
  LedgerEntry,
  LedgerStatus,
  Property,
  UserProfile,
} from '@/lib/types';
import { calculateNights } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from './service';

/**
 * The ledger lives in Supabase (migration 006). If the table has not been
 * created yet we stop retrying and fall back to the local store, so the
 * dashboards still work while the migration is pending.
 */
let ledgerSupported: boolean | null = null;

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function asChannel(value: unknown): LedgerChannel {
  return value === 'whatsapp' || value === 'call' || value === 'manual' ? value : 'platform';
}

function asStatus(value: unknown): LedgerStatus {
  const allowed: LedgerStatus[] = [
    'inquiry',
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'completed',
  ];
  return allowed.includes(value as LedgerStatus) ? (value as LedgerStatus) : 'inquiry';
}

function mapLedgerRow(row: Record<string, unknown>): LedgerEntry {
  return {
    booking_ref: String(row.booking_ref),
    property_id: asText(row.property_id),
    property_title: asText(row.property_title, 'Memento stay'),
    host_id: (row.host_id as string) || undefined,
    host_name: (row.host_name as string) || undefined,
    host_phone: (row.host_phone as string) || undefined,
    guest_id: (row.guest_id as string) || undefined,
    guest_name: asText(row.guest_name, 'Guest'),
    guest_phone: (row.guest_phone as string) || undefined,
    city: (row.city as string) || undefined,
    unit_id: (row.unit_id as string) || undefined,
    unit_name: (row.unit_name as string) || undefined,
    check_in_date: asText(row.check_in_date),
    check_out_date: asText(row.check_out_date),
    nights: asNumber(row.nights),
    num_guests: asNumber(row.num_guests, 1),
    nightly_rate_rwf: asNumber(row.nightly_rate_rwf),
    total_price_rwf: asNumber(row.total_price_rwf),
    service_fee_rwf: asNumber(row.service_fee_rwf),
    currency: asText(row.currency, 'RWF'),
    channel: asChannel(row.channel),
    status: asStatus(row.status),
    payment_method: (row.payment_method as string) || undefined,
    special_requests: (row.special_requests as string) || undefined,
    created_at: (row.created_at as string) || new Date().toISOString(),
    updated_at: (row.updated_at as string) || undefined,
    source: 'cloud',
  };
}

function toLedgerRow(entry: LedgerEntry) {
  return {
    booking_ref: entry.booking_ref,
    property_id: entry.property_id,
    property_title: entry.property_title,
    host_id: entry.host_id || null,
    host_name: entry.host_name || null,
    host_phone: entry.host_phone || null,
    guest_id: entry.guest_id || null,
    guest_name: entry.guest_name,
    guest_phone: entry.guest_phone || null,
    city: entry.city || null,
    unit_id: entry.unit_id || null,
    unit_name: entry.unit_name || null,
    check_in_date: entry.check_in_date || null,
    check_out_date: entry.check_out_date || null,
    nights: entry.nights,
    num_guests: entry.num_guests,
    nightly_rate_rwf: entry.nightly_rate_rwf,
    total_price_rwf: entry.total_price_rwf,
    service_fee_rwf: entry.service_fee_rwf,
    currency: entry.currency,
    channel: entry.channel,
    status: entry.status,
    payment_method: entry.payment_method || null,
    special_requests: entry.special_requests || null,
    updated_at: new Date().toISOString(),
  };
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|Could not find the table|schema cache/i.test(error.message || '')
  );
}

export function ledgerIsConfigured(): boolean {
  return isSupabaseConfigured() && ledgerSupported !== false;
}

export async function fetchBookingLedger(): Promise<{
  entries: LedgerEntry[];
  supported: boolean;
}> {
  if (!isSupabaseConfigured()) return { entries: [], supported: false };
  if (ledgerSupported === false) return { entries: [], supported: false };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('booking_ledger')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !data) {
    if (isMissingTableError(error)) ledgerSupported = false;
    return { entries: [], supported: false };
  }

  ledgerSupported = true;
  return { entries: data.map(mapLedgerRow), supported: true };
}

/** Append (or refresh) one ledger row in the shared ledger. */
export async function recordLedgerEntry(entry: LedgerEntry): Promise<void> {
  if (!ledgerIsConfigured()) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('booking_ledger')
    .upsert(toLedgerRow(entry), { onConflict: 'booking_ref' });

  if (error) {
    if (isMissingTableError(error)) ledgerSupported = false;
    throw new Error(error.message);
  }

  ledgerSupported = true;
}

/** Hosts and administrators change the ledger status of a request. */
export async function updateCloudLedgerStatus(
  bookingRef: string,
  status: LedgerStatus
): Promise<void> {
  if (!ledgerIsConfigured()) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('booking_ledger')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('booking_ref', bookingRef);

  if (error) throw new Error(error.message);
}

export function makeRequestRef(channel: LedgerChannel): string {
  const year = new Date().getFullYear();
  const prefix = channel === 'whatsapp' ? 'WA' : channel === 'call' ? 'CALL' : 'REQ';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MMT-${prefix}-${year}-${randomStr}`;
}

/** Build the ledger snapshot for a confirmed/pending platform booking. */
export function bookingToLedgerEntry(booking: Booking, property?: Property): LedgerEntry {
  const prop = booking.property || property;
  const unit = booking.unit || prop?.units?.find((item) => item.id === booking.unit_id);
  const host = prop?.host;
  const guest = booking.guest;

  return {
    booking_ref: booking.booking_ref,
    property_id: booking.property_id,
    property_title: prop?.title || 'Memento stay',
    host_id: prop?.host_id || host?.id,
    host_name: host?.full_name,
    host_phone: host?.phone_number,
    guest_id: booking.guest_id,
    guest_name: guest?.full_name || 'Memento guest',
    guest_phone: guest?.phone_number,
    city: prop?.city,
    unit_id: booking.unit_id,
    unit_name: unit?.name,
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    nights: booking.nights,
    num_guests: booking.num_guests,
    nightly_rate_rwf: booking.nightly_rate_rwf,
    total_price_rwf: booking.total_price_rwf,
    service_fee_rwf: booking.service_fee_rwf,
    currency: booking.currency || 'RWF',
    channel: 'platform',
    status: booking.status,
    payment_method: booking.payment_method,
    special_requests: booking.special_requests,
    created_at: booking.created_at,
    updated_at: booking.created_at,
    source: 'local',
  };
}

/** Build the ledger snapshot for a WhatsApp or phone booking request. */
export function enquiryToLedgerEntry(params: {
  channel: 'whatsapp' | 'call';
  property: Property;
  unit: BookableUnit;
  guest: UserProfile;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalPriceRwf: number;
  serviceFeeRwf: number;
  specialRequests?: string;
}): LedgerEntry {
  const nights = calculateNights(params.checkInDate, params.checkOutDate);

  return {
    booking_ref: makeRequestRef(params.channel),
    property_id: params.property.id,
    property_title: params.property.title,
    host_id: params.property.host_id,
    host_name: params.property.host?.full_name,
    host_phone: params.property.host?.phone_number,
    guest_id: params.guest.id || undefined,
    guest_name: params.guest.full_name || 'Website visitor',
    guest_phone: params.guest.phone_number || undefined,
    city: params.property.city,
    unit_id: params.unit.id,
    unit_name: params.unit.name,
    check_in_date: params.checkInDate,
    check_out_date: params.checkOutDate,
    nights,
    num_guests: params.numGuests,
    nightly_rate_rwf: params.unit.base_price_rwf,
    total_price_rwf: params.totalPriceRwf,
    service_fee_rwf: params.serviceFeeRwf,
    currency: 'RWF',
    channel: params.channel,
    status: 'inquiry',
    payment_method: 'pay_at_property',
    special_requests: params.specialRequests,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'local',
  };
}

/**
 * Merge local bookings with shared ledger rows. The local copy wins for the
 * browser that created the booking (so confirming happens instantly), while
 * every other browser reads the shared cloud snapshot.
 */
export function buildLedgerEntries(
  bookings: Booking[],
  properties: Property[],
  cloudEntries: LedgerEntry[]
): LedgerEntry[] {
  const propertiesById = new Map(properties.map((property) => [property.id, property]));
  const byRef = new Map<string, LedgerEntry>();

  for (const cloudEntry of cloudEntries) {
    byRef.set(cloudEntry.booking_ref, cloudEntry);
  }

  for (const booking of bookings) {
    const localEntry = bookingToLedgerEntry(booking, propertiesById.get(booking.property_id));
    const cloudEntry = byRef.get(localEntry.booking_ref);
    byRef.set(
      localEntry.booking_ref,
      cloudEntry
        ? {
            ...cloudEntry,
            ...localEntry,
            channel: cloudEntry.channel,
            created_at: cloudEntry.created_at || localEntry.created_at,
            source: 'local',
          }
        : localEntry
    );
  }

  return [...byRef.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Normalise a Rwandan number for wa.me / tel: links. */
export function toDialablePhone(phone: string | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('250')) return digits;
  if (digits.startsWith('0')) return `25${digits}`;
  return digits;
}

export function daysBetween(start: string, end: string): string[] {
  if (!start || !end) return [];
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  let guard = 0;

  while (cursor < last && guard < 400) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return days;
}
