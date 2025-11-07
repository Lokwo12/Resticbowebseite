# ⚡ Quick Reference Card

## 🎯 Essential Information

### **Admin Dashboard Access**
```
URL: https://your-domain.com/admin
Email: your-email@example.com
Password: [your-password]
```

### **API Credentials Needed**
```bash
# Required for emails (get from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional for payments (get from stripe.com)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

---

## 📋 Common Admin Tasks

### **Add New Content**
| Content Type | Steps |
|--------------|-------|
| **Program** | Programs tab → Add Program → Fill form → Upload image → Save |
| **Team Member** | Team tab → Add Team Member → Upload photo → Enter details → Save |
| **News Article** | News tab → Add News → Use editor → Upload image → Save |
| **Event** | Events tab → Add Event → Set date/time → Upload image → Save |
| **Partner** | Partners tab → Add Partner → Upload logo → Enter info → Save |
| **FAQ** | FAQs tab → Add FAQ → Enter Q&A → Choose category → Save |

### **Update Site Settings**
1. Go to **Settings** tab
2. Click section to edit (Hero, About, Contact, etc.)
3. Make changes
4. Click **Save Changes**

### **Manage Submissions**
| Type | View | Actions |
|------|------|---------|
| **Contacts** | Contacts tab | Reply, Update status, Export CSV |
| **Volunteers** | Volunteers tab | Update status, Export CSV |
| **Donations** | Donations tab | View records |
| **Newsletter** | Subscribers tab | Export CSV |

---

## 🎨 Quick Customization

### **Change Colors**
Find and replace in components:
- `emerald-600` → `blue-600` (or any Tailwind color)
- `emerald-50` → `blue-50` (light backgrounds)
- `emerald-700` → `blue-700` (hover states)

### **Update Logo**
1. Settings tab → General section
2. Click "Upload Logo"
3. Select file → Save

### **Change Hero Image**
1. Settings tab → Hero section
2. Upload new image
3. Save Changes

---

## 🔐 User Roles

| Role | Can View | Can Edit | Can Delete | Can Add Users |
|------|----------|----------|------------|---------------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ |

**To change roles**: Users tab (Super Admin only)

---

## 🖼️ Image Guidelines

| Section | Size | Ratio | Format |
|---------|------|-------|--------|
| **Hero** | 1200x1200px | Square | JPG/PNG |
| **Programs** | 800x600px | 4:3 | JPG/PNG |
| **Team** | 400x400px | Square | JPG/PNG |
| **News** | 1200x630px | 16:9 | JPG/PNG |
| **Gallery** | Any | Any | JPG/PNG |
| **Partners** | 400x200px | 2:1 | PNG |
| **Events** | 1200x630px | 16:9 | JPG/PNG |

**Max file size**: 5MB  
**Recommended**: < 500KB (compress before upload)

---

## 📧 Email Configuration

### **Setup Resend API**
1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to environment variables:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Test by submitting contact form

### **Emails Sent Automatically**
- ✅ Contact form → Admin
- ✅ Volunteer application → Admin
- ✅ Admin reply → User
- ✅ Newsletter signup → User (optional)

---

## 💳 Payment Configuration

### **Setup Stripe**
1. Sign up at https://stripe.com
2. Get test keys from dashboard
3. Add to environment variables:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   ```
4. Update publishable key in `/components/Donation.tsx`
5. Test with card: `4242 4242 4242 4242`

**Note**: Switch to live keys when ready for production

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Can't login** | Clear cache, check password, verify Supabase running |
| **Images won't upload** | Check file size < 5MB, verify format (JPG/PNG) |
| **Emails not sending** | Verify RESEND_API_KEY is set, check Resend dashboard |
| **Mobile menu broken** | Clear cache, enable JavaScript, try different browser |
| **Content not saving** | Check console for errors, verify you have edit permission |

---

## 🔄 Regular Tasks

### **Daily**
- [ ] Check contact form submissions
- [ ] Review volunteer applications

### **Weekly**
- [ ] Add news article
- [ ] Respond to messages
- [ ] Update events if needed

### **Monthly**
- [ ] Update impact statistics
- [ ] Add new team photos
- [ ] Export subscriber list
- [ ] Review analytics

---

## 📊 Admin Dashboard Map

