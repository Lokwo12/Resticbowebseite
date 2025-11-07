# Admin Dashboard User Guide

## 🚀 Getting Started

### Accessing the Admin Dashboard

1. **Navigate to the admin page**: Add `/admin` to your website URL
   - Example: `https://your-website.com/admin`

2. **Create Your Admin Account** (First Time Only)
   - Click "Need an account? Sign up"
   - Enter your name, email, and password
   - Click "Create Account"
   - You'll be redirected to the login page

3. **Login**
   - Enter your email and password
   - Click "Sign In"
   - You'll be taken to the dashboard overview

## 📊 Dashboard Overview

### Overview Tab
The Overview tab displays key metrics for your organization:

- **Programs**: Total number of programs
- **News Articles**: Total published news items
- **Contact Messages**: Total contacts with unread count
- **Volunteers**: Total volunteer applications with pending count
- **Total Donations**: Total amount raised and number of donations
- **Newsletter Subscribers**: Total active subscribers

## 🎯 Managing Content

### Programs Tab

**View Programs**
- All programs are displayed in cards
- Each card shows title, description, category, and creation date

**Delete a Program**
- Click the trash icon on any program card
- Confirm the deletion
- Program will be removed immediately

**Note**: To add or edit programs, use the backend API or add UI in future updates

### News & Updates Tab

**View News**
- All news articles are sorted by date (newest first)
- Each card shows title, content, and publication date

**Delete a News Article**
- Click the trash icon on any news card
- Confirm the deletion
- Article will be removed immediately

## 📬 Managing Communications

### Contacts Tab

**View Contact Messages**
- All contact form submissions are displayed
- Messages show sender name, email, phone, message, and date
- Status badge indicates: New, In Progress, or Resolved

**Update Contact Status**
- Click "In Progress" to mark as being handled
- Click "Resolved" to mark as completed
- Email the contact directly by clicking their email address

**Export Contacts**
- Click "Export CSV" button at the top
- Download will include all contact information
- Use for follow-ups or backup

### Volunteers Tab

**Review Applications**
- All volunteer applications are displayed
- View name, email, phone, skills, and message
- Status shows: Pending, Approved, or Rejected

**Approve a Volunteer**
- Click the "Approve" button with checkmark
- Status changes to Approved
- Follow up via email to onboard them

**Reject a Volunteer**
- Click the "Reject" button with X icon
- Status changes to Rejected
- Consider sending a polite email explaining why

**Export Volunteers**
- Click "Export CSV" to download all volunteer data
- Use for volunteer database management

## 💰 Managing Donations

### Donations Tab

**View All Donations**
- See all donations with amounts and currencies
- Payment method is displayed (Stripe, Mobile Money, Bank)
- Donor information included (name, email, phone)
- Optional donor messages are shown
- Sorted by date (newest first)

**Donation Details**
- Each donation shows:
  - Amount and currency
  - Payment method
  - Status (completed, pending, etc.)
  - Donor name and contact info
  - Optional message from donor
  - Date and time

**Export Donations**
- Click "Export CSV" for financial records
- Use for accounting and reporting
- Includes all transaction details

**Financial Tracking**
- Use the Overview tab to see total donations
- Export CSV for detailed financial analysis
- Track donation trends over time

## 📧 Newsletter Subscribers

### Subscribers Tab

**View Subscribers**
- All newsletter subscribers displayed in a grid
- Shows name (if provided), email, and subscription date
- Active status indicated

**Export Subscribers**
- Click "Export CSV" to download email list
- Use for email marketing campaigns
- Import into email service providers

**Tips for Newsletter Management**
- Regularly export your subscriber list
- Use a service like Mailchimp or SendGrid for sending
- Respect privacy - include unsubscribe links
- Send regular updates about your programs

## 🔧 Best Practices

### Security
- **Keep your password secure** - Don't share admin credentials
- **Use a strong password** - Mix letters, numbers, and symbols
- **Logout when done** - Click the logout button in top-right
- **Regular access reviews** - Monitor who has admin access

### Data Management
- **Regular exports** - Download CSV backups weekly
- **Timely responses** - Check contacts and volunteers daily
- **Status updates** - Keep contact and volunteer statuses current
- **Data privacy** - Handle personal information responsibly

### Communication
- **Respond promptly** - Reply to contacts within 24-48 hours
- **Professional emails** - Use proper grammar and formatting
- **Thank donors** - Send personalized thank-you messages
- **Update volunteers** - Keep approved volunteers informed

### Content Management
- **Update regularly** - Add new programs and news frequently
- **Quality over quantity** - Post meaningful, well-written content
- **Visual appeal** - Use images when possible (future feature)
- **Archive old content** - Remove outdated programs/news

## 📊 Using Exported Data

### CSV Export Features
Each section has an "Export CSV" button that downloads:

**Contacts CSV includes:**
- Name, Email, Phone
- Message content
- Status (new/in-progress/resolved)
- Timestamp

**Volunteers CSV includes:**
- Name, Email, Phone
- Skills listed
- Message/motivation
- Status (pending/approved/rejected)
- Application date

**Donations CSV includes:**
- Amount and currency
- Payment method
- Donor name and contact info
- Optional message
- Transaction ID (if applicable)
- Date and time

**Subscribers CSV includes:**
- Email address
- Name (if provided)
- Subscription date
- Status

### Using Exported Data
1. **Email Marketing**: Import subscribers into Mailchimp, SendGrid, etc.
2. **Accounting**: Use donation CSVs for financial reports
3. **Volunteer Database**: Track volunteer information in Excel/Google Sheets
4. **Follow-ups**: Create contact lists for personalized follow-ups
5. **Analytics**: Analyze trends in donations, contacts, and subscriptions

## 🆘 Troubleshooting

### Can't Login?
- Verify your email and password are correct
- Try resetting your password (contact developer)
- Check if you created an account (signup first if new)

### Data Not Loading?
- Refresh the page
- Check your internet connection
- Try logging out and back in
- Contact technical support if issue persists

### Export Not Working?
- Ensure there is data to export
- Check browser popup blocker settings
- Try a different browser
- Contact support if problem continues

### Changes Not Saving?
- Check your internet connection
- Verify you clicked the save/update button
- Look for error messages at top of screen
- Try again or contact support

## 📞 Getting Help

If you encounter issues or need assistance:

1. **Check this guide** - Most questions are answered here
2. **Review error messages** - They often explain the issue
3. **Try refreshing** - Simple refresh can fix many issues
4. **Contact support** - Reach out to your web developer

## 🔄 Regular Maintenance Tasks

### Daily
- [ ] Check for new contact messages
- [ ] Review pending volunteer applications
- [ ] Check donation notifications
- [ ] Respond to urgent inquiries

### Weekly
- [ ] Export all data for backup
- [ ] Review and update contact statuses
- [ ] Follow up with approved volunteers
- [ ] Post new news/updates if available

### Monthly
- [ ] Generate donation reports
- [ ] Analyze subscriber growth
- [ ] Review program effectiveness
- [ ] Clean up old/irrelevant content
- [ ] Update programs and news

## 🎓 Training Resources

### For New Admins
1. Spend 15 minutes exploring each tab
2. Practice exporting CSV files
3. Test status updates on contacts/volunteers
4. Review all current content
5. Ask questions about anything unclear

### Video Tutorials (Future)
- Basic navigation
- Managing contacts and volunteers
- Donation tracking
- Newsletter management
- Data exports

---

**Remember**: The admin dashboard is your control center. Regular use and data management will help your organization run smoothly and stay connected with your community!

For additional features or custom requests, contact your web developer.
