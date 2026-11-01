'use client';

import {
  BookableUnit,
  Destination,
  Property,
  PropertyImage,
  PropertyStatus,
  UserProfile,
} from '@/lib/types';
import { isSupabaseConfigured } from './service';
import { createClient } from '@/lib/supabase/client';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'memento-stay';
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return `${base}-${suffix}`;
}

function mapHost(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: asText(row.email),
    full_name: asText(row.full_name, 'Memento Host'),
    phone_number: (row.phone_number as string) || undefined,
    avatar_url: (row.avatar_url as string) || undefined,
    role: (row.role as UserProfile['role']) || 'host',
    preferred_currency: (row.preferred_currency as 'RWF' | 'USD') || 'RWF',
    created_at: (row.created_at as string) || undefined,
  };
}

function mapImage(row: Record<string, unknown>): PropertyImage {
  return {
    id: String(row.id),
    property_id: String(row.property_id),
    image_url: asText(row.image_url),
    caption: (row.caption as string) || undefined,
    display_order: asNumber(row.display_order),
    is_primary: Boolean(row.is_primary),
  };
}

function mapUnit(row: Record<string, unknown>): BookableUnit {
  return {
    id: String(row.id),
    property_id: String(row.property_id),
    name: asText(row.name, 'Bookable unit'),
    unit_type: (row.unit_type as BookableUnit['unit_type']) || 'room',
    is_entire_property: Boolean(row.is_entire_property),
    description: (row.description as string) || undefined,
    base_price_rwf: asNumber(row.base_price_rwf),
    weekly_discount_rate: asNumber(row.weekly_discount_rate),
    monthly_discount_rate: asNumber(row.monthly_discount_rate),
    cleaning_fee_rwf: asNumber(row.cleaning_fee_rwf),
    max_guests: asNumber(row.max_guests, 2),
    bedrooms: asNumber(row.bedrooms, 1),
    beds: asNumber(row.beds, 1),
    bathrooms: asNumber(row.bathrooms, 1),
    total_inventory: asNumber(row.total_inventory, 1),
    status: (row.status as BookableUnit['status']) || 'active',
  };
}

function dedupeImages(images: PropertyImage[]): PropertyImage[] {
  const byUrl = new Map<string, PropertyImage>();
  for (const image of images) {
    byUrl.set(image.image_url, image);
  }
  const unique = [...byUrl.values()].sort((a, b) => a.display_order - b.display_order);
  const coverIndex = unique.findIndex((image) => image.is_primary);
  const chosenIndex = coverIndex >= 0 ? coverIndex : 0;
  return unique.map((image, index) => ({ ...image, is_primary: index === chosenIndex }));
}

function mapProperty(
  row: Record<string, unknown>,
  units: BookableUnit[],
  images: PropertyImage[],
  host: UserProfile | undefined,
  destination: Destination | undefined
): Property {
  return {
    id: String(row.id),
    host_id: String(row.host_id),
    destination_id: (row.destination_id as string) || undefined,
    title: asText(row.title, 'Untitled stay'),
    slug: asText(row.slug, String(row.id)),
    description: asText(row.description),
    property_type: (row.property_type as Property['property_type']) || 'other',
    address: asText(row.address),
    city: asText(row.city),
    province: asText(row.province),
    latitude: row.latitude == null ? undefined : asNumber(row.latitude),
    longitude: row.longitude == null ? undefined : asNumber(row.longitude),
    check_in_time: asText(row.check_in_time, '14:00'),
    check_out_time: asText(row.check_out_time, '11:00'),
    cancellation_policy:
      (row.cancellation_policy as Property['cancellation_policy']) || 'flexible',
    house_rules: Array.isArray(row.house_rules) ? (row.house_rules as string[]) : undefined,
    status: (row.status as PropertyStatus) || 'under_review',
    is_featured: Boolean(row.is_featured),
    instant_book: Boolean(row.instant_book),
    rating_average: asNumber(row.rating_average),
    review_count: asNumber(row.review_count),
    created_at: (row.created_at as string) || new Date().toISOString(),
    images: dedupeImages(images),
    units: units.sort((a, b) => a.name.localeCompare(b.name)),
    host,
    destination,
    amenities: [],
    source: 'cloud',
  };
}

let destinationCache: Destination[] | null = null;

async function fetchDbDestinations(): Promise<Destination[]> {
  if (destinationCache) return destinationCache;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('destinations')
    .select('id, name, province, description, image_url, is_popular, display_order');

  if (error || !data) return [];

  destinationCache = data.map((row) => ({
    id: String(row.id),
    name: asText(row.name),
    province: asText(row.province),
    description: asText(row.description),
    image_url: asText(row.image_url),
    is_popular: Boolean(row.is_popular),
    display_order: asNumber(row.display_order),
  }));

  return destinationCache;
}

