import { MockStore } from './mock-store';
import { SearchFilters, Property, Booking, Review, BookableUnit, PropertyStatus } from '@/lib/types';

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('your-project-ref') && url.startsWith('http'));
};

export const MementoService = {
  isConfigured: isSupabaseConfigured,

  // Properties & Discovery
  async getProperties(filters?: SearchFilters, hostId?: string): Promise<Property[]> {
    return MockStore.getProperties(filters, hostId);
  },

  async getPropertyById(id: string): Promise<Property | undefined> {
    return MockStore.getPropertyById(id);
  },

  async getDestinations() {
    return MockStore.getDestinations();
  },

  async getAmenities() {
    return MockStore.getAmenities();
  },

  // Booking & Availability
  checkUnitAvailability(unitId: string, checkIn: string, checkOut: string, quantity: number = 1) {
    return MockStore.checkUnitAvailability(unitId, checkIn, checkOut, quantity);
  },

  async createBooking(params: {
    propertyId: string;
    unitId: string;
    checkInDate: string;
    checkOutDate: string;
    numGuests: number;
    numUnitsBooked?: number;
    paymentMethod?: 'pay_at_property' | 'momo_mtn' | 'momo_airtel' | 'card';
    specialRequests?: string;
  }) {
    return MockStore.createBooking(params);
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: 'confirmed' | 'rejected' | 'cancelled' | 'completed',
    reason?: string
  ) {
    return MockStore.updateBookingStatus(bookingId, newStatus, reason);
  },

  // Host Operations
  async createProperty(propertyData: Partial<Property>, units: Partial<BookableUnit>[]) {
    return MockStore.createProperty(propertyData, units);
  },

  // Admin Operations
  async updatePropertyStatus(propertyId: string, status: PropertyStatus) {
    return MockStore.updatePropertyStatus(propertyId, status);
  },

  // Reviews
  async addReview(params: {
    bookingId: string;
    rating: number;
    cleanliness: number;
    accuracy: number;
    communication: number;
    location: number;
    value: number;
    comment: string;
  }) {
    return MockStore.addReview(params);
  },

  // Favourites
  toggleFavourite(propertyId: string) {
    return MockStore.toggleFavourite(propertyId);
  },

  isFavourite(propertyId: string) {
    return MockStore.isFavourite(propertyId);
  },
};
