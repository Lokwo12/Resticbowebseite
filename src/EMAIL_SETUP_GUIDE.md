# Email Notification Setup Guide

## Overview

Your website now has email notification functionality using Resend API. Emails are automatically sent for:

1. **New Contact Form Submissions**
   - Confirmation email to the submitter
   - Notification email to admin

2. **New Donations**
   - Thank you/receipt email to the donor
   - Notification email to admin

## Setting Up Resend

### Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key

1. Log into your Resend dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **"Create API Key"**
4. Give it a name (e.g., "Resti Kiryandongo Website")
5. Copy the API key (starts with `re_`)

### Step 3: Add API Key to Environment

The system will prompt you to add your `RESEND_API_KEY`. Simply paste the key you copied from Resend.

### Step 4: Configure Your Sending Domain

**Option A: Use Resend's Test Domain (Quick Start)**
- Resend provides a test domain for immediate use
- Limited to sending 100 emails per day
- Only works with verified email addresses
- Good for testing

**Option B: Use Your Own Domain (Recommended for Production)**

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `restikirya.org`)
4. Add the DNS records provided by Resend to your domain provider:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)
5. Wait for DNS propagation (usually 1-24 hours)
6. Verify the domain in Resend dashboard

### Step 5: Update Email Addresses in Code

Update the admin email address in `/supabase/functions/server/index.tsx`:

Find these lines and replace with your actual admin email:

```typescript
// Line ~66 - Contact notification
await sendEmail(
  'admin@restikirya.org', // CHANGE THIS to your actual admin email
  'New Contact Form Submission',
  ...
)

// Line ~350 - Donation notification
await sendEmail(
  'admin@restikirya.org', // CHANGE THIS to your actual admin email
  `New Donation: ${currency} ${amount}`,
  ...
)
```

Also update the "from" address in the `sendEmail` function:

```typescript
from: 'Resti Kiryandongo CBO <noreply@restikirya.org>', // CHANGE to your domain
```

## Email Templates

### Contact Form Email Templates

**To Admin:**
```
Subject: New Contact Form Submission

New Contact Message
From: [Name]
Email: [Email]
Phone: [Phone]
Message: [Message]

Submitted at [Date/Time]
```

**To Submitter:**
```
Subject: Thank you for contacting Resti Kiryandongo CBO

Thank You for Reaching Out!

Dear [Name],

We have received your message and will get back to you as soon as possible.

Your message:
[Message]

Best regards,
Resti Kiryandongo CBO Team
```

### Donation Email Templates

**To Admin:**
```
Subject: New Donation: [Currency] [Amount]

New Donation Received! 🎉

Amount: [Currency] [Amount]
Donor: [Name]
Email: [Email]
Phone: [Phone]
Payment Method: [Method]
Message: [Optional Message]

Received at [Date/Time]
```

**To Donor:**
```
Subject: Thank You for Your Generous Donation!

Thank You! 🙏

Dear [Name],

Thank you for your generous donation of [Currency] [Amount] to Resti Kiryandongo CBO.

Your support makes a real difference in our community and helps us continue our vital work in education, healthcare, and community development.

Donation Details:
- Amount: [Currency] [Amount]
- Payment Method: [Method]
- Date: [Date]
- Reference: [ID]

With gratitude,
The Resti Kiryandongo CBO Team

This email serves as your donation receipt. Please keep it for your records.
```

## Customizing Email Templates

To customize email templates, edit the HTML in `/supabase/functions/server/index.tsx`:

### Contact Form Emails

Find the `app.post('/make-server-2a4be611/contact'` endpoint and modify the HTML in the `sendEmail` calls.

### Donation Emails

Find the `app.post('/make-server-2a4be611/donations'` endpoint and modify the HTML in the `sendEmail` calls.

### Email Styling Tips

1. **Keep it simple** - Many email clients don't support complex CSS
2. **Use inline styles** - Email clients prefer inline CSS
3. **Test thoroughly** - Send test emails to multiple email providers (Gmail, Outlook, etc.)
4. **Include plain text version** - Some users prefer plain text emails

## Testing Email Notifications

### Test Contact Form

1. Go to your website
2. Fill out the contact form
3. Submit
4. Check:
   - Your admin email for the notification
   - The submitter's email for the confirmation

### Test Donation Emails

1. Make a test donation
2. Check:
   - Your admin email for the notification
   - The donor's email for the receipt

### Test Email Addresses

For testing, you can use:
- Your own email address
- [Mailinator](https://www.mailinator.com) for disposable email addresses
- [Mailtrap](https://mailtrap.io) for email testing (recommended)

## Resend API Limits

### Free Plan
- 100 emails per day
- 3,000 emails per month
- Test domain included
- Basic support

### Paid Plans (Starting at $20/month)
- 50,000 emails per month
- Custom domain required
- Priority support
- Advanced analytics

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   - Verify RESEND_API_KEY is set correctly
   - Make sure it starts with `re_`

2. **Check Domain Setup**
   - If using custom domain, verify DNS records
   - Check domain verification status in Resend dashboard

3. **Check Email Addresses**
   - Ensure "from" address matches your verified domain
   - Verify admin email address is correct

4. **Check Logs**
   - Look at server logs for error messages
   - Check Resend dashboard for delivery status

### Emails Going to Spam

1. **Set up SPF, DKIM, and DMARC**
   - Follow Resend's DNS setup guide
   - Use [MXToolbox](https://mxtoolbox.com) to verify DNS records

2. **Authenticate Your Domain**
   - Complete domain verification in Resend
   - Wait for DNS propagation

3. **Avoid Spam Triggers**
   - Don't use all caps in subject lines
   - Avoid too many exclamation marks
   - Include an unsubscribe link for newsletters

### Emails Delayed

- Email delivery can take a few seconds to several minutes
- Check Resend dashboard for delivery status
- Large volumes may be rate-limited

## Advanced Configuration

### Adding More Email Types

To add email notifications for other events:

1. Add a new `sendEmail()` call in the appropriate endpoint
2. Customize the subject and HTML content
3. Test thoroughly

Example for volunteer applications:

```typescript
// In volunteer endpoint
await sendEmail(
  'admin@restikirya.org',
  'New Volunteer Application',
  `
    <h2>New Volunteer Application</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Skills:</strong> ${skills}</p>
  `
)
```

### Using Email Templates

For more sophisticated emails, consider:

1. **React Email** - Design emails with React components
2. **MJML** - Responsive email framework
3. **External template services** - Like Mailchimp or SendGrid

### Email Analytics

Resend provides:
- Delivery rates
- Open rates (if tracking enabled)
- Click rates
- Bounce rates

Access these in your Resend dashboard.

## Security Best Practices

1. **Never commit API keys** - Already handled via environment variables
2. **Validate email addresses** - Prevent email injection attacks
3. **Rate limiting** - Consider adding rate limits to prevent abuse
4. **Sanitize user input** - Prevent XSS in email content

## Alternative Email Providers

If Resend doesn't meet your needs, consider:

- **SendGrid** - Robust free tier, widely used
- **Mailgun** - Developer-friendly
- **Amazon SES** - Very cost-effective at scale
- **Postmark** - Focus on transactional emails

To switch providers, you'll need to:
1. Update the `sendEmail` function in the backend
2. Adjust API call format to match new provider
3. Update environment variable name

## Support

For Resend-specific issues:
- Documentation: [https://resend.com/docs](https://resend.com/docs)
- Support: support@resend.com

For website issues:
- Contact your web developer

---

**Important**: Replace all placeholder email addresses with your actual email addresses before going live!
