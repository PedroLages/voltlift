# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoltLift is a fitness/workout tracking mobile-first web application built with React 19, TypeScript, and Vite. It features AI-powered workout suggestions via Google's Gemini API and was originally created with Google AI Studio.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
```

## Deployment & CI/CD

### Automatic Vercel Deployment

VoltLift uses **Vercel** for automatic deployment. Every push to `main` triggers a production deploy.

**Live App:** https://voltlift.vercel.app

**How it works:**
1. Create a PR from feature branch
2. Vercel creates preview URL automatically (e.g., `voltlift-xxx.vercel.app`)
3. Claude Code Review analyzes the PR
4. Merge PR to `main`
5. Vercel deploys to production (~30 seconds)
6. iOS app loads new version instantly

### PR-Based Workflow with Auto-Merge

Branch protection is enabled on `main`:

- ✅ All changes must go through PRs
- ✅ **Security Review** runs automatically (~2-3 min)
- ✅ **Claude Code Review** runs automatically (~5-10 min)
- ✅ **Auto-merge** enabled - PRs merge automatically when both workflows pass
- ✅ Preview URLs let you test before merging

```bash
# Create feature branch
git checkout -b feat/my-feature

# Make changes, commit, push
git add . && git commit -m "feat: Add feature"
git push -u origin feat/my-feature

# Create PR with auto-merge enabled
gh pr create --title "feat: My feature" --body "Description"
gh pr merge <PR-NUMBER> --squash --auto

