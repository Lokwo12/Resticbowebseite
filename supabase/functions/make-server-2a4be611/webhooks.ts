import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Context } from 'npm:hono'
import Stripe from 'npm:stripe@17.5.0'
import { getMtnAccessToken, getAirtelAccessToken } from './tokens.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ProviderData {
  provider: string
  providerTransactionId: string
  providerStatus: string
  expectedAmount?: number
  expectedCurrency?: string
  rawPayload: unknown
}

export interface CompletionResult {
  alreadyProcessed: boolean
  notFound: boolean
  success: boolean
  donation?: Record<string, unknown>
  error?: string
}

export async function completeDonationFromWebhook(
  referenceId: string,
  providerData: ProviderData,
): Promise<CompletionResult> {
  const { data, error } = await supabase.rpc('complete_donation_transactionally', {
    p_reference_id: referenceId,
    p_provider: providerData.provider,
    p_provider_tx_id: providerData.providerTransactionId,
    p_provider_status: providerData.providerStatus,
    p_expected_amount: providerData.expectedAmount || null,
    p_expected_currency: providerData.expectedCurrency || null,
    p_raw_payload: providerData.rawPayload
  })

  if (error) {
    console.error('RPC Error:', error)
    return { alreadyProcessed: false, notFound: false, success: false, error: error.message }
  }

  if (data.notFound) {
    return { alreadyProcessed: false, notFound: true, success: false, error: data.error }
  }

  if (data.alreadyProcessed) {
    return { alreadyProcessed: true, notFound: false, success: false, error: data.error }
  }

  if (!data.success) {
    return { alreadyProcessed: false, notFound: false, success: false, error: data.error }
  }

  const donation = data.donation

  // Idempotency: Send receipt only if not already sent
  const { data: claimData, error: claimError } = await supabase.rpc('claim_donation_receipt', { p_donation_id: donation.id })
  
  if (claimError || !claimData?.success) {
    // Already claimed or not found
    return { alreadyProcessed: true, notFound: false, success: true }
  }
  


  return { alreadyProcessed: false, notFound: false, success: true, donation }
}

// Resolve admin notification emails
export async function getAdminNotifyEmails(): Promise<string[]> {
  const recipients = new Set<string>()

  // 1. Guaranteed deliverable Resend account owner
  recipients.add('lokwodenis0@gmail.com')

  // 2. Configured ADMIN_NOTIFY_EMAIL env variable if set
  const envNotify = Deno.env.get('ADMIN_NOTIFY_EMAIL')
  if (envNotify) {
    envNotify
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'))
      .forEach((e) => recipients.add(e))
  }

  // 3. Active admin emails from database
  try {
    const { data: admins } = await supabase
      .from('admin_users')
      .select('email')
      .eq('status', 'active')
    if (admins && admins.length > 0) {
      for (const a of admins) {
        if (a?.email && typeof a.email === 'string' && a.email.includes('@')) {
          recipients.add(a.email.trim().toLowerCase())
        }
      }
    }
  } catch (err) {
    console.warn('Error reading admin_users table for notification emails:', err)
  }

  return Array.from(recipients)
}

