# Phase 3 Testing Checklist

**Dev Server**: http://localhost:3001/

## Prerequisites
- [ ] At least 5 completed workouts in history (for weak point analysis)
- [ ] At least 3 days of sleep logs (for recovery assessment)
- [ ] Multiple exercises performed (for variation suggestions)

---

## 1. Dashboard Testing

### Periodization Status Widget
**Location**: Dashboard page, after "Neural Coach Widget"

**Test Cases**:
- [ ] Widget appears when history.length >= 3
- [ ] Current Phase displays correctly (accumulation/intensification/deload)
- [ ] Color coding works (green=accumulation, orange=intensification, blue=deload)
- [ ] Days Until Deload shows correct count
- [ ] Warning badge appears when needsDeload is true
- [ ] Widget is hidden when insufficient data

**How to Test**:
1. Navigate to Dashboard
2. Scroll to "Training Cycle" section
3. Verify phase color matches phase type
4. Check if deload countdown is reasonable

### Weak Point Alert
**Location**: Dashboard page, after Periodization widget

**Test Cases**:
- [ ] Alert appears when weak points detected
- [ ] Shows top priority weak point
- [ ] "View Full Analysis →" button navigates to Profile
- [ ] Hidden when no weak points or insufficient data

**How to Test**:
1. Check if weak point message is relevant
2. Click "View Full Analysis" → should go to Profile page
3. Verify weak point makes sense given training history

---

## 2. Profile Testing

### Training Intelligence Section
**Location**: Profile page, after Body Metrics section

#### Periodization Tab
**Test Cases**:
- [ ] Current cycle status shows correct phase
- [ ] Days until deload is accurate
- [ ] Deload warning appears when needed
- [ ] Mesocycle plan shows 4+ week block
- [ ] Phase descriptions are clear and accurate
- [ ] Week ranges are correct

**How to Test**:
1. Navigate to Profile
2. Scroll to "Training Intelligence" section
3. Click "Periodization" tab
4. Verify current phase matches recent training volume
5. Check mesocycle plan makes sense

#### Recovery Tab
**Test Cases**:
- [ ] Recovery score (0-100) displays correctly
- [ ] Color coding works (green >=70, yellow >=50, red <50)
- [ ] Sleep debt calculation is accurate
- [ ] Training stress (0-100) is reasonable
- [ ] "Ready to Train" status is correct
- [ ] Recommendations are prioritized (critical → high → medium → low)
- [ ] Action items are specific and actionable

**How to Test**:
1. Click "Recovery" tab
2. Verify recovery score makes sense given sleep + workouts
3. Check if sleep debt matches recent sleep logs
4. Read recommendations - should be specific to your situation

#### Weak Points Tab
**Test Cases**:
- [ ] Balance score (0-100) displays
- [ ] Priority areas show undertrained muscle groups
- [ ] Weak point list shows specific issues
- [ ] Severity indicators correct (red=severe, orange=moderate, yellow=minor)
- [ ] Recommendations are muscle-specific
- [ ] Shows "No weak points" when training is balanced

**How to Test**:
1. Click "Weak Points" tab
2. Check if detected weak points match your training
3. Verify priority areas make sense
4. Read recommendations for each weak point

#### Variations Tab
**Test Cases**:
- [ ] Shows exercises done for 8+ weeks
- [ ] Plateaued exercises highlighted with "Stalled" badge
- [ ] Suggested variations are similar exercises
- [ ] Reasoning explains why variation is needed
- [ ] Shows "Exercise Selection Looks Good!" when no variations needed

**How to Test**:
1. Click "Variations" tab
2. Check if suggested variations are appropriate
3. Verify "weeks since variation" is accurate
4. Read reasoning for each suggestion

---

## 3. Analytics Testing

### Injury Risk Assessment
**Location**: Analytics page, top section

**Test Cases**:
- [ ] Risk level displays (LOW/MODERATE/HIGH/CRITICAL)
- [ ] Color coding correct (green/yellow/orange/red)
- [ ] Risk score (0-100) is reasonable
- [ ] "DELOAD NOW" badge when risk >= 60
- [ ] Detected issues are specific (RPE trend, volume spike, etc.)
- [ ] Recommendations are actionable
- [ ] Days until recommended deload shown

**How to Test**:
1. Navigate to Analytics page
2. Check injury risk section at top
3. Verify risk factors match recent training
4. Read recommendations

### PR Forecast
**Location**: Analytics page, after PR History Timeline

