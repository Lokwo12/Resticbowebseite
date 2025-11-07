# 🚀 Quick Start Guide

## Welcome to Your Enhanced Admin System!

This guide will get you up and running in 10 minutes.

---

## Step 1: Access the Admin Dashboard (1 minute)

1. Open your browser and go to: `your-website-url.com/admin`
2. Click **"Need an account? Sign up"**
3. Enter:
   - Your name
   - Your email
   - A secure password
4. Click **"Create Account"**
5. Login with your credentials

**✅ You now have admin access!**

---

## Step 2: Set Up Email Notifications (5 minutes)

### Quick Setup:
1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up with your email
3. Verify your email
4. Go to **API Keys** in sidebar
5. Click **"Create API Key"**
6. Copy the key (starts with `re_`)
7. The system will prompt you to add `RESEND_API_KEY` - paste it there

### Update Email Addresses:
You need to update 2 email addresses in the code:

**File:** `/supabase/functions/server/index.tsx`

**Find and replace:**
```typescript
// Around line 66 and line 350
'admin@restikirya.org'  // Replace with YOUR admin email
```

**Find and replace:**
```typescript
// Around line 38
from: 'Resti Kiryandongo CBO <noreply@restikirya.org>'
// Replace with: 'Resti Kiryandongo CBO <noreply@yourdomain.com>'
```

### Test It:
1. Go to your website contact form
2. Submit a test message
3. Check your email - you should receive a notification!

**✅ Email notifications are working!**

**Note:** For production use, set up your custom domain in Resend (see EMAIL_SETUP_GUIDE.md)

---

## Step 3: Test All Features (4 minutes)

### Test Content Management:

1. **Add a Program:**
   - Go to Admin Dashboard → Programs tab
   - Click **"Add Program"**
   - Fill in title and description
   - Upload an image (optional)
   - Click **"Create Program"**
   - ✅ Check it appears on the main website

2. **Add News with Rich Text:**
   - Go to News tab
   - Click **"Add News"**
   - Use the editor to format text
   - Add bold, lists, links, etc.
   - Upload a featured image
   - Click **"Publish News"**
   - ✅ Check it on the main website

3. **View Analytics:**
   - Go to Analytics tab
   - See your charts and statistics
   - ✅ Data visualizes beautifully!

4. **Test Bulk Actions:**
   - Select multiple programs with checkboxes
   - Click **"Delete Selected"**
   - Confirm deletion
   - ✅ Multiple items deleted at once!

5. **Export Data:**
   - On any tab, click **"Export CSV"**
   - Open the downloaded file
   - ✅ All your data exported!

---

## Step 4: Configure Your Organization

### Update Admin Email Addresses

**File:** `/supabase/functions/server/index.tsx`

Replace these:
```typescript
'admin@restikirya.org'  // Your admin email (appears twice)
```

### Customize Email Templates (Optional)

In the same file, find the email HTML templates and customize:
- Email subject lines
- Message content
- Your organization's branding
- Contact information

---

## Step 5: Add Your Team Members

### For Super Admins Only:

1. Go to Users tab
2. Have team members create accounts at `/admin`
3. You can then change their roles:
   - **Super Admin**: Full control
   - **Admin**: Manage content + users
   - **Editor**: Manage content only
   - **Viewer**: Read-only access

**Role Permissions:**
- **Super Admin** ✅ Everything including user management
- **Admin** ✅ All content, ❌ No user management  
- **Editor** ✅ Create/edit content, ❌ No delete/users
- **Viewer** ✅ View only, ❌ No changes

---

## ✨ You're All Set!

Your admin system now has:
- ✅ Email notifications for contacts and donations
- ✅ Image upload for programs and news
- ✅ Rich text editor for beautiful content
- ✅ Advanced analytics with charts
- ✅ User role management
- ✅ Bulk actions for efficiency
- ✅ CSV export for all data

---

## 📋 Daily Workflow

**Every Morning (5 minutes):**
1. Check Admin Dashboard → Contacts
2. Review new contact messages
3. Mark as "In Progress" or "Resolved"
4. Respond to urgent inquiries

**Weekly (15 minutes):**
1. Review volunteer applications
2. Approve or reject pending applications
3. Add news update about recent activities
4. Export data for backups

**Monthly (30 minutes):**
1. Review analytics charts
2. Identify trends and patterns
3. Plan next month's content
4. Update programs if needed

---

## 🆘 Quick Troubleshooting

**Can't login?**
- Clear browser cache
- Try incognito/private mode
- Reset password (contact developer)

**Emails not sending?**
- Verify RESEND_API_KEY is set
- Check spam folder
- Review EMAIL_SETUP_GUIDE.md

**Image won't upload?**
- Check file size (max 5MB)
- Use JPEG, PNG, WebP, or GIF
- Try a different image

**Charts not showing?**
- Make sure you have some data
- Refresh the page
- Clear browser cache

---

## 📚 Full Documentation

For detailed guides, see:
- **IMPLEMENTATION_SUMMARY.md** - Complete feature overview
- **EMAIL_SETUP_GUIDE.md** - Email configuration details
- **ADMIN_GUIDE.md** - Complete admin user guide
- **FEATURES_AND_RECOMMENDATIONS.md** - Future enhancements

---

## 🎉 Next Steps

Now that you're set up:

1. **Add Your Content:**
   - Create all your programs
   - Write news articles about your work
   - Update About section content

2. **Customize Design:**
   - Update colors to match your brand
   - Add your logo
   - Customize email templates

3. **Train Your Team:**
   - Share this guide with admins
   - Walk through the dashboard together
   - Assign roles appropriately

4. **Promote Your Website:**
   - Share on social media
   - Add to email signatures
   - Include in printed materials

---

## 🎯 Success Metrics to Track

Monitor these in your Analytics tab:
- Total donations received
- New contact inquiries per week
- Volunteer applications per month
- Newsletter subscriber growth
- Most popular programs

---

**Congratulations on your enhanced admin system! 🎊**

You now have professional-grade tools to manage your organization's online presence effectively.

**Questions?** Review the documentation or contact your developer.

**Happy managing! 💚**
