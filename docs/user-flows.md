# User Flows & Journey Maps

## Primary User Personas

### 1. The Serious Lifter (Alex)
- **Goals:** Maximize strength, track progressive overload meticulously
- **Frequency:** 4-6x per week
- **Needs:** Fast logging, detailed analytics, program structure
- **Pain Points:** Slow apps, cluttered UI, missing previous data

### 2. The Fitness Enthusiast (Jamie)
- **Goals:** Stay consistent, see progress, maintain health
- **Frequency:** 3-4x per week
- **Needs:** Simple tracking, motivation, workout ideas
- **Pain Points:** Overwhelmed by complexity, forgets to log

### 3. The Beginner (Sam)
- **Goals:** Learn proper form, build habit, avoid injury
- **Frequency:** 2-3x per week
- **Needs:** Guidance, pre-built programs, exercise demos
- **Pain Points:** Don't know what to do, intimidated by gym

## Core User Flows

### Flow 1: First Time User Onboarding

```
1. Welcome Screen
   ├─ "Push Your Limits" hero message
   ├─ 3-4 key benefits
   └─ [Get Started] CTA

2. Account Creation (Optional)
   ├─ Continue as Guest (local storage)
   ├─ Email/Password
   └─ Social Login (Google, Apple)

3. Quick Profile Setup
   ├─ What's your primary goal?
   │  ├─ Build Strength
   │  ├─ Build Muscle
   │  ├─ Lose Weight
   │  └─ General Fitness
   │
   ├─ Experience Level
   │  ├─ Beginner (< 6 months)
   │  ├─ Intermediate (6m - 2y)
   │  └─ Advanced (2y+)
   │
   └─ Available Equipment
      ├─ Full Gym
      ├─ Home Gym
      ├─ Minimal (dumbbells/bands)
      └─ Bodyweight Only

4. Unit Preferences
   ├─ Weight Unit (kg/lbs)
   ├─ Default Plate Increments
   └─ [Skip] or [Continue]

5. First Action Prompt
   ├─ [Start Your First Workout]
   ├─ [Browse Programs]
   └─ [Explore Exercise Library]
```

**Exit Criteria:** User completes first workout or saves first template

**Time to Value:** < 3 minutes to start logging first workout

---

### Flow 2: Starting a Quick Workout (Template-Based)

```
Dashboard
│
├─ Quick Start Section
│  ├─ [+ Start Empty Workout]
│  └─ Recent Templates (swipeable cards)
│     ├─ Push Day ⚡ (last: 2 days ago)
│     ├─ Pull Day (last: 4 days ago)
│     └─ Leg Day (last: 6 days ago)
│
└─ [User taps "Push Day"]

Workout Session Screen
│
├─ Header
│  ├─ Workout Name: "Push Day"
│  ├─ Timer (auto-started): 00:03:24
│  ├─ [···] Menu (Notes, Settings, End Workout)
│  └─ Volume: 0 kg
│
├─ Exercise List
│  │
│  ├─ 1. Bench Press (Barbell)
│  │  ├─ Previous: 4x8 @ 80kg
│  │  │
│  │  ├─ Set 1: [80kg] [8 reps] [✓ Log Set]
│  │  │     └─ On Tap → Logged, Rest Timer Starts (90s)
│  │  │
│  │  ├─ Rest Timer Modal (overlays, not blocking)
│  │  │  ├─ ⏱ 01:15 remaining
│  │  │  ├─ [Skip] [+30s] [Start Next Set]
│  │  │  └─ Mini view of next set values
│  │  │
│  │  ├─ Set 2: [80kg] [8 reps] [✓ Log Set]
│  │  ├─ Set 3: [80kg] [8 reps] [✓ Log Set]
│  │  ├─ Set 4: [80kg] [8 reps] [✓ Log Set]
│  │  └─ [+ Add Set]
│  │
│  ├─ 2. Incline Dumbbell Press
│  │  └─ (collapsed until previous exercise done)
│  │
│  └─ [+ Add Exercise]
│
└─ Bottom Actions
   ├─ [End Workout]
   └─ Active Set Indicator

User completes all exercises
│
└─ Workout Summary Screen
   ├─ 🎉 Workout Complete!
   ├─ Duration: 47:23
   ├─ Total Volume: 4,520 kg
   ├─ Exercises: 5
   ├─ Sets: 18
   │
   ├─ Personal Records 🏆
   │  └─ Bench Press: New 1RM (90kg)
   │
   ├─ [Add Notes] (optional)
   ├─ [Save as New Template]
   └─ [Finish] → Returns to Dashboard
```