export function buildReceiptEmail(
  donorName: string,
  currency: string,
  amount: number,
  reference: string,
  method?: string,
  dateStr?: string
): string {
  const receiptNum = `RESTI-REC-${reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}`
  const formattedAmount = `${currency.toUpperCase()} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const dateDisplay = dateStr || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .receipt-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
        .header h1 { margin: 8px 0 0 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .content { padding: 32px 28px; }
        .amount-banner { background: #ecfdf5; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0 28px 0; }
        .amount-val { font-size: 32px; font-weight: 800; color: #047857; margin: 4px 0 0 0; }
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .receipt-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .receipt-table td.lbl { font-weight: 600; color: #64748b; width: 150px; }
        .receipt-table td.val { color: #0f172a; font-weight: 600; text-align: right; }
        .impact-box { background: #f8fafc; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 4px; font-size: 13px; color: #475569; margin: 24px 0; line-height: 1.6; }
        .legal-note { font-size: 11px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="badge">Official Donation Receipt</div>
          <h1>RESTI-CBO</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Refugee and Host Community Empowerment • Kiryandongo District, Uganda</p>
        </div>
        <div class="content">
          <p style="margin-top: 0; font-size: 16px;">Dear <strong>${donorName}</strong>,</p>
          <p style="color: #475569; font-size: 14px;">Thank you for your generous gift. Your contribution has been successfully processed and received. Please keep this message as your official donation receipt for tax and accounting records.</p>
          
          <div class="amount-banner">
            <div style="font-size: 12px; font-weight: 600; color: #065f46; text-transform: uppercase;">Total Donation Amount</div>
            <div class="amount-val">${formattedAmount}</div>
          </div>

          <table class="receipt-table">
            <tr>
              <td class="lbl">Receipt Number:</td>
              <td class="val">${receiptNum}</td>
            </tr>
            <tr>
              <td class="lbl">Transaction Reference:</td>
              <td class="val" style="font-family: monospace; font-size: 13px;">${reference}</td>
            </tr>
            <tr>
              <td class="lbl">Payment Method:</td>
              <td class="val">${method || 'Secure Online Payment'}</td>
            </tr>
            <tr>
              <td class="lbl">Payment Date:</td>
              <td class="val">${dateDisplay}</td>
            </tr>
            <tr>
              <td class="lbl">Status:</td>
              <td class="val" style="color: #059669;">Completed & Verified</td>
            </tr>
            <tr>
              <td class="lbl">Organization:</td>
              <td class="val">RESTI-CBO (Uganda NGO Bureau)</td>
            </tr>
          </table>

          <div class="impact-box">
            <strong>Where your support goes:</strong><br>
            Your contribution directly powers education scholarships, refugee vocational livelihoods, maternal & community health services, and clean water access across Kiryandongo District, Uganda.
          </div>

          <div class="legal-note">
            RESTI-CBO is a legally registered Community-Based Organization operating under the regulatory oversight of the Uganda NGO Bureau. No goods or services were provided in exchange for this contribution other than intangible religious or charitable benefits.
          </div>
        </div>
        <div class="footer">
          With deep gratitude,<br>
          <strong>The RESTI-CBO Team & Community Leadership</strong><br>
          Kiryandongo District, Uganda • <a href="https://resticbo.org" style="color: #059669; text-decoration: none;">www.resticbo.org</a> • <a href="mailto:info@resticbo.org" style="color: #059669; text-decoration: none;">info@resticbo.org</a>
        </div>
      </div>
    </body>
    </html>
  `
}

