# Stripe Payment Setup Guide

## 🎯 Overview

This guide will help you set up Stripe payments for accepting credit card donations on your website.

---

## 📋 Prerequisites

- A Stripe account (free to create)
- Your website deployed or running locally

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free Stripe account
3. Verify your email address
4. Complete the account setup (you can skip business details for testing)

### Step 2: Get Your API Keys

1. Log in to your Stripe Dashboard
2. Click on **"Developers"** in the top navigation
3. Click on **"API keys"** in the left sidebar
4. You'll see two sets of keys:
   - **Test mode keys** (for testing)
   - **Live mode keys** (for real payments)

**For Testing (Recommended First):**
- Make sure "Test mode" toggle is ON (top right corner)
- Copy your **Publishable key** (starts with `pk_test_...`)
- Copy your **Secret key** (starts with `sk_test_...`)

**For Production (After Testing):**
- Toggle to "Live mode"
- Copy your **Publishable key** (starts with `pk_live_...`)
- Copy your **Secret key** (starts with `sk_live_...`)

### Step 3: Configure Your Website

#### A. Update the Frontend (Publishable Key)

1. Open `/components/Donation.tsx`
2. Find this line (around line 25):
   ```typescript
   const STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
   ```
3. Replace `'YOUR_STRIPE_PUBLISHABLE_KEY_HERE'` with your actual publishable key:
   ```typescript
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_51ABC...'; // Your actual key
   ```

#### B. Configure the Backend (Secret Key)

The secret key is already configured as an environment variable `STRIPE_SECRET_KEY` in your Supabase environment.

**You don't need to do anything for the secret key - it's already set up!** ✅

### Step 4: Test the Payment Flow

#### Using Stripe Test Cards

Stripe provides test card numbers that you can use in test mode:

| Card Number | Description | Expected Result |
|------------|-------------|-----------------|
| `4242 4242 4242 4242` | Visa | ✅ Succeeds |
| `4000 0000 0000 9995` | Visa | ❌ Always declines |
| `4000 0025 0000 3155` | Visa | 🔐 Requires authentication |
| `5555 5555 5555 4444` | Mastercard | ✅ Succeeds |

**Additional Test Details:**
- **Expiry Date:** Use any future date (e.g., 12/25)
- **CVC:** Use any 3-digit number (e.g., 123)
- **ZIP Code:** Use any 5-digit number (e.g., 12345)

#### Testing Steps:

1. Go to your donation page
2. Select an amount (or enter custom amount)
3. Fill in your information:
   - Name: Your Name
   - Email: test@example.com
   - Phone: (optional)
4. Select "Credit/Debit Card (Stripe)" as payment method
5. Click "Continue to Payment"
6. Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
7. Click "Complete Donation"
8. ✅ You should see a success message!

### Step 5: Verify in Stripe Dashboard

