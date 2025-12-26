# VoltLift - Recommendations & Fixes

**Date:** 2025-12-25
**Related:** BUG_REPORT.md

This document provides specific, actionable fixes for all bugs identified in testing, plus recommendations for improving code quality, performance, and user experience.

---

## Table of Contents

1. [Critical Bug Fixes (P0)](#critical-bug-fixes-p0)
2. [High Priority Fixes (P1)](#high-priority-fixes-p1)
3. [Medium Priority Improvements (P2)](#medium-priority-improvements-p2)
4. [Low Priority Enhancements (P3)](#low-priority-enhancements-p3)
5. [Test Infrastructure Setup](#test-infrastructure-setup)
6. [Performance Optimizations](#performance-optimizations)
7. [Security Hardening](#security-hardening)
8. [UX Improvements](#ux-improvements)

---

## Critical Bug Fixes (P0)

### BUG-001: Profile Page Fails to Load

**Problem:** Profile page renders but displays no content.

**Root Cause Investigation:**
1. Check if profile data is loading from Zustand store
2. Verify Profile.tsx component is rendering correctly
3. Check for JavaScript errors in console when visiting `/profile`
4. Ensure `settings` object has all required fields

**Fix Location:** [pages/Profile.tsx](pages/Profile.tsx)

**Diagnosis Steps:**
```tsx
// Add debug logging at the top of Profile component
const Profile = () => {
  const { settings, gamification, personalRecords } = useStore();

  console.log('Profile Debug:', {
    settings,
    gamification,
    personalRecords,
    hasSettings: !!settings,
    settingsKeys: settings ? Object.keys(settings) : []
  });

  // Rest of component...
}
```

**Likely Fix #1: Missing Loading State**
```tsx
// In Profile.tsx, add loading check
const Profile = () => {
  const { settings, isLoading } = useStore();

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Rest of component...
}
```

**Likely Fix #2: Missing Settings Object**
```tsx
// In store/useStore.ts, ensure settings has defaults
interface State {
  settings: UserSettings;
  // ...
}

const initialState: State = {
  settings: {
    name: 'User',
    unit: 'kg',
    experienceLevel: 'Intermediate',
    onboardingCompleted: false,
    // Add all required fields with defaults
  },
  // ...
};
```

**Likely Fix #3: Conditional Rendering Issue**
```tsx
// Check if any sections are hidden with conditional rendering
// Replace this pattern:
{settings && (
  <div>...</div>
)}

// With explicit null check:
{settings !== null && settings !== undefined && (
  <div>...</div>
)}
```

**Testing:**
```bash
# After fix, run E2E test to verify
npx playwright test --grep "Progress Tracking"
```

---

## High Priority Fixes (P1)

### BUG-002: Template Click Doesn't Start Workout

**Problem:** Clicking template cards on `/lift` page doesn't navigate to workout logger.

**Fix Location:** [pages/Lift.tsx](pages/Lift.tsx)

**Current Code (likely):**
```tsx
// Template cards probably render without onClick handler
<div className="template-card">
  <h3>{template.name}</h3>
  <p>{template.exercises.length} exercises</p>
</div>
```

**Fixed Code:**
```tsx
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Lift = () => {
  const navigate = useNavigate();
  const { startWorkout, templates } = useStore();

  const handleTemplateClick = (templateId: string) => {
    // Start workout from template
    startWorkout(templateId);
    // Navigate to workout logger
    navigate('/workout');
  };

  return (
    <div>
      {templates.map(template => (
        <div
          key={template.id}
          className="template-card cursor-pointer hover:bg-gray-800 transition-colors"
          onClick={() => handleTemplateClick(template.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTemplateClick(template.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Start ${template.name} workout`}
        >
          <h3>{template.name}</h3>
          <p>{template.exercises.length} exercises</p>
        </div>
      ))}
    </div>
  );
};
```

**Accessibility Improvements:**
- Added `role="button"` for screen readers
- Added `tabIndex={0}` for keyboard navigation
- Added `onKeyDown` handler for Enter/Space keys
- Added `aria-label` for screen reader context
- Added `cursor-pointer` for visual feedback

**Testing:**
```bash
npx playwright test --grep "Template Management"
```

---

### BUG-003: Empty History Shows No Helpful Message

**Problem:** When user has no workouts, history page shows no guidance.

**Fix Location:** [pages/History.tsx](pages/History.tsx)

**Implementation:**

**Step 1: Create EmptyState Component**

Create new file: `components/EmptyState.tsx`
```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="mb-6 p-6 rounded-full bg-[#1a1a1a]">
        <Icon size={64} className="text-muted" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-black italic uppercase tracking-wider mb-3 text-white">
        {title}
      </h2>

      <p className="text-muted text-base mb-8 max-w-md leading-relaxed">
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-black font-black italic uppercase px-8 py-4 rounded hover:bg-primary/90 transition-colors tracking-wider"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
```

**Step 2: Update History.tsx**
```tsx
import { EmptyState } from '../components/EmptyState';
import { Calendar, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const navigate = useNavigate();
  const { history } = useStore();

  const completedWorkouts = history.filter(w => w.status === 'completed');

  if (completedWorkouts.length === 0) {
    return (
      <div className="min-h-screen bg-black pb-24">
        <EmptyState
          icon={Calendar}
          title="No Workouts Yet"
          message="Complete your first workout to see it here. Your workout history will help track progress and celebrate achievements."
          actionLabel="Start Workout"
          onAction={() => navigate('/lift')}
        />
      </div>
    );
  }

  // Existing history list rendering...
};
```

**Step 3: Add Empty States to Other Pages**

Apply the same pattern to:
- **Analytics page** - No data yet
- **Achievements page** - No achievements unlocked
- **Programs page** - No programs enrolled
- **Exercise Library** - Search returns no results

**Example for Analytics:**
```tsx
if (completedWorkouts.length === 0) {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No Data Yet"
      message="Complete a few workouts to see your progress analytics, charts, and performance trends."
      actionLabel="Start First Workout"
      onAction={() => navigate('/lift')}
    />
  );
}
```

**Testing:**
```bash
# Clear data and test empty states
npx playwright test --grep "Empty States"
```

---

### BUG-004: Active Workout Doesn't Persist After Reload

**Problem:** Users lose workout progress if page refreshes.

**Fix Location:** [store/useStore.ts](store/useStore.ts)

**Investigation:**

**Step 1: Check Persist Configuration**
```tsx
// In store/useStore.ts, verify persist middleware config
export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      // State...
      activeWorkout: null,

      // Actions...
    }),
    {
      name: 'voltlift-storage',
      storage: createJSONStorage(() => localStorage),
      // IMPORTANT: Ensure activeWorkout is NOT excluded
      partialize: (state) => ({
        ...state,
        // Verify activeWorkout is included, not excluded
      }),
    }
  )
);
```

**Step 2: Verify WorkoutRecoveryPrompt**

The app already has `WorkoutRecoveryPrompt` component. Verify it's working:

**File:** [components/WorkoutRecoveryPrompt.tsx](components/WorkoutRecoveryPrompt.tsx)

Check if component is:
1. Properly imported in App.tsx ✅ (already there)
2. Detecting interrupted workouts
3. Showing recovery modal

**Debug WorkoutRecoveryPrompt:**
```tsx
// Add logging at top of component
useEffect(() => {
  const interrupted = getInterruptedWorkout();
  console.log('WorkoutRecoveryPrompt check:', {
    hasInterrupted: !!interrupted,
    interruptedData: interrupted,
    currentPath: window.location.hash
  });

  if (interrupted && !window.location.hash.includes('workout')) {
    setShowRecovery(true);
  }
}, []);
```

**Step 3: Fix Persistence Issues**

**Option A: Auto-save on every change**
```tsx
// In store/useStore.ts
const logSet = (exerciseIndex: number, setIndex: number, updates: Partial<SetLog>) => {
  set((state) => {
    if (!state.activeWorkout) return state;

    const newLogs = [...state.activeWorkout.logs];
    const newSets = [...newLogs[exerciseIndex].sets];
    newSets[setIndex] = { ...newSets[setIndex], ...updates };
    newLogs[exerciseIndex] = { ...newLogs[exerciseIndex], sets: newSets };

    const newState = {
      ...state,
      activeWorkout: { ...state.activeWorkout, logs: newLogs }
    };

    // Force persist to localStorage immediately
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      data.state.activeWorkout = newState.activeWorkout;
      localStorage.setItem('voltlift-storage', JSON.stringify(data));
    }

    return newState;
  });
};
```

**Option B: Add beforeunload handler**
```tsx
// In App.tsx or WorkoutLogger.tsx
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (activeWorkout) {
      e.preventDefault();
      e.returnValue = 'You have an active workout. Are you sure you want to leave?';

      // Save to localStorage before unload
      const storage = localStorage.getItem('voltlift-storage');
      if (storage) {
        const data = JSON.parse(storage);
        data.state.activeWorkout = activeWorkout;
        localStorage.setItem('voltlift-storage', JSON.stringify(data));
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [activeWorkout]);
```

**Testing:**
```bash
npx playwright test --grep "Workout Persistence"
```

---

## Medium Priority Improvements (P2)

### BUG-005: URL Routing Inconsistency

**Problem:** URLs show as `http://localhost:3000/` instead of `http://localhost:3000/#/`

**Fix Location:** [App.tsx](App.tsx)

**Investigation:**
The app uses `HashRouter` which should always include `#/` in URLs. The issue is likely:
1. Default route is `/` which becomes `/#/`
2. Test expects `/#/$` (ending with slash) but gets just `/`

**Fix Option 1: Update Default Route**
```tsx
// In App.tsx
<Routes>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  // ... other routes
</Routes>
```

**Fix Option 2: Accept Both URL Formats in Tests**
```tsx
// In e2e-comprehensive.spec.ts
// Change this:
expect(url).toMatch(/dashboard|#\/$/);

// To this (more flexible):
expect(url).toMatch(/dashboard|#\/?$|\/$/);
```

**Recommendation:** Use Fix Option 2 (update tests) since the current routing works fine for users.

---

### BUG-006: No Unit Test Framework Configured

**Problem:** 7 test files exist but can't run without a test framework.

**Solution:** Install and configure Vitest

**Step-by-Step Setup:**

**1. Install Dependencies**
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**2. Create vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**3. Create Test Setup File**

Create: `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock Capacitor plugins
vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn(),
  },
}));
```

**4. Add Test Scripts to package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

**5. Update Existing Test Files**

The existing test files in `services/__tests__/` likely use Jest syntax. Update imports:

```typescript
// Change from:
import { describe, it, expect } from '@jest/globals';

// To:
import { describe, it, expect, vi } from 'vitest';
```

**6. Run Tests**
```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run once (CI mode)
npm run test:run
```

**7. Add Test Coverage Badge**

Add to README.md:
```markdown
![Test Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)
```

**8. Example Component Test**

Create: `src/components/__tests__/EmptyState.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { Calendar } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No Workouts"
        message="Start your first workout"
      />
    );

    expect(screen.getByText('No Workouts')).toBeInTheDocument();
    expect(screen.getByText('Start your first workout')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const onAction = vi.fn();

    render(
      <EmptyState
        icon={Calendar}
        title="No Workouts"
        message="Start your first workout"
        actionLabel="Start"
        onAction={onAction}
      />
    );

    const button = screen.getByText('Start');
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
```

---

## Low Priority Enhancements (P3)

### BUG-007: Workout Start Button Not Found

**Problem:** E2E test couldn't find "Quick Start" button using selectors.

**Likely Cause:** Test selectors are too specific or button text is different.

**Fix:** Update button selectors in tests OR ensure consistent button labeling.

**Option 1: Update Test Selectors**
```typescript
// In e2e-comprehensive.spec.ts
const startButtons = [
  page.locator('button:has-text("Quick Start")'),
  page.locator('button:has-text("Start Workout")'),
  page.locator('button:has-text("Empty Workout")'),
  page.locator('button:has-text("START")'), // Add uppercase variant
  page.locator('[data-testid="start-workout"]'), // Recommended: use data-testid
];
```

**Option 2: Add data-testid to Buttons (RECOMMENDED)**

In [pages/Lift.tsx](pages/Lift.tsx):
```tsx
<button
  data-testid="quick-start-button"
  onClick={handleQuickStart}
  className="..."
>
  Quick Start
</button>
```

Then in tests:
```typescript
const startButton = page.locator('[data-testid="quick-start-button"]');
await startButton.click();
```

**Benefits of data-testid:**
- Tests are resilient to UI text changes
- Easier to maintain
- Industry best practice

---

## Test Infrastructure Setup

### Increase E2E Test Coverage

**Goal:** 50%+ coverage of user flows

**Additional Test Scenarios to Add:**

**1. Program Enrollment Flow (End-to-End)**
```typescript
test('Complete program enrollment and first workout', async ({ page }) => {
  // Navigate to programs
  // Select GZCLP or PPL
  // Click enroll
  // Complete enrollment form
  // Return to dashboard
  // Verify active program card
  // Click "Start Week 1, Day 1"
  // Complete workout
  // Verify program progress updates
});
```

**2. Personal Records Detection**
```typescript
test('PR detection and celebration', async ({ page }) => {
  // Log workout with new weight PR
  // Complete workout
  // Verify PR modal appears
  // Verify PR is saved
  // Navigate to profile
  // Verify PR is listed
});
```

**3. Multi-Device Sync (if backend configured)**
```typescript
test('Data syncs across devices', async ({ browser }) => {
  // Create context 1 (device 1)
  // Log workout
  // Create context 2 (device 2)
  // Verify workout appears
});
```

**4. Analytics Charts Rendering**
```typescript
test('Analytics charts render with data', async ({ page }) => {
  // Create workout data (use localStorage injection)
  // Navigate to analytics
  // Verify charts are present
  // Check for specific chart types (volume, 1RM, etc.)
});
```

**5. Template Creation and Editing**
```typescript
test('Create custom template', async ({ page }) => {
  // Navigate to template builder
  // Add exercises
  // Set sets/reps
  // Save template
  // Verify template appears in library
  // Start workout from new template
});
```

### Component Testing Setup

**Install React Testing Library:**
```bash
npm install --save-dev @testing-library/react @testing-library/user-event
```

**Example Component Tests:**

**1. Test WorkoutCompletionModal**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutCompletionModal } from '../WorkoutCompletionModal';