**Key Interactions:**
- **Quick Edit:** Tap weight/reps to open number pad
- **Swipe Actions:** Swipe left to delete set, swipe right to duplicate
- **Auto-progression:** If all sets completed, suggest +2.5kg for next time
- **PR Detection:** Automatic, shown immediately with celebration

---

### Flow 3: Creating a Custom Workout (From Scratch)

```
Dashboard
│
└─ [+ Start Empty Workout]

Workout Session (Empty State)
│
├─ "Add your first exercise"
└─ [+ Add Exercise] (prominent CTA)

Exercise Selection Modal
│
├─ Search Bar: "bench press"
│
├─ Recently Used (if available)
│  ├─ Bench Press (Barbell)
│  ├─ Squat (Barbell)
│  └─ Deadlift (Barbell)
│
├─ Suggestions
│  ├─ Bench Press (Barbell) ⭐ Popular
│  ├─ Bench Press (Dumbbell)
│  ├─ Incline Bench Press (Barbell)
│  └─ Decline Bench Press (Barbell)
│
└─ Browse by Category
   ├─ 💪 Chest
   ├─ 🏋️ Back
   ├─ 🦵 Legs
   └─ [View All]

[User selects "Bench Press (Barbell)"]
│
├─ Exercise added to workout
│
└─ Exercise Details Expanded
   ├─ Bench Press (Barbell)
   ├─ Previous: 3 days ago - 4x8 @ 80kg
   │
   ├─ Suggested: 4 sets of 8 reps @ 80kg
   │  └─ [Use Suggestion] or [Customize]
   │
   └─ Set 1: [ ___ kg] [ ___ reps] [Log]

[User logs sets as normal...]
│
After Workout Completion
│
└─ Save Workout Modal
   ├─ "Save this workout for next time?"
   ├─ Workout Name: [Custom input]
   ├─ [Save as Template]
   ├─ [Just Finish] (don't save)
   └─ Note: "You can always create templates later"
```

**Design Principles:**
- **No Friction:** User can start logging immediately
- **Smart Suggestions:** Based on history and common patterns
- **Flexibility:** Easy to deviate from suggestions
- **Save Later:** Don't force template creation upfront

---

### Flow 4: Following a Program

