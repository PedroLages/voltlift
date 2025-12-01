# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IronPath is a fitness/workout tracking mobile-first web application built with React 19, TypeScript, and Vite. It features AI-powered workout suggestions via Google's Gemini API and was originally created with Google AI Studio.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

## Architecture

### State Management
- **Zustand store** (`store/useStore.ts`): Single global store with persistence via `zustand/middleware/persist`
- State is persisted to localStorage under key `ironpath-storage`
- Heavy assets (exercise visuals) are stored in IndexedDB via `utils/db.ts` to avoid localStorage size limits

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
- Tailwind-style utility classes (inline in components)
- Primary color: `#ccff00` (neon yellow-green)
- Dark theme with black background (`#000`) and gray borders (`#333`)
- Mobile-first with safe area insets for notched devices
