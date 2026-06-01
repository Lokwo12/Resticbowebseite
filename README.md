# Resti Kiryandongo Refugee Settlement — Website

A full-stack nonprofit website for **Resti Kiryandongo CBO**. Built with React, TypeScript, Vite, and Tailwind CSS on the frontend, and Supabase (Edge Functions + PostgreSQL + Auth) on the backend. The static frontend is hosted on Hostinger. The backend lives entirely on Supabase.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Local Development Setup](#local-development-setup)
5. [Environment Variables](#environment-variables)
6. [Supabase Setup](#supabase-setup)
7. [Deploying the Edge Function](#deploying-the-edge-function)
8. [Payment Integrations](#payment-integrations)
9. [Building for Production](#building-for-production)
10. [Hosting on Hostinger](#hosting-on-hostinger)
11. [Admin Dashboard](#admin-dashboard)
12. [Routes Reference](#routes-reference)
13. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3 |
| UI Components | Radix UI, shadcn/ui, Lucide icons, Framer Motion |
| Backend / API | Supabase Edge Function (Deno runtime, Hono framework) |
| Database | Supabase PostgreSQL (18 tables) |
| Auth | Supabase Auth |
| Payments | Stripe, PayPal, MTN MoMo, Airtel, Bank Transfer |
| Frontend hosting | Hostinger (static Apache hosting) |
| Backend hosting | Supabase (Edge Functions + DB + Auth) |

---

## Prerequisites

Install the following before starting:

- **Node.js** v18 or higher — https://nodejs.org
- **npm** v9 or higher (bundled with Node)
- A **Supabase** account — https://supabase.com (free tier works)
- A **Hostinger** account with an active hosting plan

---

## Project Structure

```
/
├── public/                   Static assets copied as-is into the build
│   ├── .htaccess             Apache SPA routing rule — required on Hostinger
│   ├── favicon.svg
│   ├── logo.png
│   └── robots.txt
├── src/
│   ├── App.tsx               Root component with all client-side routes
│   ├── main.tsx              Entry point
│   ├── components/           All page and UI components
│   ├── hooks/                Custom React hooks
│   └── utils/
│       └── supabase/
│           ├── client.ts     Supabase JS client instance
│           └── info.tsx      Project ID and public anon key
├── supabase/
│   └── functions/
│       └── make-server-2a4be611/
│           ├── index.ts      Edge function — all API and admin routes
│           └── kv_store.tsx  Database abstraction layer (maps keys to SQL tables)
├── supabase-cli/
│   └── supabase.exe          Supabase CLI binary for Windows
├── schema.sql                Full database schema — run once in Supabase SQL Editor
├── .env                      Local environment variables (never commit this file)
├── .gitignore
├── vite.config.ts
├── tailwind.config.js
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

Create a file named `.env` in the project root with the following content.  
Fill in your real values — see [Environment Variables](#environment-variables) for where to get each one.

```env
# PayPal — https://developer.paypal.com → My Apps & Credentials
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
VITE_PAYPAL_MERCHANT_EMAIL=donate@resticbo.org

# Stripe — https://dashboard.stripe.com/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# MTN Mobile Money — https://momodeveloper.mtn.com
MTN_MOMO_API_USER=your_mtn_api_user_uuid
MTN_MOMO_API_KEY=your_mtn_api_key
MTN_MOMO_SUBSCRIPTION_KEY=your_mtn_subscription_key
MTN_MOMO_ENVIRONMENT=sandbox
```

> `.env` is listed in `.gitignore` and will never be committed to git.

### 4. Start the development server

```bash
npm run dev
```

The site runs at **http://localhost:5173**.

---

## Environment Variables

### Frontend variables (prefix `VITE_`)

These are embedded into the compiled JavaScript at build time. They are visible in the browser — only put **public/publishable** keys here.

| Variable | Description | Where to get it |
|---|---|---|
| `VITE_PAYPAL_CLIENT_ID` | PayPal app client ID | PayPal Developer Dashboard → My Apps → App → Client ID |
| `VITE_PAYPAL_MERCHANT_EMAIL` | Your PayPal business email | Your PayPal business account |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (starts with `pk_`) | Stripe Dashboard → Developers → API Keys |

### Server-side variables (Edge Function secrets)

These are **never** sent to the browser. They must be configured in the Supabase Dashboard as Edge Function secrets (see [Deploying the Edge Function](#deploying-the-edge-function)).

| Variable | Description | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (starts with `sk_`) | Stripe Dashboard → Developers → API Keys |
| `MTN_MOMO_API_USER` | MTN API user UUID | MTN MoMo Developer Portal |
| `MTN_MOMO_API_KEY` | MTN API key | MTN MoMo Developer Portal |
| `MTN_MOMO_SUBSCRIPTION_KEY` | MTN Collections product subscription key | MTN MoMo Developer Portal |
| `MTN_MOMO_ENVIRONMENT` | `sandbox` for testing, `production` for live | — |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are **automatically injected** by Supabase into every Edge Function. You do not need to set these.

---

## Supabase Setup

### Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign in.
2. Click **New project** and fill in the details.
3. After creation, note your **Project ID** from the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`.

### Step 2 — Add your project credentials to the codebase

Edit `src/utils/supabase/info.tsx`:

```ts
export const projectId = "YOUR_PROJECT_ID"
export const publicAnonKey = "eyJ..."  // Project Settings → API → anon public key
```

### Step 3 — Apply the database schema

1. In the Supabase Dashboard, go to **SQL Editor**.
2. Open `schema.sql` from the project root, copy its entire contents, paste into the SQL Editor, and click **Run**.

This creates all 18 tables required by the site:

| Table | Purpose |
|---|---|
| `admin_users` | Admin accounts and roles |
| `programs` | Programs/services listings |
| `news` | News articles |
| `contacts` | Contact form submissions |
| `volunteers` | Volunteer applications |
| `donations` | Donation records |
| `newsletters` | Newsletter subscribers |
| `gallery` | Photo gallery images |
| `stories` | Impact stories |
| `team` | Team member profiles |
| `events` | Upcoming and past events |
| `partners` | Partner organizations |
| `reports` | Annual impact reports |
| `opportunities` | Volunteer opportunities |
| `faqs` | Frequently asked questions |
| `resources` | Downloadable resources |
| `pages` | Custom CMS pages |
| `site_settings` | All site-wide content settings |

---

## Deploying the Edge Function

The backend API runs as a single Supabase Edge Function. The CLI binary is included in `supabase-cli/supabase.exe`.

### Step 1 — Log in to Supabase CLI

Run this once (opens a browser for authentication):

```powershell
.\supabase-cli\supabase.exe login
```

### Step 2 — Deploy the function

```powershell
.\supabase-cli\supabase.exe functions deploy make-server-2a4be611 --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID (e.g. `mxffqgefsufcdgnhjjsw`).

### Step 3 — Set Edge Function secrets

In the Supabase Dashboard:
1. Go to **Edge Functions** → `make-server-2a4be611` → **Secrets** tab.
2. Add each of the server-side variables from the table above.

Alternatively, set them via CLI:

```powershell
.\supabase-cli\supabase.exe secrets set STRIPE_SECRET_KEY=sk_test_... --project-ref YOUR_PROJECT_ID
.\supabase-cli\supabase.exe secrets set MTN_MOMO_API_KEY=your_key --project-ref YOUR_PROJECT_ID
# ... repeat for each variable
```

### Re-deploying after code changes

Any time you edit `supabase/functions/make-server-2a4be611/index.ts` or `kv_store.tsx`, redeploy:

```powershell
.\supabase-cli\supabase.exe functions deploy make-server-2a4be611 --project-ref YOUR_PROJECT_ID
```

---

## Payment Integrations

### Stripe (Card Payments — `/donate`)

- The card form only appears when `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` is a real key starting with `pk_test_` or `pk_live_`.
- The server-side charge is handled by the Edge Function using `STRIPE_SECRET_KEY`.
- For **production**, use `pk_live_` and `sk_live_` keys.
- Get keys: https://dashboard.stripe.com/apikeys

### PayPal

- Uses `VITE_PAYPAL_CLIENT_ID` embedded at build time.
- Use the **Sandbox** Client ID for testing, **Live** for production.
- Get credentials: https://developer.paypal.com → My Apps & Credentials

### MTN Mobile Money

- Handled server-side by the Edge Function.
- Register at https://momodeveloper.mtn.com.
- Subscribe to the **Collections** product to get your Subscription Key.
- Set `MTN_MOMO_ENVIRONMENT=sandbox` for testing, `production` for live.

### Airtel Money

- Credentials are configured via the Admin Dashboard → Settings when you have an Airtel business account.

### Bank Transfer

- No API keys required.
- Bank account details are displayed as static information. Update them in Admin Dashboard → Settings.

---

## Building for Production

Before building, make sure your `.env` file has real values for all `VITE_` variables.

```bash
npm run build
```

This generates the `build/` folder:

```
build/
├── .htaccess         ← handles SPA routing on Apache (Hostinger)
├── assets/
│   ├── index-XXXX.css
│   └── index-XXXX.js
├── favicon.svg
├── index.html
├── logo.png
├── robots.txt
└── sitemap.xml
```

> `.htaccess` and `logo.png` are copied silently from `public/` — they will not appear in Vite's build output log but they are present in `build/`.

---

## Hosting on Hostinger

Only the contents of `build/` need to be uploaded. The Supabase backend is entirely separate and unaffected.

### Step 1 — Build

```bash
npm run build
```

### Step 2 — Open Hostinger File Manager

Log in at https://hpanel.hostinger.com → **File Manager** → open `public_html`.

Delete any default placeholder files Hostinger placed there (e.g. `default.php`, `index.php`).

### Step 3 — Upload

Upload the **contents** of your `build/` folder directly into `public_html/`. Do not upload the `build/` folder itself — upload what is inside it.

The result should look exactly like this inside `public_html/`:

```
public_html/
├── .htaccess          ← must be present — this is a hidden file
├── assets/
│   ├── index-XXXX.css
│   └── index-XXXX.js
├── favicon.svg
├── index.html
├── logo.png
├── robots.txt
└── sitemap.xml
```

**Tip on `.htaccess`**: It is a hidden file (starts with a dot). In Hostinger's File Manager it is visible by default. If uploading via FTP, enable "Show hidden files" in your FTP client.

**Tip on uploading**: You can ZIP the contents of `build/` (not the folder itself), upload the ZIP to `public_html/`, and use File Manager's Extract option. Then delete the ZIP.

### Step 4 — Enable SSL

In hPanel → **Security** → **SSL** → enable the free SSL certificate for your domain. This ensures the site runs on `https://`.

### Step 5 — Verify

Visit your domain. Test a route like `yourdomain.com/about` directly in the browser — if it loads (not a 404), the `.htaccess` is working correctly.

### How the `.htaccess` works

Hostinger runs Apache/LiteSpeed. The `.htaccess` file in `public_html/` tells the server to serve `index.html` for every URL that doesn't match a real file or folder. This lets React Router handle all client-side navigation:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### After updates

Whenever you make code changes, rebuild and re-upload. If you don't see changes after re-uploading, go to hPanel → **Advanced** → **Cache Manager** → **Purge All**.

---

## Admin Dashboard

The admin dashboard is at:

```
https://yourdomain.com/super-secret-admin-route
```

### First-time account creation

The **first account** registered via the signup form on this page is automatically assigned the `super-admin` role. All subsequent accounts get the `editor` role and must be activated by a super-admin.

**Steps to create your super-admin account:**
1. Go to `https://yourdomain.com/super-secret-admin-route`
2. Click the signup / create account link
3. Enter your email and a strong password
4. Log in with those credentials

### Roles

| Role | Access |
|---|---|
| `super-admin` | Full access to all tabs, settings, and user management |
| `editor` | Content editing — requires activation by a super-admin |
| `viewer` | Read-only |

### What is manageable from the dashboard

Every piece of public-facing content on the site is editable without touching code:

| Tab | What you can edit |
|---|---|
| Overview | Site-wide stats, recent activity |
| Programs | Add / edit / delete program listings |
| News | News articles with images |
| Gallery | Photo gallery |
| Team | Staff and team profiles |
| Stories | Impact stories |
| Impact | Impact map markers, statistics |
| Reports | Annual impact/financial reports |
| Events | Upcoming and past events |
| Partners | Partner organization listings |
| Opportunities | Volunteer opportunity listings |
| FAQs | Frequently asked questions |
| Resources | Downloadable documents |
| Pages | Custom pages accessible at `/pages/:slug` |
| Contacts | Submitted contact forms |
| Volunteers | Volunteer applications |
| Donations | Donor records |
| Subscribers | Newsletter subscribers |
| Settings | Hero text, About content, contact details, footer, announcement bar, social links, bank transfer details |
| Activity Log | Audit trail of all admin actions |

---

## Routes Reference

| URL | Component |
|---|---|
| `/` | Homepage (all sections) |
| `/about` | About page |
| `/news` | News archive |
| `/news/:id` | Individual news article |
| `/stories` | Stories archive |
| `/stories/:id` | Individual story |
| `/programs/:id` | Individual program detail |
| `/team` | Full team page |
| `/reports` | Impact reports |
| `/volunteer` | Volunteer signup page |
| `/faqs` | FAQ page |
| `/partners` | Partners page |
| `/opportunities` | Volunteer opportunities |
| `/donate` | Donation / card payment page |
| `/login` | Donor login |
| `/register` | Donor registration |
| `/reset-password` | Password reset |
| `/donor/dashboard` | Donor dashboard |
| `/contact` | Contact page |
| `/financials` | Financial reports |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/refund` | Refund policy |
| `/pages/:slug` | Custom CMS pages |
| `/super-secret-admin-route` | Admin dashboard |

---

## Troubleshooting

**Card payment form not showing**  
`VITE_STRIPE_PUBLISHABLE_KEY` must be a real key starting with `pk_test_` or `pk_live_`. Placeholder values disable the form. Set the real key in `.env` and rebuild.

**"Failed to create admin account"**  
The Edge Function must be deployed and the `schema.sql` must have been run. Redeploy with:
```powershell
.\supabase-cli\supabase.exe functions deploy make-server-2a4be611 --project-ref YOUR_PROJECT_ID
```

**"Invalid login credentials"**  
The account must be created via the signup form on the admin page first. The Supabase Auth user must exist — having a row in `admin_users` alone is not enough.

**Routes return 404 on Hostinger**  
The `.htaccess` file was not uploaded, or was uploaded to the wrong location. It must be directly inside `public_html/`, not inside a subfolder.

**Changes not visible after re-upload**  
Clear the Hostinger cache: hPanel → **Advanced** → **Cache Manager** → **Purge All**.

**Edge Function errors**  
Check live logs: Supabase Dashboard → **Edge Functions** → `make-server-2a4be611` → **Logs**.

**Large file warning on `git push`**  
`supabase-cli/supabase.exe` (93 MB) exceeds GitHub's 50 MB limit. To remove it from git tracking:
```bash
git rm --cached supabase-cli/supabase.exe
echo "supabase-cli/supabase.exe" >> .gitignore
git commit -m "remove large binary from tracking"
```
The file stays on disk but is no longer tracked by git.