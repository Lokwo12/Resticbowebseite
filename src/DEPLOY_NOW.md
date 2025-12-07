# 🚀 DEPLOY BACKEND NOW - Step by Step

## 📋 What We're Deploying

Your backend server includes:
- ✅ Contact form endpoint
- ✅ Newsletter subscription
- ✅ Volunteer registration
- ✅ Donation processing (Stripe)
- ✅ Team member CRUD
- ✅ News article CRUD
- ✅ Events, Programs, Partners, etc.
- ✅ Admin authentication
- ✅ Image upload to Supabase Storage
- ✅ Email notifications via Resend

---

## 🎯 CHOOSE YOUR METHOD

### **Method 1: Supabase CLI** (Recommended - Professional)
**Time:** 5 minutes  
**Difficulty:** Easy  
**Best for:** Developers comfortable with command line

### **Method 2: Supabase Dashboard** (Alternative - Visual)
**Time:** 10 minutes  
**Difficulty:** Medium  
**Best for:** Prefer GUI over command line

---

## 🔧 METHOD 1: Deploy Using Supabase CLI

### **Step 1: Install Supabase CLI**

**On Windows:**
```bash
# Option A: Using npm (if Node.js installed)
npm install -g supabase

# Option B: Using Scoop
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

**Verify installation:**
```bash
supabase --version
# Should show: supabase version X.X.X
```

---

### **Step 2: Login to Supabase**

```bash
supabase login
```

**What happens:**
1. Opens your browser automatically
2. Login with your Supabase account
3. Click "Authorize" to grant CLI access
4. Returns to terminal with success message

**Troubleshooting:**
- If browser doesn't open, copy the URL shown in terminal
- Make sure you're logged into Supabase dashboard first

---

### **Step 3: Navigate to Your Project**

```bash
# Change to your project directory
cd /path/to/your/resti-kiryandongo-project
```

**How to find the path:**
- Windows: Right-click folder → "Copy as path"
- Mac/Linux: Drag folder to terminal

---

### **Step 4: Link to Supabase Project**

```bash
supabase link --project-ref zhfpzewpqzvkpbfmudfa
```

**You'll be prompted for:**
- Database password (the one you set when creating Supabase project)

**Expected output:**
```
✓ Linked to project: zhfpzewpqzvkpbfmudfa
```

**Troubleshooting:**
- "Invalid project ref" → Check you typed `zhfpzewpqzvkpbfmudfa` correctly
- "Access denied" → Make sure you own this Supabase project
- "Password incorrect" → Try resetting database password in Supabase dashboard

---

### **Step 5: Deploy the Edge Function**

```bash
supabase functions deploy make-server-2a4be611 --no-verify-jwt
```

**What this does:**
- Uploads `/supabase/functions/server/index.tsx`
- Uploads `/supabase/functions/server/kv_store.tsx`
- Deploys to Supabase Edge Network
- Makes it accessible at your function URL

**Expected output:**
```
Deploying function make-server-2a4be611...
✓ Function deployed successfully
✓ Function URL: https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611
```

**The `--no-verify-jwt` flag:**
- Allows public access without authentication token
- Needed because your frontend uses the public anon key

---

### **Step 6: Verify Deployment**

**Test in browser:**
```
https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/site-settings
```

**Expected result:** JSON data like:
```json
{
  "settings": {
    "siteName": "Resti Kiryandongo CBO",
    "tagline": "...",
    "sections": { ... }
  }
}
```

**Or test with curl:**
```bash
curl https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/site-settings
```

---

### **Step 7: Test Your Website**

1. Open your website
2. Press **F12** → Console tab
3. Refresh the page
4. **NO MORE "Failed to fetch" ERRORS!** ✅

---

## 🖥️ METHOD 2: Deploy via Supabase Dashboard

### **Step 1: Prepare the Code**

You need to copy the entire server code. I'll create a single-file version for you.

---

### **Step 2: Go to Supabase Dashboard**

Visit: https://supabase.com/dashboard/project/zhfpzewpqzvkpbfmudfa/functions

---

### **Step 3: Create New Function**

1. Click "**Deploy a new function**" button
2. Function name: `make-server-2a4be611`
3. Leave other settings default

---

### **Step 4: Copy Server Code**

**IMPORTANT:** The dashboard doesn't support multiple files, so we need to inline the kv_store code.

I'll create a combined file for you now...

---

## 🔄 Post-Deployment Steps

### **1. Verify All Endpoints Work**

Test these URLs in your browser (replace with your actual URL):

```
✅ Site Settings:
https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/site-settings

