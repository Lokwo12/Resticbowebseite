-- 007_donor_portal_rls.sql
-- Tightens Row Level Security policies to permit authenticated donors to read their own donations and subscriptions,
-- while ensuring administrators maintain platform-wide oversight.

-- 1. Ensure RLS is enabled on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Drop existing donor select policy if present
DROP POLICY IF EXISTS "Donors can view their own donations" ON public.donations;

-- Allow authenticated users to view donations matching their authenticated email or if they are an active admin
CREATE POLICY "Donors can view their own donations" ON public.donations
  FOR SELECT TO authenticated
  USING (
    LOWER(email) = LOWER(auth.jwt() ->> 'email')
    OR public.is_active_admin()
  );

-- 2. Ensure RLS is enabled on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing donor select policy if present
DROP POLICY IF EXISTS "Donors can view their own subscriptions" ON public.subscriptions;

-- Allow authenticated users to view subscriptions where donor_id matches their auth UID,
-- or if they are an active admin
CREATE POLICY "Donors can view their own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    donor_id = auth.uid()::text
    OR public.is_active_admin()
  );
