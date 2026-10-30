-- ====================================================================
-- MEMENTO — RWANDA'S UNIVERSAL ACCOMMODATION BOOKING MARKETPLACE
-- PRODUCTION DATABASE SCHEMA & ADVANCED STORED PROCEDURES
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'traveller' CHECK (role IN ('traveller', 'host', 'admin')),
    preferred_currency TEXT DEFAULT 'RWF' CHECK (preferred_currency IN ('RWF', 'USD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. HOST PROFILES
CREATE TABLE IF NOT EXISTS public.host_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    host_type TEXT NOT NULL DEFAULT 'individual' CHECK (host_type IN ('individual', 'business')),
    business_name TEXT,
    business_registration_no TEXT,
    national_id_or_passport TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    payout_method TEXT DEFAULT 'momo' CHECK (payout_method IN ('momo', 'bank_transfer')),
    payout_details JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT NOT NULL DEFAULT 'draft' CHECK (verification_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended')),
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. RWANDAN DESTINATIONS
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    province TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. AMENITIES
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'essentials' CHECK (category IN ('essentials', 'features', 'location', 'safety', 'hospitality')),
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. UNIVERSAL PROPERTIES
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN (
        'hotel', 'apartment', 'private_room', 'entire_home', 
        'lodge', 'guesthouse', 'villa', 'hostel', 
        'homestay', 'resort', 'cottage', 'campsite', 'other'
    )),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    check_in_time TEXT NOT NULL DEFAULT '14:00',
    check_out_time TEXT NOT NULL DEFAULT '11:00',
    cancellation_policy TEXT NOT NULL DEFAULT 'flexible' CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict')),
    house_rules TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    instant_book BOOLEAN NOT NULL DEFAULT false,
    rating_average NUMERIC(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PROPERTY MEMBERSHIPS (Multiple authorized managers/staff)
CREATE TABLE IF NOT EXISTS public.property_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'receptionist')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (property_id, user_id)
);

-- 8. PROPERTY IMAGES
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. UNIVERSAL BOOKABLE UNITS
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('room', 'entire_place', 'shared', 'suite', 'cottage', 'campsite')),
    is_entire_property BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    base_price_rwf BIGINT NOT NULL CHECK (base_price_rwf >= 0),
    weekly_discount_rate NUMERIC(4, 2) DEFAULT 0.00 CHECK (weekly_discount_rate >= 0 AND weekly_discount_rate <= 1),
    monthly_discount_rate NUMERIC(4, 2) DEFAULT 0.00 CHECK (monthly_discount_rate >= 0 AND monthly_discount_rate <= 1),
    cleaning_fee_rwf BIGINT NOT NULL DEFAULT 0 CHECK (cleaning_fee_rwf >= 0),
    max_guests INT NOT NULL DEFAULT 2 CHECK (max_guests > 0),
    bedrooms INT NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    beds INT NOT NULL DEFAULT 1 CHECK (beds >= 0),
    bathrooms NUMERIC(3, 1) NOT NULL DEFAULT 1.0 CHECK (bathrooms >= 0),
    total_inventory INT NOT NULL DEFAULT 1 CHECK (total_inventory >= 1),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. UNIT IMAGES
CREATE TABLE IF NOT EXISTS public.unit_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. PROPERTY & UNIT AMENITIES
CREATE TABLE IF NOT EXISTS public.property_amenities (
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS public.unit_amenities (
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (unit_id, amenity_id)
);

-- 12. AVAILABILITY BLOCKS (Host calendar blocks, maintenance, manual holds)
CREATE TABLE IF NOT EXISTS public.availability_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL DEFAULT 'host_blocked' CHECK (reason IN ('host_blocked', 'maintenance', 'seasonal_closure')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_block_date_range CHECK (end_date > start_date)
);

-- 13. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_ref TEXT NOT NULL UNIQUE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INT NOT NULL CHECK (nights > 0),
    num_guests INT NOT NULL CHECK (num_guests > 0),
    num_units_booked INT NOT NULL DEFAULT 1 CHECK (num_units_booked >= 1),
    nightly_rate_rwf BIGINT NOT NULL CHECK (nightly_rate_rwf >= 0),
    subtotal_rwf BIGINT NOT NULL CHECK (subtotal_rwf >= 0),
    cleaning_fee_rwf BIGINT NOT NULL DEFAULT 0,
    service_fee_rwf BIGINT NOT NULL DEFAULT 0,
    discount_rwf BIGINT NOT NULL DEFAULT 0,
    total_price_rwf BIGINT NOT NULL CHECK (total_price_rwf >= 0),
    currency TEXT NOT NULL DEFAULT 'RWF',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid_at_property', 'paid_momo', 'paid_card', 'refunded')),
    payment_method TEXT NOT NULL DEFAULT 'pay_at_property' CHECK (payment_method IN ('pay_at_property', 'momo_mtn', 'momo_airtel', 'card')),
    special_requests TEXT,
    cancellation_reason TEXT,
    rejection_reason TEXT,
    host_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_booking_date_range CHECK (check_out_date > check_in_date)
);