export function buildAdminDonationAlertEmail(donation: any, isSuccess: boolean, failureReason?: string): string {
  const donorName = `${donation.first_name || donation.donorName || ''} ${donation.last_name || ''}`.trim() || 'Anonymous Donor'
  const currency = (donation.currency || 'USD').toUpperCase()
  const amount = Number(donation.amount || 0)
  const formattedAmount = `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const email = donation.email || donation.donorEmail || ''
  const phone = donation.phone || donation.donorPhone || ''
  const reference = donation.transaction_id || donation.id || 'N/A'
  const method = donation.method || donation.provider || 'Card'
  const timestamp = new Date().toUTCString()

  const headerGradient = isSuccess
    ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
    : 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)'
  const statusBadge = isSuccess ? 'CONFIRMED / COMPLETED' : 'PAYMENT FAILED / DECLINED'
  const statusBadgeColor = isSuccess ? '#ecfdf5' : '#fef2f2'
  const statusTextColor = isSuccess ? '#047857' : '#991b1b'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .alert-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: ${headerGradient}; color: #ffffff; padding: 28px; text-align: center; }
        .header h1 { margin: 6px 0 0 0; font-size: 22px; font-weight: 700; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .content { padding: 28px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-table td.lbl { font-weight: 600; color: #64748b; width: 140px; }
        .info-table td.val { color: #0f172a; font-weight: 500; }
        .status-pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background: ${statusBadgeColor}; color: ${statusTextColor}; }
        .action-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; text-align: center; margin-top: 20px; }
        .action-btn { display: inline-block; background: ${isSuccess ? '#059669' : '#dc2626'}; color: #ffffff !important; text-decoration: none; padding: 9px 20px; border-radius: 6px; font-weight: 600; font-size: 13px; margin-top: 8px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="alert-card">
        <div class="header">
          <div class="badge">${isSuccess ? '🎉 Donation Alert' : '⚠️ Payment Warning'}</div>
          <h1>${isSuccess ? 'New Donation Received' : 'Donation Payment Failed'}</h1>
        </div>
        <div class="content">
          <p style="margin-top: 0; font-size: 15px; color: #475569;">
            ${isSuccess 
              ? `A donor has successfully completed a donation on <strong>RESTI-CBO</strong>:` 
              : `A donation attempt has failed or was declined on <strong>RESTI-CBO</strong>:`}
          </p>

          <table class="info-table">
            <tr>
              <td class="lbl">Amount:</td>
              <td class="val"><strong style="font-size: 18px; color: ${isSuccess ? '#047857' : '#dc2626'};">${formattedAmount}</strong></td>
            </tr>
            <tr>
              <td class="lbl">Status:</td>
              <td class="val"><span class="status-pill">${statusBadge}</span></td>
            </tr>
            <tr>
              <td class="lbl">Donor Name:</td>
              <td class="val"><strong>${donorName}</strong></td>
            </tr>
            <tr>
              <td class="lbl">Donor Email:</td>
              <td class="val">${email ? `<a href="mailto:${email}" style="color:#059669; font-weight:600; text-decoration:none;">${email}</a>` : '<span style="color:#94a3b8;">Not provided</span>'}</td>
            </tr>
            <tr>
              <td class="lbl">Donor Phone:</td>
              <td class="val">${phone || '<span style="color:#94a3b8;">Not provided</span>'}</td>
            </tr>
            <tr>
              <td class="lbl">Payment Method:</td>
              <td class="val">${method}</td>
            </tr>
            <tr>
              <td class="lbl">Reference ID:</td>
              <td class="val" style="font-family: monospace; font-size: 13px;">${reference}</td>
            </tr>
            ${!isSuccess && failureReason ? `
            <tr>
              <td class="lbl">Failure Reason:</td>
              <td class="val" style="color: #dc2626; font-weight: 600;">${failureReason}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="lbl">Timestamp:</td>
              <td class="val">${timestamp}</td>
            </tr>
          </table>

          <div class="action-box">
            ${isSuccess ? `
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #475569;">The official receipt has been dispatched to the donor. You can view the full record in your Admin Dashboard.</p>
              ${email ? `<a href="mailto:${email}?subject=${encodeURIComponent('Thank you for your donation to RESTI-CBO')}" class="action-btn">Send Personal Thank You</a>` : ''}
            ` : `
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #475569;">You can reach out to the donor to offer alternative payment options (Mobile Money, Bank Wire, PayPal).</p>
              ${email ? `<a href="mailto:${email}?subject=${encodeURIComponent('Assistance with your RESTI-CBO donation')}" class="action-btn">Contact Donor to Assist</a>` : ''}
            `}
          </div>
        </div>
        <div class="footer">
          RESTI-CBO Real-Time Donation Monitoring • Kiryandongo District, Uganda
        </div>
      </div>
    </body>
    </html>
  `
}

// Deliver donation receipt to donor AND alert admin in real-time
export async function deliverDonationReceipt(
  donation: any,
  sendEmail: (to: string, subject: string, html: string, replyTo?: string) => Promise<any>
) {
  if (!donation || !donation.id) return { success: false, error: 'invalid_donation' }

  const email = donation.email || donation.donorEmail || null
  const donorName = `${donation.first_name || donation.donorName || ''} ${donation.last_name || ''}`.trim() || 'Generous Donor'
  const currency = (donation.currency || 'USD').toUpperCase()
  const amount = Number(donation.amount || 0)
  const reference = donation.transaction_id || donation.id || 'RESTI-DONATION'
  const method = donation.method || donation.provider || 'Card'
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // 1. Deliver official receipt to the donor
  let donorEmailSuccess = false
  if (email) {
    try {
      const emailRes = await sendEmail(
        email,
        `Official Donation Receipt – RESTI-CBO (Ref: ${reference.slice(0, 8).toUpperCase()})`,
        buildReceiptEmail(donorName, currency, amount, reference, method, formattedDate),
        'info@resticbo.org'
      )
      donorEmailSuccess = !!emailRes?.success
      await supabase.from('donations').update({
        receipt_status: donorEmailSuccess ? 'sent' : 'failed',
        receipt_sent_at: donorEmailSuccess ? new Date().toISOString() : null,
        receipt_message_id: emailRes?.data?.id || null,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', donation.id)
    } catch (err) {
      console.error('deliverDonationReceipt donor email error:', err)
      await supabase.from('donations').update({ receipt_status: 'failed' }).eq('id', donation.id)
    }
  } else {
    await supabase.from('donations').update({ receipt_status: 'no_email', status: 'completed' }).eq('id', donation.id)
  }

  // 2. Sync to KV store for real-time admin dashboard widgets
  try {
    const kvStore = await import('./kv_store.tsx')
    await kvStore.set(`donation:${donation.id}`, {
      ...donation,
      status: 'completed',
      receipt_status: donorEmailSuccess ? 'sent' : 'failed',
      updated_at: new Date().toISOString()
    })
  } catch (kvErr) {
    console.warn('Could not sync completed donation to kv_store:', kvErr)
  }

  // 3. Dispatch real-time alert to all admin inboxes
  try {
    const adminRecipients = await getAdminNotifyEmails()
    const adminAlertHtml = buildAdminDonationAlertEmail(donation, true)
    for (const adminTo of adminRecipients) {
      console.log(`Dispatching successful donation alert to admin: ${adminTo}`)
      await sendEmail(
        adminTo,
        `🎉 New Donation Received: ${currency} ${amount.toLocaleString()} from ${donorName} - RESTI-CBO`,
        adminAlertHtml,
        email || 'info@resticbo.org'
      )
    }
  } catch (adminErr) {
    console.error('Failed to notify admin of successful donation:', adminErr)
  }

  return { success: true }
}

// Alert admin when a donation fails or is declined
export async function notifyAdminFailedDonation(
  donationDetails: any,
  sendEmail: (to: string, subject: string, html: string, replyTo?: string) => Promise<any>,
  failureReason?: string
) {
  const donorName = `${donationDetails.first_name || donationDetails.donorName || ''} ${donationDetails.last_name || ''}`.trim() || 'Anonymous Donor'
  const currency = (donationDetails.currency || 'USD').toUpperCase()
  const amount = Number(donationDetails.amount || 0)
  const email = donationDetails.email || donationDetails.donorEmail || null
  const reference = donationDetails.transaction_id || donationDetails.id || 'N/A'
  const reason = failureReason || donationDetails.error || 'Payment declined or cancelled by provider'

  // 1. Update database status to failed if record exists
  if (donationDetails.id || donationDetails.transaction_id) {
    try {
      const matchKey = donationDetails.id ? { id: donationDetails.id } : { transaction_id: donationDetails.transaction_id }
      await supabase.from('donations').update({
        status: 'failed',
        provider_response: { failureReason: reason, failedAt: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }).match(matchKey)
    } catch (dbErr) {
      console.warn('Could not update failed donation status in DB:', dbErr)
    }

    try {
      const kvStore = await import('./kv_store.tsx')
      const targetId = donationDetails.id || `donation:${donationDetails.transaction_id}`
      await kvStore.set(targetId, {
        ...donationDetails,
        status: 'failed',
        failureReason: reason,
        updated_at: new Date().toISOString()
      })
    } catch (kvErr) {
      console.warn('Could not update failed donation in kv_store:', kvErr)
    }
  }

  // 2. Dispatch failed donation alert to admin
  try {
    const adminRecipients = await getAdminNotifyEmails()
    const adminAlertHtml = buildAdminDonationAlertEmail(donationDetails, false, reason)
    for (const adminTo of adminRecipients) {
      console.log(`Dispatching failed donation alert to admin: ${adminTo}`)
      await sendEmail(
        adminTo,
        `⚠️ Failed Donation Attempt: ${currency} ${amount.toLocaleString()} - ${donorName}`,
        adminAlertHtml,
        email || 'info@resticbo.org'
      )
    }
  } catch (adminErr) {
    console.error('Failed to notify admin of failed donation:', adminErr)
  }

  return { success: true }
}

export async function handleStripeWebhook(
  c: Context,
  stripe: Stripe | null,
  sendEmail: (to: string, subject: string, html: string) => Promise<any>,
): Promise<Response> {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503)
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return c.json({ error: 'Webhook secret not configured' }, 503)
  }

  const rawBody = await c.req.text()
  const signature = c.req.header('Stripe-Signature')

  if (!signature) {
    return c.json({ error: 'Missing Stripe-Signature header' }, 400)
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return c.json({ error: 'Invalid webhook signature' }, 400)
  }

  console.log(`Stripe webhook event received: ${event.type}`)

  const { error: eventErr } = await supabase.from('payment_webhook_events').insert({
    provider: 'stripe',
    event_id: event.id,
    event_type: event.type
  })
  if (eventErr && eventErr.code === '23505') {
    return c.json({ received: true, action: 'already_processed' })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    // If this payment intent was created by a Checkout Session, ignore it to prevent duplicates
    if (pi.metadata?.checkoutSessionId || pi.invoice || (pi as any).checkout) {
      return c.json({ received: true, action: 'ignored_checkout_duplicate' })
    }
  }

  const acceptedStripeEvents = new Set([
    "checkout.session.completed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.failed",
    "invoice.payment_succeeded",
  ]);

  if (!acceptedStripeEvents.has(event.type)) {
    return c.json({
      received: true,
      action: "ignored",
    });
  }

  // Handle failed payment events from Stripe
  if (event.type === 'payment_intent.payment_failed' || event.type === 'charge.failed') {
    const obj = event.data.object as any
    const failureReason = obj.last_payment_error?.message || obj.failure_message || 'Card payment declined or failed'
    const failedDonation = {
      id: obj.metadata?.restiDonationId ? `donation:${obj.metadata.restiDonationId}` : obj.id,
      transaction_id: obj.metadata?.restiDonationId || obj.id,
      amount: (obj.amount || obj.amount_total || 0) / 100,
      currency: (obj.currency || 'USD').toUpperCase(),
      donorName: obj.metadata?.donorName || obj.billing_details?.name || 'Card Donor',
      email: obj.receipt_email || obj.metadata?.donorEmail || obj.billing_details?.email || '',
      method: 'Credit / Debit Card (Stripe)',
      provider: 'stripe',
    }
    await notifyAdminFailedDonation(failedDonation, sendEmail, failureReason)
    return c.json({ received: true, action: 'failure_alert_dispatched', error: failureReason })
  }

  let referenceId: string | undefined
  let providerTxId: string | undefined
  let amount: number | undefined
  let currency: string | undefined
  let donorEmail: string | undefined
  let donorName: string | undefined
  let metadata: Stripe.Metadata | undefined

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as any
    if (invoice.billing_reason === 'subscription_create') {
      const { error: subErr } = await supabase.from('subscriptions').insert({
        id: `sub:${crypto.randomUUID()}`,
        donor_id: invoice.customer?.toString(),
        provider_subscription_id: invoice.subscription?.toString(),
        status: 'active',
        plan: invoice.lines?.data?.[0]?.plan?.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase()
      })
      if (subErr) {
        if (subErr.code === '23505') {
          return c.json({ received: true, action: 'already_processed' })
        }
        console.error('Error creating subscription:', subErr)
        return c.json({ received: true, action: 'subscription_creation_failed' }, 500)
      }
      return c.json({ received: true, action: 'subscription_created' })
    } else if (invoice.billing_reason === 'subscription_cycle') {
      const subId = invoice.subscription?.toString()
      const txId = invoice.payment_intent?.toString() || invoice.id
      const amountPaid = invoice.amount_paid / 100
      const cur = invoice.currency.toUpperCase()
      const newDonationId = `donation:${crypto.randomUUID()}`
      
      await supabase.from('donations').insert({
        id: newDonationId,
        amount: amountPaid,
        currency: cur,
        method: 'card_recurring',
        provider: 'stripe',
        first_name: invoice.customer_name?.split(' ')[0] || 'Anonymous',
        last_name: invoice.customer_name?.split(' ').slice(1).join(' ') || '',
        email: invoice.customer_email || '',
        status: 'completed',
        transaction_id: txId,
        provider_transaction_id: txId,
        provider_response: { eventType: event.type, eventId: event.id }
      })
      
      const { data: subData } = await supabase.from('subscriptions').select('id').eq('provider_subscription_id', subId).single()
      if (subData) {
        await supabase.from('subscription_payments').insert({
          id: `subpay:${crypto.randomUUID()}`,
          subscription_id: subData.id,
          donation_id: newDonationId,
          invoice_id: invoice.id,
          amount: amountPaid,
          currency: cur
        })
      }
      
      const { data: claim } = await supabase.rpc('claim_donation_receipt', { p_donation_id: newDonationId })
      if (claim?.success) {
        await deliverDonationReceipt({
          id: newDonationId,
          amount: amountPaid,
          currency: cur,
          email: invoice.customer_email,
          first_name: invoice.customer_name?.split(' ')[0],
          last_name: invoice.customer_name?.split(' ').slice(1).join(' '),
          transaction_id: txId
        }, sendEmail)
      }
      return c.json({ received: true, action: 'renewal_processed' })
    }
    return c.json({ received: true, action: 'ignored_invoice' })
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    referenceId = session.id
    providerTxId = session.payment_intent?.toString() || session.id
    amount = session.amount_total ? session.amount_total / 100 : undefined
    currency = session.currency?.toUpperCase()
    donorEmail = session.customer_details?.email || session.customer_email || undefined
    donorName = session.metadata?.donorName || session.customer_details?.name || 'Anonymous'
    metadata = session.metadata || {}
  } else if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    referenceId = pi.id
    providerTxId = pi.id
    amount = pi.amount / 100
    currency = pi.currency.toUpperCase()
    donorEmail = pi.receipt_email || undefined
    donorName = pi.metadata?.donorName || 'Anonymous'
    metadata = pi.metadata || {}
  }

  if (!referenceId || !providerTxId) {
    return c.json({ received: true, action: 'no_reference_id' })
  }

  const dbReferenceId = metadata?.restiDonationId || referenceId

  const result = await completeDonationFromWebhook(dbReferenceId, {
    provider: 'stripe',
    providerTransactionId: providerTxId,
    providerStatus: event.type,
    expectedAmount: amount,
    expectedCurrency: currency,
    rawPayload: { eventType: event.type, eventId: event.id },
  })

  if (result.notFound) {
    if (amount && amount > 0) {
      const parts = (donorName || 'Generous Donor').split(' ')
      const firstName = parts[0] || 'Generous'
      const lastName = parts.slice(1).join(' ') || ''
      const newDonationId = `donation:${dbReferenceId}`
      const donationRecord = {
        id: newDonationId,
        amount: Number(amount),
        currency: (currency || 'USD').toUpperCase(),
        method: 'card',
        provider: 'stripe',
        first_name: firstName,
        last_name: lastName,
        email: donorEmail || '',
        status: 'completed',
        transaction_id: dbReferenceId,
        provider_transaction_id: providerTxId,
        provider_response: { eventType: event.type, eventId: event.id },
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: inserted, error: insertError } = await supabase
        .from('donations')
        .upsert(donationRecord, { onConflict: 'id' })
        .select()
        .single()

      if (!insertError && inserted) {
        await deliverDonationReceipt(inserted, sendEmail)
        return c.json({ received: true, action: 'completed_and_created' })
      } else if (insertError) {
        console.error('Failed to create completed donation:', insertError)
      }
    }

    const isRestiDonation = metadata?.paymentPurpose === 'resti_donation' && 
                            metadata?.restiDonationId && 
                            metadata?.internalReference && 
                            metadata?.campaignId;

    if (isRestiDonation) {
      // Record unmatched payment
      const { error: insertError } = await supabase.from('unmatched_payments').insert({
        id: `unmatched:${crypto.randomUUID()}`,
        provider: 'stripe',
        provider_transaction_id: providerTxId,
        amount,
        currency,
        metadata: metadata,
        raw_payload: { eventType: event.type, eventId: event.id }
      })
      
      if (insertError) {
        console.error('Failed to create unmatched payment:', insertError)
        return c.json({ received: true, action: 'error_creating_unmatched' })
      }
    }
    return c.json({ received: true, action: 'unmatched_payment_requires_review' })
  }

  if (result.success && result.donation) {
    const d = result.donation as any
    await deliverDonationReceipt(d, sendEmail)
  }

  return c.json({ received: true, action: result.alreadyProcessed ? 'already_processed' : 'completed', error: result.error })
}

export async function handleMtnWebhook(
  c: Context,
  sendEmail: (to: string, subject: string, html: string) => Promise<any>,
): Promise<Response> {
  const env = Deno.env.get('MTN_MOMO_ENVIRONMENT') || 'sandbox'
  const subKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
  
  if (!subKey) {
    return c.json({ error: 'MTN not configured' }, 503)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const referenceId = body.referenceId as string | undefined
  const status = (body.status as string | undefined)?.toUpperCase()
  
  if (!referenceId) {
    return c.json({ error: 'Missing referenceId' }, 400)
  }

  if (status !== 'SUCCESSFUL') {
    const failedDonation = {
      transaction_id: referenceId,
      amount: parseFloat(String(body.amount || 0)),
      currency: String(body.currency || 'UGX'),
      method: 'MTN Mobile Money',
      provider: 'mtn',
      donorName: String(body.donorName || 'MTN Mobile Money Donor'),
      email: String(body.donorEmail || ''),
    }
    await notifyAdminFailedDonation(failedDonation, sendEmail, `MTN Mobile Money transaction status: ${status}`)
    return c.json({ received: true, action: 'not_successful', status })
  }

  // Server-to-Server Verification
  const mtnHost = env === 'sandbox' ? 'sandbox.momodeveloper.mtn.com' : 'proxy.momoapi.mtn.com'
  
  let accessToken: string;
  try {
    accessToken = await getMtnAccessToken()
  } catch (err) {
    console.error('Failed to get MTN access token:', err)
    return c.json({ error: 'Unable to verify transaction' }, 503)
  }

  const verifyRes = await fetch(`https://${mtnHost}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Ocp-Apim-Subscription-Key': subKey,
      'X-Target-Environment': env
    }
  })

  if (!verifyRes.ok) {
    console.error('MTN Verification failed:', await verifyRes.text())
    return c.json({ error: 'Verification failed' }, 400)
  }

  const verifyData = await verifyRes.json()
  
  if (verifyData.status?.toUpperCase() !== 'SUCCESSFUL') {
    const failedDonation = {
      transaction_id: referenceId,
      amount: parseFloat(verifyData.amount || 0),
      currency: verifyData.currency || 'UGX',
      method: 'MTN Mobile Money',
      provider: 'mtn',
      donorName: 'MTN Mobile Money Donor',
    }
    await notifyAdminFailedDonation(failedDonation, sendEmail, `MTN verified status: ${verifyData.status}`)
    return c.json({ error: 'Verified status is not successful' }, 400)
  }

  const financialTxId = (verifyData.financialTransactionId as string) || referenceId

  const result = await completeDonationFromWebhook(referenceId, {
    provider: 'mtn',
    providerTransactionId: financialTxId,
    providerStatus: verifyData.status,
    expectedAmount: parseFloat(verifyData.amount),
    expectedCurrency: verifyData.currency,
    rawPayload: verifyData,
  })

  if (result.success && result.donation) {
    const d = result.donation as any
    await deliverDonationReceipt(d, sendEmail)
  }

  return c.json({
    received: true,
    action: result.alreadyProcessed ? 'already_processed' : result.notFound ? 'not_found' : 'completed',
    error: result.error
  })
}

