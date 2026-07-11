-- Phase 2 Database Migration: Supabase PostgreSQL Schema
-- Run this script in your Supabase SQL Editor

-- 1. admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. programs
CREATE TABLE IF NOT EXISTS public.programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image TEXT,
  category TEXT DEFAULT 'general',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. news
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  author TEXT,
  publish_date TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. volunteers
CREATE TABLE IF NOT EXISTS public.volunteers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interests JSONB,
  experience TEXT,
  availability TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. donations
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  amount NUMERIC CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  frequency TEXT DEFAULT 'once',
  method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'expired')),
  transaction_id TEXT,
  provider TEXT,
  provider_reference TEXT,
  provider_transaction_id TEXT,
  expected_amount NUMERIC,
  expected_currency TEXT,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  receipt_sent_at TIMESTAMPTZ,
  verification_method TEXT,
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure a provider's transaction cannot be completed twice
CREATE UNIQUE INDEX IF NOT EXISTS donations_transaction_id_unique 
  ON public.donations (transaction_id) 
  WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_provider_transaction_unique 
  ON public.donations (provider, provider_transaction_id) 
  WHERE provider_transaction_id IS NOT NULL;

-- 7. newsletters
CREATE TABLE IF NOT EXISTS public.newsletters (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. gallery
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. stories
CREATE TABLE IF NOT EXISTS public.stories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  story TEXT,
  image TEXT,
  category TEXT DEFAULT 'general',
  impact TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. team
CREATE TABLE IF NOT EXISTS public.team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  department TEXT DEFAULT 'general',
  bio TEXT,
  image TEXT,
  email TEXT,
  linkedin TEXT,
  twitter TEXT,
  "order" INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. events
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  image TEXT,
  category TEXT DEFAULT 'general',
  capacity INTEGER,
  registered INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. partners
CREATE TABLE IF NOT EXISTS public.partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  website TEXT,
  category TEXT DEFAULT 'general',
  since TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. reports
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year TEXT,
  file_url TEXT,
  description TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB,
  time_commitment TEXT,
  location TEXT,
  category TEXT DEFAULT 'general',
  open_positions INTEGER DEFAULT 1,
  benefits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. faqs
CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT,
  category TEXT DEFAULT 'general',
  "order" INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. resources
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size TEXT,
  category TEXT DEFAULT 'general',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. pages
CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rate_limits DROP CONSTRAINT IF EXISTS rate_limits_ip_action_key;
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_ip_action_key UNIQUE (ip_address, action);

-- ============================================================================
-- Security & Utility Functions
-- ============================================================================

-- Security Definer Function: Checks if the current user is an active admin
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()::text
      AND status = 'active'
      AND role IN ('admin', 'super-admin')
  );
$$;

