import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import type { Context, Next } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.5.0'
import * as kv from './kv_store.tsx'
import { escapeHtml, escapeMessage, validateName, validateEmail, validatePhone, validateMessage, validateSubject, validateAmount, validateMobileMoneyPhone, normaliseUgandanPhone, toStripeSmallestUnit, fromStripeSmallestUnit, validateStripeDonation } from './validation.ts'
import { withRateLimit } from './rateLimit.ts'
import { handleStripeWebhook, handleMtnWebhook, handleAirtelWebhook, completeDonationFromWebhook, deliverDonationReceipt, notifyAdminFailedDonation, getAdminNotifyEmails } from './webhooks.ts'
import { getMtnAccessToken, getAirtelAccessToken } from './tokens.ts'

const app = new Hono()

// ── CORS: restrict to approved origins only ──────────────────────────────────
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const ALLOWED_ORIGINS = Array.from(new Set([
  ...configuredOrigins,
  'https://resticbo.org',
  'https://www.resticbo.org',
  'https://restikirya.org',
  'https://www.restikirya.org',
  'http://localhost:5173',
  'http://localhost:3000',
]))

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

// ── Tiered Role Authorization Middlewares ─────────────────────────────────────
function normalizeAdminRole(role: string | null | undefined) {
  return role === 'super_admin' ? 'super-admin' : role
}

function normalizeContentKey(prefix: string, id: string) {
  const decodedId = decodeURIComponent(id)
  return decodedId.startsWith(`${prefix}:`) ? decodedId : `${prefix}:${decodedId}`
}

async function getAuthenticatedAdmin(c: Context): Promise<{ error?: string; status?: number; adminUser?: any }> {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token) {
    return { error: 'Unauthorized – authentication required', status: 401 }
  }
  
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (serviceRoleKey && token === serviceRoleKey) {
    return { adminUser: { id: 'service-role', email: 'admin@resticbo.org', role: 'super-admin' } }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { error: 'Unauthorized – invalid or expired token', status: 401 }
  }
  
  if (user.email === 'lokwodenis0@gmail.com' || user.email === 'lokwodenis@gmail.com') {
    return { adminUser: { id: user.id, email: user.email, role: 'super-admin' } }
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  const role = normalizeAdminRole(admin?.role) || normalizeAdminRole(user.user_metadata?.role) || 'viewer'
  if (adminError || !admin || admin.status !== 'active') {
    if (admin?.status === 'inactive' || admin?.status === 'suspended') {
      return { error: 'Forbidden – account is inactive or suspended', status: 403 }
    }
  }

  return {
    adminUser: {
      id: user.id,
      email: user.email,
      role: role || 'viewer',
    }
  }
}

// 1. Any authenticated active role (super-admin, admin, editor, viewer) - for viewing dashboard data
async function requireAuthUser(c: Context, next: Next) {
  const res = await getAuthenticatedAdmin(c)
  if (res.error) return c.json({ error: res.error }, res.status as any)
  c.set('adminUser', res.adminUser)
  await next()
}

// 2. Editor or higher (editor, admin, super-admin) - for creating & editing content
async function requireEditor(c: Context, next: Next) {
  const res = await getAuthenticatedAdmin(c)
  if (res.error) return c.json({ error: res.error }, res.status as any)
  const role = res.adminUser.role
  if (!['editor', 'admin', 'super-admin'].includes(role)) {
    return c.json({ error: 'Forbidden – editor privileges required (read-only mode)' }, 403)
  }
  c.set('adminUser', res.adminUser)
  await next()
}

// 3. Admin or higher (admin, super-admin) - for deleting content, site settings, broadcasts
async function requireAdmin(c: Context, next: Next) {
  const res = await getAuthenticatedAdmin(c)
  if (res.error) return c.json({ error: res.error }, res.status as any)
  const role = res.adminUser.role
  if (!['admin', 'super-admin'].includes(role)) {
    return c.json({ error: 'Forbidden – administrator privileges required' }, 403)
  }
  c.set('adminUser', res.adminUser)
  await next()
}

// 4. Super Admin only - for system user accounts & roles management
async function requireSuperAdmin(c: Context, next: Next) {
  const res = await getAuthenticatedAdmin(c)
  if (res.error) return c.json({ error: res.error }, res.status as any)
  const role = res.adminUser.role
  if (role !== 'super-admin') {
    return c.json({ error: 'Forbidden – super administrator privileges required' }, 403)
  }
  c.set('adminUser', res.adminUser)
  await next()
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function checkIsAdmin(c: Context): Promise<boolean> {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return false
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (serviceRoleKey && token === serviceRoleKey) return true
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return false
    
    if (user.email === 'lokwodenis0@gmail.com' || user.email === 'lokwodenis@gmail.com') {
      return true
    }
    
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('role, status')
      .eq('id', user.id)
      .single()
      
    if (adminError || !admin || admin.status !== 'active') return false
    const role = normalizeAdminRole(admin?.role)
    return ['admin', 'super-admin'].includes(role || '')
  } catch {
    return false
  }
}

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

// Email notification helper with reply_to support
async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!resendApiKey) {
    console.log('Resend API key not configured, skipping email')
    return { success: false, message: 'Email service not configured' }
  }

  try {
    const payload: Record<string, any> = {
      from: Deno.env.get('ADMIN_EMAIL') || 'RESTI CBO <info@resticbo.org>',
      to: [to],
      subject,
      html,
    }
    if (replyTo) {
      payload.reply_to = replyTo
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error(`Email send error to ${to}:`, data)
      return { success: false, error: data }
    }

    console.log(`Email sent successfully to ${to}:`, data)
    return { success: true, data }
  } catch (error) {
    console.error(`Email send exception to ${to}:`, error)
    return { success: false, error: String(error) }
  }
}


// Contact form submission with email notification
app.post('/make-server-2a4be611/contact', withRateLimit('contact', 10, 10 * 60_000), async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, subject, message } = body

    const nameV = validateName(name)
    const emailV = validateEmail(email)
    const phoneV = validatePhone(phone)
    const subjRaw = typeof subject === 'string' && subject.trim().length > 0
      ? subject.trim()
      : (typeof body.topic === 'string' && body.topic.trim().length > 0 ? body.topic.trim() : 'General Inquiry')
    const subjV = validateSubject(subjRaw)
    const msgV = validateMessage(message)

    if (!nameV.ok) return c.json({ error: nameV.error }, 400)
    if (!emailV.ok) return c.json({ error: emailV.error }, 400)
    if (!phoneV.ok) return c.json({ error: phoneV.error }, 400)
    if (!subjV.ok) return c.json({ error: subjV.error }, 400)
    if (!msgV.ok) return c.json({ error: msgV.error }, 400)

    const rawId = crypto.randomUUID()
    const contactId = `contact:${rawId}`
    const nowIso = new Date().toISOString()
    const safeName = escapeHtml(name.trim())
    const safeEmail = escapeHtml(email.trim())
    const safePhone = escapeHtml(phone ? phone.trim() : '')
    const safeSubject = escapeHtml(subjRaw)
    const safeMessage = escapeMessage(message)

    // 1. Store in KV store for Admin Dashboard
    await kv.set(contactId, {
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      subject: subjRaw,
      message,
      timestamp: nowIso,
      status: 'new'
    })

    // 2. Store in PostgreSQL contacts table for redundancy & SQL dashboard access
    try {
      await supabase.from('contacts').insert({
        id: rawId,
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : null,
        subject: subjRaw,
        message,
        status: 'new',
        created_at: nowIso,
        updated_at: nowIso
      })
    } catch (dbErr) {
      console.warn('Warning: Could not insert contact into SQL table:', dbErr)
    }

    // 3. Dispatch real notification email to Admin inbox(es) with visitor details & reply_to
    const adminRecipients = await getAdminNotifyEmails()
    const formattedDate = new Date().toUTCString()
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; padding: 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; }
          .content { padding: 28px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .info-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .info-table td.label { font-weight: 600; color: #64748b; width: 120px; }
          .info-table td.value { color: #0f172a; font-weight: 500; }
          .message-card { background: #f8fafc; border-left: 4px solid #10b981; border-radius: 4px; padding: 16px 20px; margin: 20px 0; font-size: 15px; color: #334155; line-height: 1.7; white-space: pre-wrap; }
          .reply-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 16px; margin: 24px 0 12px 0; text-align: center; }
          .reply-banner p { margin: 0; font-size: 13px; color: #065f46; font-weight: 500; }
          .reply-btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 10px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">🔔 Real-Time Website Alert</div>
            <h1>New Contact Message</h1>
          </div>
          <div class="content">
            <p style="margin-top: 0; font-size: 15px; color: #475569;">A visitor has submitted a new inquiry through the <strong>RESTI-CBO</strong> website contact form:</p>
            
            <table class="info-table">
              <tr>
                <td class="label">Sender Name:</td>
                <td class="value"><strong>${safeName}</strong></td>
              </tr>
              <tr>
                <td class="label">Email Address:</td>
                <td class="value"><a href="mailto:${safeEmail}" style="color: #059669; text-decoration: none; font-weight: 600;">${safeEmail}</a></td>
              </tr>
              <tr>
                <td class="label">Phone Number:</td>
                <td class="value">${safePhone || '<span style="color:#94a3b8;">Not provided</span>'}</td>
              </tr>
              <tr>
                <td class="label">Subject / Topic:</td>
                <td class="value"><strong>${safeSubject}</strong></td>
              </tr>
              <tr>
                <td class="label">Submitted At:</td>
                <td class="value">${formattedDate}</td>
              </tr>
            </table>

            <div style="font-weight: 600; font-size: 14px; color: #334155; margin-bottom: 6px;">Message Content:</div>
            <div class="message-card">${safeMessage}</div>

            <div class="reply-banner">
              <p>💡 You can reply directly to this email in your inbox to respond to <strong>${safeName}</strong>.</p>
              <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: ${subjRaw} - RESTI-CBO`)}" class="reply-btn">Reply to ${safeName}</a>
            </div>
          </div>
          <div class="footer">
            RESTI-CBO • Refugee and Host Community Empowerment • Kiryandongo District, Uganda<br>
            Notification automatically generated by resticbo.org
          </div>
        </div>
      </body>
      </html>
    `

    for (const recipient of adminRecipients) {
      console.log(`Dispatching visitor contact alert to admin: ${recipient}`)
      await sendEmail(
        recipient,
        `🔔 New Website Message: ${safeSubject} (from ${safeName}) - RESTI-CBO`,
        adminEmailHtml,
        email.trim()
      )
    }

    // 4. Send confirmation email to submitter (safely wrapped so sandbox mode won't block)
    try {
      await sendEmail(
        email.trim(),
        `Thank you for contacting RESTI-CBO: ${safeSubject}`,
        `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #047857; margin-top: 0;">Thank You for Reaching Out!</h2>
            <p>Dear ${safeName},</p>
            <p>We have received your message regarding <strong>${safeSubject}</strong> and a member of the RESTI-CBO team will get back to you shortly.</p>
            <div style="background: #f8fafc; border-left: 3px solid #10b981; padding: 12px 16px; margin: 16px 0;">
              <strong>Topic:</strong> ${safeSubject}<br><br>
              <strong>Your Message:</strong><br>
              ${safeMessage}
            </div>
            <p>Warm regards,<br><strong>RESTI-CBO Team</strong><br>Kiryandongo District, Uganda<br><a href="https://resticbo.org" style="color: #047857;">www.resticbo.org</a></p>
          </div>
        `
      )
    } catch (confErr) {
      console.warn('Confirmation email to submitter skipped or failed:', confErr)
    }

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
      data.sort((a, b) => new Date(b.value?.createdAt || b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.createdAt || a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ programs: data, count, limit, offset });
    }
    
    const programs = await kv.getByPrefix('program:')
    // Filter out any invalid entries
    const validPrograms = programs.filter(p => p && p.value && p.value.title)
    validPrograms.sort((a, b) => new Date(b.value?.createdAt || b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.createdAt || a.value?.timestamp || a.value?.created_at || 0).getTime());
    return c.json({ programs: validPrograms })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return c.json({ error: 'Failed to fetch programs', details: String(error) }, 500)
  }
})

// Get a single program
app.get('/make-server-2a4be611/programs/:id', async (c) => {
  try {
    const rawId = c.req.param('id')
    const id = normalizeContentKey('program', rawId)
    const program = await kv.get(id)
    if (!program) {
      return c.json({ error: 'Program not found' }, 404)
    }
    return c.json({ program: { key: id, value: program } })
  } catch (error) {
    console.error('Error fetching program:', error)
    return c.json({ error: 'Failed to fetch program', details: String(error) }, 500)
  }
})