-- 14. BOOKING GUEST DETAILS
CREATE TABLE IF NOT EXISTS public.booking_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. REVIEWS (Only for verified completed stays)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    cleanliness_score INT CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
    accuracy_score INT CHECK (accuracy_score >= 1 AND accuracy_score <= 5),
    communication_score INT CHECK (communication_score >= 1 AND communication_score <= 5),
    location_score INT CHECK (location_score >= 1 AND location_score <= 5),
    value_score INT CHECK (value_score >= 1 AND value_score <= 5),
    comment TEXT NOT NULL,
    host_response TEXT,
    host_responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. FAVOURITES
CREATE TABLE IF NOT EXISTS public.favourites (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, property_id)
);

-- 17. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'booking_request', 'booking_confirmed', 'booking_rejected', 
        'booking_cancelled', 'review_received', 'property_approved', 
        'property_rejected', 'system'
    )),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 18. HOST VERIFICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS public.host_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.host_profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'national_id', 'passport', 'business_rdb_cert', 'rdb_tourism_license', 'title_deed_or_lease'
    )),
    document_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 19. PLATFORM SETTINGS (Configurable commission & policies)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value_json JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Default platform settings
INSERT INTO public.platform_settings (key, value_json, description)
VALUES 
    ('commission_rate', '{"percentage": 8.0, "min_fee_rwf": 1000}', 'Platform service fee percentage and minimum flat fee'),
    ('supported_currencies', '["RWF", "USD"]', 'Allowed currencies in platform'),
    ('default_currency', '"RWF"', 'Primary domestic display currency'),
    ('rwf_usd_exchange_rate', '{"rate": 1380.0}', 'Reference exchange rate RWF to USD'),
    ('contact_info', '{"support_phone": "+250 788 123 456", "support_email": "support@memento.rw", "city": "Kigali, Rwanda"}', 'Customer care contact details')
ON CONFLICT (key) DO NOTHING;


-- ====================================================================
-- CORE DATABASE LOGIC & STORED PROCEDURES
-- ====================================================================

-- A. Availability Check Function (Enforces Entire-Property vs Unit Overlaps & Inventory)
CREATE OR REPLACE FUNCTION public.fn_check_unit_availability(
    p_unit_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_quantity INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_property_id UUID;
    v_is_entire_property BOOLEAN;
    v_total_inventory INT;
    v_booked_count INT;
    v_blocked_count INT;
    v_conflict_exists BOOLEAN;
BEGIN
    -- Validate date range
    IF p_check_out <= p_check_in THEN
        RETURN FALSE;
    END IF;

    -- Fetch unit information
    SELECT property_id, is_entire_property, total_inventory
    INTO v_property_id, v_is_entire_property, v_total_inventory
    FROM public.units
    WHERE id = p_unit_id AND status = 'active';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 1. Check if unit is blocked manually by host/maintenance
    SELECT COUNT(*) INTO v_blocked_count
    FROM public.availability_blocks
    WHERE unit_id = p_unit_id
      AND start_date < p_check_out
      AND end_date > p_check_in;

    IF v_blocked_count > 0 THEN
        RETURN FALSE;
    END IF;

    -- 2. HIERARCHY OVERLAP LOGIC:
    -- If this is an ENTIRE PROPERTY unit:
    IF v_is_entire_property THEN
        -- Check if ANY unit belonging to this property has an active booking or block
        SELECT EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.units u ON b.unit_id = u.id
            WHERE u.property_id = v_property_id
              AND b.status IN ('pending', 'confirmed')
              AND b.check_in_date < p_check_out
              AND b.check_out_date > p_check_in
        ) INTO v_conflict_exists;

        IF v_conflict_exists THEN
            RETURN FALSE;
        END IF;

        -- Also check if any unit in the property is blocked by host
        SELECT EXISTS (
            SELECT 1 FROM public.availability_blocks ab
            JOIN public.units u ON ab.unit_id = u.id
            WHERE u.property_id = v_property_id
              AND ab.start_date < p_check_out
              AND ab.end_date > p_check_in
        ) INTO v_conflict_exists;

        IF v_conflict_exists THEN
            RETURN FALSE;
        END IF;
    ELSE
        -- This is an INDIVIDUAL ROOM/UNIT:
        -- Check if the ENTIRE PROPERTY unit of this property is booked!
        SELECT EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.units u ON b.unit_id = u.id
            WHERE u.property_id = v_property_id
              AND u.is_entire_property = TRUE
              AND b.status IN ('pending', 'confirmed')
              AND b.check_in_date < p_check_out
              AND b.check_out_date > p_check_in
        ) INTO v_conflict_exists;

        IF v_conflict_exists THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- 3. INVENTORY CHECK FOR THIS SPECIFIC UNIT
    -- Sum of units already booked during any overlapping day in the window
    SELECT COALESCE(SUM(num_units_booked), 0)
    INTO v_booked_count
    FROM public.bookings
    WHERE unit_id = p_unit_id
      AND status IN ('pending', 'confirmed')
      AND check_in_date < p_check_out
      AND check_out_date > p_check_in;

    IF (v_booked_count + p_quantity) > v_total_inventory THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;


