import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.5.0'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
}) : null

// Initialize Resend for email notifications
const resendApiKey = Deno.env.get('RESEND_API_KEY')

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
        from: 'onboarding@resend.dev', // Using Resend's test domain. Replace with 'Resti Kiryandongo CBO <noreply@yourdomain.com>' after verifying your domain
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

// Initialize Supabase Storage bucket
async function initializeStorage() {
  const bucketName = 'make-2a4be611-uploads'
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      console.log('Storage bucket created:', bucketName)
    }
  } catch (error) {
    console.error('Storage initialization error:', error)
  }
}

// Initialize storage on startup
initializeStorage()

// Contact form submission with email notification
app.post('/make-server-2a4be611/contact', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, message } = body

    if (!name || !email || !message) {
      return c.json({ error: 'Name, email, and message are required' }, 400)
    }

    const contactId = `contact:${Date.now()}`
    await kv.set(contactId, {
      name,
      email,
      phone: phone || '',
      message,
      timestamp: new Date().toISOString(),
      status: 'new'
    })

    // Send notification email to admin
    await sendEmail(
      'admin@restikirya.org', // TODO: Replace with your actual admin email
      'New Contact Form Submission',
      `
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `
    )

    // Send confirmation email to submitter
    await sendEmail(
      email,
      'Thank you for contacting Resti Kiryandongo CBO',
      `
        <h2>Thank You for Reaching Out!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
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
app.post('/make-server-2a4be611/programs', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, image, category } = body

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400)
    }

    const programId = `program:${Date.now()}`
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
app.post('/make-server-2a4be611/news', async (c) => {
  try {
    const body = await c.req.json()
    const { title, content, image } = body

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400)
    }

    const newsId = `news:${Date.now()}`
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
app.post('/make-server-2a4be611/volunteer', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, skills, message } = body

    if (!name || !email || !phone) {
      return c.json({ error: 'Name, email, and phone are required' }, 400)
    }

    const volunteerId = `volunteer:${Date.now()}`
    await kv.set(volunteerId, {
      name,
      email,
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

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency || 'usd',
      metadata: {
        donorName: donorName || 'Anonymous',
        donorEmail: donorEmail || '',
      },
    })

    console.log(`Payment intent created: ${paymentIntent.id}`)
    return c.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return c.json({ error: 'Failed to create payment intent', details: String(error) }, 500)
  }
})

// Record donation with email notification
app.post('/make-server-2a4be611/donations', async (c) => {
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

    if (!amount || !paymentMethod) {
      return c.json({ error: 'Amount and payment method are required' }, 400)
    }

    const donationId = `donation:${Date.now()}`
    const donationData = {
      amount,
      currency: currency || 'USD',
      paymentMethod,
      donorName: donorName || 'Anonymous',
      donorEmail: donorEmail || '',
      donorPhone: donorPhone || '',
      message: message || '',
      paymentIntentId: paymentIntentId || '',
      transactionId: transactionId || '',
      timestamp: new Date().toISOString(),
      status: 'completed'
    }
    
    await kv.set(donationId, donationData)

    // Send notification email to admin
    await sendEmail(
      'admin@restikirya.org', // TODO: Replace with your actual admin email
      `New Donation: ${currency} ${amount}`,
      `
        <h2>New Donation Received! 🎉</h2>
        <p><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
        <p><strong>Donor:</strong> ${donorName}</p>
        <p><strong>Email:</strong> ${donorEmail || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${donorPhone || 'Not provided'}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <hr>
        <p><em>Received at ${new Date().toLocaleString()}</em></p>
      `
    )

    // Send thank you email to donor
    if (donorEmail) {
      await sendEmail(
        donorEmail,
        'Thank You for Your Generous Donation!',
        `
          <h2>Thank You! 🙏</h2>
          <p>Dear ${donorName},</p>
          <p>Thank you for your generous donation of <strong>${currency} ${amount.toLocaleString()}</strong> to Resti Kiryandongo CBO.</p>
          <p>Your support makes a real difference in our community and helps us continue our vital work in education, healthcare, and community development.</p>
          ${message ? `<p><strong>Your message to us:</strong> ${message}</p>` : ''}
          <br>
          <h3>Donation Details:</h3>
          <ul>
            <li>Amount: ${currency} ${amount.toLocaleString()}</li>
            <li>Payment Method: ${paymentMethod}</li>
            <li>Date: ${new Date().toLocaleDateString()}</li>
            <li>Reference: ${donationId.split(':')[1]}</li>
          </ul>
          <br>
          <p>With gratitude,</p>
          <p>The Resti Kiryandongo CBO Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This email serves as your donation receipt. Please keep it for your records.</p>
        `
      )
    }

    console.log(`Donation recorded: ${donationId}`)
    return c.json({ success: true, message: 'Donation recorded successfully', id: donationId })
  } catch (error) {
    console.error('Error recording donation:', error)
    return c.json({ error: 'Failed to record donation', details: String(error) }, 500)
  }
})

// Get donation statistics
app.get('/make-server-2a4be611/donation-stats', async (c) => {
  try {
    const donations = await kv.getByPrefix('donation:')
    
    const stats = donations.reduce((acc, donation) => {
      // Safely access the amount property
      const amount = parseFloat(donation?.value?.amount || donation?.amount || 0)
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
app.post('/make-server-2a4be611/newsletter', async (c) => {
  try {
    const body = await c.req.json()
    const { email, name } = body

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    // Check if already subscribed
    const existing = await kv.getByPrefix('newsletter:')
    const alreadySubscribed = existing.some(sub => sub.value.email === email)
    
    if (alreadySubscribed) {
      return c.json({ error: 'This email is already subscribed' }, 400)
    }

    const subscriberId = `newsletter:${Date.now()}`
    await kv.set(subscriberId, {
      email,
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
app.get('/make-server-2a4be611/newsletter', async (c) => {
  try {
    const subscribers = await kv.getByPrefix('newsletter:')
    return c.json({ subscribers })
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error)
    return c.json({ error: 'Failed to fetch subscribers', details: String(error) }, 500)
  }
})

// Image upload endpoint
app.post('/make-server-2a4be611/upload-image', async (c) => {
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
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
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

// Delete image endpoint
app.delete('/make-server-2a4be611/images/:fileName', async (c) => {
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

// Admin signup with role
app.post('/make-server-2a4be611/admin/signup', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name, role } = body

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // Default role is 'editor', first user can be 'super-admin'
    const userRole = role || 'editor'

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '', role: userRole },
      email_confirm: true // Auto-confirm since email server not configured
    })

    if (error) {
      console.error('Admin signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    console.log(`Admin user created: ${data.user.id} with role: ${userRole}`)
    return c.json({ success: true, message: 'Admin account created successfully', user: data.user })
  } catch (error) {
    console.error('Error creating admin account:', error)
    return c.json({ error: 'Failed to create admin account', details: String(error) }, 500)
  }
})

// Update user role (super-admin only)
app.patch('/make-server-2a4be611/admin/users/:userId/role', async (c) => {
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

// Get all admin users (super-admin only)
app.get('/make-server-2a4be611/admin/users', async (c) => {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('List users error:', error)
      return c.json({ error: error.message }, 500)
    }

    // Filter to only return users with admin roles
    const adminUsers = users.filter(user => 
      user.user_metadata?.role && 
      ['super-admin', 'admin', 'editor', 'viewer'].includes(user.user_metadata.role)
    )

    return c.json({ users: adminUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Failed to fetch users', details: String(error) }, 500)
  }
})

// Get all contact submissions (admin)
app.get('/make-server-2a4be611/admin/contacts', async (c) => {
  try {
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
app.patch('/make-server-2a4be611/admin/contacts/:id', async (c) => {
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
app.get('/make-server-2a4be611/admin/volunteers', async (c) => {
  try {
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
app.get('/make-server-2a4be611/admin/donations', async (c) => {
  try {
    const donations = await kv.getByPrefix('donation:')
    // Sort by timestamp descending
    donations.sort((a, b) => new Date(b.value.timestamp).getTime() - new Date(a.value.timestamp).getTime())
    return c.json({ donations })
  } catch (error) {
    console.error('Error fetching donations:', error)
    return c.json({ error: 'Failed to fetch donations', details: String(error) }, 500)
  }
})

// Delete program (admin)
app.delete('/make-server-2a4be611/programs/:id', async (c) => {
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
app.put('/make-server-2a4be611/programs/:id', async (c) => {
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
app.post('/make-server-2a4be611/programs/bulk-delete', async (c) => {
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
app.delete('/make-server-2a4be611/news/:id', async (c) => {
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
app.post('/make-server-2a4be611/news/bulk-delete', async (c) => {
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

// Update news (admin)
app.put('/make-server-2a4be611/news/:id', async (c) => {
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
app.get('/make-server-2a4be611/admin/stats', async (c) => {
  try {
    const [programs, news, contacts, volunteers, donations, subscribers] = await Promise.all([
      kv.getByPrefix('program:'),
      kv.getByPrefix('news:'),
      kv.getByPrefix('contact:'),
      kv.getByPrefix('volunteer:'),
      kv.getByPrefix('donation:'),
      kv.getByPrefix('newsletter:')
    ])

    const totalDonations = donations.reduce((sum, d) => sum + (d.value.amount || 0), 0)
    const newContacts = contacts.filter(c => c.value.status === 'new').length
    const pendingVolunteers = volunteers.filter(v => v.value.status === 'pending').length

    const stats = {
      totalPrograms: programs.length,
      totalNews: news.length,
      totalContacts: contacts.length,
      newContacts,
      totalVolunteers: volunteers.length,
      pendingVolunteers,
      totalDonations: donations.length,
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
app.get('/make-server-2a4be611/admin/analytics', async (c) => {
  try {
    const [donations, contacts, volunteers, subscribers] = await Promise.all([
      kv.getByPrefix('donation:'),
      kv.getByPrefix('contact:'),
      kv.getByPrefix('volunteer:'),
      kv.getByPrefix('newsletter:')
    ])

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

    donations.forEach(donation => {
      const donationDate = new Date(donation.value.timestamp)
      const monthKey = donationDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      const monthData = monthlyDonations.find(m => m.month === monthKey)
      if (monthData) {
        monthData.amount += donation.value.amount || 0
        monthData.count += 1
      }
    })

    // Donations by payment method
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {}
    donations.forEach(donation => {
      const method = donation.value.paymentMethod || 'unknown'
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 }
      }
      paymentMethods[method].count += 1
      paymentMethods[method].amount += donation.value.amount || 0
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

    donations.forEach(d => {
      const date = d.value.timestamp.split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.donations += 1
    })

    contacts.forEach(c => {
      const date = c.value.timestamp.split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.contacts += 1
    })

    volunteers.forEach(v => {
      const date = v.value.timestamp.split('T')[0]
      const day = last30Days.find(day => day.date === date)
      if (day) day.volunteers += 1
    })

    subscribers.forEach(s => {
      const date = s.value.timestamp.split('T')[0]
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

    const imageId = `gallery:${Date.now()}`
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
    const storyId = `story:${Date.now()}`
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
    const memberId = `team:${Date.now()}`
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
    const eventId = `event:${Date.now()}`
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
    const partnerId = `partner:${Date.now()}`
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
    const reportId = `report:${Date.now()}`
    await kv.set(reportId, { title, year, fileUrl, description, fileSize })
    return c.json({ success: true, message: 'Report added successfully', id: reportId })
  } catch (error) {
    console.error('Error creating report:', error)
    return c.json({ error: 'Failed to create report', details: String(error) }, 500)
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
    const opportunityId = `opportunity:${Date.now()}`
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
    const faqId = `faq:${Date.now()}`
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
    const resourceId = `resource:${Date.now()}`
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
          primaryColor: '#10b981', // emerald-600
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

// Update site settings (admin only)
app.put('/make-server-2a4be611/site-settings', async (c) => {
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

Deno.serve(app.fetch)
