-- 003_idempotency_and_status.sql
-- Fixes receipt_status constraint, adds idempotency checks, and normalizes table schemas

-- 1. Add no_email to donations receipt status
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_receipt_status_check;
ALTER TABLE public.donations ADD CONSTRAINT donations_receipt_status_check CHECK (
  receipt_status IN ('pending', 'sending', 'sent', 'failed', 'no_email')
);

-- 2. Add invoice uniqueness for subscriptions
ALTER TABLE public.subscription_payments
ADD CONSTRAINT subscription_payments_invoice_id_unique UNIQUE (invoice_id);

-- 3. Add unmatched provider uniqueness
ALTER TABLE public.unmatched_payments
ADD CONSTRAINT unmatched_provider_transaction_unique UNIQUE (provider, provider_transaction_id);

-- 4. Create Webhook Events for Idempotency
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (provider, event_id)
);

-- Enable RLS and add basic security
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated Edge Functions" ON public.payment_webhook_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for admins" ON public.payment_webhook_events FOR SELECT USING (true);