```
Dashboard / Programs Tab
│
├─ Active Program Card (if enrolled)
│  ├─ "nSuns 5/3/1"
│  ├─ Week 3 of 12
│  ├─ Progress Bar: ████░░░░░░░░ 25%
│  ├─ Next Workout: "Day 2 - Squat"
│  └─ [Start Workout]
│
└─ [Browse Programs]

Program Browser
│
├─ Filters
│  ├─ Level: All / Beginner / Intermediate / Advanced
│  ├─ Duration: Any / 4 weeks / 8 weeks / 12+ weeks
│  ├─ Days/Week: Any / 3 / 4 / 5 / 6
│  └─ Goal: Strength / Hypertrophy / Powerlifting
│
├─ Featured Programs
│  │
│  ├─ nSuns 5/3/1 ⭐ Most Popular
│  │  ├─ 4-6 days/week
│  │  ├─ Intermediate-Advanced
│  │  ├─ Strength Focus
│  │  ├─ ⭐⭐⭐⭐⭐ (2,453 reviews)
│  │  └─ [View Details]
│  │
│  └─ Reddit PPL (Push Pull Legs)
│     └─ ...
│
└─ Community Programs
   └─ (future feature)

Program Details View
│
├─ Program Header
│  ├─ nSuns 5/3/1
│  ├─ By: nSuns (Reddit)
│  ├─ ⭐⭐⭐⭐⭐ 4.8/5 (2,453 reviews)
│  └─ Description: "Linear progression program..."
│
├─ Overview Tab
│  ├─ Duration: Ongoing (until goal reached)
│  ├─ Frequency: 4-6 days/week
│  ├─ Level: Intermediate-Advanced
│  ├─ Equipment: Barbell, Rack, Bench
│  └─ Focus: Compound lifts, high volume
│
├─ Program Structure Tab
│  ├─ Week View (scrollable)
│  │  │
│  │  ├─ Day 1: Bench Press + Volume
│  │  │  ├─ T1: Bench Press (9 sets, ramping)
│  │  │  ├─ T2: Overhead Press (8 sets)
│  │  │  └─ Accessories (3-5 exercises)
│  │  │
│  │  ├─ Day 2: Squat + Volume
│  │  └─ ...
│  │
│  └─ Progression Logic
│     └─ "Increase TM by 2.5kg when all reps hit"
│
├─ Reviews Tab
│  └─ User testimonials
│
└─ [Start Program]

Program Enrollment
│
├─ Training Max (TM) Setup
│  ├─ "Enter your current 1RM or recent lifts"
│  │
│  ├─ Bench Press 1RM: [90 kg]
│  │  └─ Training Max: 81kg (90% of 1RM)
│  │
│  ├─ Squat 1RM: [120 kg]
│  ├─ Deadlift 1RM: [140 kg]
│  └─ OHP 1RM: [60 kg]
│
├─ Schedule
│  ├─ "Which days do you want to train?"
│  ├─ [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]
│  └─ Selected: Mon, Tue, Thu, Fri (4 days)
│
└─ [Start Week 1]

Active Program Experience
│
├─ Dashboard shows: "Today's Workout: Day 1"
│  └─ [Start] → Opens pre-built workout from program
│
├─ Workout Session
│  ├─ Shows program context
│  │  └─ "nSuns 5/3/1 - Week 3, Day 1"
│  │
│  ├─ Exercises are pre-loaded
│  ├─ Weights calculated from TM
│  │  └─ "Set 1: 65kg x 5 (75% TM)"
│  │
│  └─ Auto-progression after completion
│     └─ "All sets completed! +2.5kg to TM"
│
└─ Program Progress Tracking
   ├─ Completion percentage
   ├─ Adherence rate
   ├─ TM progression over time
   └─ Option to modify/exit program
```

**Key Features:**
- **Clear Expectations:** Show exact workouts before enrollment
- **Guided Setup:** Help users calculate training maxes
- **Auto-calculation:** Weights calculated automatically
- **Flexibility:** Allow modifications while tracking divergence
- **Progress Visibility:** Show advancement through program

---

### Flow 5: Reviewing Progress & Analytics

```
Dashboard
│
└─ Quick Stats Card
   ├─ This Week: 3 workouts, 12,450kg volume
   ├─ 7-day streak 🔥
   └─ [View Full Analytics]

Analytics Screen
│
├─ Time Range Selector
│  ├─ [7D] [30D] [3M] [1Y] [All]
│  └─ Currently: 30D
│
├─ Overview Cards (scrollable)
│  │
│  ├─ Total Workouts: 12
│  ├─ Total Volume: 54,320 kg
│  ├─ Avg Duration: 52 min
│  └─ PRs This Period: 3 🏆
│
├─ Volume Over Time (Line Chart)
│  ├─ Y-axis: Volume (kg)
│  ├─ X-axis: Dates
│  ├─ Tap data point for details
│  └─ Toggle muscle groups
│
├─ Muscle Group Distribution
│  │
│  ├─ Body Heatmap (visual)
│  │  ├─ Chest: 🟢🟢🟢🟢⚪ (80%)
│  │  ├─ Back: 🟢🟢🟢🟢⚪ (75%)
│  │  ├─ Legs: 🟢🟢🟢⚪⚪ (60%)
│  │  └─ ...
│  │
│  └─ Pie Chart (alternative view)
│
├─ Strength Progression
│  │
│  ├─ Exercise Selector
│  │  └─ Dropdown: Bench Press
│  │
│  ├─ 1RM Trend (Line Chart)
│  │  ├─ Shows estimated 1RM over time
│  │  ├─ Markers for actual PRs
│  │  └─ Trend line
│  │
│  └─ Volume Trend for Exercise
│
├─ Personal Records
│  │
│  ├─ Recent PRs (list)
│  │  ├─ Bench Press 1RM: 92.5kg (3 days ago)
│  │  ├─ Squat Volume PR: 3,240kg (1 week ago)
│  │  └─ [View All PRs]
│  │
│  └─ PR Timeline
│     └─ Chronological list of all PRs
│
├─ Frequency & Consistency
│  │
│  ├─ Calendar Heatmap
│  │  └─ GitHub-style contribution graph
│  │
│  ├─ Current Streak: 7 days 🔥
│  ├─ Longest Streak: 28 days
│  └─ Adherence Rate: 85%
│
└─ Body Metrics (if tracked)
   ├─ Bodyweight Trend
   ├─ Body Measurements
   └─ Progress Photos
```

