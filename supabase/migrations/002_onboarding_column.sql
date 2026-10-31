-- ====================================================================
-- MEMENTO — Migration 002: Add onboarding_complete to profiles
-- Run this in Supabase → SQL Editor
-- ====================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Mark existing profiles as already onboarded so they don't see the modal
UPDATE profiles SET onboarding_complete = true WHERE onboarding_complete = false;

