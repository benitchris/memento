export type UserRole = 'traveller' | 'host' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: UserRole;
  preferred_currency: 'RWF' | 'USD';
  created_at?: string;
}

export type HostType = 'individual' | 'business';
export type VerificationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface HostProfile {
  id: string;
  host_type: HostType;
  business_name?: string;
  business_registration_no?: string;
  national_id_or_passport?: string;
  contact_phone?: string;
  contact_email?: string;
  payout_method: 'momo' | 'bank_transfer';
  payout_details?: Record<string, unknown>;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_at?: string;
  created_at?: string;
}

export interface Destination {
  id: string;
  name: string;
  province: string;
  description: string;
  image_url: string;
  is_popular: boolean;
  display_order: number;
}

export type AmenityCategory = 'essentials' | 'features' | 'location' | 'safety' | 'hospitality';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  icon: string;
}

export type PropertyType =
  | 'hotel'
  | 'apartment'
  | 'private_room'
  | 'entire_home'
  | 'lodge'
  | 'guesthouse'
  | 'villa'
  | 'hostel'
  | 'homestay'
  | 'resort'
  | 'cottage'
  | 'campsite'
  | 'other';

export type PropertyStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_primary: boolean;
}

export interface UnitImage {
  id: string;
  unit_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_primary: boolean;
}

export type UnitType = 'room' | 'entire_place' | 'shared' | 'suite' | 'cottage' | 'campsite';

export interface BookableUnit {
  id: string;
  property_id: string;
  name: string;
  unit_type: UnitType;
  is_entire_property: boolean;
  description?: string;
  base_price_rwf: number;
  weekly_discount_rate: number;
  monthly_discount_rate: number;
  cleaning_fee_rwf: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  total_inventory: number;
  status: 'active' | 'inactive' | 'maintenance';
  images?: UnitImage[];
  amenities?: Amenity[];
}

export interface Property {
  id: string;
  host_id: string;
  destination_id?: string;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  address: string;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: CancellationPolicy;
  house_rules?: string[];
  status: PropertyStatus;
  is_featured: boolean;
  instant_book: boolean;
  rating_average: number;
  review_count: number;
  created_at: string;
  images: PropertyImage[];
  destination?: Destination;
  units?: BookableUnit[];
  host?: UserProfile;
  amenities?: Amenity[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid_at_property' | 'paid_momo' | 'paid_card' | 'refunded';
export type PaymentMethod = 'pay_at_property' | 'momo_mtn' | 'momo_airtel' | 'card';

export interface Booking {
  id: string;
  booking_ref: string;
  property_id: string;
  unit_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  num_guests: number;
  num_units_booked: number;
  nightly_rate_rwf: number;
  subtotal_rwf: number;
  cleaning_fee_rwf: number;
  service_fee_rwf: number;
  discount_rwf: number;
  total_price_rwf: number;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  special_requests?: string;
  cancellation_reason?: string;
  rejection_reason?: string;
  created_at: string;
  property?: Property;
  unit?: BookableUnit;
  guest?: UserProfile;
}

export interface Review {
  id: string;
  booking_id: string;
  property_id: string;
  unit_id: string;
  guest_id: string;
  rating: number;
  cleanliness_score?: number;
  accuracy_score?: number;
  communication_score?: number;
  location_score?: number;
  value_score?: number;
  comment: string;
  host_response?: string;
  host_responded_at?: string;
  created_at: string;
  guest?: UserProfile;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled' | 'review_received' | 'property_approved' | 'property_rejected' | 'system';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface SearchFilters {
  destination?: string;
  propertyType?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  sortBy?: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