async function resolveDestinationId(city: string, province: string): Promise<string | null> {
  const destinations = await fetchDbDestinations();
  if (destinations.length === 0) return null;

  const normalise = (value: string) => value.toLowerCase().replace(/\(.*?\)/g, '').trim();
  const target = normalise(city);

  const match =
    destinations.find((destination) => normalise(destination.name) === target) ||
    destinations.find((destination) => normalise(destination.name).startsWith(target)) ||
    destinations.find((destination) => normalise(destination.province) === normalise(province));

  return match?.id || null;
}

/**
 * Load every property the signed-in user is allowed to see. Supabase RLS
 * returns approved listings to travellers, owned listings to hosts and the
 * full marketplace to administrators.
 */
export async function fetchCloudProperties(): Promise<Property[]> {
  const supabase = createClient();

  const { data: rows, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  const propertyIds = rows.map((row) => String(row.id));
  const hostIds = [...new Set(rows.map((row) => String(row.host_id)))];

  const [unitsResult, imagesResult, hostsResult, destinations] = await Promise.all([
    supabase.from('units').select('*').in('property_id', propertyIds),
    supabase.from('property_images').select('*').in('property_id', propertyIds),
    supabase
      .from('profiles')
      .select('id, email, full_name, phone_number, avatar_url, role, preferred_currency, created_at')
      .in('id', hostIds),
    fetchDbDestinations(),
  ]);

  if (unitsResult.error) throw new Error(unitsResult.error.message);
  if (imagesResult.error) throw new Error(imagesResult.error.message);

  const unitsByProperty = new Map<string, BookableUnit[]>();
  for (const row of unitsResult.data || []) {
    const unit = mapUnit(row);
    unitsByProperty.set(unit.property_id, [...(unitsByProperty.get(unit.property_id) || []), unit]);
  }

  const imagesByProperty = new Map<string, PropertyImage[]>();
  for (const row of imagesResult.data || []) {
    const image = mapImage(row);
    imagesByProperty.set(image.property_id, [
      ...(imagesByProperty.get(image.property_id) || []),
      image,
    ]);
  }

  const hostsById = new Map<string, UserProfile>();
  for (const row of hostsResult.data || []) {
    const host = mapHost(row);
    hostsById.set(host.id, host);
  }

  const destinationsById = new Map(destinations.map((destination) => [destination.id, destination]));

  return rows.map((row) =>
    mapProperty(
      row,
      unitsByProperty.get(String(row.id)) || [],
      imagesByProperty.get(String(row.id)) || [],
      hostsById.get(String(row.host_id)),
      row.destination_id ? destinationsById.get(String(row.destination_id)) : undefined
    )
  );
}

interface CreateCloudPropertyInput {
  host: UserProfile;
  property: Partial<Property>;
  units: Partial<BookableUnit>[];
  images: PropertyImage[];
}

/**
 * Insert a submitted listing, its units and its photos into Supabase and
 * return the record shaped for the local store.
 */
export async function createCloudProperty({
  host,
  property,
  units,
  images,
}: CreateCloudPropertyInput): Promise<Property> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sign in again before submitting your listing.');

  // A host may have signed up without a profile row yet; the property's
  // foreign key needs one. Never touch an existing profile here.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email || host.email,
      full_name: host.full_name || user.email?.split('@')[0] || 'Memento Host',
      phone_number: host.phone_number || null,
      role: 'host',
      preferred_currency: 'RWF',
    });

    if (profileError) throw new Error(profileError.message);
  } else if (host.full_name || host.phone_number) {
    // Keep the public host card reachable for WhatsApp/call requests. Only
    // fill in the fields the host actually supplied during onboarding.
    const profileUpdates: Record<string, string> = {};
    if (host.full_name) profileUpdates.full_name = host.full_name;
    if (host.phone_number) profileUpdates.phone_number = host.phone_number;

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Could not update host contact details', profileUpdateError);
    }
  }

  const city = property.city || 'Kigali';
  const province = property.province || 'Kigali City';
  const destinationId = await resolveDestinationId(city, province);

  const { data: propertyRow, error: propertyError } = await supabase
    .from('properties')
    .insert({
      host_id: user.id,
      destination_id: destinationId,
      title: property.title || 'Untitled stay',
      slug: makeSlug(property.title || 'memento stay'),
      description: property.description || 'Newly listed accommodation in Rwanda.',
      property_type: property.property_type || 'apartment',
      address: property.address || city,
      city,
      province,
      check_in_time: property.check_in_time || '14:00',
      check_out_time: property.check_out_time || '11:00',
      cancellation_policy: property.cancellation_policy || 'flexible',
      status: 'under_review',
      instant_book: Boolean(property.instant_book),
    })
    .select('*')
    .single();

  if (propertyError || !propertyRow) {
    throw new Error(propertyError?.message || 'Could not create the listing.');
  }

  const unitRows = units.map((unit, index) => ({
    property_id: propertyRow.id,
    name: unit.name || `Unit ${index + 1}`,
    unit_type: unit.unit_type || 'room',
    is_entire_property: Boolean(unit.is_entire_property),
    description: unit.description || null,
    base_price_rwf: Math.round(unit.base_price_rwf || 50000),
    weekly_discount_rate: unit.weekly_discount_rate ?? 0.1,
    monthly_discount_rate: unit.monthly_discount_rate ?? 0.2,
    cleaning_fee_rwf: Math.round(unit.cleaning_fee_rwf || 0),
    max_guests: unit.max_guests || 2,
    bedrooms: unit.bedrooms ?? 1,
    beds: unit.beds ?? 1,
    bathrooms: unit.bathrooms ?? 1,
    total_inventory: unit.total_inventory || 1,
    status: 'active',
  }));

  const { data: insertedUnits, error: unitsError } = await supabase
    .from('units')
    .insert(unitRows)
    .select('*');

  if (unitsError) throw new Error(unitsError.message);

  const imageRows = images.map((image, index) => ({
    property_id: propertyRow.id,
    image_url: image.image_url,
    caption: image.caption || null,
    display_order: index + 1,
    is_primary: index === 0,
  }));

  const { data: insertedImages, error: imagesError } = await supabase
    .from('property_images')
    .insert(imageRows)
    .select('*');

  if (imagesError) throw new Error(imagesError.message);

  return mapProperty(
    propertyRow,
    (insertedUnits || []).map(mapUnit),
    (insertedImages || []).map(mapImage),
    host,
    destinationId ? (await fetchDbDestinations()).find((d) => d.id === destinationId) : undefined
  );
}

