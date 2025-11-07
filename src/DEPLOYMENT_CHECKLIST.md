# 🚀 Deployment Checklist for Resti Kiryandongo CBO Website

## ✅ Pre-Deployment Configuration

### 1. **Email Configuration** (REQUIRED)

**File:** `/supabase/functions/server/index.tsx`

#### Update Admin Email (Lines 110 & 332)
Replace `'admin@restikirya.org'` with your actual admin email:

```typescript
// Line ~110 - Contact notifications
await sendEmail(
  'YOUR_ADMIN_EMAIL@yourdomain.com',  // ⚠️ CHANGE THIS
  'New Contact Form Submission',
  ...
)

// Line ~332 - Donation notifications
await sendEmail(
  'YOUR_ADMIN_EMAIL@yourdomain.com',  // ⚠️ CHANGE THIS
  `New Donation: ${currency} ${amount}`,
  ...
)
```

#### Update Sender Email (Line 42)
Replace with your verified domain email:

```typescript
// Line ~42
from: 'Resti Kiryandongo CBO <noreply@yourdomain.com>',  // ⚠️ CHANGE THIS
```

### 2. **Stripe Configuration** (OPTIONAL - for production)

**File:** `/components/Donation.tsx`

If you want to use Stripe in production, replace the test key on line 25:

```typescript
// Line 25
const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_LIVE_KEY_HERE';  // ⚠️ CHANGE THIS for production
```

> **Note:** The current test key works for development. Only change this if deploying to production.

---

## 📦 Deployment Steps

### Option A: Deploy to Vercel (Recommended)

1. **Export code from Figma Make**
2. **Create a new GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/resti-kiryandongo.git
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect React/Vite

4. **Configure Environment Variables** (Not needed - Supabase credentials are in code)
   - Your Supabase configuration is already in the code
   - No additional environment variables needed for basic deployment

5. **Deploy!**
   - Click "Deploy"
   - Your site will be live at `https://your-project.vercel.app`

### Option B: Deploy to Netlify

1. **Export code from Figma Make**
2. **Create a new GitHub repository** (same as above)
3. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

4. **Your site will be live** at `https://your-site.netlify.app`

### Option C: Deploy to GitHub Pages

1. **Export code from Figma Make**
2. **Update `vite.config.ts`** (if it exists) or create it:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/',  // Replace with your repo name
   })
   ```

3. **Add deployment script to `package.json`**:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     },
     "devDependencies": {
       "gh-pages": "^6.0.0"
     }
   }
   ```

4. **Deploy**:
   ```bash
   npm install
   npm run deploy
   ```

5. **Enable GitHub Pages** in repository settings
   - Your site will be live at `https://yourusername.github.io/repo-name/`

---

## 🔧 Post-Deployment Configuration

### 1. Test All Features

- ✅ Homepage loads correctly
- ✅ Navigation works (smooth scroll)
- ✅ Contact form submits successfully
- ✅ Newsletter subscription works
- ✅ Donation page functions (test with Stripe test cards)
- ✅ Admin dashboard accessible at `/admin`
- ✅ Admin can sign up and login
- ✅ All admin features work (programs, news, donations, etc.)

### 2. Set Up Email Service (Resend)

If you haven't already:

1. **Sign up at [resend.com](https://resend.com)** (FREE plan available)
2. **Verify your domain** in Resend dashboard
3. **The RESEND_API_KEY is already configured** in your Supabase environment

See `/EMAIL_SETUP_GUIDE.md` for detailed instructions.

### 3. Configure Stripe (Optional)

For production donations:

1. **Create a Stripe account** at [stripe.com](https://stripe.com)
2. **Get your live API keys** from Stripe dashboard
3. **Update the publishable key** in `/components/Donation.tsx` (line 25)
4. **The STRIPE_SECRET_KEY is already configured** in your Supabase environment

### 4. Update Mobile Money Details (Optional)

**File:** `/components/Donation.tsx` (around line 627)

Update the mobile money number if needed:

```typescript
<p className="text-sm text-gray-600">+256 XXX XXX XXX</p>  // ⚠️ Update with your number
```

---

## 📝 Files That Need Updates

### Required Changes:
1. ✅ **Header.tsx** - Admin button removed
2. ⚠️ **server/index.tsx** - Update admin email (2 places)
3. ⚠️ **server/index.tsx** - Update sender email (1 place)

### Optional Changes:
4. **Donation.tsx** - Update Stripe key for production
5. **Donation.tsx** - Update mobile money number

---

## 🎯 Quick Configuration Checklist

- [ ] Admin button removed from frontend ✅ DONE
- [ ] Admin email updated in server (line 110)
- [ ] Admin email updated in server (line 332)
- [ ] Sender email updated in server (line 42)
- [ ] Stripe key updated (if using production)
- [ ] Mobile money number updated (if applicable)
- [ ] Code exported from Figma Make
- [ ] Repository created on GitHub
- [ ] Deployed to hosting platform
- [ ] Website tested and working
- [ ] Admin dashboard tested
- [ ] Email notifications tested (after Resend setup)

---

## 🔗 Important URLs

### After Deployment:
- **Public Website:** `https://your-domain.com/`
- **Admin Dashboard:** `https://your-domain.com/admin`
- **Backend API:** `https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611`

### Development:
- **Supabase Dashboard:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Resend Dashboard:** [https://resend.com/dashboard](https://resend.com/dashboard)
- **Stripe Dashboard:** [https://dashboard.stripe.com](https://dashboard.stripe.com)

---

## 🆘 Troubleshooting

### Website shows blank page
- Check browser console for errors
- Ensure all dependencies installed: `npm install`
- Check build output for errors

### Contact form not working
- Verify Supabase backend is running
- Check browser network tab for API errors
- Verify email configuration in server code

### Email notifications not sending
- Ensure Resend API key is configured
- Verify domain is verified in Resend
- Check admin email is updated in server code
- Check server logs in Supabase dashboard

### Admin login not working
- Ensure user is registered
- Check Supabase Auth is enabled
- Verify credentials are correct
- Check browser console for errors

---

## 📚 Additional Documentation

- **Quick Start Guide:** `/QUICK_START.md`
- **Email Setup:** `/EMAIL_SETUP_GUIDE.md`
- **Admin Guide:** `/ADMIN_GUIDE.md`
- **Features Documentation:** `/FEATURES_AND_RECOMMENDATIONS.md`
- **Technical Architecture:** `/TECHNICAL_ARCHITECTURE.md`

---

## ✨ Your Website is Ready!

Once you've completed this checklist, your Resti Kiryandongo CBO website will be:
- ✅ Fully functional
- ✅ Production-ready
- ✅ Deployed and accessible online
- ✅ Ready to accept contacts, donations, and newsletter subscriptions
- ✅ Equipped with a powerful admin dashboard

**Good luck with your launch! 🎉**
