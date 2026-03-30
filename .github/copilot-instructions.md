# Copilot Instructions for Resti Kiryandongo CBO Website

## Project Overview

This is a modern full-stack web application for Resti Kiryandongo Community Based Organization (CBO), featuring a public-facing website and an admin dashboard. The project is built with React, TypeScript, and Vite on the frontend, with a Deno-based serverless backend running on Supabase Edge Functions.

### Key Features
- Public website with information about programs, events, news, and impact stories
- Admin dashboard for content management with role-based access control
- Image upload functionality
- Rich text editor for news articles
- Email notifications via Resend API
- Payment processing via Stripe
- Data export capabilities (CSV)
- Analytics dashboard with charts

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4.0
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Routing**: React Router DOM
- **State Management**: React Hooks (useState, useEffect)
- **Charts**: Recharts
- **Rich Text Editor**: React Quill
- **Forms**: React Hook Form
- **Payments**: Stripe React SDK
- **Notifications**: Sonner (toast library)

### Backend
- **Runtime**: Deno
- **Framework**: Hono (lightweight web framework)
- **Database**: Supabase KV Store (key-value storage)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Email**: Resend API
- **Payments**: Stripe API

### Third-Party Services
- Supabase (auth, storage, database)
- Stripe (payment processing)
- Resend (email delivery)

## Project Structure

```
/
├── src/
│   ├── App.tsx              # Main application with routing
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Hero.tsx         # Landing hero section
│   │   ├── EnhancedAdminDashboard.tsx  # Admin interface
│   │   └── ...              # Other components
│   ├── assets/              # Static assets (images, fonts)
│   ├── styles/              # Additional style files
│   ├── utils/               # Utility functions
│   │   └── supabase/        # Supabase configuration
│   ├── supabase/            # Backend code
│   └── guidelines/          # Project guidelines
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies and scripts
└── index.html               # HTML entry point
```

## Development Setup

### Prerequisites
- Node.js (v20+)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The dev server runs on `http://localhost:3000` and opens automatically.

### Build
```bash
npm run build
```
Output directory: `build/`

### Important Notes
- The project uses a custom `.npmrc` file for package resolution
- Path aliases are configured in `vite.config.ts` (e.g., `@/` maps to `./src/`)
- Backend code is located in `src/supabase/functions/`

## Code Style and Conventions

### TypeScript
- Always use TypeScript for new files (.tsx for components, .ts for utilities)
- Define proper types/interfaces for component props and data structures
- Avoid using `any` type; use proper typing or `unknown` when needed
- Use type inference where obvious, explicit types where clarity is needed

### React Components
- Use functional components with hooks (no class components)
- Use `PascalCase` for component names
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use React Router DOM for navigation
- File structure: One component per file, named same as the component

### Styling
- Use Tailwind CSS utility classes for styling
- Follow Tailwind's responsive design patterns (mobile-first)
- Use Shadcn/ui components for consistent UI patterns
- Component class names should be descriptive
- Use `className` prop, not `class`

### State Management
- Use `useState` for local component state
- Use `useEffect` for side effects (data fetching, subscriptions)
- Pass data through props or context when needed
- Avoid prop drilling; use composition patterns

### File Organization
- Place reusable UI components in `src/components/ui/`
- Place feature-specific components in `src/components/`
- Place utility functions in `src/utils/`
- Group related files together
- Keep files reasonably sized (prefer splitting large components)

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case or PascalCase for components
- **Variables/Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINT`)
- **Types/Interfaces**: PascalCase (e.g., `UserData`, `ApiResponse`)

## Testing and Quality

### Current State
- No automated testing framework is currently configured
- Manual testing is performed via the UI
- Test both public website and admin dashboard when making changes

### When Making Changes
- Test in the development server (`npm run dev`)
- Verify responsive design on different screen sizes
- Test admin dashboard features with different user roles
- Verify email functionality when modifying contact/donation flows
- Test image uploads when modifying upload functionality

## API Integration

### Backend Endpoints
The backend is a Deno-based API deployed as Supabase Edge Functions. Main endpoint base: `/make-server-2a4be611/`

### Authentication
- Uses Supabase Auth (JWT tokens)
- Store session in browser storage
- Check authentication status before protected operations
- Use `Authorization: Bearer <token>` header for authenticated requests

### Data Structure
The application uses a KV store with key prefixes:
- `contact:` - Contact form submissions
- `program:` - Programs/projects
- `news:` - News articles
- `volunteer:` - Volunteer applications
- `donation:` - Donation records
- `newsletter:` - Newsletter subscribers

## Important Considerations

### Security
- Never commit API keys or secrets to the repository
- Use environment variables for sensitive data
- Validate user input on both frontend and backend
- Implement proper authorization checks for admin operations
- Follow role-based access control patterns

### Performance
- Optimize images before upload (5MB limit)
- Use lazy loading for routes and components where appropriate
- Minimize unnecessary re-renders with proper React hooks usage
- Use efficient data fetching patterns

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Maintain sufficient color contrast

### Browser Compatibility
- Target modern browsers (Chrome, Firefox, Safari, Edge)
- Use standard web APIs and polyfill if needed
- Test in multiple browsers when making significant changes

## Common Tasks

### Adding a New Page Component
1. Create component in `src/components/`
2. Import and add route in `App.tsx`
3. Add navigation link in `Header.tsx` if needed
4. Style with Tailwind CSS

### Adding a New UI Component
1. Use Shadcn/ui CLI if it's a standard component
2. Place custom UI components in `src/components/ui/`
3. Follow existing component patterns
4. Export from component file

### Working with Forms
- Use controlled components (value + onChange)
- Validate input before submission
- Show user feedback (loading states, errors, success messages)
- Use Sonner for toast notifications

### Working with Images
- Use the upload endpoint for new images
- Validate file type and size on frontend
- Store image URLs in data models
- Delete old images when replacing

## Documentation References

Key documentation files in `src/`:
- `QUICK_START.md` - Quick setup guide
- `TECHNICAL_ARCHITECTURE.md` - Detailed architecture documentation
- `ADMIN_GUIDE.md` - Admin dashboard user guide
- `EMAIL_SETUP_GUIDE.md` - Email configuration details
- `DEPLOYMENT_CHECKLIST.md` - Deployment procedures
- `LOCAL_SETUP_GUIDE.md` - Local development setup

## Best Practices

1. **Keep changes minimal and focused** - Make small, targeted changes
2. **Test thoroughly** - Verify changes in development before committing
3. **Follow existing patterns** - Match the style and structure of existing code
4. **Document complex logic** - Add comments for non-obvious implementations
5. **Use TypeScript properly** - Leverage type safety to prevent errors
6. **Maintain consistency** - Follow the established conventions in the codebase
7. **Consider mobile users** - Ensure responsive design works well
8. **Optimize for performance** - Avoid unnecessary re-renders and heavy computations
9. **Handle errors gracefully** - Provide user-friendly error messages
10. **Keep accessibility in mind** - Ensure the app is usable by everyone

## Getting Help

- Review existing code for patterns and examples
- Check documentation files in `src/` directory
- Consult the technical architecture document for system design
- Refer to official documentation for libraries used
- Test changes incrementally to catch issues early
