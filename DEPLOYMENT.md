# IronPath Deployment Guide

This guide covers deploying IronPath to production hosting platforms.

---

## Prerequisites

- Node.js 20+ installed
- Git repository set up
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

---

## Quick Deploy Options

### Option 1: Vercel (Recommended) ⚡

**Why Vercel:**
- Zero-config deployment for Vite apps
- Automatic HTTPS and CDN
- Preview deployments for PRs
- Excellent PWA support

**Steps:**

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   vercel
   ```

   Or **Deploy via GitHub**:
   - Push code to GitHub
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel auto-detects Vite configuration

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_api_key_here`

4. **Deploy**:
   - Vercel deploys automatically on git push
   - Access your app at `https://your-project.vercel.app`

**Configuration:** Already included in `vercel.json`

---

### Option 2: Netlify

**Why Netlify:**
- Simple deployment with drag-and-drop
- Great free tier
- Instant rollbacks
- Built-in form handling

**Steps:**

1. **Deploy via CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

2. **Or Deploy via GitHub**:
   - Push code to GitHub
   - Visit [app.netlify.com](https://app.netlify.com)
   - New site from Git → Select repository
   - Build settings are auto-detected from `netlify.toml`

3. **Set Environment Variables**:
   - Site Settings → Environment Variables
   - Add: `GEMINI_API_KEY`

4. **Deploy**:
   - Deploys automatically on git push
   - Access at `https://your-site.netlify.app`

**Configuration:** Already included in `netlify.toml`

---

### Option 3: GitHub Pages (Free, Static Only)

**Limitations:**
- No environment variables (AI features won't work)
- No serverless functions
- Still works for core offline PWA features!

**Steps:**

1. **Update `vite.config.ts`**:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',  // Add this line
     // ... rest of config
   });
   ```

2. **Install gh-pages**:
   ```bash
   npm install -D gh-pages
   ```

3. **Add deploy script to `package.json`**:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Repo Settings → Pages
   - Source: gh-pages branch
   - Access at `https://username.github.io/repo-name/`

---

## Environment Variables

### Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | [Google AI Studio](https://makersuite.google.com/app/apikey) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ANALYTICS_ID` | Google Analytics tracking ID | None |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | None |
| `VITE_ENABLE_IRONCLOUD` | Enable cloud sync features | `false` |

**Setting Environment Variables:**

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`

3. **Never commit `.env.local`** - it's already in `.gitignore`

---

## Build Optimization

The app is already optimized for production:

- **Code splitting**: Routes lazy-loaded
- **Bundle size**: ~95KB gzipped (excellent!)
- **PWA caching**: Offline support enabled
- **Image optimization**: SVG icons, no heavy images
- **Tree shaking**: Unused code removed

**Verify optimization:**
```bash
npm run build
```

Check `dist/` folder for bundle analysis.

---

## PWA Installation

Once deployed, users can install IronPath as a native app:

**Desktop (Chrome/Edge):**
- Install icon in address bar
- Or Settings → Install IronPath

**Mobile (iOS/Safari):**
- Share button → Add to Home Screen

**Mobile (Android/Chrome):**
- Menu → Install App
- Or browser install banner

**Features:**
- Runs in standalone mode (no browser UI)
- Custom app icon
- Offline support
- App shortcuts (Start Workout, View History)

---

## Post-Deployment Checklist

### Immediately After Deploy:

- [ ] Verify app loads at production URL
- [ ] Test PWA install on desktop
- [ ] Test PWA install on mobile (iOS & Android)
- [ ] Verify service worker registers (DevTools → Application)
- [ ] Test offline functionality (DevTools → Network → Offline)
- [ ] Complete onboarding flow
- [ ] Start and finish a workout
- [ ] Check workout history saves
- [ ] Verify analytics page loads
- [ ] Test AI suggestions (requires Gemini API key)

### Within First Week:

- [ ] Monitor error logs (if Sentry configured)
- [ ] Check analytics for user behavior
- [ ] Test on real devices (not just emulators)
- [ ] Verify HTTPS is working
- [ ] Check mobile performance (Lighthouse audit)
- [ ] Test on Safari, Chrome, Firefox
- [ ] Verify all PWA features work (shortcuts, standalone mode)

### SEO & Discoverability:

- [ ] Submit to Google Search Console
- [ ] Add social media meta tags (Open Graph, Twitter Card)
- [ ] Create landing page with screenshots
- [ ] Submit to PWA directories
- [ ] Share on Product Hunt / Reddit

---

## Custom Domain (Optional)

### Vercel:
1. Project Settings → Domains
2. Add your domain
3. Configure DNS records as shown

### Netlify:
1. Site Settings → Domain Management
2. Add custom domain
3. Configure DNS or use Netlify DNS

---

## Performance Monitoring

### Lighthouse Audit:
```bash
npm run build
npm run preview
# Open http://localhost:4173
# DevTools → Lighthouse → Run audit
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+ (we have WCAG AA compliance!)
- Best Practices: 95+
- SEO: 90+
- PWA: 100 ✓

### Real User Monitoring (Optional):

Add Web Vitals tracking:
```bash
npm install web-vitals
```

See [web.dev/vitals](https://web.dev/vitals/) for implementation.

---

## Rollback Strategy

### Vercel:
- Deployments → Previous deployment → Promote to Production

### Netlify:
- Deploys → Select previous deploy → Publish

### GitHub Pages:
```bash
git revert HEAD
git push
npm run deploy
```

---

## Troubleshooting

### Service Worker Not Registering:

**Check:**
- HTTPS is enabled (required for service workers)
- `/sw.js` is accessible at root
- No console errors in DevTools

**Fix:**
- Clear browser cache
- Unregister old service workers (DevTools → Application → Service Workers → Unregister)
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### PWA Install Prompt Not Showing:

**Check:**
- `manifest.json` is valid (DevTools → Application → Manifest)
- All required manifest fields present
- App served over HTTPS
- Service worker registered successfully

**Fix:**
- Validate manifest at [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- Check browser console for manifest errors

### Environment Variables Not Working:

**Check:**
- Variables prefixed with `VITE_` (except build-time vars)
- `.env.local` exists and has correct format
- Rebuild after changing env vars

**Fix:**
```bash
# For local dev
npm run dev

# For production
# Set in hosting platform's UI (Vercel/Netlify dashboard)
```

### Build Fails:

**Check:**
- Node version 20+ (`node --version`)
- All dependencies installed (`npm install`)
- No TypeScript errors (`npm run build`)

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Support & Resources

- **Deployment Issues**: Check platform status pages
  - [Vercel Status](https://vercel-status.com)
  - [Netlify Status](https://netlifystatus.com)

- **PWA Best Practices**: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)

- **Vite Deployment**: [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy.html)

---

## Next Steps After Deployment

1. **Share Your App**: Post on social media, fitness communities
2. **Gather Feedback**: Set up feedback form or email
3. **Monitor Usage**: Track which features users love
4. **Iterate**: Plan next features based on user data
5. **Update Regularly**: Keep dependencies up to date

---

**Ready to Deploy?** 🚀

Run:
```bash
vercel
```

Or push to GitHub and deploy via Vercel/Netlify dashboard!

---

**Last Updated**: 2025-12-02