**Interaction Details:**
- **Tap Charts:** Show exact values for that point
- **Filter Data:** Toggle muscle groups on/off in charts
- **Share:** Export charts as images for social media
- **Deep Dive:** Tap any stat to see detailed breakdown

---

### Flow 6: Exploring Exercise Library

```
Dashboard → Exercise Library Tab
│
├─ Search Bar
│  └─ "Search 1000+ exercises..."
│
├─ Browse by Muscle Group
│  │
│  ├─ 💪 Chest (45 exercises)
│  ├─ 🏋️ Back (67 exercises)
│  ├─ 🦵 Legs (89 exercises)
│  ├─ 💪 Shoulders (52 exercises)
│  ├─ 💪 Arms (58 exercises)
│  └─ 🏃 Cardio (23 exercises)
│
├─ Browse by Equipment
│  ├─ Barbell (124 exercises)
│  ├─ Dumbbell (156 exercises)
│  ├─ Bodyweight (89 exercises)
│  └─ [View All Equipment]
│
└─ Your Custom Exercises
   └─ [+ Create Custom Exercise]

[User taps "💪 Chest"]
│
Chest Exercises List
│
├─ Filters
│  ├─ Equipment: [All] [Barbell] [Dumbbell] [Machine]
│  ├─ Difficulty: [All] [Beginner] [Intermediate] [Advanced]
│  └─ Sort: [A-Z] [Popular] [Recently Used]
│
├─ Exercise Cards (scrollable)
│  │
│  ├─ Bench Press (Barbell) ⭐ Popular
│  │  ├─ [Thumbnail/GIF]
│  │  ├─ Equipment: Barbell, Bench
│  │  ├─ Difficulty: Intermediate
│  │  ├─ Last used: 2 days ago
│  │  └─ [View Details]
│  │
│  └─ Incline Dumbbell Press
│     └─ ...

[User taps "Bench Press (Barbell)"]
│
Exercise Details Screen
│
├─ Header
│  ├─ Bench Press (Barbell)
│  ├─ ⭐ Favorite (toggle)
│  └─ [Add to Workout]
│
├─ Media
│  ├─ Video Demo (auto-play, looped)
│  └─ [📷 Switch to Photo]
│
├─ Info Section
│  ├─ Primary Muscles: Chest
│  ├─ Secondary Muscles: Shoulders, Triceps
│  ├─ Equipment: Barbell, Bench, Rack
│  ├─ Difficulty: Intermediate
│  └─ Category: Compound Press
│
├─ Instructions (Tabs)
│  │
│  ├─ Setup Tab
│  │  ├─ 1. Lie flat on bench
│  │  ├─ 2. Grip bar slightly wider than shoulders
│  │  └─ 3. Feet flat on floor...
│  │
│  ├─ Execution Tab
│  │  ├─ 1. Unrack and hold over chest
│  │  ├─ 2. Lower to mid-chest with control
│  │  └─ 3. Press back up explosively...
│  │
│  └─ Tips Tab
│     ├─ ✓ Keep shoulder blades retracted
│     ├─ ✓ Maintain slight arch in lower back
│     ├─ ⚠️ Avoid: Bouncing bar off chest
│     └─ ⚠️ Avoid: Flaring elbows too wide
│
├─ Your History (if available)
│  ├─ Last Performed: 2 days ago
│  ├─ Best Set: 90kg x 5
│  ├─ Estimated 1RM: 102kg
│  ├─ Total Volume (all-time): 24,560kg
│  └─ [View Full History]
│
├─ Variations
│  ├─ Incline Bench Press
│  ├─ Decline Bench Press
│  ├─ Close-Grip Bench Press
│  └─ [View All Variations]
│
└─ Bottom Actions
   ├─ [Add to Current Workout]
   ├─ [Start Workout with This]
   └─ [⋯] More (Share, Report Issue)
```

