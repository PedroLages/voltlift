# Phase 5: AI Coaching System - Integration Complete

## Overview
Phase 5 AI coaching features have been integrated into VoltLift, providing intelligent recommendations for Training Max adjustments, deload timing, and performance analysis.

## Components Integrated

### 1. **WorkoutLogger Integration** ([WorkoutLogger.tsx](pages/WorkoutLogger.tsx))

#### AMAP Completion Modal
- **Trigger**: When completing AMAP (As Many As Possible) sets during Greg Nuckols programs
- **Features**:
  - AI-powered Training Max suggestions based on AMAP performance
  - Performance tier display (Excellent 🔥/Great 💪/Good ✓)
  - Multiple TM options (AI recommended, alternative, standard)
  - Custom TM input
  - Confidence level indicators (high/medium/low)

#### Cycle Completion Modal
- **Trigger**: After completing a 4-week training cycle
- **Features**:
  - Cycle summary with volume statistics
  - Training Max progression display
  - AI deload assessment with urgency levels
  - Recovery metrics dashboard
  - Deload vs Continue decision

#### How to Trigger (Currently Manual)
```typescript
// Example: Trigger AMAP modal after completing AMAP set
setAmapModalData({
  exerciseId: 'squat',
  exerciseName: 'Barbell Squat',
  currentTM: 250,
  amapReps: 12,
  setData: {
    completedSets: 3,
    totalSets: 3,
    averageRPE: 8.5,
    missedReps: 0
  }
});
```

### 2. **Profile Page Integration** ([Profile.tsx](pages/Profile.tsx))

#### Performance Insights Section
- **Location**: After Training Intelligence section, before VoltCloud
- **Visibility**: Only shows when `settings.trainingMaxes` contains exercises with 2+ cycles
- **Features**:
  - TM history visualization for all tracked exercises
  - Trend analysis (Improving ↗️/Plateauing →/Declining ↘️)
  - AI-powered key factors identification
  - Actionable recommendations
  - Expandable/collapsible per exercise
  - Refresh analysis button

#### Example Display
```tsx
{settings.trainingMaxes && Object.keys(settings.trainingMaxes).length > 0 && (
  <section>
    <PerformanceInsights
      exerciseId="squat"
      exerciseName="Barbell Squat"
      trainingMax={settings.trainingMaxes['squat']}
      recentSessions={history.slice(0, 12)}
    />
  </section>
)}
```

## AI Services ([gnCoachingService.ts](services/gnCoachingService.ts))

### Available Functions

#### 1. **getTrainingMaxSuggestion**
```typescript
await getTrainingMaxSuggestion(
  exerciseId: string,
  exerciseName: string,
  currentTM: number,
  amapReps: number,
  recentPerformance: {
    completedSets: number;
    totalSets: number;
    averageRPE?: number;
    missedReps: number;
  },
  recoveryMetrics?: {
    sleep?: number;
    stress?: number;
    soreness?: number;
    bodyweight?: number;
    bodyweightChange?: number;
  }
);
```
**Returns**: TMSuggestion with recommended TM, confidence, reasoning, and alternative

#### 2. **getDeloadRecommendation**
```typescript
await getDeloadRecommendation(
  cyclesCompleted: number,
  recentSessions: WorkoutSession[],
  recoveryMetrics?: {
    avgSleep: number;
    avgStress: number;
    avgSoreness: number;
    bodyweightChange: number;
  }
);
```
**Returns**: DeloadRecommendation with shouldDeload, urgency, reasoning, suggestedWeeks

#### 3. **getExerciseSubstitution**
```typescript
await getExerciseSubstitution(
  exerciseName: string,
  reason: 'injury' | 'equipment' | 'preference' | 'variation',
  details?: string
);
```
**Returns**: 3-4 exercise alternatives with reasoning

#### 4. **analyzePerformanceTrend**
```typescript
await analyzePerformanceTrend(
  exerciseName: string,
  tmHistory: { value: number; date: number }[],
  recentSessions: WorkoutSession[]
);
```
**Returns**: PerformanceInsight with trend, keyFactors, recommendations

## Data Structure Updates

### UserSettings Extension ([types.ts](types.ts))
```typescript
interface UserSettings {
  // ... existing fields

  // Phase 5: Training Max tracking
  trainingMaxes?: Record<string, TrainingMax>;
  activeProgramCycle?: {
    programId: string;
    currentCycle: number;
    cycleStartDate: number;
    weekInCycle: number;
  };
}

interface TrainingMax {
  exerciseId: string;
  value: number;
  lastUpdated: number;
  calculatedFrom?: {
    type: '1RM' | '3RM' | '5RM' | 'manual';
    value: number;
    date: number;
  };
  history: TrainingMaxHistory[];
}

interface TrainingMaxHistory {
  value: number;
  date: number;
  calculatedFrom?: {
    type: '1RM' | '3RM' | '5RM' | 'AMAP' | 'manual';
    value: number;
    reps?: number;
  };
  reason?: string;
}
```

