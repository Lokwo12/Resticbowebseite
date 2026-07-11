import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import type { Context, Next } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.5.0'
import * as kv from './kv_store.tsx'
import { escapeHtml, escapeMessage, validateName, validateEmail, validatePhone, validateMessage, validateAmount, validateMobileMoneyPhone, normaliseUgandanPhone } from './validation.ts'
import { withRateLimit } from './rateLimit.ts'
import { handleStripeWebhook, handleMtnWebhook, handleAirtelWebhook, completeDonationFromWebhook, deliverDonationReceipt } from './webhooks.ts'
import { getMtnAccessToken, getAirtelAccessToken } from './tokens.ts'

const app = new Hono()

// ── CORS: restrict to approved origins only ──────────────────────────────────
const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') || ''
).split(',').filter(Boolean)

if (ALLOWED_ORIGINS.length === 0) {
  console.warn('WARNING: ALLOWED_ORIGINS is not set. API will reject all CORS requests.')
}

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return ''
    return ALLOWED_ORIGINS.includes(origin) ? origin : ''
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use('*', logger())

// ── requireAdmin middleware ───────────────────────────────────────────────────
// Verifies the Bearer JWT, then checks the admin_users table for active status and role.
async function requireAdmin(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token) {
    return c.json({ error: 'Unauthorized – authentication required' }, 401)
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return c.json({ error: 'Unauthorized – invalid or expired token' }, 401)
  }
  
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (
    adminError ||
    !admin ||
    admin.status !== 'active' ||
    !['admin', 'super-admin'].includes(admin.role)
  ) {
    return c.json({ error: 'Forbidden – administrator role required' }, 403)
  }

  // Make the authenticated user available to route handlers
  c.set('adminUser', {
    id: user.id,
    email: user.email,
    role: admin.role,
  })
  await next()
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
}) : null

// Validate email configuration at startup
const resendApiKey = Deno.env.get('RESEND_API_KEY')
const adminEmail = Deno.env.get('ADMIN_EMAIL')
const adminNotifyEmail = Deno.env.get('ADMIN_NOTIFY_EMAIL')

if (!resendApiKey) console.error('CRITICAL WARNING: RESEND_API_KEY is not set. Emails will not send.')
if (!adminEmail) console.error('CRITICAL WARNING: ADMIN_EMAIL is not set. Defaulting sender to Resend sandbox.')
if (!adminNotifyEmail) console.error('CRITICAL WARNING: ADMIN_NOTIFY_EMAIL is not set. Admin notifications will fail.')

// Email notification helper
async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.log('Resend API key not configured, skipping email')
    return { success: false, message: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('ADMIN_EMAIL') || 'Resti Kiryandongo CBO <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Email send error:', data)
      return { success: false, error: data }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error: String(error) }
  }
}

// Contact form submission with email notification
app.post('/make-server-2a4be611/contact', withRateLimit('contact', 5, 10 * 60_000), async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, message } = body

    const nameV = validateName(name)
    const emailV = validateEmail(email)
    const phoneV = validatePhone(phone)
    const msgV = validateMessage(message)

    if (!nameV.ok) return c.json({ error: nameV.error }, 400)
    if (!emailV.ok) return c.json({ error: emailV.error }, 400)
    if (!phoneV.ok) return c.json({ error: phoneV.error }, 400)
    if (!msgV.ok) return c.json({ error: msgV.error }, 400)

    const safeName = escapeHtml(name.trim())
    const safeEmail = escapeHtml(email.trim())
    const safePhone = escapeHtml(phone || '')
    const safeMessage = escapeMessage(message)

    const contactId = `contact:${crypto.randomUUID()}`
    await kv.set(contactId, {
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      message,
      timestamp: new Date().toISOString(),
      status: 'new'
    })

    const adminNotify = Deno.env.get('ADMIN_NOTIFY_EMAIL')
    if (!adminNotify) {
      console.error('Cannot send admin notification: ADMIN_NOTIFY_EMAIL not configured')
    } else {
      // Send notification email to admin
      await sendEmail(
        adminNotify,
        'New Contact Form Submission',
        `
          <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <hr>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
      )
    }

    // Send confirmation email to submitter
    await sendEmail(
      email.trim(),
      'Thank you for contacting Resti Kiryandongo CBO',
      `
        <h2>Thank You for Reaching Out!</h2>
        <p>Dear ${safeName},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${safeMessage}</p>
        <br>
        <p>Best regards,</p>
        <p>Resti Kiryandongo CBO Team</p>
      `
    )

    console.log(`Contact form submitted: ${contactId}`)
    return c.json({ success: true, message: 'Contact form submitted successfully' })
  } catch (error) {
    console.error('Error submitting contact form:', error)
    return c.json({ error: 'Failed to submit contact form', details: String(error) }, 500)
  }
})

// Get all programs
app.get('/make-server-2a4be611/programs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('program:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ programs: data, count, limit, offset });
    }
    
    const programs = await kv.getByPrefix('program:')
    // Filter out any invalid entries
    const validPrograms = programs.filter(p => p && p.value && p.value.title)
    return c.json({ programs: validPrograms })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return c.json({ error: 'Failed to fetch programs', details: String(error) }, 500)
  }
})

// Add a new program (admin function)
app.post('/make-server-2a4be611/programs', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, image, category } = body

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400)
    }

    const programId = `program:${crypto.randomUUID()}`
    await kv.set(programId, {
      title,
      description,
      image: image || '',
      category: category || 'general',
      createdAt: new Date().toISOString()
    })

    console.log(`Program created: ${programId}`)
    return c.json({ success: true, message: 'Program created successfully', id: programId })
  } catch (error) {
    console.error('Error creating program:', error)
    return c.json({ error: 'Failed to create program', details: String(error) }, 500)
  }
})

// Get all news/updates
app.get('/make-server-2a4be611/news', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('news:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ news: data, count, limit, offset });
    }
    
    const news = await kv.getByPrefix('news:')
    // Filter out any invalid entries
    const validNews = news.filter(n => n && n.value && n.value.timestamp)
    // Sort by timestamp descending
    validNews.sort((a, b) => new Date(b.value.timestamp).getTime() - new Date(a.value.timestamp).getTime())
    return c.json({ news: validNews })
  } catch (error) {
    console.error('Error fetching news:', error)
    return c.json({ error: 'Failed to fetch news', details: String(error) }, 500)
  }
})

// Add news/update (admin function)
app.post('/make-server-2a4be611/news', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { title, content, image } = body

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400)
    }

    const newsId = `news:${crypto.randomUUID()}`
    await kv.set(newsId, {
      title,
      content,
      image: image || '',
      timestamp: new Date().toISOString()
    })

    console.log(`News created: ${newsId}`)
    return c.json({ success: true, message: 'News created successfully', id: newsId })
  } catch (error) {
    console.error('Error creating news:', error)
    return c.json({ error: 'Failed to create news', details: String(error) }, 500)
  }
})

// Volunteer application submission
app.post('/make-server-2a4be611/volunteer', withRateLimit('volunteer', 3, 10 * 60_000), async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, skills, message } = body

    const nameV = validateName(name)
    const emailV = validateEmail(email)
    const phoneV = validatePhone(phone)

    if (!nameV.ok) return c.json({ error: nameV.error }, 400)
    if (!emailV.ok) return c.json({ error: emailV.error }, 400)
    if (phone && !phoneV.ok) return c.json({ error: phoneV.error }, 400)

    const volunteerId = `volunteer:${crypto.randomUUID()}`
    await kv.set(volunteerId, {
      name: name.trim(),
      email: email.trim(),
      phone,
      skills: skills || '',
      message: message || '',
      timestamp: new Date().toISOString(),
      status: 'pending'
    })

    console.log(`Volunteer application submitted: ${volunteerId}`)
    return c.json({ success: true, message: 'Volunteer application submitted successfully' })
  } catch (error) {
    console.error('Error submitting volunteer application:', error)
    return c.json({ error: 'Failed to submit volunteer application', details: String(error) }, 500)
  }
})

// Create Stripe payment intent
app.post('/make-server-2a4be611/create-payment-intent', async (c) => {
  try {
    if (!stripe) {
      return c.json({ error: 'Stripe is not configured. Please add your STRIPE_SECRET_KEY.' }, 400)
    }

    const body = await c.req.json()
    const { amount, currency, donorName, donorEmail } = body

    if (!amount || amount < 1) {
      return c.json({ error: 'Invalid amount' }, 400)
    }

    // Create a pending donation in Postgres first
    const internalReference = crypto.randomUUID()
    const donationId = `donation:${internalReference}`
    const parts = (donorName || 'Anonymous').split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || ''

    const { error: insertError } = await supabase.from('donations').insert({
      id: donationId,
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      method: 'card',
      provider: 'stripe',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      status: 'pending',
      transaction_id: internalReference,
      provider_transaction_id: null,
      provider_response: { createdBy: 'create-payment-intent' }
    })

    if (insertError) {
      console.error('Failed to create pending donation:', insertError)
      return c.json({ error: 'Database error' }, 500)
    }

    // Create a payment intent and attach the internal reference so webhook can locate it
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: (currency || 'usd'),
      metadata: {
        restiDonationId: internalReference,
        internalReference,
        paymentPurpose: 'resti_donation',
        campaignId: 'general',
        donorName: donorName || 'Anonymous',
        donorEmail: donorEmail || ''
      },
    })

    console.log(`Payment intent created: ${paymentIntent.id}`)
    return c.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      restiDonationId: internalReference,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return c.json({ error: 'Failed to create payment intent', details: String(error) }, 500)
  }
})

// Create Stripe Checkout Session (for subscriptions/recurring)
app.post('/make-server-2a4be611/create-checkout-session', async (c) => {
  try {
    if (!stripe) {
      return c.json({ error: 'Stripe is not configured.' }, 400)
    }

    const body = await c.req.json()
    const { amount, currency, donorName, donorEmail, interval, successUrl, cancelUrl } = body

    if (!amount || amount < 1) {
      return c.json({ error: 'Invalid amount' }, 400)
    }

    const isRecurring = !!interval
    const internalReference = crypto.randomUUID()
    const donationId = `donation:${internalReference}`
    const parts = (donorName || 'Anonymous').split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || ''

    // Create pending donation
    const { error: insertError } = await supabase.from('donations').insert({
      id: donationId,
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      method: isRecurring ? 'card_recurring' : 'card',
      provider: 'stripe',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      status: 'pending',
      transaction_id: internalReference,
      provider_transaction_id: null,
      provider_response: { createdBy: 'create-checkout-session' }
    })

    if (insertError) {
      console.error('Failed to create pending donation:', insertError)
      return c.json({ error: 'Database error' }, 500)
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: (currency || 'usd'),
            ...(isRecurring ? { recurring: { interval: interval } } : {}),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: isRecurring ? `Recurring Donation to Resti Kiryandongo CBO` : `One-time Donation to Resti Kiryandongo CBO`,
              description: isRecurring ? `A ${interval}ly donation. Thank you for your support!` : `One-time donation. Thank you for your support!`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${c.req.header('origin') || 'http://localhost:5173'}/donor/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${c.req.header('origin') || 'http://localhost:5173'}/donate`,
      customer_email: donorEmail || undefined,
      metadata: {
        restiDonationId: internalReference,
        internalReference,
        paymentPurpose: 'resti_donation',
        campaignId: 'general',
        donorName: donorName || 'Anonymous',
        donorEmail: donorEmail || '',
        isRecurring: isRecurring ? 'true' : 'false',
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)
    return c.json({ url: session.url, restiDonationId: internalReference })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return c.json({ error: 'Failed to create checkout session', details: String(error) }, 500)
  }
})

// Verify Stripe Checkout Session and record donation
app.post('/make-server-2a4be611/verify-session', async (c) => {
  try {
    if (!stripe) {
      return c.json({ error: 'Stripe is not configured' }, 400)
    }

    const { sessionId } = await c.req.json()
    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400)
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return c.json({ status: 'pending' })
    }

    // Do NOT create a new donation here. The canonical record is the Postgres donations table.
    // Lookup the donation by the internal reference stored in metadata (restiDonationId) or by transaction id.
    const internalRef = session.metadata?.restiDonationId || session.id
    const { data: donation, error: findErr } = await supabase.from('donations').select('*').or(`transaction_id.eq.${sessionId},transaction_id.eq.${internalRef}`)

    if (findErr) {
      console.error('DB lookup error in verify-session:', findErr)
      return c.json({ error: 'Database lookup failed' }, 500)
    }

    if (!donation || donation.length === 0) {
      return c.json({ status: 'not_found' })
    }

    // Return canonical status
    const d = donation[0]
    return c.json({ status: d.status || 'pending' })
  } catch (error) {
    console.error('Error verifying session:', error)
    return c.json({ error: 'Failed to verify session', details: String(error) }, 500)
  }
})

