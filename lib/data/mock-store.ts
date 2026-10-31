'use client';

import {
  Property,
  PropertyImage,
  BookableUnit,
  Booking,
  Review,
  UserProfile,
  InAppNotification,
  SearchFilters,
  PropertyStatus,
} from '@/lib/types';
import {
  DEMO_PROPERTIES,
  DEMO_BOOKINGS,
  DEMO_REVIEWS,
  DEMO_USERS,
  DEMO_DESTINATIONS,
  DEMO_AMENITIES,
} from './mock-data';
import { calculateNights, generateBookingRef } from '@/lib/utils/format';

const STORAGE_KEY = 'memento_store_v1';

interface StoreState {
  currentUser: UserProfile;
  properties: Property[];
  bookings: Booking[];
  reviews: Review[];
  notifications: InAppNotification[];
  favourites: string[]; // property ids
}

function getInitialState(): StoreState {
  if (typeof window === 'undefined') {
    return {
      currentUser: DEMO_USERS.traveller,
      properties: DEMO_PROPERTIES,
      bookings: DEMO_BOOKINGS,
      reviews: DEMO_REVIEWS,
      notifications: [
        {
          id: 'notif-1',
          user_id: 'usr-traveller-01',
          title: 'Booking Confirmed!',
          message: 'Your stay at Hillview Villa & Suites Nyarutarama is confirmed for 10 Nov 2026.',
          type: 'booking_confirmed',
          link: '/dashboard',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      favourites: ['prop-kigali-nyarutarama', 'prop-rubavu-kivu-lodge'],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage', e);
  }

  return {
    currentUser: DEMO_USERS.traveller,
    properties: DEMO_PROPERTIES,
    bookings: DEMO_BOOKINGS,
    reviews: DEMO_REVIEWS,
    notifications: [
      {
        id: 'notif-1',
        user_id: 'usr-traveller-01',
        title: 'Booking Confirmed!',
        message: 'Your stay at Hillview Villa & Suites Nyarutarama is confirmed for 10 Nov 2026.',
        type: 'booking_confirmed',
        link: '/dashboard',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    favourites: ['prop-kigali-nyarutarama', 'prop-rubavu-kivu-lodge'],
  };
}

let memoryState: StoreState = getInitialState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch (e) {
      console.error('Failed to persist store', e);
    }
  }
  listeners.forEach((listener) => listener());
}

// Keeps exactly one cover image, fixes stale ids/property ids and guarantees
// every property has at least one photo to render.
function normalisePropertyImages(propertyId: string, images: PropertyImage[]): PropertyImage[] {
  const source =
    images && images.length > 0
      ? images
      : [
          {
            id: `img-${propertyId}-1`,
            property_id: propertyId,
            image_url: '/images/kigali-loft.png',
            caption: 'Property overview',
            display_order: 1,
            is_primary: true,
          },
        ];

  const primaryIndex = source.findIndex((image) => image.is_primary);
  const chosenIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return source.map((image, index) => ({
    ...image,
    id: image.id || `img-${propertyId}-${index + 1}`,
    property_id: propertyId,
    display_order: index + 1,
    is_primary: index === chosenIndex,
  }));
}

export const MockStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): StoreState {
    return memoryState;
  },

  resetToDemo() {
    memoryState = {
      currentUser: DEMO_USERS.traveller,
      properties: DEMO_PROPERTIES,
      bookings: DEMO_BOOKINGS,
      reviews: DEMO_REVIEWS,
      notifications: [
        {
          id: 'notif-1',
          user_id: 'usr-traveller-01',
          title: 'Booking Confirmed!',
          message: 'Your stay at Hillview Villa & Suites Nyarutarama is confirmed for 10 Nov 2026.',
          type: 'booking_confirmed',
          link: '/dashboard',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ],
      favourites: ['prop-kigali-nyarutarama'],
    };
    persist();
  },

  getCurrentUser(): UserProfile {
    return memoryState.currentUser;
  },

  getDestinations() {
    return DEMO_DESTINATIONS;
  },

  getAmenities() {
    return DEMO_AMENITIES;
  },

  getProperties(filters?: SearchFilters, userOnlyHostId?: string): Property[] {
    let result = [...memoryState.properties];

    if (userOnlyHostId) {
      result = result.filter((p) => p.host_id === userOnlyHostId);
      return result;
    }

    if (!filters) {
      // By default for travellers, only show approved properties
      return result.filter((p) => p.status === 'approved');
    }

    // Filter by approval status
    result = result.filter((p) => p.status === 'approved');

    // Filter by destination
    if (filters.destination && filters.destination.trim() !== '') {
      const q = filters.destination.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.city.toLowerCase().includes(q) ||
          p.province.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          (p.destination && p.destination.name.toLowerCase().includes(q))
      );
    }

    // Filter by property type
    if (filters.propertyType && filters.propertyType !== 'all') {
      result = result.filter((p) => p.property_type === filters.propertyType);
    }

    // Filter by guests capacity
    if (filters.guests && filters.guests > 1) {
      result = result.filter((p) =>
        p.units?.some((u) => u.max_guests >= (filters.guests || 1))
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      result = result.filter((p) => {
        const lowestUnitRate = Math.min(...(p.units?.map((u) => u.base_price_rwf) || [0]));
        if (filters.minPrice !== undefined && lowestUnitRate < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && lowestUnitRate > filters.maxPrice) return false;
        return true;
      });
    }

    // Filter by amenities
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((p) =>
        filters.amenities!.every((reqAmenity) =>
          p.amenities?.some((a) => a.id === reqAmenity || a.name.toLowerCase() === reqAmenity.toLowerCase())
        )
      );
    }

    // Sorting
    if (filters.sortBy) {      if (filters.sortBy === 'price_asc') {
        result.sort((a, b) => {
          const aMin = Math.min(...(a.units?.map((u) => u.base_price_rwf) || [0]));
          const bMin = Math.min(...(b.units?.map((u) => u.base_price_rwf) || [0]));
          return aMin - bMin;
        });
      } else if (filters.sortBy === 'price_desc') {
        result.sort((a, b) => {
          const aMin = Math.min(...(a.units?.map((u) => u.base_price_rwf) || [0]));
          const bMin = Math.min(...(b.units?.map((u) => u.base_price_rwf) || [0]));
          return bMin - aMin;
        });
      } else if (filters.sortBy === 'rating') {
        result.sort((a, b) => b.rating_average - a.rating_average);
      } else if (filters.sortBy === 'newest') {
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }

    return result;
  },

  getPropertyById(id: string): Property | undefined {
    return memoryState.properties.find((p) => p.id === id || p.slug === id);
  },

  // UNIVERSAL AVAILABILITY & HIERARCHY OVERLAP LOGIC (Section 4 & Section 10)
  checkUnitAvailability(
    unitId: string,
    checkIn: string,
    checkOut: string,
    quantity: number = 1
  ): { available: boolean; reason?: string } {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      return { available: false, reason: 'Invalid date selection' };
    }

    let targetProperty: Property | undefined;
    let targetUnit: BookableUnit | undefined;

    for (const p of memoryState.properties) {
      const u = p.units?.find((un) => un.id === unitId);
      if (u) {
        targetProperty = p;
        targetUnit = u;
        break;
      }
    }

    if (!targetProperty || !targetUnit) {
      return { available: false, reason: 'Unit not found' };
    }

    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();

    // Helper: test if two date windows intersect
    const datesOverlap = (bIn: string, bOut: string) => {
      const bStart = new Date(bIn).getTime();
      const bEnd = new Date(bOut).getTime();
      return start < bEnd && end > bStart;
    };

    // 1. HIERARCHY OVERLAP CHECK
    // If targetUnit is an ENTIRE PROPERTY:
    if (targetUnit.is_entire_property) {
      // Check if ANY booking in this property is active during these dates
      const conflictingBooking = memoryState.bookings.find(
        (b) =>
          b.property_id === targetProperty!.id &&
          ['pending', 'confirmed'].includes(b.status) &&
          datesOverlap(b.check_in_date, b.check_out_date)
      );

      if (conflictingBooking) {
        return {
          available: false,
          reason: 'An individual room or unit within this property is already reserved for these dates.',
        };
      }
    } else {
      // If targetUnit is an INDIVIDUAL ROOM:
      // Check if the ENTIRE PROPERTY unit has an active booking!
      const entirePropertyBooking = memoryState.bookings.find(
        (b) =>
          b.property_id === targetProperty!.id &&
          ['pending', 'confirmed'].includes(b.status) &&
          datesOverlap(b.check_in_date, b.check_out_date) &&
          targetProperty!.units?.some((u) => u.id === b.unit_id && u.is_entire_property)
      );

      if (entirePropertyBooking) {
        return {
          available: false,
          reason: 'The entire property has been booked as a private residence for these dates.',
        };
      }
    }

    // 2. INVENTORY CHECK FOR THIS SPECIFIC UNIT
    const unitBookingsCount = memoryState.bookings
      .filter(
        (b) =>
          b.unit_id === unitId &&
          ['pending', 'confirmed'].includes(b.status) &&
          datesOverlap(b.check_in_date, b.check_out_date)
      )
      .reduce((sum, b) => sum + b.num_units_booked, 0);

    if (unitBookingsCount + quantity > targetUnit.total_inventory) {
      return {
        available: false,
        reason: `Only ${Math.max(0, targetUnit.total_inventory - unitBookingsCount)} unit(s) remaining for selected dates.`,
      };
    }

    return { available: true };
  },

  // CREATE BOOKING (Section 10)
  createBooking(params: {
    propertyId: string;
    unitId: string;
    checkInDate: string;
    checkOutDate: string;
    numGuests: number;
    numUnitsBooked?: number;
    paymentMethod?: 'pay_at_property' | 'momo_mtn' | 'momo_airtel' | 'card';
    specialRequests?: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const property = memoryState.properties.find((p) => p.id === params.propertyId);
    const unit = property?.units?.find((u) => u.id === params.unitId);

    if (!property || !unit) {
      return { success: false, error: 'Property or unit not found' };
    }

    const nights = calculateNights(params.checkInDate, params.checkOutDate);
    if (nights <= 0) {
      return { success: false, error: 'Check-out date must be after check-in date.' };
    }

    const unitsCount = params.numUnitsBooked || 1;

    // Check availability
    const availCheck = this.checkUnitAvailability(
      params.unitId,
      params.checkInDate,
      params.checkOutDate,
      unitsCount
    );

    if (!availCheck.available) {
      return { success: false, error: availCheck.reason || 'Unit is unavailable.' };
    }

    // Server-side calculation
    const nightlyRate = unit.base_price_rwf;
    const subtotal = nightlyRate * nights * unitsCount;
    let discount = 0;
    if (nights >= 28 && unit.monthly_discount_rate > 0) {
      discount = Math.round(subtotal * unit.monthly_discount_rate);
    } else if (nights >= 7 && unit.weekly_discount_rate > 0) {
      discount = Math.round(subtotal * unit.weekly_discount_rate);
    }

    const cleaningFee = unit.cleaning_fee_rwf;
    const serviceFee = Math.round((subtotal - discount) * 0.08); // 8% platform fee
    const totalPrice = subtotal - discount + cleaningFee + serviceFee;

    const bookingRef = generateBookingRef();
    const isInstant = property.instant_book;
    const initialStatus = isInstant ? 'confirmed' : 'pending';

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      booking_ref: bookingRef,
      property_id: property.id,
      unit_id: unit.id,
      guest_id: memoryState.currentUser.id,
      check_in_date: params.checkInDate,
      check_out_date: params.checkOutDate,
      nights,
      num_guests: params.numGuests,
      num_units_booked: unitsCount,
      nightly_rate_rwf: nightlyRate,
      subtotal_rwf: subtotal,
      cleaning_fee_rwf: cleaningFee,
      service_fee_rwf: serviceFee,
      discount_rwf: discount,
      total_price_rwf: totalPrice,
      currency: 'RWF',
      status: initialStatus,
      payment_status: 'pending',
      payment_method: params.paymentMethod || 'pay_at_property',
      special_requests: params.specialRequests,
      created_at: new Date().toISOString(),
      property,
      unit,
      guest: memoryState.currentUser,
    };

    memoryState.bookings.unshift(newBooking);

    // Create In-App Notifications
    memoryState.notifications.unshift({
      id: `notif-${Date.now()}-1`,
      user_id: property.host_id,
      title: `New Booking Request (${bookingRef})`,
      message: `New booking request for "${property.title}" (${unit.name}) from ${params.checkInDate} to ${params.checkOutDate}.`,
      type: 'booking_request',
      link: '/host/bookings',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    memoryState.notifications.unshift({
      id: `notif-${Date.now()}-2`,
      user_id: memoryState.currentUser.id,
      title: isInstant ? 'Booking Confirmed!' : 'Booking Request Sent!',
      message: isInstant
        ? `Your stay at ${property.title} is confirmed!`
        : `Your booking request for ${property.title} was submitted to host.`,
      type: isInstant ? 'booking_confirmed' : 'system',
      link: '/dashboard',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    persist();
    return { success: true, booking: newBooking };
  },

  updateBookingStatus(
    bookingId: string,
    newStatus: 'confirmed' | 'rejected' | 'cancelled' | 'completed',
    reason?: string
  ) {
    const booking = memoryState.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    booking.status = newStatus;
    if (newStatus === 'rejected') booking.rejection_reason = reason;
    if (newStatus === 'cancelled') booking.cancellation_reason = reason;

    // Notification
    let notifTitle = 'Booking Status Updated';
    let notifType: InAppNotification['type'] = 'system';

    if (newStatus === 'confirmed') {
      notifTitle = `Booking Confirmed (${booking.booking_ref})`;
      notifType = 'booking_confirmed';
    } else if (newStatus === 'rejected') {
      notifTitle = `Booking Request Declined (${booking.booking_ref})`;
      notifType = 'booking_rejected';
    } else if (newStatus === 'cancelled') {
      notifTitle = `Booking Cancelled (${booking.booking_ref})`;
      notifType = 'booking_cancelled';
    }

    memoryState.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: booking.guest_id,
      title: notifTitle,
      message: `Your booking ${booking.booking_ref} status is now: ${newStatus.toUpperCase()}.${reason ? ` Reason: ${reason}` : ''}`,
      type: notifType,
      link: '/dashboard',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    persist();
    return true;
  },

  // HOST: CREATE PROPERTY & UNITS (Section 7)
  createProperty(
    propertyData: Partial<Property>,
    units: Partial<BookableUnit>[],
    hostOverride?: Partial<UserProfile>
  ): Property {
    // Prefer the authenticated host identity so the listing appears in their
    // dashboard. Falls back to the demo user when running without Supabase.
    const hostUser: UserProfile = {
      ...memoryState.currentUser,
      ...hostOverride,
      id: hostOverride?.id || memoryState.currentUser.id,
      email: hostOverride?.email || memoryState.currentUser.email,
      full_name: hostOverride?.full_name || memoryState.currentUser.full_name,
      role: hostOverride?.role || memoryState.currentUser.role,
    };
    const propId = `prop-${Date.now()}`;
    const slug = propertyData.title
      ? propertyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now() % 1000}`
      : `property-${Date.now()}`;

    const newUnits: BookableUnit[] = units.map((u, index) => ({
      id: `unit-${propId}-${index + 1}`,
      property_id: propId,
      name: u.name || `Unit ${index + 1}`,
      unit_type: u.unit_type || 'room',
      is_entire_property: u.is_entire_property || false,
      description: u.description || '',
      base_price_rwf: u.base_price_rwf || 50000,
      weekly_discount_rate: u.weekly_discount_rate || 0.1,
      monthly_discount_rate: u.monthly_discount_rate || 0.2,
      cleaning_fee_rwf: u.cleaning_fee_rwf || 0,
      max_guests: u.max_guests || 2,
      bedrooms: u.bedrooms || 1,
      beds: u.beds || 1,
      bathrooms: u.bathrooms || 1,
      total_inventory: u.total_inventory || 1,
      status: 'active',
      images: u.images || [],
    }));

    const newProperty: Property = {
      id: propId,
      host_id: hostUser.id,
      destination_id: propertyData.destination_id || 'dest-kigali',
      title: propertyData.title || 'New Rwandan Accommodation',
      slug,
      description: propertyData.description || '',
      property_type: propertyData.property_type || 'apartment',
      address: propertyData.address || 'Kigali, Rwanda',
      city: propertyData.city || 'Kigali',
      province: propertyData.province || 'Kigali City',
      check_in_time: propertyData.check_in_time || '14:00',
      check_out_time: propertyData.check_out_time || '11:00',
      cancellation_policy: propertyData.cancellation_policy || 'flexible',
      house_rules: propertyData.house_rules || ['Respect quiet hours'],
      status: 'under_review', // Listings must not become publicly bookable until approved
      is_featured: false,
      instant_book: propertyData.instant_book || false,
      rating_average: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
      images: normalisePropertyImages(propId, propertyData.images || []),
      destination: DEMO_DESTINATIONS.find((d) => d.id === propertyData.destination_id) || DEMO_DESTINATIONS[0],
      host: hostUser,
      amenities: propertyData.amenities || DEMO_AMENITIES.slice(0, 3),
      units: newUnits,
    };

    memoryState.properties.unshift(newProperty);

    // Notification to Host
    memoryState.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: hostUser.id,
      title: 'Property Submitted for Review',
      message: `Your property "${newProperty.title}" was submitted. Our Rwandan inspection team will review it shortly.`,
      type: 'system',
      link: '/host',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    persist();
    return newProperty;
  },

  // HOST: ADD / REMOVE / REORDER PROPERTY PHOTOS
  updatePropertyImages(propertyId: string, images: PropertyImage[]) {
    const prop = memoryState.properties.find((p) => p.id === propertyId);
    if (!prop) return false;

    prop.images = normalisePropertyImages(propertyId, images);
    persist();
    return true;
  },

  // ADMIN: APPROVE / REJECT / SUSPEND PROPERTY (Section 11)
  updatePropertyStatus(propertyId: string, status: PropertyStatus) {
    const prop = memoryState.properties.find((p) => p.id === propertyId);
    if (!prop) return false;

    prop.status = status;

    // Notify Host
    memoryState.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: prop.host_id,
      title: status === 'approved' ? 'Listing Approved & Live!' : `Listing Status: ${status}`,
      message: status === 'approved'
        ? `Congratulations! "${prop.title}" has been verified and is now live for travellers to book.`
        : `Your listing "${prop.title}" status is now: ${status}.`,
      type: status === 'approved' ? 'property_approved' : 'property_rejected',
      link: `/properties/${prop.id}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    persist();
    return true;
  },

  // REVIEWS: ELIGIBLE GUESTS ONLY (Section 9)
  addReview(params: {
    bookingId: string;
    rating: number;
    cleanliness: number;
    accuracy: number;
    communication: number;
    location: number;
    value: number;
    comment: string;
  }): { success: boolean; error?: string } {
    const booking = memoryState.bookings.find((b) => b.id === params.bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
      return { success: false, error: 'You can only review completed stays.' };
    }

    const existingRev = memoryState.reviews.find((r) => r.booking_id === params.bookingId);
    if (existingRev) {
      return { success: false, error: 'You have already reviewed this stay.' };
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      booking_id: booking.id,
      property_id: booking.property_id,
      unit_id: booking.unit_id,
      guest_id: memoryState.currentUser.id,
      rating: params.rating,
      cleanliness_score: params.cleanliness,
      accuracy_score: params.accuracy,
      communication_score: params.communication,
      location_score: params.location,
      value_score: params.value,
      comment: params.comment,
      created_at: new Date().toISOString(),
      guest: memoryState.currentUser,
    };

    memoryState.reviews.unshift(newReview);

    // Recalculate property ratings
    const propReviews = memoryState.reviews.filter((r) => r.property_id === booking.property_id);
    const prop = memoryState.properties.find((p) => p.id === booking.property_id);
    if (prop) {
      const avg = propReviews.reduce((sum, r) => sum + r.rating, 0) / propReviews.length;
      prop.rating_average = Number(avg.toFixed(2));
      prop.review_count = propReviews.length;
    }

    // Notify Host
    if (prop) {
      memoryState.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: prop.host_id,
        title: 'New Guest Review Received',
        message: `${memoryState.currentUser.full_name} left a ${params.rating}-star review for "${prop.title}".`,
        type: 'review_received',
        link: `/properties/${prop.id}`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    persist();
    return { success: true };
  },

  toggleFavourite(propertyId: string): boolean {
    const idx = memoryState.favourites.indexOf(propertyId);
    if (idx >= 0) {
      memoryState.favourites.splice(idx, 1);
      persist();
      return false; // un-favourited
    } else {
      memoryState.favourites.push(propertyId);
      persist();
      return true; // favourited
    }
  },

  isFavourite(propertyId: string): boolean {
    return memoryState.favourites.includes(propertyId);
  },

  getNotifications(userId: string): InAppNotification[] {
    return memoryState.notifications.filter((n) => n.user_id === userId);
  },

  markNotificationRead(id: string) {
    const notif = memoryState.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      persist();
    }
  },
};