// Add a new program (admin function)
app.post('/make-server-2a4be611/programs', requireEditor, async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, image, category } = body

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400)
    }

    const programId = `program:${crypto.randomUUID()}`
    await kv.set(programId, {
      ...body,
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

// Get all news/updates (with status filtering for public vs admin)
app.get('/make-server-2a4be611/news', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    const categoryFilter = c.req.query('category');
    const statusFilter = c.req.query('status');
    const searchFilter = c.req.query('search')?.toLowerCase().trim();
    
    const isAdmin = await checkIsAdmin(c);
    
    const rawNews = await kv.getByPrefix('news:');
    
    let items = (rawNews || [])
      .filter(n => n && n.value && (n.value.title || n.value.timestamp))
      .map(n => ({
        key: n.key,
        id: n.key,
        ...n.value
      }));

    // Status filtering
    if (!isAdmin) {
      // Public callers strictly get published articles where publishDate <= now
      const nowMs = Date.now();
      items = items.filter(item => {
        const status = (item.status || 'published').toLowerCase();
        if (status !== 'published') return false;
        const pubDateMs = item.publishDate ? new Date(item.publishDate).getTime() : (item.timestamp ? new Date(item.timestamp).getTime() : 0);
        return pubDateMs === 0 || pubDateMs <= nowMs;
      });
    } else if (statusFilter && statusFilter !== 'all') {
      items = items.filter(item => (item.status || 'published').toLowerCase() === statusFilter.toLowerCase());
    }

    // Category filtering
    if (categoryFilter && categoryFilter !== 'all') {
      items = items.filter(item => (item.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // Search filtering
    if (searchFilter) {
      items = items.filter(item => 
        (item.title && item.title.toLowerCase().includes(searchFilter)) ||
        (item.description && item.description.toLowerCase().includes(searchFilter)) ||
        (item.summary && item.summary.toLowerCase().includes(searchFilter)) ||
        (item.author && item.author.toLowerCase().includes(searchFilter)) ||
        (item.content && item.content.toLowerCase().includes(searchFilter))
      );
    }

    // Sort by publication date or timestamp descending
    items.sort((a, b) => {
      const dateA = new Date(a.publishDate || a.timestamp || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishDate || b.timestamp || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const totalCount = items.length;
    const paginatedItems = items.slice(offset, offset + limit);

    return c.json({ 
      news: paginatedItems.map(item => ({
        key: item.key,
        value: item
      })),
      articles: paginatedItems,
      count: totalCount, 
      total: totalCount,
      limit, 
      offset 
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return c.json({ error: 'Failed to fetch news', details: String(error) }, 500);
  }
});

// Get single news article by ID, key, or slug
app.get('/make-server-2a4be611/news/:idOrSlug', async (c) => {
  try {
    const rawParam = c.req.param('idOrSlug');
    const decodedParam = decodeURIComponent(rawParam);
    const normalizedKey = normalizeContentKey('news', decodedParam);

    let article = await kv.get(normalizedKey);
    let key = normalizedKey;

    if (!article) {
      const allNews = await kv.getByPrefix('news:');
      const match = allNews.find(item => {
        if (!item || !item.value) return false;
        const v = item.value;
        return item.key === decodedParam ||
               item.key === normalizedKey ||
               v.id === decodedParam ||
               v.slug === decodedParam ||
               (v.title && v.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-') === decodedParam);
      });
      if (match) {
        article = match.value;
        key = match.key;
      }
    }

    if (!article) {
      return c.json({ error: 'News article not found' }, 404);
    }

    const isAdmin = await checkIsAdmin(c);
    if (!isAdmin) {
      const status = (article.status || 'published').toLowerCase();
      const pubDateMs = article.publishDate ? new Date(article.publishDate).getTime() : (article.timestamp ? new Date(article.timestamp).getTime() : 0);
      if (status !== 'published' || (pubDateMs > 0 && pubDateMs > Date.now())) {
        return c.json({ error: 'News article not found' }, 404);
      }
    }

    return c.json({ success: true, article: { ...article, key, id: key } });
  } catch (error) {
    console.error('Error fetching single news article:', error);
    return c.json({ error: 'Failed to fetch article', details: String(error) }, 500);
  }
});

// Add news/update (admin function)
app.post('/make-server-2a4be611/news', requireEditor, async (c) => {
  try {
    const body = await c.req.json();
    const { title, content } = body;

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    const newsId = `news:${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    
    // Generate clean slug if not provided
    const baseSlug = (body.slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'news-article';
      
    const slug = baseSlug;

    const articleData = {
      ...body,
      id: newsId,
      key: newsId,
      title: title.trim(),
      slug,
      description: body.description || body.summary || '',
      summary: body.description || body.summary || '',
      content,
      image: body.image || '',
      additionalImages: Array.isArray(body.additionalImages) ? body.additionalImages : [],
      category: body.category || 'Community',
      author: body.author || 'RESTI Communications Team',
      publishDate: body.publishDate || nowIso,
      status: body.status || 'published',
      featured: Boolean(body.featured),
      seoTitle: body.seoTitle || title,
      seoDescription: body.seoDescription || body.description || body.summary || '',
      ogTitle: body.ogTitle || body.seoTitle || title,
      ogDescription: body.ogDescription || body.seoDescription || body.description || '',
      timestamp: body.publishDate || nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await kv.set(newsId, articleData);

    console.log(`News created: ${newsId} (slug: ${slug})`);
    return c.json({ success: true, message: 'News created successfully', id: newsId, article: articleData });
  } catch (error) {
    console.error('Error creating news:', error);
    return c.json({ error: 'Failed to create news', details: String(error) }, 500);
  }
});


// Create Stripe payment intent
app.post('/make-server-2a4be611/create-payment-intent', async (c) => {
  try {
    if (!stripe) {
      return c.json({ error: 'Stripe is not configured. Please add your STRIPE_SECRET_KEY.' }, 400)
    }

    const body = await c.req.json()
    const { amount, currency, donorName, donorEmail, donorPhone, donorCountry, campaign } = body

    // Server-side strict validation
    const val = validateStripeDonation(amount, currency)
    if (!val.ok || !val.validAmount || !val.validCurrency) {
      return c.json({ error: val.error || 'Invalid amount or currency' }, 400)
    }

    const validAmount = val.validAmount
    const validCurrency = val.validCurrency

    // Generate unique internal donation reference
    const internalReference = `RESTI-CARD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const smallestUnitAmount = toStripeSmallestUnit(validAmount, validCurrency)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: smallestUnitAmount,
      currency: validCurrency.toLowerCase(),
      metadata: {
        restiDonationId: internalReference,
        internalReference,
        transactionId: internalReference,
        paymentPurpose: 'resti_donation',
        campaignId: campaign || 'Where Most Needed',
        donorName: donorName || 'Anonymous',
        donorEmail: donorEmail || '',
        donorPhone: donorPhone || '',
        donorCountry: donorCountry || 'Uganda'
      },
    })

    // Create the canonical PENDING record in Postgres immediately so webhook can verify and update it
    const parts = (donorName || 'Anonymous').trim().split(' ')
    const firstName = parts[0] || 'Anonymous'
    const lastName = parts.slice(1).join(' ') || ''
    const nowIso = new Date().toISOString()

    const donationRecord = {
      id: `donation:${internalReference}`,
      amount: validAmount,
      currency: validCurrency,
      method: 'card',
      provider: 'stripe',
      status: 'pending',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      transaction_id: internalReference,
      provider_transaction_id: paymentIntent.id,
      provider_response: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        campaign: campaign || 'Where Most Needed',
        donorCountry: donorCountry || null,
        donorPhone: donorPhone || null,
        createdAt: nowIso,
        audit_trail: [
          {
            action: 'intent_created',
            timestamp: nowIso,
            actor: donorEmail || firstName || 'Donor',
            details: `Stripe PaymentIntent initialized for ${validCurrency} ${validAmount}`
          }
        ]
      },
      created_at: nowIso,
      updated_at: nowIso
    }

    const { error: insertErr } = await supabase.from('donations').insert(donationRecord)
    if (insertErr) {
      console.error('Error recording pending donation in Postgres:', insertErr)
    }
    try {
      await kv.set(`donation:${internalReference}`, donationRecord)
    } catch (kvErr) {
      console.warn('Could not sync pending donation to kv:', kvErr)
    }

    console.log(`Payment intent created: ${paymentIntent.id} (ref: ${internalReference}, amount: ${smallestUnitAmount} ${validCurrency})`)
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

// Create Stripe Checkout Session (for subscriptions/recurring or hosted checkout)
app.post('/make-server-2a4be611/create-checkout-session', async (c) => {
  try {
    if (!stripe) {
      return c.json({ error: 'Stripe is not configured.' }, 400)
    }

    const body = await c.req.json()
    const { amount, currency, donorName, donorEmail, interval, successUrl, cancelUrl, campaign } = body

    const val = validateStripeDonation(amount, currency)
    if (!val.ok || !val.validAmount || !val.validCurrency) {
      return c.json({ error: val.error || 'Invalid amount or currency' }, 400)
    }

    const validAmount = val.validAmount
    const validCurrency = val.validCurrency
    const isRecurring = !!interval
    const internalReference = `RESTI-CHK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const smallestUnitAmount = toStripeSmallestUnit(validAmount, validCurrency)

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: validCurrency.toLowerCase(),
            ...(isRecurring ? { recurring: { interval: interval } } : {}),
            unit_amount: smallestUnitAmount,
            product_data: {
              name: isRecurring ? `Recurring Donation to RESTI CBO` : `Donation to RESTI CBO (${campaign || 'Where Most Needed'})`,
              description: isRecurring ? `A ${interval}ly donation. Thank you for your support!` : `One-time donation. Thank you for your support!`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${c.req.header('origin') || 'http://localhost:5173'}/donate?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: cancelUrl || `${c.req.header('origin') || 'http://localhost:5173'}/donate`,
      customer_email: donorEmail || undefined,
      metadata: {
        restiDonationId: internalReference,
        internalReference,
        transactionId: internalReference,
        paymentPurpose: 'resti_donation',
        campaignId: campaign || 'Where Most Needed',
        donorName: donorName || 'Anonymous',
        donorEmail: donorEmail || '',
        isRecurring: isRecurring ? 'true' : 'false',
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Record pending donation
    const parts = (donorName || 'Anonymous').trim().split(' ')
    const firstName = parts[0] || 'Anonymous'
    const lastName = parts.slice(1).join(' ') || ''
    const nowIso = new Date().toISOString()

    const donationRecord = {
      id: `donation:${internalReference}`,
      amount: validAmount,
      currency: validCurrency,
      method: isRecurring ? 'card_recurring' : 'card',
      provider: 'stripe',
      status: 'pending',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      transaction_id: internalReference,
      provider_transaction_id: session.id,
      provider_response: {
        checkoutSessionId: session.id,
        isRecurring,
        createdAt: nowIso
      },
      created_at: nowIso,
      updated_at: nowIso
    }

    await supabase.from('donations').insert(donationRecord).catch(e => console.error('Error inserting checkout pending donation:', e))
    try {
      await kv.set(`donation:${internalReference}`, donationRecord)
    } catch {}

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

    const internalRef = session.metadata?.restiDonationId || session.id
    const { data: donation, error: findErr } = await supabase.from('donations').select('*').or(`transaction_id.eq.${sessionId},transaction_id.eq.${internalRef}`)

    if (findErr) {
      console.error('DB lookup error in verify-session:', findErr)
      return c.json({ error: 'Database lookup failed' }, 500)
    }

    const cur = (session.currency || 'USD').toUpperCase()
    const amountTotal = fromStripeSmallestUnit(session.amount_total || 0, cur)

    if (!donation || donation.length === 0) {
      // Confirmed paid by Stripe directly. Create canonical completed donation.
      const parts = (session.metadata?.donorName || session.customer_details?.name || 'Anonymous Donor').split(' ')
      const firstName = parts[0] || 'Anonymous'
      const lastName = parts.slice(1).join(' ') || ''
      const donorEmail = session.customer_details?.email || session.customer_email || session.metadata?.donorEmail || ''
      const donationId = `donation:${internalRef}`

      const newRecord = {
        id: donationId,
        amount: amountTotal,
        currency: cur,
        method: session.mode === 'subscription' ? 'card_recurring' : 'card',
        provider: 'stripe',
        first_name: firstName,
        last_name: lastName,
        email: donorEmail,
        status: 'completed',
        transaction_id: internalRef,
        provider_transaction_id: session.payment_intent?.toString() || session.id,
        provider_response: { verifiedBy: 'verify-session', sessionId: session.id },
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await supabase.from('donations').upsert(newRecord, { onConflict: 'id' })
      return c.json({ status: 'completed' })
    }

    // Return canonical status
    const d = donation[0]
    return c.json({ status: d.status || 'completed' })
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
      return_url: returnUrl || `${c.req.header('origin') || 'http://localhost:5173'}/donate`,

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
    const keys = id.includes(':') ? [id] : [id, `donation:${id}`]
    // Delete from Postgres canonical donations table
    const { error: delErr } = await supabase.from('donations').delete().in('id', keys)
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
      donorCountry,
      campaign,
      message,
      paymentIntentId,
      transactionId,
      proofUrl,
      proofFileName,
      status: clientStatus
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
    
    const finalTransactionId = transactionId || (
      paymentMethod === 'bank_transfer'
        ? `RESTI-2026-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
        : crypto.randomUUID()
    )
    const nowIso = new Date().toISOString()
    const upperCurrency = (currency || 'USD').toUpperCase()

    // Determine status: bank transfers are strictly pending_verification
    const isBank = paymentMethod === 'bank_transfer'
    const finalStatus = isBank ? 'pending_verification' : (clientStatus === 'pending_verification' ? 'pending_verification' : 'pending')

    const initialAuditTrail = [
      {
        action: 'submitted',
        timestamp: nowIso,
        actor: donorEmail || firstName || 'Donor',
        details: isBank 
          ? 'Bank transfer submitted by donor — awaiting administrative verification against bank records'
          : 'Donation pledge recorded — awaiting payment'
      }
    ]

    const providerResponseObj: Record<string, any> = {
      message: message || (isBank ? `Voluntary bank transfer for ${campaign || 'Where Most Needed'}` : 'Pledged / pending donation'),
      donation_reference: finalTransactionId,
      submitted_at: nowIso,
      audit_trail: initialAuditTrail
    }

    if (proofUrl) {
      providerResponseObj.proof_url = proofUrl
      providerResponseObj.proof_file_name = proofFileName || 'transfer_receipt'
    }
    if (donorCountry) providerResponseObj.donor_country = donorCountry
    if (donorPhone) providerResponseObj.donor_phone = donorPhone
    if (campaign) providerResponseObj.campaign = campaign

    const donationRecord = {
      id: donationId,
      amount: Number(amount),
      currency: upperCurrency,
      method: paymentMethod,
      provider: paymentMethod === 'mtn' || paymentMethod === 'airtel' ? paymentMethod : (isBank ? 'bank' : 'other'),
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      status: finalStatus,
      transaction_id: finalTransactionId,
      provider_response: providerResponseObj,
      created_at: nowIso,
      updated_at: nowIso
    }

    const { error: insertErr } = await supabase.from('donations').insert(donationRecord)
    
    if (insertErr) {
      console.error('Failed to record pending donation in Postgres:', insertErr)
      return c.json({ error: 'Database error' }, 500)
    }

    // Also sync to KV store for admin dashboard
    try {
      await kv.set(donationId, {
        ...donationRecord,
        proof_url: proofUrl || null,
        proof_file_name: proofFileName || null,
        donation_reference: finalTransactionId,
        audit_trail: initialAuditTrail
      })
    } catch (kvErr) {
      console.warn('Could not sync pending donation to kv:', kvErr)
    }

    // 1. Send instruction / acknowledgment email to donor if email provided
    if (donorEmail && donorEmail.trim()) {
      try {
        const donorSubject = isBank 
          ? `Bank Transfer Received — Awaiting Verification – RESTI-CBO (Ref: ${finalTransactionId})`
          : `Donation Pledge Received – RESTI-CBO (Ref: ${finalTransactionId})`

        const donorHtml = isBank ? `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 24px; border-radius: 8px; text-align: center;">
              <h2 style="margin: 0;">RESTI-CBO</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Bank Transfer Donation Notice</p>
            </div>
            <div style="padding: 24px 0;">
              <p>Dear <strong>${firstName} ${lastName}</strong>,</p>
              <p>Thank you for supporting <strong>RESTI CBO</strong>. Your bank-transfer donation of <strong>${upperCurrency} ${Number(amount).toLocaleString()}</strong> has been recorded and is awaiting confirmation of receipt. We will update your donation status once the transfer has been verified.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Your Transfer Reference Code:</div>
                <div style="font-size: 20px; font-weight: 800; color: #047857; margin: 6px 0; font-family: monospace;">${finalTransactionId}</div>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">Please ensure this reference code is included in your deposit or wire transfer description.</p>
                ${proofUrl ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #047857; font-weight: 600;">✓ Proof of transfer document received</p>` : ''}
              </div>

              <p style="font-size: 13px; color: #475569;">Our finance team reconciles incoming transfers against our bank statement. Once verified, an official donation receipt will be emailed to this address and made available in your Supporter Portal.</p>
              <p style="margin-top: 24px;">With gratitude,<br><strong>RESTI-CBO Finance & Donor Care Team</strong><br>Kiryandongo District, Uganda</p>
            </div>
          </body>
          </html>
        ` : `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 24px; border-radius: 8px; text-align: center;">
              <h2 style="margin: 0;">RESTI-CBO</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Donation Pledge Acknowledgment</p>
            </div>
            <div style="padding: 24px 0;">
              <p>Dear <strong>${firstName} ${lastName}</strong>,</p>
              <p>Thank you for pledging to support <strong>RESTI-CBO</strong>. Your donation pledge of <strong>${upperCurrency} ${Number(amount).toLocaleString()}</strong> has been recorded.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Your Transfer Reference Code:</div>
                <div style="font-size: 20px; font-weight: 800; color: #047857; margin: 6px 0; font-family: monospace;">${finalTransactionId}</div>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">Please include this reference code in your transfer description or deposit note so our finance team can verify and issue your official receipt immediately upon receipt.</p>
              </div>

              <p style="font-size: 13px; color: #475569;">If you have already initiated the transfer, please allow 1–3 business days for bank processing. If you have questions, reply directly to this email.</p>
              <p style="margin-top: 24px;">With gratitude,<br><strong>RESTI-CBO Finance & Donor Care Team</strong><br>Kiryandongo District, Uganda</p>
            </div>
          </body>
          </html>
        `
        await sendEmail(donorEmail.trim(), donorSubject, donorHtml, 'info@resticbo.org')
      } catch (dErr) {
        console.warn('Could not send donor pledge confirmation email:', dErr)
      }
    }

    // 2. Send real-time alert to admin inboxes
    try {
      const adminRecipients = await getAdminNotifyEmails()
      const adminSubject = isBank
        ? `📋 New Bank Transfer (Pending Verification): ${upperCurrency} ${Number(amount).toLocaleString()} from ${firstName} ${lastName} (Ref: ${finalTransactionId})`
        : `📋 New Donation Pledge (${paymentMethod}): ${upperCurrency} ${Number(amount).toLocaleString()} from ${firstName} ${lastName}`

      const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #1e293b; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">
              ${isBank ? 'Bank Transfer — Awaiting Verification' : 'Pending Donation Alert'}
            </div>
            <h2 style="margin: 4px 0 0 0;">${isBank ? 'Bank Transfer Donation Submitted' : 'New Donation Pledge Recorded'}</h2>
          </div>
          <div style="padding: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Amount:</td><td style="padding: 8px; font-weight: 700; color: #0f172a;">${upperCurrency} ${Number(amount).toLocaleString()}</td></tr>
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Payment Method:</td><td style="padding: 8px;">Bank Wire Transfer</td></tr>
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Donor:</td><td style="padding: 8px; font-weight: 600;">${firstName} ${lastName}</td></tr>
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Email:</td><td style="padding: 8px;">${donorEmail ? `<a href="mailto:${donorEmail}">${donorEmail}</a>` : 'Not provided'}</td></tr>
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Phone:</td><td style="padding: 8px;">${donorPhone || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Reference ID:</td><td style="padding: 8px; font-family: monospace; font-weight: 700;">${finalTransactionId}</td></tr>
              <tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Status:</td><td style="padding: 8px; color: #d97706; font-weight: 700;">PENDING VERIFICATION (Awaiting Bank Confirmation)</td></tr>
              ${proofUrl ? `<tr><td style="padding: 8px; color: #64748b; font-weight: 600;">Proof of Transfer:</td><td style="padding: 8px;"><a href="${proofUrl}" target="_blank" style="color: #047857; font-weight: 600;">View Uploaded Receipt (${proofFileName || 'Receipt'})</a></td></tr>` : ''}
            </table>
            <p style="font-size: 12px; color: #64748b;">To verify this donation, verify receipt in the RESTI bank account and click "Verify" in the RESTI Admin Dashboard.</p>
          </div>
        </body>
        </html>
      `
      for (const adminTo of adminRecipients) {
        await sendEmail(adminTo, adminSubject, adminHtml, donorEmail || 'info@resticbo.org')
      }
    } catch (aErr) {
      console.warn('Could not send admin pledge alert:', aErr)
    }

    console.log(`Donation recorded: ${donationId} [${finalStatus}]`)
    return c.json({ 
      success: true, 
      message: isBank ? 'Donation submitted — awaiting verification' : 'Donation pending — awaiting payment confirmation', 
      id: donationId, 
      referenceId: finalTransactionId,
      status: finalStatus
    })
  } catch (error) {
    console.error('Error recording donation:', error)
    return c.json({ error: 'Failed to record donation', details: String(error) }, 500)
  }
})

// Document/receipt upload for bank transfer proofs (public rate-limited, images & pdfs up to 10MB)
app.post('/make-server-2a4be611/donations/upload-proof', withRateLimit('proof_upload', 10, 5 * 60_000), async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid file uploaded' }, 400)
    }
    const maxBytes = 10 * 1024 * 1024 // 10MB
    if (file.size > maxBytes) {
      return c.json({ error: 'File exceeds 10MB limit' }, 400)
    }
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']
    const fileExt = ('.' + file.name.split('.').pop()).toLowerCase()
    if (!allowedExtensions.includes(fileExt)) {
      return c.json({ error: 'Only PDF, PNG, JPG, JPEG, and WEBP files are allowed' }, 400)
    }
    const bucketName = 'make-2a4be611-uploads'
    const fileName = `transfer-proofs/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })
    if (uploadError) {
      return c.json({ error: 'Failed to upload transfer proof', details: uploadError.message }, 500)
    }
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)
    return c.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      size: file.size
    })
  } catch (error) {
    console.error('Error uploading transfer proof:', error)
    return c.json({ error: 'Failed to upload transfer proof', details: String(error) }, 500)
  }
})

// Admin: Verify bank transfer donation (mark paid after confirming money received)
app.post('/make-server-2a4be611/admin/donations/:id/verify', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const { verificationNotes, sendReceipt = true } = body

    const adminUser = c.get('adminUser')
    const verifiedBy = adminUser?.email || adminUser?.name || 'admin@resticbo.org'
    const nowIso = new Date().toISOString()

    // 1. Fetch current donation from Postgres
    const { data: donation, error: fetchErr } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !donation) {
      return c.json({ error: 'Donation not found' }, 404)
    }

    const prevResp = donation.provider_response || {}
    const auditTrail = Array.isArray(prevResp.audit_trail) ? [...prevResp.audit_trail] : []
    auditTrail.push({
      action: 'verified',
      timestamp: nowIso,
      actor: verifiedBy,
      notes: verificationNotes || 'Bank transfer verified by administrator against bank records'
    })

    const updatedResponse = {
      ...prevResp,
      verified_by: verifiedBy,
      verified_at: nowIso,
      verification_method: 'bank_statement',
      verification_notes: verificationNotes || null,
      audit_trail: auditTrail
    }

    // 2. Update Postgres row to 'paid'
    const { error: updateErr } = await supabase
      .from('donations')
      .update({
        status: 'paid',
        updated_at: nowIso,
        provider_response: updatedResponse
      })
      .eq('id', id)

    if (updateErr) {
      console.error('Error updating donation in Postgres:', updateErr)
      return c.json({ error: 'Failed to update donation status' }, 500)
    }

    // 3. Update KV store
    const kvKey = id.startsWith('donation:') ? id : `donation:${id}`
    try {
      const kvExisting = (await kv.get(kvKey)) || {}
      await kv.set(kvKey, {
        ...kvExisting,
        ...donation,
        status: 'paid',
        updated_at: nowIso,
        verified_by: verifiedBy,
        verified_at: nowIso,
        verification_method: 'bank_statement',
        provider_response: updatedResponse,
        audit_trail: auditTrail
      })
    } catch (kvErr) {
      console.warn('Error syncing verified donation to KV:', kvErr)
    }

    // 4. Optionally dispatch official receipt to donor
    if (sendReceipt && donation.email) {
      try {
        const donorSubject = `Official Donation Receipt – RESTI-CBO (Ref: ${donation.transaction_id})`
        const donorHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 24px; border-radius: 8px; text-align: center;">
              <h2 style="margin: 0;">RESTI-CBO</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Official Donation Receipt</p>
            </div>
            <div style="padding: 24px 0;">
              <p>Dear <strong>${donation.first_name || 'Supporter'} ${donation.last_name || ''}</strong>,</p>
              <p>We are pleased to confirm that your bank transfer of <strong>${donation.currency} ${Number(donation.amount).toLocaleString()}</strong> has been verified and deposited into RESTI CBO's official account.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="padding: 4px 0; color: #64748b;">Receipt Reference:</td><td style="font-family: monospace; font-weight: 700; color: #047857;">${donation.transaction_id}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Verified Amount:</td><td style="font-weight: 700;">${donation.currency} ${Number(donation.amount).toLocaleString()}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Payment Method:</td><td>Bank Wire Transfer</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Status:</td><td style="color: #047857; font-weight: 700;">PAID & VERIFIED</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Verification Date:</td><td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                </table>
              </div>

              <p style="font-size: 13px; color: #475569;">An official receipt has been sent to your email address. Please keep it for your records.</p>

              <p style="margin-top: 24px;">Thank you for your generous partnership,<br><strong>RESTI-CBO Finance & Donor Care Team</strong><br>Kiryandongo District, Uganda</p>
            </div>
          </body>
          </html>
        `
        await sendEmail(donation.email, donorSubject, donorHtml, 'info@resticbo.org')
      } catch (emErr) {
        console.warn('Could not dispatch receipt email:', emErr)
      }
    }

    return c.json({
      success: true,
      message: 'Donation marked as PAID and verified',
      donationId: id,
      verifiedBy,
      verifiedAt: nowIso
    })
  } catch (error) {
    console.error('Error verifying donation:', error)
    return c.json({ error: 'Failed to verify donation', details: String(error) }, 500)
  }
})

// Admin: Reject bank transfer donation
app.post('/make-server-2a4be611/admin/donations/:id/reject', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const { reason = 'Unverified bank transfer' } = body

    const adminUser = c.get('adminUser')
    const rejectedBy = adminUser?.email || adminUser?.name || 'admin@resticbo.org'
    const nowIso = new Date().toISOString()

    const { data: donation, error: fetchErr } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !donation) {
      return c.json({ error: 'Donation not found' }, 404)
    }

    const prevResp = donation.provider_response || {}
    const auditTrail = Array.isArray(prevResp.audit_trail) ? [...prevResp.audit_trail] : []
    auditTrail.push({
      action: 'rejected',
      timestamp: nowIso,
      actor: rejectedBy,
      reason: reason
    })

    const updatedResponse = {
      ...prevResp,
      rejected_by: rejectedBy,
      rejected_at: nowIso,
      rejection_reason: reason,
      audit_trail: auditTrail
    }

    const { error: updateErr } = await supabase
      .from('donations')
      .update({
        status: 'rejected',
        updated_at: nowIso,
        provider_response: updatedResponse
      })
      .eq('id', id)

    if (updateErr) {
      return c.json({ error: 'Failed to update donation status' }, 500)
    }

    const kvKey = id.startsWith('donation:') ? id : `donation:${id}`
    try {
      const kvExisting = (await kv.get(kvKey)) || {}
      await kv.set(kvKey, {
        ...kvExisting,
        ...donation,
        status: 'rejected',
        updated_at: nowIso,
        rejected_by: rejectedBy,
        rejected_at: nowIso,
        rejection_reason: reason,
        provider_response: updatedResponse,
        audit_trail: auditTrail
      })
    } catch (kvErr) {
      console.warn('Error syncing rejected donation to KV:', kvErr)
    }

    return c.json({
      success: true,
      message: 'Donation marked as REJECTED',
      donationId: id,
      rejectedBy,
      rejectedAt: nowIso
    })
  } catch (error) {
    console.error('Error rejecting donation:', error)
    return c.json({ error: 'Failed to reject donation', details: String(error) }, 500)
  }
})

