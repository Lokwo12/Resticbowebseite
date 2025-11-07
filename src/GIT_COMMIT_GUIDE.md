# Git Commit Guide - Site Settings Implementation

## Quick Commit (Copy & Paste)

Run these commands in your terminal:

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Complete Site Settings system with editable frontend content

- Fixed logo handling in Header and Footer components
- Added smart logo resolution (Figma asset vs custom URL)
- Implemented comprehensive Site Settings backend routes (GET, PUT, POST)
- Created SiteSettingsTab component with 5 organized sections
- Updated all frontend components to fetch from backend (Hero, About, Contact, Header, Footer)
- Added Site Settings tab to admin dashboard
- Documented complete system in SITE_SETTINGS_COMPLETE.md
- Every frontend detail now editable from admin dashboard"

# Push to GitHub
git push origin main
```

## Detailed Step-by-Step

### 1. Check Status
See what files have changed:
```bash
git status
```

### 2. Review Changes (Optional)
Review specific file changes:
```bash
git diff components/Header.tsx
git diff components/Footer.tsx
git diff components/SiteSettingsTab.tsx
git diff components/EnhancedAdminDashboard.tsx
git diff supabase/functions/server/index.tsx
```

### 3. Stage Changes
Stage all modified and new files:
```bash
git add .
```

Or stage specific files:
```bash
git add components/Header.tsx
git add components/Footer.tsx
git add components/SiteSettingsTab.tsx
git add components/EnhancedAdminDashboard.tsx
git add supabase/functions/server/index.tsx
git add SITE_SETTINGS_COMPLETE.md
```

### 4. Commit Changes
```bash
git commit -m "feat: Complete Site Settings system with editable frontend content"
```

### 5. Push to GitHub
```bash
# If main branch
git push origin main

# If master branch
git push origin master

# If different branch
git push origin your-branch-name
```

## Files Changed in This Update

### New Files Created:
- ✨ `/components/SiteSettingsTab.tsx` - Site settings management interface
- 📄 `/SITE_SETTINGS_COMPLETE.md` - Complete documentation

### Files Modified:
- 🔧 `/components/Header.tsx` - Added logo resolution logic
- 🔧 `/components/Footer.tsx` - Added logo resolution logic
- 🔧 `/components/Hero.tsx` - Fetches from backend
- 🔧 `/components/About.tsx` - Fetches from backend
- 🔧 `/components/Contact.tsx` - Fetches from backend
- 🔧 `/components/EnhancedAdminDashboard.tsx` - Added Settings tab and import
- 🔧 `/supabase/functions/server/index.tsx` - Added site-settings routes

## Commit Message Templates

### Short Version
```bash
git commit -m "feat: Add comprehensive Site Settings system"
```

### Medium Version
```bash
git commit -m "feat: Complete Site Settings with backend integration

- Fixed logo handling across all components
- Added Site Settings management tab to admin dashboard
- All frontend content now editable from admin panel"
```

### Long Version (Recommended)
```bash
git commit -m "feat: Complete Site Settings system with editable frontend content

Features Added:
- Comprehensive Site Settings backend API (GET, PUT, POST)
- SiteSettingsTab component with 5 organized sections:
  * General (site name, tagline, logo, colors)
  * Hero Section (titles, buttons, stats)
  * About Section (mission, vision, story)
  * Contact Info (address, email, phone, social links)
  * Footer (description, copyright)

Improvements:
- Smart logo resolution (Figma asset vs custom URL)
- All frontend components now fetch from backend
- Real-time settings updates without code changes
- Default settings initialization
- Proper error handling and loading states

Bug Fixes:
- Fixed logo display issue in Header and Footer
- Resolved figma:asset import conflicts

Documentation:
- Added SITE_SETTINGS_COMPLETE.md with full guide
- Included troubleshooting section
- Added best practices and technical notes"
```

## Verify Push

After pushing, verify on GitHub:
```bash
# Open repository in browser
# For macOS
open https://github.com/YOUR_USERNAME/YOUR_REPO

# For Linux
xdg-open https://github.com/YOUR_USERNAME/YOUR_REPO

# For Windows
start https://github.com/YOUR_USERNAME/YOUR_REPO
```

## Common Issues & Solutions

### Issue: "fatal: not a git repository"
**Solution:** Initialize git first:
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Issue: "Updates were rejected"
**Solution:** Pull latest changes first:
```bash
git pull origin main --rebase
git push origin main
```

### Issue: "Please tell me who you are"
**Solution:** Configure git:
```bash
git config user.email "you@example.com"
git config user.name "Your Name"
```

### Issue: Authentication failed
**Solution:** Use personal access token:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Use token as password when prompted

Or set up SSH:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copy output and add to GitHub Settings → SSH Keys
```

## Best Practices

1. **Commit Often**: Break large changes into smaller, logical commits
2. **Write Clear Messages**: Use conventional commit format (feat:, fix:, docs:, etc.)
3. **Review Before Committing**: Use `git diff` to review changes
4. **Test Before Pushing**: Ensure everything works locally
5. **Pull Before Push**: Always sync with remote before pushing

## Conventional Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

## Branch Strategy (If Using)

```bash
# Create feature branch
git checkout -b feature/site-settings

# Make changes and commit
git add .
git commit -m "feat: Add Site Settings"

# Push feature branch
git push origin feature/site-settings

# Create pull request on GitHub
# After approval, merge to main
```

## Quick Reference

```bash
# Check status
git status

# View changes
git diff

# Stage all
git add .

# Commit
git commit -m "message"

# Push
git push origin main

# Pull latest
git pull origin main

# View log
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- filename
```

## Next Steps After Committing

1. ✅ Verify commit appears on GitHub
2. ✅ Check if GitHub Actions/CI passes (if configured)
3. ✅ Update project README if needed
4. ✅ Tag release if appropriate: `git tag v1.0.0 && git push --tags`
5. ✅ Deploy to production
6. ✅ Test site settings in production environment

---

**Happy committing!** 🚀

Need help? Check the [GitHub Docs](https://docs.github.com/en/get-started/using-git/about-git)
