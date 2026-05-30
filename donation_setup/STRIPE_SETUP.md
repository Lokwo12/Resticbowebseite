# Stripe Card Payment Setup Guide

## Overview

The donation modal uses **Stripe Elements** (`@stripe/react-stripe-js`) for card payments. The `CardElement` is a PCI-compliant hosted card field — card data never touches your server. The success screen only appears after Stripe confirms `paymentIntent.status === 'succeeded'`.

Payment flow:
1. User fills in billing details and card number
2. Frontend calls your Supabase edge function to create a **PaymentIntent**
3. Frontend calls `stripe.confirmCardPayment(clientSecret)` — Stripe processes the card
4. `setDone(true)` fires **only** on confirmed success

---

## Step 1 — Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete account activation (required to receive live payments)
3. Navigate to your [Stripe Dashboard](https://dashboard.stripe.com)

---

## Step 2 — Get Your API Keys

1. In the Stripe Dashboard, go to **Developers → API Keys**
2. Copy:
   - **Publishable key** — starts with `pk_live_...` (safe to expose in frontend)
   - **Secret key** — starts with `sk_live_...` (never expose publicly)

> **For testing first:** Use the **Test mode** toggle. Keys start with `pk_test_...` / `sk_test_...`. No real money moves in Test mode.

---

## Step 3 — Add the Publishable Key to the Project

Create or edit the `.env` file in the project root (same folder as `package.json`):

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
```

> The `.env` file is already excluded from Git via `.gitignore`. Never commit your keys to a public repository.

Restart the dev server after editing `.env`:
```bash
npm run dev
```

---

## Step 4 — Add the Secret Key to Supabase

The secret key stays on the server (Supabase Edge Function). **Never put it in `.env` or frontend code.**

1. Go to your [Supabase project dashboard](https://supabase.com/dashboard)
2. Navigate to **Edge Functions → Secrets**
3. Add a new secret:
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_live_YOUR_SECRET_KEY_HERE`
4. Redeploy the edge function:
   ```bash
   supabase functions deploy make-server-2a4be611
   ```

---

## Step 5 — Verify the Integration

1. Run `npm run dev`
2. Open the donation modal and select **Card**
3. The Stripe card field will render (single combined field for card number, expiry, CVC)
4. Use a **Stripe test card** to complete a payment:

   | Card Number | Result |
   |-------------|--------|
   | `4242 4242 4242 4242` | Success |
   | `4000 0000 0000 0002` | Card declined |
   | `4000 0025 0000 3155` | Requires 3D Secure |

   Use any future expiry date (e.g. `12/29`) and any 3-digit CVC.

5. After payment, the modal should show the **success page**
6. Check your [Stripe Test Dashboard](https://dashboard.stripe.com/test/payments) to confirm the payment appears

---

## Step 6 — Go Live

1. Replace the test publishable key in `.env` with the **Live publishable key** (`pk_live_...`)
2. Replace the test secret key in Supabase Secrets with the **Live secret key** (`sk_live_...`)
3. Redeploy the edge function and restart the dev server / redeploy the frontend
4. Live payments will now be processed through Stripe

---

## Where the Code Lives

| File | What it does |
|------|-------------|
| `src/components/DonationModal.tsx` | `StripeCardForm` component, `CardElement`, PaymentIntent fetch, `confirmCardPayment` |
| `supabase/functions/make-server-2a4be611/index.ts` | `POST /create-payment-intent` — creates PaymentIntent with secret key |
| `.env` | Holds `VITE_STRIPE_PUBLISHABLE_KEY` |
| `package.json` | `@stripe/react-stripe-js`, `@stripe/stripe-js` dependencies |

---

## Fees

Stripe charges **2.9% + $0.30 per successful card charge** (standard rate). For registered nonprofits, Stripe offers a discounted rate of **2.2% + $0.30** — apply at [stripe.com/nonprofits](https://stripe.com/nonprofits).