-- RPC: Atomic Donation Completion
-- This ensures a pending donation is only completed once, verifying amounts and preventing race conditions.
CREATE OR REPLACE FUNCTION public.complete_donation_transactionally(
  p_reference_id TEXT,
  p_provider TEXT,
  p_provider_tx_id TEXT,
  p_provider_status TEXT,
  p_expected_amount NUMERIC,
  p_expected_currency TEXT,
  p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donation RECORD;
BEGIN
  -- Select the pending donation and lock it for update
  SELECT * INTO v_donation
  FROM public.donations
  WHERE transaction_id = p_reference_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Check if it's already completed
    IF EXISTS (
      SELECT 1 FROM public.donations
      WHERE transaction_id = p_reference_id AND status = 'completed'
    ) THEN
      RETURN jsonb_build_object('alreadyProcessed', true, 'success', false, 'error', 'Already processed');
    END IF;
    
    RETURN jsonb_build_object('notFound', true, 'success', false, 'error', 'Pending donation not found');
  END IF;

  -- Verify status is successful
  IF upper(p_provider_status) NOT IN (
    'SUCCESSFUL',
    'SUCCEEDED',
    'TS',
    'CHECKOUT.SESSION.COMPLETED',
    'PAYMENT_INTENT.SUCCEEDED'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Provider status is not successful');
  END IF;

  -- Verify provider
  IF v_donation.provider IS NOT NULL AND v_donation.provider != p_provider THEN
    RETURN jsonb_build_object('success', false, 'error', 'Provider mismatch');
  END IF;

  -- Verify amount and currency if provided by the webhook payload
  IF p_expected_amount IS NOT NULL AND p_expected_amount != v_donation.amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount mismatch');
  END IF;

  IF p_expected_currency IS NOT NULL AND upper(p_expected_currency) != upper(v_donation.currency) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Currency mismatch');
  END IF;

  -- Update to completed atomically
  UPDATE public.donations
  SET
    status = 'completed',
    provider_transaction_id = p_provider_tx_id,
    provider_response = p_raw_payload,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_donation.id AND status = 'pending';

  -- Return the updated donation details for sending receipts
  SELECT * INTO v_donation FROM public.donations WHERE transaction_id = p_reference_id;

  RETURN jsonb_build_object(
    'success', true,
    'donation', to_jsonb(v_donation)
  );
EXCEPTION
  WHEN unique_violation THEN
    -- If the unique constraint on (provider, provider_transaction_id) triggers
    RETURN jsonb_build_object('alreadyProcessed', true, 'success', false, 'error', 'Duplicate provider transaction ID');
END;
$$;

-- Set up Row Level Security (RLS)
-- 
-- SECURITY MODEL:
-- • Service role (used by the Edge Function) has full access to all tables.
-- • Public (anonymous) access is ONLY granted to tables with non-sensitive content.
-- • Sensitive tables (donations, contacts, volunteers, newsletters, admin_users,
--   pages, site_settings, reports) are restricted to service_role only.
--   The anon key / direct PostgREST queries CANNOT read these tables.

-- ── Enable RLS on every table ──────────────────────────────────────────────
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
    END LOOP;
END $$;

-- ── Service role: full access to everything ─────────────────────────────────
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Drop any previously created blanket policies first
        EXECUTE format('DROP POLICY IF EXISTS "Service Role Full Access" ON public.%I;', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON public.%I;', t_name);

        -- Recreate service role access
        EXECUTE format(
          'CREATE POLICY "Service Role Full Access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
          t_name
        );
    END LOOP;
END $$;

-- ── Public read: only non-sensitive tables ──────────────────────────────────
-- These tables contain content that the website displays publicly.
-- Contacts, donations, volunteers, etc. must NOT be readable via the anon key.

DO $$
DECLARE
    public_tables text[] := ARRAY[
        'programs', 'news', 'gallery', 'stories', 'team',
        'events', 'partners', 'faqs', 'resources', 'opportunities'
    ];
    t_name text;
BEGIN
    FOREACH t_name IN ARRAY public_tables LOOP
        EXECUTE format(
          'CREATE POLICY "Public Read" ON public.%I FOR SELECT TO anon USING (true);',
          t_name
        );
    END LOOP;
END $$;

-- Sensitive tables — NO public read policy created intentionally:
--   admin_users, contacts, volunteers, donations, newsletters, pages, site_settings, reports

-- ── Notes for future direct-DB queries ─────────────────────────────────────
-- If you ever want the frontend to query public tables directly via Supabase JS
-- (bypassing the Edge Function), create authenticated policies here.
-- Example for programs (authenticated users can read programs):
-- CREATE POLICY "Authenticated Read Programs" ON public.programs
--   FOR SELECT TO authenticated USING (true);


-- RPC: Atomic Receipt Claiming
CREATE OR REPLACE FUNCTION public.claim_donation_receipt(p_donation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donation RECORD;
BEGIN
  UPDATE public.donations
  SET receipt_sent_at = NOW()
  WHERE id = p_donation_id::text
    AND receipt_sent_at IS NULL
  RETURNING * INTO v_donation;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'donation', to_jsonb(v_donation));
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Receipt already claimed or donation not found');
  END IF;
END;
$$;


-- RPC: Atomic Rate Limit Increment
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_ip_address TEXT,
  p_action TEXT,
  p_reset_in_ms INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit RECORD;
BEGIN
  INSERT INTO public.rate_limits (id, ip_address, action, count, reset_at, created_at)
  VALUES (
    gen_random_uuid()::text,
    p_ip_address,
    p_action,
    1,
    NOW() + (p_reset_in_ms || ' milliseconds')::interval,
    NOW()
  )
  ON CONFLICT (ip_address, action) DO UPDATE
  SET 
    count = CASE 
      WHEN public.rate_limits.reset_at < NOW() THEN 1 
      ELSE public.rate_limits.count + 1 
    END,
    reset_at = CASE 
      WHEN public.rate_limits.reset_at < NOW() THEN NOW() + (p_reset_in_ms || ' milliseconds')::interval
      ELSE public.rate_limits.reset_at
    END
  RETURNING * INTO v_limit;

  -- Clean up expired rate limits periodically
  IF random() < 0.05 THEN
    DELETE FROM public.rate_limits WHERE reset_at < NOW();
  END IF;

  RETURN to_jsonb(v_limit);
END;
$$;