```
Admin Dashboard
├── Overview (Stats + Charts)
├── Programs (CRUD)
├── News (CRUD + Rich Text)
├── Gallery (Image Upload)
├── Contacts (View + Reply)
├── Volunteers (View + Status)
├── Donations (View)
├── Newsletter (Export)
├── Team (CRUD + Photos)
├── Stories (CRUD + Rich Text)
├── Impact Stats (Update Metrics)
├── Reports (Add Files)
├── Events (CRUD + Calendar)
├── Partners (CRUD + Logos)
├── Opportunities (CRUD + Arrays)
├── FAQs (CRUD + Categories)
├── Resources (Add Files)
├── Users (Manage Admins) [Super Admin]
└── Settings (Edit All Content)
```

---

## 🌐 Frontend Sections

1. **Hero** - Landing with CTA
2. **About** - Mission, vision, values
3. **Programs** - Service cards
4. **Team** - Member profiles
5. **Impact Stories** - Success stories
6. **Impact Dashboard** - Key metrics
7. **News** - Articles feed
8. **Gallery** - Photo grid
9. **Events** - Calendar view
10. **Partners** - Logo grid
11. **Volunteer Opportunities** - Listings
12. **FAQ** - Accordion
13. **Resources** - Download links
14. **Donation** - Payment form
15. **Contact** - Contact form
16. **Newsletter** - Signup form

---

## 🎨 Animation Timing

| Type | Duration | Use Case |
|------|----------|----------|
| **Fast** | 150-200ms | Small changes |
| **Normal** | 300ms | Interactions |
| **Medium** | 500ms | Image zooms |
| **Slow** | 700ms | Section transitions |

**Stagger Delay**: 100ms between items

---

## 🔒 Security Checklist

- [x] HTTPS enabled
- [x] API keys in environment variables
- [x] Admin login required
- [x] Role-based permissions
- [x] Input validation
- [x] SQL injection protection
- [x] XSS protection
- [x] CSRF tokens
- [x] Rate limiting
- [x] Secure password hashing

---

## 📞 Support Resources

| Resource | URL |
|----------|-----|
| **Supabase Docs** | https://supabase.com/docs |
| **React Docs** | https://react.dev |
| **Tailwind Docs** | https://tailwindcss.com |
| **Stripe Docs** | https://stripe.com/docs |
| **Resend Docs** | https://resend.com/docs |

---

## 🚀 Launch Checklist

**Before Going Live:**
- [ ] Admin account created
- [ ] Logo uploaded
- [ ] Contact info updated
- [ ] Initial content added
- [ ] RESEND_API_KEY configured
- [ ] Email delivery tested
- [ ] All forms tested
- [ ] Mobile layout checked
- [ ] Domain configured
- [ ] SSL enabled

---

## 📈 Key Metrics to Track

- **Page Views**: Total site traffic
- **Form Submissions**: Contact + volunteer + newsletter
- **Donations**: Amount + count
- **Bounce Rate**: Quality of traffic
- **Page Load Time**: Performance
- **Mobile vs Desktop**: Device breakdown

---

## 💡 Pro Tips

1. **Compress images** before uploading for faster load times
2. **Update regularly** - Add news weekly for fresh content
3. **Reply quickly** to contact forms for better engagement
4. **Use categories** to organize content effectively
5. **Test on mobile** - Most visitors use phones
6. **Export backups** of contacts/subscribers monthly
7. **Monitor emails** in Resend dashboard for delivery issues
8. **Update stats** in Impact Dashboard monthly

---

## 🎯 Quick Commands

**Access Admin**:
```
https://your-domain.com/admin
```

**Add New Admin User** (Super Admin only):
```
Users tab → Add User → Enter details → Assign role
```

**Export Data**:
```
Relevant tab ��� Export CSV button
```

**Reply to Contact**:
```
Contacts tab → Click contact → Reply button
```

**Update Hero**:
```
Settings → Hero Section → Edit → Save
```

---

## 📱 Mobile Testing

Test on:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad
- [ ] Small screen (320px)
- [ ] Medium screen (768px)
- [ ] Large screen (1024px+)

---

## ✅ Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 **Active** | Everything working |
| 🟡 **Pending** | Awaiting action |
| 🔴 **Error** | Needs attention |
| ⚫ **Inactive** | Disabled/archived |

---

**Print this page for quick reference!** 📄

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Status**: ✅ Production Ready