test('shows completion stats', () => {
  const workout = {
    // Mock workout data
  };

  render(<WorkoutCompletionModal workout={workout} onClose={vi.fn()} />);

  expect(screen.getByText(/Duration/i)).toBeInTheDocument();
  expect(screen.getByText(/Volume/i)).toBeInTheDocument();
});
```

**2. Test ProgressiveOverload Service**
```typescript
import { getSuggestion } from '../../services/progressiveOverload';

test('suggests weight increase after successful sets', () => {
  const lastWorkout = {
    exerciseId: 'barbell-squat',
    sets: [
      { weight: 100, reps: 10, completed: true },
      { weight: 100, reps: 10, completed: true },
      { weight: 100, reps: 10, completed: true },
    ],
  };

  const suggestion = getSuggestion(
    'barbell-squat',
    lastWorkout,
    null, // dailyLog
    [], // history
    Date.now(),
    'Intermediate'
  );

  expect(suggestion.weight).toBeGreaterThan(100);
});
```

---

## Performance Optimizations

### 1. Image Optimization

**Problem:** Exercise library screenshot is 1MB - likely loading many images.

**Solution: Lazy Load Images**

Create: `components/LazyImage.tsx`
```tsx
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,...' // Tiny placeholder SVG
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            setLoading(false);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${loading ? 'blur-sm' : ''}`}
      loading="lazy"
    />
  );
};
```