// Complete a PayPal donation, issue official receipt to donor, and alert admin
app.post('/make-server-2a4be611/donations/paypal-complete', async (c) => {
  try {
    const body = await c.req.json()
    const { orderId, amount, currency, donorName, donorEmail, donorPhone, message } = body

    if (!orderId || !amount) {
      return c.json({ error: 'orderId and amount are required' }, 400)
    }

    const donationId = `donation:${orderId}`
    const parts = (donorName || 'Anonymous Donor').split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || ''
    const nowIso = new Date().toISOString()
    const cur = (currency || 'USD').toUpperCase()

    const donationRecord = {
      id: donationId,
      amount: Number(amount),
      currency: cur,
      method: 'paypal',
      provider: 'paypal',
      first_name: firstName,
      last_name: lastName,
      email: donorEmail || '',
      phone: donorPhone || '',
      status: 'completed',
      transaction_id: orderId,
      provider_transaction_id: orderId,
      provider_response: { orderId, message, completedAt: nowIso },
      created_at: nowIso,
      updated_at: nowIso
    }

    // Insert or update in Postgres
    await supabase.from('donations').upsert(donationRecord, { onConflict: 'id' })

    // Sync to KV for admin dashboard
    try {
      await kv.set(donationId, donationRecord)
    } catch (kvErr) {
      console.warn('Could not sync paypal donation to kv:', kvErr)
    }

    // Deliver official donor receipt and alert admin
    await deliverDonationReceipt(donationRecord, sendEmail)

    return c.json({ success: true, message: 'PayPal donation recorded and receipts dispatched', id: donationId })
  } catch (err) {
    console.error('Error completing PayPal donation:', err)
    return c.json({ error: 'Failed to record PayPal donation', details: String(err) }, 500)
  }
})

