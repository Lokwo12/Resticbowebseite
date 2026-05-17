# Mobile Money STK Push — Setup Guide

This guide covers how to configure **MTN Mobile Money** and **Airtel Money** automatic push payments for Uganda.

When a donor clicks "Pay Now", your server instantly sends a PIN prompt to their phone via the provider's API. The donor just enters their mobile money PIN — no dialling required.

---

## How It Works

```
Donor fills form (name, email, phone)
        │
        ▼
Frontend → POST /mobile-payment/initiate (your Supabase Edge Function)
        │
        ▼
Edge Function calls MTN / Airtel Collections API
        │
        ▼
Provider sends PIN prompt to donor's phone
        │
        ▼
Frontend polls GET /mobile-payment/status/:id every 4 seconds
        │
        ▼
Donor enters PIN → Provider confirms → Donation marked complete
        │
        ▼
Thank-you email sent to donor + admin notification
```

---

## 1. MTN Mobile Money (Uganda)

### 1a. Create a Developer Account

1. Go to **https://momodeveloper.mtn.com/**
2. Click **Sign Up** and register a new account
3. After logging in, go to **Products** and subscribe to the **Collection** product
4. Copy your **Primary Key** (this is `MTN_MOMO_SUBSCRIPTION_KEY`) 
Your Primary Key
cf512761af1a46d09f792faabe1e8b94

### 1b. Create an API User (Sandbox)

In the sandbox you must create an API user manually. Run these commands (replace `YOUR_SUBSCRIPTION_KEY`):

```bash
# 1. Generate a UUID for your API user
# You can use https://www.uuidgenerator.net/ or any UUID tool
# Example: f4e2c1a0-1234-5678-abcd-ef0123456789

# 2. Create the API user
curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
  -H "X-Reference-Id: <YOUR_UUID>" \
  -H "Ocp-Apim-Subscription-Key: <YOUR_SUBSCRIPTION_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"providerCallbackHost": "https://your-site.com"}'

# 3. Create the API key for that user
clear
# → Returns: { "apiKey": "abc123..." }
```

Save the UUID as `MTN_MOMO_API_USER` and the returned key as `MTN_MOMO_API_KEY`.

### 1c. Sandbox Test Numbers

MTN sandbox accepts any MSISDN. Use `256771234567` for test payments. The sandbox does not charge real money and auto-confirms payments.

### 1d. Go Live

Contact MTN Uganda's MoMo business team at **momo.business@mtn.com** to migrate to production. They will give you production credentials and set `MTN_MOMO_ENVIRONMENT=production`.

---

## 2. Airtel Money (Uganda)

### 2a. Create a Developer Account

1. Go to **https://developers.airtel.africa/**
2. Register and log in
3. Create a new **App** in the dashboard
4. Subscribe to the **Airtel Money** product / Collection API
5. Copy your **Client ID** and **Client Secret**

### 2b. Sandbox Testing

Set `AIRTEL_ENVIRONMENT=sandbox`. The sandbox base URL is `https://openapiuat.airtel.africa`. Use any valid-format MSISDN like `256751234567` for test payments.

### 2c. Go Live

Apply for production access through the Airtel Africa developer portal. After approval, set `AIRTEL_ENVIRONMENT=production`.

---

## 3. Supabase Environment Variables

Go to your **Supabase Dashboard → Project → Settings → Edge Functions → Environment Variables** and add:

### MTN Mobile Money

| Variable | Value | Description |
|---|---|---|
| `MTN_MOMO_SUBSCRIPTION_KEY` | `abc123...` | Primary subscription key from momodeveloper.mtn.com |
| `MTN_MOMO_API_USER` | `f4e2c1a0-...` | UUID of your API user |
| `MTN_MOMO_API_KEY` | `xyz789...` | API key for your user |
| `MTN_MOMO_ENVIRONMENT` | `sandbox` or `production` | Start with `sandbox` for testing |
| `MTN_CURRENCY` | `UGX` | Currency for Uganda (UGX = Uganda Shillings) |

### Airtel Money

| Variable | Value | Description |
|---|---|---|
| `AIRTEL_CLIENT_ID` | `abc123...` | Client ID from Airtel Africa developer portal |
| `AIRTEL_CLIENT_SECRET` | `xyz789...` | Client Secret from Airtel Africa developer portal |
| `AIRTEL_ENVIRONMENT` | `sandbox` or `production` | Start with `sandbox` for testing |
| `AIRTEL_COUNTRY` | `UG` | ISO country code |
| `AIRTEL_CURRENCY` | `UGX` | Currency code |

---

## 4. Deploy the Edge Function

After setting environment variables, redeploy the Edge Function so it picks them up:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project (get the project ref from the Supabase dashboard URL)
supabase link --project-ref <YOUR_PROJECT_REF>

# Deploy
supabase functions deploy make-server-2a4be611
```

Or via the **Supabase Dashboard → Edge Functions → Deploy**.

---

## 5. API Endpoints Added

Your Edge Function now exposes two new endpoints:

### `POST /mobile-payment/initiate`

Initiates an STK push to the donor's phone.

**Request body:**
```json
{
  "provider": "mtn",
  "phone": "256771234567",
  "amount": 50,
  "currency": "USD",
  "donorName": "John Doe",
  "donorEmail": "john@example.com"
}
```

**Response:**
```json
{ "success": true, "referenceId": "uuid-here" }
```

**Error response:**
```json
{ "error": "MTN Mobile Money is not configured on this server. Please contact the admin." }
```

---

### `GET /mobile-payment/status/:referenceId?provider=mtn`

Polls the payment status.

**Response:**
```json
{ "status": "PENDING", "referenceId": "uuid-here" }
```

Possible `status` values:
- `PENDING` — waiting for the donor to enter PIN
- `SUCCESSFUL` — payment confirmed
- `FAILED` — declined, cancelled, or insufficient balance

---

## 6. Currency Note

The donation amount displayed in the UI is in **USD**. The value passed to MTN/Airtel is the same numeric amount but in **UGX** (controlled by `MTN_CURRENCY` / `AIRTEL_CURRENCY`).

If you want to pass the exact UGX equivalent, you can either:
- Set a fixed exchange rate multiplier in your Edge Function (e.g. `amount * 3700`), **or**
- Integrate a live exchange rate API (e.g. `https://open.er-api.com/v6/latest/USD`)

For now the numeric value is passed as-is. Most donors in Uganda will understand the USD amount.

---

## 7. Testing Checklist

- [ ] `MTN_MOMO_SUBSCRIPTION_KEY` set in Supabase env vars
- [ ] `MTN_MOMO_API_USER` and `MTN_MOMO_API_KEY` created and set
- [ ] `MTN_MOMO_ENVIRONMENT=sandbox`
- [ ] `AIRTEL_CLIENT_ID` and `AIRTEL_CLIENT_SECRET` set
- [ ] `AIRTEL_ENVIRONMENT=sandbox`
- [ ] Edge Function redeployed
- [ ] Open donation modal → select MTN → enter `256771234567` → tap Pay Now
- [ ] "Check Your Phone!" waiting screen appears
- [ ] Status polling resolves to SUCCESSFUL (sandbox auto-confirms)
- [ ] Done screen appears and thank-you email is sent
- [ ] Repeat test for Airtel with `256751234567`

---

## 8. Support

- **MTN MoMo API docs:** https://momodeveloper.mtn.com/api-documentation
- **Airtel Africa API docs:** https://developers.airtel.africa/documentation
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
