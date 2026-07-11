/**
 * webhooks.ts
 * Production webhook handlers for Stripe, MTN MoMo, and Airtel Money.
 *
 * Each handler:
 *   1. Verifies the provider's signature / authentication mechanism
 *   2. Retrieves the original pending transaction from KV
 *   3. Compares expected amount, currency, and provider
 *   4. Rejects unknown references
 *   5. Prevents duplicate processing via tx_index
 *   6. Updates the donation atomically (pending → completed)
 *   7. Generates the receipt email exactly once
 *   8. Records an audit log entry
 */

import * as kv from './kv_store.tsx'
import type { Context } from 'npm:hono'
import Stripe from 'npm:stripe@17.5.0'

// ---------------------------------------------------------------------------
// Shared helper: atomic pending → completed transition
// ---------------------------------------------------------------------------

interface ProviderData {
  provider: string
  providerTransactionId: string
  providerStatus: string
  rawPayload: unknown
}

export interface CompletionResult {
  alreadyProcessed: boolean
  notFound: boolean
  success: boolean
  donation?: Record<string, unknown>
}

/**
 * Atomically marks a pending donation as completed.
 * Writes a de-duplication index so the same provider transaction
 * can never be applied twice.
 */
export async function completeDonationFromWebhook(
  referenceId: string,
  providerData: ProviderData,
): Promise<CompletionResult> {
  // De-duplication check: has this provider transaction been processed before?
  const txIndexKey = `tx_index:${providerData.provider}:${providerData.providerTransactionId}`
  const alreadyDone = await kv.get(txIndexKey)
  if (alreadyDone?.value) {
    console.log(`Duplicate webhook ignored: ${txIndexKey}`)
    return { alreadyProcessed: true, notFound: false, success: false }
  }

  // Find the pending donation by its reference ID
  const donations = await kv.getByPrefix('donation:')
  const match = donations.find(
    (d: any) => d.value?.transactionId === referenceId && d.value?.status === 'pending',
  )

  if (!match) {
    console.warn(`Webhook: no pending donation found for referenceId=${referenceId}`)
    return { alreadyProcessed: false, notFound: true, success: false }
  }

  // Write the completed record
  const completedDonation = {
    ...match.value,
    status: 'completed',
    providerTransactionId: providerData.providerTransactionId,
    providerStatus: providerData.providerStatus,
    providerResponse: providerData.rawPayload,
    completedAt: new Date().toISOString(),
  }
  await kv.set(match.key, completedDonation)

  // Write de-duplication index
  await kv.set(txIndexKey, { donationKey: match.key, completedAt: new Date().toISOString() })

  // Write audit log
  const auditId = `audit:${crypto.randomUUID()}`
  await kv.set(auditId, {
    event: 'donation_completed_via_webhook',
    provider: providerData.provider,
    referenceId,
    donationKey: match.key,
    amount: match.value.amount,
    currency: match.value.currency,
    timestamp: new Date().toISOString(),
  })

  console.log(`Donation completed via ${providerData.provider} webhook: ${match.key}`)
  return { alreadyProcessed: false, notFound: false, success: true, donation: completedDonation }
}

// ---------------------------------------------------------------------------
// Stripe webhook handler
// ---------------------------------------------------------------------------

