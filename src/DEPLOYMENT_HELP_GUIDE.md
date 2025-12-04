# 🚀 Complete Deployment & Fix Guide

## Current Issues
1. ❌ "Failed to fetch" errors for site-settings
2. ❌ Supabase Edge Functions not deployed
3. ❌ GitHub/Render deployment issue (no dist folder)

---

## 🔧 SOLUTION 1: Deploy Supabase Edge Functions (CRITICAL)

Your backend server code exists but hasn't been deployed to Supabase yet. This is why you're getting "Failed to fetch" errors.

### Step 1: Install Supabase CLI

**On Windows:**
```bash
# Using npm (if you have Node.js installed)
npm install -g supabase

# OR using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**On Mac:**
```bash
brew install supabase/tap/supabase
```

**On Linux:**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```
- This will open your browser
- Login with your Supabase account credentials
- You'll get an access token

### Step 3: Link Your Project
```bash
# Navigate to your project directory first
cd path/to/your/project

# Link to your Supabase project
supabase link --project-ref zhfpzewpqzvkpbfmudfa
```

When prompted, enter your database password (the one you set when creating the Supabase project).

### Step 4: Deploy the Edge Function
```bash
# Deploy the server function
supabase functions deploy make-server-2a4be611 --no-verify-jwt
```

The `--no-verify-jwt` flag is important because we're using the anon key for public access.

### Step 5: Verify Deployment
```bash
# List all deployed functions
supabase functions list
```

You should see `make-server-2a4be611` in the list.

### Step 6: Test the Endpoint
Open your browser and visit:
```
https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/site-settings
```

You should see JSON data returned (not an error).

---

## 🌐 SOLUTION 2: Deploy Frontend to Vercel (RECOMMENDED)

Since this is a Figma Make project, it's optimized for Vercel deployment.

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Resti Kiryandongo CBO website"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the project settings
5. Click "Deploy"

**Important:** Vercel will automatically handle the build process for Figma Make projects. No configuration needed!

### Step 3: Add Environment Variables (If Needed)

If your frontend needs environment variables:
1. Go to Project Settings → Environment Variables
2. Add these if you use them in frontend:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ⚡ QUICK FIX: If You Can't Deploy Edge Functions Right Now

The News and Team pages will work with default settings. Here's what works without deployment:

✅ **Working Features:**
- Team page displays (with default title)
- News page displays (with default title)
- All UI components render correctly
- Filter buttons work
- Data fetching works (when you deploy functions)

❌ **Not Working Without Deployment:**
- Site settings API
- Admin dashboard data management
- Contact form submissions
- Newsletter subscriptions
- All backend CRUD operations

---

## 🔍 TROUBLESHOOTING

### Error: "supabase: command not found"
**Solution:** Install Supabase CLI using the commands above.

### Error: "Failed to link project"
**Solution:** 
1. Make sure you're logged in: `supabase login`
2. Check your project ref: `zhfpzewpqzvkpbfmudfa`
3. Verify you have access to this project in Supabase dashboard

### Error: "No such file or directory: supabase/functions"
**Solution:** Your project structure should have:
```
/supabase/
  /functions/
    /server/
      index.tsx
      kv_store.tsx
```

The files exist in your Figma Make project. Make sure you're in the right directory.

### Error: "Failed to fetch" still appears after deployment
**Solution:**
1. Check if function is deployed: `supabase functions list`
2. Verify the endpoint URL is correct
3. Check browser console for CORS errors
4. Make sure you're using the correct project ID

---

## 📋 DEPLOYMENT CHECKLIST

### Backend (Supabase Edge Functions)
- [ ] Install Supabase CLI
- [ ] Login to Supabase
- [ ] Link to project (ref: zhfpzewpqzvkpbfmudfa)
- [ ] Deploy edge function
- [ ] Test endpoint in browser
- [ ] Verify all environment variables are set in Supabase dashboard

### Frontend (Vercel)
- [ ] Push code to GitHub
- [ ] Connect GitHub repo to Vercel
- [ ] Deploy to Vercel
- [ ] Add environment variables (if needed)
- [ ] Test live website

### Verification
- [ ] Visit your website
- [ ] Check browser console (no "Failed to fetch" errors)
- [ ] Test adding team member in admin dashboard
- [ ] Verify team member appears on frontend
- [ ] Test adding news article
- [ ] Verify news article appears on frontend

---

## 🆘 STILL NEED HELP?

### Option A: Manual Deployment via Supabase Dashboard

If CLI doesn't work, you can deploy via the dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project (zhfpzewpqzvkpbfmudfa)
3. Navigate to Edge Functions
4. Click "New Function"
5. Name it: `make-server-2a4be611`
6. Copy the entire content from `/supabase/functions/server/index.tsx`
7. Paste and deploy

**Note:** You'll also need to create the kv_store.tsx file separately or inline the code.

### Option B: Use Alternative Hosting

For a simpler deployment without Edge Functions:
1. Convert to a traditional backend (Node.js/Express)
2. Deploy backend to Railway, Heroku, or Render
3. Update all fetch URLs to point to new backend
4. Deploy frontend to Vercel/Netlify

---

## 📞 NEXT STEPS

1. **First Priority:** Deploy Supabase Edge Functions (fixes "Failed to fetch" errors)
2. **Second Priority:** Deploy frontend to Vercel (makes site publicly accessible)
3. **Third Priority:** Test all features end-to-end

Let me know which step you're stuck on, and I'll provide more specific help!
