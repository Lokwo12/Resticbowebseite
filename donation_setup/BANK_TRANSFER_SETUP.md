# Bank Transfer Setup Guide

Bank transfers are a manual, offline payment method. Unlike Stripe or PayPal, no third-party payment gateway is needed. The system records the donor's intent and generates a unique reference number so you can match incoming transfers.

---

## How It Works

1. Donor fills in their name and email in the modal.
2. They see your bank account details and an **automatically generated reference number** (e.g. `BT-M0Z7K3F`).
3. They make the transfer through their own bank, including the reference in the payment description.
4. Your Supabase backend records the donation as **`status: "pending"`** and sends notification emails (if Resend is configured).
5. You manually verify the transfer in your bank and mark it confirmed in the admin dashboard.

---

## Step 1 — Configure Your Bank Details

Bank details are stored in Supabase as site settings. Go to your **Admin Dashboard → Site Settings → Donation Settings** and fill in:

| Field | Example |
|---|---|
| Bank Name | Stanbic Bank Uganda |
| Account Name | Resti Kiryandongo CBO |
| Account Number | 9030012345678 |
| SWIFT / BIC Code | SBICUGKX |

These fields map to `config.bankName`, `config.accountName`, `config.accountNumber`, and `config.swiftCode` in the frontend.

---

## Step 2 — Email Notifications (Optional but Recommended)

When a donor submits, the system posts to the `/donations` endpoint which sends two emails via Resend:
- **Admin email** — notifies you of a new pending transfer.
- **Donor email** — confirms their reference number and amount.

To enable this, add your Resend API key to Supabase:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase functions deploy make-server-2a4be611
```

Get a free API key at [resend.com](https://resend.com). On the free tier, emails can only be sent to verified addresses. To send to any donor, verify your domain in Resend.

---

## Step 3 — Viewing Pending Transfers in the Admin Dashboard

Go to **Admin Dashboard → Donations**. Bank transfers appear with:
- `paymentMethod: bank_transfer`
- `status: pending`
- `transactionId: BT-XXXXXXXX` (the reference number)

Match the reference against your bank statement, then manually mark the donation as confirmed.

---

## Step 4 — Deploying Changes

If you updated bank details in the site settings:
```bash
# No deploy needed — site settings are fetched live from Supabase
```

If you changed the Supabase edge function:
```bash
supabase functions deploy make-server-2a4be611
```

---

## Reference Number Format

References are generated client-side as:
```
BT-{base36(Date.now()).toUpperCase()}
```
Example: `BT-M0Z7K3F`

They are unique per submission and are stored in `transactionId` in the donation record.

---

## Testing Checklist

- [ ] Open the donation modal and select **Bank Transfer**
- [ ] Fill in name and email, click **Confirm Transfer**
- [ ] Verify the success screen shows a reference number (e.g. `BT-M0Z7K3F`)
- [ ] Check the Supabase Admin Dashboard → Donations for the `pending` record
- [ ] If Resend is configured, check your admin email for the notification
- [ ] Copy the reference number and verify the bank details are correct

---

## Security Notes

- No sensitive banking credentials are stored in the frontend or environment variables.
- Donor card/account details are never collected by this method.
- The reference number is non-guessable (timestamp-based base36) but not cryptographically signed. Do not rely solely on it as proof of payment — always verify against your bank statement.
