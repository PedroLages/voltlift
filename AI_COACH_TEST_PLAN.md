# 🤖 AI Coach Integration Test Plan

## Test Environment
- **URL:** http://localhost:3005/
- **Browser:** Chrome/Safari (mobile viewport recommended)
- **Prerequisites:** Fresh localStorage (or existing workout history)

---

## Test Suite 1: Progressive Overload Suggestions

### Test 1.1: First-Time Exercise (No History)
**Expected:** Conservative starting suggestion

**Steps:**
1. Start new workout
2. Add "Bench Press" exercise
3. Observe AI suggestion badge

**✅ Pass Criteria:**
- Badge shows: "AI Suggests 95 LBS × 8-12 REPS" (beginner exercise default)
- Confidence: LOW
- Reasoning: "First time logging this exercise. Start conservative to learn form."
- Recovery score: 7/10 (neutral, no sleep data)

---

### Test 1.2: Well-Recovered Athlete (RPE < 7)
**Scenario:** Simulate previous workout with low effort + good sleep

**Steps:**
1. **Prep:** Log sleep (8hrs) on Dashboard
2. **Mock previous workout:**
   - Bench Press: 135lbs × 8 reps, RPE 6
   - (Need to complete a full workout first, then start new one)
3. Start new workout with Bench Press
4. Check AI suggestion

**✅ Pass Criteria:**
- Suggested weight > 135lbs (should be ~141lbs = 5% increase)
- Suggested reps: 6-8 (lower reps at higher weight)
- Confidence: HIGH
- Reasoning contains: "ready to push" or "excellent recovery"
- Recovery score: 9/10 (8hrs sleep + well rested)

---

### Test 1.3: Under-Recovered Athlete
**Scenario:** Simulate sleep deprivation

**Steps:**
1. **Prep:** Log sleep (5hrs) on Dashboard
2. Start workout with previously logged exercise
3. Check AI suggestion

**✅ Pass Criteria:**
- Suggested weight < previous weight (15% deload)
- shouldDeload: true
- Confidence: HIGH
- Reasoning contains: "Low recovery score" or "Only 5hrs sleep"
- Recovery score: 4/10 or lower
- Orange "Deload Recommended" badge visible

---

### Test 1.4: Apply Suggestion
**Test the "Apply" button functionality**

**Steps:**
1. Start workout with exercise (with history)
2. Observe AI suggestion
3. Click "Apply" button
4. Check first uncompleted set

**✅ Pass Criteria:**
- Weight auto-filled with suggested value
- Reps auto-filled with suggested value (upper bound)
- "Apply" button disappears after all sets completed

---

## Test Suite 2: Volume Warnings

### Test 2.1: Approaching MRV (18-22 sets/week)
**Scenario:** High chest volume accumulation

**Steps:**
1. **Prep:** Complete 3 workouts in past 7 days:
   - Workout 1: Bench Press (5 sets), Incline Bench (4 sets)
   - Workout 2: Bench Press (5 sets)
   - Workout 3: Dumbbell Flyes (5 sets)
   - **Total:** 19 sets for Chest muscle group
2. Go to Dashboard
3. Check for "Volume Alerts" widget
4. Start new workout with Bench Press
5. Check exercise header for warning badge

**✅ Pass Criteria:**
- Dashboard shows "Volume Alerts" section
- "Chest" listed with ~19 sets/week
- Status: "AT LIMIT"
- Warning badge appears in WorkoutLogger exercise header
- Badge shows: "19 sets/week" in small orange badge

---

### Test 2.2: Exceed MRV (22+ sets/week)
**Scenario:** Extreme volume

**Steps:**
1. **Prep:** Add another Chest workout (5 sets) to history
   - **Total:** 24 sets for Chest
2. Check Dashboard Volume Alerts
3. Check exercise header in workout

**✅ Pass Criteria:**
- Dashboard shows: "DELOAD NEXT"
- Orange/red warning color (not just yellow)
- Message: "Reduce volume to prevent overtraining and injury"

---

## Test Suite 3: Recovery Score

### Test 3.1: Sleep Impact on Recovery
**Test recovery calculation logic**

**Steps:**
1. Dashboard → Recovery Protocol section
2. Log different sleep values and observe changes:
   - 5 hours → Score should be ~4/10 (DEPLETED)
   - 6 hours → Score should be ~6/10 (FATIGUED)
   - 7 hours → Score should be ~8/10 (READY)
   - 8+ hours → Score should be 9-10/10 (FRESH)