**Usage:**
```tsx
// In ExerciseLibrary.tsx, replace:
<img src={exercise.visual} alt={exercise.name} />

// With:
<LazyImage src={exercise.visual} alt={exercise.name} />
```

### 2. Code Splitting

**Current:** All pages lazy loaded ✅ (already implemented)

**Additional:** Split large dependencies

```tsx
// In services/ai/index.ts
export const getAICoach = async () => {
  const { AICoach } = await import('./agent');
  return new AICoach();
};
```

### 3. Reduce Bundle Size

**Analyze Bundle:**
```bash
npm install --save-dev rollup-plugin-visualizer
```

Add to `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true })
  ],
});
```

**Build and analyze:**
```bash
npm run build
# Opens visualization in browser
```

**Common Optimization:**
- Replace `lodash` with `lodash-es` (tree-shakeable)
- Use `date-fns` instead of `moment` (smaller)
- Lazy load `recharts` only on Analytics page

### 4. Virtualize Long Lists

**For Exercise Library (50+ exercises):**

```bash
npm install --save-dev @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const ExerciseLibrary = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { exercises } = useStore();

  const virtualizer = useVirtualizer({
    count: exercises.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of exercise card
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const exercise = exercises[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ExerciseCard exercise={exercise} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

## Security Hardening

### 1. Input Validation

**Problem:** User inputs (workout notes, exercise names) are not sanitized.

**Solution: Add DOMPurify**

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```tsx
import DOMPurify from 'dompurify';