-- B. Transactional Booking Creation Stored Procedure
CREATE OR REPLACE FUNCTION public.fn_create_booking(
    p_property_id UUID,
    p_unit_id UUID,
    p_guest_id UUID,
    p_check_in_date DATE,
    p_check_out_date DATE,
    p_num_guests INT,
    p_num_units_booked INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'pay_at_property',
    p_special_requests TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unit RECORD;
    v_property RECORD;
    v_nights INT;
    v_nightly_rate BIGINT;
    v_subtotal BIGINT;
    v_cleaning_fee BIGINT;
    v_service_fee BIGINT;
    v_discount BIGINT := 0;
    v_total_price BIGINT;
    v_is_available BOOLEAN;
    v_booking_ref TEXT;
    v_new_booking_id UUID;
    v_status TEXT;
    v_commission_rate NUMERIC := 0.08;
BEGIN
    -- Acquire exclusive advisory lock or row-level lock on unit to eliminate concurrency race conditions
    SELECT * INTO v_unit
    FROM public.units
    WHERE id = p_unit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unit not found');
    END IF;

    -- Fetch Property
    SELECT * INTO v_property
    FROM public.properties
    WHERE id = p_property_id AND status = 'approved';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property is not available for booking');
    END IF;

    -- Validate capacity
    IF p_num_guests > (v_unit.max_guests * p_num_units_booked) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guest count exceeds maximum unit capacity');
    END IF;

    -- Validate dates
    v_nights := (p_check_out_date - p_check_in_date);
    IF v_nights <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Check-out date must be after check-in date');
    END IF;

    -- Check availability atomically
    v_is_available := public.fn_check_unit_availability(p_unit_id, p_check_in_date, p_check_out_date, p_num_units_booked);
    IF NOT v_is_available THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected dates are no longer available for this unit');
    END IF;

    -- Server-side Price Calculations (DO NOT TRUST FRONTEND)
    v_nightly_rate := v_unit.base_price_rwf;
    v_subtotal := v_nightly_rate * v_nights * p_num_units_booked;
    v_cleaning_fee := v_unit.cleaning_fee_rwf;

    -- Check weekly or monthly discount
    IF v_nights >= 28 AND v_unit.monthly_discount_rate > 0 THEN
        v_discount := ROUND(v_subtotal * v_unit.monthly_discount_rate);
    ELSIF v_nights >= 7 AND v_unit.weekly_discount_rate > 0 THEN
        v_discount := ROUND(v_subtotal * v_unit.weekly_discount_rate);
    END IF;

    -- Platform service fee calculation (8%)
    v_service_fee := ROUND((v_subtotal - v_discount) * v_commission_rate);
    v_total_price := (v_subtotal - v_discount) + v_cleaning_fee + v_service_fee;

    -- Reference Generation: MMT-YYYY-HEX
    v_booking_ref := 'MMT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Determine status: instant_book approved properties auto-confirm; otherwise pending host approval
    IF v_property.instant_book THEN
        v_status := 'confirmed';
    ELSE
        v_status := 'pending';
    END IF;

    -- Insert Booking
    INSERT INTO public.bookings (
        booking_ref, property_id, unit_id, guest_id,
        check_in_date, check_out_date, nights, num_guests, num_units_booked,
        nightly_rate_rwf, subtotal_rwf, cleaning_fee_rwf, service_fee_rwf, discount_rwf,
        total_price_rwf, currency, status, payment_status, payment_method, special_requests
    ) VALUES (
        v_booking_ref, p_property_id, p_unit_id, p_guest_id,
        p_check_in_date, p_check_out_date, v_nights, p_num_guests, p_num_units_booked,
        v_nightly_rate, v_subtotal, v_cleaning_fee, v_service_fee, v_discount,
        v_total_price, 'RWF', v_status, 'pending', p_payment_method, p_special_requests
    ) RETURNING id INTO v_new_booking_id;

    -- Send In-App Notification to Host
    INSERT INTO public.notifications (
        user_id, title, message, type, link
    ) VALUES (
        v_property.host_id,
        'New Booking Request (' || v_booking_ref || ')',
        'You have received a new booking for "' || v_property.title || '" (' || v_unit.name || ') from ' || p_check_in_date || ' to ' || p_check_out_date || '.',
        'booking_request',
        '/host/bookings/' || v_new_booking_id
    );

    -- Send In-App Notification to Guest
    INSERT INTO public.notifications (
        user_id, title, message, type, link
    ) VALUES (
        p_guest_id,
        CASE WHEN v_status = 'confirmed' THEN 'Booking Confirmed!' ELSE 'Booking Submitted!' END,
        'Your booking ' || v_booking_ref || ' for ' || v_property.title || ' is ' || v_status || '.',
        'system',
        '/dashboard/bookings/' || v_new_booking_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_new_booking_id,
        'booking_ref', v_booking_ref,
        'status', v_status,
        'total_price_rwf', v_total_price,
        'nights', v_nights
    );
END;
$$;


-- C. Trigger to Update Property Average Rating & Review Count
CREATE OR REPLACE FUNCTION public.fn_update_property_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.properties
    SET 
        rating_average = (
            SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00)
            FROM public.reviews
            WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_property_review_stats ON public.reviews;
CREATE TRIGGER trg_update_property_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.fn_update_property_review_stats();


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Destinations & Amenities (Public Read, Admin Write)
CREATE POLICY "Destinations are publicly viewable" ON public.destinations
    FOR SELECT USING (true);

CREATE POLICY "Amenities are publicly viewable" ON public.amenities
    FOR SELECT USING (true);

-- 3. Properties
CREATE POLICY "Approved properties are publicly readable" ON public.properties
    FOR SELECT USING (
        status = 'approved' OR 
        auth.uid() = host_id OR 
        EXISTS (SELECT 1 FROM public.property_memberships WHERE property_id = properties.id AND user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Hosts can create properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts and managers can update owned properties" ON public.properties
    FOR UPDATE USING (
        auth.uid() = host_id OR 
        EXISTS (SELECT 1 FROM public.property_memberships WHERE property_id = properties.id AND user_id = auth.uid() AND role IN ('owner', 'manager')) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Units & Images (Viewable if property is viewable)
CREATE POLICY "Units viewable by public if property is approved" ON public.units
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = units.property_id 
              AND (p.status = 'approved' OR p.host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Hosts can manage units" ON public.units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = units.property_id 
              AND (p.host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Property images are publicly viewable" ON public.property_images
    FOR SELECT USING (true);

CREATE POLICY "Hosts can manage property images" ON public.property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = property_images.property_id 
              AND (p.host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- 5. Bookings
CREATE POLICY "Guests and Hosts can view related bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = guest_id OR 
        EXISTS (SELECT 1 FROM public.properties p WHERE p.id = bookings.property_id AND p.host_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Guests can insert booking" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts and Admins can update booking status" ON public.bookings
    FOR UPDATE USING (
        auth.uid() = guest_id OR 
        EXISTS (SELECT 1 FROM public.properties p WHERE p.id = bookings.property_id AND p.host_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Reviews (Public read, verified guest insert)
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Eligible guests can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = guest_id AND 
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = reviews.booking_id 
              AND b.guest_id = auth.uid() 
              AND b.status = 'completed'
        )
    );

-- 7. Notifications
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Favourites
CREATE POLICY "Users manage own favourites" ON public.favourites
    FOR ALL USING (auth.uid() = user_id);

-- 9. Host Verifications (Private, Host and Admin only)
CREATE POLICY "Hosts and Admins view verification docs" ON public.host_verifications
    FOR SELECT USING (
        auth.uid() = host_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Hosts upload verification docs" ON public.host_verifications
    FOR INSERT WITH CHECK (auth.uid() = host_id);