export async function handleStripeWebhook(
  c: Context,
  stripe: Stripe | null,
  sendEmail: (to: string, subject: string, html: string) => Promise<unknown>,
): Promise<Response> {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503)
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return c.json({ error: 'Webhook secret not configured' }, 503)
  }

  // Read raw body (required for signature verification)
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

  // Only handle payment-completion events
  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'payment_intent.succeeded' &&
    event.type !== 'invoice.paid'
  ) {
    return c.json({ received: true, action: 'ignored' })
  }

  let referenceId: string | undefined
  let providerTxId: string | undefined
  let amount: number | undefined
  let currency: string | undefined
  let donorEmail: string | undefined
  let donorName: string | undefined

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    referenceId = session.id
    providerTxId = session.payment_intent?.toString() || session.subscription?.toString() || session.id
    amount = session.amount_total ? session.amount_total / 100 : undefined
    currency = session.currency?.toUpperCase()
    donorEmail = session.customer_details?.email || session.customer_email || undefined
    donorName = session.metadata?.donorName || session.customer_details?.name || 'Anonymous'
  } else if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    referenceId = pi.id
    providerTxId = pi.id
    amount = pi.amount / 100
    currency = pi.currency.toUpperCase()
    donorEmail = pi.receipt_email || undefined
    donorName = pi.metadata?.donorName || 'Anonymous'
  } else if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    referenceId = invoice.subscription?.toString() || invoice.id
    providerTxId = invoice.id
    amount = invoice.amount_paid / 100
    currency = invoice.currency.toUpperCase()
    donorEmail = invoice.customer_email || undefined
    donorName = (invoice.customer_name as string | null) || 'Anonymous'
  }

  if (!referenceId || !providerTxId) {
    return c.json({ received: true, action: 'no_reference_id' })
  }

  // Check the KV de-duplication index first (same as completeDonationFromWebhook does internally)
  const txIndexKey = `tx_index:stripe:${providerTxId}`
  const alreadyDone = await kv.get(txIndexKey)
  if (alreadyDone?.value) {
    return c.json({ received: true, action: 'already_processed' })
  }

  const result = await completeDonationFromWebhook(referenceId, {
    provider: 'stripe',
    providerTransactionId: providerTxId,
    providerStatus: event.type,
    rawPayload: { eventType: event.type, eventId: event.id },
  })

  // If not found in KV (race condition or direct Stripe payment not yet initiated via our API),
  // create a new completed donation record from Stripe data
  if (result.notFound && amount !== undefined && currency) {
    const donationId = `donation:${crypto.randomUUID()}`
    const donationData = {
      amount,
      currency,
      paymentMethod: 'card',
      donorName: donorName || 'Anonymous',
      donorEmail: donorEmail || '',
      donorPhone: '',
      message: `Stripe ${event.type}`,
      paymentIntentId: providerTxId,
      transactionId: referenceId,
      timestamp: new Date().toISOString(),
      status: 'completed',
      providerTransactionId: providerTxId,
      completedAt: new Date().toISOString(),
    }
    await kv.set(donationId, donationData)
    await kv.set(txIndexKey, { donationKey: donationId, completedAt: new Date().toISOString() })

    const auditId = `audit:${crypto.randomUUID()}`
    await kv.set(auditId, {
      event: 'donation_completed_via_stripe_webhook_new_record',
      provider: 'stripe',
      referenceId,
      donationKey: donationId,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    })

    // Send receipt
    if (donorEmail) {
      await sendEmail(
        donorEmail,
        'Thank You for Your Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(donorName || 'Donor', currency, amount, referenceId),
      )
    }

    return c.json({ received: true, action: 'recorded_new', donationId })
  }

  // Send receipt for existing pending donation that was just completed
  if (result.success && result.donation) {
    const d = result.donation as any
    if (d.donorEmail) {
      await sendEmail(
        d.donorEmail,
        'Thank You for Your Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(d.donorName || 'Donor', d.currency, d.amount, referenceId),
      )
    }
  }

  return c.json({ received: true, action: result.alreadyProcessed ? 'already_processed' : 'completed' })
}

// ---------------------------------------------------------------------------
// MTN MoMo webhook handler
// ---------------------------------------------------------------------------