// Create Stripe Customer Portal Session
app.post('/make-server-2a4be611/create-portal-session', async (c) => {
  try {
    if (!stripe) {
      return c.json({ error: 'Stripe is not configured.' }, 400)
    }

    const body = await c.req.json()
    const { email, returnUrl } = body

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const customers = await stripe.customers.list({ email: email, limit: 1 })
    
    let customerId;
    if (customers.data.length === 0) {
      const newCustomer = await stripe.customers.create({ email: email });
      customerId = newCustomer.id;
    } else {
      customerId = customers.data[0].id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${c.req.header('origin') || 'http://localhost:5173'}/donor/dashboard`,
    })

    return c.json({ url: session.url })
  } catch (error) {
    return c.json({ error: 'Failed to create portal session', details: String(error) }, 500)
  }
})

// Delete a specific donation (admin)
app.delete('/make-server-2a4be611/admin/donations/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const key = id.includes(':') ? id : `donation:${id}`
    // Delete from Postgres canonical donations table
    const { error: delErr } = await supabase.from('donations').delete().eq('id', key)
    if (delErr) {
      console.error('Failed to delete donation from Postgres:', delErr)
      return c.json({ error: 'Failed to delete donation', details: delErr.message }, 500)
    }
    return c.json({ success: true, message: 'Donation deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete donation', details: String(error) }, 500)
  }
})

// Clear all donations (admin)
app.post('/make-server-2a4be611/admin/donations/clear-all', requireAdmin, async (c) => {
  try {
    // Delete all donations from Postgres. This is irreversible - admin-only.
    const { data: deleted, error: delErr } = await supabase.from('donations').delete().neq('id', '')
    if (delErr) {
      console.error('Failed to clear donations from Postgres:', delErr)
      return c.json({ error: 'Failed to clear donations', details: delErr.message }, 500)
    }
    const count = Array.isArray(deleted) ? deleted.length : 0
    return c.json({ success: true, message: `Cleared ${count} donations successfully` })
  } catch (error) {
    return c.json({ error: 'Failed to clear donations', details: String(error) }, 500)
  }
})

// Sync Stripe historical payments to KV store
app.post('/make-server-2a4be611/admin/sync-stripe', requireAdmin, async (c) => {
  try {
    if (!stripe) return c.json({ error: 'Stripe is not configured' }, 400)

    const paymentIntents = await stripe.paymentIntents.list({ limit: 100 })
    let synced = 0;
    
    // Fetch existing donations to prevent duplicates
    // Fetch existing donation transaction IDs from Postgres to avoid duplicates
    const { data: existingDonations } = await supabase.from('donations').select('transaction_id')
    const existingTxIds = new Set((existingDonations || []).map(d => d.transaction_id))

    for (const pi of paymentIntents.data) {
      if (pi.status !== 'succeeded') continue;
      
      const txId = pi.id
      if (existingTxIds.has(txId)) continue;
      
      let donorEmail = pi.receipt_email || ''
      let donorName = pi.metadata?.donorName || 'Anonymous'
      
      // Attempt to fetch more info if there's a customer
      if (!donorEmail && pi.customer && typeof pi.customer === 'string') {
        try {
          const customer = await stripe.customers.retrieve(pi.customer) as any
          if (!customer.deleted) {
            donorEmail = customer.email || donorEmail
            if (customer.name) donorName = customer.name
          }
        } catch (e) {
          // ignore customer fetch errors
        }
      }

      const donationId = `donation:${crypto.randomUUID()}`
      const donationRecord = {
        id: donationId,
        amount: pi.amount ? pi.amount / 100 : 0,
        currency: pi.currency?.toUpperCase() || 'USD',
        method: 'card',
        provider: 'stripe',
        first_name: donorName.split(' ')[0] || 'Anonymous',
        last_name: donorName.split(' ').slice(1).join(' ') || '',
        email: donorEmail || '',
        message: 'Historical Stripe payment sync',
        payment_intent_id: pi.id,
        transaction_id: pi.id,
        created_at: new Date(pi.created * 1000).toISOString(),
        status: 'completed'
      }

      await supabase.from('donations').insert(donationRecord)
      synced++
    }

    return c.json({ success: true, message: `Synced ${synced} historical payments from Stripe` })
  } catch (error) {
    console.error('Error syncing Stripe:', error)
    return c.json({ error: 'Failed to sync Stripe', details: String(error) }, 500)
  }
})

// Record a PENDING donation (public — payment provider has not confirmed yet)
// Public clients must NEVER create a completed donation.
// Receipts are issued only after payment provider confirmation via webhook or polling.
app.post('/make-server-2a4be611/donations', withRateLimit('donation', 5, 5 * 60_000), async (c) => {
  try {
    const body = await c.req.json()
    const { 
      amount, 
      currency, 
      paymentMethod, 
      donorName, 
      donorEmail, 
      donorPhone,
      message,
      paymentIntentId,
      transactionId
    } = body

    const amountV = validateAmount(amount)
    if (!amountV.ok) return c.json({ error: amountV.error }, 400)
    if (!paymentMethod) return c.json({ error: 'Payment method is required' }, 400)

    if (donorEmail) {
      const emailV = validateEmail(donorEmail)
      if (!emailV.ok) return c.json({ error: emailV.error }, 400)
    }

    const donationId = `donation:${crypto.randomUUID()}`
    
    const parts = (donorName || 'Anonymous').split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || ''
    
    const { error: insertErr } = await supabase.from('donations').insert({
      id: donationId,
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      method: paymentMethod,
      provider: paymentMethod === 'mtn' || paymentMethod === 'airtel' ? paymentMethod : 'other',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      status: 'pending',
      transaction_id: transactionId || crypto.randomUUID()
    })
    
    if (insertErr) {
      console.error('Failed to record pending donation:', insertErr)
      return c.json({ error: 'Database error' }, 500)
    }

    console.log(`Pending donation recorded: ${donationId}`)
    return c.json({ success: true, message: 'Donation pending — awaiting payment confirmation', id: donationId })
  } catch (error) {
    console.error('Error recording donation:', error)
    return c.json({ error: 'Failed to record donation', details: String(error) }, 500)
  }
})

// Admin-only manual donation entry (finance staff recording offline/cash donations)
// These are marked as manually_verified and record the approving admin's identity.
app.post('/make-server-2a4be611/admin/donations/manual', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const adminUser = c.get('adminUser') as any
    const { amount, currency, paymentMethod, donorName, donorEmail, donorPhone, message, transactionId } = body

    const amountV = validateAmount(amount)
    if (!amountV.ok) return c.json({ error: amountV.error }, 400)
    if (!paymentMethod) return c.json({ error: 'Payment method is required' }, 400)

    const safeName = escapeHtml(donorName || 'Anonymous')
    const safeEmail = escapeHtml(donorEmail || '')
    const safeCurrency = escapeHtml(currency || 'USD')
    const safeMessage = escapeMessage(message || '')

    const donationId = `donation:${crypto.randomUUID()}`
    
    const parts = (donorName || 'Anonymous').split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || ''
    
    const { error: insertErr } = await supabase.from('donations').insert({
      id: donationId,
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      method: paymentMethod,
      provider: 'manual',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      status: 'completed',
      verification_method: 'manual',
      verified_by: adminUser?.email || 'admin',
      transaction_id: transactionId || crypto.randomUUID(),
      provider_transaction_id: transactionId || null,
      provider_response: { message }
    })
    
    if (insertErr) {
      console.error('Failed to record manual donation:', insertErr)
      return c.json({ error: 'Database error' }, 500)
    }

    await deliverDonationReceipt({
      id: donationId,
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      email: donorEmail,
      first_name: firstName,
      last_name: lastName,
      transaction_id: transactionId
    }, sendEmail)

    console.log(`Manual donation recorded by ${adminUser?.email}: ${donationId}`)
    return c.json({ success: true, message: 'Manual donation recorded successfully', id: donationId })
  } catch (error) {
    console.error('Error recording manual donation:', error)
    return c.json({ error: 'Failed to record manual donation', details: String(error) }, 500)
  }
})

// ── Mobile Money STK Push helpers ────────────────────────────────────────────


// ── Initiate mobile money STK push ───────────────────────────────────────────
app.post('/make-server-2a4be611/mobile-payment/initiate', withRateLimit('mobile-payment', 3, 5 * 60_000), async (c) => {
  try {
    // SECURITY: currency is determined server-side from env config, NOT from the browser
    const { provider, phone, amount, donorName, donorEmail } = await c.req.json()

    if (!provider || !phone || !amount) {
      return c.json({ error: 'provider, phone, and amount are required' }, 400)
    }
    if (provider !== 'mtn' && provider !== 'airtel') {
      return c.json({ error: 'provider must be "mtn" or "airtel"' }, 400)
    }

    const phoneV = validateMobileMoneyPhone(phone)
    if (!phoneV.ok) return c.json({ error: phoneV.error }, 400)

    const amountV = validateAmount(amount)
    if (!amountV.ok) return c.json({ error: amountV.error }, 400)

    if (donorEmail) {
      const emailV = validateEmail(donorEmail)
      if (!emailV.ok) return c.json({ error: emailV.error }, 400)
    }

    // Currency is ALWAYS from server configuration — never accepted from the browser
    const transactionCurrency = provider === 'mtn'
      ? (Deno.env.get('MTN_CURRENCY') ?? 'UGX')
      : (Deno.env.get('AIRTEL_CURRENCY') ?? 'UGX')

    const referenceId = crypto.randomUUID()
    const cleanPhone = normaliseUgandanPhone(String(phone))

    if (provider === 'mtn') {
      const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
      if (!subscriptionKey) return c.json({ error: 'MTN Mobile Money is not configured on this server. Please contact the admin.' }, 503)

      const environment = Deno.env.get('MTN_MOMO_ENVIRONMENT') ?? 'sandbox'
      const baseUrl = environment === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com'
      const mtnCurrency = Deno.env.get('MTN_CURRENCY') ?? 'UGX'

      const accessToken = await getMtnAccessToken()
      const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': environment,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: String(amount),
          currency: mtnCurrency,
          externalId: referenceId,
          payer: { partyIdType: 'MSISDN', partyId: cleanPhone },
          payerMessage: 'Donation to Resti Kiryandongo CBO',
          payeeNote: `Donation ref: ${referenceId}`,
        }),
      })
      // 202 Accepted = successfully queued
      if (res.status !== 202 && !res.ok) {
        const errText = await res.text()
        console.error('MTN requestToPay error:', res.status, errText)
        return c.json({ error: 'MTN payment initiation failed. Check the phone number and try again.' }, 500)
      }

    } else {
      // Airtel
      const clientId = Deno.env.get('AIRTEL_CLIENT_ID')
      if (!clientId) return c.json({ error: 'Airtel Money is not configured on this server. Please contact the admin.' }, 503)

      const environment = Deno.env.get('AIRTEL_ENVIRONMENT') ?? 'sandbox'
      const baseUrl = environment === 'production'
        ? 'https://openapi.airtel.africa'
        : 'https://openapiuat.airtel.africa'
      const country = Deno.env.get('AIRTEL_COUNTRY') ?? 'UG'
      const airtelCurrency = Deno.env.get('AIRTEL_CURRENCY') ?? 'UGX'

      const accessToken = await getAirtelAccessToken()
      const res = await fetch(`${baseUrl}/merchant/v2/payments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Country': country,
          'X-Currency': airtelCurrency,
        },
        body: JSON.stringify({
          reference: 'Donation to Resti Kiryandongo CBO',
          subscriber: { country, currency: airtelCurrency, msisdn: cleanPhone },
          transaction: { amount: String(amount), country, currency: airtelCurrency, id: referenceId },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Airtel payment error:', data)
        return c.json({ error: 'Airtel payment initiation failed. Check the phone number and try again.' }, 500)
      }
    }

    // Record pending donation
    const donationId = `donation:${crypto.randomUUID()}`
    const { error: insertError } = await supabase.from('donations').insert({
      id: donationId,
      amount,
      currency: transactionCurrency,
      method: provider === 'mtn' ? 'mtn_mobile_money' : 'airtel_money',
      first_name: donorName?.split(' ')[0] ?? 'Anonymous',
      last_name: donorName?.split(' ').slice(1).join(' ') ?? '',
      email: donorEmail ?? '',
      transaction_id: referenceId,
      status: 'pending',
      provider,
      provider_transaction_id: null,
      provider_response: {
        message: `${provider.toUpperCase()} Mobile Money STK push - ref: ${referenceId}`,
        donorPhone: cleanPhone,
      }
    })

    if (insertError) {
      console.error('Failed to create pending donation in database:', insertError)
      return c.json({ error: 'Database error', details: insertError.message }, 500)
    }

    return c.json({ success: true, referenceId })
  } catch (error) {
    console.error('Mobile payment initiation error:', error)
    return c.json({ error: 'Payment initiation failed', details: String(error) }, 500)
  }
})