**Test Cases**:
- [ ] Current PR shows correct value
- [ ] Predicted PR (8 weeks) is realistic
- [ ] Confidence % (0-100%) displays
- [ ] Confidence bars (5 bars) match percentage
- [ ] Achievability badge (✓ or ⚠) is correct
- [ ] Reasoning explains the forecast
- [ ] 8-week projection curve displays
- [ ] Bar chart shows progressive increase

**How to Test**:
1. Select an exercise from dropdown
2. Scroll to "PR Forecast" section
3. Verify current PR matches your actual PR
4. Check if predicted PR seems achievable
5. Read reasoning for forecast confidence

---

## 4. Edge Cases & Error Handling

### Insufficient Data
**Test Cases**:
- [ ] Widgets gracefully hidden when history.length < 3
- [ ] No errors in console when insufficient data
- [ ] Empty states don't break layout

**How to Test**:
1. Clear workout history (or use fresh account)
2. Navigate to Dashboard/Profile/Analytics
3. Check browser console for errors
4. Verify no broken UI elements

### No Sleep Data
**Test Cases**:
- [ ] Recovery assessment uses defaults when no sleep logs
- [ ] Sleep debt shows 0 when no data
- [ ] No crashes or errors

**How to Test**:
1. Navigate with account that has no daily logs
2. Check Recovery tab in Profile
3. Verify defaults are reasonable

### Extreme Values
**Test Cases**:
- [ ] Very high volume (100+ sets/week) doesn't break UI
- [ ] Very low volume (< 5 sets/week) shows appropriate warnings
- [ ] Long time without deload (20+ weeks) shows critical warning

---

## 5. Performance Testing

**Test Cases**:
- [ ] Dashboard loads in < 2 seconds
- [ ] Profile Training Intelligence section loads quickly
- [ ] No lag when switching tabs
- [ ] useMemo prevents unnecessary recalculations
- [ ] Smooth scrolling on all pages

**How to Test**:
1. Open Chrome DevTools → Performance tab
2. Record page load for Dashboard
3. Verify no long tasks (> 50ms)
4. Check React DevTools Profiler

---

## 6. Data Accuracy Validation

### Periodization Phase Detection
**Test Cases**:
- [ ] Increasing volume → "accumulation" phase
- [ ] Decreasing volume → "intensification" phase
- [ ] Very low volume → "deload" phase

**How to Test**:
1. Look at your last 4 weeks of training
2. Count sets per week
3. Verify detected phase matches trend

### Weak Point Detection
**Test Cases**:
- [ ] Undertrained muscles show in priority areas
- [ ] Push/pull imbalance detected correctly
- [ ] Stagnant exercises (no progress 8+ weeks) flagged

**How to Test**:
1. Review your training split
2. Count sets per muscle group
3. Verify weak points match intuition

### Volume Recommendations
**Test Cases**:
- [ ] MEV/MAV/MRV values are personalized
- [ ] Recommendations adjust for training phase
- [ ] Overtrained muscles flagged

---

## 7. Mobile Responsiveness

**Test Cases**:
- [ ] Dashboard widgets stack properly on mobile
- [ ] Profile tabs scroll horizontally on small screens
- [ ] Training Intelligence cards are readable
- [ ] Buttons are touch-friendly (>= 44x44px)

**How to Test**:
1. Open DevTools → Toggle device toolbar
2. Test iPhone SE (375px width)
3. Test iPad (768px width)
4. Verify all features work on mobile

---

## Testing Priority

**High Priority** (Test First):
1. Dashboard Periodization Widget
2. Profile Recovery Tab
3. Analytics Injury Risk Assessment
4. Analytics PR Forecast

**Medium Priority**:
5. Profile Periodization Tab
6. Profile Weak Points Tab
7. Dashboard Weak Point Alert

**Low Priority**:
8. Profile Variations Tab
9. Edge cases
10. Performance testing

---

## Known Limitations

1. **Requires workout history**: Features need 3-5+ workouts to function
2. **Sleep data optional**: Works without, but less accurate
3. **Volume calculations**: Assumes 1RM estimations are accurate
4. **PR forecasting**: Best with consistent training (not sporadic)

---

## Bugs to Watch For

- [ ] Console errors when switching tabs quickly
- [ ] Infinite loops in useMemo dependencies
- [ ] NaN or undefined values in calculations
- [ ] Memory leaks from large history arrays
- [ ] Incorrect date calculations (timezone issues)

---

## Next Steps After Testing

1. ✅ Fix any bugs found
2. ✅ Polish UI (loading states, error boundaries)
3. ✅ Optimize performance if needed
4. ✅ Then move to Option 2: Polish & Optimize
