# 🚢 IronPath Shipping Guide

Quick reference for deploying code to production.

## Workflow Commands

### 1. **Commit & Push** (Git only)
```bash
npm run commit "feat: Add Phase 2 AI personalization"
```

**What it does:**
- ✅ `git add .` - Stage all changes
- ✅ `git commit -m "message"` - Commit with formatted message
- ✅ `git push` - Push to current branch
- ✅ `npm run build` - Build check (fails if TypeScript errors)

### 2. **Full Deploy** (Git + Firebase)
```bash
npm run deploy "feat: Launch Phase 2 AI features"
```

**What it does:**
- ✅ Everything from `commit` above
- ✅ `npm run build` - Production build
- ✅ `firebase deploy --only hosting` - Deploy to Firebase Hosting

### 3. **Deploy Only** (Skip git, just build + deploy)
```bash
npm run ship
```

**What it does:**
- ✅ `npm run build` - Production build
- ✅ `firebase deploy --only hosting` - Deploy to Firebase

---

## Typical Workflows

### During Development
```bash
npm run dev          # Local development server
```

### When Feature Complete
```bash
npm run commit "feat: Add personalized AI suggestions"
# Creates PR or pushes to main
```

### Production Deploy
```bash
npm run deploy "release: Phase 2 AI personalization"
# Commits, pushes, builds, and deploys to Firebase
```

---

## Commit Message Format

We follow conventional commits:

```
<type>: <description>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks
- `release:` - Production release

**Examples:**
```bash
npm run commit "feat: Add 1RM estimation to AI suggestions"
npm run commit "fix: Session persistence on refresh"
npm run commit "docs: Update Phase 3 implementation plan"
npm run commit "release: v1.1.0 - Phase 2 AI personalization"
```

---

## Pre-Deploy Checklist

Before running `npm run deploy`:

- [ ] All tests passing (when we add tests)
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] Features tested locally
- [ ] Breaking changes documented
- [ ] Environment variables updated (if needed)

---

## Firebase Hosting Info

**Live URL:** https://voltlift-<project-id>.web.app
**Dashboard:** https://console.firebase.google.com

---

## Troubleshooting

### Build fails
```bash
npm run build
# Fix TypeScript errors shown
```

### Deploy fails
```bash
firebase login
firebase projects:list
firebase use <project-id>
```

### Git push rejected
```bash
git pull --rebase
# Resolve conflicts
npm run deploy "your message"
```

---

## Phase 3 Deployment Strategy

When Phase 3 is ready (6+ months):

1. **Feature Flags:** Use Firebase Remote Config
2. **Staged Rollout:** 10% → 50% → 100%
3. **Analytics:** Monitor forecasting accuracy
4. **Rollback Plan:** Keep Phase 2 fallbacks

---

**Need help?** Check CLAUDE.md or ask Claude Code!
