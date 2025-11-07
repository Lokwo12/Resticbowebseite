# Technical Architecture Documentation

## System Overview

The Resti Kiryandongo CBO website is a modern, full-stack web application built with a serverless architecture, featuring a React frontend, Deno backend, and Supabase services.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐               │
│  │  Public  │  │  Admin   │  │  Components │               │
│  │  Website │  │Dashboard │  │   Library   │               │
│  └──────────┘  └──────────┘  └─────────────┘               │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
┌───────────────────────┴─────────────────────────────────────┐
│                    Backend (Deno + Hono)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   API    │  │  Email   │  │  Storage │   │
│  │ Handlers │  │ Endpoints│  │ Service  │  │ Manager  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
┌─────────┴───────┐ ┌──┴──────┐ ┌───┴────────┐
│   Supabase      │ │ Stripe  │ │  Resend    │
│ ┌─────────────┐ │ │   API   │ │    API     │
│ │  Auth       │ │ └─────────┘ └────────────┘
│ │  Storage    │ │
│ │  KV Store   │ │
│ └─────────────┘ │
└─────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS v4.0
- **UI Components**: Shadcn/ui
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: Client-side routing with pathname detection
- **Forms**: Controlled components
- **Charts**: Recharts
- **Rich Text Editor**: React Quill
- **Payment**: Stripe React SDK
- **Notifications**: Sonner (toast library)

### Backend
- **Runtime**: Deno (JavaScript/TypeScript runtime)
- **Framework**: Hono (lightweight web framework)
- **API Style**: RESTful
- **Middleware**: CORS, Logger
- **Authentication**: Supabase Auth
- **File Upload**: Supabase Storage
- **Database**: Supabase KV Store

### Third-Party Services
- **Supabase**:
  - Authentication (user management)
  - Storage (image hosting)
  - Database (KV store for data)
- **Stripe**: Payment processing
- **Resend**: Email delivery
- **Unsplash**: Stock images

---

## Data Flow

### Public Website Flow

```
User Action (Contact Form)
    ↓
Frontend Validation
    ↓
POST /make-server-2a4be611/contact
    ↓
Backend Validation
    ↓
Store in KV Store
    ↓
Send Email Notifications
    ↓
Return Success Response
    ↓
Show Toast Notification
```

### Admin Dashboard Flow

```
Admin Login
    ↓
Supabase Auth Verification
    ↓
Get Session Token
    ↓
Load Dashboard
    ↓
Fetch Data (Programs, News, etc.)
    ↓
Display with Role-Based UI
    ↓
Admin Actions (CRUD Operations)
    ↓
Backend API Calls
    ↓
Update KV Store
    ↓
Refresh UI
```

### Image Upload Flow

```
User Selects Image
    ↓
Frontend Validation (size, type)
    ↓
FormData Creation
    ↓
POST /make-server-2a4be611/upload-image
    ↓
Backend Validation
    ↓
Upload to Supabase Storage
    ↓
Generate Public URL
    ↓
Return URL to Frontend
    ↓
Display Image Preview
    ↓
Save URL with Content
```

---

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/contact` | POST | Submit contact form | No |
| `/programs` | GET | Get all programs | No |
| `/news` | GET | Get all news | No |
| `/volunteer` | POST | Submit volunteer app | No |
| `/newsletter` | POST | Subscribe to newsletter | No |
| `/donations` | POST | Record donation | No |
| `/donation-stats` | GET | Get donation statistics | No |
| `/create-payment-intent` | POST | Create Stripe payment | No |
| `/initialize` | POST | Initialize sample data | No |

### Admin Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/admin/signup` | POST | Create admin account | No |
| `/admin/stats` | GET | Get dashboard stats | Yes |
| `/admin/analytics` | GET | Get analytics data | Yes |
| `/admin/contacts` | GET | Get all contacts | Yes |
| `/admin/contacts/:id` | PATCH | Update contact status | Yes |
| `/admin/contacts/bulk-update` | POST | Bulk update contacts | Yes |
| `/admin/volunteers` | GET | Get all volunteers | Yes |
| `/admin/volunteers/:id` | PATCH | Update volunteer status | Yes |
| `/admin/volunteers/bulk-update` | POST | Bulk update volunteers | Yes |
| `/admin/donations` | GET | Get all donations | Yes |
| `/admin/users` | GET | Get admin users | Yes (Super Admin) |
| `/admin/users/:id/role` | PATCH | Update user role | Yes (Super Admin) |
| `/newsletter` | GET | Get subscribers | Yes |
| `/programs` | POST | Create program | Yes |
| `/programs/:id` | PUT | Update program | Yes |
| `/programs/:id` | DELETE | Delete program | Yes |
| `/programs/bulk-delete` | POST | Bulk delete programs | Yes |
| `/news` | POST | Create news | Yes |
| `/news/:id` | PUT | Update news | Yes |
| `/news/:id` | DELETE | Delete news | Yes |
| `/news/bulk-delete` | POST | Bulk delete news | Yes |
| `/upload-image` | POST | Upload image | Yes |
| `/images/:fileName` | DELETE | Delete image | Yes |

