# Feature Requirements & Specifications

## Core Workout Logging

### Exercise Logging
**Requirements:**
- Log sets with weight, reps, and optional RPE (1-10 scale)
- Display previous workout data for same exercise
- Support for different set types:
  - Working sets
  - Warm-up sets
  - Drop sets
  - Failure sets
  - AMRAP (As Many Reps As Possible)

**UX Details:**
- Single tap/swipe to mark set complete
- Auto-fill weight/reps from previous workout
- Quick increment/decrement buttons (+2.5kg, +5kg, +1 rep, etc.)
- Swipe to delete set
- Drag to reorder sets

### Rest Timer
**Requirements:**
- Automatic start after completing a set
- Customizable duration:
  - Global default
  - Per-exercise override
  - Per-workout override
- Visual countdown
- Audio alert (customizable)
- Vibration alert
- Lock screen notification

**Advanced Features:**
- Pause/resume
- Skip timer
- Add time
- Log next set from notification (iOS/Android)
- Timer continues even if app closed

### Exercise Library
**Requirements:**
- Comprehensive database of exercises
- Categorized by:
  - Muscle group (primary/secondary)
  - Equipment type
  - Movement pattern
  - Difficulty level
- Search functionality
- Custom exercise creation
- Exercise details:
  - Form instructions
  - Video/image demos
  - Tips and cues
  - Common mistakes
  - Variations

**Data Structure:**
```typescript
interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  category: ExerciseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  formCues: string[];
  videoUrl?: string;
  imageUrl?: string;
  variations?: string[]; // IDs of related exercises
  isCustom: boolean;
}
```

## Progress Tracking & Analytics

### Personal Records (PRs)
**Requirements:**
- Automatic PR detection
- PR types:
  - 1RM (one-rep max)
  - Estimated 1RM (calculated from reps)
  - Volume PR (total weight × reps)
  - Rep PR (most reps at a given weight)
- Live PR notifications during workout
- PR history timeline
- Per-exercise PR tracking

### Volume Tracking
**Requirements:**
- Track total volume per:
  - Workout session
  - Exercise
  - Muscle group
  - Week/month/year
- Volume trends over time
- Volume breakdown visualization

### 1RM Calculations
**Formulas to Support:**
- Epley: 1RM = w(1 + r/30)
- Brzycki: 1RM = w × 36/(37 - r)
- Lombardi: 1RM = w × r^0.10
- Allow user to select preferred formula

### Body Metrics
**Requirements:**
- Bodyweight tracking
- Body measurements (optional):
  - Chest, waist, hips, arms, legs
- Progress photos
- Correlation with lifting performance

### Analytics Dashboard
**Visualizations:**
1. **Volume Over Time**
   - Line graph
   - Selectable time range
   - Per muscle group
   - Total volume

2. **Muscle Group Distribution**
   - Body heatmap
   - Pie chart of training volume
   - Balance recommendations

3. **Progression Charts**
   - Per exercise strength progression
   - 1RM trends
   - Rep/weight progression

4. **Workout Frequency**
   - Calendar heatmap
   - Streak tracking
   - Consistency score

## Workout Templates & Programs

### Templates
**Requirements:**
- Save workouts as templates
- Quick start from template
- Edit template without affecting history
- Template library:
  - User-created
  - Pre-built templates
  - Community templates (future)

**Template Data:**
```typescript
interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps: string; // "8-12", "5x5", "AMRAP"
    targetWeight?: number;
    restTime: number; // seconds
    notes?: string;
  }[];
  estimatedDuration: number; // minutes
  tags: string[];
}
```

### Program Builder
**Requirements:**
- Multi-week program creation
- Day-by-day workout planning
- Progressive overload scheduling
- Deload weeks
- Program templates (e.g., PPL, Upper/Lower, Full Body)

**Auto-Progression Logic:**
```typescript
interface ProgressionRule {
  type: 'linear' | 'percentage' | 'custom';
  trigger: {
    completedSets: number; // e.g., all sets completed
    consecutiveWeeks: number; // e.g., 2 weeks success
  };
  increment: {
    weight?: number; // +2.5kg
    reps?: number; // +1 rep
    sets?: number; // +1 set
  };
  deloadRule: {
    failedWeeks: number; // trigger after X failures
    reduction: number; // percentage reduction
  };
}
```

### Active Program Tracking
**Requirements:**
- Current week/day indicator
- Program progress percentage
- Completed vs. remaining workouts
- Program adherence stats
- Modify program mid-cycle (with warnings)

## Utility Features

### Plate Calculator
**Requirements:**
- Input target weight
- Display optimal plate combination
- Support for:
  - Multiple bar types (20kg, 15kg, EZ bar, etc.)
  - Custom plate sets
  - Kilogram and pound units
- Visual representation of loaded bar

### RPE (Rate of Perceived Exertion)
**Requirements:**
- Optional RPE logging per set
- RPE scale: 1-10
- RPE guidelines/reference
- RPE trends over time
- Load recommendations based on RPE

**RPE Guidelines:**
- 10: Maximum effort, no reps left
- 9: Could do 1 more rep
- 8: Could do 2-3 more reps
- 7: Could do 4-6 more reps
- 6 and below: Warm-up territory

### Workout Notes
**Requirements:**
- General workout notes
- Per-exercise notes
- Tagged notes (e.g., #injury, #form, #equipment)
- Note history
- Search notes

### Supersets & Circuits
**Requirements:**
- Group exercises into supersets
- Circuit notation (A1, A2, B1, B2)
- Shared rest timer for superset
- Visual grouping in UI

## Social Features (Optional/Future)

### Workout Sharing
**Requirements:**
- Share completed workouts
- Privacy controls (public/friends/private)
- Social feed of followed users
- Like/comment on workouts

### Leaderboards
**Requirements:**
- Exercise-specific leaderboards
- Friends-only or global
- Weight class categories
- Age/gender filters

### Community Programs
**Requirements:**
- Browse user-created programs
- Rating system
- Download/customize community programs
- Program creator attribution

## User Settings & Customization

### Units & Measurements
- Kg/lbs toggle
- Metric/imperial
- Plate increment preferences (2.5kg vs 2kg vs 1.25kg)

### Appearance
- Dark/light/auto theme
- Color scheme customization
- Font size
- Compact/comfortable view density

### Notifications
- Workout reminders
- Rest timer alerts
- PR celebrations
- Streak reminders
- Weekly summary

### Data Management
- Cloud sync (auto-backup)
- Export data (CSV, JSON)
- Import from other apps
- Data deletion/privacy controls

## Performance Requirements

### Speed
- App launch: < 2 seconds
- Workout load: < 1 second
- Set logging: instant (< 100ms)
- Graph rendering: < 2 seconds

### Offline Support
- Full workout logging offline
- Sync when connection restored
- Conflict resolution
- Offline indicator

### Data Limits
- IndexedDB for media (exercise visuals)
- LocalStorage for workout data
- Compression for large datasets
- Pagination for history (50 workouts per page)

## Accessibility

### Requirements
- Screen reader support
- High contrast mode
- Voice input for set logging
- Large touch targets (minimum 44px)
- Keyboard navigation (web)
- Haptic feedback

## Platform-Specific Features

### iOS
- Apple Watch app
- HealthKit integration
- Siri Shortcuts
- Live Activities (rest timer)
- Widgets (quick start workout)

### Android
- Wear OS support
- Google Fit integration
- Quick tiles
- Widgets

### Web
- Progressive Web App (PWA)
- Offline support
- Desktop optimizations
- Keyboard shortcuts