export async function handleAirtelWebhook(
  c: Context,
  sendEmail: (to: string, subject: string, html: string) => Promise<any>,
): Promise<Response> {
  const clientId = Deno.env.get('AIRTEL_CLIENT_ID')
  if (!clientId) {
    return c.json({ error: 'Airtel not configured' }, 503)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const transaction = (body.transaction as Record<string, unknown>) || {}
  const referenceId = (transaction.id as string) || (body.id as string)

  if (!referenceId) {
    return c.json({ error: 'Missing transaction ID' }, 400)
  }

  // Server-to-Server Verification (Standard API call for Airtel transaction status)
  const env = Deno.env.get('AIRTEL_ENVIRONMENT') || 'sandbox'
  const airtelHost = env === 'sandbox' ? 'openapiuat.airtel.africa' : 'openapi.airtel.africa'
  const country = Deno.env.get('AIRTEL_COUNTRY') || 'UG'
  const currency = Deno.env.get('AIRTEL_CURRENCY') || 'UGX'
  
  let accessToken: string;
  try {
    accessToken = await getAirtelAccessToken()
  } catch (err) {
    console.error('Failed to get Airtel access token:', err)
    return c.json({ error: 'Unable to verify transaction' }, 503)
  }

  const verifyRes = await fetch(`https://${airtelHost}/standard/v1/payments/${referenceId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-Country': country,
      'X-Currency': currency,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!verifyRes.ok) {
    return c.json({ received: true, action: 'not_verified' })
  }

  const verifyData = await verifyRes.json()
  const verifiedStatus = verifyData.data?.transaction?.status || 'TF'
  const verifiedAmount = verifyData.data?.transaction?.amount
  const verifiedCurrency = verifyData.data?.transaction?.currency || currency

  const isSuccessful = verifiedStatus === 'TS' || verifiedStatus?.toUpperCase() === 'SUCCESSFUL'

  if (!isSuccessful) {
    const failedDonation = {
      transaction_id: referenceId,
      amount: verifiedAmount,
      currency: verifiedCurrency,
      method: 'Airtel Money',
      provider: 'airtel',
      donorName: 'Airtel Money Donor',
    }
    await notifyAdminFailedDonation(failedDonation, sendEmail, `Airtel payment status: ${verifiedStatus}`)
    return c.json({ received: true, action: 'not_successful', status: verifiedStatus })
  }

  const result = await completeDonationFromWebhook(referenceId, {
    provider: 'airtel',
    providerTransactionId: referenceId,
    providerStatus: verifiedStatus,
    expectedAmount: verifiedAmount,
    expectedCurrency: verifiedCurrency,
    rawPayload: body,
  })

  if (result.success && result.donation) {
    const d = result.donation as any
    await deliverDonationReceipt(d, sendEmail)
  }

  return c.json({
    received: true,
    action: result.alreadyProcessed ? 'already_processed' : result.notFound ? 'not_found' : 'completed',
    error: result.error
  })
}