// Report failed donation from frontend and alert admin
app.post('/make-server-2a4be611/donations/failed', async (c) => {
  try {
    const body = await c.req.json()
    const { provider, referenceId, amount, currency, donorName, donorEmail, donorPhone, errorReason } = body

    const failedDetails = {
      id: referenceId ? `donation:${referenceId}` : `donation:${crypto.randomUUID()}`,
      transaction_id: referenceId || 'N/A',
      amount: Number(amount || 0),
      currency: (currency || 'USD').toUpperCase(),
      method: provider === 'paypal' ? 'PayPal' : provider || 'Online Payment',
      provider: provider || 'unknown',
      donorName: donorName || 'Donor',
      email: donorEmail || '',
      phone: donorPhone || '',
      status: 'failed',
    }

    await notifyAdminFailedDonation(failedDetails, sendEmail, errorReason || 'Payment declined or cancelled on client')
    return c.json({ success: true, message: 'Failure recorded and admin alerted' })
  } catch (err) {
    console.error('Error reporting failed donation:', err)
    return c.json({ error: 'Failed to report failure', details: String(err) }, 500)
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

// Server-side check: verify whether mobile money integration is fully active and configured for live transactions
function isMobileMoneyLiveConfigured(provider: 'mtn' | 'airtel'): boolean {
  // Mobile money payments must be explicitly enabled for live transactions via environment flag
  const isLive = Deno.env.get('MOBILE_MONEY_LIVE') === 'true'
  if (!isLive) return false

  if (provider === 'mtn') {
    return Boolean(
      Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY') &&
      Deno.env.get('MTN_MOMO_API_USER') &&
      Deno.env.get('MTN_MOMO_API_KEY')
    )
  }
  if (provider === 'airtel') {
    return Boolean(
      Deno.env.get('AIRTEL_CLIENT_ID') &&
      Deno.env.get('AIRTEL_CLIENT_SECRET')
    )
  }
  return false
}

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

    // Security & Production Guard: Reject MTN & Airtel initiation if not configured for live transactions (HTTP 503)
    if (!isMobileMoneyLiveConfigured(provider)) {
      return c.json({
        status: 'payment_method_unavailable',
        provider,
        message: `${provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'} payments are currently under configuration. This payment option is not yet available for live donations.`
      }, 503)
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

    if (provider === 'mtn' || provider === 'airtel') {
      if (!isMobileMoneyLiveConfigured(provider as 'mtn' | 'airtel')) {
        return c.json({
          status: 'payment_method_unavailable',
          provider,
          message: `${provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'} payments are currently under configuration.`
        }, 503)
      }
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
        try {
          await deliverDonationReceipt(d, sendEmail)
        } catch (e) {
          console.error('Failed to deliver receipt from polling:', e)
        }
      }
    }

    if (paymentStatus === 'FAILED') {
      try {
        await notifyAdminFailedDonation({
          id: pendingDonation.id,
          transaction_id: referenceId,
          amount: pendingDonation.amount,
          currency: pendingDonation.currency,
          donorName: `${pendingDonation.first_name || ''} ${pendingDonation.last_name || ''}`.trim() || 'Donor',
          email: pendingDonation.email,
          phone: pendingDonation.provider_response?.donorPhone || '',
          method: provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money',
          provider
        }, sendEmail, `${provider.toUpperCase()} Mobile Money payment was declined, timed out, or cancelled by subscriber`)
      } catch (fErr) {
        console.warn('Failed to dispatch mobile payment failure alert:', fErr)
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
    // Aggregate donation stats from Postgres (strictly completed payments)
    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount')
      .in('status', ['completed', 'succeeded'])
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
app.get('/make-server-2a4be611/newsletter', requireAuthUser, async (c) => {
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
app.post('/make-server-2a4be611/upload-image', requireEditor, async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, GIF, SVG, and PDF allowed' }, 400)
    }

    // Validate file size (15MB)
    if (file.size > 15728640) {
      return c.json({ error: 'File too large. Maximum size is 15MB' }, 400)
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

// Document upload endpoint for reports and audited statements (admin only)
app.post('/make-server-2a4be611/upload-document', requireEditor, async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file size (25MB)
    if (file.size > 26214400) {
      return c.json({ error: 'File too large. Maximum size is 25MB' }, 400)
    }

    const bucketName = 'make-2a4be611-uploads'
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `documents/${crypto.randomUUID()}-${cleanName}`
    
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type || 'application/pdf',
        upsert: false
      })

    if (error) {
      console.error('Document upload error:', error)
      return c.json({ error: 'Failed to upload document', details: error.message }, 500)
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1)
    const formattedSize = file.size < 1048576 
      ? `${(file.size / 1024).toFixed(0)} KB` 
      : `${sizeInMB} MB`

    console.log(`Document uploaded: ${fileName} (${formattedSize})`)
    return c.json({ 
      success: true, 
      url: urlData.publicUrl,
      fileName: fileName,
      fileSize: formattedSize
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return c.json({ error: 'Failed to upload document', details: String(error) }, 500)
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

    // Store user info in Postgres admin_users table
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: data.user.id,
        email: email,
        name: name || email.split('@')[0],
        role: userRole,
        status: userStatus
      })

    if (insertError) {
      console.error('Failed to insert into admin_users table:', insertError)
    }

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

// Request password reset for admin users with branded email
app.post('/make-server-2a4be611/admin/request-password-reset', withRateLimit('admin-reset-pw', 5, 15 * 60_000), async (c) => {
  try {
    const body = await c.req.json()
    const email = (body.email || '').trim().toLowerCase()
    const redirectTo = body.redirectTo || 'https://resticbo.org/admin/reset-password'

    const emailV = validateEmail(email)
    if (!emailV.ok) {
      return c.json({ error: 'Please enter a valid email address.' }, 400)
    }

    // Call Supabase Auth admin API to generate the official recovery link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo
      }
    })

    if (error) {
      console.log('Password reset link generation error:', error.message)
      // Return generic success to prevent email enumeration
      return c.json({ 
        success: true, 
        message: 'If an administrator account exists with this email address, password reset instructions have been sent.' 
      })
    }

    const resetLink = data?.properties?.action_link
    if (resetLink) {
      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password - RESTI CBO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #059669 0%, #0d9488 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color: #ffffff; padding: 8px 16px; border-radius: 16px; border: 1px solid #f1f5f9;">
                    <img src="https://resticbo.org/logo.png" alt="RESTI CBO Logo" width="110" style="display: block; width: 110px; height: auto; max-height: 110px; border: 0; outline: none; text-decoration: none;" />
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 2px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">RESTI CBO</h1>
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 0.08em;">Administrator Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 36px 32px 36px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #1e293b;">Reset your password</h2>
              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hello,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                A password reset request was received for your <strong>RESTI CBO Administrator</strong> account. Click the button below to establish a new password for your account:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 13px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                  This recovery link is active for 24 hours and can only be used once.
                </p>
              </div>
              <p style="margin: 18px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                If you did not request a password reset, you can safely ignore this email. Your current password remains completely unchanged and secure.
              </p>
              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Best regards,<br />
                <strong>RESTI CBO Administration Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #334155;">
                Refugee Empowerment for Sustainable Transformation Initiative (RESTI CBO)
              </p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">
                Kiryandongo District, Uganda • Certified & Regulated Community-Based Organization
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Support: <a href="mailto:info@resticbo.org" style="color: #059669; text-decoration: none;">info@resticbo.org</a> • <a href="https://resticbo.org" style="color: #059669; text-decoration: none;">resticbo.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim()

      const emailResult = await sendEmail(
        email,
        'Reset your password - RESTI CBO',
        emailHtml,
        'info@resticbo.org'
      )
      console.log('Password reset email sending result:', emailResult)
    }

    return c.json({ 
      success: true, 
      message: 'If an administrator account exists with this email address, password reset instructions have been sent.' 
    })
  } catch (err) {
    console.error('Exception in request-password-reset:', err)
    return c.json({ 
      success: true, 
      message: 'If an administrator account exists with this email address, password reset instructions have been sent.' 
    })
  }
})

// Get user status
app.get('/make-server-2a4be611/admin/users/:userId/status', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    // Check postgres admin_users table
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('status, role')
      .eq('id', userId)
      .single()

    if (error || !user) {
      // If not in postgres, default to viewer to prevent locked out
      return c.json({ success: true, status: 'pending', role: 'viewer' })
    }
    
    return c.json({ success: true, status: user.status, role: normalizeAdminRole(user.role) })
  } catch (error) {
    console.error('Error fetching user status:', error)
    return c.json({ error: 'Failed to fetch status', details: String(error) }, 500)
  }
})

// Update user role (super-admin only)
app.patch('/make-server-2a4be611/admin/users/:userId/role', requireSuperAdmin, async (c) => {
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
app.get('/make-server-2a4be611/admin/contacts', requireAuthUser, async (c) => {
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
app.patch('/make-server-2a4be611/admin/contacts/:id', requireEditor, async (c) => {
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


// Get all donations (admin)
app.get('/make-server-2a4be611/admin/donations', requireAuthUser, async (c) => {
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
    const id = normalizeContentKey('program', c.req.param('id'))
    await kv.del(id)
    console.log(`Program deleted: ${id}`)
    return c.json({ success: true, message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Error deleting program:', error)
    return c.json({ error: 'Failed to delete program', details: String(error) }, 500)
  }
})

// Update program (admin)
app.put('/make-server-2a4be611/programs/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('program', c.req.param('id'))
    const body = await c.req.json()
    const { title, description, image, category } = body

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400)
    }

    const existing = await kv.get(id) || {}

    await kv.set(id, {
      ...existing,
      ...body,
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
    const id = normalizeContentKey('news', c.req.param('id'))
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
app.post('/make-server-2a4be611/admin/contacts/bulk-update', requireEditor, async (c) => {
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


// Update contact status (admin)
app.put('/make-server-2a4be611/admin/contacts/:id/status', requireEditor, async (c) => {
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
app.delete('/make-server-2a4be611/admin/contacts/:id', requireAdmin, async (c) => {
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
app.post('/make-server-2a4be611/admin/contacts/:id/reply', requireEditor, async (c) => {
  try {
    const rawId = c.req.param('id')
    const id = normalizeContentKey('contact', rawId)
    const cleanId = rawId.replace('contact:', '')
    const body = await c.req.json()
    const { message, recipientEmail, recipientName } = body

    if (!message || !message.trim()) {
      return c.json({ error: 'Reply message is required' }, 400)
    }

    let contact = await kv.get(id)
    if (!contact) {
      contact = await kv.get(rawId)
    }
    if (!contact) {
      const { data: dbContact } = await supabase
        .from('contacts')
        .select('*')
        .or(`id.eq.${cleanId},id.eq.${rawId}`)
        .maybeSingle()
      if (dbContact) {
        contact = dbContact
      }
    }

    // Fallback if contact record in KV or table wasn't matched but recipientEmail was provided
    if (!contact && recipientEmail) {
      contact = {
        id: cleanId,
        name: recipientName || 'Friend',
        email: recipientEmail,
        message: ''
      }
    }

    if (!contact || (!contact.email && !recipientEmail)) {
      return c.json({ error: 'Contact or recipient email not found' }, 404)
    }

    const toEmail = (contact.email || recipientEmail || '').trim()
    const toName = (contact.name || recipientName || 'Friend').trim()

    console.log(`Attempting to send reply to ${toEmail} for contact ${id}`)

    // Send email reply
    let emailSent = false
    let emailWarning: any = null
    try {
      const emailResult = await sendEmail(
        toEmail,
        `Re: Your message to RESTI-CBO`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <div style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #10b981; margin: 0;">RESTI-CBO</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Community Based Organization • Kiryandongo, Uganda</p>
            </div>
            <p>Dear ${toName},</p>
            <p>Thank you for contacting us. Here is our response to your inquiry:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #475569;">Your original message:</p>
              <p style="margin: 0; color: #64748b; font-style: italic;">${contact.message || '(No message content)'}</p>
            </div>
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #065f46;">Our response:</p>
              <p style="margin: 0; color: #047857; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="margin-top: 24px;">Best regards,<br><strong>RESTI-CBO Team</strong></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px 0;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">You received this email because you submitted a contact inquiry on resticbo.org.</p>
          </div>
        `,
        'info@resticbo.org'
      )
      if (emailResult && emailResult.success) {
        emailSent = true
      } else {
        emailWarning = emailResult?.error?.message || emailResult?.error || emailResult?.message || 'Email delivery could not be completed via Resend'
        console.warn('Email delivery notice:', emailResult)
      }
    } catch (sendErr) {
      console.error('Email send exception:', sendErr)
      emailWarning = String(sendErr)
    }

    // Always update status to resolved in the contacts SQL table
    await supabase
      .from('contacts')
      .update({
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .or(`id.eq.${cleanId},id.eq.${rawId}`)

    // Store reply in kv_store for complete audit/history
    try {
      await kv.set(`contact_reply:${cleanId}`, {
        contactId: id,
        replyMessage: message.trim(),
        repliedAt: new Date().toISOString(),
        recipientEmail: toEmail,
        recipientName: toName,
        emailSent,
        emailWarning
      })
    } catch (kvErr) {
      console.warn('Could not save to kv_store:', kvErr)
    }

    console.log(`Reply handled successfully for contact: ${id}, emailSent: ${emailSent}`)
    return c.json({
      success: true,
      emailSent,
      message: emailSent ? 'Reply sent and email delivered successfully' : 'Reply recorded in dashboard and contact resolved',
      warning: emailWarning,
      recipientEmail: toEmail,
      recipientName: toName
    })
  } catch (error) {
    console.error('Error sending reply:', error)
    return c.json({ error: 'Failed to send reply', details: String(error) }, 500)
  }
})

// Bulk delete contacts (admin)
app.post('/make-server-2a4be611/admin/contacts/bulk-delete', requireAdmin, async (c) => {
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


// Update news (admin)
app.put('/make-server-2a4be611/news/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('news', c.req.param('id'))
    const body = await c.req.json()
    const { title, content } = body

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400)
    }

    const existing = await kv.get(id) || {}
    const nowIso = new Date().toISOString()
    
    // Slug handling
    let slug = body.slug
    if (!slug) {
      slug = existing.slug || (title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'news-article')
    }

    const updatedData = {
      ...existing,
      ...body,
      id,
      key: id,
      title: title.trim(),
      slug,
      description: body.description !== undefined ? body.description : (existing.description || existing.summary || ''),
      summary: body.description !== undefined ? body.description : (existing.summary || existing.description || ''),
      content,
      image: body.image !== undefined ? body.image : (existing.image || ''),
      additionalImages: Array.isArray(body.additionalImages) ? body.additionalImages : (existing.additionalImages || []),
      category: body.category || existing.category || 'Community',
      author: body.author || existing.author || 'RESTI Communications Team',
      publishDate: body.publishDate || existing.publishDate || existing.timestamp || nowIso,
      status: body.status || existing.status || 'published',
      featured: body.featured !== undefined ? Boolean(body.featured) : Boolean(existing.featured),
      seoTitle: body.seoTitle || existing.seoTitle || title,
      seoDescription: body.seoDescription || existing.seoDescription || body.description || '',
      ogTitle: body.ogTitle || existing.ogTitle || body.seoTitle || title,
      ogDescription: body.ogDescription || existing.ogDescription || body.seoDescription || '',
      timestamp: body.publishDate || existing.publishDate || existing.timestamp || nowIso,
      updatedAt: nowIso
    }

    await kv.set(id, updatedData)

    console.log(`News updated: ${id} (slug: ${slug})`)
    return c.json({ success: true, message: 'News updated successfully', article: updatedData })
  } catch (error) {
    console.error('Error updating news:', error)
    return c.json({ error: 'Failed to update news', details: String(error) }, 500)
  }
})

// Get dashboard statistics (admin)
app.get('/make-server-2a4be611/admin/stats', requireAuthUser, async (c) => {
  try {
    const [programs, news, contacts, donations, subscribers] = await Promise.all([
      kv.getByPrefix('program:'),
      kv.getByPrefix('news:'),
      kv.getByPrefix('contact:'),
      // Fetch completed donations only from Postgres
      supabase.from('donations').select('*').in('status', ['completed', 'succeeded', 'paid', 'confirmed']),
      kv.getByPrefix('newsletter:')
    ])

    // donations from supabase Promise resolves to { data, error }
    const rawDonations = Array.isArray(donations) ? donations : (donations.data || [])
    const donationRows = rawDonations.filter((d: any) => d.status === 'completed' || d.status === 'succeeded' || d.status === 'paid' || d.status === 'confirmed')
    const totalDonationsAmount = donationRows.reduce((sum: number, d: any) => sum + (Number(d.amount || 0)), 0)
    const newContacts = contacts.filter(c => c.value.status === 'new').length

    const stats = {
      totalPrograms: programs.length,
      totalNews: news.length,
      totalContacts: contacts.length,
      newContacts,
      totalDonations: donationRows.length,
      totalDonationAmount: totalDonationsAmount,
      totalSubscribers: subscribers.length
    }

    return c.json({ stats })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return c.json({ error: 'Failed to fetch stats', details: String(error) }, 500)
  }
})

// Get advanced analytics (admin)
app.get('/make-server-2a4be611/admin/analytics', requireAuthUser, async (c) => {
  try {
    const [donationsRes, contacts, subscribers] = await Promise.all([
      supabase.from('donations').select('*').in('status', ['completed', 'succeeded']),
      kv.getByPrefix('contact:'),
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


    // Growth trends (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        donations: 0,
        contacts: 0,
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


    subscribers.forEach(s => {
      const date = (s.value.timestamp || s.value.created_at || new Date().toISOString()).split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.subscribers += 1
    })

    return c.json({
      monthlyDonations,
      paymentMethodData,
      contactStatusData,
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
app.post('/make-server-2a4be611/admin/gallery', requireEditor, async (c) => {
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
app.put('/make-server-2a4be611/admin/gallery/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('gallery', c.req.param('id'))
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
app.delete('/make-server-2a4be611/admin/gallery/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('gallery', c.req.param('id'))
    
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

// Bulk delete gallery images
app.post('/make-server-2a4be611/admin/gallery/bulk-delete', requireAdmin, async (c) => {
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
    const all = c.req.query('all') === 'true';
    const statusQuery = c.req.query('status');
    const categoryQuery = c.req.query('category');
    
    const sanitizeStory = (item: any) => {
      const val = item.value || item;
      const cleanStr = (s?: string) => (s ? s.replace(/\?\?|\?|\?{2,}/g, "'") : '');
      const id = item.key || item.id || val.id || '';
      return {
        ...val,
        id,
        key: id,
        title: cleanStr(val.title),
        story: cleanStr(val.story),
        quote: cleanStr(val.quote),
        impact: cleanStr(val.impact || val.short_description),
        short_description: cleanStr(val.short_description || val.impact),
        name: val.permission_name === false ? 'RESTI Program Participant' : cleanStr(val.name),
        location: cleanStr(val.location || 'Kiryandongo District, Uganda'),
        role: cleanStr(val.role),
        status: val.status || (val.is_published === false ? 'draft' : 'published'),
        is_published: val.status ? val.status === 'published' : val.is_published !== false,
      };
    };

    if (c.req.query('limit') !== undefined && !all && !categoryQuery && !statusQuery) {
      const { data, count } = await kv.getPaginatedByPrefix('story:', limit, offset);
      const filtered = data
        .map(sanitizeStory)
        .filter(s => s.status === 'published');
      filtered.sort((a, b) => new Date(b.date || b.timestamp || b.created_at || 0).getTime() - new Date(a.date || a.timestamp || a.created_at || 0).getTime());
      return c.json({ stories: filtered, count: filtered.length, limit, offset });
    }
    
    const storiesRaw = await kv.getByPrefix('story:');
    let stories = storiesRaw.map(sanitizeStory);
    
    // Admin or specific status filter
    if (!all) {
      if (statusQuery) {
        stories = stories.filter(s => s.status === statusQuery);
      } else {
        stories = stories.filter(s => s.status === 'published');
      }
    }
    
    if (categoryQuery && categoryQuery !== 'all') {
      stories = stories.filter(s => s.category?.toLowerCase() === categoryQuery.toLowerCase());
    }

    stories.sort((a, b) => {
      // Sort by display order if set, otherwise by date descending
      if (typeof a.display_order === 'number' && typeof b.display_order === 'number' && a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return new Date(b.date || b.timestamp || b.created_at || 0).getTime() - new Date(a.date || a.timestamp || a.created_at || 0).getTime();
    });

    return c.json({ stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return c.json({ error: 'Failed to fetch stories', details: String(error) }, 500);
  }
});

app.post('/make-server-2a4be611/admin/stories', requireEditor, async (c) => {
  try {
    const body = await c.req.json();
    const storyId = body.id || `story:${crypto.randomUUID()}`;
    const normalizedId = storyId.startsWith('story:') ? storyId : `story:${storyId}`;
    
    const storyRecord = {
      id: normalizedId,
      name: body.name || '',
      title: body.title || '',
      slug: body.slug || normalizedId.replace('story:', ''),
      short_description: body.short_description || body.impact || '',
      story: body.story || '',
      quote: body.quote || '',
      role: body.role || '',
      location: body.location || 'Kiryandongo District, Uganda',
      category: body.category || 'livelihoods',
      program_id: body.program_id || '',
      program_name: body.program_name || '',
      image: body.image || '',
      additional_images: Array.isArray(body.additional_images) ? body.additional_images : [],
      date: body.date || new Date().toISOString(),
      status: body.status || 'published',
      is_published: body.status === 'published',
      is_featured: Boolean(body.is_featured),
      display_order: typeof body.display_order === 'number' ? body.display_order : 0,
      consent_obtained: body.consent_obtained !== undefined ? Boolean(body.consent_obtained) : true,
      consent_date: body.consent_date || new Date().toISOString().split('T')[0],
      permission_name: body.permission_name !== undefined ? Boolean(body.permission_name) : true,
      permission_photo: body.permission_photo !== undefined ? Boolean(body.permission_photo) : true,
      permission_quote: body.permission_quote !== undefined ? Boolean(body.permission_quote) : true,
      consent_notes: body.consent_notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(normalizedId, storyRecord);
    return c.json({ success: true, message: 'Story added successfully', id: normalizedId, story: storyRecord });
  } catch (error) {
    console.error('Error creating story:', error);
    return c.json({ error: 'Failed to create story', details: String(error) }, 500);
  }
});

app.put('/make-server-2a4be611/admin/stories/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('story', c.req.param('id'));
    const body = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) return c.json({ error: 'Story not found' }, 404);
    
    const updatedRecord = {
      ...existing,
      ...body,
      id,
      is_published: body.status ? body.status === 'published' : (body.is_published !== undefined ? body.is_published : existing.is_published),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(id, updatedRecord);
    return c.json({ success: true, message: 'Story updated successfully', story: updatedRecord });
  } catch (error) {
    console.error('Error updating story:', error);
    return c.json({ error: 'Failed to update story', details: String(error) }, 500);
  }
});

app.delete('/make-server-2a4be611/admin/stories/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('story', c.req.param('id'));
    await kv.del(id);
    return c.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return c.json({ error: 'Failed to delete story', details: String(error) }, 500);
  }
});

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
    return c.json({ team: team.map(t => ({ ...t.value, id: t.key, key: t.key })) })
  } catch (error) {
    console.error('Error fetching team:', error)
    return c.json({ error: 'Failed to fetch team', details: String(error) }, 500)
  }
})

// Get a single team member
app.get('/make-server-2a4be611/team/:id', async (c) => {
  try {
    const rawId = c.req.param('id')
    const id = normalizeContentKey('team', rawId)
    const member = await kv.get(id)
    if (!member) {
      const allTeam = await kv.getByPrefix('team:')
      const found = allTeam.find(t => 
        t.key === id || 
        t.key.replace(/^team:/, '') === rawId || 
        (t.value?.name && t.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === rawId.toLowerCase())
      )
      if (found) {
        return c.json({ member: { ...found.value, id: found.key, key: found.key } })
      }
      return c.json({ error: 'Team member not found' }, 404)
    }
    return c.json({ member: { ...member, id, key: id } })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return c.json({ error: 'Failed to fetch team member', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/team', requireEditor, async (c) => {
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

app.put('/make-server-2a4be611/admin/team/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('team', c.req.param('id'))
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

app.delete('/make-server-2a4be611/admin/team/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('team', c.req.param('id'))
    await kv.del(id)
    return c.json({ success: true, message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return c.json({ error: 'Failed to delete team member', details: String(error) }, 500)
  }
})

// Events routes (Public & Admin)
app.get('/make-server-2a4be611/events', async (c) => {
  try {
    const isPublic = c.req.query('all') !== 'true'
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')
    
    const rawEvents = await kv.getByPrefix('event:')
    let mapped = rawEvents.map(e => {
      const val = e.value || {}
      const cleanId = (e.key || '').replace(/^event:/, '')
      const title = val.title || 'Untitled Event'
      const slug = val.slug || title.toLowerCase().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '') || cleanId
      return {
        ...val,
        id: cleanId,
        key: e.key,
        title,
        slug,
        is_published: val.is_published !== undefined ? Boolean(val.is_published) : val.published !== undefined ? Boolean(val.published) : val.status !== 'draft' && val.status !== 'archived',
        is_featured: Boolean(val.is_featured ?? val.featured),
        start_date: val.start_date || val.date || '',
        start_time: val.start_time || val.time || '',
        event_type: val.event_type || val.category || 'Community Activity',
        featured_image: val.featured_image || val.image || '',
        gallery: Array.isArray(val.gallery) ? val.gallery : []
      }
    })

    if (isPublic) {
      mapped = mapped.filter(e => e.is_published && e.status !== 'draft' && e.status !== 'archived')
    }

    // Sort: upcoming events first (earliest to latest), completed/past events (latest to earliest)
    mapped.sort((a, b) => {
      const dateA = new Date(a.start_date || a.date || 0).getTime()
      const dateB = new Date(b.start_date || b.date || 0).getTime()
      return dateB - dateA
    })

    const count = mapped.length
    const paginated = mapped.slice(offset, offset + limit)

    return c.json({ events: paginated, count, limit, offset })
  } catch (error) {
    console.error('Error fetching events:', error)
    return c.json({ error: 'Failed to fetch events', details: String(error) }, 500)
  }
})

// Get single event by slug or ID
app.get('/make-server-2a4be611/events/:slugOrId', async (c) => {
  try {
    const slugOrId = c.req.param('slugOrId')
    const key = slugOrId.startsWith('event:') ? slugOrId : `event:${slugOrId}`
    
    // First attempt direct key lookup
    let found = await kv.get(key)
    let cleanId = slugOrId.replace(/^event:/, '')

    // If not found by direct key, search by slug or id
    if (!found) {
      const allEvents = await kv.getByPrefix('event:')
      const match = allEvents.find(e => {
        const val = e.value || {}
        const cid = (e.key || '').replace(/^event:/, '')
        const title = val.title || ''
        const slug = val.slug || title.toLowerCase().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '') || cid
        return slug === slugOrId || cid === slugOrId
      })
      if (match) {
        found = match.value
        cleanId = (match.key || '').replace(/^event:/, '')
      }
    }

    if (!found) {
      return c.json({ error: 'Event not found' }, 404)
    }

    const title = found.title || 'Untitled Event'
    const slug = found.slug || title.toLowerCase().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '') || cleanId

    return c.json({
      event: {
        ...found,
        id: cleanId,
        key: `event:${cleanId}`,
        title,
        slug,
        is_published: found.is_published !== undefined ? Boolean(found.is_published) : found.published !== undefined ? Boolean(found.published) : found.status !== 'draft',
        is_featured: Boolean(found.is_featured ?? found.featured),
        start_date: found.start_date || found.date || '',
        start_time: found.start_time || found.time || '',
        event_type: found.event_type || found.category || 'Community Activity',
        featured_image: found.featured_image || found.image || '',
        gallery: Array.isArray(found.gallery) ? found.gallery : []
      }
    })
  } catch (error) {
    console.error('Error fetching event by slugOrId:', error)
    return c.json({ error: 'Failed to fetch event', details: String(error) }, 500)
  }
})

// Create event (admin)
app.post('/make-server-2a4be611/admin/events', requireEditor, async (c) => {
  try {
    const body = await c.req.json()
    const rawId = crypto.randomUUID()
    const eventId = `event:${rawId}`
    const nowIso = new Date().toISOString()
    const title = (body.title || '').trim()
    const slug = (body.slug || title.toLowerCase().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '') || rawId).trim()

    const eventData = {
      id: rawId,
      title,
      slug,
      short_description: body.short_description || body.shortDescription || '',
      description: body.description || '',
      event_type: body.event_type || body.category || 'Community Activity',
      featured_image: body.featured_image || body.image || '',
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      start_date: body.start_date || body.date || '',
      end_date: body.end_date || '',
      start_time: body.start_time || body.time || '',
      end_time: body.end_time || '',
      location: body.location || 'Kiryandongo Refugee Settlement, Kiryandongo District, Uganda',
      address: body.address || '',
      organizer: body.organizer || 'RESTI Kiryandongo CBO',
      registration_required: Boolean(body.registration_required ?? body.registrationRequired),
      registration_url: body.registration_url || body.registrationUrl || '',
      registration_deadline: body.registration_deadline || body.registrationDeadline || '',
      contact_email: body.contact_email || body.contactEmail || 'info@resticbo.org',
      contact_phone: body.contact_phone || body.contactPhone || '+256 700 000 000',
      status: body.status || 'published',
      is_featured: Boolean(body.is_featured ?? body.isFeatured),
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : true,
      summary: body.summary || '',
      outcomes: body.outcomes || '',
      related_program: body.related_program || body.relatedProgram || '',
      display_order: typeof body.display_order === 'number' ? body.display_order : 1,
      capacity: body.capacity || undefined,
      registered: body.registered || 0,
      created_at: nowIso,
      updated_at: nowIso
    }

    await kv.set(eventId, eventData)
    return c.json({ success: true, message: 'Event added successfully', id: rawId, slug })
  } catch (error) {
    console.error('Error creating event:', error)
    return c.json({ error: 'Failed to create event', details: String(error) }, 500)
  }
})

// Update event (admin)
app.put('/make-server-2a4be611/admin/events/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('event', c.req.param('id'))
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Event not found' }, 404)

    const title = (body.title || existing.title || '').trim()
    const slug = (body.slug || existing.slug || title.toLowerCase().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '')).trim()
    const nowIso = new Date().toISOString()

    const updatedData = {
      ...existing,
      ...body,
      title,
      slug,
      short_description: body.short_description !== undefined ? body.short_description : (existing.short_description || existing.shortDescription || ''),
      description: body.description !== undefined ? body.description : existing.description,
      event_type: body.event_type || body.category || existing.event_type || existing.category || 'Community Activity',
      featured_image: body.featured_image !== undefined ? body.featured_image : (body.image !== undefined ? body.image : (existing.featured_image || existing.image || '')),
      gallery: Array.isArray(body.gallery) ? body.gallery : (existing.gallery || []),
      start_date: body.start_date || body.date || existing.start_date || existing.date || '',
      end_date: body.end_date !== undefined ? body.end_date : (existing.end_date || ''),
      start_time: body.start_time || body.time || existing.start_time || existing.time || '',
      end_time: body.end_time !== undefined ? body.end_time : (existing.end_time || ''),
      location: body.location || existing.location || 'Kiryandongo Refugee Settlement, Kiryandongo District, Uganda',
      address: body.address !== undefined ? body.address : (existing.address || ''),
      organizer: body.organizer || existing.organizer || 'RESTI Kiryandongo CBO',
      registration_required: body.registration_required !== undefined ? Boolean(body.registration_required) : Boolean(existing.registration_required),
      registration_url: body.registration_url !== undefined ? body.registration_url : (existing.registration_url || ''),
      registration_deadline: body.registration_deadline !== undefined ? body.registration_deadline : (existing.registration_deadline || ''),
      contact_email: body.contact_email || existing.contact_email || 'info@resticbo.org',
      contact_phone: body.contact_phone || existing.contact_phone || '+256 700 000 000',
      status: body.status || existing.status || 'published',
      is_featured: body.is_featured !== undefined ? Boolean(body.is_featured) : Boolean(existing.is_featured),
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : (existing.is_published !== undefined ? Boolean(existing.is_published) : true),
      summary: body.summary !== undefined ? body.summary : (existing.summary || ''),
      outcomes: body.outcomes !== undefined ? body.outcomes : (existing.outcomes || ''),
      related_program: body.related_program !== undefined ? body.related_program : (existing.related_program || ''),
      display_order: body.display_order !== undefined ? body.display_order : (existing.display_order || 1),
      capacity: body.capacity !== undefined ? body.capacity : existing.capacity,
      registered: body.registered !== undefined ? body.registered : (existing.registered || 0),
      updated_at: nowIso,
      updatedAt: nowIso
    }

    await kv.set(id, updatedData)
    return c.json({ success: true, message: 'Event updated successfully', slug })
  } catch (error) {
    console.error('Error updating event:', error)
    return c.json({ error: 'Failed to update event', details: String(error) }, 500)
  }
})

// Delete event (admin)
app.delete('/make-server-2a4be611/admin/events/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('event', c.req.param('id'))
    await kv.del(id)
    return c.json({ success: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return c.json({ error: 'Failed to delete event', details: String(error) }, 500)
  }
})

// Partners routes (Public - only published partners)
app.get('/make-server-2a4be611/partners', async (c) => {
  try {
    const isPublic = c.req.query('all') !== 'true';
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const partners = await kv.getByPrefix('partner:');
    let list = partners.map(p => {
      const val = p.value || {};
      const cleanId = (p.key || '').replace(/^partner:/, '');
      const isPublished = val.is_published !== undefined ? Boolean(val.is_published) : (val.published !== undefined ? Boolean(val.published) : true);
      const displayOrder = typeof val.display_order === 'number' ? val.display_order : (typeof val.order === 'number' ? val.order : 1);
      return {
        ...val,
        id: cleanId,
        key: p.key,
        logo: val.logo_url || val.logo || '',
        logo_url: val.logo_url || val.logo || '',
        website: val.website_url || val.website || '',
        website_url: val.website_url || val.website || '',
        partner_type: val.partner_type || val.category || 'Community Partner',
        category: val.partner_type || val.category || 'Community Partner',
        display_order: displayOrder,
        order: displayOrder,
        is_published: isPublished,
        published: isPublished
      };
    });

    // Exclude any legacy sample names if any exist in storage
    list = list.filter(p => {
      const n = (p.name || '').toLowerCase();
      return n && 
        !n.includes('global giving') && 
        !n.includes('kiryandongo district local government') &&
        !n.includes('youth action network') &&
        !n.includes('uganda development foundation') &&
        !n.includes('global health initiative') &&
        !n.includes('community water alliance');
    });

    if (isPublic) {
      list = list.filter(p => p.is_published);
    }

    // Sort by display_order ascending, then created_at descending
    list.sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      const tA = new Date(a.created_at || a.createdAt || 0).getTime();
      const tB = new Date(b.created_at || b.createdAt || 0).getTime();
      return tB - tA;
    });

    if (c.req.query('limit') !== undefined) {
      const count = list.length;
      const paginated = list.slice(offset, offset + limit);
      return c.json({ partners: paginated, count, limit, offset });
    }
    
    return c.json({ partners: list });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return c.json({ error: 'Failed to fetch partners', details: String(error) }, 500);
  }
});

// Admin get all partners (including unpublished)
app.get('/make-server-2a4be611/admin/partners', requireAuthUser, async (c) => {
  try {
    const partners = await kv.getByPrefix('partner:');
    let list = partners.map(p => {
      const val = p.value || {};
      const cleanId = (p.key || '').replace(/^partner:/, '');
      const isPublished = val.is_published !== undefined ? Boolean(val.is_published) : (val.published !== undefined ? Boolean(val.published) : true);
      const displayOrder = typeof val.display_order === 'number' ? val.display_order : (typeof val.order === 'number' ? val.order : 1);
      return {
        ...val,
        id: cleanId,
        key: p.key,
        logo: val.logo_url || val.logo || '',
        logo_url: val.logo_url || val.logo || '',
        website: val.website_url || val.website || '',
        website_url: val.website_url || val.website || '',
        partner_type: val.partner_type || val.category || 'Community Partner',
        category: val.partner_type || val.category || 'Community Partner',
        display_order: displayOrder,
        order: displayOrder,
        is_published: isPublished,
        published: isPublished
      };
    });

    list.sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      const tA = new Date(a.created_at || a.createdAt || 0).getTime();
      const tB = new Date(b.created_at || b.createdAt || 0).getTime();
      return tB - tA;
    });

    return c.json({ partners: list, count: list.length });
  } catch (error) {
    console.error('Error fetching admin partners:', error);
    return c.json({ error: 'Failed to fetch admin partners', details: String(error) }, 500);
  }
});

app.post('/make-server-2a4be611/admin/partners', requireEditor, async (c) => {
  try {
    const body = await c.req.json();
    const { 
      name, 
      description, 
      logo, 
      logo_url, 
      website, 
      website_url, 
      category, 
      partner_type, 
      since, 
      display_order, 
      order, 
      is_published, 
      published 
    } = body;

    if (!name || !name.trim()) {
      return c.json({ error: 'Partner organization name is required' }, 400);
    }

    const rawId = crypto.randomUUID();
    const partnerId = "partner:" + rawId;
    const nowIso = new Date().toISOString();
    const effectiveLogo = logo_url || logo || '';
    const effectiveWebsite = website_url || website || '';
    const effectiveType = partner_type || category || 'Community Partner';
    const effectiveOrder = typeof display_order === 'number' ? display_order : (typeof order === 'number' ? order : 1);
    const effectivePublished = is_published !== undefined ? Boolean(is_published) : (published !== undefined ? Boolean(published) : true);

    const partnerRecord = {
      id: rawId,
      name: name.trim(),
      description: description ? description.trim() : '',
      logo: effectiveLogo,
      logo_url: effectiveLogo,
      website: effectiveWebsite,
      website_url: effectiveWebsite,
      category: effectiveType,
      partner_type: effectiveType,
      since: since ? since.trim() : new Date().getFullYear().toString(),
      display_order: effectiveOrder,
      order: effectiveOrder,
      is_published: effectivePublished,
      published: effectivePublished,
      created_at: nowIso,
      updated_at: nowIso
    };

    await kv.set(partnerId, partnerRecord);
    console.log("Partner created successfully: " + partnerId + " (" + partnerRecord.name + ")");
    return c.json({ success: true, message: 'Partner added successfully', id: partnerId, partner: partnerRecord });
  } catch (error) {
    console.error('Error creating partner:', error);
    return c.json({ error: 'Failed to create partner', details: String(error) }, 500);
  }
});

app.put('/make-server-2a4be611/admin/partners/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('partner', c.req.param('id'));
    const body = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) return c.json({ error: 'Partner not found' }, 404);

    const nowIso = new Date().toISOString();
    const effectiveLogo = body.logo_url !== undefined ? body.logo_url : (body.logo !== undefined ? body.logo : (existing.logo_url || existing.logo || ''));
    const effectiveWebsite = body.website_url !== undefined ? body.website_url : (body.website !== undefined ? body.website : (existing.website_url || existing.website || ''));
    const effectiveType = body.partner_type || body.category || existing.partner_type || existing.category || 'Community Partner';
    const effectiveOrder = body.display_order !== undefined ? Number(body.display_order) : (body.order !== undefined ? Number(body.order) : (existing.display_order || existing.order || 1));
    const effectivePublished = body.is_published !== undefined ? Boolean(body.is_published) : (body.published !== undefined ? Boolean(body.published) : (existing.is_published !== undefined ? Boolean(existing.is_published) : true));

    const updatedRecord = {
      ...existing,
      ...body,
      id: existing.id || id.replace(/^partner:/, ''),
      name: (body.name !== undefined ? body.name : existing.name).trim(),
      description: body.description !== undefined ? body.description.trim() : (existing.description || ''),
      logo: effectiveLogo,
      logo_url: effectiveLogo,
      website: effectiveWebsite,
      website_url: effectiveWebsite,
      category: effectiveType,
      partner_type: effectiveType,
      since: body.since !== undefined ? body.since : (existing.since || ''),
      display_order: effectiveOrder,
      order: effectiveOrder,
      is_published: effectivePublished,
      published: effectivePublished,
      updated_at: nowIso,
      updatedAt: nowIso
    };

    await kv.set(id, updatedRecord);
    console.log("Partner updated successfully: " + id);
    return c.json({ success: true, message: 'Partner updated successfully', partner: updatedRecord });
  } catch (error) {
    console.error('Error updating partner:', error);
    return c.json({ error: 'Failed to update partner', details: String(error) }, 500);
  }
});

// Quick toggle publish status
app.patch('/make-server-2a4be611/admin/partners/:id/toggle-publish', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('partner', c.req.param('id'));
    const existing = await kv.get(id);
    if (!existing) return c.json({ error: 'Partner not found' }, 404);

    const currentPublished = existing.is_published !== undefined ? Boolean(existing.is_published) : (existing.published !== undefined ? Boolean(existing.published) : true);
    const newPublished = !currentPublished;
    const nowIso = new Date().toISOString();

    const updatedRecord = {
      ...existing,
      is_published: newPublished,
      published: newPublished,
      updated_at: nowIso,
      updatedAt: nowIso
    };

    await kv.set(id, updatedRecord);
    console.log("Partner " + id + " publish toggled to: " + newPublished);
    return c.json({ success: true, message: newPublished ? 'Partner published' : 'Partner unpublished', is_published: newPublished, partner: updatedRecord });
  } catch (error) {
    console.error('Error toggling partner publish status:', error);
    return c.json({ error: 'Failed to toggle publish status', details: String(error) }, 500);
  }
});

app.delete('/make-server-2a4be611/admin/partners/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('partner', c.req.param('id'));
    await kv.del(id);
    console.log("Partner deleted: " + id);
    return c.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return c.json({ error: 'Failed to delete partner', details: String(error) }, 500);
  }
});

// Impact Dashboard routes
app.get('/make-server-2a4be611/impact-stats', async (c) => {
  try {
    const stats = await kv.get('impact-stats')
    return c.json({ stats: stats || { peopleServed: 0, programsActive: 0, householdsSupported: 0, fundsRaised: 0, communitiesReached: 0, successRate: 0 } })
  } catch (error) {
    console.error('Error fetching impact stats:', error)
    return c.json({ error: 'Failed to fetch impact stats', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/impact-stats', requireAdmin, async (c) => {
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
    return c.json({ reports: reports.map(r => ({ ...r.value, id: r.key, key: r.key })) })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return c.json({ error: 'Failed to fetch reports', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/reports', requireAdmin, async (c) => {
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

app.put('/make-server-2a4be611/admin/reports/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('report', c.req.param('id'))
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

app.delete('/make-server-2a4be611/admin/reports/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('report', c.req.param('id'))
    await kv.del(id)
    return c.json({ success: true, message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting report:', error)
    return c.json({ error: 'Failed to delete report', details: String(error) }, 500)
  }
})

// Opportunities Settings (empty state & inquiries notice)
const DEFAULT_OPP_SETTINGS = {
  emptyTitle: "No current opportunities",
  emptyMessage: "We do not currently have any open opportunities. Please check back later for new positions, internships, partner openings, and other ways to get involved with RESTI.",
  emptyButtonText: "Contact RESTI",
  emptyButtonLink: "/contact",
  showInquiriesBox: true,
  inquiriesTitle: "Don't see a role that matches your skills?",
  inquiriesDescription: "RESTI thrives on passionate changemakers, researchers, and community advocates from all walks of life. Send us your profile or proposal, and let us explore how we can collaborate together to build self-reliant refugee and host communities.",
  inquiriesEmail: "careers@resticbo.org",
  inquiriesSubject: "General Inquiry / Partnership Proposal"
};

app.get('/make-server-2a4be611/opportunities/settings', async (c) => {
  try {
    const custom = await kv.get('opportunities_settings') || {}
    return c.json({ settings: { ...DEFAULT_OPP_SETTINGS, ...custom } })
  } catch (error) {
    console.error('Error fetching opportunities settings:', error)
    return c.json({ settings: DEFAULT_OPP_SETTINGS })
  }
});

app.put('/make-server-2a4be611/admin/opportunities/settings', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const current = await kv.get('opportunities_settings') || {}
    const updated = {
      ...DEFAULT_OPP_SETTINGS,
      ...current,
      ...(body.settings || body),
      updatedAt: new Date().toISOString()
    }
    await kv.set('opportunities_settings', updated)
    return c.json({ success: true, message: 'Opportunities settings saved successfully', settings: updated })
  } catch (error) {
    console.error('Error updating opportunities settings:', error)
    return c.json({ error: 'Failed to update opportunities settings', details: String(error) }, 500)
  }
});

// Opportunities & Recruitment routes
app.get('/make-server-2a4be611/opportunities', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('opportunity:', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || b.value?.createdAt || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || a.value?.createdAt || 0).getTime());
      return c.json({ opportunities: data, count, limit, offset });
    }
    
    const opportunities = await kv.getByPrefix('opportunity:')
    return c.json({ opportunities: opportunities.map(o => ({ ...o.value, id: o.key, key: o.key })) })
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return c.json({ error: 'Failed to fetch opportunities', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/opportunities', requireEditor, async (c) => {
  try {
    const body = await c.req.json()
    const rawId = crypto.randomUUID()
    const opportunityId = `opportunity:${rawId}`
    const now = new Date().toISOString()
    const opportunity = {
      id: rawId,
      key: opportunityId,
      title: body.title || 'Untitled Opportunity',
      category: body.category || 'Jobs',
      type: body.type || 'Full-Time',
      workArrangement: body.workArrangement || 'Field-Based',
      location: body.location || 'Kiryandongo District',
      duration: body.duration || 'Ongoing',
      shortDescription: body.shortDescription || body.description || '',
      description: body.description || '',
      responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
      requirements: Array.isArray(body.requirements) ? body.requirements : [],
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      isOngoing: Boolean(body.isOngoing),
      deadline: body.deadline || '',
      status: body.status || 'Open',
      applicationMethod: body.applicationMethod || 'internal',
      applicationEmail: body.applicationEmail || 'careers@resticbo.org',
      applicationUrl: body.applicationUrl || '',
      applicationInstructions: body.applicationInstructions || '',
      createdAt: now,
      updatedAt: now
    }
    await kv.set(opportunityId, opportunity)
    return c.json({ success: true, message: 'Opportunity added successfully', id: opportunityId, opportunity })
  } catch (error) {
    console.error('Error creating opportunity:', error)
    return c.json({ error: 'Failed to create opportunity', details: String(error) }, 500)
  }
})

app.put('/make-server-2a4be611/admin/opportunities/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('opportunity', c.req.param('id'))
    const body = await c.req.json()
    const existing = await kv.get(id) || {}
    const updated = {
      ...existing,
      ...body,
      id: id.replace(/^opportunity:/, ''),
      key: id,
      updatedAt: new Date().toISOString()
    }
    await kv.set(id, updated)
    return c.json({ success: true, message: 'Opportunity updated successfully', opportunity: updated })
  } catch (error) {
    console.error('Error updating opportunity:', error)
    return c.json({ error: 'Failed to update opportunity', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/opportunities/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('opportunity', c.req.param('id'))
    await kv.del(id)
    return c.json({ success: true, message: 'Opportunity deleted successfully' })
  } catch (error) {
    console.error('Error deleting opportunity:', error)
    return c.json({ error: 'Failed to delete opportunity', details: String(error) }, 500)
  }
})

// Public Application Submission Endpoint
app.post('/make-server-2a4be611/opportunities/apply', async (c) => {
  try {
    const body = await c.req.json()
    const { opportunityId, opportunityTitle, fullName, email, phone, resumeUrl, resumeName, coverLetter, consent } = body
    if (!fullName || !email || !coverLetter) {
      return c.json({ error: 'Full name, email, and cover letter are required' }, 400)
    }
    const rawId = crypto.randomUUID()
    const appId = `opportunity_app:${rawId}`
    const application = {
      id: rawId,
      key: appId,
      opportunityId: opportunityId || '',
      opportunityTitle: opportunityTitle || 'General Application',
      fullName: fullName.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      resumeUrl: resumeUrl || '',
      resumeName: resumeName || '',
      coverLetter: coverLetter.trim(),
      consent: Boolean(consent),
      status: 'pending',
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await kv.set(appId, application)
    return c.json({ success: true, message: 'Application submitted successfully', id: appId })
  } catch (error) {
    console.error('Error submitting application:', error)
    return c.json({ error: 'Failed to submit application', details: String(error) }, 500)
  }
})

// Admin Opportunity Applications Endpoints
app.get('/make-server-2a4be611/admin/opportunity-applications', requireAuthUser, async (c) => {
  try {
    const apps = await kv.getByPrefix('opportunity_app:')
    const parsed = apps.map(a => ({ ...a.value, id: a.key.replace(/^opportunity_app:/, ''), key: a.key }))
    parsed.sort((a, b) => new Date(b.appliedAt || b.createdAt || 0).getTime() - new Date(a.appliedAt || a.createdAt || 0).getTime())
    return c.json({ applications: parsed })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return c.json({ error: 'Failed to fetch applications', details: String(error) }, 500)
  }
})

app.patch('/make-server-2a4be611/admin/opportunity-applications/:id/status', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('opportunity_app', c.req.param('id'))
    const body = await c.req.json()
    const existing = await kv.get(id)
    if (!existing) return c.json({ error: 'Application not found' }, 404)
    const updated = {
      ...existing,
      status: body.status || existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      updatedAt: new Date().toISOString()
    }
    await kv.set(id, updated)
    return c.json({ success: true, message: 'Application status updated successfully' })
  } catch (error) {
    console.error('Error updating application status:', error)
    return c.json({ error: 'Failed to update application status', details: String(error) }, 500)
  }
})

app.delete('/make-server-2a4be611/admin/opportunity-applications/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('opportunity_app', c.req.param('id'))
    await kv.del(id)
    return c.json({ success: true, message: 'Application deleted successfully' })
  } catch (error) {
    console.error('Error deleting application:', error)
    return c.json({ error: 'Failed to delete application', details: String(error) }, 500)
  }
})

// Document upload for candidate CV/Resume files
app.post('/make-server-2a4be611/upload-application-doc', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid file uploaded' }, 400)
    }
    const maxBytes = 10 * 1024 * 1024 // 10MB
    if (file.size > maxBytes) {
      return c.json({ error: 'File exceeds 10MB limit' }, 400)
    }
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.rtf', '.txt']
    const fileExt = ('.' + file.name.split('.').pop()).toLowerCase()
    if (!allowedExtensions.includes(fileExt)) {
      return c.json({ error: 'Only PDF, DOC, DOCX, RTF, or TXT documents are allowed' }, 400)
    }
    const bucketName = 'make-2a4be611-uploads'
    const fileName = `applications/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })
    if (uploadError) {
      return c.json({ error: 'Failed to store resume', details: uploadError.message }, 500)
    }
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)
    return c.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      size: file.size
    })
  } catch (error) {
    console.error('Error uploading application document:', error)
    return c.json({ error: 'Failed to upload document', details: String(error) }, 500)
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
    return c.json({ faqs: faqs.map(f => ({ ...f.value, id: f.key, key: f.key })) })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return c.json({ error: 'Failed to fetch FAQs', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/admin/faqs', requireEditor, async (c) => {
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

app.put('/make-server-2a4be611/admin/faqs/:id', requireEditor, async (c) => {
  try {
    const id = normalizeContentKey('faq', c.req.param('id'))
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

app.delete('/make-server-2a4be611/admin/faqs/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('faq', c.req.param('id'))
    await kv.del(id)
    return c.json({ success: true, message: 'FAQ deleted successfully' })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return c.json({ error: 'Failed to delete FAQ', details: String(error) }, 500)
  }
})

// Resources & Downloads routes
app.get('/make-server-2a4be611/resources', async (c) => {
  try {
    const showAll = c.req.query('all') === 'true';
    const categoryParam = c.req.query('category');
    const yearParam = c.req.query('year');
    const typeParam = c.req.query('type') || c.req.query('file_type');
    const searchParam = (c.req.query('search') || c.req.query('q') || '').toLowerCase().trim();

    const rawResources = await kv.getByPrefix('resource:');
    
    let items = rawResources.map(r => {
      const val = r.value || {};
      const rawId = r.key.replace(/^resource:/, '');
      const fileUrl = val.file_url || val.fileUrl || '';
      const fileName = val.file_name || val.fileName || (fileUrl ? fileUrl.split('/').pop()?.split('?')[0] : 'document');
      const fileType = (val.file_type || val.fileType || (fileName.includes('.') ? fileName.split('.').pop() : 'FILE') || 'FILE').toUpperCase();
      const fileSize = val.file_size || val.fileSize || '';
      const publicationDate = val.publication_date || val.date || val.created_at || '';
      const year = val.year || (publicationDate ? new Date(publicationDate).getFullYear().toString() : '');

      const isPublished = val.is_published !== undefined
        ? Boolean(val.is_published)
        : val.published !== undefined
        ? Boolean(val.published)
        : true;

      const isFeatured = val.is_featured !== undefined
        ? Boolean(val.is_featured)
        : Boolean(val.featured);

      return {
        id: rawId,
        key: r.key,
        title: (val.title || 'Untitled Document').trim(),
        description: (val.description || '').trim(),
        category: val.category || 'Reports & Publications',
        file_url: fileUrl,
        fileUrl: fileUrl,
        file_name: fileName,
        fileName: fileName,
        file_type: fileType,
        fileType: fileType,
        file_size: fileSize,
        fileSize: fileSize,
        thumbnail_url: val.thumbnail_url || val.thumbnailUrl || '',
        thumbnailUrl: val.thumbnail_url || val.thumbnailUrl || '',
        year: year,
        author: (val.author || '').trim(),
        publication_date: publicationDate,
        date: publicationDate,
        display_order: typeof val.display_order === 'number' ? val.display_order : typeof val.order === 'number' ? val.order : 1,
        order: typeof val.display_order === 'number' ? val.display_order : typeof val.order === 'number' ? val.order : 1,
        is_featured: isFeatured,
        isFeatured: isFeatured,
        is_published: isPublished,
        isPublished: isPublished,
        created_at: val.created_at || val.createdAt || new Date().toISOString(),
        updated_at: val.updated_at || val.updatedAt || new Date().toISOString(),
      };
    });

    // Unless 'all=true' is explicitly requested (for admin views), filter to published only
    if (!showAll) {
      items = items.filter(item => item.is_published);
    }

    // Filter by category
    if (categoryParam && categoryParam !== 'all') {
      items = items.filter(item => item.category.toLowerCase() === categoryParam.toLowerCase());
    }

    // Filter by year
    if (yearParam && yearParam !== 'all') {
      items = items.filter(item => item.year === yearParam);
    }

    // Filter by file type
    if (typeParam && typeParam !== 'all') {
      items = items.filter(item => item.file_type.toLowerCase() === typeParam.toLowerCase());
    }

    // Filter by search query
    if (searchParam) {
      items = items.filter(item => {
        return (
          item.title.toLowerCase().includes(searchParam) ||
          item.description.toLowerCase().includes(searchParam) ||
          item.category.toLowerCase().includes(searchParam) ||
          (item.author && item.author.toLowerCase().includes(searchParam)) ||
          item.year.includes(searchParam)
        );
      });
    }

    // Sort: display_order ascending, then publication_date/created_at descending
    items.sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      const timeA = new Date(a.publication_date || a.created_at).getTime() || 0;
      const timeB = new Date(b.publication_date || b.created_at).getTime() || 0;
      return timeB - timeA;
    });

    return c.json({ resources: items, count: items.length });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return c.json({ error: 'Failed to fetch resources', details: String(error) }, 500);
  }
});

app.post('/make-server-2a4be611/admin/resources', requireEditor, async (c) => {
  try {
    const body = await c.req.json();
    const title = (body.title || '').trim();
    if (!title) {
      return c.json({ error: 'Resource title is required' }, 400);
    }

    const fileUrl = body.file_url || body.fileUrl || '';
    if (!fileUrl) {
      return c.json({ error: 'Resource file URL is required' }, 400);
    }

    const cleanId = (body.id || crypto.randomUUID()).toString().replace(/^resource:/, '');
    const resourceKey = `resource:${cleanId}`;
    const now = new Date().toISOString();

    const fileName = body.file_name || body.fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';
    const fileType = (body.file_type || body.fileType || (fileName.includes('.') ? fileName.split('.').pop() : 'FILE') || 'FILE').toUpperCase();

    const record = {
      id: cleanId,
      key: resourceKey,
      title,
      description: (body.description || '').trim(),
      category: (body.category || 'Reports & Publications').trim(),
      file_url: fileUrl,
      fileUrl: fileUrl,
      file_name: fileName,
      fileName: fileName,
      file_type: fileType,
      fileType: fileType,
      file_size: body.file_size || body.fileSize || '',
      fileSize: body.file_size || body.fileSize || '',
      thumbnail_url: body.thumbnail_url || body.thumbnailUrl || '',
      year: body.year || (body.publication_date ? new Date(body.publication_date).getFullYear().toString() : new Date().getFullYear().toString()),
      author: (body.author || '').trim(),
      publication_date: body.publication_date || body.date || now,
      date: body.publication_date || body.date || now,
      display_order: typeof body.display_order === 'number' ? body.display_order : 1,
      is_featured: Boolean(body.is_featured ?? body.isFeatured ?? false),
      is_published: Boolean(body.is_published ?? body.isPublished ?? true),
      created_at: now,
      updated_at: now,
    };

    await kv.set(resourceKey, record);
    return c.json({ success: true, message: 'Resource created successfully', resource: record });
  } catch (error) {
    console.error('Error creating resource:', error);
    return c.json({ error: 'Failed to create resource', details: String(error) }, 500);
  }
});

app.put('/make-server-2a4be611/admin/resources/:id', requireEditor, async (c) => {
  try {
    const rawParam = c.req.param('id');
    const id = normalizeContentKey('resource', rawParam);
    const body = await c.req.json();
    
    let existing = await kv.get(id);
    if (!existing) {
      const altKey = id.startsWith('resource:') ? id.replace(/^resource:/, '') : `resource:${id}`;
      existing = await kv.get(altKey);
      if (!existing) {
        return c.json({ error: 'Resource not found' }, 404);
      }
    }

    const now = new Date().toISOString();
    const fileUrl = body.file_url || body.fileUrl || existing.file_url || existing.fileUrl || '';
    const fileName = body.file_name || body.fileName || existing.file_name || existing.fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';
    const fileType = (body.file_type || body.fileType || existing.file_type || existing.fileType || (fileName.includes('.') ? fileName.split('.').pop() : 'FILE') || 'FILE').toUpperCase();

    const updated = {
      ...existing,
      title: body.title !== undefined ? body.title.trim() : existing.title,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      category: body.category !== undefined ? body.category.trim() : existing.category,
      file_url: fileUrl,
      fileUrl: fileUrl,
      file_name: fileName,
      fileName: fileName,
      file_type: fileType,
      fileType: fileType,
      file_size: body.file_size !== undefined ? body.file_size : (body.fileSize !== undefined ? body.fileSize : existing.file_size),
      fileSize: body.file_size !== undefined ? body.file_size : (body.fileSize !== undefined ? body.fileSize : existing.file_size),
      thumbnail_url: body.thumbnail_url !== undefined ? body.thumbnail_url : (body.thumbnailUrl !== undefined ? body.thumbnailUrl : existing.thumbnail_url),
      year: body.year !== undefined ? body.year : existing.year,
      author: body.author !== undefined ? body.author.trim() : existing.author,
      publication_date: body.publication_date !== undefined ? body.publication_date : (body.date !== undefined ? body.date : existing.publication_date),
      date: body.publication_date !== undefined ? body.publication_date : (body.date !== undefined ? body.date : existing.publication_date),
      display_order: body.display_order !== undefined ? body.display_order : (body.order !== undefined ? body.order : existing.display_order),
      is_featured: body.is_featured !== undefined ? Boolean(body.is_featured) : (body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.is_featured),
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : (body.isPublished !== undefined ? Boolean(body.isPublished) : existing.is_published),
      updated_at: now,
    };

    await kv.set(id, updated);
    return c.json({ success: true, message: 'Resource updated successfully', resource: updated });
  } catch (error) {
    console.error('Error updating resource:', error);
    return c.json({ error: 'Failed to update resource', details: String(error) }, 500);
  }
});

app.delete('/make-server-2a4be611/admin/resources/:id', requireAdmin, async (c) => {
  try {
    const rawParam = c.req.param('id');
    const id = normalizeContentKey('resource', rawParam);
    await kv.del(id);
    const altKey = id.startsWith('resource:') ? id.replace(/^resource:/, '') : `resource:${id}`;
    await kv.del(altKey);

    return c.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return c.json({ error: 'Failed to delete resource', details: String(error) }, 500);
  }
});

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
      return c.json({ pages: defaults.map(d => ({ ...d.value, id: d.key, key: d.key })) })
    }

    pages.sort((a: any, b: any) => new Date(b.value.updatedAt || b.value.createdAt).getTime() - new Date(a.value.updatedAt || a.value.createdAt).getTime())
    return c.json({ pages: pages.map((p: any) => ({ ...p.value, id: p.key, key: p.key })) })
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
    return c.json({ page: { ...match.value, id: match.key, key: match.key } })
  } catch (error) {
    console.error('Error fetching page by slug:', error)
    return c.json({ error: 'Failed to fetch page', details: String(error) }, 500)
  }
})

app.post('/make-server-2a4be611/pages', requireAdmin, async (c) => {
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

app.put('/make-server-2a4be611/pages/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('page', c.req.param('id'))
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

app.delete('/make-server-2a4be611/pages/:id', requireAdmin, async (c) => {
  try {
    const id = normalizeContentKey('page', c.req.param('id'))
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

      // Impact stories seed removed per user request

      // Team members seed removed per user request

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

      // Add sample opportunities
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
        title: 'Community Health Outreach Associate',
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

      await kv.set('faq:3', {
        question: 'What programs do you offer?',
        answer: 'We offer programs in education support, healthcare access, community development, skills training, and microfinance. Each program is designed to create sustainable, long-term impact in the Kiryandongo community.',
        category: 'programs',
        order: 3
      })

      // No fake or mock resources seeded

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
          announcementText: 'Join our upcoming community empowerment workshops in Kiryandongo',
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
            { value: '50+', label: 'Communities Reached' }
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
          storyBadge: 'Our Story',
          storyTitle: 'From a small village initiative to a district-wide movement.',
          storyImage: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80',
          story: [
            'Resti Kiryandongo CBO was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.',
            'Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.'
          ]
        },
        contact: {
          title: 'Get Involved',
          subtitle: 'Join us in making a difference! Whether you want to partner, donate, or simply learn more about our work, we\'d love to hear from you.',
          address: 'Kiryandongo District, Uganda',
          email: 'info@resticbo.org',
          phone: '+256 700 000 000',
          whatsappNumber: '+256700000000',
          socialLinks: {
            facebook: 'https://www.facebook.com/resticbo',
            twitter: '#',
            instagram: '#'
          },
          supportItems: [
            'Support our community programs',
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
            description: 'Discover real stories from individuals and communities working with RESTI to build livelihoods, strengthen resilience, improve community well-being, and create locally led solutions.'
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
            description: 'Access RESTI’s reports, publications, policies, forms, assessments, program resources, and other documents that provide information about our work and community initiatives.'
          },
          opportunities: {
            title: 'Opportunities',
            description: 'Explore career openings, consultancies, and collaborative opportunities to make a difference with us.'
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
          { value: '50+', label: 'Communities Reached' }
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
        storyBadge: 'Our Story',
        storyTitle: 'From a small village initiative to a district-wide movement.',
        storyImage: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80',
        story: [
          'Resti Kiryandongo CBO was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.',
          'Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.'
        ]
      },
      contact: {
        title: 'Get Involved',
        subtitle: 'Join us in making a difference! Whether you want to partner, donate, or simply learn more about our work, we\'d love to hear from you.',
        address: 'Kiryandongo District, Uganda',
        email: 'info@resticbo.org',
        phone: '+256 700 000 000',
        socialLinks: {
          facebook: 'https://www.facebook.com/resticbo',
          twitter: '#',
          instagram: '#'
        },
        supportItems: [
          'Support our community programs',
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
          description: 'Discover real stories from individuals and communities working with RESTI to build livelihoods, strengthen resilience, improve community well-being, and create locally led solutions.'
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
          description: 'Access RESTI’s reports, publications, policies, forms, assessments, program resources, and other documents that provide information about our work and community initiatives.'
        },
        opportunities: {
          title: 'Opportunities',
          description: 'Explore career openings, consultancies, and collaborative opportunities to make a difference with us.'
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

// ============= FINANCIAL TRANSPARENCY ROUTES =============

// Get Financial Transparency data (public sees published only, admin sees all)
app.get('/make-server-2a4be611/financial-transparency', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    let isAdmin = false

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
            isAdmin = true
          }
        }
      } catch {
        // public or invalid token
      }
    }

    const dedicated = await kv.get('financial_transparency')
    const siteSettings = await kv.get('site_settings') || {}
    const rawData = dedicated || siteSettings.financialTransparency || siteSettings.financials || {}

    const defaultData = {
      badge: 'Financial Accountability & Stewardship',
      title: 'Financial Transparency',
      subtitle: 'We are committed to transparency and accountability. Learn how RESTI uses contributions to support communities, deliver programs, and strengthen sustainable development in Kiryandongo District.',
      allocationsTitle: 'How Contributions Are Used',
      allocationsSubtitle: 'A transparent breakdown of how resources are deployed across programmatic, community, and administrative activities.',
      allocationsReportingPeriod: '',
      allocationsCurrency: 'USD',
      allocationsPublished: false,
      allocationsLastUpdated: new Date().toISOString(),
      allocations: [],
      overviewTitle: 'Funding & Financial Overview',
      overviewSubtitle: 'Annual financial statements and funding summaries by reporting period.',
      overviewPublished: false,
      financialPeriods: [],
      documentsTitle: 'Annual Reports & Audited Financial Statements',
      documentsSubtitle: 'Access official annual reports, audited financial statements, and reporting disclosures.',
      documentsPublished: false,
      documents: [],
      transparencyTitle: 'Committed to Transparency',
      transparencyStatement: 'RESTI is committed to responsible stewardship of the resources entrusted to us. We provide financial and program information to help donors, partners, community members, and other stakeholders understand how resources are managed and how they support our work.',
      transparencyButtonText: 'Request More Information',
      transparencyButtonLink: '/contact'
    }

    const merged = { ...defaultData, ...rawData }

    // If public request, filter to published content only
    if (!isAdmin) {
      return c.json({
        data: {
          ...merged,
          allocations: merged.allocationsPublished ? (merged.allocations || []) : [],
          financialPeriods: merged.overviewPublished 
            ? (merged.financialPeriods || []).filter((p: any) => p.isPublished)
            : [],
          documents: merged.documentsPublished 
            ? (merged.documents || []).filter((d: any) => d.isPublished)
            : []
        },
        isAdmin: false
      })
    }

    return c.json({ data: merged, isAdmin: true })
  } catch (error) {
    console.error('Error fetching financial transparency data:', error)
    return c.json({ error: 'Failed to fetch financial transparency data', details: String(error) }, 500)
  }
})

// Update Financial Transparency data (admin only)
app.put('/make-server-2a4be611/financial-transparency', requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { data } = body

    if (!data) {
      return c.json({ error: 'Data object is required' }, 400)
    }

    // Validation: check allocation percentages
    if (data.allocations && Array.isArray(data.allocations) && data.allocations.length > 0) {
      let sum = 0
      for (const cat of data.allocations) {
        const p = Number(cat.percentage)
        if (p < 0) {
          return c.json({ error: `Category "${cat.name}" cannot have a negative percentage.` }, 400)
        }
        sum += p || 0
      }
      if (data.allocationsPublished && Math.round(sum) !== 100) {
        return c.json({ error: `Allocation percentages must sum to 100% when published. Current sum is ${sum}%.` }, 400)
      }
    }

    const updatedData = {
      ...data,
      lastUpdated: new Date().toISOString()
    }

    await kv.set('financial_transparency', updatedData)

    // Also sync to site_settings.financials
    const siteSettings = await kv.get('site_settings') || {}
    await kv.set('site_settings', {
      ...siteSettings,
      financialTransparency: updatedData,
      financials: {
        ...(siteSettings.financials || {}),
        ...updatedData
      },
      updatedAt: new Date().toISOString()
    })

    console.log('Financial transparency settings updated and synced')
    return c.json({ success: true, message: 'Financial transparency data saved successfully' })
  } catch (error) {
    console.error('Error updating financial transparency data:', error)
    return c.json({ error: 'Failed to update financial transparency data', details: String(error) }, 500)
  }
})

// ============= USER MANAGEMENT ROUTES =============

// ── Get all users (admin) ────────────────────────────────────────────────
app.get('/make-server-2a4be611/admin/users', requireSuperAdmin, async (c) => {
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
app.post('/make-server-2a4be611/admin/users', requireSuperAdmin, async (c) => {
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
      'Welcome to RESTI-CBO Admin',
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
app.put('/make-server-2a4be611/admin/users/:id', requireSuperAdmin, async (c) => {
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
app.delete('/make-server-2a4be611/admin/users/:id', requireSuperAdmin, async (c) => {
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
app.post('/make-server-2a4be611/admin/users/bulk-status', requireSuperAdmin, async (c) => {
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
app.post('/make-server-2a4be611/admin/users/bulk-role', requireSuperAdmin, async (c) => {
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
app.post('/make-server-2a4be611/admin/users/bulk-delete', requireSuperAdmin, async (c) => {
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
app.post('/make-server-2a4be611/admin/users/:id/reset-password', requireSuperAdmin, async (c) => {
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
        'Password Reset - RESTI-CBO',
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
app.post('/make-server-2a4be611/admin/users/:id/track-login', requireAdmin, async (c) => {
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

app.post('/make-server-2a4be611/admin/map-locations', requireEditor, async (c) => {
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

app.put('/make-server-2a4be611/admin/map-locations/:id', requireEditor, async (c) => {
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
app.get('/make-server-2a4be611/admin/livechats', requireAuthUser, async (c) => {
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
app.post('/make-server-2a4be611/admin/livechats/:id/reply', requireEditor, async (c) => {
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
