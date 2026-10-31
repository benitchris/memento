-- ====================================================================
-- MEMENTO — Migration 005: Share review decisions for bundled listings
-- New host submissions live in public.properties, so approving them is
-- already visible to every traveller. The demo/showcase catalogue that
-- ships with the app does not live in the database, so its review
-- decisions are stored here instead.
-- Run in Supabase → SQL Editor after migration 004.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.listing_publications (
    property_id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended'
    )),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.listing_publications ENABLE ROW LEVEL SECURITY;

-- Everyone can read decisions so travellers see the same marketplace.
DROP POLICY IF EXISTS "Listing publications are publicly readable" ON public.listing_publications;
CREATE POLICY "Listing publications are publicly readable" ON public.listing_publications
    FOR SELECT USING (true);

-- Only administrators may publish or change a decision.
DROP POLICY IF EXISTS "Admins can publish listing decisions" ON public.listing_publications;
CREATE POLICY "Admins can publish listing decisions" ON public.listing_publications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