## Next Steps for Full Integration

### 1. Auto-Trigger AMAP Modal
Add logic to `handleSetComplete` in WorkoutLogger to detect AMAP sets:

```typescript
// In handleSetComplete function
if (isAMAPSet && completed && exerciseHasTrainingMax) {
  // Calculate performance metrics
  const setData = {
    completedSets: log.sets.filter(s => s.completed).length,
    totalSets: log.sets.length,
    averageRPE: calculateAverageRPE(log.sets),
    missedReps: calculateMissedReps(log.sets)
  };

  // Trigger modal
  setAmapModalData({
    exerciseId: log.exerciseId,
    exerciseName: exerciseDef.name,
    currentTM: settings.trainingMaxes[log.exerciseId].value,
    amapReps: reps,
    setData
  });
}
```

### 2. Auto-Trigger Cycle Modal
Add logic to `handleCompleteWorkout` to detect cycle completion:

```typescript
// In handleCompleteWorkout function
if (isGregNuckolsProgram && isCycleComplete) {
  const tmUpdates = calculateTMUpdates(activeWorkout, settings.trainingMaxes);

  setCycleModalData({
    programName: program.name,
    cyclesCompleted: calculateCyclesCompleted(),
    tmUpdates
  });
}
```

### 3. Add Training Max Calculator Page
Create `/training-max` route for users to:
- Calculate 1RM from various rep maxes
- Set initial Training Maxes for exercises
- View and edit TM history
- Test new 1RMs

### 4. Program Template Updates
Update Greg Nuckols program templates to include:
- Percentage prescriptions in SetLog
- AMAP set markers
- Cycle/week tracking metadata

## Testing Checklist

- [ ] AMAP modal appears when completing AMAP sets
- [ ] TM suggestions are reasonable and safe (±20 lbs from standard)
- [ ] Cycle modal appears after finishing 4-week cycle
- [ ] Performance Insights display correctly on Profile page
- [ ] AI API gracefully degrades when offline/no API key
- [ ] Recovery metrics properly influence AI recommendations
- [ ] TM history tracks correctly in settings
- [ ] All modals are mobile-responsive

## API Key Setup

The AI coaching system requires a Gemini API key:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Free Tier**: 1,500 requests/day - sufficient for ~500 users/day
**Cost**: $0.075 per 1M input tokens (very affordable)

## Offline Behavior

All AI functions implement graceful degradation:
- No API key → Falls back to standard AMAP progression tables
- API error → Uses mathematical calculations (Epley formula, etc.)
- Network offline → Returns conservative recommendations
- All critical functionality works without AI

## Files Modified

### Created
1. [services/gnCoachingService.ts](services/gnCoachingService.ts) - AI coaching logic
2. [components/AMAPCompletionModal.tsx](components/AMAPCompletionModal.tsx) - AMAP modal UI
3. [components/CycleCompletionModal.tsx](components/CycleCompletionModal.tsx) - Cycle modal UI
4. [components/PerformanceInsights.tsx](components/PerformanceInsights.tsx) - Insights widget
5. [components/ExerciseVideoPlayer.tsx](components/ExerciseVideoPlayer.tsx) - YouTube video support

### Modified
1. [pages/WorkoutLogger.tsx](pages/WorkoutLogger.tsx) - Added modal imports, state, handlers, rendering
2. [pages/Profile.tsx](pages/Profile.tsx) - Added Performance Insights section
3. [types.ts](types.ts) - Extended UserSettings with trainingMaxes and activeProgramCycle
4. [types.ts](types.ts) - Added videoUrl to Exercise interface

## Universal AI Features

While designed for Greg Nuckols programs, these AI services work universally:

### For Reddit PPL:
```typescript
// Deload recommendation
const deload = await getDeloadRecommendation(4, recentSessions);

// Exercise substitution
const subs = await getExerciseSubstitution('Barbell Bench Press', 'injury', 'shoulder pain');
```

### For StrongLifts 5x5:
```typescript
// Performance trend analysis (using PR history)
const trend = await analyzePerformanceTrend(
  'Squat',
  prHistory.map(pr => ({ value: pr.weight, date: pr.date })),
  recentSessions
);
```

## Roadmap

**Immediate** (Next Sprint):
- Wire up auto-triggers for AMAP and Cycle modals
- Add Training Max Calculator page
- Update GN program templates with percentage data

**Short-term** (2-4 weeks):
- Add more AI coaching prompts (form cues, exercise order optimization)
- Volume optimization using AI analysis
- Personalized deload week customization

**Long-term** (1-3 months):
- AI-generated mesocycle planning
- Weak point analysis with exercise prescription
- Voice-guided workout coaching (audio cues)

---

**Status**: ✅ **Integration Complete** - Ready for testing and refinement
**Author**: VoltLift Dev Team
**Date**: December 2025