export async function updateCloudPropertyStatus(
  propertyId: string,
  status: PropertyStatus
): Promise<void> {
  if (!UUID_PATTERN.test(propertyId)) return;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', propertyId)
    .select('id');

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('Your account does not have permission to change this listing.');
  }
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/property-images/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}

/**
 * Replace a cloud listing's photo rows without leaving a window where the
 * property has no photos. New rows are inserted first, then the previous
 * rows and removed storage objects are cleaned up.
 */
export async function persistCloudPropertyImages(
  propertyId: string,
  images: PropertyImage[]
): Promise<PropertyImage[]> {
  if (!UUID_PATTERN.test(propertyId)) return images;

  const supabase = createClient();

  const { data: existing, error: existingError } = await supabase
    .from('property_images')
    .select('id, image_url')
    .eq('property_id', propertyId);

  if (existingError) throw new Error(existingError.message);

  const rows = images.map((image, index) => ({
    property_id: propertyId,
    image_url: image.image_url,
    caption: image.caption || null,
    display_order: index + 1,
    is_primary: index === 0,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('property_images')
    .insert(rows)
    .select('*');

  if (insertError) throw new Error(insertError.message);

  const oldIds = (existing || []).map((row) => String(row.id));
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .in('id', oldIds);

    if (deleteError) {
      console.error('Could not remove replaced property photo rows', deleteError);
    }
  }

  const keptUrls = new Set(images.map((image) => image.image_url));
  const removedPaths = (existing || [])
    .map((row) => String(row.image_url))
    .filter((url) => !keptUrls.has(url))
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => Boolean(path));

  if (removedPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('property-images')
      .remove(removedPaths);

    if (storageError) {
      console.error('Could not remove replaced property photos', storageError);
    }
  }

  return dedupeImages((inserted || []).map(mapImage));
}

/**
 * Review decisions for the bundled showcase catalogue. Those records ship
 * with the app instead of living in `public.properties`, so an approval only
 * becomes shared once it is written to `listing_publications`.
 */
let publicationsSupported: boolean | null = null;

export async function fetchListingPublications(): Promise<Record<string, PropertyStatus>> {
  // The table is optional until migration 005 has been applied. Remember a
  // missing table so the periodic refresh does not keep retrying it.
  if (publicationsSupported === false) return {};

  const supabase = createClient();
  const { data, error } = await supabase
    .from('listing_publications')
    .select('property_id, status');

  if (error || !data) {
    publicationsSupported = false;
    return {};
  }

  publicationsSupported = true;

  const overrides: Record<string, PropertyStatus> = {};
  for (const row of data) {
    overrides[String(row.property_id)] = row.status as PropertyStatus;
  }
  return overrides;
}

export async function publishListingStatus(
  propertyId: string,
  status: PropertyStatus
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('listing_publications').upsert(
    {
      property_id: propertyId,
      status,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'property_id' }
  );

  if (error) throw new Error(error.message);
}

export function isCloudListing(property: Property | undefined | null): boolean {
  return Boolean(property && property.source === 'cloud' && UUID_PATTERN.test(property.id));
}

export function isSupabasePropertyId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function cloudPropertiesEnabled(): boolean {
  return isSupabaseConfigured();
}