**Key Features:**
- **Rich Media:** High-quality videos and images
- **Contextual History:** Show user's own data for that exercise
- **Related Exercises:** Help discover variations
- **Quick Actions:** Start workout or add to current session

---

## Secondary Flows

### Flow 7: Managing Workout Templates

```
Dashboard → Templates Tab
│
├─ Your Templates (list)
│  ├─ Push Day (used 12 times)
│  ├─ Pull Day (used 11 times)
│  ├─ Leg Day (used 10 times)
│  └─ [+ Create Template]
│
└─ [User long-press "Push Day"]

Template Actions Modal
│
├─ [Start Workout]
├─ [Edit Template]
├─ [Duplicate]
├─ [Share]
├─ [Delete]
└─ [Cancel]

[Edit Template]
│
Template Editor
│
├─ Template Name: [Push Day]
├─ Description: [Upper body push movements]
├─ Tags: [#strength #compound]
│
├─ Exercises (reorderable)
│  ├─ [⋮] Bench Press
│  │   ├─ Target: 4 sets x 8 reps
│  │   ├─ Rest: 90 seconds
│  │   └─ [✕] Remove
│  │
│  └─ [+ Add Exercise]
│
└─ [Save Changes]
```

---

### Flow 8: Plate Calculator

```
During Workout
│
├─ User taps weight input for "Deadlift"
│
└─ Weight Input Modal
   ├─ Number Pad
   ├─ Current: 140 kg
   │
   └─ [🔧 Plate Calculator]

Plate Calculator
│
├─ Target Weight: [140 kg]
│
├─ Bar Type Selector
│  ├─ ⦿ Olympic (20kg)
│  ├─ ○ Women's (15kg)
│  └─ ○ EZ Bar (10kg)
│
├─ Available Plates
│  ├─ ☑ 25kg x 4
│  ├─ ☑ 20kg x 4
│  ├─ ☑ 15kg x 2
│  ├─ ☑ 10kg x 4
│  ├─ ☑ 5kg x 4
│  ├─ ☑ 2.5kg x 4
│  └─ ☑ 1.25kg x 4
│
├─ Result
│  │
│  ├─ Load Each Side:
│  │  ├─ 2 × 25kg
│  │  ├─ 1 × 20kg
│  │  ├─ 1 × 10kg
│  │  └─ 1 × 5kg
│  │  = 60kg per side + 20kg bar = 140kg total
│  │
│  └─ Visual Bar Representation
│     [========|========] (20kg bar)
│      25 20 10 5 | 5 10 20 25
│
└─ [Use This Weight]
```

---

## Error States & Edge Cases

### No Internet Connection
```
App Behavior:
├─ Full offline functionality maintained
├─ "Offline Mode" indicator in header
├─ Workout data saved locally
├─ Sync queue shows pending items
└─ Auto-sync when connection restored
```

### Empty States
```
1. No Workout History
   ├─ Illustration
   ├─ "Start your fitness journey"
   ├─ [Start First Workout]
   └─ [Browse Programs]

2. No Templates
   ├─ "Create a template to start workouts faster"
   └─ [Create First Template]

3. No Programs Enrolled
   ├─ "Follow a structured program to reach your goals"
   └─ [Browse Programs]
```

### Interrupted Workouts
```
User closes app mid-workout
│
├─ Workout auto-saved
│
└─ On App Reopen
   ├─ Modal: "You have an incomplete workout"
   ├─ Workout: Push Day (started 23m ago)
   ├─ Progress: 3/5 exercises completed
   │
   ├─ [Continue Workout]
   ├─ [Discard]
   └─ [Save as Draft]
```

---

## Key UX Principles

### Speed First
- Minimize taps to complete common actions
- Pre-fill data from previous workouts
- Keyboard shortcuts (web/tablet)
- Swipe gestures for power users

### Progressive Disclosure
- Show basic features first
- Advanced features behind "More" or long-press
- Contextual tips for new users
- Don't overwhelm beginners

### Feedback & Delight
- Haptic feedback on actions
- Micro-animations for state changes
- Celebration for PRs
- Streak maintenance encouragement

### Flexibility
- Support multiple workout styles
- Don't force templates or programs
- Allow deviation from plans
- Easy to customize everything

### Data Confidence
- Always show where data came from
- Clear "last workout" references
- Undo/redo for mistakes
- Confirmation for destructive actions
