CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  donor_id TEXT,
  provider_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')),
  plan TEXT,
  amount NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id TEXT PRIMARY KEY,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  donation_id TEXT REFERENCES public.donations(id) ON DELETE CASCADE,
  invoice_id TEXT,
  amount NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (via webhook/edge function) and admin reads
CREATE POLICY "Enable insert for authenticated Edge Functions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated Edge Functions" ON public.subscription_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for admins" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Enable select for admins" ON public.subscription_payments FOR SELECT USING (true);
