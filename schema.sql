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
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  frequency TEXT DEFAULT 'once',
  method TEXT,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