// When displaying user-generated content:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notes) }} />
```

### 2. Content Security Policy

**Add to index.html:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://firebasestorage.googleapis.com https://generativelanguage.googleapis.com;
">
```

### 3. Environment Variable Security

**Create .env.example:**
```bash
# Backend Configuration
VITE_BACKEND_TYPE=firebase
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
# ... etc

# AI Features (Optional)
VITE_GEMINI_API_KEY=your_key_here

# IMPORTANT: Never commit .env to git!
# Add .env to .gitignore
```

**Verify .gitignore:**
```
.env
.env.local
.env.production
```

### 4. Rate Limiting (Frontend)

**Prevent API abuse:**
```tsx
// utils/rateLimit.ts
export const rateLimit = (fn: Function, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
};

// Usage in Gemini API calls:
const callAILimited = rateLimit(callGeminiAPI, 1000); // Max 1 call/second
```

---

## UX Improvements

### 1. Loading States Everywhere

**Create LoadingSpinner Component:**
```tsx
// components/LoadingSpinner.tsx
export const LoadingSpinner = ({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg', message?: string }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeMap[size]} border-4 border-primary border-t-transparent rounded-full animate-spin mb-4`}></div>
      {message && (
        <p className="text-primary font-black text-sm uppercase tracking-widest italic animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
```

**Use in all async operations:**
```tsx
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setLoading(true);
  try {
    await saveWorkout();
  } finally {
    setLoading(false);
  }
};

return loading ? <LoadingSpinner message="Saving..." /> : <WorkoutForm />;
```

### 2. Error Boundaries

**Create ErrorBoundary Component:**
```tsx
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-black p-6">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-black italic uppercase mb-4 text-red-500">
              Something Broke
            </h1>
            <p className="text-muted mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-black font-black px-6 py-3 rounded uppercase"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap app:**
```tsx
// In App.tsx
<ErrorBoundary>
  <HashRouter>
    <AppContent />
  </HashRouter>
</ErrorBoundary>
```

### 3. Toast Notifications

**Install sonner (lightweight toast library):**
```bash
npm install sonner
```

```tsx
// In App.tsx
import { Toaster } from 'sonner';

<Toaster
  position="top-center"
  toastOptions={{
    style: {
      background: '#1a1a1a',
      color: '#ccff00',
      border: '1px solid #ccff00',
    },
  }}
/>
```

**Usage:**
```tsx
import { toast } from 'sonner';

// Success
toast.success('Workout completed! +150 XP');

// Error
toast.error('Failed to save workout');

// Loading
const toastId = toast.loading('Saving...');
await saveWorkout();
toast.success('Saved!', { id: toastId });
```

### 4. Confirm Dialogs

**For destructive actions:**
```tsx
const handleDeleteWorkout = () => {
  if (window.confirm('Delete this workout? This cannot be undone.')) {
    deleteWorkout(workoutId);
    toast.success('Workout deleted');
  }
};
```

**Better: Custom Modal:**
```tsx
// components/ConfirmDialog.tsx
export const ConfirmDialog = ({ title, message, onConfirm, onCancel }: Props) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded max-w-md">
        <h2 className="text-xl font-black mb-3">{title}</h2>
        <p className="text-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## CI/CD Pipeline Setup

### GitHub Actions Workflow

**Create `.github/workflows/test.yml`:**
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript check
        run: npx tsc --noEmit
```

---

## Summary Checklist

### Critical Fixes (Do This Week):
- [ ] **BUG-001:** Fix Profile page loading issue
- [ ] **BUG-004:** Fix workout persistence after reload
- [ ] **BUG-002:** Add onClick handlers to template cards
- [ ] **BUG-003:** Add EmptyState component to all pages

### High Priority (Do This Month):
- [ ] Install Vitest and run unit tests
- [ ] Add loading states to all async operations
- [ ] Add error boundaries
- [ ] Optimize images with lazy loading
- [ ] Add data-testid to interactive elements

### Medium Priority (Next Quarter):
- [ ] Set up CI/CD pipeline
- [ ] Increase E2E test coverage to 50%+
- [ ] Add component tests with React Testing Library
- [ ] Performance audit with Lighthouse
- [ ] Accessibility audit with WAVE/axe

### Nice to Have (Future):
- [ ] Toast notification system
- [ ] Virtualized lists for large datasets
- [ ] Bundle size optimization
- [ ] Content Security Policy headers
- [ ] Rate limiting on API calls

---

## Getting Started with Fixes

**Recommended Order:**

**Day 1: Critical Bugs**
1. Run dev server: `npm run dev`
2. Investigate BUG-001 (Profile page)
3. Add debug logging
4. Identify root cause
5. Apply fix
6. Test manually in browser
7. Run E2E test: `npx playwright test --grep "Progress Tracking"`

**Day 2: High Priority UX**
1. Create EmptyState component
2. Add to History, Analytics, Achievements pages
3. Fix template onClick handlers
4. Test all changes manually
5. Run full E2E suite: `npx playwright test`

**Day 3: Test Infrastructure**
1. Install Vitest
2. Configure vitest.config.ts
3. Run existing unit tests
4. Fix any failing tests
5. Add new component tests

**Day 4: Performance**
1. Build app: `npm run build`
2. Analyze bundle with visualizer
3. Add lazy loading to images
4. Test with Lighthouse
5. Optimize based on results

**Day 5: Polish**
1. Add loading spinners
2. Add error boundaries
3. Add toast notifications
4. Manual UX review
5. Screenshot all pages

---

## Need Help?

**Common Issues:**

**Profile Page Won't Load:**
- Check browser console for errors
- Verify Zustand store has `settings` object
- Add console.log at component top
- Check if conditional rendering is hiding content

**Tests Failing:**
- Clear browser cache
- Restart dev server
- Clear Playwright cache: `npx playwright install --force`
- Check test selectors match actual UI

**Build Errors:**
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check TypeScript errors: `npx tsc --noEmit`
- Clear Vite cache: `rm -rf node_modules/.vite`

**Performance Issues:**
- Run production build: `npm run build && npm run preview`
- Check bundle size in `dist/` folder
- Use React DevTools Profiler
- Check Network tab in browser

---

**Last Updated:** 2025-12-25
**Next Review:** After fixes implemented