// ── Poll mobile money payment status ─────────────────────────────────────────
// SECURITY: provider is read from the database record, NOT from the query string.
// The browser cannot spoof a different provider by passing ?provider=airtel on an MTN transaction.
app.get('/make-server-2a4be611/mobile-payment/status/:referenceId', async (c) => {
  try {
    const referenceId = c.req.param('referenceId')

    // Look up the pending donation to get the authoritative provider
    const { data: pendingDonation, error } = await supabase
      .from('donations')
      .select('*')
      .eq('transaction_id', referenceId)
      .single()

    if (error || !pendingDonation) {
      return c.json({ error: 'Transaction not found' }, 404)
    }

    // If already completed, return success immediately
    if (pendingDonation.status === 'completed') {
      return c.json({ status: 'SUCCESSFUL', referenceId })
    }

    // Provider comes from the stored record, never from the request
    const provider: string = pendingDonation.provider
    if (!provider) {
      return c.json({ error: 'Provider information not found for this transaction' }, 500)
    }

    let paymentStatus = 'PENDING'

    if (provider === 'mtn') {
      const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
      if (!subscriptionKey) return c.json({ error: 'MTN not configured' }, 503)
      const environment = Deno.env.get('MTN_MOMO_ENVIRONMENT') ?? 'sandbox'
      const baseUrl = environment === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com'
      const accessToken = await getMtnAccessToken()
      const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': environment,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
      })
      if (res.ok) {
        const data = await res.json()
        paymentStatus = data.status ?? 'PENDING' // 'PENDING' | 'SUCCESSFUL' | 'FAILED'
      }

    } else if (provider === 'airtel') {
      const clientId = Deno.env.get('AIRTEL_CLIENT_ID')
      if (!clientId) return c.json({ error: 'Airtel not configured' }, 503)
      const environment = Deno.env.get('AIRTEL_ENVIRONMENT') ?? 'sandbox'
      const baseUrl = environment === 'production'
        ? 'https://openapi.airtel.africa'
        : 'https://openapiuat.airtel.africa'
      const country = Deno.env.get('AIRTEL_COUNTRY') ?? 'UG'
      const accessToken = await getAirtelAccessToken()
      const res = await fetch(`${baseUrl}/standard/v1/payments/${referenceId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Country': country },
      })
      if (res.ok) {
        const data = await res.json()
        // Airtel statuses: 'TS' = successful, 'TF' = failed, 'TIP' = in progress
        const s: string = data?.data?.transaction?.status ?? 'TIP'
        paymentStatus = s === 'TS' ? 'SUCCESSFUL' : s === 'TF' ? 'FAILED' : 'PENDING'
      }
    }

    // On confirmed success, mark donation complete and send thank-you email (once)
    if (paymentStatus === 'SUCCESSFUL') {
      // When completing from polling, include verified amount/currency and provider transaction id
      // Fetch verified provider response where possible
      let verifiedAmount: number | undefined = undefined
      let verifiedCurrency: string | undefined = undefined
      let providerTxId = referenceId

      if (provider === 'mtn' && typeof referenceId === 'string') {
        // Request verification data
        const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
        const environment = Deno.env.get('MTN_MOMO_ENVIRONMENT') ?? 'sandbox'
        const baseUrl = environment === 'production' ? 'https://proxy.momoapi.mtn.com' : 'https://sandbox.momodeveloper.mtn.com'
        try {
          const accessToken = await getMtnAccessToken()
          const v = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Ocp-Apim-Subscription-Key': subscriptionKey!, 'X-Target-Environment': environment }
          })
          if (v.ok) {
            const vd = await v.json()
            verifiedAmount = Number(vd.amount)
            verifiedCurrency = vd.currency
            providerTxId = vd.financialTransactionId || referenceId
          }
        } catch (e) {
          console.warn('MTN polling verification failed', e)
        }
      }

      if (provider === 'airtel') {
        try {
          const environment = Deno.env.get('AIRTEL_ENVIRONMENT') ?? 'sandbox'
          const baseUrl = environment === 'production' ? 'https://openapi.airtel.africa' : 'https://openapiuat.airtel.africa'
          const accessToken = await getAirtelAccessToken()
          const v = await fetch(`${baseUrl}/standard/v1/payments/${referenceId}`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
          if (v.ok) {
            const vd = await v.json()
            verifiedAmount = Number(vd.data?.transaction?.amount)
            verifiedCurrency = vd.data?.transaction?.currency
            providerTxId = vd.data?.transaction?.financialTransactionId || referenceId
          }
        } catch (e) {
          console.warn('Airtel polling verification failed', e)
        }
      }

      const result = await completeDonationFromWebhook(referenceId, {
        provider,
        providerTransactionId: providerTxId,
        providerStatus: 'SUCCESSFUL',
        expectedAmount: verifiedAmount,
        expectedCurrency: verifiedCurrency,
        rawPayload: { source: 'polling' },
      })
      if (result.success && result.donation) {
        const d = result.donation as any
        // Use centralized delivery helper from webhooks
        // import would be circular here; call via dynamic import to avoid cycle
        try {
          const web = await import('./webhooks.ts')
          await web.deliverDonationReceipt(d, sendEmail)
        } catch (e) {
          console.error('Failed to deliver receipt from polling:', e)
        }
      }
    }

    return c.json({ status: paymentStatus, referenceId })
  } catch (error) {
    console.error('Mobile payment status error:', error)
    return c.json({ error: 'Failed to get payment status', details: String(error) }, 500)
  }
})
app.get('/make-server-2a4be611/donation-stats', async (c) => {
  try {
    // Aggregate donation stats from Postgres
    const { data: donations, error } = await supabase.from('donations').select('amount')
    if (error) {
      console.error('Failed to fetch donations for stats:', error)
      return c.json({ error: 'Failed to fetch donation stats' }, 500)
    }
    const stats = (donations || []).reduce((acc, donation) => {
      const amount = Number(donation.amount || 0)
      acc.totalAmount += amount
      acc.totalDonations += 1
      return acc
    }, { totalAmount: 0, totalDonations: 0 })

    return c.json({ stats })
  } catch (error) {
    console.error('Error fetching donation stats:', error)
    return c.json({ error: 'Failed to fetch donation stats', details: String(error) }, 500)
  }
})

// Newsletter subscription
app.post('/make-server-2a4be611/newsletter', withRateLimit('newsletter', 3, 10 * 60_000), async (c) => {
  try {
    const body = await c.req.json()
    const { email, name } = body

    const emailV = validateEmail(email)
    if (!emailV.ok) return c.json({ error: emailV.error }, 400)

    // Check if already subscribed
    const existing = await kv.getByPrefix('newsletter:')
    const alreadySubscribed = existing.some((sub: any) => sub.value.email === email.trim())
    
    if (alreadySubscribed) {
      return c.json({ error: 'This email is already subscribed' }, 400)
    }

    const subscriberId = `newsletter:${crypto.randomUUID()}`
    await kv.set(subscriberId, {
      email: email.trim(),
      name: name || '',
      timestamp: new Date().toISOString(),
      status: 'active'
    })

    console.log(`Newsletter subscription: ${subscriberId}`)
    return c.json({ success: true, message: 'Successfully subscribed to newsletter' })
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return c.json({ error: 'Failed to subscribe', details: String(error) }, 500)
  }
})

// Get all newsletter subscribers (admin)
app.get('/make-server-2a4be611/newsletter', requireAdmin, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('newsletter:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ subscribers: data, count, limit, offset });
    }
    
    const subscribers = await kv.getByPrefix('newsletter:')
    return c.json({ subscribers })
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error)
    return c.json({ error: 'Failed to fetch subscribers', details: String(error) }, 500)
  }
})

// Delete newsletter subscriber (admin)
app.delete('/make-server-2a4be611/admin/newsletter/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log(`Newsletter subscriber deleted: ${id}`)
    return c.json({ success: true, message: 'Subscriber deleted successfully' })
  } catch (error) {
    console.error('Error deleting subscriber:', error)
    return c.json({ error: 'Failed to delete subscriber', details: String(error) }, 500)
  }
})

// Send newsletter blast to all subscribers (admin)
app.post('/make-server-2a4be611/admin/newsletter/send', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { subject, html } = body

    if (!subject || !html) {
      return c.json({ error: 'Subject and html are required' }, 400)
    }

    const subscribers = await kv.getByPrefix('newsletter:')

    if (subscribers.length === 0) {
      return c.json({ success: true, sent: 0, message: 'No subscribers to send to' })
    }

    let sent = 0
    const errors: string[] = []

    for (const sub of subscribers) {
      const email = sub.value?.email
      if (!email) continue
      const result = await sendEmail(email, subject, html)
      if (result && (result as any).success !== false) {
        sent++
      } else {
        errors.push(email)
      }
    }

    return c.json({ success: true, sent, errors, total: subscribers.length })
  } catch (error) {
    console.error('Error sending newsletter blast:', error)
    return c.json({ error: 'Failed to send newsletter', details: String(error) }, 500)
  }
})

// Image upload endpoint (admin only)
app.post('/make-server-2a4be611/upload-image', requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed' }, 400)
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      return c.json({ error: 'File too large. Maximum size is 5MB' }, 400)
    }

    const bucketName = 'make-2a4be611-uploads'
    const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return c.json({ error: 'Failed to upload file', details: error.message }, 500)
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log(`Image uploaded: ${fileName}`)
    return c.json({ 
      success: true, 
      url: urlData.publicUrl,
      fileName: fileName
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return c.json({ error: 'Failed to upload image', details: String(error) }, 500)
  }
})

// Delete image endpoint (admin only)
app.delete('/make-server-2a4be611/images/:fileName', requireAdmin, async (c) => {
  try {
    const fileName = c.req.param('fileName')
    const bucketName = 'make-2a4be611-uploads'
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      return c.json({ error: 'Failed to delete file', details: error.message }, 500)
    }

    console.log(`Image deleted: ${fileName}`)
    return c.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting image:', error)
    return c.json({ error: 'Failed to delete image', details: String(error) }, 500)
  }
})

// Admin signup
// SECURITY: Registration is controlled by ADMIN_REGISTRATION_OPEN env flag.
// Set ADMIN_REGISTRATION_OPEN=true only during initial setup, then set it back to false.
app.post('/make-server-2a4be611/admin/signup', withRateLimit('admin-signup', 5, 60 * 60_000), async (c) => {
  try {
    const registrationOpen = Deno.env.get('ADMIN_REGISTRATION_OPEN') === 'true'
    if (!registrationOpen) {
      return c.json({ error: 'Administrator registration is currently closed. Contact the system administrator.' }, 403)
    }

    const body = await c.req.json()
    const { email, password, name } = body

    const emailV = validateEmail(email)
    if (!emailV.ok) return c.json({ error: emailV.error }, 400)
    if (!password || password.length < 12) {
      return c.json({ error: 'Password must be at least 12 characters' }, 400)
    }

    // All self-registered accounts start as editors with pending status.
    // A super-admin must manually activate and promote them.
    const userRole = 'editor'
    const userStatus = 'pending'

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '', role: userRole },
      email_confirm: true
    })

    if (error) {
      console.error('Admin signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Store user info in KV
    const userId = `admin_user:${data.user.id}`
    await kv.set(userId, {
      id: data.user.id,
      email,
      name: name || email.split('@')[0],
      role: userRole,
      status: userStatus,
      createdAt: new Date().toISOString()
    })

    // Audit log
    const auditId = `audit:${crypto.randomUUID()}`
    await kv.set(auditId, {
      event: 'admin_signup',
      userId: data.user.id,
      email,
      role: userRole,
      timestamp: new Date().toISOString(),
    })

    console.log(`Admin user created: ${data.user.id} role=${userRole} status=${userStatus}`)
    return c.json({ success: true, message: 'Account created successfully. Awaiting administrator activation.', user: data.user })
  } catch (error) {
    console.error('Error creating admin account:', error)
    return c.json({ error: 'Failed to create admin account', details: String(error) }, 500)
  }
})

// Get user status
app.get('/make-server-2a4be611/admin/users/:userId/status', async (c) => {
  try {
    const userId = c.req.param('userId')
    const user = await kv.get(`admin_user:${userId}`)
    if (!user) {
      // If not in KV, default to active to prevent CLI-created users from being locked out
      return c.json({ success: true, status: 'active', role: 'viewer' })
    }
    return c.json({ success: true, status: user.status, role: user.role })
  } catch (error) {
    console.error('Error fetching user status:', error)
    return c.json({ error: 'Failed to fetch status', details: String(error) }, 500)
  }
})

// Update user role (super-admin only)
app.patch('/make-server-2a4be611/admin/users/:userId/role', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { role } = body

    const validRoles = ['super-admin', 'admin', 'editor', 'viewer']
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400)
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role }
    })

    if (error) {
      console.error('Role update error:', error)
      return c.json({ error: error.message }, 400)
    }

    console.log(`User role updated: ${userId} to ${role}`)
    return c.json({ success: true, message: 'Role updated successfully', user: data.user })
  } catch (error) {
    console.error('Error updating user role:', error)
    return c.json({ error: 'Failed to update role', details: String(error) }, 500)
  }
})

// Note: GET /admin/users is defined further below using the KV store (admin_user: prefix)

// Get all contact submissions (admin)
app.get('/make-server-2a4be611/admin/contacts', requireAdmin, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('contact:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ contacts: data, count, limit, offset });
    }
    
    const contacts = await kv.getByPrefix('contact:')
    // Sort by timestamp descending
    contacts.sort((a, b) => new Date(b.value.timestamp).getTime() - new Date(a.value.timestamp).getTime())
    return c.json({ contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return c.json({ error: 'Failed to fetch contacts', details: String(error) }, 500)
  }
})

// Update contact status (admin)
app.patch('/make-server-2a4be611/admin/contacts/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { status } = body

    const contact = await kv.get(id)
    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404)
    }

    await kv.set(id, {
      ...contact,
      status: status || contact.status
    })

    return c.json({ success: true, message: 'Contact updated successfully' })
  } catch (error) {
    console.error('Error updating contact:', error)
    return c.json({ error: 'Failed to update contact', details: String(error) }, 500)
  }
})

// Get all volunteers (admin)
app.get('/make-server-2a4be611/admin/volunteers', requireAdmin, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('volunteer:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ volunteers: data, count, limit, offset });
    }
    
    const volunteers = await kv.getByPrefix('volunteer:')
    // Sort by timestamp descending
    volunteers.sort((a, b) => new Date(b.value.timestamp).getTime() - new Date(a.value.timestamp).getTime())
    return c.json({ volunteers })
  } catch (error) {
    console.error('Error fetching volunteers:', error)
    return c.json({ error: 'Failed to fetch volunteers', details: String(error) }, 500)
  }
})

// Update volunteer status (admin)
app.patch('/make-server-2a4be611/admin/volunteers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { status } = body

    const volunteer = await kv.get(id)
    if (!volunteer) {
      return c.json({ error: 'Volunteer not found' }, 404)
    }

    await kv.set(id, {
      ...volunteer,
      status: status || volunteer.status
    })

    return c.json({ success: true, message: 'Volunteer status updated successfully' })
  } catch (error) {
    console.error('Error updating volunteer:', error)
    return c.json({ error: 'Failed to update volunteer', details: String(error) }, 500)
  }
})

// Get all donations (admin)
app.get('/make-server-2a4be611/admin/donations', requireAdmin, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    // Prefer Postgres as canonical source
    if (c.req.query('limit') !== undefined) {
      const start = offset
      const end = offset + limit - 1
      const { data, error, count } = await supabase
        .from('donations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end)
      if (error) {
        console.error('Failed to fetch donations from Postgres:', error)
        return c.json({ error: 'Failed to fetch donations', details: error.message }, 500)
      }
      return c.json({ donations: data || [], count: count || 0, limit, offset })
    }

    const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Failed to fetch donations from Postgres:', error)
      return c.json({ error: 'Failed to fetch donations', details: error.message }, 500)
    }
    return c.json({ donations: data || [] })
  } catch (error) {
    console.error('Error fetching donations:', error)
    return c.json({ error: 'Failed to fetch donations', details: String(error) }, 500)
  }
})

// Migrate donations from KV store into Postgres (admin only)
app.post('/make-server-2a4be611/admin/migrate-donations-kv-to-postgres', requireAdmin, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun === true
    const deleteKv = body.deleteKv === true

    const kvDonations = await kv.getByPrefix('donation:')
    const summary = { total: kvDonations.length, skipped: 0, migrated: 0, errors: 0 }

    for (const entry of kvDonations) {
      try {
        const key = entry.key
        const v = entry.value || entry
        const amount = Number(v.amount || 0)
        const currency = (v.currency || 'USD').toUpperCase()
        const donorName = v.donorName || v.name || 'Anonymous'
        const parts = (donorName || 'Anonymous').split(' ')
        const first_name = parts[0]
        const last_name = parts.slice(1).join(' ') || ''
        const email = v.donorEmail || v.email || ''
        const method = v.paymentMethod || v.method || 'unknown'
        const provider = method.includes('mtn') ? 'mtn' : method.includes('airtel') ? 'airtel' : (v.provider || 'stripe')
        const status = (v.status === 'manually_verified') ? 'completed' : (v.status || 'pending')
        const transaction_id = v.transactionId || v.paymentIntentId || v.transactionId || key.split(':')[1]
        const provider_transaction_id = v.paymentIntentId || v.providerTransactionId || null

        // Check if already exists
        const { data: existing } = await supabase.from('donations').select('id').eq('transaction_id', transaction_id)
        if (existing && existing.length > 0) {
          summary.skipped++
          continue
        }

        if (!dryRun) {
          const insert = {
            id: key,
            amount,
            currency,
            method,
            provider,
            first_name,
            last_name,
            email,
            status,
            transaction_id,
            provider_transaction_id,
            provider_response: v,
            created_at: v.timestamp || new Date().toISOString()
          }
          const { error: insertErr } = await supabase.from('donations').insert(insert)
          if (insertErr) {
            console.error('Failed to insert donation', key, insertErr)
            summary.errors++
            continue
          }
          summary.migrated++
          if (deleteKv) {
            await kv.del(key)
          }
        }
      } catch (e) {
        console.error('Migration error for entry', entry, e)
        summary.errors++
      }
    }

    return c.json({ success: true, dryRun, summary })
  } catch (error) {
    console.error('Migration endpoint error:', error)
    return c.json({ error: 'Migration failed', details: String(error) }, 500)
  }
})

// Delete program (admin)
app.delete('/make-server-2a4be611/programs/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log(`Program deleted: ${id}`)
    return c.json({ success: true, message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Error deleting program:', error)
    return c.json({ error: 'Failed to delete program', details: String(error) }, 500)
  }
})

// Update program (admin)
app.put('/make-server-2a4be611/programs/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, description, image, category } = body

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400)
    }

    const existing = await kv.get(id)
    if (!existing) {
      return c.json({ error: 'Program not found' }, 404)
    }

    await kv.set(id, {
      ...existing,
      title,
      description,
      image: image || '',
      category: category || 'general',
      updatedAt: new Date().toISOString()
    })

    console.log(`Program updated: ${id}`)
    return c.json({ success: true, message: 'Program updated successfully' })
  } catch (error) {
    console.error('Error updating program:', error)
    return c.json({ error: 'Failed to update program', details: String(error) }, 500)
  }
})

// Bulk delete programs
app.post('/make-server-2a4be611/programs/bulk-delete', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Invalid or empty IDs array' }, 400)
    }

    await kv.mdel(ids)
    console.log(`Bulk deleted ${ids.length} programs`)
    return c.json({ success: true, message: `${ids.length} programs deleted successfully` })
  } catch (error) {
    console.error('Error bulk deleting programs:', error)
    return c.json({ error: 'Failed to bulk delete programs', details: String(error) }, 500)
  }
})

// Delete news (admin)
app.delete('/make-server-2a4be611/news/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log(`News deleted: ${id}`)
    return c.json({ success: true, message: 'News deleted successfully' })
  } catch (error) {
    console.error('Error deleting news:', error)
    return c.json({ error: 'Failed to delete news', details: String(error) }, 500)
  }
})

// Bulk delete news
app.post('/make-server-2a4be611/news/bulk-delete', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Invalid or empty IDs array' }, 400)
    }

    await kv.mdel(ids)
    console.log(`Bulk deleted ${ids.length} news items`)
    return c.json({ success: true, message: `${ids.length} news items deleted successfully` })
  } catch (error) {
    console.error('Error bulk deleting news:', error)
    return c.json({ error: 'Failed to bulk delete news', details: String(error) }, 500)
  }
})

// Bulk update contact status
app.post('/make-server-2a4be611/admin/contacts/bulk-update', async (c) => {
  try {
    const body = await c.req.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Invalid or empty IDs array' }, 400)
    }

    const contacts = await kv.mget(ids)
    const updates = contacts.map((contact, index) => ({
      key: ids[index],
      value: { ...contact, status }
    }))

    await kv.mset(updates)
    console.log(`Bulk updated ${ids.length} contacts to status: ${status}`)
    return c.json({ success: true, message: `${ids.length} contacts updated successfully` })
  } catch (error) {
    console.error('Error bulk updating contacts:', error)
    return c.json({ error: 'Failed to bulk update contacts', details: String(error) }, 500)
  }
})

// Bulk update volunteer status
app.post('/make-server-2a4be611/admin/volunteers/bulk-update', async (c) => {
  try {
    const body = await c.req.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Invalid or empty IDs array' }, 400)
    }

    const volunteers = await kv.mget(ids)
    const updates = volunteers.map((volunteer, index) => ({
      key: ids[index],
      value: { ...volunteer, status }
    }))

    await kv.mset(updates)
    console.log(`Bulk updated ${ids.length} volunteers to status: ${status}`)
    return c.json({ success: true, message: `${ids.length} volunteers updated successfully` })
  } catch (error) {
    console.error('Error bulk updating volunteers:', error)
    return c.json({ error: 'Failed to bulk update volunteers', details: String(error) }, 500)
  }
})

// Update contact status (admin)
app.put('/make-server-2a4be611/admin/contacts/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { status } = body

    const existing = await kv.get(id)
    if (!existing) {
      return c.json({ error: 'Contact not found' }, 404)
    }

    await kv.set(id, {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    })

    console.log(`Contact status updated: ${id} -> ${status}`)
    return c.json({ success: true, message: 'Contact status updated successfully' })
  } catch (error) {
    console.error('Error updating contact status:', error)
    return c.json({ error: 'Failed to update contact status', details: String(error) }, 500)
  }
})

// Delete contact (admin)
app.delete('/make-server-2a4be611/admin/contacts/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log(`Contact deleted: ${id}`)
    return c.json({ success: true, message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return c.json({ error: 'Failed to delete contact', details: String(error) }, 500)
  }
})

// Reply to contact via email (admin)
app.post('/make-server-2a4be611/admin/contacts/:id/reply', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { message } = body

    if (!message || !message.trim()) {
      return c.json({ error: 'Reply message is required' }, 400)
    }

    const contact = await kv.get(id)
    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404)
    }

    console.log(`Attempting to send reply to ${contact.email} for contact ${id}`)

    // Send email reply
    const emailResult = await sendEmail(
      contact.email,
      `Re: Your message to Resti Kiryandongo CBO`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Resti Kiryandongo CBO</h2>
          <p>Dear ${contact.name},</p>
          <p>Thank you for contacting us. Here's our response to your message:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your original message:</strong></p>
            <p style="color: #6b7280;">${contact.message}</p>
          </div>
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Our response:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p>Best regards,<br>Resti Kiryandongo CBO Team</p>
        </div>
      `
    )

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult)
      if (!resendApiKey) {
        return c.json({ 
          error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.',
          details: 'The Resend API key is missing. Contact the administrator to configure email functionality.'
        }, 500)
      }
      return c.json({ 
        error: 'Failed to send email', 
        details: emailResult.error || 'Unknown email error'
      }, 500)
    }

    // Update contact status to replied
    await kv.set(id, {
      ...contact,
      status: 'resolved',
      repliedAt: new Date().toISOString()
    })

    console.log(`Reply sent successfully to contact: ${id}`)
    return c.json({ success: true, message: 'Reply sent successfully' })
  } catch (error) {
    console.error('Error sending reply:', error)
    return c.json({ error: 'Failed to send reply', details: String(error) }, 500)
  }
})

