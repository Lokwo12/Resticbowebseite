# Resti Kiryandongo CBO — Website

A full-stack nonprofit donation website for **Resti Kiryandongo CBO**. Built with React, TypeScript, Vite, and Tailwind CSS on the frontend, and Supabase (Edge Functions + PostgreSQL + Auth) on the backend. The static frontend is hosted on Hostinger. The backend lives entirely on Supabase.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Local Development Setup](#local-development-setup)
4. [Getting Your API Credentials](#getting-your-api-credentials)
   - [Resend (Email)](#1-resend-email-service)
   - [Stripe (Card Payments)](#2-stripe-card-payments)
   - [MTN MoMo](#3-mtn-mobile-money)
   - [Airtel Money](#4-airtel-money)
   - [PayPal](#5-paypal-optional)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Supabase Setup](#supabase-setup)
7. [Setting Supabase Secrets](#setting-supabase-secrets)
8. [Deploying the Edge Function](#deploying-the-edge-function)
9. [Registering Payment Webhooks](#registering-payment-webhooks)
10. [Bootstrapping the First Admin Account](#bootstrapping-the-first-admin-account)
11. [Building & Hosting on Hostinger](#building--hosting-on-hostinger)
12. [Admin Dashboard](#admin-dashboard)
13. [Routes Reference](#routes-reference)
14. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3 |
| UI Components | Radix UI, shadcn/ui, Lucide icons, Framer Motion |
| Backend / API | Supabase Edge Function (Deno runtime, Hono framework) |
| Database | Supabase PostgreSQL (18 tables) + Supabase KV store |
| Auth | Supabase Auth (JWT) |
| Payments | Stripe, MTN MoMo, Airtel Money, PayPal, Bank Transfer |
| Email | Resend |
| Frontend hosting | Hostinger (static Apache/LiteSpeed) |
| Backend hosting | Supabase (Edge Functions + DB + Auth) |

---

## Project Structure

```
/
├── public/                     Static assets copied as-is into the build
│   ├── .htaccess               Apache SPA routing rule — required on Hostinger
│   ├── favicon.svg
│   ├── logo.png
│   └── robots.txt
├── src/
│   ├── App.tsx                 Root component with all client-side routes
│   ├── main.tsx                Entry point
│   ├── components/             All page and UI components
│   ├── hooks/                  Custom React hooks
│   └── utils/
│       └── supabase/
│           ├── client.ts       Supabase JS client instance
│           └── info.tsx        Project ID and public anon key
├── supabase/
│   ├── functions/
│   │   └── make-server-2a4be611/
│   │       ├── index.ts        Edge function — all API and admin routes
│   │       ├── kv_store.tsx    Database abstraction layer
│   │       ├── validation.ts   Input validators + HTML escaping
│   │       ├── rateLimit.ts    Per-IP rate limiter
│   │       └── webhooks.ts     Stripe/MTN/Airtel webhook handlers
│   └── migrations/
│       └── 001_storage_policies.sql   Storage bucket security policies
├── schema.sql                  Full database schema + RLS policies
├── .env                        Local environment variables (never commit)
├── .gitignore
├── vite.config.ts
├── tailwind.config.cjs
└── package.json
```

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/Lokwo12/Resticbowebseite.git
cd Resticbowebseite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your `.env` file

Copy `.env` and fill in your real values (see [Getting Your API Credentials](#getting-your-api-credentials) below):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
VITE_PAYPAL_MERCHANT_EMAIL=donate@resti.org
```

> `.env` is in `.gitignore` — it is never committed to Git. Production secrets go in the **Supabase Dashboard**, not this file.

### 4. Start the development server

```bash
npm run dev
```

The site runs at **http://localhost:5173**.

---

## Getting Your API Credentials

You need accounts with four services before going live. Work through them in this order.

---

### 1. Resend (Email Service)

Resend sends donation receipts, contact form confirmations, and admin notifications.  
**It is free to sign up and free up to 3,000 emails/month.**

#### Step 1 — Create account
1. Go to **[resend.com](https://resend.com)** → click **Sign Up**
2. Verify your email address

#### Step 2 — Get your API key
1. In the left sidebar → click **API Keys**
2. Click **Create API Key**
3. Name it `RESTI Production` → click **Create**
4. **Copy the key immediately** — it starts with `re_` and is only shown once
5. This is your `RESEND_API_KEY`

#### Step 3 — Verify your domain (required to send from @resti.org)
1. In the left sidebar → click **Domains** → **Add Domain**
2. Enter `resti.org`
3. Resend will show you DNS records to add (TXT + MX records)
4. Log in to your domain registrar (Namecheap, GoDaddy, etc.) and add those records
5. Back in Resend → click **Verify** (takes 10–60 minutes)
6. Once verified, set:
   - `ADMIN_EMAIL` = `Resti Kiryandongo CBO <noreply@resti.org>`

> **No domain yet?** Leave `ADMIN_EMAIL` as the default. Resend's sandbox sender (`onboarding@resend.dev`) works for testing.

---

### 2. Stripe (Card Payments)

Stripe processes international card donations. Free to set up — they charge 1.5%–2.9% + fixed fee per transaction.

#### Step 1 — Create account
1. Go to **[stripe.com](https://stripe.com)** → click **Start now**
2. Fill in your details:
   - **Business type**: Non-profit / Sole trader / Other
   - **Country**: Uganda
   - **Business name**: Resti Kiryandongo CBO
3. Verify your email

#### Step 2 — Get your API keys
1. In the Stripe Dashboard → click **Developers** (top right)
2. Click **API Keys**
3. Copy the **Publishable key** (starts with `pk_test_` for testing, `pk_live_` for production)
   - This is `VITE_STRIPE_PUBLISHABLE_KEY`
4. Click **Reveal** on the **Secret key** (starts with `sk_test_` / `sk_live_`)
   - This is `STRIPE_SECRET_KEY`

#### Step 3 — Create a webhook
1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-2a4be611/webhooks/stripe
   ```
4. Under **Events to listen to**, select:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
5. Click **Add endpoint**
6. Click on the new endpoint row → find **Signing secret** → click **Reveal** → copy it
   - This is `STRIPE_WEBHOOK_SECRET`

#### Step 4 — Activate your account (to accept real money)
- Stripe requires bank account details before live payments work
- Go to **Settings** → **Business settings** → add your CBO bank account details
- This usually takes 1–2 business days to verify

> **Testing Stripe without a real card:** Use test card number `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC.

---

### 3. MTN Mobile Money

MTN MoMo allows Ugandans to donate directly from their MTN mobile wallet.

#### Step 1 — Create developer account
1. Go to **[momodeveloper.mtn.com](https://momodeveloper.mtn.com)**
2. Click **Sign Up** in the top right
3. Fill in your name and email → verify your email

#### Step 2 — Subscribe to Collections API
1. After signing in → click **Products** in the navigation
2. Find **Collections** → click **Subscribe**
3. On the next page → click **Subscribe** again to confirm
4. You will now see your **Subscription Key** (Primary Key)
   - This is `MTN_MOMO_SUBSCRIPTION_KEY`

#### Step 3 — Create sandbox API user and key
1. Click your profile/username in the top right → **Profile**
2. Scroll down to find your Subscription Key under **Collections**
3. Now go back to the **Collections** product page
4. Click the **Sandbox** tab
5. In the **Sandbox User Provisioning** section:
   - Enter the Sandbox Base URL: `https://sandbox.momodeveloper.mtn.com`
   - Click **Create API User**
   - Copy the UUID shown — this is `MTN_MOMO_API_USER`
6. Copy the User ID you just created → click **Create API Key**
   - Copy the key shown — this is `MTN_MOMO_API_KEY`

#### Step 4 — Go live (for real donations)
- Contact **MTN Uganda Business** directly to apply for production access
- They will need your CBO registration certificate and bank details
- Once approved, change `MTN_MOMO_ENVIRONMENT` from `sandbox` → `production`
- Register your webhook URL with them:
  ```
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-2a4be611/webhooks/mtn
  ```

> **Sandbox testing:** In sandbox mode, no real money moves. MTN provides test phone numbers and simulated payment responses.

---

### 4. Airtel Money

Airtel Money allows Airtel Uganda subscribers to donate from their mobile wallet.

#### Step 1 — Create developer account
1. Go to **[developers.airtel.africa](https://developers.airtel.africa)**
2. Click **Sign Up**
3. Fill in your details and verify your email

#### Step 2 — Create an application
1. After signing in → click **My Apps** → **Create App**
2. Name it `RESTI Donation`
3. Select **Merchant Payments** or **Collections** API
4. Once created, click on the app to view:
   - **Client ID** → this is `AIRTEL_CLIENT_ID`
   - **Client Secret** → click Reveal → this is `AIRTEL_CLIENT_SECRET`
5. Set `AIRTEL_COUNTRY=UG`

#### Step 3 — Go live (for real donations)
- Contact **Airtel Uganda** business team to apply for production credentials
- They need your CBO registration documents and bank account
- Once approved, change `AIRTEL_ENVIRONMENT` from `sandbox` → `production`
- Register your webhook URL:
  ```
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-2a4be611/webhooks/airtel
  ```

---

### 5. PayPal (Optional)

PayPal is an additional payment option for international donors.

1. Go to **[developer.paypal.com](https://developer.paypal.com)**
2. Sign in with your PayPal business account
3. Click **My Apps & Credentials**
4. Under **REST API apps** → click **Create App**
5. Name it `RESTI Website` → click **Create App**
6. Copy the **Client ID** → this is `VITE_PAYPAL_CLIENT_ID`

> Use the **Sandbox** Client ID for testing, **Live** Client ID for production.

---

## Environment Variables Reference

### Frontend variables (safe for browser, prefix `VITE_`)

Set these in your local `.env` file. They are embedded in the compiled JavaScript at build time.

| Variable | Description |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...` or `pk_live_...`) |
| `VITE_PAYPAL_CLIENT_ID` | PayPal REST API client ID |
| `VITE_PAYPAL_MERCHANT_EMAIL` | Your PayPal business email |

### Server-side secrets (NEVER put in `.env` for production)

Set these in the **Supabase Dashboard → Edge Function → Secrets**. See next section.

| Variable | Description | Required? |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) | Yes if using card payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | Yes for auto-confirming donations |
| `MTN_MOMO_API_USER` | MTN API user UUID | Yes if using MTN |
| `MTN_MOMO_API_KEY` | MTN API key | Yes if using MTN |
| `MTN_MOMO_SUBSCRIPTION_KEY` | MTN Collections subscription key | Yes if using MTN |
| `MTN_MOMO_ENVIRONMENT` | `sandbox` or `production` | Yes if using MTN |
| `MTN_CURRENCY` | `UGX` (or your currency code) | Yes if using MTN |
| `AIRTEL_CLIENT_ID` | Airtel API client ID | Yes if using Airtel |
| `AIRTEL_CLIENT_SECRET` | Airtel API client secret | Yes if using Airtel |
| `AIRTEL_ENVIRONMENT` | `sandbox` or `production` | Yes if using Airtel |
| `AIRTEL_COUNTRY` | `UG` | Yes if using Airtel |
| `AIRTEL_CURRENCY` | `UGX` | Yes if using Airtel |
| `RESEND_API_KEY` | Resend email API key (`re_...`) | Yes (for all emails) |
| `ADMIN_EMAIL` | Sender address for outgoing emails | Yes |
| `ADMIN_NOTIFY_EMAIL` | Admin inbox for notifications | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | Yes |
| `ADMIN_REGISTRATION_OPEN` | `true` = allow signup, `false` = block signup | Yes — set to `false` in production |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are **automatically injected** by Supabase. You do not need to set these yourself.

---

## Supabase Setup

### Step 1 — Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** → sign in → click **New project**
2. Enter your project details and a strong database password
3. Wait ~2 minutes for the project to be ready
4. Note your **Project ID** from the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

### Step 2 — Add your project credentials to the codebase

Edit `src/utils/supabase/info.tsx`:

```ts
export const projectId = "YOUR_PROJECT_ID"
export const publicAnonKey = "eyJ..."  // Project Settings → API → anon public key
```

### Step 3 — Apply the database schema

1. In the Supabase Dashboard → **SQL Editor**
2. Open `schema.sql` from the project root → copy all contents → paste → click **Run**

This creates 18 tables (`programs`, `news`, `contacts`, `donations`, etc.) with proper Row Level Security policies.

### Step 4 — Apply the storage policies

1. In the Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/001_storage_policies.sql` → copy all contents → paste → click **Run**

This creates two secure storage buckets:
- `public-assets` — website images (public read, admin write only)
- `private-documents` — reports, receipts (admin only, no public access)

---

## Setting Supabase Secrets

### Method A — Supabase Dashboard (Easiest)

1. Go to **[supabase.com](https://supabase.com)** → open your project
2. In the left sidebar → click **Edge Functions**
3. Click **`make-server-2a4be611`**
4. Click the **Secrets** tab
5. Click **Add new secret** for each one:

| Secret Name | Example Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_abc123...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_abc123...` |
| `MTN_MOMO_API_USER` | `fe495637-c688-...` |
| `MTN_MOMO_API_KEY` | `c5cfd305d399...` |
| `MTN_MOMO_SUBSCRIPTION_KEY` | `fa9bcaea9dd3...` |
| `MTN_MOMO_ENVIRONMENT` | `production` |
| `MTN_CURRENCY` | `UGX` |
| `AIRTEL_CLIENT_ID` | `your_client_id` |
| `AIRTEL_CLIENT_SECRET` | `your_secret` |
| `AIRTEL_ENVIRONMENT` | `production` |
| `AIRTEL_COUNTRY` | `UG` |
| `AIRTEL_CURRENCY` | `UGX` |
| `RESEND_API_KEY` | `re_abc123...` |
| `ADMIN_EMAIL` | `Resti Kiryandongo CBO <noreply@resti.org>` |
| `ADMIN_NOTIFY_EMAIL` | `admin@resti.org` |
| `ALLOWED_ORIGINS` | `https://resti.org,https://www.resti.org` |
| `ADMIN_REGISTRATION_OPEN` | `false` |

6. After adding all secrets → click **Redeploy** on the same page

### Method B — Supabase CLI (PowerShell)

```powershell
# 1. Install the CLI (if not already installed)
npm install -g supabase

# 2. Log in
supabase login

# 3. Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# 4. Set each secret
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set MTN_MOMO_API_USER=your-uuid
supabase secrets set MTN_MOMO_API_KEY=your-key
supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=your-sub-key
supabase secrets set MTN_MOMO_ENVIRONMENT=production
supabase secrets set MTN_CURRENCY=UGX
supabase secrets set AIRTEL_CLIENT_ID=your-client-id
supabase secrets set AIRTEL_CLIENT_SECRET=your-secret
supabase secrets set AIRTEL_ENVIRONMENT=production
supabase secrets set AIRTEL_COUNTRY=UG
supabase secrets set AIRTEL_CURRENCY=UGX
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set ADMIN_EMAIL="Resti Kiryandongo CBO <noreply@resti.org>"
supabase secrets set ADMIN_NOTIFY_EMAIL=admin@resti.org
supabase secrets set "ALLOWED_ORIGINS=https://resti.org,https://www.resti.org"
supabase secrets set ADMIN_REGISTRATION_OPEN=false

# 5. Verify all secrets are saved
supabase secrets list
```

> **Find your Project ID**: Supabase Dashboard → Project Settings → General → Reference ID

---

## Deploying the Edge Function

```powershell
# Install Supabase CLI globally
npm install -g supabase

# Log in (opens browser)
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy make-server-2a4be611
```

**After any code changes** to `index.ts`, `webhooks.ts`, `validation.ts`, or `rateLimit.ts`, redeploy:

```powershell
supabase functions deploy make-server-2a4be611
```

---

## Registering Payment Webhooks

After deploying, register your webhook URL with each payment provider.

Your webhook base URL is:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-2a4be611
```

| Provider | Webhook URL | Events |
|---|---|---|
| Stripe | `.../webhooks/stripe` | `checkout.session.completed`, `payment_intent.succeeded`, `invoice.payment_succeeded` |
| MTN MoMo | `.../webhooks/mtn` | Payment status callbacks |
| Airtel | `.../webhooks/airtel` | Payment status callbacks |

**Stripe webhook setup** (most important):
1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. Paste the Stripe webhook URL above
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, and `invoice.payment_succeeded`
4. Copy the **Signing secret** → save as `STRIPE_WEBHOOK_SECRET` in Supabase Secrets

---

## Bootstrapping the First Admin Account

> **IMPORTANT:** The admin registration endpoint is closed by default (`ADMIN_REGISTRATION_OPEN=false`). Follow these steps carefully.

### Step 1 — Temporarily open registration
In Supabase Dashboard → Edge Functions → Secrets:
- Change `ADMIN_REGISTRATION_OPEN` from `false` to **`true`**
- Click **Redeploy**

### Step 2 — Create the first admin account
1. Go to `https://yourdomain.com/admin` (or wherever your admin login page is)
2. Click **Create Account / Sign Up**
3. Enter your email and a **strong password** (minimum 12 characters)
4. Submit the form

### Step 3 — Promote to super-admin
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your new user → click the three dots → **Edit User**
3. In the **User Metadata** field, set:
   ```json
   { "role": "super-admin", "name": "Your Name" }
   ```
4. Click **Save**

### Step 4 — Close registration immediately
In Supabase Dashboard → Edge Functions → Secrets:
- Change `ADMIN_REGISTRATION_OPEN` back to **`false`**
- Click **Redeploy**

> From now on, all new admin accounts are created and managed from within the Admin Dashboard by the super-admin.

---

## Building & Hosting on Hostinger

### Build the frontend

```bash
npm run build
```

This generates a `build/` folder.

### Upload to Hostinger

1. Log in to **[hpanel.hostinger.com](https://hpanel.hostinger.com)**
2. Click **File Manager** → open `public_html`
3. Delete any default placeholder files (e.g. `index.php`, `default.php`)
4. Upload the **contents** of `build/` directly into `public_html/` — not the folder itself
5. Make sure `.htaccess` is present inside `public_html/` (it is a hidden file, starts with a dot)

> **Tip:** ZIP the contents of `build/`, upload the ZIP to `public_html/`, use File Manager's **Extract** option, then delete the ZIP.

### Enable SSL
In hPanel → **Security** → **SSL** → enable the free certificate for your domain.

### After code changes
Rebuild and re-upload. If you don't see changes:  
hPanel → **Advanced** → **Cache Manager** → **Purge All**

---

## Admin Dashboard

The admin dashboard is at:
```
https://yourdomain.com/admin
```

### Roles

| Role | Access |
|---|---|
| `super-admin` | Full access — users, settings, all content |
| `admin` | All content management, no user/role management |
| `editor` | Content editing only — must be activated by admin |

### What you can manage

| Tab | What you can edit |
|---|---|
| Overview | Site stats, recent activity |
| Programs | Add / edit / delete program listings |
| News | News articles with images |
| Gallery | Photo gallery |
| Team | Staff and team profiles |
| Stories | Impact stories |
| Impact | Map markers, statistics |
| Reports | Annual reports |
| Events | Upcoming and past events |
| Partners | Partner listings |
| Opportunities | Volunteer opportunity listings |
| FAQs | Frequently asked questions |
| Resources | Downloadable documents |
| Pages | Custom CMS pages at `/pages/:slug` |
| Contacts | Contact form submissions |
| Volunteers | Volunteer applications |
| Donations | Donor records (pending + completed) |
| Subscribers | Newsletter subscribers |
| Settings | Hero text, About, contact details, footer, social links, bank details |

---

## Routes Reference

| URL | Page |
|---|---|
| `/` | Homepage |
| `/about` | About page |
| `/news` | News archive |
| `/news/:id` | Individual news article |
| `/stories` | Stories archive |
| `/programs/:id` | Program detail |
| `/team` | Full team page |
| `/reports` | Impact reports |
| `/volunteer` | Volunteer signup |
| `/faqs` | FAQs |
| `/partners` | Partners |
| `/opportunities` | Volunteer opportunities |
| `/donate` | Donation page |
| `/contact` | Contact page |
| `/pages/:slug` | Custom CMS pages |
| `/admin` | Admin dashboard |

---

## Troubleshooting

**Card payment form not showing**  
`VITE_STRIPE_PUBLISHABLE_KEY` must start with `pk_test_` or `pk_live_`. Rebuild after setting the real key.

**"Administrator registration is currently closed"**  
Set `ADMIN_REGISTRATION_OPEN=true` in Supabase Secrets → Redeploy → register → set back to `false` → Redeploy.

**"Unauthorized" on admin actions**  
Your JWT token may have expired. Log out and log back in to the admin dashboard.

**Mobile money payment stuck on pending**  
The MTN/Airtel webhook URL is not registered with the provider, or `MTN_MOMO_ENVIRONMENT` is still `sandbox` while using production credentials. Check Supabase Edge Function logs.

**Stripe webhook "Invalid signature" error**  
`STRIPE_WEBHOOK_SECRET` in Supabase Secrets does not match the signing secret shown in the Stripe Dashboard for that webhook endpoint.

**Routes return 404 on Hostinger**  
`.htaccess` is missing from `public_html/` or is in the wrong location.

**Changes not visible after re-upload**  
hPanel → **Advanced** → **Cache Manager** → **Purge All**

**Edge Function errors**  
Supabase Dashboard → **Edge Functions** → `make-server-2a4be611` → **Logs** tab.

**`git push` fails with "file too large"**  
Remove the old CLI binary if it was tracked:
```bash
git rm --cached supabase-cli/supabase.exe
git commit -m "remove large binary"
```

---

## Security Notes

- **Never commit `.env`** — it is in `.gitignore`
- **Never put secret keys** (`sk_`, `whsec_`, `re_`, MTN/Airtel keys) in `.env` for production — use Supabase Dashboard Secrets only
- **`ADMIN_REGISTRATION_OPEN` must be `false`** in production at all times except during initial bootstrap
- The admin JWT is verified server-side on every request — no client-side trust
- All public form inputs are HTML-escaped before appearing in emails
- Donations are only marked `completed` after webhook or polling confirmation — never by the browser

---
### Authoritative Webhook Events

RESTI relies on specific Stripe webhook events depending on the donation flow to prevent duplicate processing and guarantee idempotency:
- **One-time Checkout donations**: `checkout.session.completed` is the authoritative event. Any corresponding `payment_intent.succeeded` events generated by the Checkout Session are ignored.
- **Direct PaymentIntent donations (Custom UI)**: `payment_intent.succeeded` is the authoritative event.
- **Recurring subscription renewals**: `invoice.payment_succeeded` is the authoritative event.