---

## Data Models

### Contact
```typescript
{
  key: string;              // "contact:timestamp"
  value: {
    name: string;
    email: string;
    phone: string;
    message: string;
    timestamp: string;      // ISO 8601
    status: 'new' | 'in-progress' | 'resolved';
  }
}
```

### Program
```typescript
{
  key: string;              // "program:timestamp"
  value: {
    title: string;
    description: string;
    image: string;          // URL
    category: string;
    createdAt: string;
    updatedAt?: string;
  }
}
```

### News
```typescript
{
  key: string;              // "news:timestamp"
  value: {
    title: string;
    content: string;        // HTML from rich text editor
    image: string;          // URL
    timestamp: string;
    updatedAt?: string;
  }
}
```

### Volunteer
```typescript
{
  key: string;              // "volunteer:timestamp"
  value: {
    name: string;
    email: string;
    phone: string;
    skills: string;
    message: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
  }
}
```

### Donation
```typescript
{
  key: string;              // "donation:timestamp"
  value: {
    amount: number;
    currency: string;       // USD, EUR, UGX
    paymentMethod: string;
    donorName: string;
    donorEmail: string;
    donorPhone: string;
    message: string;
    paymentIntentId: string;
    transactionId: string;
    timestamp: string;
    status: string;         // 'completed', 'pending', etc.
  }
}
```

### Newsletter Subscriber
```typescript
{
  key: string;              // "newsletter:timestamp"
  value: {
    email: string;
    name: string;
    timestamp: string;
    status: 'active' | 'unsubscribed';
  }
}
```

### User (Supabase Auth)
```typescript
{
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'super-admin' | 'admin' | 'editor' | 'viewer';
  }
  created_at: string;
}
```

---

## Security Architecture

### Authentication
- **Method**: Supabase Auth (email/password)
- **Session Management**: JWT tokens
- **Password**: Bcrypt hashing (handled by Supabase)
- **Token Storage**: Browser session storage

### Authorization
- **Role-Based Access Control (RBAC)**:
  - Roles stored in user metadata
  - Checked on both frontend and backend
  - UI elements hidden based on role
  - API endpoints validate permissions

### Data Protection
- **Environment Variables**: All secrets stored securely
- **CORS**: Configured to allow cross-origin requests
- **Input Validation**: Server-side validation on all inputs
- **SQL Injection**: Protected via KV store abstraction
- **XSS Prevention**: React's built-in escaping
- **File Upload**: Type and size validation

### API Security
- **Rate Limiting**: Can be added via middleware
- **HTTPS Only**: Enforced by Supabase
- **API Keys**: Stored in environment variables
- **CORS Headers**: Properly configured

---

## Database Schema (KV Store)

The application uses a key-value store with the following prefixes:

| Prefix | Purpose | Example Key |
|--------|---------|-------------|
| `contact:` | Contact submissions | `contact:1699876543210` |
| `program:` | Programs/Projects | `program:1699876543210` |
| `news:` | News articles | `news:1699876543210` |
| `volunteer:` | Volunteer applications | `volunteer:1699876543210` |
| `donation:` | Donation records | `donation:1699876543210` |
| `newsletter:` | Email subscribers | `newsletter:1699876543210` |

### KV Store Operations

```typescript
// Set a value
await kv.set(key, value)

// Get a value
const value = await kv.get(key)

// Delete a value
await kv.del(key)

// Get multiple values
const values = await kv.mget([key1, key2, key3])

// Set multiple values
await kv.mset([
  { key: key1, value: value1 },
  { key: key2, value: value2 }
])

// Delete multiple values
await kv.mdel([key1, key2, key3])

// Get all values with prefix
const items = await kv.getByPrefix('contact:')
```

---

## File Storage

### Supabase Storage Configuration

- **Bucket Name**: `make-2a4be611-uploads`
- **Access**: Public
- **File Size Limit**: 5MB
- **Allowed Types**: 
  - image/jpeg
  - image/png
  - image/webp
  - image/gif

### File Naming Convention
```
timestamp-sanitized-filename.ext
Example: 1699876543210-program-image.jpg
```

### URL Structure
```
https://{project-id}.supabase.co/storage/v1/object/public/make-2a4be611-uploads/{filename}
```

---

## Email Service Integration

### Resend API

**Configuration:**
```typescript
const resendApiKey = Deno.env.get('RESEND_API_KEY');
```

**Email Function:**
```typescript
async function sendEmail(to: string, subject: string, html: string) {
  // Makes POST request to Resend API
  // Returns success/error status
}
```

