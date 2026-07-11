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

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    // If this payment intent was created by a Checkout Session, ignore it to prevent duplicates
    if (pi.metadata?.checkoutSessionId || pi.invoice || (pi as any).checkout) {
      return c.json({ received: true, action: 'ignored_checkout_duplicate' })
    }
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'payment_intent.succeeded'
  ) {
    return c.json({ received: true, action: 'ignored' })
  }

  let referenceId: string | undefined
  let providerTxId: string | undefined
  let amount: number | undefined
  let currency: string | undefined
  let donorEmail: string | undefined
  let donorName: string | undefined
  let metadata: Stripe.Metadata | undefined

  if (event.type === 'checkout.session.completed') {
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
    if (d.email) {
      const emailRes: any = await sendEmail(
        d.email,
        'Thank You for Your Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(`${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Donor', d.currency, d.amount, referenceId),
      )
      await supabase.from('donations').update({ receipt_status: emailRes?.success ? 'sent' : 'failed', receipt_sent_at: new Date().toISOString(), receipt_message_id: emailRes?.data?.id || null }).eq('id', d.id)
    } else {
      await supabase.from('donations').update({ receipt_status: 'sent' }).eq('id', d.id)
    }
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
    if (d.email) {
      const emailRes: any = await sendEmail(
        d.email,
        'Thank You for Your MTN Mobile Money Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(`${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Donor', d.currency, d.amount, referenceId),
      )
      await supabase.from('donations').update({ receipt_status: emailRes?.success ? 'sent' : 'failed', receipt_sent_at: new Date().toISOString(), receipt_message_id: emailRes?.data?.id || null }).eq('id', d.id)
    } else {
      await supabase.from('donations').update({ receipt_status: 'sent' }).eq('id', d.id)
    }
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
    if (d.email) {
      const emailRes: any = await sendEmail(
        d.email,
        'Thank You for Your Airtel Money Donation – Resti Kiryandongo CBO',
        buildReceiptEmail(`${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Donor', d.currency, d.amount, referenceId),
      )
      await supabase.from('donations').update({ receipt_status: emailRes?.success ? 'sent' : 'failed', receipt_sent_at: new Date().toISOString(), receipt_message_id: emailRes?.data?.id || null }).eq('id', d.id)
    } else {
      await supabase.from('donations').update({ receipt_status: 'sent' }).eq('id', d.id)
    }
  }

  return c.json({
    received: true,
    action: result.alreadyProcessed ? 'already_processed' : result.notFound ? 'not_found' : 'completed',
    error: result.error
  })
}

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