✅ Team Members:
https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/team

✅ News Articles:
https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/news

✅ Events:
https://zhfpzewpqzvkpbfmudfa.supabase.co/functions/v1/make-server-2a4be611/events
```

**All should return JSON (not 404 or errors)**

---

### **2. Test Admin Dashboard**

1. Go to your website `/admin`
2. Login (create account if needed)
3. Try adding a team member
4. Check if it appears on the frontend Team page
5. Try adding a news article
6. Check if it appears on the News page

**Everything should work now!** 🎉

---

### **3. Check Environment Variables**

Go to: https://supabase.com/dashboard/project/zhfpzewpqzvkpbfmudfa/settings/functions

Verify these are set:
- ✅ `SUPABASE_URL` (auto-set)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- ✅ `SUPABASE_ANON_KEY` (auto-set)
- ✅ `STRIPE_SECRET_KEY` (already added)
- ✅ `RESEND_API_KEY` (already added)

---

## 🐛 Troubleshooting

### **Error: "supabase: command not found"**
**Solution:** 
```bash
# Try reinstalling
npm install -g supabase

# Or use npx instead
npx supabase login
npx supabase functions deploy make-server-2a4be611 --no-verify-jwt
```

---

### **Error: "Failed to link project"**
**Solutions:**
1. Make sure you're logged in: `supabase login`
2. Check project ref: `zhfpzewpqzvkpbfmudfa`
3. Verify you have owner/admin access in Supabase dashboard

---

### **Error: "No such file or directory"**
**Solution:**
```bash
# Make sure you're in the right directory
pwd  # Should show your project path

# Check if supabase folder exists
ls -la supabase/functions/server/
# Should show: index.tsx and kv_store.tsx
```

---

### **Error: Still getting "Failed to fetch" after deploy**
**Solutions:**
1. **Hard refresh browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Check function URL is correct:**
   ```bash
   supabase functions list
   ```
4. **Verify function is running:**
   ```bash
   supabase functions inspect make-server-2a4be611
   ```

---

### **Error: "CORS policy blocked"**
**Solution:**
The server already has CORS enabled. If you still get this error:

1. Check browser console for exact error
2. Make sure function deployed successfully
3. Try deploying again:
   ```bash
   supabase functions deploy make-server-2a4be611 --no-verify-jwt
   ```

---

## 📊 Deployment Checklist

Before deploying:
- [ ] Supabase CLI installed (or using dashboard)
- [ ] Logged into Supabase account
- [ ] Know your database password
- [ ] In correct project directory

During deployment:
- [ ] Linked to project successfully
- [ ] Function deployed without errors
- [ ] Got success message with URL

After deployment:
- [ ] Function URL returns JSON (not 404)
- [ ] Website loads without "Failed to fetch" errors
- [ ] Admin dashboard can save data
- [ ] Frontend displays saved data

---

## 🎯 What Success Looks Like

### **Before Deployment:**
```
Console: ❌ Error fetching section settings: TypeError: Failed to fetch
Team Page: Shows with default title
Admin: Cannot save data
```

### **After Deployment:**
```
Console: ✅ Clean (no Failed to fetch errors)
Team Page: Shows with custom title from admin
Admin: ✅ Can add/edit/delete all data
Frontend: ✅ Displays all data from database
```

---

## ⚡ Quick Command Reference

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref zhfpzewpqzvkpbfmudfa

# Deploy function
supabase functions deploy make-server-2a4be611 --no-verify-jwt

# Check deployment
supabase functions list

# View logs (helpful for debugging)
supabase functions logs make-server-2a4be611

# Redeploy (if you make changes)
supabase functions deploy make-server-2a4be611 --no-verify-jwt
```

---

## 🆘 Need Help?

Tell me:
1. **Which method are you using?** (CLI or Dashboard)
2. **Which step are you on?** (1, 2, 3, etc.)
3. **Any error messages?** (copy-paste exact text)
4. **Operating system?** (Windows, Mac, Linux)

I'll walk you through it step by step! 🚀

---

## 🎉 Next Steps After Successful Deployment

1. ✅ Backend deployed
2. 🌐 Deploy frontend to Vercel (optional - makes it public)
3. 🎨 Customize content via admin dashboard
4. 📧 Set up custom email domain with Resend
5. 💳 Configure Stripe for donations
6. 🔒 Set up custom domain (optional)

**You're doing great! Let's get this deployed!** 💪
