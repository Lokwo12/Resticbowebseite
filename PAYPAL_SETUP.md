# PayPal Donation Setup Guide

## Overview

The donation modal uses the **PayPal JS SDK** (`@paypal/react-paypal-js`). The success screen only appears after PayPal confirms the payment via the `onApprove` callback — no premature success messages.

---

## Step 1 — Create a PayPal Business Account

1. Go to [paypal.com/business](https://www.paypal.com/business)
2. Sign up or upgrade your existing account to **Business**
3. Complete identity verification (required to receive donations)

---

## Step 2 — Get Your Client ID

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Log in with your PayPal Business account
3. Click **"My Apps & Credentials"**
4. Under the **Live** tab, click **"Create App"**
   - App Name: e.g. `Resti Kiryandongo Donations`
   - App Type: **Merchant**
5. Copy the **Live Client ID** shown on the app detail page

> **For testing first:** Use the **Sandbox** tab instead, create a Sandbox app, and test with PayPal sandbox accounts. No real money moves in Sandbox mode.

---

## Step 3 — Add the Client ID to the Project

Create a `.env` file in the project root (same folder as `package.json`):

```
VITE_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID_HERE
VITE_PAYPAL_MERCHANT_EMAIL=your-business@email.com
```

- `VITE_PAYPAL_CLIENT_ID` — from developer.paypal.com (required for SDK buttons)
- `VITE_PAYPAL_MERCHANT_EMAIL` — your PayPal Business email; ensures payments go directly to your account

> The `.env` file is already excluded from Git via `.gitignore`. Never commit your Client ID to a public repository.

---

## Step 4 — Verify the Integration

1. Run `npm run dev`
2. Open the donation modal and select **PayPal**
3. The PayPal button will render (yellow PayPal button)
4. Complete a test payment using a **Sandbox buyer account**
5. After payment, the modal should show the **success page**

If the button shows an error, double-check that:
- `VITE_PAYPAL_CLIENT_ID` is set correctly in `.env`
- You are using the correct tab (Sandbox for testing, Live for production)
- The dev server was restarted after adding the `.env` file

---

## Step 5 — Go Live

1. Replace the Sandbox Client ID in `.env` with the **Live Client ID**
2. Restart the dev server or redeploy
3. Payments will now go directly to your PayPal Business account

---

## Where the Code Lives

| File | What it does |
|------|-------------|
| `src/components/DonationModal.tsx` | PayPal SDK button, `onApprove` triggers success |
| `.env` | Holds `VITE_PAYPAL_CLIENT_ID` |
| `package.json` | `@paypal/react-paypal-js` dependency |

---

## Fees

PayPal charges **1.99% + $0.49 per transaction** for donations to registered nonprofits (apply at [paypal.com/fundraiser](https://www.paypal.com/fundraiser)). Standard merchant rate is **3.49% + $0.49**.
