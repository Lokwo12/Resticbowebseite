# GitHub Copilot Instructions for Resti Kiryandongo CBO Website

## Project Overview

This is a modern, full-stack web application for the Resti Kiryandongo Community-Based Organization. The project features a public-facing website with a donation system, volunteer management, news feed, and a comprehensive admin dashboard.

### Key Technologies
- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS v4.0
- **UI Components**: Shadcn/ui components with Radix UI primitives
- **Backend**: Deno runtime with Hono framework (serverless)
- **Database & Auth**: Supabase (Authentication, Storage, KV Store)
- **Payments**: Stripe integration for donations
- **Email**: Resend API for notifications
- **Build Tool**: Vite 6.3.5

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui reusable UI components
│   ├── Hero.tsx        # Main hero section
│   ├── About.tsx       # About section
│   ├── Programs.tsx    # Programs showcase
│   ├── Team.tsx        # Team members
│   ├── Events.tsx      # Events management
│   ├── Gallery.tsx     # Photo gallery
│   ├── Donation.tsx    # Donation system
│   ├── EnhancedAdminDashboard.tsx  # Admin dashboard
│   └── ...
├── utils/              # Utility functions
│   └── supabase/       # Supabase configuration
├── assets/             # Static assets
├── styles/             # CSS styles
└── App.tsx            # Main application component
```

## Coding Standards & Best Practices

### TypeScript & React
1. **Always use TypeScript** for type safety
2. **Use functional components** with hooks (useState, useEffect, etc.)
3. **Props should be typed** with interfaces or types
4. **Avoid inline styles** - use Tailwind CSS classes instead
5. **Component naming**: PascalCase for components, camelCase for functions
6. **Use const** for component declarations: `const MyComponent = () => {}`

### Tailwind CSS
1. **Use Tailwind utility classes** for styling
2. **Follow responsive design patterns**: mobile-first with `sm:`, `md:`, `lg:`, `xl:` breakpoints
3. **Use the `cn()` utility** from `lib/utils` for conditional class names
4. **Consistent spacing**: Use standard spacing scale (p-4, m-2, gap-6, etc.)

### Shadcn/ui Components
1. **Import from `@/components/ui/`** for UI components
2. **Don't modify base UI components** - compose them instead
3. **Use existing components** before creating new ones
4. **Available components**: Button, Card, Dialog, Form, Input, Select, Tabs, Toast, etc.

### State Management
1. **Use React hooks** for local state (useState, useEffect)
2. **Keep state close to where it's used**
3. **Lift state up** only when necessary
4. **Form state**: Use controlled components

### API Integration
1. **Use fetch API** for backend calls
2. **Supabase client**: Import from `@/utils/supabase/info`
3. **Error handling**: Always wrap API calls in try-catch
4. **Loading states**: Show feedback during async operations
5. **Toast notifications**: Use Sonner for user feedback

### Supabase Backend
1. **Authentication**: Use Supabase Auth for admin login
2. **Storage**: Use Supabase Storage for images
3. **KV Store**: Use for data persistence
4. **Edge Functions**: Backend logic runs in Deno environment

### File Naming
- **Components**: PascalCase (e.g., `Hero.tsx`, `AdminDashboard.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`, `supabaseClient.ts`)
- **Styles**: kebab-case (e.g., `index.css`)

## Development Workflow

### Running the Project
```bash
npm install          # Install dependencies
npm run dev         # Start development server (port 3000)
npm run build       # Build for production
```

### Adding New Features
1. **Create components** in appropriate directories
2. **Use existing UI components** from `components/ui/`
3. **Add routes** in `App.tsx` if needed
4. **Update backend** in Supabase Edge Functions
5. **Test thoroughly** before committing

### Admin Dashboard
- **Protected routes**: Requires authentication
- **Tabs available**: Overview, Programs, News, Contacts, Volunteers, Donations, Newsletter
- **CRUD operations**: All tabs support create, read, update, delete
- **Export functionality**: CSV export available for all data types

## Common Patterns

### Form Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await fetch('API_ENDPOINT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    // Show success toast
  } catch (error) {
    // Handle error
  }
};
```

### Conditional Rendering
```typescript
{isLoading ? (
  <div>Loading...</div>
) : (
  <div>Content</div>
)}
```

### Toast Notifications
```typescript
import { toast } from 'sonner';

toast.success('Operation successful!');
toast.error('Something went wrong');
```

## Important Considerations

### Security
- **Never commit sensitive data**: API keys, passwords, tokens
- **Use environment variables**: For configuration
- **Admin routes**: Always check authentication
- **Input validation**: Validate all user inputs

### Accessibility
- **Use semantic HTML**: header, main, nav, section, article
- **Alt text for images**: Always provide descriptive alt text
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **ARIA labels**: Use when necessary for screen readers

### Performance
- **Lazy loading**: Use for images and heavy components
- **Code splitting**: Vite handles this automatically
- **Optimize images**: Compress before uploading
- **Minimize re-renders**: Use React.memo and useMemo when appropriate

### Mobile Responsiveness
- **Test on multiple screen sizes**: Mobile, tablet, desktop
- **Touch-friendly**: Buttons and links should be easily tappable
- **Responsive images**: Use appropriate sizes for different screens
- **Mobile navigation**: Ensure menu works on mobile devices

## Documentation References

For detailed information, refer to:
- `src/TECHNICAL_ARCHITECTURE.md` - Complete technical architecture
- `src/FEATURES_AND_RECOMMENDATIONS.md` - Implemented and planned features
- `src/LOCAL_SETUP_GUIDE.md` - Local development setup
- `src/DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `src/ADMIN_GUIDE.md` - Admin dashboard usage guide

## Payment Integration

### Stripe
- **International donations**: Credit/debit cards
- **Currency support**: USD, EUR, UGX
- **Test mode**: Use Stripe test keys during development

### Mobile Money
- **MTN Mobile Money**: Uganda-specific
- **Airtel Money**: Uganda-specific
- **Bank Transfer**: Local bank details

## Key Dependencies

- **React Router**: Client-side routing (`react-router-dom`)
- **Radix UI**: Headless UI components
- **Lucide React**: Icon library
- **Recharts**: Data visualization
- **React Quill**: Rich text editor
- **Stripe**: Payment processing
- **Sonner**: Toast notifications
- **Embla Carousel**: Image carousels

## Best Practices Summary

1. ✅ Use TypeScript for all new code
2. ✅ Follow React best practices with functional components
3. ✅ Use Tailwind CSS for styling
4. ✅ Leverage Shadcn/ui components
5. ✅ Handle errors gracefully with try-catch
6. ✅ Provide user feedback with toast notifications
7. ✅ Write clean, readable, and maintainable code
8. ✅ Test features before committing
9. ✅ Keep components small and focused
10. ✅ Document complex logic with comments

## Need Help?

- Check existing components in `src/components/` for patterns
- Review documentation files in `src/` directory
- Follow the established patterns in the codebase
- Use TypeScript types for better IntelliSense support