1. Go to [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
2. You should see your test payment listed
3. Click on it to see full details

---

## 🔴 Going Live (Production)

### Before Accepting Real Payments:

1. **Complete Stripe Account Verification**
   - Add business details
   - Verify your bank account
   - Provide any required documentation

2. **Switch to Live Keys**
   - Get your Live Publishable Key (`pk_live_...`)
   - Get your Live Secret Key (`sk_live_...`)
   - Update `/components/Donation.tsx` with live publishable key
   - Update `STRIPE_SECRET_KEY` environment variable with live secret key

3. **Test Thoroughly**
   - Test the full donation flow
   - Verify emails are sent
   - Check that donations are recorded
   - Test different card types
   - Test error scenarios

4. **Set Up Webhooks (Recommended)**
   - In Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/make-server-2a4be611/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - This ensures you're notified of all payment events

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Keep your Secret Key private (never commit to git)
- ✅ Use environment variables for secret keys
- ✅ Test thoroughly in Test Mode before going live
- ✅ Set up Stripe webhooks for payment confirmations
- ✅ Enable Stripe Radar for fraud prevention
- ✅ Use HTTPS for your website (required for live mode)

### ❌ DON'T:
- ❌ Never expose your Secret Key in frontend code
- ❌ Don't store credit card details yourself
- ❌ Don't skip testing in Test Mode
- ❌ Don't go live without completing Stripe verification

---

## 🧪 Testing Checklist

Before going live, test these scenarios:

- [ ] Successful payment with Visa (`4242 4242 4242 4242`)
- [ ] Successful payment with Mastercard (`5555 5555 5555 4444`)
- [ ] Declined payment (`4000 0000 0000 9995`)
- [ ] Payment requiring authentication (`4000 0025 0000 3155`)
- [ ] Different currencies (USD, EUR, UGX)
- [ ] Different amounts (small, medium, large)
- [ ] Donation records saved correctly
- [ ] Email notifications sent (if configured)
- [ ] Stats updated on admin dashboard
- [ ] Mobile responsive checkout

---

## 🔧 Troubleshooting

### Error: "Invalid API Key"

**Problem:** The Stripe publishable key is not set or is incorrect.

**Solution:**
1. Check that you copied the entire key (starts with `pk_test_` or `pk_live_`)
2. Make sure you're using the correct key for your environment (test vs live)
3. Verify no extra spaces or characters were copied

### Error: "Stripe is not configured"

**Problem:** The publishable key hasn't been added to the code.

**Solution:**
1. Open `/components/Donation.tsx`
2. Replace `'YOUR_STRIPE_PUBLISHABLE_KEY_HERE'` with your actual key
3. Save the file and refresh your browser

### Payment Form Not Showing

**Problem:** The Stripe Elements library isn't loading.

**Solution:**
1. Check browser console for errors
2. Verify your publishable key is correct
3. Check that you have internet connection (Stripe Elements loads from CDN)
4. Try clearing browser cache and hard refresh

### Payment Succeeds But Donation Not Recorded

**Problem:** Backend integration issue.

**Solution:**
1. Check browser console for errors
2. Verify the backend is running
3. Check Supabase function logs
4. Ensure `STRIPE_SECRET_KEY` is set in environment

---

## 💰 Stripe Fees

### Test Mode
- ✅ **FREE** - No charges for test transactions

### Live Mode (US)
- 💳 **2.9% + $0.30** per successful card charge
- 🌍 **+1%** for international cards
- 💱 **+1%** for currency conversion

**Example:**
- Donation of $100 USD
- Stripe fee: $3.20 (2.9% + $0.30)
- You receive: $96.80

For other countries, check [Stripe Pricing](https://stripe.com/pricing)

---

## 📊 Viewing Payments in Dashboard

### Stripe Dashboard
1. Go to [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
2. View all payments, refunds, and disputes
3. Export payment data
4. View detailed analytics

### Your Admin Dashboard
1. Log in to your admin dashboard
2. Go to "Donations" tab
3. View all donations with details
4. Export CSV reports
5. See analytics and charts

---

## 🌍 Supported Countries

Stripe is available in 45+ countries. Check if your country is supported:
[https://stripe.com/global](https://stripe.com/global)

If Stripe is not available in your country, consider alternatives:
- Paystack (Africa)
- Flutterwave (Africa)
- PayPal
- Razorpay (India)

---

## 📞 Support Resources

- **Stripe Documentation:** [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support:** [https://support.stripe.com](https://support.stripe.com)
- **Stripe Status:** [https://status.stripe.com](https://status.stripe.com)
- **Stripe Community:** [https://community.stripe.com](https://community.stripe.com)

---

## 🎉 Quick Start Summary

**Fastest way to get started:**

1. Create Stripe account → [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Get test publishable key → [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
3. Update `/components/Donation.tsx` with your key
4. Test with card `4242 4242 4242 4242`
5. ✅ Done! You can now accept test donations

**Total setup time:** ~5 minutes ⏱️

---

## ✨ Additional Features to Consider

Once basic payments are working, consider enabling:

1. **Recurring Donations**
   - Monthly/yearly subscriptions
   - Stripe Billing integration

2. **Apple Pay / Google Pay**
   - One-click checkout
   - Stripe Payment Request Button

3. **Stripe Radar**
   - Fraud prevention
   - Automatically included (free)

4. **Custom Receipt Emails**
   - Branded email templates
   - Configured in Stripe Dashboard

5. **Donation Matching**
   - Corporate matching programs
   - Stripe integrations available

---

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [API Keys](https://dashboard.stripe.com/apikeys)
- [Test Cards](https://stripe.com/docs/testing)
- [Documentation](https://stripe.com/docs)
- [Status Page](https://status.stripe.com)

---

**Need Help?** 
If you encounter any issues, check the troubleshooting section above or contact Stripe support. All basic integration is complete and ready to use once you add your keys! 🚀
