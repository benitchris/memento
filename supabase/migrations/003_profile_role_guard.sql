-- ====================================================================
-- MEMENTO — Migration 003: Guard profile roles
-- Prevents a signed-in user from promoting their own profile to admin.
-- Traveller → host is still allowed (host onboarding writes it).
-- Administrators can only be granted with the service-role key / SQL.
-- Run in Supabase → SQL Editor after migration 002.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.fn_guard_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trusted operations: SQL Editor, migrations and the service-role key.
  -- Authenticated PostgREST requests always carry auth.uid().
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'admin'
     AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM 'admin') THEN
    RAISE EXCEPTION 'Only Memento administrators can grant administrator access'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_role ON public.profiles;

CREATE TRIGGER guard_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_profile_role();

-- Helper for the marketplace team: grant admin access manually in SQL Editor.
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
