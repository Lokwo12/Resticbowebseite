# Resti Kiryandongo CBO Portal

Welcome to the production-ready portal for **Resti Kiryandongo CBO**. This portal features an elegant frontend, premium secure donation integrations, dynamic CMS capabilities powered by Supabase, and custom optimizations for modern static hosting.

---

## 🚀 Getting Started

### 1. Local Installation
To get started with local development, clone the repository and run the package installer:
```bash
# Install dependencies
npm install
```

### 2. Run Development Server
To launch the hot-reloading development server locally:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the site.

### 3. Production Compilation
To compile the website into optimized, minified production assets:
```bash
npm run build
```
The output will be placed in the **`build/`** directory.

---

## 📦 Hostinger Deployment Guide

This project has been pre-configured with a custom Apache `.htaccess` rule inside the `public/` directory (automatically exported to `build/` on compilation) to ensure seamless client-side SPA routing on Hostinger Shared/Cloud hosting.

### Step 1: Compile the Latest Assets
Ensure your build is completely up to date:
```bash
npm run build
```

### Step 2: Compress the Build Directory
1. Open the local **`build/`** folder.
2. Select all items inside the directory:
   - `assets/` (folder)
   - `.htaccess` (file)
   - `index.html` (file)
   - `logo.png` (file)
3. Compress these items into a single ZIP archive (e.g., `build.zip`). Do **not** zip the `build/` folder itself, zip the *contents* inside it.

### Step 3: Upload via Hostinger File Manager
1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com).
2. Go to **File Manager** for your domain.
3. Open the **`public_html`** directory.
4. **Delete** any pre-existing default files placed by Hostinger (such as `default.php` or `index.php`).
5. Upload `build.zip` and **Extract** it directly inside `public_html`.
6. Once extracted, you can safely delete the `build.zip` archive.

---

## ⚙️ How Client-Side Routing Works on Hostinger
Since the React frontend uses dynamic routes (like `/volunteer`, `/events`, `/stories`), the server must understand how to redirect all page refreshes back to `index.html` without throwing **404 Not Found** errors.

The custom `.htaccess` file handles this automatically:
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
Hostinger's LiteSpeed/Apache engine processes this rule automatically upon deployment.

### 💡 Why `.htaccess` is Not Listed in the Build Terminal Output
When running `npm run build`, you will notice that Vite only lists processed code chunks (JS, CSS, and HTML files) in its terminal output. It does **not** list `.htaccess` or `logo.png` because static assets in the `public/` folder are copied silently to the `build/` folder in the background without any bundler transformations.

### 🔍 Viewing `.htaccess` in Windows File Explorer
Files starting with a dot (`.htaccess`) are treated as hidden operating system files by default in Windows:
1. Open the compiled output folder: `c:\Users\studente\Deaktop\Projects\Resticbowebseite-1\build`
2. At the top toolbar of Windows File Explorer, click **View** (or **Show** on Windows 11).
3. Check the box for **Hidden items**.
4. The `.htaccess` file will now be visible. Note that even if it's hidden from view, it will still be fully included when you compress the contents of the `build/` folder.

---

## 💳 Donation & Payment Gateway Configuration
Donation payment methods are configured in two distinct locations depending on whether they run on the **Frontend client (Vite)** or the **Backend API (Supabase Edge Functions)**:

### 📊 Configuration Matrix

| Payment Method | Keys Required | Configuration Location | When to Configure |
| :--- | :--- | :--- | :--- |
| **PayPal** | `VITE_PAYPAL_CLIENT_ID` <br> `VITE_PAYPAL_MERCHANT_EMAIL` | **Locally** in your `.env` file | **BEFORE** running `npm run build` |
| **Stripe (Public)** | `VITE_STRIPE_PUBLIC_KEY` | **Locally** in your `.env` file | **BEFORE** running `npm run build` |
| **Stripe (Secret)** | `STRIPE_SECRET_KEY` | **Online** in Supabase Dashboard | **Anytime** (independent of Hostinger) |
| **Mobile Money (MTN)** | `MTN_MOMO_SUBSCRIPTION_KEY`<br>`MTN_MOMO_API_USER`<br>`MTN_MOMO_API_KEY` | **Online** in Supabase Dashboard | **Anytime** (independent of Hostinger) |
| **Mobile Money (Airtel)**| `AIRTEL_CLIENT_ID`<br>`AIRTEL_CLIENT_SECRET` | **Online** in Supabase Dashboard | **Anytime** (independent of Hostinger) |

### 1. Frontend Keys (Locally in `.env`)
Vite embeds client keys directly into the compiled JavaScript files at build time:
1. In your local project root (`c:\Users\studente\Deaktop\Projects\Resticbowebseite-1`), open or create a file named `.env`.
2. Add your live values:
   ```env
   VITE_PAYPAL_CLIENT_ID=your_paypal_live_client_id
   VITE_PAYPAL_MERCHANT_EMAIL=your-business@email.com
   VITE_STRIPE_PUBLIC_KEY=your_stripe_live_publishable_key
   ```
3. Run `npm run build` to compile these keys into your site bundle.

### 2. Backend Keys (Online in Supabase Dashboard)
Secret API keys are securely processed in Supabase Edge Functions (and never exposed to Hostinger or the browser):
1. Go to your **Supabase Dashboard** -> **Project Settings** -> **Edge Functions** -> **Environment Variables**.
2. Add variables for `STRIPE_SECRET_KEY`, MTN, and Airtel.
3. Redeploy your Supabase functions:
   ```bash
   supabase functions deploy make-server-2a4be611
   ```

### 3. Email Notifications (Resend API Key)
The backend automatically sends HTML email receipts to donors and notifications to administrators using **Resend**.
1. Create a free account at [resend.com](https://resend.com) and generate an **API Key**.
2. Add the API Key to your Supabase Edge Functions environment:
   ```bash
   supabase secrets set RESEND_API_KEY="your_resend_api_key_here"
   ```
3. Deploy the Edge Functions:
   ```bash
   supabase functions deploy make-server-2a4be611
   ```
*(Note: Emails are sent from `onboarding@resend.dev` by default. Verify your own custom domain in Resend before going to production).*

---

## 🔒 Security & Optimization Recommendations
- **Activate SSL**: Enable Hostinger's Free SSL in hPanel under **Security** -> **SSL** so your site runs securely over `https://`.
- **Cache Management**: If you upload new updates and do not see changes immediately, go to Hostinger hPanel -> **Advanced** -> **Cache Manager** and click **Purge All**.


super-secret-admin-route