**✅ Pass Criteria:**
- Recovery bar fills proportionally
- Status label changes (DEPLETED → FATIGUED → READY → FRESH)
- Color changes (red → orange → green → neon yellow)
- Score updates immediately after sleep input

---

### Test 3.2: No Sleep Data (Default State)
**Steps:**
1. Clear sleep hours (set to 0 or empty)
2. Check recovery score

**✅ Pass Criteria:**
- Score defaults to 7/10 (NEUTRAL)
- Status: READY
- Visual bar at 70%

---

## Test Suite 4: Tooltip & Reasoning

### Test 4.1: Detailed Reasoning Tooltip
**Steps:**
1. Start workout with exercise
2. Click info icon (ⓘ) on AI suggestion badge
3. Observe tooltip content

**✅ Pass Criteria:**
- Tooltip displays full reasoning text
- Shows confidence level (HIGH/MEDIUM/LOW)
- Shows recovery score (X/10)
- Displays any special warnings (e.g., "Deload Recommended")
- Has "Close" button
- Clicking outside tooltip closes it

---

## Test Suite 5: Integration & Edge Cases

### Test 5.1: Multiple Exercises in Same Workout
**Steps:**
1. Start workout with 3 exercises:
   - Bench Press (Chest)
   - Barbell Row (Back)
   - Squat (Legs)
2. Verify each has independent AI suggestion

**✅ Pass Criteria:**
- Each exercise shows different suggestion based on its history
- Volume warnings specific to muscle group
- No cross-contamination of data

---

### Test 5.2: No Volume Warnings (Normal Training)
**Steps:**
1. Clear history or have low volume week (<15 sets/muscle)
2. Check Dashboard

**✅ Pass Criteria:**
- "Volume Alerts" widget does NOT appear
- Dashboard clean, no warnings
- Exercise headers have no volume badges

---

### Test 5.3: Gemini Coach Separation
**Verify offline AI doesn't interfere with Gemini API**

**Steps:**
1. Start workout
2. Observe two separate AI sections:
   - AI Progressive Overload (offline, always visible)
   - GEMINI COACH (BETA) button (optional, API-based)

**✅ Pass Criteria:**
- Both sections visible
- Offline AI works without internet
- Gemini button labeled "GEMINI COACH (BETA)"
- Clicking Gemini shows loading state or API response
- Offline AI unaffected by Gemini API status

---

## Performance Checks

### P1: Render Speed
- [ ] AI suggestion appears < 100ms after exercise loaded
- [ ] No lag when applying suggestions
- [ ] Dashboard recovery score calculates instantly

### P2: Data Persistence
- [ ] Suggestions based on localStorage workout history
- [ ] Recovery score persists page refresh
- [ ] Volume warnings update in real-time as sets logged

### P3: Mobile UX
- [ ] Touch targets adequate size (Apply button, info icon)
- [ ] Tooltip readable on mobile
- [ ] No layout overflow on small screens

---

## Bugs to Watch For

🐛 **Known Potential Issues:**
1. **Volume warning not showing:** Check if `getVolumeWarning()` returns null
2. **Recovery score stuck:** Verify sleep input triggers state update
3. **Apply button not working:** Check `updateSet()` is called correctly
4. **Suggestions illogical:** Review heuristic logic in `progressiveOverload.ts`

---

## Test Results Log

| Test ID | Pass/Fail | Notes | Screenshot |
|---------|-----------|-------|------------|
| 1.1     |           |       |            |
| 1.2     |           |       |            |
| 1.3     |           |       |            |
| 1.4     |           |       |            |
| 2.1     |           |       |            |
| 2.2     |           |       |            |
| 3.1     |           |       |            |
| 3.2     |           |       |            |
| 4.1     |           |       |            |
| 5.1     |           |       |            |
| 5.2     |           |       |            |
| 5.3     |           |       |            |

---

## Next Steps After Testing

1. **If all tests pass:** ✅ Mark Phase 1 AI Coach as PRODUCTION READY
2. **If bugs found:** 🐛 Document issues and prioritize fixes
3. **User feedback:** 📝 Collect real workout data for heuristic tuning
4. **Phase 2:** Move to PR Detection & Celebration features

---

**Estimated Test Time:** 30-45 minutes
**Tester:** [Your Name]
**Date:** [Test Date]
