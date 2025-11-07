# 🏠 Local Setup Guide - Resti Kiryandongo CBO Website

## Step 1: Download/Export from Figma Make

Since this project is built in Figma Make, you'll need to export the code:

### Option A: Manual Export (Copy Files)
1. Copy each file from the Figma Make interface
2. Create the folder structure on your local machine (see below)
3. Paste the contents into corresponding files

### Option B: Export Feature (if available)
- Look for an "Export" or "Download" button in Figma Make
- Download the entire project as a ZIP file

---

## Step 2: Set Up Local Project Structure

Create a new folder on your computer (e.g., `resti-kiryandongo-website`) and set up this structure:

```
resti-kiryandongo-website/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.html
│   ├── components/
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── Donation.tsx
│   │   ├── EnhancedAdminDashboard.tsx
│   │   ├── Events.tsx
│   │   ├── FAQ.tsx
│   │   ├── Footer.tsx
│   │   ├── Gallery.tsx
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── ImpactDashboard.tsx
│   │   ├── ImpactStories.tsx
│   │   ├── News.tsx
│   │   ├── Newsletter.tsx
│   │   ├── Partners.tsx
│   │   ├── Programs.tsx
│   │   ├── Resources.tsx
│   │   ├── Team.tsx
│   │   ├── VolunteerOpportunities.tsx
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   └── ui/
│   │       └── (all UI components)
│   ├── styles/
│   │   └── globals.css
│   ├── utils/
│   │   └── supabase/
│   │       └── info.tsx
│   └── lib/
│       └── utils.ts
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx
│           └── kv_store.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Step 3: Create Configuration Files

### 1. Create `package.json`

```json
{
  "name": "resti-kiryandongo-website",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.0",
    "react-quill": "^2.0.0",
    "react-slick": "^0.30.0",
    "slick-carousel": "^1.8.1",
    "react-responsive-masonry": "^2.1.7",
    "react-hook-form": "^7.55.0",
    "sonner": "^2.0.3",
    "motion": "^10.16.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-aspect-ratio": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5"
  }
}
```

### 2. Create `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Create `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 5. Create `index.html` (in root directory)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resti Kiryandongo CBO</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 6. Create `src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 7. Create `.env.local` (for environment variables)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Step 4: Update Import Paths

Since Figma Make uses different import paths, you'll need to update these in your local files:

### Update `src/utils/supabase/info.tsx`:

```tsx
export const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '';
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
```

### Update all component imports:
- Change `'./components/...'` to use relative paths or aliases
- Change `'./utils/supabase/info'` to match your structure
- Remove any `figma:asset/...` imports and replace with regular URLs or local images

### Example: Update in components
```tsx
// Before (Figma Make)
import { projectId, publicAnonKey } from '../utils/supabase/info';

// After (Local)
import { projectId, publicAnonKey } from '@/utils/supabase/info';
// OR
import { projectId, publicAnonKey } from '../utils/supabase/info';
```

---

## Step 5: Install Dependencies

Open terminal/command prompt in your project folder and run:

```bash
# Using npm
npm install

# OR using yarn
yarn install

# OR using pnpm
pnpm install
```

---

## Step 6: Set Up Supabase

### Option A: Use Existing Supabase Project
1. Go to your Supabase dashboard
2. Copy your project URL and anon key
3. Paste them in `.env.local`

### Option B: Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Create the `kv_store_2a4be611` table:

```sql
CREATE TABLE kv_store_2a4be611 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

4. Set up Supabase Edge Functions (see Supabase Setup section below)

---

## Step 7: Deploy Supabase Edge Functions (Backend)

### Install Supabase CLI:

```bash
npm install -g supabase
```

### Login to Supabase:

```bash
supabase login
```

### Link your project:

```bash
supabase link --project-ref your-project-ref
```

### Deploy Edge Functions:

```bash
supabase functions deploy server
```

### Set Environment Variables in Supabase:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

---

## Step 8: Run the Development Server

```bash
npm run dev
```

Your website should now be running at `http://localhost:5173`

---

## Step 9: Build for Production

When ready to deploy:

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

---

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Option 2: Netlify
1. Push to GitHub
2. Connect to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Option 3: Traditional Hosting
1. Upload `dist` folder contents to your web server
2. Configure server to handle React routing (redirect all to index.html)

---

## Troubleshooting

### Issue: Import errors
**Solution**: Check that all import paths match your local structure

### Issue: Tailwind styles not working
**Solution**: Make sure `globals.css` is imported in `main.tsx`

### Issue: Supabase connection fails
**Solution**: Verify `.env.local` has correct credentials

### Issue: Edge functions not working
**Solution**: Deploy functions using Supabase CLI

### Issue: Images not loading (figma:asset)
**Solution**: Replace with URLs from Unsplash or upload images to Supabase Storage

---

## Additional Notes

### Handling Figma Assets
The project may have `figma:asset/...` imports. These need to be:
1. Downloaded/exported from Figma Make
2. Placed in `public/assets/` folder
3. Updated in imports: `import logo from '/assets/logo.png'`

### React Quill Styles
Make sure to import React Quill styles in your main file or component:
```tsx
import 'react-quill/dist/quill.snow.css';
```

### Slick Carousel Styles
```tsx
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
```

---

## Support

If you encounter issues:
1. Check the console for specific error messages
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Check Supabase connection and table structure

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy edge functions
supabase functions deploy server

# View Supabase logs
supabase functions logs server
```

---

**Ready to go!** 🚀 Your Resti Kiryandongo CBO website should now be running locally.
