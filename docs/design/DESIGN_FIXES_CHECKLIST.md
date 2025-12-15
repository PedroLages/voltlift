# Design Fixes Checklist

Based on the comprehensive design review, here are the specific fixes needed with file locations and line numbers.

---

## 🔴 Critical Fixes (Must Do Before Production)

### 1. ✅ Text Contrast - ALREADY WCAG AA COMPLIANT

**Status:** ✅ **GOOD NEWS!** Your Tailwind config shows:
```javascript
textMuted: '#9ca3af', // Updated for WCAG AA compliance (4.74:1 contrast ratio on black)
```

**Verification:** #9ca3af on #000000 = 4.74:1 contrast ratio (PASSES WCAG AA 4.5:1 requirement)

**Issue:** However, found **175 instances** of text-muted usage that should be audited for:
- Usage on non-black backgrounds (e.g., `bg-[#111]`, `bg-[#0a0a0a]`)
- Small font sizes (< 14px) which need higher contrast

**Action:**
```bash
# Audit each usage to ensure it's on pure black background
grep -r "text-muted" --include="*.tsx" -A 2 -B 2 | less
```

---

### 2. ❌ Border Radius Too Large (Reduce from 8-12px to 2-4px)

**Files to Fix:**

**App.tsx:104**
```tsx
// BEFORE
className="w-16 h-16 rounded-lg"
// AFTER
className="w-16 h-16 rounded"  // 4px default, or rounded-sm for 2px
```

**Login.tsx (Multiple instances)**
```tsx
// BEFORE: Lines 44, 49, 54, 59, 64, 69, 74
rounded-lg  // 8px

// AFTER
rounded     // 4px (acceptable)
// OR
rounded-sm  // 2px (more aggressive)
```

**Components to Update:**
- ✏️ `components/BodyHeatmap.tsx:9` - Change `rounded-xl` (12px) → `rounded` (4px)
- ✏️ `components/SwipeableRow.tsx:186,229` - Change `rounded-lg` → `rounded`
- ✏️ `components/SyncStatusIndicator.tsx` - Change `rounded-lg` → `rounded`
- ✏️ `pages/WorkoutLogger.tsx` - Change `rounded-lg` → `rounded`

**Quick Fix Command:**
```bash
# Find all rounded-lg, rounded-xl, rounded-2xl
find . -name "*.tsx" -type f -exec sed -i '' 's/rounded-xl/rounded/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/rounded-lg/rounded/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/rounded-2xl/rounded/g' {} +
```

**Manual Review Needed:** Some components like modals might need `rounded-sm` for sharper edges.

---

### 3. ❌ Typography Not Consistently Aggressive

**Current Issue:** Headers don't consistently use `font-black italic uppercase`

**Files to Audit:**
```bash
# Find all H1-H6 elements that might be missing aggressive styling
grep -r "<h[1-6]" --include="*.tsx" pages/ components/ | grep -v "font-black"
```

**Standard Pattern to Apply:**
```tsx
// H1 - Main page titles
<h1 className="text-3xl font-black italic uppercase tracking-wider text-white">

// H2 - Section headers
<h2 className="text-2xl font-black italic uppercase tracking-wide text-primary">

// H3 - Subsection headers
<h3 className="text-xl font-black italic uppercase tracking-wide text-white">
```

**Known Locations to Fix:**
- Dashboard greeting: "HELLO ATHLETE" - verify has full styling
- Profile sections: "ATHLETE ID", "Body Metrics" - ensure consistent
- Lift page: "TRAINING COMMAND" - check all subsections

---

### 4. ⚠️ Page Transitions Too Slow (Replace "POWERING UP" with Skeleton Screens)

**Problem:** React.lazy() causes 2+ second delays showing full "POWERING UP" loader

**Solution:** Implement skeleton screens in PageLoader component

**File:** `App.tsx:38-46`

**BEFORE:**
```tsx
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-primary font-black text-sm uppercase tracking-widest italic animate-pulse">POWERING UP</p>
    </div>
  </div>
);
```

**AFTER (Option 1 - Simple Skeleton):**
```tsx
const PageLoader = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  // Show route-specific skeleton
  if (isDashboard) return <DashboardSkeleton />;
  if (isProfile) return <ProfileSkeleton />;

  // Fallback: Minimal inline loader
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[#222] rounded w-48"></div>
        <div className="h-32 bg-[#111] rounded"></div>
        <div className="h-32 bg-[#111] rounded"></div>
      </div>
    </div>
  );
};
```

**AFTER (Option 2 - Reduce Timeout):**
```tsx
// In store/useAuthStore.ts:269
// BEFORE
}, 3000);

// AFTER
}, 2000);  // Reduce from 3s to 2s
```

---

### 5. ⚠️ Desktop Banner Distracting on Mobile

