-- 004_tighten_financial_rls.sql
-- Tightens Row Level Security for all financial and sensitive administrative tables.

-- 1. Drop existing loose policies
DROP POLICY IF EXISTS "Enable insert for authenticated Edge Functions" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable select for admins" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated Edge Functions" ON public.subscription_payments;
DROP POLICY IF EXISTS "Enable select for admins" ON public.subscription_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated Edge Functions" ON public.payment_webhook_events;
DROP POLICY IF EXISTS "Enable select for admins" ON public.payment_webhook_events;

-- 2. Enforce strict authenticated read for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 3. Enforce strict authenticated read for Subscription Payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view subscription payments" ON public.subscription_payments
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 4. Enforce strict authenticated read for Webhook Events
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view webhook events" ON public.payment_webhook_events
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 5. Tighten Unmatched Payments
ALTER TABLE public.unmatched_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view unmatched payments" ON public.unmatched_payments;
CREATE POLICY "Admins can view unmatched payments" ON public.unmatched_payments
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 6. Ensure Donations table has strictly admin-read
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view donations" ON public.donations;
CREATE POLICY "Admins can view donations" ON public.donations
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 7. Ensure Admin Users table is protected
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 8. Create and secure audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  actor TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_active_admin());