**Email Types:**
1. Contact form confirmation
2. Contact form admin notification
3. Donation receipt
4. Donation admin notification
5. (Future) Newsletter emails
6. (Future) Volunteer confirmations

---

## Payment Integration

### Stripe Configuration

**Client-Side:**
```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_...'
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
```

**Server-Side:**
```typescript
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia',
})
```

**Flow:**
1. Frontend creates payment intent
2. Backend generates client secret
3. Frontend collects payment details
4. Stripe processes payment
5. Backend records donation
6. Email sent to donor and admin

---

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: By route (main site vs admin)
- **Lazy Loading**: Tab-based data loading
- **Memoization**: React hooks for expensive computations
- **Debouncing**: Search inputs (future enhancement)
- **Image Optimization**: File size limits

### Backend Optimization
- **Parallel Requests**: Promise.all for multiple data fetches
- **Caching**: Can be added for frequently accessed data
- **Bulk Operations**: Single API call for multiple items
- **Efficient Queries**: KV store prefix searches

### Database Optimization
- **Indexed Prefixes**: Fast prefix-based searches
- **Minimal Data**: Only fetch needed fields
- **Pagination**: Can be added for large datasets

---

## Deployment Architecture

### Supabase Edge Functions
- **Runtime**: Deno Deploy
- **Region**: Auto-selected closest to users
- **Cold Starts**: Minimal (< 100ms)
- **Scaling**: Automatic
- **Monitoring**: Built-in logs

### Frontend Hosting
- **Served by**: Supabase
- **CDN**: Automatic
- **HTTPS**: Enforced
- **Custom Domain**: Supported

---

## Monitoring and Logging

### Server Logs
```typescript
app.use('*', logger(console.log))
console.log('Event description:', data)
console.error('Error description:', error)
```

### Error Handling
- Try-catch blocks on all endpoints
- Detailed error messages in logs
- User-friendly error responses
- Toast notifications on frontend

### Metrics to Monitor
- API response times
- Error rates
- Authentication failures
- Email delivery rates
- Storage usage
- Database query performance

---

## Backup and Recovery

### Data Backup
- **CSV Exports**: All data types exportable
- **Frequency**: Manual (recommended weekly)
- **Storage**: Local download + cloud storage

### Recovery Procedures
1. Export data regularly via admin dashboard
2. Store exports in secure location
3. In case of data loss:
   - Contact Supabase support
   - Restore from latest export
   - Verify data integrity

---

## Scalability

### Current Capacity
- **KV Store**: Unlimited keys (within Supabase limits)
- **Storage**: 1GB free (expandable)
- **API Calls**: 500,000 per month (free tier)
- **Auth Users**: 50,000 MAU (free tier)

### Scaling Strategy
1. **Vertical Scaling**: Upgrade Supabase plan
2. **Horizontal Scaling**: Multiple regions (pro feature)
3. **Caching**: Add Redis for frequently accessed data
4. **CDN**: Already included via Supabase
5. **Database**: Consider migration to Postgres for complex queries

---

## Development Workflow

### Local Development
```bash
# Frontend
npm install
npm run dev

# Backend (Supabase CLI)
supabase start
supabase functions serve
```

### Environment Variables
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
STRIPE_SECRET_KEY=sk_xxx
RESEND_API_KEY=re_xxx
```

### Testing Strategy
- Manual testing via UI
- API testing with Postman/Thunder Client
- Email testing with test accounts
- Payment testing with Stripe test mode

---

## Future Technical Enhancements

### Short Term
- Add request rate limiting
- Implement caching layer
- Add API documentation (Swagger/OpenAPI)
- Set up automated backups
- Add health check endpoints

### Long Term
- Migrate to PostgreSQL for complex queries
- Implement full-text search
- Add real-time features (WebSockets)
- Implement CDN for images
- Add automated testing suite
- Set up CI/CD pipeline

---

## Technical Support

### Log Access
- Supabase Dashboard → Edge Functions → Logs
- Real-time log streaming
- Historical log search

### Debug Mode
```typescript
// Add to any endpoint for detailed logging
console.log('Debug info:', {
  endpoint: c.req.url,
  method: c.req.method,
  body: await c.req.json(),
  headers: c.req.headers
})
```

### Common Issues and Solutions
See QUICK_START.md and ADMIN_GUIDE.md for troubleshooting.

---

## Compliance and Standards

### GDPR Considerations
- User data exportable (CSV)
- User data deletable (manual via admin)
- Privacy policy needed (not included)
- Cookie consent needed (not included)

### Accessibility
- Semantic HTML
- Keyboard navigation supported
- Color contrast (Tailwind defaults)
- ARIA labels (can be improved)

### SEO
- Semantic HTML structure
- Meta tags configurable
- Sitemap can be generated
- Open Graph tags can be added

---

This architecture supports the current feature set and is designed to scale with your organization's growth. The modular design allows for easy additions and modifications as needs evolve.