**File:** Check Dashboard component for desktop banner

**Solution:**
```tsx
// Add responsive hide to banner
<div className="hidden md:block ...">  // Hide on mobile, show on tablet+
  DESKTOP DASHBOARD AVAILABLE
</div>
```

**Alternative:** Make banner dismissible with localStorage persistence:
```tsx
const [showBanner, setShowBanner] = useState(
  () => localStorage.getItem('hideDashboardBanner') !== 'true'
);

{showBanner && (
  <div className="relative">
    <button
      onClick={() => {
        setShowBanner(false);
        localStorage.setItem('hideDashboardBanner', 'true');
      }}
      className="absolute top-2 right-2 text-white"
    >
      ✕
    </button>
    DESKTOP DASHBOARD AVAILABLE...
  </div>
)}
```

---

## 🟡 High-Priority Improvements

### 6. Notification Settings UX

**File:** `pages/Profile.tsx` (notification section)

**Options:**
- **Option A:** Hide entirely in browser mode
- **Option B:** Replace disabled UI with prominent CTA

```tsx
{/* BEFORE: Showing disabled toggles */}
<button [disabled] />

{/* AFTER: Show installation CTA */}
{!isNativeApp && (
  <div className="bg-[#111] border-2 border-primary p-6 rounded text-center">
    <h3 className="text-xl font-black italic uppercase text-primary mb-2">
      UNLOCK NOTIFICATIONS
    </h3>
    <p className="text-textMuted mb-4">
      Install the native iOS/Android app for workout reminders, PR celebrations, and more
    </p>
    <button className="bg-primary text-black px-6 py-3 rounded font-black uppercase">
      Install Native App
    </button>
  </div>
)}
```

---

### 7. Empty State Language Too Calm

**Files to Update:** Look for calm language in empty states

**Examples to Replace:**

```tsx
// BEFORE: Dashboard.tsx
"No bodyweight data yet. Start logging to see trends"

// AFTER
"TRACK YOUR GAINS. START NOW."

---

// BEFORE: Profile strength score
"Log major lifts to track strength score (Bench, Squat, Deadlift, OHP)"

// AFTER
"DESTROY BENCHMARKS. LOG YOUR POWER."

---

// BEFORE: Dashboard active program
"No Active Program"

// AFTER
"CHOOSE YOUR PROTOCOL. DOMINATE YOUR GOALS."
```

---

## 📋 Quick Win Commands

### Run All Fixes at Once:

```bash
# 1. Fix border radius (backup first!)
git checkout -b design-fixes

# Create backup
cp -r pages pages.backup
cp -r components components.backup

# Fix border radius
find pages components -name "*.tsx" -type f -exec sed -i '' 's/rounded-xl/rounded/g' {} +
find pages components -name "*.tsx" -type f -exec sed -i '' 's/rounded-lg/rounded/g' {} +
find pages components -name "*.tsx" -type f -exec sed -i '' 's/rounded-2xl/rounded/g' {} +

# 2. Reduce auth timeout
# Manually edit store/useAuthStore.ts:269 change 3000 → 2000

# 3. Test changes
npm run dev

# 4. Verify no visual regressions
# Check Dashboard, Lift, Profile pages

# 5. Commit if good
git add -A
git commit -m "fix: Reduce border-radius for aggressive aesthetic

- Change rounded-xl (12px) → rounded (4px)
- Change rounded-lg (8px) → rounded (4px)
- Maintains VoltLift sharp, angular brand identity
- Aligns with design principles in /docs/design-principles.md"
```

---

## ✅ Verification Checklist

After making fixes, verify:

- [ ] **Contrast:** Run WebAIM checker on any new text colors
- [ ] **Border Radius:** Max 4px on all cards/buttons
- [ ] **Typography:** All H1-H3 have `font-black italic uppercase`
- [ ] **Page Speed:** Transitions feel < 200ms
- [ ] **Mobile:** Desktop banner hidden on < 768px
- [ ] **Touch Targets:** All buttons ≥ 44x44px
- [ ] **Keyboard Nav:** Tab through full app
- [ ] **Loading States:** No "POWERING UP" longer than 2 seconds

---

## 🎯 Expected Results

After fixes:
- ✅ Sharper, more aggressive visual identity
- ✅ Faster perceived performance (< 2s page loads)
- ✅ Cleaner mobile experience (no desktop banner)
- ✅ More motivational language throughout
- ✅ Consistent typography hierarchy
- ✅ Better notification UX clarity

**Estimated Time:** 2-3 hours for all critical + high-priority fixes

---

## 📸 Before/After Testing

Take screenshots after fixes:
```bash
# Restart Playwright tests
# Compare new screenshots to /.playwright-mcp/ originals
```

Ready to start? Tackle them in order (1 → 7) for maximum impact! 💪