// Bulk delete contacts (admin)
app.post('/make-server-2a4be611/admin/contacts/bulk-delete', async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Invalid or empty IDs array' }, 400)
    }

    await kv.mdel(ids)
    console.log(`Bulk deleted ${ids.length} contacts`)
    return c.json({ success: true, message: `${ids.length} contacts deleted successfully` })
  } catch (error) {
    console.error('Error bulk deleting contacts:', error)
    return c.json({ error: 'Failed to bulk delete contacts', details: String(error) }, 500)
  }
})

// Update volunteer status (admin)
app.put('/make-server-2a4be611/admin/volunteers/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { status } = body

    const existing = await kv.get(id)
    if (!existing) {
      return c.json({ error: 'Volunteer not found' }, 404)
    }

    await kv.set(id, {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    })

    // Send email notification to volunteer
    if (status === 'approved' || status === 'rejected') {
      const subject = status === 'approved' 
        ? 'Your Volunteer Application Has Been Approved!'
        : 'Update on Your Volunteer Application'
      
      const message = status === 'approved'
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Congratulations ${existing.name}!</h2>
            <p>We're excited to inform you that your volunteer application has been approved!</p>
            <p>We'll be in touch soon with more details about next steps and opportunities to get involved.</p>
            <p>Thank you for your interest in supporting our community!</p>
            <p>Best regards,<br>Resti Kiryandongo CBO Team</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Thank you for your interest</h2>
            <p>Dear ${existing.name},</p>
            <p>Thank you for your interest in volunteering with Resti Kiryandongo CBO.</p>
            <p>While we aren't able to move forward with your application at this time, we encourage you to stay connected with our work and consider applying for future opportunities.</p>
            <p>Best regards,<br>Resti Kiryandongo CBO Team</p>
          </div>
        `
      
      await sendEmail(existing.email, subject, message)
    }

    console.log(`Volunteer status updated: ${id} -> ${status}`)
    return c.json({ success: true, message: 'Volunteer status updated successfully' })
  } catch (error) {
    console.error('Error updating volunteer status:', error)
    return c.json({ error: 'Failed to update volunteer status', details: String(error) }, 500)
  }
})

// Delete volunteer (admin)
app.delete('/make-server-2a4be611/admin/volunteers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log(`Volunteer deleted: ${id}`)
    return c.json({ success: true, message: 'Volunteer deleted successfully' })
  } catch (error) {
    console.error('Error deleting volunteer:', error)
    return c.json({ error: 'Failed to delete volunteer', details: String(error) }, 500)
  }
})

// Bulk delete volunteers (admin)
app.post('/make-server-2a4be611/admin/volunteers/bulk-delete', async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Invalid or empty IDs array' }, 400)
    }

    await kv.mdel(ids)
    console.log(`Bulk deleted ${ids.length} volunteers`)
    return c.json({ success: true, message: `${ids.length} volunteers deleted successfully` })
  } catch (error) {
    console.error('Error bulk deleting volunteers:', error)
    return c.json({ error: 'Failed to bulk delete volunteers', details: String(error) }, 500)
  }
})

// Update news (admin)
app.put('/make-server-2a4be611/news/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, content, image } = body

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400)
    }

    const existing = await kv.get(id)
    if (!existing) {
      return c.json({ error: 'News not found' }, 404)
    }

    await kv.set(id, {
      ...existing,
      title,
      content,
      image: image || '',
      updatedAt: new Date().toISOString()
    })

    console.log(`News updated: ${id}`)
    return c.json({ success: true, message: 'News updated successfully' })
  } catch (error) {
    console.error('Error updating news:', error)
    return c.json({ error: 'Failed to update news', details: String(error) }, 500)
  }
})

// Get dashboard statistics (admin)
app.get('/make-server-2a4be611/admin/stats', requireAdmin, async (c) => {
  try {
    const [programs, news, contacts, volunteers, donations, subscribers] = await Promise.all([
      kv.getByPrefix('program:'),
      kv.getByPrefix('news:'),
      kv.getByPrefix('contact:'),
      kv.getByPrefix('volunteer:'),
      // Fetch donations from Postgres
      supabase.from('donations').select('*'),
      kv.getByPrefix('newsletter:')
    ])

    // donations from supabase Promise resolves to { data, error }
    const donationRows = Array.isArray(donations) ? donations : (donations.data || [])
    const totalDonations = donationRows.reduce((sum: number, d: any) => sum + (Number(d.amount || 0)), 0)
    const newContacts = contacts.filter(c => c.value.status === 'new').length
    const pendingVolunteers = volunteers.filter(v => v.value.status === 'pending').length

    const stats = {
      totalPrograms: programs.length,
      totalNews: news.length,
      totalContacts: contacts.length,
      newContacts,
      totalVolunteers: volunteers.length,
      pendingVolunteers,
      totalDonations: donationRows.length,
      totalDonationAmount: totalDonations,
      totalSubscribers: subscribers.length
    }

    return c.json({ stats })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return c.json({ error: 'Failed to fetch stats', details: String(error) }, 500)
  }
})

// Get advanced analytics (admin)
app.get('/make-server-2a4be611/admin/analytics', requireAdmin, async (c) => {
  try {
    const [donationsRes, contacts, volunteers, subscribers] = await Promise.all([
      supabase.from('donations').select('*'),
      kv.getByPrefix('contact:'),
      kv.getByPrefix('volunteer:'),
      kv.getByPrefix('newsletter:')
    ])
    const donations = donationsRes.data || []

    // Donation trends by month (last 12 months)
    const now = new Date()
    const monthlyDonations = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return {
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: 0,
        count: 0
      }
    }).reverse()

    donations.forEach((donation: any) => {
      const donationDate = new Date(donation.created_at || donation.timestamp || new Date().toISOString())
      const monthKey = donationDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      const monthData = monthlyDonations.find((m: any) => m.month === monthKey)
      if (monthData) {
        monthData.amount += Number(donation.amount || 0)
        monthData.count += 1
      }
    })

    // Donations by payment method
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {}
    donations.forEach((donation: any) => {
      const method = donation.method || donation.paymentMethod || 'unknown'
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 }
      }
      paymentMethods[method].count += 1
      paymentMethods[method].amount += Number(donation.amount || 0)
    })

    const paymentMethodData = Object.entries(paymentMethods).map(([name, data]) => ({
      name,
      count: data.count,
      amount: data.amount
    }))

    // Contact status distribution
    const contactStatusData = [
      { name: 'New', value: contacts.filter(c => c.value.status === 'new').length },
      { name: 'In Progress', value: contacts.filter(c => c.value.status === 'in-progress').length },
      { name: 'Resolved', value: contacts.filter(c => c.value.status === 'resolved').length }
    ]

    // Volunteer status distribution
    const volunteerStatusData = [
      { name: 'Pending', value: volunteers.filter(v => v.value.status === 'pending').length },
      { name: 'Approved', value: volunteers.filter(v => v.value.status === 'approved').length },
      { name: 'Rejected', value: volunteers.filter(v => v.value.status === 'rejected').length }
    ]

    // Growth trends (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        donations: 0,
        contacts: 0,
        volunteers: 0,
        subscribers: 0
      }
    }).reverse()

    donations.forEach((d: any) => {
      const date = (d.created_at || d.timestamp || new Date().toISOString()).split('T')[0]
      const day = last30Days.find((day: any) => day.date === date)
      if (day) day.donations += 1
    })

    contacts.forEach(c => {
      const date = (c.value.timestamp || c.value.created_at || new Date().toISOString()).split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.contacts += 1
    })

    volunteers.forEach(v => {
      const date = (v.value.timestamp || v.value.created_at || new Date().toISOString()).split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.volunteers += 1
    })

    subscribers.forEach(s => {
      const date = (s.value.timestamp || s.value.created_at || new Date().toISOString()).split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.subscribers += 1
    })

    return c.json({
      monthlyDonations,
      paymentMethodData,
      contactStatusData,
      volunteerStatusData,
      growthTrends: last30Days
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return c.json({ error: 'Failed to fetch analytics', details: String(error) }, 500)
  }
})

// Gallery routes
// Get all gallery images (public)
app.get('/make-server-2a4be611/gallery', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('gallery:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ images: data, count, limit, offset });
    }
    
    const images = await kv.getByPrefix('gallery:')
    // Sort by date descending
    images.sort((a, b) => new Date(b.value.date).getTime() - new Date(a.value.date).getTime())
    
    const galleryData = images.map(img => ({
      id: img.key,
      ...img.value
    }))
    
    return c.json(galleryData)
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return c.json({ error: 'Failed to fetch gallery', details: String(error) }, 500)
  }
})

// Get all gallery images (admin)
app.get('/make-server-2a4be611/admin/gallery', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('gallery:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ images: data, count, limit, offset });
    }
    
    const images = await kv.getByPrefix('gallery:')
    images.sort((a, b) => new Date(b.value.date).getTime() - new Date(a.value.date).getTime())
    return c.json({ images })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return c.json({ error: 'Failed to fetch gallery', details: String(error) }, 500)
  }
})

// Create gallery image (admin)
app.post('/make-server-2a4be611/admin/gallery', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, imageUrl, category } = body

    if (!title || !imageUrl) {
      return c.json({ error: 'Title and image URL are required' }, 400)
    }

    const imageId = `gallery:${crypto.randomUUID()}`
    await kv.set(imageId, {
      title,
      description: description || '',
      imageUrl,
      category: category || 'general',
      date: new Date().toISOString()
    })

    console.log(`Gallery image created: ${imageId}`)
    return c.json({ success: true, message: 'Image added successfully', id: imageId })
  } catch (error) {
    console.error('Error creating gallery image:', error)
    return c.json({ error: 'Failed to add image', details: String(error) }, 500)
  }
})

// Update gallery image (admin)
app.put('/make-server-2a4be611/admin/gallery/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, description, imageUrl, category } = body

    const existing = await kv.get(id)
    if (!existing) {
      return c.json({ error: 'Image not found' }, 404)
    }

    await kv.set(id, {
      ...existing,
      title: title || existing.title,
      description: description !== undefined ? description : existing.description,
      imageUrl: imageUrl || existing.imageUrl,
      category: category || existing.category,
      updatedAt: new Date().toISOString()
    })

    console.log(`Gallery image updated: ${id}`)
    return c.json({ success: true, message: 'Image updated successfully' })
  } catch (error) {
    console.error('Error updating gallery image:', error)
    return c.json({ error: 'Failed to update image', details: String(error) }, 500)
  }
})

// Delete gallery image (admin)
app.delete('/make-server-2a4be611/admin/gallery/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const existing = await kv.get(id)
    if (!existing) {
      return c.json({ error: 'Image not found' }, 404)
    }

    await kv.del(id)
    
    console.log(`Gallery image deleted: ${id}`)
    return c.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting gallery image:', error)
    return c.json({ error: 'Failed to delete image', details: String(error) }, 500)
  }
})

// Bulk delete gallery images (admin)
app.post('/make-server-2a4be611/admin/gallery/bulk-delete', async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'No image IDs provided' }, 400)
    }

    await kv.mdel(ids)
    
    console.log(`Bulk deleted ${ids.length} gallery images`)
    return c.json({ success: true, message: `${ids.length} images deleted successfully` })
  } catch (error) {
    console.error('Error bulk deleting gallery images:', error)
    return c.json({ error: 'Failed to delete images', details: String(error) }, 500)
  }
})

// Impact Stories routes
app.get('/make-server-2a4be611/stories', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('story:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ stories: data, count, limit, offset });
    }
    
    const stories = await kv.getByPrefix('story:')
    stories.sort((a, b) => new Date(b.value.date).getTime() - new Date(a.value.date).getTime())
    return c.json({ stories: stories.map(s => ({ id: s.key, ...s.value })) })
  } catch (error) {
    console.error('Error fetching stories:', error)
    return c.json({ error: 'Failed to fetch stories', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/stories', async (c) => {
  try {
    const body = await c.req.json()
    const { name, title, story, image, category, impact } = body
    const storyId = `story:${crypto.randomUUID()}`
    await kv.set(storyId, { name, title, story, image: image || '', category: category || 'general', impact: impact || '', date: new Date().toISOString() })
    return c.json({ success: true, message: 'Story added successfully', id: storyId })
  } catch (error) {
    console.error('Error creating story:', error)
    return c.json({ error: 'Failed to create story', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Story not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Story updated successfully' })
  } catch (error) {
    console.error('Error updating story:', error)
    return c.json({ error: 'Failed to update story', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Story deleted successfully' })
  } catch (error) {
    console.error('Error deleting story:', error)
    return c.json({ error: 'Failed to delete story', details: String(error) }, 500)
  }
})

// Team routes
app.get('/make-server-2a4be611/team', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('team:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ team: data, count, limit, offset });
    }
    
    const team = await kv.getByPrefix('team:')
    team.sort((a, b) => (a.value.order || 999) - (b.value.order || 999))
    return c.json({ team: team.map(t => ({ id: t.key, ...t.value })) })
  } catch (error) {
    console.error('Error fetching team:', error)
    return c.json({ error: 'Failed to fetch team', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/team', async (c) => {
  try {
    const body = await c.req.json()
    const { name, role, department, bio, image, email, linkedin, twitter, order } = body
    const memberId = `team:${crypto.randomUUID()}`
    await kv.set(memberId, { name, role, department: department || 'general', bio: bio || '', image: image || '', email: email || '', linkedin, twitter, order: order || 999 })
    return c.json({ success: true, message: 'Team member added successfully', id: memberId })
  } catch (error) {
    console.error('Error creating team member:', error)
    return c.json({ error: 'Failed to create team member', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/team/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Team member not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Team member updated successfully' })
  } catch (error) {
    console.error('Error updating team member:', error)
    return c.json({ error: 'Failed to update team member', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/team/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return c.json({ error: 'Failed to delete team member', details: String(error) }, 500)
  }
})

// Events routes
app.get('/make-server-2a4be611/events', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('event:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ events: data, count, limit, offset });
    }
    
    const events = await kv.getByPrefix('event:')
    events.sort((a, b) => new Date(b.value.date).getTime() - new Date(a.value.date).getTime())
    return c.json({ events: events.map(e => ({ id: e.key, ...e.value })) })
  } catch (error) {
    console.error('Error fetching events:', error)
    return c.json({ error: 'Failed to fetch events', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/events', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, date, time, location, image, category, capacity, status } = body
    const eventId = `event:${crypto.randomUUID()}`
    await kv.set(eventId, { title, description, date, time, location, image: image || '', category: category || 'general', capacity, registered: 0, status: status || 'upcoming' })
    return c.json({ success: true, message: 'Event added successfully', id: eventId })
  } catch (error) {
    console.error('Error creating event:', error)
    return c.json({ error: 'Failed to create event', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/events/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Event not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Event updated successfully' })
  } catch (error) {
    console.error('Error updating event:', error)
    return c.json({ error: 'Failed to update event', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/events/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return c.json({ error: 'Failed to delete event', details: String(error) }, 500)
  }
})

// Partners routes
app.get('/make-server-2a4be611/partners', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('partner:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ partners: data, count, limit, offset });
    }
    
    const partners = await kv.getByPrefix('partner:')
    return c.json({ partners: partners.map(p => ({ id: p.key, ...p.value })) })
  } catch (error) {
    console.error('Error fetching partners:', error)
    return c.json({ error: 'Failed to fetch partners', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/partners', async (c) => {
  try {
    const body = await c.req.json()
    const { name, description, logo, website, category, since } = body
    const partnerId = `partner:${crypto.randomUUID()}`
    await kv.set(partnerId, { name, description, logo: logo || '', website, category: category || 'general', since: since || new Date().getFullYear().toString() })
    return c.json({ success: true, message: 'Partner added successfully', id: partnerId })
  } catch (error) {
    console.error('Error creating partner:', error)
    return c.json({ error: 'Failed to create partner', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/partners/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Partner not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Partner updated successfully' })
  } catch (error) {
    console.error('Error updating partner:', error)
    return c.json({ error: 'Failed to update partner', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/partners/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Partner deleted successfully' })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return c.json({ error: 'Failed to delete partner', details: String(error) }, 500)
  }
})

// Impact Dashboard routes
app.get('/make-server-2a4be611/impact-stats', async (c) => {
  try {
    const stats = await kv.get('impact-stats')
    return c.json({ stats: stats || { peopleServed: 5000, programsActive: 12, volunteersActive: 150, fundsRaised: 250000, communitiesReached: 8, successRate: 92 } })
  } catch (error) {
    console.error('Error fetching impact stats:', error)
    return c.json({ error: 'Failed to fetch impact stats', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/impact-stats', async (c) => {
  try {
    const body = await c.req.json()
    await kv.set('impact-stats', body)
    return c.json({ success: true, message: 'Impact stats updated successfully' })
  } catch (error) {
    console.error('Error updating impact stats:', error)
    return c.json({ error: 'Failed to update impact stats', details: String(error) }, 500)
  }
})

app.get('/make-server-2a4be611/reports', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('report:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ reports: data, count, limit, offset });
    }
    
    const reports = await kv.getByPrefix('report:')
    reports.sort((a, b) => parseInt(b.value.year) - parseInt(a.value.year))
    return c.json({ reports: reports.map(r => ({ id: r.key, ...r.value })) })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return c.json({ error: 'Failed to fetch reports', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/reports', async (c) => {
  try {
    const body = await c.req.json()
    const { title, year, fileUrl, description, fileSize } = body
    const reportId = `report:${crypto.randomUUID()}`
    await kv.set(reportId, { title, year, fileUrl, description, fileSize })
    return c.json({ success: true, message: 'Report added successfully', id: reportId })
  } catch (error) {
    console.error('Error creating report:', error)
    return c.json({ error: 'Failed to create report', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/reports/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Report not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Report updated successfully' })
  } catch (error) {
    console.error('Error updating report:', error)
    return c.json({ error: 'Failed to update report', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/reports/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting report:', error)
    return c.json({ error: 'Failed to delete report', details: String(error) }, 500)
  }
})

// Volunteer Opportunities routes
app.get('/make-server-2a4be611/opportunities', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('opportunity:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ opportunities: data, count, limit, offset });
    }
    
    const opportunities = await kv.getByPrefix('opportunity:')
    return c.json({ opportunities: opportunities.map(o => ({ id: o.key, ...o.value })) })
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return c.json({ error: 'Failed to fetch opportunities', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/opportunities', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, requirements, timeCommitment, location, category, openPositions, benefits } = body
    const opportunityId = `opportunity:${crypto.randomUUID()}`
    await kv.set(opportunityId, { title, description, requirements: requirements || [], timeCommitment, location, category: category || 'general', openPositions: openPositions || 1, benefits: benefits || [] })
    return c.json({ success: true, message: 'Opportunity added successfully', id: opportunityId })
  } catch (error) {
    console.error('Error creating opportunity:', error)
    return c.json({ error: 'Failed to create opportunity', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/opportunities/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Opportunity not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Opportunity updated successfully' })
  } catch (error) {
    console.error('Error updating opportunity:', error)
    return c.json({ error: 'Failed to update opportunity', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/opportunities/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Opportunity deleted successfully' })
  } catch (error) {
    console.error('Error deleting opportunity:', error)
    return c.json({ error: 'Failed to delete opportunity', details: String(error) }, 500)
  }
})

// FAQ routes
app.get('/make-server-2a4be611/faqs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('faq:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ faqs: data, count, limit, offset });
    }
    
    const faqs = await kv.getByPrefix('faq:')
    faqs.sort((a, b) => (a.value.order || 999) - (b.value.order || 999))
    return c.json({ faqs: faqs.map(f => ({ id: f.key, ...f.value })) })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return c.json({ error: 'Failed to fetch FAQs', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/faqs', async (c) => {
  try {
    const body = await c.req.json()
    const { question, answer, category, order } = body
    const faqId = `faq:${crypto.randomUUID()}`
    await kv.set(faqId, { question, answer, category: category || 'general', order: order || 999 })
    return c.json({ success: true, message: 'FAQ added successfully', id: faqId })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return c.json({ error: 'Failed to create FAQ', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/faqs/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'FAQ not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'FAQ updated successfully' })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return c.json({ error: 'Failed to update FAQ', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/faqs/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'FAQ deleted successfully' })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return c.json({ error: 'Failed to delete FAQ', details: String(error) }, 500)
  }
})

// Resources routes
app.get('/make-server-2a4be611/resources', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('resource:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ resources: data, count, limit, offset });
    }
    
    const resources = await kv.getByPrefix('resource:')
    resources.sort((a, b) => new Date(b.value.date).getTime() - new Date(a.value.date).getTime())
    return c.json({ resources: resources.map(r => ({ id: r.key, ...r.value })) })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return c.json({ error: 'Failed to fetch resources', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/resources', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, fileUrl, fileType, fileSize, category } = body
    const resourceId = `resource:${crypto.randomUUID()}`
    await kv.set(resourceId, { title, description, fileUrl, fileType, fileSize, category: category || 'general', date: new Date().toISOString() })
    return c.json({ success: true, message: 'Resource added successfully', id: resourceId })
  } catch (error) {
    console.error('Error creating resource:', error)
    return c.json({ error: 'Failed to create resource', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/resources/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Resource not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Resource updated successfully' })
  } catch (error) {
    console.error('Error updating resource:', error)
    return c.json({ error: 'Failed to update resource', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/resources/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Resource deleted successfully' })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return c.json({ error: 'Failed to delete resource', details: String(error) }, 500)
  }
})

// Pages routes
app.get('/make-server-2a4be611/pages', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('page:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ pages: data, count, limit, offset });
    }
    
    const pages = await kv.getByPrefix('page:')

    // Seed default pages if none exist (first-run for existing installations)
    if (pages.length === 0) {
      const now = new Date().toISOString()
      const defaults = [
        { key: 'page:default-1', value: { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h2>Privacy Policy</h2><p>We are committed to protecting your personal information and your right to privacy.</p>', published: true, createdAt: now, updatedAt: now } },
        { key: 'page:default-2', value: { title: 'Terms of Service', slug: 'terms-of-service', content: '<h2>Terms of Service</h2><p>By accessing our website, you agree to be bound by these Terms of Service.</p>', published: true, createdAt: now, updatedAt: now } },
        { key: 'page:default-3', value: { title: 'Refund Policy', slug: 'refund-policy', content: '<h2>Refund Policy</h2><p>Donations are generally non-refundable. Please contact us if you believe a refund is warranted.</p>', published: true, createdAt: now, updatedAt: now } },
      ]
      await kv.mset(defaults)
      return c.json({ pages: defaults.map(d => ({ id: d.key, ...d.value })) })
    }

    pages.sort((a: any, b: any) => new Date(b.value.updatedAt || b.value.createdAt).getTime() - new Date(a.value.updatedAt || a.value.createdAt).getTime())
    return c.json({ pages: pages.map((p: any) => ({ id: p.key, ...p.value })) })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return c.json({ error: 'Failed to fetch pages', details: String(error) }, 500)
  }
})

// Get a single page by slug (used by the public-facing CustomPage component)
app.get('/make-server-2a4be611/pages/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const pages = await kv.getByPrefix('page:')
    const match = pages.find((p: any) => p.value?.slug === slug)
    if (!match) return c.json({ error: 'Page not found' }, 404)
    return c.json({ page: { id: match.key, ...match.value } })
  } catch (error) {
    console.error('Error fetching page by slug:', error)
    return c.json({ error: 'Failed to fetch page', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/pages', async (c) => {
  try {
    const body = await c.req.json()
    const { title, slug, content, published } = body
    if (!title || !slug) return c.json({ error: 'Title and slug are required' }, 400)
    const pageId = `page:${crypto.randomUUID()}`
    const now = new Date().toISOString()
    await kv.set(pageId, { title, slug, content: content || '', published: published ?? true, createdAt: now, updatedAt: now })
    return c.json({ success: true, message: 'Page created successfully', id: pageId })
  } catch (error) {
    console.error('Error creating page:', error)
    return c.json({ error: 'Failed to create page', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/pages/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Page not found' }, 404)
    await kv.set(id, { ...existing, ...body, updatedAt: new Date().toISOString() })
    return c.json({ success: true, message: 'Page updated successfully' })
  } catch (error) {
    console.error('Error updating page:', error)
    return c.json({ error: 'Failed to update page', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/pages/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true, message: 'Page deleted successfully' })
  } catch (error) {
    console.error('Error deleting page:', error)
    return c.json({ error: 'Failed to delete page', details: String(error) }, 500)
  }
})

// Initialize with sample data if empty
app.post('/make-server-2a4be611/initialize', async (c) => {
  try {
    const existingPrograms = await kv.getByPrefix('program:')
    
    if (existingPrograms.length === 0) {
      // Add sample programs
      await kv.set('program:1', {
        title: 'Education Support',
        description: 'Providing educational resources and support to children in Kiryandongo. We supply textbooks, uniforms, and learning materials to ensure every child has access to quality education.',
        image: 'https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjaGlsZHJlbiUyMGFmcmljYXxlbnwxfHx8fDE3NjI0NTc1OTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        category: 'education',
        createdAt: new Date().toISOString()
      })

      await kv.set('program:2', {
        title: 'Healthcare Access',
        description: 'Improving healthcare access through mobile clinics and health education programs. We focus on preventive care and community health awareness.',
        image: 'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
        category: 'healthcare',
        createdAt: new Date().toISOString()
      })

      await kv.set('program:3', {
        title: 'Community Development',
        description: 'Empowering communities through skills training, microfinance support, and sustainable livelihood programs.',
        image: 'https://images.unsplash.com/photo-1681011130080-46e470a7c96f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NjI0MzczNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        category: 'development',
        createdAt: new Date().toISOString()
      })

      // Add sample news
      await kv.set('news:1', {
        title: 'New School Library Opened',
        content: 'We are thrilled to announce the opening of a new library at Kiryandongo Primary School, providing access to over 1,000 books for students.',
        image: '',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      })

      await kv.set('news:2', {
        title: 'Health Camp Success',
        content: 'Our recent health camp served over 200 community members with free medical checkups, vaccinations, and health education.',
        image: '',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      })

      // Add sample gallery images
      await kv.set('gallery:1', {
        title: 'Community Meeting',
        description: 'Local leaders discussing community development projects',
        imageUrl: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
        category: 'events',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      })

      await kv.set('gallery:2', {
        title: 'School Children Learning',
        description: 'Students in our education support program',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
        category: 'education',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      })

      await kv.set('gallery:3', {
        title: 'Healthcare Outreach',
        description: 'Medical team providing free checkups',
        imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800',
        category: 'healthcare',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      })

      await kv.set('gallery:4', {
        title: 'Skills Training Workshop',
        description: 'Community members learning new vocational skills',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
        category: 'development',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      })

      // Add sample impact stories
      await kv.set('story:1', {
        name: 'Sarah Akello',
        title: 'Education Program Graduate',
        story: 'When I joined the education support program, I was struggling to afford school supplies. Thanks to Resti Kiryandongo CBO, I received books, uniforms, and tutoring. Today, I\'m in my final year of university studying to become a teacher.',
        image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800',
        category: 'education',
        impact: 'Now pursuing higher education and planning to give back to the community as a teacher',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      })

      await kv.set('story:2', {
        name: 'James Okello',
        title: 'Small Business Owner',
        story: 'The microfinance and skills training program changed my life. I learned tailoring and received a small loan to buy a sewing machine. My business now supports my family and I employ two other community members.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        category: 'development',
        impact: 'Started successful tailoring business employing 2 people',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      })

      // Add sample team members
      await kv.set('team:1', {
        name: 'Dr. Patricia Nalubega',
        role: 'Executive Director',
        department: 'leadership',
        bio: 'With over 15 years of experience in community development, Dr. Nalubega leads our organization with passion and dedication.',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
        email: 'director@restikirya.org',
        order: 1
      })

      await kv.set('team:2', {
        name: 'Moses Katende',
        role: 'Programs Coordinator',
        department: 'programs',
        bio: 'Moses oversees all our community programs ensuring quality delivery and measurable impact.',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
        email: 'programs@restikirya.org',
        order: 2
      })

      // Add sample events
      await kv.set('event:1', {
        title: 'Community Health Fair',
        description: 'Free health screenings, vaccinations, and health education for all community members. Bring your family!',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        time: '9:00 AM - 4:00 PM',
        location: 'Kiryandongo Community Center',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
        category: 'healthcare',
        capacity: 200,
        registered: 45,
        status: 'upcoming'
      })

      await kv.set('event:2', {
        title: 'Youth Skills Workshop',
        description: 'Learn valuable vocational skills including carpentry, tailoring, and computer basics.',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00 AM - 2:00 PM',
        location: 'Resti Training Center',
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        category: 'education',
        capacity: 50,
        registered: 32,
        status: 'upcoming'
      })

      // Add sample partners
      await kv.set('partner:1', {
        name: 'Uganda Development Foundation',
        description: 'Strategic partner providing funding and technical support for our education programs',
        logo: '',
        website: 'https://example.com',
        category: 'funding',
        since: '2020'
      })

      await kv.set('partner:2', {
        name: 'Global Health Initiative',
        description: 'Supporting our healthcare outreach programs with medical supplies and expertise',
        logo: '',
        category: 'healthcare',
        since: '2021'
      })

      // Add sample volunteer opportunities
      await kv.set('opportunity:1', {
        title: 'Education Mentor',
        description: 'Help students with homework, reading, and academic support. Make a lasting impact on a child\'s educational journey.',
        requirements: ['High school diploma or equivalent', 'Patient and encouraging attitude', 'Commitment of 2-4 hours per week'],
        timeCommitment: '2-4 hours per week',
        location: 'Kiryandongo Schools',
        category: 'education',
        openPositions: 5,
        benefits: ['Certificate of completion', 'Training provided', 'Flexible schedule']
      })

      await kv.set('opportunity:2', {
        title: 'Community Health Volunteer',
        description: 'Assist with health education, first aid, and connecting community members with healthcare services.',
        requirements: ['Basic health knowledge (training provided)', 'Good communication skills', 'Minimum 6-month commitment'],
        timeCommitment: '4-6 hours per week',
        location: 'Various community locations',
        category: 'healthcare',
        openPositions: 3,
        benefits: ['First aid certification', 'Health training', 'Community impact']
      })

      // Add sample FAQs
      await kv.set('faq:1', {
        question: 'How can I donate to Resti Kiryandongo CBO?',
        answer: 'You can donate through our secure online donation form, via bank transfer, or by contacting us directly. All donations are tax-deductible and go directly to supporting our community programs.',
        category: 'donations',
        order: 1
      })

      await kv.set('faq:2', {
        question: 'Can I volunteer if I don\'t live in Kiryandongo?',
        answer: 'Yes! We welcome remote volunteers for tasks like social media management, fundraising, grant writing, and online tutoring. We also have opportunities for short-term volunteers who can visit for a few weeks.',
        category: 'volunteering',
        order: 2
      })

      await kv.set('faq:3', {
        question: 'What programs do you offer?',
        answer: 'We offer programs in education support, healthcare access, community development, skills training, and microfinance. Each program is designed to create sustainable, long-term impact in the Kiryandongo community.',
        category: 'programs',
        order: 3
      })

      // Add sample resources
      await kv.set('resource:1', {
        title: 'Volunteer Application Form',
        description: 'Complete this form to apply for any of our volunteer positions',
        fileUrl: '#',
        fileType: 'PDF',
        fileSize: '245 KB',
        category: 'forms',
        date: new Date().toISOString()
      })

      await kv.set('resource:2', {
        title: 'Community Impact Guide 2024',
        description: 'Learn about our programs and how they\'re making a difference',
        fileUrl: '#',
        fileType: 'PDF',
        fileSize: '1.2 MB',
        category: 'educational',
        date: new Date().toISOString()
      })

      console.log('Sample data initialized')
    }

    // Always seed default pages if none exist
    const existingPages = await kv.getByPrefix('page:')
    if (existingPages.length === 0) {
      const now = new Date().toISOString()
      await kv.set('page:default-1', { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h2>Privacy Policy</h2><p>We are committed to protecting your personal information and your right to privacy. This policy outlines how we collect, use, and protect your data.</p>', published: true, createdAt: now, updatedAt: now })
      await kv.set('page:default-2', { title: 'Terms of Service', slug: 'terms-of-service', content: '<h2>Terms of Service</h2><p>By accessing our website, you agree to be bound by these Terms of Service. Please read them carefully before using our services.</p>', published: true, createdAt: now, updatedAt: now })
      await kv.set('page:default-3', { title: 'Refund Policy', slug: 'refund-policy', content: '<h2>Refund Policy</h2><p>Donations made to Resti Kiryandongo CBO are generally non-refundable. If you believe a refund is warranted, please contact us within 30 days.</p>', published: true, createdAt: now, updatedAt: now })
    }

    return c.json({ success: true, message: 'Initialization complete' })
  } catch (error) {
    console.error('Error initializing data:', error)
    return c.json({ error: 'Failed to initialize data', details: String(error) }, 500)
  }
})

// ============= SITE SETTINGS ROUTES =============

// Get all site settings
app.get('/make-server-2a4be611/site-settings', async (c) => {
  try {
    const settings = await kv.get('site_settings')
    
    // Return default settings if none exist
    if (!settings) {
      const defaultSettings = {
        general: {
          siteName: 'Resti Kiryandongo CBO',
          tagline: 'Community Based Organization',
          description: 'Empowering communities through education, healthcare, and sustainable development.',
          logoUrl: 'figma:asset/2b36c5cb8ddf5552ba2d3e612fd68401a7bb193e.png',
          primaryColor: '#10b981',
        },
        header: {
          showAnnouncement: true,
          announcementText: 'We are looking for volunteers in Kiryandongo',
          announcementLink: 'contact',
        },
        hero: {
          badgeText: 'Making a Difference in Kiryandongo',
          title: 'Empowering Communities Through Action',
          subtitle: 'Resti Kiryandongo CBO is dedicated to improving lives through education, healthcare, and community development initiatives in Kiryandongo District, Uganda.',
          primaryButtonText: 'Donate Now',
          secondaryButtonText: 'Learn More',
          imageUrl: 'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          stats: [
            { value: '500+', label: 'Families Supported' },
            { value: '10+', label: 'Active Programs' },
            { value: '50+', label: 'Volunteers' }
          ]
        },
        about: {
          title: 'About Resti Kiryandongo CBO',
          intro: 'Founded with a mission to empower and uplift communities in Kiryandongo District, we are a community-based organization dedicated to creating sustainable positive change through collaborative action and locally-driven solutions.',
          mission: 'To empower communities in Kiryandongo through sustainable development programs in education, healthcare, and economic empowerment, fostering self-reliance and improved quality of life for all.',
          vision: 'A thriving, self-sustaining community where every individual has access to quality education, healthcare, and opportunities for economic prosperity.',
          values: [
            { icon: 'Heart', title: 'Compassion', description: 'We approach every initiative with empathy and understanding for community needs.' },
            { icon: 'Users', title: 'Community', description: 'Working together with local leaders and residents to create lasting change.' },
            { icon: 'Target', title: 'Impact', description: 'Focused on measurable outcomes that improve quality of life.' },
            { icon: 'Award', title: 'Excellence', description: 'Committed to delivering high-quality programs and services.' }
          ],
          story: [
            'Resti Kiryandongo CBO was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.',
            'Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.'
          ]
        },
        contact: {
          title: 'Get Involved',
          subtitle: 'Join us in making a difference! Whether you want to volunteer, donate, or simply learn more about our work, we\'d love to hear from you.',
          address: 'Kiryandongo District, Uganda',
          email: 'info@restikirya.org',
          phone: '+256 XXX XXX XXX',
          whatsappNumber: '+256700000000',
          socialLinks: {
            facebook: '#',
            twitter: '#',
            instagram: '#'
          },
          supportItems: [
            'Volunteer your time and skills',
            'Make a donation to support our programs',
            'Partner with us on community initiatives',
            'Spread the word about our work'
          ]
        },
        donation: {
          merchantMTN: '0772 000 000',
          merchantAirtel: '0701 000 000',
          bankName: 'Stanbic Bank Uganda',
          accountName: 'Resti Kiryandongo CBO',
          accountNumber: '9030012345678',
          branch: 'Kiryandongo Branch',
          swiftCode: 'SBICUGKX',
        },
        footer: {
          description: 'Empowering communities through education, healthcare, and sustainable development.',
          copyrightText: 'Resti Kiryandongo CBO. All rights reserved.',
          taglineBottom: 'Made with ❤️ for our community'
        },
        sections: {
          programs: {
            title: 'Our Programs',
            description: 'We run comprehensive programs designed to address the most pressing needs in our community, creating pathways to opportunity and sustainable development.'
          },
          news: {
            title: 'Latest News & Updates',
            description: 'Stay informed about our recent activities, success stories, and upcoming events.'
          },
          gallery: {
            title: 'Photo Gallery',
            description: 'Explore moments from our programs, events, and the communities we serve.'
          },
          stories: {
            title: 'Impact Stories',
            description: 'Read inspiring stories from the lives we\'ve touched and the communities we\'ve transformed.'
          },
          team: {
            title: 'Meet Our Team',
            description: 'Get to know the dedicated individuals working tirelessly to make a difference in our community.'
          },
          events: {
            title: 'Events Calendar',
            description: 'Join us at our upcoming events and activities. Together, we can create positive change.'
          },
          partners: {
            title: 'Our Partners & Sponsors',
            description: 'We work with amazing organizations and individuals who share our vision for community development.'
          },
          faq: {
            title: 'Frequently Asked Questions',
            description: 'Find answers to common questions about our organization, programs, and how you can get involved.'
          },
          resources: {
            title: 'Resources & Downloads',
            description: 'Access our reports, publications, and educational materials to learn more about our work and impact.'
          },
          opportunities: {
            title: 'Volunteer Opportunities',
            description: 'Make a difference by volunteering with us. Explore available positions and find the perfect fit for your skills.'
          },
          impact: {
            title: 'Impact Dashboard',
            description: 'See the measurable impact of our work through data, statistics, and comprehensive reports.'
          }
        }
      }
      
      return c.json({ settings: defaultSettings })
    }
    
    return c.json({ settings })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return c.json({ error: 'Failed to fetch site settings', details: String(error) }, 500)
  }
})

// ── Update site settings (admin only) ───────────────────────────────────────
app.put('/make-server-2a4be611/site-settings', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { settings } = body
    
    if (!settings) {
      return c.json({ error: 'Settings object is required' }, 400)
    }
    
    await kv.set('site_settings', {
      ...settings,
      updatedAt: new Date().toISOString()
    })
    
    console.log('Site settings updated')
    return c.json({ success: true, message: 'Site settings updated successfully' })
  } catch (error) {
    console.error('Error updating site settings:', error)
    return c.json({ error: 'Failed to update site settings', details: String(error) }, 500)
  }
})

// Initialize default site settings
app.post('/make-server-2a4be611/site-settings/initialize', async (c) => {
  try {
    const defaultSettings = {
      general: {
        siteName: 'Resti Kiryandongo CBO',
        tagline: 'Community Based Organization',
        description: 'Empowering communities through education, healthcare, and sustainable development.',
        logoUrl: 'figma:asset/2b36c5cb8ddf5552ba2d3e612fd68401a7bb193e.png',
        primaryColor: '#10b981',
      },
      hero: {
        badgeText: 'Making a Difference in Kiryandongo',
        title: 'Empowering Communities Through Action',
        subtitle: 'Resti Kiryandongo CBO is dedicated to improving lives through education, healthcare, and community development initiatives in Kiryandongo District, Uganda.',
        primaryButtonText: 'Donate Now',
        secondaryButtonText: 'Learn More',
        imageUrl: 'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
        stats: [
          { value: '500+', label: 'Families Supported' },
          { value: '10+', label: 'Active Programs' },
          { value: '50+', label: 'Volunteers' }
        ]
      },
      about: {
        title: 'About Resti Kiryandongo CBO',
        intro: 'Founded with a mission to empower and uplift communities in Kiryandongo District, we are a community-based organization dedicated to creating sustainable positive change through collaborative action and locally-driven solutions.',
        mission: 'To empower communities in Kiryandongo through sustainable development programs in education, healthcare, and economic empowerment, fostering self-reliance and improved quality of life for all.',
        vision: 'A thriving, self-sustaining community where every individual has access to quality education, healthcare, and opportunities for economic prosperity.',
        values: [
          { icon: 'Heart', title: 'Compassion', description: 'We approach every initiative with empathy and understanding for community needs.' },
          { icon: 'Users', title: 'Community', description: 'Working together with local leaders and residents to create lasting change.' },
          { icon: 'Target', title: 'Impact', description: 'Focused on measurable outcomes that improve quality of life.' },
          { icon: 'Award', title: 'Excellence', description: 'Committed to delivering high-quality programs and services.' }
        ],
        story: [
          'Resti Kiryandongo CBO was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.',
          'Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.'
        ]
      },
      contact: {
        title: 'Get Involved',
        subtitle: 'Join us in making a difference! Whether you want to volunteer, donate, or simply learn more about our work, we\'d love to hear from you.',
        address: 'Kiryandongo District, Uganda',
        email: 'info@restikirya.org',
        phone: '+256 XXX XXX XXX',
        socialLinks: {
          facebook: '#',
          twitter: '#',
          instagram: '#'
        },
        supportItems: [
          'Volunteer your time and skills',
          'Make a donation to support our programs',
          'Partner with us on community initiatives',
          'Spread the word about our work'
        ]
      },
      footer: {
        description: 'Empowering communities through education, healthcare, and sustainable development.',
        copyrightText: 'Resti Kiryandongo CBO. All rights reserved.',
        taglineBottom: 'Made with ❤️ for our community'
      },
      sections: {
        programs: {
          title: 'Our Programs',
          description: 'We run comprehensive programs designed to address the most pressing needs in our community, creating pathways to opportunity and sustainable development.'
        },
        news: {
          title: 'Latest News & Updates',
          description: 'Stay informed about our recent activities, success stories, and upcoming events.'
        },
        gallery: {
          title: 'Photo Gallery',
          description: 'Explore moments from our programs, events, and the communities we serve.'
        },
        stories: {
          title: 'Impact Stories',
          description: 'Read inspiring stories from the lives we\'ve touched and the communities we\'ve transformed.'
        },
        team: {
          title: 'Meet Our Team',
          description: 'Get to know the dedicated individuals working tirelessly to make a difference in our community.'
        },
        events: {
          title: 'Events Calendar',
          description: 'Join us at our upcoming events and activities. Together, we can create positive change.'
        },
        partners: {
          title: 'Our Partners & Sponsors',
          description: 'We work with amazing organizations and individuals who share our vision for community development.'
        },
        faq: {
          title: 'Frequently Asked Questions',
          description: 'Find answers to common questions about our organization, programs, and how you can get involved.'
        },
        resources: {
          title: 'Resources & Downloads',
          description: 'Access our reports, publications, and educational materials to learn more about our work and impact.'
        },
        opportunities: {
          title: 'Volunteer Opportunities',
          description: 'Make a difference by volunteering with us. Explore available positions and find the perfect fit for your skills.'
        },
        impact: {
          title: 'Impact Dashboard',
          description: 'See the measurable impact of our work through data, statistics, and comprehensive reports.'
        }
      },
      createdAt: new Date().toISOString()
    }
    
    await kv.set('site_settings', defaultSettings)
    console.log('Default site settings initialized')
    return c.json({ success: true, message: 'Default site settings initialized' })
  } catch (error) {
    console.error('Error initializing site settings:', error)
    return c.json({ error: 'Failed to initialize site settings', details: String(error) }, 500)
  }
})

// ============= USER MANAGEMENT ROUTES =============

// ── Get all users (admin) ────────────────────────────────────────────────
app.get('/make-server-2a4be611/admin/users', requireAdmin, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('admin_user:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ users: data, count, limit, offset });
    }
    
    const users = await kv.getByPrefix('admin_user:')
    return c.json({ success: true, users: users || [] })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Failed to fetch users', details: String(error) }, 500)
  }
})

// Create new user (admin only)
app.post('/make-server-2a4be611/admin/users', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name, role, status } = body

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400)
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'viewer' },
      email_confirm: true // Auto-confirm email
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Store additional user info in KV
    const userId = `admin_user:${data.user.id}`
    await kv.set(userId, {
      id: data.user.id,
      email,
      name,
      role: role || 'viewer',
      status: status || 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      loginCount: 0
    })

    // Send welcome email
    await sendEmail(
      email,
      'Welcome to Resti Kiryandongo CBO Admin',
      `
        <h2>Welcome ${name}!</h2>
        <p>Your admin account has been created with the role: <strong>${role || 'viewer'}</strong></p>
        <p>You can login at: <a href="${Deno.env.get('SUPABASE_URL')}/admin">Admin Dashboard</a></p>
        <p>Email: ${email}</p>
        <p>Please keep your password secure.</p>
      `
    )

    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json({ error: 'Failed to create user', details: String(error) }, 500)
  }
})

// Update user (admin only)
app.put('/make-server-2a4be611/admin/users/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { name, role, status, email } = body

    const userId = `admin_user:${id}`
    const existingUser = await kv.get(userId)

    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Update user metadata in Supabase Auth
    const updateData: any = {
      user_metadata: {
        name: name || existingUser.name,
        role: role || existingUser.role
      }
    }

    if (email && email !== existingUser.email) {
      updateData.email = email
    }

    const { error } = await supabase.auth.admin.updateUserById(id, updateData)

    if (error) {
      console.error('Supabase auth update error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Update KV store
    await kv.set(userId, {
      ...existingUser,
      name: name || existingUser.name,
      role: role || existingUser.role,
      status: status || existingUser.status,
      email: email || existingUser.email,
      updatedAt: new Date().toISOString()
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return c.json({ error: 'Failed to update user', details: String(error) }, 500)
  }
})

// Delete user (admin only)
app.delete('/make-server-2a4be611/admin/users/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')

    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error && !error.message.includes('not found')) {
      console.error('Supabase auth delete error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Delete from KV store
    await kv.del(`admin_user:${id}`)

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return c.json({ error: 'Failed to delete user', details: String(error) }, 500)
  }
})

// Bulk update user status
app.post('/make-server-2a4be611/admin/users/bulk-status', async (c) => {
  try {
    const body = await c.req.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Valid ids array is required' }, 400)
    }

    for (const id of ids) {
      const userId = `admin_user:${id}`
      const user = await kv.get(userId)
      if (user) {
        await kv.set(userId, {
          ...user,
          status,
          updatedAt: new Date().toISOString()
        })
      }
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error bulk updating users:', error)
    return c.json({ error: 'Failed to bulk update users', details: String(error) }, 500)
  }
})

// Bulk update user roles
app.post('/make-server-2a4be611/admin/users/bulk-role', async (c) => {
  try {
    const body = await c.req.json()
    const { ids, role } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Valid ids array is required' }, 400)
    }

    for (const id of ids) {
      const userId = `admin_user:${id}`
      const user = await kv.get(userId)
      if (user) {
        // Update in Auth
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: { ...user, role }
        })

        // Update in KV
        await kv.set(userId, {
          ...user,
          role,
          updatedAt: new Date().toISOString()
        })
      }
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error bulk updating user roles:', error)
    return c.json({ error: 'Failed to bulk update roles', details: String(error) }, 500)
  }
})

// Bulk delete users
app.post('/make-server-2a4be611/admin/users/bulk-delete', async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Valid ids array is required' }, 400)
    }

    for (const id of ids) {
      // Delete from Auth
      await supabase.auth.admin.deleteUser(id).catch(err => {
        console.log(`User ${id} may not exist in auth:`, err.message)
      })

      // Delete from KV
      await kv.del(`admin_user:${id}`)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error bulk deleting users:', error)
    return c.json({ error: 'Failed to bulk delete users', details: String(error) }, 500)
  }
})

// Reset user password
app.post('/make-server-2a4be611/admin/users/:id/reset-password', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { password } = body

    if (!password) {
      return c.json({ error: 'Password is required' }, 400)
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password
    })

    if (error) {
      console.error('Password reset error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Get user info for email
    const userId = `admin_user:${id}`
    const user = await kv.get(userId)

    if (user && user.email) {
      await sendEmail(
        user.email,
        'Password Reset - Resti Kiryandongo CBO',
        `
          <h2>Password Reset</h2>
          <p>Your password has been reset by an administrator.</p>
          <p>You can now login with your new password.</p>
        `
      )
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error resetting password:', error)
    return c.json({ error: 'Failed to reset password', details: String(error) }, 500)
  }
})

// Track user login
app.post('/make-server-2a4be611/admin/users/:id/track-login', async (c) => {
  try {
    const id = c.req.param('id')
    const userId = `admin_user:${id}`
    const user = await kv.get(userId)

    if (user) {
      await kv.set(userId, {
        ...user,
        lastLogin: new Date().toISOString(),
        loginCount: (user.loginCount || 0) + 1
      })
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error tracking login:', error)
    return c.json({ error: 'Failed to track login', details: String(error) }, 500)
  }
})

// Note: The primary image upload route is defined above at line ~449. This duplicate is removed.

// Map Locations
app.get('/make-server-2a4be611/map-locations', async (c) => {
  try {
    const data = await kv.getByPrefix('map-location:')
    const locations = data.map((d: any) => ({
      id: d.key.split(':')[1],
      ...d.value
    }))
    return c.json({ locations, count: locations.length })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post('/make-server-2a4be611/admin/map-locations', requireAdmin, async (c) => {
  try {
    
    const body = await c.req.json()
    const { name, category, coordinates, description, impact } = body
    const id = `map-location:${crypto.randomUUID()}`
    
    await kv.set(id, { name, category, coordinates, description, impact, created_at: new Date().toISOString() })
    
    return c.json({ message: 'Location created successfully', id })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.put('/make-server-2a4be611/admin/map-locations/:id', requireAdmin, async (c) => {
  try {
    
    const id = c.req.param('id')
    const body = await c.req.json()
    const { name, category, coordinates, description, impact } = body
    const key = `map-location:${id}`
    
    const existing = await kv.get(key)
    await kv.set(key, { ...existing, name, category, coordinates, description, impact, updated_at: new Date().toISOString() })
    
    return c.json({ message: 'Location updated successfully' })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/map-locations/:id', requireAdmin, async (c) => {
  try {
    
    const id = c.req.param('id')
    await kv.del(`map-location:${id}`)
    return c.json({ message: 'Location deleted successfully' })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})


// --- LIVE CHAT ENDPOINTS ---

// User sends a message (creates or updates a session)
app.post('/make-server-2a4be611/livechat/message', async (c) => {
  try {
    const body = await c.req.json()
    const { sessionId, email, message } = body
    
    // If no sessionId, generate one
    const actualSessionId = sessionId || `chat-${crypto.randomUUID()}`
    const key = `livechat:${actualSessionId}`
    
    // Get existing session
    let session = await kv.get(key)
    
    if (!session) {
      session = {
        id: actualSessionId,
        email: email || '',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      }
    } else {
      session.updated_at = new Date().toISOString()
      if (email && !session.email) session.email = email
    }
    
    // Add user message
    session.messages.push({
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    })
    
    await kv.set(key, session)
    
    return c.json({ success: true, sessionId: actualSessionId })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// User polls for session updates
app.get('/make-server-2a4be611/livechat/session/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const session = await kv.get(`livechat:${id}`)
    if (!session) return c.json({ error: 'Session not found' }, 404)
    
    return c.json({ session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Admin lists all active chat sessions
app.get('/make-server-2a4be611/admin/livechats', requireAdmin, async (c) => {
  try {
    const data = await kv.getByPrefix('livechat:')
    const sessions = data.map((d: any) => d.value)
    sessions.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    return c.json({ sessions })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Admin replies to a session
app.post('/make-server-2a4be611/admin/livechats/:id/reply', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { message } = await c.req.json()
    const key = `livechat:${id}`
    
    const session = await kv.get(key)
    if (!session) return c.json({ error: 'Session not found' }, 404)
    
    session.updated_at = new Date().toISOString()
    session.messages.push({
      sender: 'bot',
      text: message,
      timestamp: new Date().toISOString()
    })
    
    await kv.set(key, session)
    
    return c.json({ success: true, session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ── Payment Provider Webhooks ───────────────────────────────────────────────
// These endpoints receive server-to-server callbacks from payment providers.
// Each verifies the provider's signature, prevents duplicate processing,
// atomically completes the donation, and sends the receipt once.

app.post('/make-server-2a4be611/webhooks/stripe', async (c) => {
  return handleStripeWebhook(c, stripe, sendEmail)
})

app.post('/make-server-2a4be611/webhooks/mtn', async (c) => {
  return handleMtnWebhook(c, sendEmail)
})

app.post('/make-server-2a4be611/webhooks/airtel', async (c) => {
  return handleAirtelWebhook(c, sendEmail)
})


Deno.serve(app.fetch)