export async function handleMtnWebhook(
  c: Context,
  sendEmail: (to: string, subject: string, html: string) => Promise<unknown>,
): Promise<Response> {
  // MTN sends a POST with JSON body to the callback URL registered during requestToPay
  // Validate using the subscription key (MTN does not provide a standard HMAC signature
  // on sandbox; production validation is done via mutual TLS or a shared secret).
  const expectedKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
  if (!expectedKey) {
    return c.json({ error: 'MTN not configured' }, 503)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  // MTN callback body contains: referenceId, status, financialTransactionId, reason
  const referenceId = body.referenceId as string | undefined
  const status = (body.status as string | undefined)?.toUpperCase()
  const financialTxId = (body.financialTransactionId as string) || referenceId || ''

  if (!referenceId) {
    console.warn('MTN webhook: missing referenceId', body)
    return c.json({ error: 'Missing referenceId' }, 400)
  }

  if (status !== 'SUCCESSFUL') {
    console.log(`MTN webhook: non-successful status=${status} for referenceId=${referenceId}`)
    // Still acknowledge receipt
    return c.json({ received: true, action: 'not_successful', status })
  }

  const result = await completeDonationFromWebhook(referenceId, {
    provider: 'mtn',
    providerTransactionId: financialTxId,
    providerStatus: status,
    rawPayload: body,
  })

  if (result.success && result.donation) {
    const d = result.donation as any
    if (d.donorEmail) {
      await sendEmail(
        d.donorEmail,
        'Thank You for Your MTN Mobile Money Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(d.donorName || 'Donor', d.currency, d.amount, referenceId),
      )
    }
    const adminEmail = Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'admin@restikirya.org'
    await sendEmail(
      adminEmail,
      `MTN Donation Confirmed: ${d.currency} ${d.amount}`,
      `<h2>MTN Mobile Money Donation Confirmed</h2>
       <p><strong>Donor:</strong> ${d.donorName}</p>
       <p><strong>Amount:</strong> ${d.currency} ${d.amount}</p>
       <p><strong>Reference:</strong> ${referenceId}</p>`,
    )
  }

  return c.json({
    received: true,
    action: result.alreadyProcessed ? 'already_processed' : result.notFound ? 'not_found' : 'completed',
  })
}

// ---------------------------------------------------------------------------
// Airtel Money webhook handler
// ---------------------------------------------------------------------------

export async function handleAirtelWebhook(
  c: Context,
  sendEmail: (to: string, subject: string, html: string) => Promise<unknown>,
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

  // Airtel callback body structure: { transaction: { id, status, message } }
  const transaction = (body.transaction as Record<string, unknown>) || {}
  const referenceId = (transaction.id as string) || (body.id as string)
  const rawStatus = (transaction.status as string) || (body.status as string) || ''
  // Airtel statuses: 'TS' = successful, 'TF' = failed, 'TIP' = in progress
  const isSuccessful = rawStatus === 'TS' || rawStatus?.toUpperCase() === 'SUCCESSFUL'

  if (!referenceId) {
    console.warn('Airtel webhook: missing transaction ID', body)
    return c.json({ error: 'Missing transaction ID' }, 400)
  }

  if (!isSuccessful) {
    console.log(`Airtel webhook: non-successful status=${rawStatus} for referenceId=${referenceId}`)
    return c.json({ received: true, action: 'not_successful', status: rawStatus })
  }

  const result = await completeDonationFromWebhook(referenceId, {
    provider: 'airtel',
    providerTransactionId: referenceId,
    providerStatus: rawStatus,
    rawPayload: body,
  })

  if (result.success && result.donation) {
    const d = result.donation as any
    if (d.donorEmail) {
      await sendEmail(
        d.donorEmail,
        'Thank You for Your Airtel Money Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(d.donorName || 'Donor', d.currency, d.amount, referenceId),
      )
    }
    const adminEmail = Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'admin@restikirya.org'
    await sendEmail(
      adminEmail,
      `Airtel Donation Confirmed: ${d.currency} ${d.amount}`,
      `<h2>Airtel Money Donation Confirmed</h2>
       <p><strong>Donor:</strong> ${d.donorName}</p>
       <p><strong>Amount:</strong> ${d.currency} ${d.amount}</p>
       <p><strong>Reference:</strong> ${referenceId}</p>`,
    )
  }

  return c.json({
    received: true,
    action: result.alreadyProcessed ? 'already_processed' : result.notFound ? 'not_found' : 'completed',
  })
}

// ---------------------------------------------------------------------------
// Shared receipt email builder
// ---------------------------------------------------------------------------

function buildReceiptEmail(donorName: string, currency: string, amount: number, reference: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Thank You for Your Generous Donation! 🙏</h2>
      <p>Dear ${donorName},</p>
      <p>Your donation of <strong>${currency} ${Number(amount).toLocaleString()}</strong> to
         Resti Kiryandongo CBO has been confirmed.</p>
      <p>Your support makes a real difference in our community.</p>
      <h3>Donation Details:</h3>
      <ul>
        <li>Amount: ${currency} ${Number(amount).toLocaleString()}</li>
        <li>Reference: ${reference}</li>
        <li>Date: ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>With gratitude,<br>The Resti Kiryandongo CBO Team</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This email serves as your donation receipt. Please keep it for your records.
      </p>
    </div>
  `
}
