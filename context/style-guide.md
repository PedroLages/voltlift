# VoltLift Style Guide

> Implementation reference for VoltLift's aggressive, high-energy brand aesthetic

This style guide provides concrete code examples for implementing VoltLift's design principles. For philosophy and requirements, see [design-principles.md](design-principles.md).

---

## I. Color Palette

### Brand Colors (Tailwind Config)

```javascript
// tailwind.config.js
colors: {
  background: '#000000',      // Pure black
  surface: '#111111',         // Cards, modals
  surfaceHighlight: '#222222', // Hover states
  primary: '#ccff00',         // Neon yellow-green (energy!)
  primaryDark: '#aadd00',     // Darker primary variant
  text: '#ffffff',            // Pure white
  textMuted: '#9ca3af',       // Gray (WCAG AA: 4.74:1 on black)
}
```

### Usage Guidelines

**✅ DO:**
- Use `bg-background` (#000) for main app background
- Use `bg-surface` (#111) for cards, modals, sections
- Use `text-primary` (#ccff00) for CTAs, highlights, focus states
- Use `text-textMuted` (#9ca3af) for secondary text **only on black backgrounds**

**❌ DON'T:**
- Never use soft colors (blues, pastels)
- Never use text-textMuted on surfaces lighter than #000000
- Never use rounded corners > 4px

### Semantic Colors

```typescript
// Use sparingly - VoltLift emphasizes black/neon contrast
const semanticColors = {
  success: '#10b981',  // Green for PRs, achievements
  error: '#ef4444',    // Red for errors, delete actions
  warning: '#f59e0b',  // Amber for warnings
};
```

---

## II. Typography

### Font Stack

```css
/* Primary: Inter (aggressive weights) */
font-family: 'Inter', sans-serif;

/* Monospace: JetBrains Mono (for numbers/data) */
font-family: 'JetBrains Mono', monospace;
```

### Typography Scale

```tsx
// H1 - Page Titles
<h1 className="text-3xl font-black italic uppercase tracking-wider text-white">
  DESTROY YOUR LIMITS
</h1>

// H2 - Section Headers
<h2 className="text-2xl font-black italic uppercase tracking-wide text-primary">
  WORKOUT HISTORY
</h2>

// H3 - Subsection Headers
<h3 className="text-xl font-black italic uppercase tracking-wide text-white">
  CURRENT PROGRAM
</h3>

// Body Large
<p className="text-lg font-medium text-white">
  Your next session: Upper Power
</p>

// Body Medium (Default)
<p className="text-base text-white">
  Complete 4 sets of 8-12 reps at RPE 7-8
</p>

// Body Small / Caption
<p className="text-sm text-textMuted">
  Last performed: 3 days ago
</p>

// Monospace Numbers
<span className="font-mono text-2xl font-bold text-primary">
  225 lb
</span>
```

### Typography Rules

**✅ DO:**
- Use `font-black italic uppercase` for ALL H1-H3 headers
- Use `tracking-wider` or `tracking-wide` on headers
- Use `font-mono` for weights, reps, numbers
- Use line-height 1.5-1.7 for body text

**❌ DON'T:**
- Never use font-light or font-thin (too calm)
- Never use lowercase for headers
- Never use decorative fonts

---

## III. Border Radius

### Strict Limits

```tsx
// ✅ APPROVED: Sharp, angular aesthetic
rounded     // 4px - Default for buttons, inputs, cards
rounded-sm  // 2px - For ultra-sharp variants

// ❌ AVOID: Too soft/friendly
rounded-lg  // 8px - TOO LARGE
rounded-xl  // 12px - TOO LARGE
rounded-2xl // 16px - TOO LARGE
rounded-full // Circles - Only for avatars
```

### Examples

```tsx
// Button
<button className="bg-primary text-black font-black italic px-6 py-3 rounded uppercase">
  START WORKOUT
</button>

// Card
<div className="bg-surface border border-[#333] p-6 rounded">
  {children}
</div>

// Input
<input className="bg-[#111] border border-[#333] text-white px-4 py-3 rounded w-full" />
```

---

## IV. Spacing System

### Base Unit: 8px

```tsx
// Tailwind spacing classes (multiples of 4px/8px)
gap-2   // 8px
gap-3   // 12px
gap-4   // 16px
gap-6   // 24px
gap-8   // 32px

// Layout spacing
<div className="p-6">        // 24px padding (standard card)
<div className="py-3 px-4">  // 12px vertical, 16px horizontal (button)
<div className="space-y-4">  // 16px vertical gaps between children
```

### Spacing Guidelines

**✅ DO:**
- Use consistent spacing units (4px, 8px, 12px, 16px, 24px, 32px)
- Use `space-y-*` for consistent vertical rhythm
- Use `gap-*` for flex/grid layouts

**❌ DON'T:**
- Never use arbitrary values like `p-[13px]` (inconsistent)
- Never use padding < 12px on touch targets

---

## V. Component Examples

### Primary Button (CTA)

```tsx
<button
  className="bg-primary text-black font-black italic uppercase px-6 py-3 rounded
             tracking-wider transition-transform active:scale-95
             hover:bg-primaryDark disabled:opacity-50"
  style={{ touchAction: 'manipulation' }}
>
  START WORKOUT
</button>
```

### Secondary Button

```tsx
<button
  className="bg-surface border-2 border-primary text-primary font-black italic
             uppercase px-6 py-3 rounded tracking-wider transition-colors
             hover:bg-primary hover:text-black active:scale-95"
>
  VIEW PROGRAM
</button>
```

### Destructive Button

```tsx
<button
  className="bg-red-500 text-white font-bold uppercase px-4 py-2 rounded
             hover:bg-red-600 transition-colors"
>
  DELETE
</button>
```

### Text Input

```tsx
<div className="space-y-2">
  <label className="block text-sm font-bold uppercase text-textMuted">
    Exercise Name
  </label>
  <input
    type="text"
    className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded
               focus:outline-none focus:ring-2 focus:ring-primary
               focus:border-transparent placeholder:text-[#666]"
    placeholder="e.g., Barbell Bench Press"
  />
</div>
```

### Number Input with +/- Buttons

```tsx
<div className="flex items-center gap-2">
  <button
    className="w-10 h-10 bg-surface border border-[#333] text-white rounded
               hover:bg-surfaceHighlight active:scale-95"
  >
    −
  </button>
  <input
    type="number"
    className="w-20 bg-[#111] border border-[#333] text-center text-white
               font-mono text-lg py-2 rounded focus:ring-2 focus:ring-primary"
    value="225"
  />
  <button
    className="w-10 h-10 bg-surface border border-[#333] text-white rounded
               hover:bg-surfaceHighlight active:scale-95"
  >
    +
  </button>
  <span className="text-textMuted text-sm ml-2">lb</span>
</div>
```

### Card

```tsx
<div className="bg-surface border border-[#333] p-6 rounded space-y-4">
  <h3 className="text-xl font-black italic uppercase text-white">
    WORKOUT SUMMARY
  </h3>
  <div className="space-y-2">
    <p className="text-sm text-textMuted">Total Volume</p>
    <p className="text-2xl font-mono font-bold text-primary">12,450 lb</p>
  </div>
</div>
```

### Modal

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80
                animate-fade-in">
  <div className="bg-surface border-2 border-primary max-w-md w-full mx-4
                  animate-scale-in">
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black italic uppercase text-primary">
          CONFIRM ACTION
        </h3>
        <button className="text-[#666] hover:text-white">✕</button>
      </div>

      {/* Content */}
      <p className="text-white">
        Are you sure you want to delete this workout?
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-3 border border-[#333] text-[#888]
                           font-bold uppercase hover:bg-[#222]">
          Cancel
        </button>
        <button className="flex-1 py-3 bg-red-500 text-white font-bold
                           uppercase hover:bg-red-600">
          Delete
        </button>
      </div>
    </div>
  </div>
</div>
```

### Badge / Status Indicator

```tsx
// Success / PR
<span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20
                 border border-green-500 text-green-500 text-xs font-bold
                 uppercase rounded">
  <Star size={12} />
  PERSONAL RECORD
</span>

// Active
<span className="inline-flex items-center px-2 py-1 bg-primary/20
                 border border-primary text-primary text-xs font-bold
                 uppercase rounded">
  ACTIVE
</span>

// Neutral
<span className="inline-flex items-center px-2 py-1 bg-[#222]
                 border border-[#444] text-[#888] text-xs font-bold
                 uppercase rounded">
  REST DAY
</span>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 bg-surface border-2 border-[#333] rounded-full
                  flex items-center justify-center mb-4">
    <Dumbbell size={32} className="text-[#444]" />
  </div>
  <h3 className="text-xl font-black italic uppercase text-white mb-2">
    NO WORKOUTS YET
  </h3>
  <p className="text-textMuted mb-6">
    START YOUR FIRST SESSION AND CRUSH YOUR GOALS
  </p>
  <button className="bg-primary text-black font-black italic uppercase
                     px-6 py-3 rounded">
    START NOW
  </button>
</div>
```

### Loading Skeleton

```tsx
<div className="space-y-4 animate-pulse">
  <div className="h-8 bg-[#222] rounded w-48"></div>
  <div className="h-32 bg-[#111] rounded"></div>
  <div className="h-32 bg-[#111] rounded"></div>
</div>
```

---

## VI. Animation Specifications

### Transitions

```tsx
// Quick (page transitions, hovers)
transition-all duration-200

// Medium (modals, dropdowns)
transition-all duration-300

// Slow (celebrations)
transition-all duration-500
```

### Keyframe Animations (tailwind.config.js)

```javascript
animation: {
  'fade-in': 'fadeIn 0.2s ease-in',
  'slide-up': 'slideUp 0.3s ease-out',
  'bounce-in': 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'scale-in': 'scaleIn 0.2s ease-out',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  bounceIn: {
    '0%': { transform: 'scale(0.3)', opacity: '0' },
    '50%': { transform: 'scale(1.05)', opacity: '1' },
    '70%': { transform: 'scale(0.9)' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  scaleIn: {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
}
```

### Usage Examples

```tsx
// Button press feedback
<button className="transition-transform active:scale-95">

// Modal entrance
<div className="animate-fade-in">
  <div className="animate-scale-in">

// Success celebration
<div className="animate-bounce-in">
  🎉 PERSONAL RECORD!
</div>
```

---

## VII. Focus States (Accessibility)

### Standard Focus Ring

```tsx
// For all interactive elements
className="focus:outline-none focus:ring-2 focus:ring-primary
           focus:ring-offset-2 focus:ring-offset-black"
```

### Focus Examples

```tsx
// Button
<button className="bg-primary text-black px-6 py-3 rounded
                   focus:outline-none focus:ring-2 focus:ring-primary
                   focus:ring-offset-2 focus:ring-offset-black">

// Input
<input className="border border-[#333] rounded
                  focus:outline-none focus:ring-2 focus:ring-primary
                  focus:border-transparent">

// Link
<a className="text-primary underline
              focus:outline-none focus:ring-2 focus:ring-primary">
```

---

## VIII. Mobile-Specific Patterns

### Touch Target Minimum

```tsx
// All interactive elements MUST be ≥ 44x44px
<button className="min-w-[44px] min-h-[44px] ...">
```

### Safe Area Insets

```tsx
// Bottom navigation
<nav className="fixed bottom-0 left-0 right-0 px-6 py-4"
     style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

// Top header (if needed)
<header style={{ paddingTop: 'env(safe-area-inset-top)' }}>
```

### Swipe Gestures (iOS-style)

```tsx
// Left swipe to delete
<SwipeableRow
  onDelete={() => handleDelete(id)}
  onDuplicate={() => handleDuplicate(id)}
  threshold={80}
>
  {content}
</SwipeableRow>
```

---

## IX. Language & Tone

### Motivational Language

**✅ DO:**
- "DESTROY YOUR LIMITS"
- "CRUSH THIS WORKOUT"
- "DOMINATE YOUR GOALS"
- "TRACK YOUR POWER"
- "BEAST MODE ACTIVATED"

**❌ DON'T:**
- "Nice job!" (too calm)
- "Keep going" (too casual)
- "You got this" (too friendly)
- "Great work" (generic)

### Empty State Examples

```tsx
// Workout history
"NO WORKOUTS YET. START YOUR FIRST SESSION."

// Personal records
"ZERO PRs LOGGED. TIME TO SET BENCHMARKS."

// Progress photos
"NO PHOTOS YET. TRACK YOUR TRANSFORMATION."

// Active program
"NO ACTIVE PROGRAM. CHOOSE YOUR PROTOCOL."
```

### Button Labels

```tsx
// ✅ Aggressive
"START WORKOUT" | "DESTROY SESSION" | "LOG GAINS" | "TRACK POWER"

// ❌ Calm
"Begin" | "Continue" | "Next" | "Okay"
```

---

## X. Icon Usage

### Icon Library: Lucide React

```tsx
import {
  Dumbbell,      // Workouts, exercises
  Calendar,      // History, logs
  TrendingUp,    // Progress, PRs
  Zap,           // Energy, quick actions
  Target,        // Goals, targets
  Award,         // Achievements, PRs
  Play,          // Start workout
  Timer,         // Rest timer
} from 'lucide-react';
```

### Icon Sizing

```tsx
// Small (inline with text)
<Icon size={16} />

// Medium (buttons, cards)
<Icon size={20} />

// Large (empty states, headers)
<Icon size={32} />

// Extra Large (splash screens)
<Icon size={48} />
```

### Icon Colors

```tsx
// Primary action
<Play size={28} className="text-black" fill="currentColor" />

// Secondary
<Calendar size={22} className="text-[#444]" />

// Active state
<Dumbbell size={22} className="text-primary" />

// Success/PR
<Award size={20} className="text-green-500" />
```

---

## XI. Responsive Breakpoints

### Tailwind Breakpoints

```javascript
// Mobile-first (default)
className="text-base"

// Tablet (768px+)
className="md:text-lg"

// Desktop (1024px+)
className="lg:text-xl"

// Large Desktop (1280px+)
className="xl:text-2xl"
```

### Layout Adaptation

```tsx
// Mobile: Full width cards
<div className="w-full">

// Tablet: 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Desktop: 3-column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## XII. Quick Reference

### Most Common Patterns

```tsx
// H1 Page Title
<h1 className="text-3xl font-black italic uppercase tracking-wider text-white">

// Primary Button
<button className="bg-primary text-black font-black italic uppercase px-6 py-3 rounded">

// Card
<div className="bg-surface border border-[#333] p-6 rounded">

// Input
<input className="bg-[#111] border border-[#333] text-white px-4 py-3 rounded w-full focus:ring-2 focus:ring-primary">

// Badge
<span className="px-3 py-1 bg-primary/20 border border-primary text-primary text-xs font-bold uppercase rounded">

// Empty State CTA
<button className="bg-primary text-black font-black italic uppercase px-6 py-3 rounded">
  START NOW
</button>
```

---

## XIII. Before You Ship

### Visual Checklist

Before committing any UI changes, verify:

- [ ] All headers use `font-black italic uppercase`
- [ ] Border radius ≤ 4px (`rounded` or `rounded-sm`)
- [ ] Colors match approved palette (no soft blues, pastels)
- [ ] Language is motivational ("CRUSH" not "nice job")
- [ ] Touch targets ≥ 44px on mobile
- [ ] Focus states visible (2px solid `ring-primary`)
- [ ] Animations ≤ 200ms for interactions
- [ ] WCAG AA contrast met (use WebAIM checker)
- [ ] Works on 375px width (iPhone SE)
- [ ] Safe area insets respected on notched devices

---

## XIV. Resources

### Color Tools
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
  - Verify textMuted (#9ca3af) only on #000000

### Testing
- **Mobile Simulator:** Chrome DevTools → Toggle device toolbar
- **Responsive Test:** Resize to 375px, 768px, 1440px
- **Focus Test:** Tab through entire app with keyboard

### Reference
- **Design Philosophy:** [design-principles.md](design-principles.md)
- **Tailwind Config:** [tailwind.config.js](../tailwind.config.js)
- **Component Library:** Lucide React icons

---

## Conclusion

VoltLift's visual identity is **sharp, aggressive, and high-energy**. Every component should reflect the intensity of an athlete crushing a PR. When in doubt, choose **bolder**, **darker**, and **sharper**.

**Remember:** We're not building a meditation app. We're building for athletes who want to DESTROY their limits. The UI should match that intensity.