# Workflows run automatically:
# → Security Review (2-3 min)
# → Claude Code Review (5-10 min)
# → Auto-merges when both pass ✅
```

### iOS App Configuration

**Capacitor Config:** `capacitor.config.ts`

The iOS app is configured to load from Vercel for **instant updates without App Store review**:

```typescript
server: {
  url: 'https://voltlift.vercel.app', // Live updates enabled
  cleartext: false
}
```

**Benefits:**
- ✅ PR preview URLs for testing before merge
- ✅ Auto-deploy on merge → iOS updates instantly
- ✅ No App Store submission for feature updates
- ✅ Claude Code Review on every PR

**When you need App Store submission:**
- Native iOS code changes
- Capacitor plugin updates
- Bundle ID or permissions changes
- App icon or name changes

### Monitoring

- **Vercel Dashboard:** https://vercel.com/pedrolages-projects/voltlift
- **GitHub Actions:** https://github.com/PedroLages/voltlift/actions
- **Live App:** https://voltlift.vercel.app

## Environment Setup

Create `.env.local` with:

```bash
# Backend (Firebase or PocketBase)
VITE_BACKEND_TYPE=firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Features (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key

# To switch to PocketBase (self-hosted):
# VITE_BACKEND_TYPE=pocketbase
# VITE_POCKETBASE_URL=http://your-server:8090
```

See [`.env.example`](.env.example) for full template and [`docs/backend-migration-guide.md`](docs/backend-migration-guide.md) for migration instructions.

## Architecture

### State Management
- **Zustand store** (`store/useStore.ts`): Single global store with persistence via `zustand/middleware/persist`
- State is persisted to localStorage under key `voltlift-storage`
- **Cloud sync** via backend abstraction layer (`services/backend/`)
  - Supports Firebase (cloud) and PocketBase (self-hosted)
  - Switchable via `VITE_BACKEND_TYPE` environment variable
  - Exercise images stored in Firebase Storage or PocketBase file storage

### Routing
- Uses `react-router-dom` with `HashRouter` for client-side routing
- Protected routes require `settings.onboardingCompleted` to be true
- Route structure: `/welcome` → `/onboarding` → authenticated app routes

### Data Types
All core types are in `types.ts`:
- `Exercise`: Library exercises with form guides, muscle groups, difficulty
- `WorkoutSession`: Active workouts, completed history, and templates (distinguished by `status` field)
- `ExerciseLog`/`SetLog`: Individual exercise and set tracking with RPE support
- `Program`: Multi-week workout programs composed of template sessions
- `UserSettings`: User preferences, personal records, active program state

### Key Patterns
- Templates are `WorkoutSession` objects with `status: 'template'`
- Starting a workout from a template copies it with `sourceTemplateId` tracking
- Personal records are automatically calculated and stored when workouts finish
- Program progression advances `activeProgram.currentSessionIndex` after matching template completion

### AI Integration
`services/geminiService.ts` provides:
- `getProgressiveOverloadTip()`: Workout suggestions based on history
- `getWorkoutMotivation()`: Short motivational quotes
- `generateExerciseVisual()`: AI-generated exercise diagrams (stored in IndexedDB)

Falls back gracefully when `GEMINI_API_KEY` is not set.

### Styling
- Tailwind CSS v3 (PostCSS plugin, not CDN)
- Configuration in `tailwind.config.js`
- Custom colors, fonts, and animations defined in config
- Primary color: `#ccff00` (neon yellow-green)
- Dark theme with black background (`#000`)
- Mobile-first with safe area insets for notched devices

## Documentation

### Project Docs (in `/docs`)
- `competitive-analysis.md`: Research on top workout apps (Strong, Hevy, Boostcamp, Setgraph)
- `feature-requirements.md`: Detailed feature specifications and requirements
- `user-flows.md`: User journeys, personas, and interaction patterns

### Development Roadmap
- `TODOS.md`: Prioritized feature backlog (P0-P4) with status tracking
  - **P0:** Critical/MVP blockers
  - **P1:** Core features
  - **P2:** Important enhancements
  - **P3:** Quality of life
  - **P4:** Future/ideas

## Design Principles

VoltLift follows mobile-first fitness app design principles documented in [`/docs/design-principles.md`](docs/design-principles.md). This comprehensive guide defines our S-tier standards for speed, accessibility, brand, and user experience.

### Core Principles (Summary)

1. **⚡ Speed First:** < 100ms for set logging, < 200ms page transitions
2. **👍 Thumb-Zone Optimization:** Primary actions within bottom 60% of screen
3. **📱 Mobile-First, Always:** Design for 375px (iPhone SE) first
4. **🔁 Offline-First:** Full functionality without internet
5. **🎯 Progressive Overload Built-In:** UI guides users to increase weight/reps
6. **💪 Aggressive Energy:** High contrast, bold typography, intense language
7. **♿ WCAG AA Compliance:** 4.5:1 contrast ratios, keyboard navigation
8. **⚡ Performance:** Lighthouse > 90, Core Web Vitals passing

### Design Review Process

**Before merging any UI changes**, run a comprehensive design review:

```bash
/design-review
```

This automated review will:

- ✅ Test live app across mobile (375px), tablet (768px), desktop (1440px)
- ✅ Verify WCAG AA accessibility compliance
- ✅ Check keyboard navigation and focus states
- ✅ Validate brand consistency (colors, typography, animations)
- ✅ Measure performance (page load, interactions)
- ✅ Test offline functionality
- ✅ Screenshot visual issues with evidence
- ✅ Generate structured markdown report with triage priorities

### Design Standards Checklist

All UI changes must meet these requirements:

#### Accessibility

- [ ] WCAG AA contrast ratios met (4.5:1 for text)
- [ ] Keyboard navigable with visible focus states
- [ ] Touch targets ≥ 44x44px
- [ ] Semantic HTML with proper ARIA labels
- [ ] Screen reader compatible

#### Performance

- [ ] < 200ms page transitions
- [ ] < 100ms for critical path (set logging)
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images lazy loaded
- [ ] Works offline completely

#### Brand

- [ ] Uses approved color palette (#000 bg, #ccff00 primary, #9ca3af muted)
- [ ] Bold typography (900 weight, italic, uppercase for headers)
- [ ] Aggressive, energizing aesthetic (not calming)
- [ ] Micro-interactions < 200ms

#### Mobile-First

- [ ] Works perfectly on 375px width (iPhone SE)
- [ ] One-handed operation easy
- [ ] Safe area insets for notched devices
- [ ] Primary actions in thumb-zone (bottom 60%)

### Quick Reference

- **Design Principles:** [`docs/design-principles.md`](docs/design-principles.md) (human documentation)
- **Context Files:** [`/context/design-principles.md`](context/design-principles.md) + [`/context/style-guide.md`](context/style-guide.md) (for workflows)
- **Slash Command:** `/design-review` (run before merging UI changes)
- **Color Palette:** See `tailwind.config.js`
- **Accessibility:** Focus states defined in `index.html`

## Automated Workflows

VoltLift uses automated workflows from the [claude-code-workflows](https://github.com/OneRedOak/claude-code-workflows) repository to maintain quality standards.

### Design Context Files

**Location:** `/context/` directory (separate from `/docs/` for human documentation)

- **`/context/design-principles.md`** - Comprehensive design checklist (copy of `/docs/design-principles.md`)
- **`/context/style-guide.md`** - Brand implementation guide with code examples (colors, typography, components)

**Why two locations?**
- `/docs/` - Human-readable documentation and philosophy
- `/context/` - Machine-readable reference for automated workflows and LLM agents

**When making UI changes**, workflows automatically reference `/context/` files to:
- Verify brand consistency (colors, typography, border-radius)
- Check WCAG AA accessibility compliance
- Validate component patterns match style guide
- Ensure aggressive aesthetic is maintained

### Available Workflows

All workflows are in `.claude/workflows/`:

#### 1. **Code Review** (`.claude/workflows/code-review/`)
- **Slash Command:** `/code-reviewer`
- **GitHub Action:** `.github/workflows/claude-code-review.yml`
- **Purpose:** Automated code quality reviews on PRs
- **Checks:** Syntax, style adherence, bug detection, maintainability

#### 2. **Design Review** (`.claude/workflows/design-review/`)
- **Slash Command:** `/design-review`
- **Purpose:** Comprehensive front-end UI/UX validation
- **Uses:** Playwright MCP for browser automation
- **Checks:** Accessibility, responsive design, brand compliance, performance
- **References:** `/context/design-principles.md` and `/context/style-guide.md`

#### 3. **Security Review** (`.claude/workflows/security-review/`)
- **GitHub Action:** `.github/workflows/security.yml`
- **Purpose:** Identify vulnerabilities, exposed secrets, attack vectors
- **Output:** Severity classification and remediation guidance

### Using Workflows

**Quick Visual Check (after any UI change):**
```bash
# 1. Identify what changed
# 2. Navigate to affected pages
# 3. Verify against /context/design-principles.md
# 4. Capture screenshots
# 5. Check console errors
```

**Comprehensive Review (before PR merge):**
```bash
/design-review  # Full accessibility + brand + performance audit
```

**Automated PR Reviews:**
GitHub Actions automatically run code and security reviews on all pull requests.

## Key Competitive Insights

### What Makes Great Workout Apps
- **Fast logging:** Single swipe/tap to log sets
- **Smart pre-fill:** Show previous workout data
- **Automatic rest timers:** With lock screen notifications
- **PR detection:** Auto-detect and celebrate personal records
- **Progressive overload:** Built-in progression logic
- **Offline capability:** Essential for gym use

### Benchmarks to Beat
- **Strong:** 5M+ users, simplest interface
- **Hevy:** Best free features, great social
- **Boostcamp:** 500K+ users, best programs
- **Setgraph:** Fastest logging experience

## Current Status

### Working Features
- Landing page with branding
- Basic routing and navigation
- Exercise library (constants.ts)
- Zustand state management
- Tailwind CSS styling

### Known Issues (P0)
- Workout session state management needs fixing
- Set logging not properly persisting
- Rest timer not implemented
- IndexedDB integration incomplete

### Next Steps
See TODOS.md P0 section for immediate priorities
