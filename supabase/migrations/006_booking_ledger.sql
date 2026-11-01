-- ====================================================================
-- MEMENTO — Migration 006: Shared booking ledger
-- Every booking and every WhatsApp/call booking request is appended to
-- one investor-readable ledger. Text ids are used on purpose so bundled
-- demo listings and off-platform enquiries can live beside real rows.
-- Run in Supabase → SQL Editor after migration 005.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.booking_ledger (
    booking_ref TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    property_title TEXT NOT NULL,
    host_id TEXT,
    host_name TEXT,
    host_phone TEXT,
    guest_id TEXT,
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    city TEXT,
    unit_id TEXT,
    unit_name TEXT,
    check_in_date DATE,
    check_out_date DATE,
    nights INTEGER NOT NULL DEFAULT 0,
    num_guests INTEGER NOT NULL DEFAULT 1,
    nightly_rate_rwf INTEGER NOT NULL DEFAULT 0,
    total_price_rwf INTEGER NOT NULL DEFAULT 0,
    service_fee_rwf INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'RWF',
    channel TEXT NOT NULL DEFAULT 'platform' CHECK (channel IN (
        'platform', 'whatsapp', 'call', 'manual'
    )),
    status TEXT NOT NULL DEFAULT 'inquiry' CHECK (status IN (
        'inquiry', 'pending', 'confirmed', 'rejected', 'cancelled', 'completed'
    )),
    payment_method TEXT,
    special_requests TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS booking_ledger_created_at_idx
    ON public.booking_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS booking_ledger_host_idx
    ON public.booking_ledger (host_id);
CREATE INDEX IF NOT EXISTS booking_ledger_stay_idx
    ON public.booking_ledger (check_in_date, check_out_date);

ALTER TABLE public.booking_ledger ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.booking_ledger TO anon, authenticated;

-- Administrators see the whole ledger, hosts see their own properties and
-- guests see the requests they personally created.
DROP POLICY IF EXISTS "Ledger visible to admin, host and guest" ON public.booking_ledger;
CREATE POLICY "Ledger visible to admin, host and guest" ON public.booking_ledger
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR host_id = auth.uid()::text
        OR guest_id = auth.uid()::text
    );

-- A traveller can submit a booking or contact request without an account,
-- so lead capture is open. Rows are never a source of authority for money;
-- they are an audit trail of what the guest asked for.
DROP POLICY IF EXISTS "Anyone can record a booking request" ON public.booking_ledger;
CREATE POLICY "Anyone can record a booking request" ON public.booking_ledger
    FOR INSERT WITH CHECK (true);

-- Hosts accept/decline requests, administrators can correct any row.
DROP POLICY IF EXISTS "Admins and hosts can update ledger" ON public.booking_ledger;
CREATE POLICY "Admins and hosts can update ledger" ON public.booking_ledger
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR host_id = auth.uid()::text
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR host_id = auth.uid()::text
    );
