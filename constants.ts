
import { Exercise, WorkoutSession, Program } from './types';

export const EXERCISE_LIBRARY: Exercise[] = [
  { 
    id: 'e1', 
    name: 'Barbell Bench Press', 
    muscleGroup: 'Chest', 
    secondaryMuscles: ['Shoulders', 'Arms'],
    equipment: 'Barbell', 
    category: 'Compound',
    difficulty: 'Intermediate',
    formGuide: [
      "Lie on the bench with your eyes under the bar.",
      "Grip the bar slightly wider than shoulder-width.",
      "Unrack the bar and lower it slowly to your mid-chest.",
      "Press the bar back up explosively to the starting position."
    ],
    commonMistakes: [
      "Flaring elbows out too wide (puts stress on shoulders).",
      "Bouncing the bar off the chest.",
      "Lifting hips off the bench."
    ],
    tips: [
      "Keep your feet planted firmly on the ground.",
      "Retract your shoulder blades to create a stable base.",
      "Imagine pushing yourself away from the bar."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BENCH+PRESS"
  },
  { 
    id: 'e2', 
    name: 'Incline Dumbbell Press', 
    muscleGroup: 'Chest', 
    secondaryMuscles: ['Shoulders', 'Arms'],
    equipment: 'Dumbbell', 
    category: 'Compound',
    difficulty: 'Beginner',
    formGuide: [
      "Set bench to 30-45 degree incline.",
      "Lift dumbbells to shoulder height, palms facing forward.",
      "Press weights up until arms are extended.",
      "Lower slowly to shoulder height."
    ],
    commonMistakes: [
      "Setting the bench angle too steep (shifts focus to shoulders).",
      "Clanging weights together at the top.",
      "Arching back excessively."
    ],
    tips: [
      "Control the eccentric (lowering) phase.",
      "Keep wrists straight, not bent back."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=INCLINE+DB+PRESS"
  },
  { 
    id: 'e3', 
    name: 'Pull Up', 
    muscleGroup: 'Back', 
    secondaryMuscles: ['Arms'],
    equipment: 'Bodyweight', 
    category: 'Compound',
    difficulty: 'Intermediate',
    formGuide: [
      "Grab the bar with an overhand grip, slightly wider than shoulders.",
      "Hang with arms fully extended.",
      "Pull yourself up until your chin is over the bar.",
      "Lower yourself back down with control."
    ],
    commonMistakes: [
      "Kicking legs for momentum (kipping).",
      "Not going through full range of motion.",
      "Rounding shoulders forward."
    ],
    tips: [
      "Initiate the movement by driving elbows down.",
      "Squeeze your glutes to keep your body stable."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PULL+UP"
  },
  { 
    id: 'e4', 
    name: 'Barbell Squat', 
    muscleGroup: 'Legs', 
    secondaryMuscles: ['Core', 'Back'],
    equipment: 'Barbell', 
    category: 'Compound',
    difficulty: 'Advanced',
    formGuide: [
      "Place bar on upper back (traps).",
      "Stand with feet shoulder-width apart, toes slightly out.",
      "Break at hips and knees simultaneously to lower.",
      "Keep chest up and back straight.",
      "Drive back up through heels."
    ],
    commonMistakes: [
      "Knees caving inward (valgus collapse).",
      "Rounding the lower back (butt wink).",
      "Heels lifting off the floor."
    ],
    tips: [
      "Take a deep breath and brace your core before descending.",
      "Look straight ahead or slightly down, not up."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BARBELL+SQUAT"
  },
  { 
    id: 'e5', 
    name: 'Deadlift', 
    muscleGroup: 'Back', 
    secondaryMuscles: ['Legs', 'Core'],
    equipment: 'Barbell', 
    category: 'Compound',
    difficulty: 'Advanced',
    formGuide: [
      "Stand with mid-foot under the bar.",
      "Hinge at hips to grab the bar just outside legs.",
      "Bend knees until shins touch the bar.",
      "Lift chest, flatten back.",
      "Drive floor away to stand up tall."
    ],
    commonMistakes: [
      "Rounding the back like a scared cat.",
      "Jerking the bar off the floor.",
      "Hyperextending the back at the top."
    ],
    tips: [
      "Think about pushing the floor away, not pulling the bar up.",
      "Keep the bar close to your body throughout the lift."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DEADLIFT"
  },
  { 
    id: 'e6', 
    name: 'Dumbbell Shoulder Press', 
    muscleGroup: 'Shoulders', 
    secondaryMuscles: ['Arms'],
    equipment: 'Dumbbell', 
    category: 'Compound',
    difficulty: 'Beginner',
    formGuide: [
      "Sit on a bench with back support.",
      "Hold dumbbells at shoulder height, palms forward.",
      "Press straight up until arms touch ears.",
      "Lower back down under control."
    ],
    commonMistakes: [
      "Arching lower back excessively.",
      "Pressing weights forward instead of straight up.",
      "Using momentum."
    ],
    tips: [
      "Keep core tight.",
      "Don't lock out elbows completely at the top."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DB+SHOULDER+PRESS"
  },
  { 
    id: 'e7', 
    name: 'Tricep Rope Pushdown', 
    muscleGroup: 'Arms', 
    secondaryMuscles: [],
    equipment: 'Cable', 
    category: 'Isolation',
    difficulty: 'Beginner',
    formGuide: [
      "Attach rope to high pulley.",
      "Grab rope ends, elbows tucked by sides.",
      "Extend arms down, separating rope at bottom.",
      "Return slowly to start."
    ],
    commonMistakes: [
      "Letting elbows drift forward or backward.",
      "Using bodyweight to push down."
    ],
    tips: [
      "Keep elbows glued to your ribs.",
      "Focus on squeezing triceps at the bottom."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TRICEP+PUSHDOWN"
  },
  { 
    id: 'e8', 
    name: 'Bicep Curl', 
    muscleGroup: 'Arms', 
    secondaryMuscles: [],
    equipment: 'Dumbbell', 
    category: 'Isolation',
    difficulty: 'Beginner',
    formGuide: [
      "Stand with dumbbells at sides.",
      "Curl weights towards shoulders while rotating palms up.",
      "Squeeze biceps at top.",
      "Lower slowly."
    ],
    commonMistakes: [
      "Swinging body to lift weight.",
      "Elbows moving forward."
    ],
    tips: [
      "Keep elbows stationary.",
      "Focus on the mind-muscle connection."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BICEP+CURL"
  },
  { 
    id: 'e9', 
    name: 'Leg Extension', 
    muscleGroup: 'Legs', 
    secondaryMuscles: [],
    equipment: 'Machine', 
    category: 'Machine',
    difficulty: 'Beginner',
    formGuide: [
      "Adjust seat so knees align with pivot point.",
      "Extend legs until straight.",
      "Pause briefly at the top.",
      "Lower weight without letting stack touch."
    ],
    commonMistakes: [
      "Kicking weight up fast.",
      "Lifting hips off seat."
    ],
    tips: [
      "Control the negative.",
      "Toes pointed up."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LEG+EXTENSION"
  },
  { 
    id: 'e10', 
    name: 'Plank', 
    muscleGroup: 'Core', 
    secondaryMuscles: ['Shoulders'],
    equipment: 'Bodyweight', 
    category: 'Bodyweight',
    difficulty: 'Beginner',
    formGuide: [
      "Assume push-up position but on forearms.",
      "Keep body in straight line from head to heels.",
      "Engage core and glutes.",
      "Hold for time."
    ],
    commonMistakes: [
      "Hips sagging down.",
      "Butt sticking up in air.",
      "Holding breath."
    ],
    tips: [
      "Pull belly button to spine.",
      "Don't look up; keep neck neutral."
    ],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PLANK"
  },
  {
    id: 'e11',
    name: 'Romanian Deadlift',
    muscleGroup: 'Legs',
    secondaryMuscles: ['Back'],
    equipment: 'Barbell',
    category: 'Compound',
    difficulty: 'Intermediate',
    formGuide: [
      "Hold bar at hip level.",
      "Hinge hips back while keeping legs slightly bent.",
      "Lower bar until hamstring stretch is felt.",
      "Drive hips forward to return to start."
    ],
    commonMistakes: ["Rounding back", "Bending knees too much (squatting)", "Bar drifting away from legs"],
    tips: ["Imagine closing a car door with your butt.", "Keep lats engaged."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ROMANIAN+DEADLIFT"
  },
  {
    id: 'e12',
    name: 'Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    category: 'Isolation',
    difficulty: 'Beginner',
    formGuide: [
      "Stand with DBs at sides.",
      "Raise arms to sides until parallel with floor.",
      "Lower slowly."
    ],
    commonMistakes: ["Using momentum", "Raising hands higher than elbows", "Shrugging traps"],
    tips: ["Pour the pitcher at the top (slight internal rotation).", "Lead with elbows."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LATERAL+RAISE"
  },
  {
    id: 'e13',
    name: 'Leg Press',
    muscleGroup: 'Legs',
    secondaryMuscles: [],
    equipment: 'Machine',
    category: 'Machine',
    difficulty: 'Beginner',
    formGuide: [
      "Sit in machine, feet shoulder width on platform.",
      "Lower safety bars.",
      "Lower weight until knees are near chest.",
      "Press back up without locking knees."
    ],
    commonMistakes: ["Locking knees at top", "Lifting lower back off pad", "Range of motion too short"],
    tips: ["Push through heels.", "Keep hands on handles, not knees."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LEG+PRESS"
  },
  {
    id: 'e14',
    name: 'Face Pull',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Back'],
    equipment: 'Cable',
    category: 'Isolation',
    difficulty: 'Intermediate',
    formGuide: [
      "Set rope to eye level.",
      "Pull rope towards forehead, separating hands.",
      "External rotate shoulders at end range."
    ],
    commonMistakes: ["Pulling to chin/chest", "Going too heavy", "Using biceps"],
    tips: ["Think 'double bicep pose' at the back.", "Squeeze rear delts."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FACE+PULL"
  },
  {
    id: 'e15',
    name: 'Hammer Curl',
    muscleGroup: 'Arms',
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    category: 'Isolation',
    difficulty: 'Beginner',
    formGuide: [
      "Hold DBs with neutral grip (palms facing body).",
      "Curl weight up keeping palms facing each other.",
      "Lower controlled."
    ],
    commonMistakes: ["Swinging", "Elbows moving forward"],
    tips: ["Targets brachialis and forearm.", "Keep elbows pinned."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HAMMER+CURL"
  },
  {
    id: 'e16',
    name: 'Overhead Barbell Press',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Arms', 'Core'],
    equipment: 'Barbell',
    category: 'Compound',
    difficulty: 'Intermediate',
    formGuide: [
      "Start with bar resting on front delts.",
      "Tighten core and glutes.",
      "Press bar vertically, moving head back to clear path.",
      "Lock out overhead and bring head back to neutral."
    ],
    commonMistakes: ["Arching lower back excessively", "Pressing bar forward", "Using leg drive (unless Push Press)"],
    tips: ["Squeeze glutes to protect lower back.", "Keep forearms vertical."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=OHP"
  },
  {
    id: 'e17',
    name: 'Bulgarian Split Squat',
    muscleGroup: 'Legs',
    secondaryMuscles: ['Core'],
    equipment: 'Dumbbell',
    category: 'Compound',
    difficulty: 'Advanced',
    formGuide: [
      "Place rear foot on bench.",
      "Hold DBs at sides.",
      "Lower hips until rear knee nears floor.",
      "Drive up through front heel."
    ],
    commonMistakes: ["Front foot too close to bench", "Hips rotating", "Leaning too far forward"],
    tips: ["Lean forward slightly for glutes, stay upright for quads.", "Find balance before adding weight."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SPLIT+SQUAT"
  },
  {
    id: 'e18',
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    secondaryMuscles: ['Arms'],
    equipment: 'Machine',
    category: 'Machine',
    difficulty: 'Beginner',
    formGuide: [
      "Grip bar wider than shoulders.",
      "Sit down and secure knees under pads.",
      "Pull bar to upper chest.",
      "Control bar back up."
    ],
    commonMistakes: ["Leaning back too far", "Using momentum", "Pulling bar too low (to belly)"],
    tips: ["Drive elbows down and back.", "Keep chest up to engage lats."],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LAT+PULLDOWN"
  },
  {
      id: 'e19',
      name: 'Barbell Row',
      muscleGroup: 'Back',
      secondaryMuscles: ['Arms', 'Core'],
      equipment: 'Barbell',
      category: 'Compound',
      difficulty: 'Intermediate',
      formGuide: ["Hinge at hips to 45 degrees.", "Grip bar slightly wide.", "Pull bar to stomach.", "Lower controlled."],
      commonMistakes: ["Standing too upright", "Jerking the weight"],
      tips: ["Squeeze shoulder blades at top.", "Keep spine neutral."],
      gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BARBELL+ROW"
  },
  {
      id: 'e20',
      name: 'Seated Calf Raise',
      muscleGroup: 'Legs',
      secondaryMuscles: [],
      equipment: 'Machine',
      category: 'Isolation',
      difficulty: 'Beginner',
      formGuide: ["Sit with knees under pads.", "Lower heels until stretched.", "Press up onto toes."],
      commonMistakes: ["Partial range of motion", "Bouncing"],
      tips: ["Pause at the top and bottom.", "Focus on the stretch."],
      gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CALF+RAISE"
  },
  {
      id: 'e21',
      name: 'Front Squat',
      muscleGroup: 'Legs',
      secondaryMuscles: ['Core', 'Back'],
      equipment: 'Barbell',
      category: 'Compound',
      difficulty: 'Advanced',
      formGuide: ["Rest bar on front delts.", "Keep elbows high.", "Squat deep while staying upright."],
      commonMistakes: ["Elbows dropping", "Upper back rounding"],
      tips: ["Requires good wrist/lat mobility.", "Focus on keeping chest up."],
      gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FRONT+SQUAT"
  },
  {
      id: 'e22',
      name: 'Sumo Deadlift',
      muscleGroup: 'Legs',
      secondaryMuscles: ['Back'],
      equipment: 'Barbell',
      category: 'Compound',
      difficulty: 'Advanced',
      formGuide: ["Wide stance, toes out.", "Grip bar inside knees.", "Wedge hips in.", "Drive legs to stand."],
      commonMistakes: ["Rounding back", "Hips rising too fast"],
      tips: ["More quad/glute dominant than conventional.", "Keep torso upright."],
      gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SUMO+DEADLIFT"
  },
  {
      id: 'e23',
      name: 'Close Grip Bench Press',
      muscleGroup: 'Arms',
      secondaryMuscles: ['Chest', 'Shoulders'],
      equipment: 'Barbell',
      category: 'Compound',
      difficulty: 'Intermediate',
      formGuide: ["Grip shoulder width.", "Lower to lower chest.", "Keep elbows tucked.", "Press up."],
      commonMistakes: ["Grip too narrow (wrist pain)", "Elbows flaring"],
      tips: ["Primary tricep mass builder.", "Focus on locking out."],
      gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CG+BENCH"
  },

  // === CHEST EXERCISES (10 more) ===
  { id: 'e24', name: 'Cable Chest Fly', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Set cables to chest height", "Step forward with slight lean", "Bring handles together in front", "Control the return"],
    commonMistakes: ["Using too much weight", "Bending elbows excessively", "Not controlling the stretch"],
    tips: ["Focus on the squeeze at peak contraction", "Keep slight elbow bend throughout"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+FLY" },

  { id: 'e25', name: 'Dumbbell Chest Fly', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie flat on bench", "Start with dumbbells above chest", "Lower in wide arc", "Bring back together at top"],
    commonMistakes: ["Going too heavy", "Straightening arms", "Dropping too low"],
    tips: ["Imagine hugging a tree", "Control the negative"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DB+FLY" },

  { id: 'e26', name: 'Decline Barbell Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Set bench to 15-30 degree decline", "Secure feet under pads", "Lower to lower chest", "Press straight up"],
    commonMistakes: ["Going too steep", "Bouncing bar off chest", "Flaring elbows"],
    tips: ["Targets lower chest", "Use spotter for safety"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DECLINE+PRESS" },

  { id: 'e27', name: 'Pec Deck Machine', muscleGroup: 'Chest', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Adjust seat so handles at chest height", "Press back against pad", "Bring handles together", "Control the return"],
    commonMistakes: ["Seat too low/high", "Using momentum", "Not achieving full contraction"],
    tips: ["Great for mind-muscle connection", "Pause at peak squeeze"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PEC+DECK" },

  { id: 'e28', name: 'Chest Dips', muscleGroup: 'Chest', secondaryMuscles: ['Arms', 'Shoulders'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Lean forward 30 degrees", "Lower until shoulders below elbows", "Press back up", "Keep core tight"],
    commonMistakes: ["Staying too upright (hits triceps)", "Going too deep", "Swinging legs"],
    tips: ["Lean targets chest", "Add weight for progression"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CHEST+DIPS" },

  { id: 'e29', name: 'Push-Up', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Arms', 'Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hands shoulder width", "Body straight line", "Lower chest to floor", "Push back up"],
    commonMistakes: ["Sagging hips", "Flaring elbows", "Not going deep enough"],
    tips: ["Excellent warm-up exercise", "Endless progression options"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PUSH+UP" },

  { id: 'e30', name: 'Landmine Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Core'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Stand with barbell in landmine", "Press bar from shoulder", "Follow natural arc", "Control descent"],
    commonMistakes: ["Pressing straight up", "Losing core tension", "Overloading weight"],
    tips: ["Shoulder-friendly pressing", "Great for athletes"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LANDMINE" },

  { id: 'e31', name: 'Cable Crossover Low to High', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Set cables at bottom", "Grab handles", "Bring up and across chest", "Squeeze at top"],
    commonMistakes: ["Too much weight", "Not crossing over enough", "Jerky movements"],
    tips: ["Targets upper chest", "Keep constant tension"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+LOW+HIGH" },

  { id: 'e32', name: 'Machine Chest Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Adjust seat height", "Grip handles", "Press forward", "Control return"],
    commonMistakes: ["Seat wrong height", "Partial reps", "Too fast tempo"],
    tips: ["Safer alternative to barbell", "Great for drop sets"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=MACHINE+PRESS" },

  { id: 'e33', name: 'Incline Cable Fly', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Set bench to 30-45 degrees", "Cables at bottom position", "Bring handles up and together", "Squeeze at peak"],
    commonMistakes: ["Angle too steep", "Locking out elbows", "Using too much weight"],
    tips: ["Isolates upper chest", "Constant tension advantage"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=INCLINE+CABLE+FLY" },

  // === BACK EXERCISES (15 more) ===
  { id: 'e34', name: 'T-Bar Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Straddle bar", "Hinge at hips", "Pull bar to chest", "Squeeze shoulder blades"],
    commonMistakes: ["Rounding back", "Using too much English", "Not achieving full contraction"],
    tips: ["Thick back builder", "Keep chest up"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=T-BAR+ROW" },

  { id: 'e35', name: 'Seated Cable Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Cable', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Sit with feet on platform", "Grab handle", "Pull to abdomen", "Extend arms fully"],
    commonMistakes: ["Rocking body", "Shrugging shoulders", "Not retracting scapula"],
    tips: ["Focus on pulling elbows back", "Keep torso upright"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+ROW" },

  { id: 'e36', name: 'Single Arm Dumbbell Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Place knee and hand on bench", "Pull dumbbell to hip", "Squeeze at top", "Lower with control"],
    commonMistakes: ["Rotating torso", "Using momentum", "Not pulling high enough"],
    tips: ["Fixes imbalances", "Great lat builder"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DB+ROW" },

  { id: 'e37', name: 'Chest Supported Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Lie chest on incline bench", "Let arms hang", "Pull dumbbells up", "Squeeze scapula together"],
    commonMistakes: ["Bench angle too steep", "Using momentum", "Incomplete range of motion"],
    tips: ["Removes lower back from equation", "Pure back isolation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CHEST+ROW" },

  { id: 'e38', name: 'Wide Grip Pull Up', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Grip wider than shoulders", "Pull chest to bar", "Control descent", "Full hang at bottom"],
    commonMistakes: ["Not going full range", "Kipping excessively", "Shrugging shoulders"],
    tips: ["Lat width developer", "Use assistance if needed"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WIDE+PULLUP" },

  { id: 'e39', name: 'Chin Up', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Underhand grip shoulder width", "Pull chin over bar", "Squeeze biceps and lats", "Lower controlled"],
    commonMistakes: ["Not achieving full ROM", "Using momentum", "Incomplete lockout"],
    tips: ["Easier than pull-ups", "Great bicep activation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CHIN+UP" },

  { id: 'e40', name: 'Meadows Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Stand perpendicular to landmine", "Pull bar to hip", "Rotate torso slightly", "Control negative"],
    commonMistakes: ["Rotating too much", "Not achieving contraction", "Poor positioning"],
    tips: ["Unilateral back thickness", "Named after John Meadows"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=MEADOWS+ROW" },

  { id: 'e41', name: 'Inverted Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hang under barbell in rack", "Pull chest to bar", "Keep body straight", "Lower controlled"],
    commonMistakes: ["Sagging hips", "Not pulling high enough", "Using momentum"],
    tips: ["Scalable difficulty", "Great for beginners"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=INVERTED+ROW" },

  { id: 'e42', name: 'Seal Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Lie face down on elevated bench", "Grab barbell below", "Pull to chest", "Squeeze scapula"],
    commonMistakes: ["Not staying flat", "Using leg drive", "Incomplete squeeze"],
    tips: ["Zero lower back involvement", "Pure back work"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SEAL+ROW" },

  { id: 'e43', name: 'Straight Arm Pulldown', muscleGroup: 'Back', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Stand at cable stack", "Arms straight grab bar", "Pull down to thighs", "Control the return"],
    commonMistakes: ["Bending elbows", "Using too much weight", "Not achieving lat stretch"],
    tips: ["Great lat activation", "Focus on lats not arms"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=STRAIGHT+PULLDOWN" },

  { id: 'e44', name: 'Pendlay Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Bar on floor each rep", "Explosive pull to chest", "Return to floor", "Reset position"],
    commonMistakes: ["Not touching floor", "Rounding back", "Slow tempo"],
    tips: ["Power and explosiveness", "Dead stop each rep"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PENDLAY+ROW" },

  { id: 'e45', name: 'Machine Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Adjust chest pad", "Grab handles", "Pull to torso", "Squeeze scapula"],
    commonMistakes: ["Moving torso", "Partial range", "Going too heavy"],
    tips: ["Stable platform", "Great for drop sets"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=MACHINE+ROW" },

  { id: 'e46', name: 'Cable Face Pull High', muscleGroup: 'Back', secondaryMuscles: ['Shoulders'], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Set cable high", "Rope attachment", "Pull to face", "Externally rotate"],
    commonMistakes: ["Using too much weight", "Not rotating", "Pulling to chest"],
    tips: ["Rear delt and upper back", "Crucial for shoulder health"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FACE+PULL" },

  { id: 'e47', name: 'Kroc Row', muscleGroup: 'Back', secondaryMuscles: ['Arms', 'Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Heavy dumbbell", "Use straps", "Cheat reps allowed", "High rep range"],
    commonMistakes: ["Going too light", "Perfect form (not the goal)", "Low reps"],
    tips: ["Brutal back builder", "15-30 rep range"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=KROC+ROW" },

  { id: 'e48', name: 'Rack Pull', muscleGroup: 'Back', secondaryMuscles: ['Legs'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Set bar at knee height", "Pull like deadlift", "Focus on lockout", "Control descent"],
    commonMistakes: ["Starting too low", "Rounding back", "Using straps too early"],
    tips: ["Deadlift accessory", "Overload the lockout"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=RACK+PULL" },

  // === SHOULDER EXERCISES (12 more) ===
  { id: 'e49', name: 'Arnold Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Arms'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Start palms facing you", "Press up while rotating", "End palms forward", "Reverse on descent"],
    commonMistakes: ["Using too much weight", "Not rotating fully", "Poor shoulder mobility"],
    tips: ["Hits all three delt heads", "Named after Arnold Schwarzenegger"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ARNOLD+PRESS" },

  { id: 'e50', name: 'Barbell Upright Row', muscleGroup: 'Shoulders', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Narrow grip", "Pull bar to chin", "Lead with elbows", "Lower controlled"],
    commonMistakes: ["Grip too narrow (shoulder pain)", "Using momentum", "Not lifting high enough"],
    tips: ["Controversial exercise", "Wide grip safer for shoulders"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=UPRIGHT+ROW" },

  { id: 'e51', name: 'Barbell Shrug', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hold bar in front", "Shrug shoulders up", "Pause at top", "Lower controlled"],
    commonMistakes: ["Rolling shoulders", "Using arms", "Not achieving full contraction"],
    tips: ["Trap builder", "Go heavy with control"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SHRUG" },

  { id: 'e52', name: 'Reverse Pec Deck Fly', muscleGroup: 'Shoulders', secondaryMuscles: ['Back'], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Face machine", "Chest on pad", "Pull handles back", "Squeeze rear delts"],
    commonMistakes: ["Using too much weight", "Not achieving full contraction", "Rounding back"],
    tips: ["Best rear delt isolation", "Balance front delt work"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REVERSE+DECK" },

  { id: 'e53', name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Grab cable with opposite hand", "Raise arm to side", "Control descent", "Constant tension"],
    commonMistakes: ["Using too much weight", "Leaning away", "Not controlling negative"],
    tips: ["Superior to dumbbell version", "Constant tension advantage"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+LATERAL" },

  { id: 'e54', name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Adjust seat", "Grip handles", "Press up", "Lower controlled"],
    commonMistakes: ["Seat too low/high", "Partial range", "Going too heavy"],
    tips: ["Stable pressing platform", "Great for burnouts"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=MACHINE+SHOULDER" },

  { id: 'e55', name: 'Front Raise', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Arms straight", "Raise to eye level", "Control descent", "Alternate or together"],
    commonMistakes: ["Going too high", "Using momentum", "Too much weight"],
    tips: ["Front delt isolation", "Often gets enough work from pressing"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FRONT+RAISE" },

  { id: 'e56', name: 'Bent Over Rear Delt Fly', muscleGroup: 'Shoulders', secondaryMuscles: ['Back'], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Bend at hips", "Raise dumbbells to side", "Squeeze rear delts", "Control descent"],
    commonMistakes: ["Standing too upright", "Using arms", "Too much weight"],
    tips: ["Critical for shoulder balance", "Keep torso parallel to floor"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REAR+DELT+FLY" },

  { id: 'e57', name: 'Seated Dumbbell Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Arms'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Sit with back support", "Press dumbbells up", "Bring together at top", "Lower to shoulders"],
    commonMistakes: ["Arching back", "Banging weights", "Incomplete range"],
    tips: ["Stable pressing", "Less core demand than standing"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SEATED+DB+PRESS" },

  { id: 'e58', name: 'Bradford Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Press from front", "Lower to back of head", "Press up", "Return to front"],
    commonMistakes: ["Going too heavy", "Hitting head", "Poor shoulder mobility"],
    tips: ["Constant tension", "Light weight only"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BRADFORD" },

  { id: 'e59', name: 'Cable Face Pull Low', muscleGroup: 'Shoulders', secondaryMuscles: ['Back'], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Cable at waist height", "Rope attachment", "Pull to face", "External rotation"],
    commonMistakes: ["Too much weight", "Not rotating", "Using arms"],
    tips: ["Different angle than high version", "Shoulder health"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FACE+PULL+LOW" },

  { id: 'e60', name: 'Dumbbell Shrug', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hold dumbbells at sides", "Shrug straight up", "Pause", "Lower slowly"],
    commonMistakes: ["Rolling shoulders", "Not going heavy enough", "Using arms"],
    tips: ["Better ROM than barbell", "Great for traps"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DB+SHRUG" },

  // === ARM EXERCISES (15 more) ===
  { id: 'e61', name: 'Barbell Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Grip shoulder width", "Curl to shoulders", "Keep elbows still", "Lower controlled"],
    commonMistakes: ["Swinging weight", "Moving elbows", "Not achieving full contraction"],
    tips: ["Classic bicep builder", "Go strict for best results"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BB+CURL" },

  { id: 'e62', name: 'Preacher Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Arm on preacher pad", "Curl up", "Full contraction", "Slow negative"],
    commonMistakes: ["Lifting butt off seat", "Partial reps", "Going too heavy"],
    tips: ["Eliminates cheating", "Great bicep peak"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PREACHER+CURL" },

  { id: 'e63', name: 'Concentration Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit with elbow on thigh", "Curl up", "Squeeze bicep", "Control down"],
    commonMistakes: ["Using momentum", "Not squeezing", "Too much weight"],
    tips: ["Pure isolation", "Mind-muscle connection"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CONCENTRATION" },

  { id: 'e64', name: 'Skull Crusher', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Lie on bench", "Lower bar to forehead", "Extend arms", "Keep elbows in"],
    commonMistakes: ["Elbows flaring", "Going too heavy", "Banging forehead"],
    tips: ["Mass builder for triceps", "EZ bar easier on wrists"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SKULL+CRUSHER" },

  { id: 'e65', name: 'Overhead Tricep Extension', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hold dumbbell overhead", "Lower behind head", "Extend up", "Keep elbows in"],
    commonMistakes: ["Elbows flaring out", "Going too heavy", "Not achieving stretch"],
    tips: ["Hits long head", "Great stretch position"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=OVERHEAD+TRICEP" },

  { id: 'e66', name: 'Cable Tricep Pushdown V-Bar', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Elbows at sides", "Push down", "Full lockout", "Control return"],
    commonMistakes: ["Leaning forward", "Elbows moving", "Partial reps"],
    tips: ["Classic tricep finisher", "Focus on squeeze"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=V-BAR+PUSHDOWN" },

  { id: 'e67', name: 'Cable Bicep Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Stand at cable", "Curl up", "Squeeze bicep", "Slow negative"],
    commonMistakes: ["Moving body", "Not achieving peak contraction", "Going too fast"],
    tips: ["Constant tension", "Great for drop sets"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+CURL" },

  { id: 'e68', name: 'Incline Dumbbell Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on incline bench", "Let arms hang", "Curl up", "Full stretch at bottom"],
    commonMistakes: ["Swinging weights", "Not achieving full stretch", "Elbows forward"],
    tips: ["Incredible bicep stretch", "Long head emphasis"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=INCLINE+CURL" },

  { id: 'e69', name: 'Spider Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Chest on incline bench", "Arms hang over top", "Curl up", "Full contraction"],
    commonMistakes: ["Using momentum", "Partial range", "Too much weight"],
    tips: ["Strict bicep isolation", "No cheating possible"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SPIDER+CURL" },

  { id: 'e70', name: 'Dumbbell Kickback', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hinge at hips", "Elbow at side", "Extend arm back", "Squeeze tricep"],
    commonMistakes: ["Using too much weight", "Moving elbow", "Not achieving full extension"],
    tips: ["Great tricep peak contraction", "Go light and squeeze"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=KICKBACK" },

  { id: 'e71', name: '21s Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["7 reps bottom half", "7 reps top half", "7 full reps", "No rest between"],
    commonMistakes: ["Going too heavy", "Poor form", "Not counting correctly"],
    tips: ["Brutal bicep pump", "Great finisher"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=21S" },

  { id: 'e72', name: 'Zottman Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Curl up palms up", "Rotate to palms down", "Lower slowly", "Rotate back"],
    commonMistakes: ["Going too heavy", "Not rotating fully", "Too fast tempo"],
    tips: ["Hits biceps and forearms", "Unique stimulus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ZOTTMAN" },

  { id: 'e73', name: 'Cable Overhead Tricep Extension', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Face away from cable", "Hands overhead", "Extend forward", "Control return"],
    commonMistakes: ["Elbows flaring", "Too much weight", "Not achieving full stretch"],
    tips: ["Long head emphasis", "Constant tension"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+OVERHEAD" },

  { id: 'e74', name: 'Dips Tricep Focus', muscleGroup: 'Arms', secondaryMuscles: ['Chest'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Stay upright", "Elbows back", "Lower until 90 degrees", "Push up"],
    commonMistakes: ["Leaning forward (chest)", "Going too deep", "Flaring elbows"],
    tips: ["Stay vertical for triceps", "Add weight for progression"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TRICEP+DIPS" },

  { id: 'e75', name: 'Reverse Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Overhand grip", "Curl to shoulders", "Keep wrists straight", "Lower controlled"],
    commonMistakes: ["Going too heavy", "Bending wrists", "Using momentum"],
    tips: ["Forearm and brachialis", "Arm thickness builder"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REVERSE+CURL" },

  // === LEG EXERCISES (20 more) ===
  { id: 'e76', name: 'Walking Lunge', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Step forward", "Lower back knee", "Push through front heel", "Step forward again"],
    commonMistakes: ["Short steps", "Knee going past toes", "Not lowering enough"],
    tips: ["Great for balance", "Functional movement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WALKING+LUNGE" },

  { id: 'e77', name: 'Hack Squat', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Position under pads", "Lower controlled", "Push through heels", "Full extension"],
    commonMistakes: ["Feet too far forward", "Not going deep", "Knees caving in"],
    tips: ["Quad focused", "Lower back friendly"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HACK+SQUAT" },

  { id: 'e78', name: 'Goblet Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hold dumbbell at chest", "Squat down", "Elbows inside knees", "Drive up"],
    commonMistakes: ["Not going deep", "Losing upright torso", "Heels lifting"],
    tips: ["Teaches proper squat form", "Great for beginners"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=GOBLET+SQUAT" },

  { id: 'e79', name: 'Leg Curl Lying', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie face down", "Hook ankles under pad", "Curl to glutes", "Lower slowly"],
    commonMistakes: ["Lifting hips", "Not achieving full contraction", "Going too fast"],
    tips: ["Hamstring isolation", "Control the negative"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LEG+CURL" },

  { id: 'e80', name: 'Box Jump', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Stand facing box", "Jump explosively", "Land softly", "Step down"],
    commonMistakes: ["Box too high", "Landing with straight legs", "Jumping down"],
    tips: ["Explosive power", "Always step down"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BOX+JUMP" },

  { id: 'e81', name: 'Reverse Lunge', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Step backward", "Lower back knee", "Push through front heel", "Return to start"],
    commonMistakes: ["Short step", "Knee past toes", "Losing balance"],
    tips: ["Easier balance than forward", "Quad emphasis"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REVERSE+LUNGE" },

  { id: 'e82', name: 'Nordic Hamstring Curl', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["Anchor feet", "Lower body forward", "Catch with hands", "Push back up"],
    commonMistakes: ["Going too fast", "Not controlling descent", "Bending at hips"],
    tips: ["Incredible hamstring builder", "Injury prevention"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=NORDIC+CURL" },

  { id: 'e83', name: 'Sissy Squat', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["Hold support", "Lean back", "Bend knees forward", "Control movement"],
    commonMistakes: ["Not leaning back enough", "Going too deep", "Losing balance"],
    tips: ["Quad isolation", "Not for everyone"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SISSY+SQUAT" },

  { id: 'e84', name: 'Landmine Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hold bar at chest", "Squat down", "Keep upright", "Drive up"],
    commonMistakes: ["Leaning forward", "Not going deep", "Heels lifting"],
    tips: ["Easier on back", "Great alternative"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LANDMINE+SQUAT" },

  { id: 'e85', name: 'Single Leg Press', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["One foot on platform", "Lower controlled", "Push through heel", "Full extension"],
    commonMistakes: ["Going too heavy", "Locking out knee", "Not going deep"],
    tips: ["Fixes imbalances", "Easier than pistol squats"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SINGLE+LEG+PRESS" },

  { id: 'e86', name: 'Step Up', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Step up onto box", "Drive through heel", "Stand fully", "Step down"],
    commonMistakes: ["Pushing off back leg", "Box too high", "Rushing reps"],
    tips: ["Functional movement", "Great for glutes"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=STEP+UP" },

  { id: 'e87', name: 'Safety Bar Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Bar on shoulders", "Grip handles", "Squat down", "Drive up"],
    commonMistakes: ["Not going deep", "Good morning squat", "Knees caving"],
    tips: ["Shoulder friendly", "More upright torso"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SAFETY+BAR" },

  { id: 'e88', name: 'Glute Bridge', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on back", "Bar over hips", "Thrust up", "Squeeze glutes"],
    commonMistakes: ["Not achieving full extension", "Using lower back", "Too much weight"],
    tips: ["Glute builder", "Hip thrust variation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=GLUTE+BRIDGE" },

  { id: 'e89', name: 'Pistol Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Stand on one leg", "Squat down", "Other leg extended", "Stand up"],
    commonMistakes: ["Not going deep", "Losing balance", "Poor mobility"],
    tips: ["Ultimate single leg test", "Requires flexibility"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PISTOL+SQUAT" },

  { id: 'e90', name: 'Wall Sit', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Back against wall", "Squat to 90 degrees", "Hold position", "Maintain tension"],
    commonMistakes: ["Not deep enough", "Feet too close", "Giving up too early"],
    tips: ["Quad endurance", "Timed holds"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WALL+SIT" },

  { id: 'e91', name: 'Standing Calf Raise', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Shoulders under pads", "Rise onto toes", "Full contraction", "Deep stretch"],
    commonMistakes: ["Bouncing", "Not achieving full ROM", "Going too heavy"],
    tips: ["Gastrocnemius focus", "Pause at top"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=STANDING+CALF" },

  { id: 'e92', name: 'Leg Press Calf Raise', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Toes on platform edge", "Extend ankles", "Full contraction", "Deep stretch"],
    commonMistakes: ["Locking knees", "Partial range", "Bouncing"],
    tips: ["Can go heavy safely", "Gastrocnemius focus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LEG+PRESS+CALF" },

  { id: 'e93', name: 'Donkey Calf Raise', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hinge at hips", "Toes on platform", "Rise onto toes", "Full stretch"],
    commonMistakes: ["Not bending enough", "Partial reps", "Bouncing"],
    tips: ["Incredible calf stretch", "Old school exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DONKEY+CALF" },

  { id: 'e94', name: 'Lying Leg Curl', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie prone", "Ankles under pad", "Curl to glutes", "Slow negative"],
    commonMistakes: ["Lifting hips", "Using momentum", "Partial range"],
    tips: ["Hamstring isolation", "Point toes for gastroc involvement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LYING+CURL" },

  { id: 'e95', name: 'Adductor Machine', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit with legs on pads", "Bring legs together", "Squeeze adductors", "Control return"],
    commonMistakes: ["Going too heavy", "Bouncing", "Not achieving full contraction"],
    tips: ["Inner thigh focus", "Injury prevention"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ADDUCTOR" },

  // === CORE EXERCISES (20) ===
  { id: 'e96', name: 'Cable Crunch', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Kneel facing cable", "Crunch down", "Round spine", "Hold contraction"],
    commonMistakes: ["Using hips", "Not rounding spine", "Going too heavy"],
    tips: ["Best weighted ab exercise", "Full ROM important"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+CRUNCH" },

  { id: 'e97', name: 'Hanging Leg Raise', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Hang from bar", "Raise legs to 90 degrees", "Control descent", "Avoid swinging"],
    commonMistakes: ["Using momentum", "Not raising high enough", "Swinging body"],
    tips: ["Lower ab focus", "Strict form critical"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HANGING+LEG" },

  { id: 'e98', name: 'Ab Wheel Rollout', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Start on knees", "Roll out slowly", "Maintain hollow body", "Pull back with abs"],
    commonMistakes: ["Sagging hips", "Going too far", "Using arms"],
    tips: ["Incredible core builder", "Progress slowly"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=AB+WHEEL" },

  { id: 'e99', name: 'Pallof Press', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Stand sideways to cable", "Press out", "Resist rotation", "Return to chest"],
    commonMistakes: ["Rotating torso", "Not fully extending", "Poor stance"],
    tips: ["Anti-rotation exercise", "Core stability"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PALLOF" },

  { id: 'e100', name: 'Russian Twist', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit with feet up", "Rotate side to side", "Touch weight to floor", "Controlled movement"],
    commonMistakes: ["Moving too fast", "Not rotating enough", "Feet on ground"],
    tips: ["Oblique focus", "Quality over speed"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=RUSSIAN+TWIST" },

  { id: 'e101', name: 'Dragon Flag', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["Lie on bench", "Hold behind head", "Raise body straight", "Lower with control"],
    commonMistakes: ["Bending at hips", "Going too fast", "Not enough strength"],
    tips: ["Bruce Lee favorite", "Extremely difficult"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DRAGON+FLAG" },

  { id: 'e102', name: 'Bicycle Crunch', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on back", "Bring opposite elbow to knee", "Alternate sides", "Controlled pace"],
    commonMistakes: ["Pulling on neck", "Too fast", "Not twisting enough"],
    tips: ["Great for obliques", "Popular ab exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BICYCLE" },

  { id: 'e103', name: 'Dead Bug', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on back", "Opposite arm and leg extend", "Keep lower back flat", "Alternate sides"],
    commonMistakes: ["Arching back", "Moving too fast", "Not fully extending"],
    tips: ["Core stability", "Deceptively hard"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DEAD+BUG" },

  { id: 'e104', name: 'L-Sit', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["Support on hands", "Legs straight out", "Hold position", "Keep shoulders down"],
    commonMistakes: ["Bending legs", "Rounding shoulders", "Not holding long enough"],
    tips: ["Gymnastic hold", "Incredible core strength"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=L-SIT" },

  { id: 'e105', name: 'Reverse Crunch', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on back", "Bring knees to chest", "Lift hips slightly", "Lower controlled"],
    commonMistakes: ["Using momentum", "Not lifting hips", "Going too fast"],
    tips: ["Lower ab focus", "Keep it controlled"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REVERSE+CRUNCH" },

  { id: 'e106', name: 'Landmine 180s', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Hold landmine bar", "Rotate side to side", "Control the weight", "Full range"],
    commonMistakes: ["Using arms", "Not rotating fully", "Too much weight"],
    tips: ["Rotational power", "Athletic movement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LANDMINE+180" },

  { id: 'e107', name: 'Decline Sit-Up', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Secure feet", "Sit up", "Lower controlled", "Full range"],
    commonMistakes: ["Using hip flexors", "Bouncing", "Not going full ROM"],
    tips: ["Increased difficulty", "Lock feet securely"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DECLINE+SITUP" },

  { id: 'e108', name: 'Mountain Climber', muscleGroup: 'Core', secondaryMuscles: ['Cardio'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Plank position", "Drive knees to chest", "Alternate quickly", "Keep hips down"],
    commonMistakes: ["Hips too high", "Going too slow", "Poor plank form"],
    tips: ["Cardio and core", "Great finisher"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=MOUNTAIN+CLIMBER" },

  { id: 'e109', name: 'Bird Dog', muscleGroup: 'Core', secondaryMuscles: ['Back'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Start on all fours", "Extend opposite arm and leg", "Hold", "Alternate sides"],
    commonMistakes: ["Rotating hips", "Not extending fully", "Going too fast"],
    tips: ["Balance and stability", "Rehab exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BIRD+DOG" },

  { id: 'e110', name: 'Side Plank', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on side", "Prop on elbow", "Lift hips", "Hold straight line"],
    commonMistakes: ["Sagging hips", "Not stacking feet", "Rolling forward/back"],
    tips: ["Oblique strength", "Timed holds"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SIDE+PLANK" },

  { id: 'e111', name: 'Plank', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Forearms on ground", "Straight body", "Squeeze glutes", "Hold position"],
    commonMistakes: ["Sagging hips", "Butt too high", "Not breathing"],
    tips: ["Core foundation", "Time under tension"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PLANK" },

  { id: 'e112', name: 'Hollow Body Hold', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Lie on back", "Arms overhead", "Legs straight", "Lift shoulders and legs"],
    commonMistakes: ["Arching back", "Bending knees", "Not holding long enough"],
    tips: ["Gymnastic fundamental", "Press lower back down"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HOLLOW+HOLD" },

  { id: 'e113', name: 'Weighted Sit-Up', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Hold weight at chest", "Sit up", "Lower controlled", "Full range"],
    commonMistakes: ["Using momentum", "Weight too heavy", "Pulling on neck"],
    tips: ["Progressive overload abs", "Anchor feet if needed"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WEIGHTED+SITUP" },

  { id: 'e114', name: 'Toes to Bar', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Hang from bar", "Bring toes to bar", "Control descent", "Use momentum strategically"],
    commonMistakes: ["Half reps", "Too much swing", "Grip giving out"],
    tips: ["CrossFit staple", "Hardest ab exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TOES+TO+BAR" },

  { id: 'e115', name: 'Windshield Wiper', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["Hang from bar", "Legs at 90 degrees", "Rotate side to side", "Control movement"],
    commonMistakes: ["Dropping legs", "Too much momentum", "Not enough rotation"],
    tips: ["Oblique destroyer", "Very advanced"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WINDSHIELD" },

  // === ADDITIONAL CHEST (5) ===
  { id: 'e116', name: 'Svend Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Squeeze plates together", "Press out", "Constant tension", "Return to chest"],
    commonMistakes: ["Not squeezing plates", "Going too heavy", "Poor posture"],
    tips: ["Inner chest focus", "Constant tension"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SVEND" },

  { id: 'e117', name: 'Floor Press', muscleGroup: 'Chest', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Lie on floor", "Press barbell up", "Pause arms on floor", "Explode up"],
    commonMistakes: ["Bouncing elbows", "Not pausing", "Going too heavy"],
    tips: ["Lockout strength", "Bench press accessory"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FLOOR+PRESS" },

  { id: 'e118', name: 'Guillotine Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Lower to neck", "Flare elbows", "Press up", "Control carefully"],
    commonMistakes: ["Going too heavy", "Not controlling bar", "Poor form"],
    tips: ["Upper chest emphasis", "Risky exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=GUILLOTINE" },

  { id: 'e119', name: 'Cable Chest Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Arms'], equipment: 'Cable', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Stand between cables", "Press forward", "Squeeze chest", "Control return"],
    commonMistakes: ["Standing too far forward", "Not achieving full contraction", "Using arms"],
    tips: ["Constant tension", "Unilateral option"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+PRESS" },

  { id: 'e120', name: 'Plate Squeeze Press', muscleGroup: 'Chest', secondaryMuscles: ['Arms'], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Squeeze plates", "Press up", "Maintain squeeze", "Lower slowly"],
    commonMistakes: ["Releasing squeeze", "Going too heavy", "Not achieving full range"],
    tips: ["Inner chest activation", "Unique stimulus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PLATE+SQUEEZE" },

  // === ADDITIONAL BACK (5) ===
  { id: 'e121', name: 'Yates Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Underhand grip", "Slight lean", "Pull to lower chest", "Squeeze lats"],
    commonMistakes: ["Standing too upright", "Using biceps", "Not pulling high enough"],
    tips: ["Dorian Yates variation", "Bicep involvement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=YATES+ROW" },

  { id: 'e122', name: 'Machine Pullover', muscleGroup: 'Back', secondaryMuscles: ['Chest'], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Secure arms on pads", "Pull down", "Squeeze lats", "Control return"],
    commonMistakes: ["Using arms", "Partial range", "Going too heavy"],
    tips: ["Lat isolation", "Mind-muscle connection"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=MACHINE+PULLOVER" },

  { id: 'e123', name: 'Snatch Grip Deadlift', muscleGroup: 'Back', secondaryMuscles: ['Legs'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Wide grip", "Pull like deadlift", "Extra ROM", "Full lockout"],
    commonMistakes: ["Grip too narrow", "Rounding back", "Poor mobility"],
    tips: ["Upper back emphasis", "Deadlift variation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SNATCH+DEADLIFT" },

  { id: 'e124', name: 'Helms Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Chest on incline bench", "Row dumbbell", "Squeeze at top", "Full stretch"],
    commonMistakes: ["Too much incline", "Using momentum", "Not achieving full ROM"],
    tips: ["Strict rowing", "Created by Eric Helms"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HELMS+ROW" },

  { id: 'e125', name: 'Gorilla Row', muscleGroup: 'Back', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Hinge at hips", "Row alternating sides", "Touch kettlebell", "Explosive pull"],
    commonMistakes: ["Standing too upright", "Not alternating", "Poor hip hinge"],
    tips: ["Athletic movement", "Trending exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=GORILLA+ROW" },

  // === ADDITIONAL SHOULDERS (5) ===
  { id: 'e126', name: 'Push Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Legs', 'Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Slight knee dip", "Drive with legs", "Press overhead", "Full lockout"],
    commonMistakes: ["Too much leg drive", "Poor rack position", "Not locking out"],
    tips: ["Olympic lift accessory", "More weight than strict press"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PUSH+PRESS" },

  { id: 'e127', name: 'Lu Raise', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Dumbbells at sides", "Raise to Y position", "Rotate thumbs up", "Control descent"],
    commonMistakes: ["Going too heavy", "Not rotating", "Using momentum"],
    tips: ["All three delt heads", "Unique angle"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LU+RAISE" },

  { id: 'e128', name: 'Band Pull-Apart', muscleGroup: 'Shoulders', secondaryMuscles: ['Back'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hold band", "Pull apart", "Squeeze rear delts", "Return slowly"],
    commonMistakes: ["Using arms", "Not achieving full contraction", "Wrong band tension"],
    tips: ["Rear delt and posture", "High rep exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BAND+APART" },

  { id: 'e129', name: 'Single Arm Landmine Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Hold landmine", "Press up and forward", "Control descent", "Keep core tight"],
    commonMistakes: ["Leaning too far", "Not pressing forward", "Poor posture"],
    tips: ["Shoulder-friendly pressing", "Core anti-rotation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LANDMINE+PRESS" },

  { id: 'e130', name: 'Bent Over Y-Raise', muscleGroup: 'Shoulders', secondaryMuscles: ['Back'], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hinge at hips", "Raise to Y shape", "Thumbs up", "Squeeze shoulder blades"],
    commonMistakes: ["Too much weight", "Not forming Y", "Standing too upright"],
    tips: ["Rear delt and lower traps", "Postural exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=Y-RAISE" },

  // === ADDITIONAL ARMS (5) ===
  { id: 'e131', name: 'Close Grip Bench Press', muscleGroup: 'Arms', secondaryMuscles: ['Chest'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Narrow grip", "Lower to chest", "Press up", "Keep elbows in"],
    commonMistakes: ["Grip too narrow", "Flaring elbows", "Not going full ROM"],
    tips: ["Tricep mass builder", "Heavy weight possible"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CG+BENCH" },

  { id: 'e132', name: 'JM Press', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Advanced',
    formGuide: ["Lower to face/forehead", "Press straight up", "Hybrid movement", "Control carefully"],
    commonMistakes: ["Going too heavy", "Poor technique", "Not understanding movement"],
    tips: ["Skull crusher variant", "Created by JM Blakley"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=JM+PRESS" },

  { id: 'e133', name: 'Drag Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Drag bar up body", "Elbows go back", "No forward movement", "Squeeze biceps"],
    commonMistakes: ["Bar drifts forward", "Not dragging", "Going too heavy"],
    tips: ["Long head emphasis", "Unique bicep stimulus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DRAG+CURL" },

  { id: 'e134', name: 'Tate Press', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Lie on bench", "Dumbbells touch", "Lower to chest", "Press up"],
    commonMistakes: ["Going too heavy", "Poor elbow position", "Dropping weights"],
    tips: ["Unique tricep angle", "Light weight only"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TATE+PRESS" },

  { id: 'e135', name: 'Waiter Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Hold dumbbell overhead grip", "Curl up", "Keep elbows in", "Squeeze bicep peak"],
    commonMistakes: ["Elbows flaring", "Not curling high enough", "Poor wrist position"],
    tips: ["Bicep peak focus", "Unique stimulus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WAITER+CURL" },

  // === ADDITIONAL LEGS (10) ===
  { id: 'e136', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Back foot elevated", "Lower down", "Push through front heel", "Keep upright torso"],
    commonMistakes: ["Front foot too close", "Leaning forward", "Back knee hitting ground"],
    tips: ["Brutal quad builder", "Fixes imbalances"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BULGARIAN" },

  { id: 'e137', name: 'Hatfield Squat', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Safety squat bar", "Hold handles for support", "Squat deep", "Drive up"],
    commonMistakes: ["Pulling with arms", "Not going deep", "Poor bar setup"],
    tips: ["Tom Platz favorite", "Can go very deep"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HATFIELD" },

  { id: 'e138', name: 'Pause Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Squat down", "Pause at bottom 2-3 sec", "Explode up", "No bounce"],
    commonMistakes: ["Not pausing long enough", "Losing tension", "Going too heavy"],
    tips: ["Builds strength at bottom", "Competition training"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PAUSE+SQUAT" },

  { id: 'e139', name: 'Zercher Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core', 'Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Bar in elbow crease", "Squat down", "Keep upright", "Drive up"],
    commonMistakes: ["Bar position wrong", "Leaning forward", "Not going deep"],
    tips: ["Unique bar placement", "Core intensive"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ZERCHER" },

  { id: 'e140', name: 'Seated Calf Raise', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Knees under pads", "Rise onto toes", "Full contraction", "Deep stretch"],
    commonMistakes: ["Bouncing", "Partial reps", "Not pausing at top"],
    tips: ["Soleus focus", "Different from standing"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SEATED+CALF" },

  { id: 'e141', name: 'Pendulum Squat', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Position in machine", "Squat down", "Full depth", "Drive up"],
    commonMistakes: ["Not going deep", "Poor foot placement", "Using momentum"],
    tips: ["Quad focus", "Harder than it looks"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PENDULUM" },

  { id: 'e142', name: 'Tempo Squat', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["3-4 sec descent", "Pause", "Explode up", "Controlled eccentric"],
    commonMistakes: ["Not timing correctly", "Going too heavy", "Losing form"],
    tips: ["Time under tension", "Hypertrophy focus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TEMPO+SQUAT" },

  { id: 'e143', name: 'Curtsy Lunge', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Cross leg behind", "Lower down", "Push up", "Alternate sides"],
    commonMistakes: ["Not crossing far enough", "Losing balance", "Poor depth"],
    tips: ["Glute focus", "Different angle"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CURTSY" },

  { id: 'e144', name: 'Smith Machine Squat', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Bar on back", "Squat down", "Fixed path", "Drive up"],
    commonMistakes: ["Feet too close to bar", "Not using full ROM", "Over-reliance on smith"],
    tips: ["Beginner friendly", "Controversial exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SMITH+SQUAT" },

  { id: 'e145', name: 'Abductor Machine', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit with legs on pads", "Push legs apart", "Squeeze glutes", "Control return"],
    commonMistakes: ["Going too heavy", "Bouncing", "Not achieving full contraction"],
    tips: ["Hip abductor focus", "Glute med activation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ABDUCTOR" },

  // === CARDIO (5) ===
  { id: 'e146', name: 'Burpee', muscleGroup: 'Cardio', secondaryMuscles: ['Chest', 'Core', 'Legs'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Drop to push-up", "Push up", "Jump to feet", "Jump up"],
    commonMistakes: ["Skipping push-up", "Not jumping high", "Poor form when tired"],
    tips: ["Full body cardio", "CrossFit staple"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BURPEE" },

  { id: 'e147', name: 'Rowing Machine', muscleGroup: 'Cardio', secondaryMuscles: ['Back', 'Legs'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Drive with legs", "Pull to chest", "Extend arms first", "Then bend knees"],
    commonMistakes: ["Arms then legs", "Not using legs enough", "Hunched back"],
    tips: ["Full body cardio", "Low impact"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ROWER" },

  { id: 'e148', name: 'Assault Bike', muscleGroup: 'Cardio', secondaryMuscles: ['Arms', 'Legs'], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Push and pull handles", "Pedal hard", "Full body effort", "Pace yourself"],
    commonMistakes: ["Not using arms", "Starting too fast", "Poor breathing"],
    tips: ["Brutal cardio", "Scales with effort"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ASSAULT+BIKE" },

  { id: 'e149', name: 'Jump Rope', muscleGroup: 'Cardio', secondaryMuscles: ['Legs'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Stay on toes", "Small jumps", "Wrist rotation", "Rhythm important"],
    commonMistakes: ["Jumping too high", "Arm movement too big", "Poor rhythm"],
    tips: ["Great warm-up", "Coordination builder"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=JUMP+ROPE" },

  { id: 'e150', name: 'Battle Ropes', muscleGroup: 'Cardio', secondaryMuscles: ['Shoulders', 'Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Grip rope ends", "Create waves", "Maintain intensity", "Various patterns"],
    commonMistakes: ["Too much arm", "Not using hips", "Stopping too early"],
    tips: ["Conditioning and power", "Timed intervals"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BATTLE+ROPES" },

  // === OLYMPIC LIFTS & VARIATIONS (8) ===
  { id: 'e151', name: 'Power Clean', muscleGroup: 'Legs', secondaryMuscles: ['Back', 'Shoulders'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Start with bar at shins", "Explosive hip extension", "Catch in quarter squat", "Stand to finish"],
    commonMistakes: ["Pulling with arms too early", "Not using hips", "Poor catch position"],
    tips: ["Olympic weightlifting movement", "Explosive power builder"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=POWER+CLEAN" },

  { id: 'e152', name: 'Hang Clean', muscleGroup: 'Legs', secondaryMuscles: ['Back', 'Shoulders'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Start at knee height", "Explosive pull", "Catch at shoulders", "Stand up"],
    commonMistakes: ["Starting too low", "Not finishing pull", "Poor rack position"],
    tips: ["Easier than floor clean", "Great for athletes"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HANG+CLEAN" },

  { id: 'e153', name: 'Power Snatch', muscleGroup: 'Shoulders', secondaryMuscles: ['Legs', 'Back'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Wide grip", "Explosive pull overhead", "Catch in quarter squat", "Lock out"],
    commonMistakes: ["Grip too narrow", "Not pulling high enough", "Poor mobility"],
    tips: ["Most technical lift", "Full body power"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=POWER+SNATCH" },

  { id: 'e154', name: 'Clean and Jerk', muscleGroup: 'Shoulders', secondaryMuscles: ['Legs', 'Back', 'Arms'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Clean to shoulders", "Dip and drive", "Press and split", "Recover feet"],
    commonMistakes: ["Poor clean catch", "Not using legs in jerk", "Uneven split"],
    tips: ["Olympic competition lift", "Maximum weight overhead"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CLEAN+JERK" },

  { id: 'e155', name: 'Dumbbell Snatch', muscleGroup: 'Shoulders', secondaryMuscles: ['Legs', 'Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["One arm", "Explosive pull overhead", "Catch at full extension", "Control descent"],
    commonMistakes: ["Using too much arm", "Not using hips", "Poor overhead position"],
    tips: ["Unilateral power", "CrossFit favorite"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DB+SNATCH" },

  { id: 'e156', name: 'Barbell Complex', muscleGroup: 'Cardio', secondaryMuscles: ['Legs', 'Back', 'Shoulders'], equipment: 'Barbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Multiple movements", "No bar down", "Flow between exercises", "Complete all reps"],
    commonMistakes: ["Going too heavy", "Resting between movements", "Poor form when tired"],
    tips: ["Conditioning and strength", "Popular finisher"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=COMPLEX" },

  { id: 'e157', name: 'Thruster', muscleGroup: 'Legs', secondaryMuscles: ['Shoulders'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Front squat down", "Drive up explosively", "Press overhead", "Full lockout"],
    commonMistakes: ["Not squatting deep", "Pausing between movements", "Poor breathing"],
    tips: ["Front squat + push press", "Brutal conditioning"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=THRUSTER" },

  { id: 'e158', name: 'Turkish Get-Up', muscleGroup: 'Core', secondaryMuscles: ['Shoulders', 'Legs'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Start lying down", "Keep weight overhead", "Stand up step by step", "Reverse to lie down"],
    commonMistakes: ["Rushing the movement", "Not keeping eyes on weight", "Poor positioning"],
    tips: ["Total body control", "Kettlebell classic"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TURKISH+GETUP" },

  // === FUNCTIONAL & ATHLETIC (10) ===
  { id: 'e159', name: 'Farmers Walk', muscleGroup: 'Core', secondaryMuscles: ['Arms', 'Legs', 'Back'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hold heavy weights at sides", "Walk with good posture", "Squeeze grip", "Keep shoulders back"],
    commonMistakes: ["Leaning forward", "Shrugging shoulders", "Short strides"],
    tips: ["Grip and core strength", "Functional movement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FARMERS+WALK" },

  { id: 'e160', name: 'Sled Push', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Low body position", "Drive through legs", "Push hard", "Maintain pace"],
    commonMistakes: ["Standing too upright", "Not using full leg drive", "Inconsistent pace"],
    tips: ["No eccentric damage", "Great for conditioning"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SLED+PUSH" },

  { id: 'e161', name: 'Sled Pull', muscleGroup: 'Back', secondaryMuscles: ['Legs', 'Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Attach rope/strap", "Pull hand over hand", "Use full body", "Maintain tension"],
    commonMistakes: ["Only using arms", "Poor posture", "Jerky movements"],
    tips: ["Back and grip work", "Low injury risk"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SLED+PULL" },

  { id: 'e162', name: 'Tire Flip', muscleGroup: 'Legs', secondaryMuscles: ['Back', 'Arms', 'Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Deadlift tire up", "Drive with legs", "Push overhead", "Flip over"],
    commonMistakes: ["Rounding back", "Not using legs", "Poor hand position"],
    tips: ["Strongman training", "Total body power"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TIRE+FLIP" },

  { id: 'e163', name: 'Prowler Sprint', muscleGroup: 'Cardio', secondaryMuscles: ['Legs'], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Load sled", "Sprint hard", "Drive through legs", "Short distances"],
    commonMistakes: ["Too much weight", "Too long distance", "Poor recovery"],
    tips: ["Explosive conditioning", "Speed development"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PROWLER" },

  { id: 'e164', name: 'Kettlebell Swing', muscleGroup: 'Legs', secondaryMuscles: ['Back', 'Core'], equipment: 'Dumbbell', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hip hinge", "Explosive hip extension", "Swing to eye level", "Control descent"],
    commonMistakes: ["Squatting instead of hinging", "Using arms", "Going too high"],
    tips: ["Posterior chain power", "Kettlebell staple"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=KB+SWING" },

  { id: 'e165', name: 'Wall Ball', muscleGroup: 'Legs', secondaryMuscles: ['Shoulders', 'Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Squat with medicine ball", "Throw to target", "Catch and squat", "Continuous rhythm"],
    commonMistakes: ["Not squatting deep", "Missing target", "Not catching smoothly"],
    tips: ["CrossFit classic", "Cardio and strength"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WALL+BALL" },

  { id: 'e166', name: 'Medicine Ball Slam', muscleGroup: 'Core', secondaryMuscles: ['Shoulders', 'Back'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Raise ball overhead", "Slam down hard", "Catch bounce", "Repeat explosively"],
    commonMistakes: ["Not using full body", "Slamming too close", "Poor breathing"],
    tips: ["Stress relief", "Explosive power"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BALL+SLAM" },

  { id: 'e167', name: 'Sandbag Carry', muscleGroup: 'Core', secondaryMuscles: ['Legs', 'Back'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Pick up sandbag", "Hold at chest or shoulder", "Walk distance", "Maintain posture"],
    commonMistakes: ["Leaning too far", "Dropping bag", "Not engaging core"],
    tips: ["Functional strength", "Odd object training"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SANDBAG" },

  { id: 'e168', name: 'Rope Climb', muscleGroup: 'Back', secondaryMuscles: ['Arms', 'Core'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Advanced',
    formGuide: ["Grip rope", "Use legs to lock", "Pull with arms", "Climb to top"],
    commonMistakes: ["Only using arms", "Not using legs", "Poor grip"],
    tips: ["Elite upper body", "Functional movement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=ROPE+CLIMB" },

  // === ISOLATION & ACCESSORIES (15) ===
  { id: 'e169', name: 'Wrist Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Forearms on bench", "Curl wrists up", "Full range", "Control descent"],
    commonMistakes: ["Using too much weight", "Not achieving full ROM", "Bouncing"],
    tips: ["Forearm mass", "Grip strength"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WRIST+CURL" },

  { id: 'e170', name: 'Reverse Wrist Curl', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Overhand grip", "Curl wrists up", "Slow and controlled", "Light weight"],
    commonMistakes: ["Going too heavy", "Not controlling negative", "Poor form"],
    tips: ["Forearm extensors", "Balance development"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REVERSE+WRIST" },

  { id: 'e171', name: 'Neck Curl', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on bench", "Plate on forehead", "Curl neck up", "Control down"],
    commonMistakes: ["Going too heavy", "Jerky movements", "Not warming up"],
    tips: ["Neck strength", "Injury prevention"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=NECK+CURL" },

  { id: 'e172', name: 'Tibialis Raise', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Back against wall", "Raise toes up", "Squeeze shin", "Lower controlled"],
    commonMistakes: ["Not going full range", "Using momentum", "Not pausing"],
    tips: ["Shin strength", "Injury prevention"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TIBIALIS" },

  { id: 'e173', name: 'Hip Thrust', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Barbell', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Back on bench", "Bar over hips", "Thrust up", "Squeeze glutes"],
    commonMistakes: ["Hyperextending back", "Not achieving full hip extension", "Bar too high"],
    tips: ["Best glute builder", "Bret Contreras exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HIP+THRUST" },

  { id: 'e174', name: 'Cable Pullthrough', muscleGroup: 'Legs', secondaryMuscles: ['Back'], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Rope between legs", "Hip hinge forward", "Drive hips through", "Squeeze glutes"],
    commonMistakes: ["Squatting instead of hinging", "Not achieving full extension", "Using arms"],
    tips: ["Glute and hamstring", "Hip hinge pattern"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PULLTHROUGH" },

  { id: 'e175', name: 'Good Morning', muscleGroup: 'Back', secondaryMuscles: ['Legs'], equipment: 'Barbell', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Bar on back", "Hinge at hips", "Keep back straight", "Return to standing"],
    commonMistakes: ["Rounding back", "Bending knees too much", "Going too heavy"],
    tips: ["Posterior chain", "Deadlift accessory"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=GOOD+MORNING" },

  { id: 'e176', name: 'Hyperextension', muscleGroup: 'Back', secondaryMuscles: ['Legs'], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lock feet", "Lower torso", "Raise back up", "Squeeze glutes"],
    commonMistakes: ["Hyperextending", "Going too fast", "Not using glutes"],
    tips: ["Lower back health", "Can add weight"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=HYPEREXTENSION" },

  { id: 'e177', name: 'Reverse Hyperextension', muscleGroup: 'Legs', secondaryMuscles: ['Back'], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie face down", "Legs hang", "Raise legs up", "Squeeze glutes"],
    commonMistakes: ["Swinging legs", "Not achieving full contraction", "Poor setup"],
    tips: ["Glute and hamstring", "Lower back friendly"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=REVERSE+HYPER" },

  { id: 'e178', name: 'Back Raise', muscleGroup: 'Back', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie face down", "Lift chest off ground", "Hold contraction", "Lower controlled"],
    commonMistakes: ["Hyperextending", "Using momentum", "Not squeezing"],
    tips: ["Lower back endurance", "Rehab exercise"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BACK+RAISE" },

  { id: 'e179', name: 'Clamshell', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on side", "Knees bent", "Raise top knee", "Keep feet together"],
    commonMistakes: ["Rotating hips", "Not squeezing glute", "Going too fast"],
    tips: ["Hip activation", "Glute med focus"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CLAMSHELL" },

  { id: 'e180', name: 'Fire Hydrant', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["On all fours", "Lift leg to side", "Keep knee bent", "Squeeze glute"],
    commonMistakes: ["Rotating torso", "Not achieving full range", "Moving too fast"],
    tips: ["Glute activation", "Hip mobility"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FIRE+HYDRANT" },

  { id: 'e181', name: 'Donkey Kick', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["On all fours", "Kick leg back and up", "Squeeze glute", "Control return"],
    commonMistakes: ["Arching back", "Not squeezing", "Using momentum"],
    tips: ["Glute isolation", "Bodyweight burner"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DONKEY+KICK" },

  { id: 'e182', name: 'Frog Pump', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Lie on back", "Feet together", "Knees out", "Pump hips up"],
    commonMistakes: ["Not achieving full extension", "Going too fast", "Not squeezing"],
    tips: ["Glute pump", "No equipment needed"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FROG+PUMP" },

  { id: 'e183', name: 'Single Leg Glute Bridge', muscleGroup: 'Legs', secondaryMuscles: ['Core'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["One leg extended", "Bridge up", "Squeeze glute", "Control down"],
    commonMistakes: ["Not going high enough", "Rotating hips", "Using momentum"],
    tips: ["Unilateral glute work", "Balance challenge"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SINGLE+BRIDGE" },

  // === STRETCHING & MOBILITY (12) ===
  { id: 'e184', name: 'Cat Cow Stretch', muscleGroup: 'Core', secondaryMuscles: ['Back'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["On all fours", "Arch back (cow)", "Round back (cat)", "Slow and controlled"],
    commonMistakes: ["Moving too fast", "Not achieving full range", "Holding breath"],
    tips: ["Spine mobility", "Warm-up staple"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CAT+COW" },

  { id: 'e185', name: 'Childs Pose', muscleGroup: 'Back', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit on heels", "Reach arms forward", "Relax into stretch", "Hold and breathe"],
    commonMistakes: ["Not relaxing", "Forcing position", "Poor breathing"],
    tips: ["Recovery position", "Lower back stretch"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CHILDS+POSE" },

  { id: 'e186', name: 'Couch Stretch', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Knee against wall", "Other foot forward", "Upright torso", "Hold stretch"],
    commonMistakes: ["Leaning forward", "Not pushing hip forward", "Short hold time"],
    tips: ["Hip flexor opener", "Squat mobility"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=COUCH+STRETCH" },

  { id: 'e187', name: 'Pigeon Pose', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Front leg bent", "Back leg extended", "Lower hips", "Hold and breathe"],
    commonMistakes: ["Hips not square", "Too aggressive", "Not relaxing into it"],
    tips: ["Hip opener", "Glute stretch"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PIGEON" },

  { id: 'e188', name: '90-90 Stretch', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Both legs at 90 degrees", "Rotate between sides", "Upright torso", "Hold each side"],
    commonMistakes: ["Leaning back", "Not achieving 90 degrees", "Forcing range"],
    tips: ["Hip mobility", "Internal and external rotation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=90-90" },

  { id: 'e189', name: 'Scorpion Stretch', muscleGroup: 'Core', secondaryMuscles: ['Back'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Intermediate',
    formGuide: ["Lie face down", "Rotate leg over", "Touch opposite side", "Hold stretch"],
    commonMistakes: ["Forcing range", "Lifting shoulders", "Going too fast"],
    tips: ["Spine rotation", "Hip mobility"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SCORPION" },

  { id: 'e190', name: 'Worlds Greatest Stretch', muscleGroup: 'Legs', secondaryMuscles: ['Core', 'Shoulders'], equipment: 'Bodyweight', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Lunge position", "Elbow to instep", "Rotate and reach", "Complete sequence"],
    commonMistakes: ["Rushing through", "Poor lunge depth", "Not rotating fully"],
    tips: ["Full body mobility", "Warm-up classic"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=WORLDS+GREATEST" },

  { id: 'e191', name: 'Doorway Chest Stretch', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Arm in doorframe", "Step through", "Feel chest stretch", "Hold position"],
    commonMistakes: ["Forcing too hard", "Poor shoulder position", "Not breathing"],
    tips: ["Pec stretch", "Posture improvement"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=DOORWAY+STRETCH" },

  { id: 'e192', name: 'Overhead Tricep Stretch', muscleGroup: 'Arms', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Arm overhead", "Bend at elbow", "Pull with other hand", "Hold stretch"],
    commonMistakes: ["Forcing range", "Shoulder discomfort", "Not breathing"],
    tips: ["Tricep flexibility", "Shoulder mobility"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=TRICEP+STRETCH" },

  { id: 'e193', name: 'Seated Forward Fold', muscleGroup: 'Legs', secondaryMuscles: ['Back'], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit with legs extended", "Reach for toes", "Keep back straight", "Hold stretch"],
    commonMistakes: ["Rounding back", "Bouncing", "Forcing range"],
    tips: ["Hamstring stretch", "Lower back"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=FORWARD+FOLD" },

  { id: 'e194', name: 'Butterfly Stretch', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit with feet together", "Knees to sides", "Gently press down", "Hold position"],
    commonMistakes: ["Bouncing knees", "Rounding back", "Forcing range"],
    tips: ["Groin stretch", "Hip opener"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=BUTTERFLY" },

  { id: 'e195', name: 'Standing Quad Stretch', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Bodyweight', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Pull heel to glute", "Keep knees together", "Stand tall", "Hold stretch"],
    commonMistakes: ["Leaning forward", "Knees not together", "Pulling too hard"],
    tips: ["Quad flexibility", "Balance practice"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=QUAD+STRETCH" },

  // === MACHINE VARIATIONS (10) ===
  { id: 'e196', name: 'Leg Extension', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit in machine", "Extend legs", "Squeeze quads", "Lower controlled"],
    commonMistakes: ["Going too heavy", "Not achieving full extension", "Using momentum"],
    tips: ["Quad isolation", "Controversial for knees"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LEG+EXTENSION" },

  { id: 'e197', name: 'Seated Leg Curl', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Sit in machine", "Curl legs down", "Squeeze hamstrings", "Control return"],
    commonMistakes: ["Not achieving full contraction", "Using too much weight", "Partial range"],
    tips: ["Hamstring isolation", "Different than lying curl"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SEATED+CURL" },

  { id: 'e198', name: 'Cable Lateral Pulldown', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Cable', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Sit at lat machine", "Pull bar to chest", "Squeeze lats", "Control up"],
    commonMistakes: ["Using momentum", "Not achieving full ROM", "Pulling behind neck"],
    tips: ["Lat width", "Beginner friendly"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=LAT+PULLDOWN" },

  { id: 'e199', name: 'V-Bar Pulldown', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Cable', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Close grip handle", "Pull to upper chest", "Squeeze lats", "Control return"],
    commonMistakes: ["Using biceps too much", "Not leaning back slightly", "Partial range"],
    tips: ["Lat thickness", "Close grip variation"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=V-BAR+PULLDOWN" },

  { id: 'e200', name: 'Smith Machine Bench Press', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Set bench under bar", "Unrack and lower", "Press up", "Fixed path"],
    commonMistakes: ["Bar path not natural", "Not setting bench correctly", "Over-reliance"],
    tips: ["Beginner friendly", "Can go heavy safely"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SMITH+BENCH" },

  { id: 'e201', name: 'Smith Machine Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Hinge at hips", "Pull bar to stomach", "Squeeze back", "Control down"],
    commonMistakes: ["Standing too upright", "Using biceps", "Jerky movements"],
    tips: ["Stable rowing", "Good for high reps"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=SMITH+ROW" },

  { id: 'e202', name: 'Cable Fly High to Low', muscleGroup: 'Chest', secondaryMuscles: [], equipment: 'Cable', category: 'Isolation', difficulty: 'Beginner',
    formGuide: ["Cables set high", "Fly motion down", "Squeeze chest", "Control return"],
    commonMistakes: ["Too much weight", "Bending elbows too much", "Not achieving contraction"],
    tips: ["Lower chest focus", "Constant tension"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=CABLE+FLY+LOW" },

  { id: 'e203', name: 'Chest Supported T-Bar Row', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Chest on pad", "Pull handles", "Squeeze shoulder blades", "Control descent"],
    commonMistakes: ["Not achieving full contraction", "Using too much weight", "Lifting chest off pad"],
    tips: ["No lower back stress", "Pure back work"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=T-BAR+CHEST" },

  { id: 'e204', name: 'Vertical Leg Press', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', category: 'Compound', difficulty: 'Intermediate',
    formGuide: ["Lie under platform", "Press up", "Lower controlled", "Full range"],
    commonMistakes: ["Not going deep enough", "Locking out knees", "Lifting butt"],
    tips: ["Different angle", "Glute emphasis"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=VERTICAL+PRESS" },

  { id: 'e205', name: 'Pulldown Machine', muscleGroup: 'Back', secondaryMuscles: ['Arms'], equipment: 'Machine', category: 'Compound', difficulty: 'Beginner',
    formGuide: ["Sit in machine", "Pull handles down", "Squeeze lats", "Control return"],
    commonMistakes: ["Using momentum", "Not achieving full ROM", "Leaning too far back"],
    tips: ["Lat machine variant", "Easy to use"],
    gifUrl: "https://placehold.co/600x400/000000/ccff00?text=PULLDOWN+MACHINE" }
];

export const MOCK_HISTORY: WorkoutSession[] = [
  {
    id: 'h1',
    name: 'Upper Body Power',
    startTime: Date.now() - 86400000 * 2, // 2 days ago
    endTime: Date.now() - 86400000 * 2 + 3600000,
    status: 'completed',
    logs: [
      {
        id: 'l1',
        exerciseId: 'e1',
        sets: [
          { id: 's1', reps: 8, weight: 135, completed: true, rpe: 7, type: 'N' },
          { id: 's2', reps: 8, weight: 135, completed: true, rpe: 8, type: 'N' },
          { id: 's3', reps: 8, weight: 135, completed: true, rpe: 9, type: 'N' },
        ]
      }
    ]
  },
  {
    id: 'h2',
    name: 'Lower Body Hypertrophy',
    startTime: Date.now() - 86400000 * 5, // 5 days ago
    endTime: Date.now() - 86400000 * 5 + 4000000,
    status: 'completed',
    logs: []
  }
];

// --- PROGRAM TEMPLATES (Building Blocks) ---
export const INITIAL_TEMPLATES: WorkoutSession[] = [
  // Existing Samples
  {
    id: 't1',
    name: 'Upper Body A',
    startTime: 0,
    status: 'template',
    logs: [
      { id: 'tl1', exerciseId: 'e1', sets: [{ id: 'ts1', reps: 10, weight: 0, completed: false, type: 'N' }] },
      { id: 'tl2', exerciseId: 'e6', sets: [{ id: 'ts2', reps: 12, weight: 0, completed: false, type: 'N' }] },
      { id: 'tl3', exerciseId: 'e7', sets: [{ id: 'ts3', reps: 15, weight: 0, completed: false, type: 'N' }] },
    ]
  },
  {
    id: 't2',
    name: 'Lower Body A',
    startTime: 0,
    status: 'template',
    logs: [
      { id: 'tl4', exerciseId: 'e4', sets: [{ id: 'ts4', reps: 5, weight: 0, completed: false, type: 'N' }] },
      { id: 'tl5', exerciseId: 'e11', sets: [{ id: 'ts5', reps: 8, weight: 0, completed: false, type: 'N' }] },
      { id: 'tl6', exerciseId: 'e13', sets: [{ id: 'ts6', reps: 8, weight: 0, completed: false, type: 'N' }] },
    ]
  },

  // --- STRONGLIFTS 5x5 ---
  {
    id: 'sl5x5_a',
    name: 'StrongLifts 5x5 A',
    startTime: 0,
    status: 'template',
    logs: [
      { id: 'sl_sq', exerciseId: 'e4', sets: Array(5).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) },
      { id: 'sl_bp', exerciseId: 'e1', sets: Array(5).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) },
      { id: 'sl_row', exerciseId: 'e19', sets: Array(5).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) },
    ]
  },
  {
    id: 'sl5x5_b',
    name: 'StrongLifts 5x5 B',
    startTime: 0,
    status: 'template',
    logs: [
      { id: 'sl_sq', exerciseId: 'e4', sets: Array(5).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) },
      { id: 'sl_ohp', exerciseId: 'e16', sets: Array(5).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) },
      { id: 'sl_dl', exerciseId: 'e5', sets: [{ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }] }, // Deadlift is 1x5
    ]
  },

  // --- REDDIT PPL (METALLICADPA) ---
  {
      id: 'ppl_push',
      name: 'PPL: Push',
      startTime: 0,
      status: 'template',
      logs: [
          { id: 'p_bp', exerciseId: 'e1', sets: [{ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }] }, // 5x5 or 3x5
          { id: 'p_ohp', exerciseId: 'e16', sets: [{ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }] }, // 3x8-12
          { id: 'p_inc', exerciseId: 'e2', sets: [{ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }] },
          { id: 'p_lat', exerciseId: 'e12', sets: [{ id: 's', reps: 15, weight: 0, completed: false, type: 'N' }] },
          { id: 'p_tri', exerciseId: 'e7', sets: [{ id: 's', reps: 12, weight: 0, completed: false, type: 'N' }] },
      ]
  },
  {
      id: 'ppl_pull',
      name: 'PPL: Pull',
      startTime: 0,
      status: 'template',
      logs: [
          { id: 'pu_dl', exerciseId: 'e5', sets: [{ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }] }, // 1x5
          { id: 'pu_pd', exerciseId: 'e18', sets: [{ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }] },
          { id: 'pu_row', exerciseId: 'e19', sets: [{ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }] },
          { id: 'pu_face', exerciseId: 'e14', sets: [{ id: 's', reps: 15, weight: 0, completed: false, type: 'N' }] },
          { id: 'pu_ham', exerciseId: 'e15', sets: [{ id: 's', reps: 12, weight: 0, completed: false, type: 'N' }] },
      ]
  },
  {
      id: 'ppl_legs',
      name: 'PPL: Legs',
      startTime: 0,
      status: 'template',
      logs: [
          { id: 'l_sq', exerciseId: 'e4', sets: [{ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }] },
          { id: 'l_rdl', exerciseId: 'e11', sets: [{ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }] },
          { id: 'l_lp', exerciseId: 'e13', sets: [{ id: 's', reps: 12, weight: 0, completed: false, type: 'N' }] },
          { id: 'l_ext', exerciseId: 'e9', sets: [{ id: 's', reps: 15, weight: 0, completed: false, type: 'N' }] },
          { id: 'l_calf', exerciseId: 'e20', sets: [{ id: 's', reps: 15, weight: 0, completed: false, type: 'N' }] },
      ]
  },

  // --- ARNOLD GOLDEN SIX ---
  {
      id: 'arnold_a',
      name: 'Arnold Golden Six',
      startTime: 0,
      status: 'template',
      logs: [
          { id: 'ag_sq', exerciseId: 'e4', sets: Array(4).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) },
          { id: 'ag_bp', exerciseId: 'e1', sets: Array(3).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) },
          { id: 'ag_pu', exerciseId: 'e3', sets: Array(3).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) }, // Chin ups
          { id: 'ag_ohp', exerciseId: 'e16', sets: Array(4).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) },
          { id: 'ag_curl', exerciseId: 'e8', sets: Array(3).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) },
          { id: 'ag_sit', exerciseId: 'e10', sets: Array(3).fill({ id: 's', reps: 20, weight: 0, completed: false, type: 'N' }) }, // Sit ups -> Plank
      ]
  },
  
  // --- nSuns 5/3/1 (4 Day) ---
  {
      id: 'nsuns_1',
      name: 'nSuns: Bench/OHP',
      startTime: 0,
      status: 'template',
      logs: [
          { id: 'n1_bp', exerciseId: 'e1', sets: Array(9).fill({ id: 's', reps: 3, weight: 0, completed: false, type: 'N' }) }, // T1 Volume
          { id: 'n1_ohp', exerciseId: 'e16', sets: Array(8).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) }, // T2 Volume
          { id: 'n1_acc1', exerciseId: 'e19', sets: Array(3).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) },
          { id: 'n1_acc2', exerciseId: 'e7', sets: Array(3).fill({ id: 's', reps: 10, weight: 0, completed: false, type: 'N' }) },
      ]
  },
  {
      id: 'nsuns_2',
      name: 'nSuns: Squat/Sumo',
      startTime: 0,
      status: 'template',
      logs: [
          { id: 'n2_sq', exerciseId: 'e4', sets: Array(9).fill({ id: 's', reps: 3, weight: 0, completed: false, type: 'N' }) },
          { id: 'n2_sumo', exerciseId: 'e22', sets: Array(8).fill({ id: 's', reps: 5, weight: 0, completed: false, type: 'N' }) },
          { id: 'n2_acc1', exerciseId: 'e9', sets: Array(3).fill({ id: 's', reps: 12, weight: 0, completed: false, type: 'N' }) },
      ]
  }
];

// --- FULL PROGRAMS ---
export const INITIAL_PROGRAMS: Program[] = [
    {
        id: 'prog_ppl',
        name: 'Reddit PPL',
        description: 'The most popular hypertrophy program on the internet. High frequency, linear progression. 6 days/week.',
        weeks: 8,
        sessions: [
            // Week 1
            { templateId: 'ppl_push', week: 1, day: 1 },
            { templateId: 'ppl_pull', week: 1, day: 2 },
            { templateId: 'ppl_legs', week: 1, day: 3 },
            { templateId: 'ppl_push', week: 1, day: 4 },
            { templateId: 'ppl_pull', week: 1, day: 5 },
            { templateId: 'ppl_legs', week: 1, day: 6 },
            // Week 2 (Repeat)
            { templateId: 'ppl_push', week: 2, day: 1 },
            { templateId: 'ppl_pull', week: 2, day: 2 },
            { templateId: 'ppl_legs', week: 2, day: 3 },
            { templateId: 'ppl_push', week: 2, day: 4 },
            { templateId: 'ppl_pull', week: 2, day: 5 },
            { templateId: 'ppl_legs', week: 2, day: 6 },
        ]
    },
    {
        id: 'prog_sl5x5',
        name: 'StrongLifts 5x5',
        description: 'The ultimate beginner strength foundation. Master the big 5 compound lifts. 3 days/week.',
        weeks: 12,
        sessions: [
            // Week 1 (A-B-A)
            { templateId: 'sl5x5_a', week: 1, day: 1 },
            { templateId: 'sl5x5_b', week: 1, day: 3 },
            { templateId: 'sl5x5_a', week: 1, day: 5 },
            // Week 2 (B-A-B)
            { templateId: 'sl5x5_b', week: 2, day: 1 },
            { templateId: 'sl5x5_a', week: 2, day: 3 },
            { templateId: 'sl5x5_b', week: 2, day: 5 },
        ]
    },
    {
        id: 'prog_arnold',
        name: 'Arnold Golden Six',
        description: 'Arnold Schwarzeneggers favorite routine for mass. Full body, 3 times a week. Simple and brutal.',
        weeks: 8,
        sessions: [
            { templateId: 'arnold_a', week: 1, day: 1 },
            { templateId: 'arnold_a', week: 1, day: 3 },
            { templateId: 'arnold_a', week: 1, day: 5 },
            { templateId: 'arnold_a', week: 2, day: 1 },
            { templateId: 'arnold_a', week: 2, day: 3 },
            { templateId: 'arnold_a', week: 2, day: 5 },
        ]
    },
    {
        id: 'prog_nsuns',
        name: 'nSuns 5/3/1 (LP)',
        description: 'High volume power-building program. Famous for rapid bench press gains. Not for the faint of heart.',
        weeks: 6,
        sessions: [
            { templateId: 'nsuns_1', week: 1, day: 1 },
            { templateId: 'nsuns_2', week: 1, day: 2 },
            { templateId: 'nsuns_1', week: 1, day: 4 },
            { templateId: 'nsuns_2', week: 1, day: 5 },
        ]
    },
    {
        id: 'prog_evidence_hypertrophy',
        name: 'Evidence-Based Hypertrophy',
        description: 'Science-backed program for returning lifters 35-50. Optimized recovery, progressive volume, built-in deloads. 4 days/week Upper/Lower.',
        weeks: 12,
        sessions: [
            // MESOCYCLE 1: WEEKS 1-4 (MEV → MAV → MAV+ → DELOAD)
            // Week 1: MEV (Minimum Effective Volume)
            { templateId: 'ebh_upper_a', week: 1, day: 1 },
            { templateId: 'ebh_lower_a', week: 1, day: 2 },
            { templateId: 'ebh_upper_b', week: 1, day: 4 },
            { templateId: 'ebh_lower_b', week: 1, day: 5 },
            // Week 2: MAV (Maximum Adaptive Volume)
            { templateId: 'ebh_upper_a', week: 2, day: 1 },
            { templateId: 'ebh_lower_a', week: 2, day: 2 },
            { templateId: 'ebh_upper_b', week: 2, day: 4 },
            { templateId: 'ebh_lower_b', week: 2, day: 5 },
            // Week 3: MAV+ (Overreaching)
            { templateId: 'ebh_upper_a', week: 3, day: 1 },
            { templateId: 'ebh_lower_a', week: 3, day: 2 },
            { templateId: 'ebh_upper_b', week: 3, day: 4 },
            { templateId: 'ebh_lower_b', week: 3, day: 5 },
            // Week 4: DELOAD
            { templateId: 'ebh_upper_deload', week: 4, day: 1 },
            { templateId: 'ebh_lower_deload', week: 4, day: 2 },
            { templateId: 'ebh_upper_deload', week: 4, day: 4 },
            { templateId: 'ebh_lower_deload', week: 4, day: 5 },

            // MESOCYCLE 2: WEEKS 5-8 (Repeat structure)
            { templateId: 'ebh_upper_a', week: 5, day: 1 },
            { templateId: 'ebh_lower_a', week: 5, day: 2 },
            { templateId: 'ebh_upper_b', week: 5, day: 4 },
            { templateId: 'ebh_lower_b', week: 5, day: 5 },
            { templateId: 'ebh_upper_a', week: 6, day: 1 },
            { templateId: 'ebh_lower_a', week: 6, day: 2 },
            { templateId: 'ebh_upper_b', week: 6, day: 4 },
            { templateId: 'ebh_lower_b', week: 6, day: 5 },
            { templateId: 'ebh_upper_a', week: 7, day: 1 },
            { templateId: 'ebh_lower_a', week: 7, day: 2 },
            { templateId: 'ebh_upper_b', week: 7, day: 4 },
            { templateId: 'ebh_lower_b', week: 7, day: 5 },
            { templateId: 'ebh_upper_deload', week: 8, day: 1 },
            { templateId: 'ebh_lower_deload', week: 8, day: 2 },
            { templateId: 'ebh_upper_deload', week: 8, day: 4 },
            { templateId: 'ebh_lower_deload', week: 8, day: 5 },

            // MESOCYCLE 3: WEEKS 9-12 (Final push)
            { templateId: 'ebh_upper_a', week: 9, day: 1 },
            { templateId: 'ebh_lower_a', week: 9, day: 2 },
            { templateId: 'ebh_upper_b', week: 9, day: 4 },
            { templateId: 'ebh_lower_b', week: 9, day: 5 },
            { templateId: 'ebh_upper_a', week: 10, day: 1 },
            { templateId: 'ebh_lower_a', week: 10, day: 2 },
            { templateId: 'ebh_upper_b', week: 10, day: 4 },
            { templateId: 'ebh_lower_b', week: 10, day: 5 },
            { templateId: 'ebh_upper_a', week: 11, day: 1 },
            { templateId: 'ebh_lower_a', week: 11, day: 2 },
            { templateId: 'ebh_upper_b', week: 11, day: 4 },
            { templateId: 'ebh_lower_b', week: 11, day: 5 },
            { templateId: 'ebh_upper_deload', week: 12, day: 1 },
            { templateId: 'ebh_lower_deload', week: 12, day: 2 },
            { templateId: 'ebh_upper_deload', week: 12, day: 4 },
            { templateId: 'ebh_lower_deload', week: 12, day: 5 },
        ]
    },
    {
        id: 'prog_gzclp',
        name: 'GZCLP',
        description: 'Reddit\'s #1 recommended beginner-intermediate program by Cody Lefever. Learn the GZCL tier system: T1 main lifts (5×3), T2 secondary (3×10), T3 accessories (3×15). Built-in progression with failure protocols. 4 days/week.',
        weeks: 12,
        sessions: [
            // Week 1
            { templateId: 'gzclp_day1', week: 1, day: 1 },
            { templateId: 'gzclp_day2', week: 1, day: 2 },
            { templateId: 'gzclp_day3', week: 1, day: 4 },
            { templateId: 'gzclp_day4', week: 1, day: 5 },
            // Week 2
            { templateId: 'gzclp_day1', week: 2, day: 1 },
            { templateId: 'gzclp_day2', week: 2, day: 2 },
            { templateId: 'gzclp_day3', week: 2, day: 4 },
            { templateId: 'gzclp_day4', week: 2, day: 5 },
            // Week 3
            { templateId: 'gzclp_day1', week: 3, day: 1 },
            { templateId: 'gzclp_day2', week: 3, day: 2 },
            { templateId: 'gzclp_day3', week: 3, day: 4 },
            { templateId: 'gzclp_day4', week: 3, day: 5 },
            // Week 4
            { templateId: 'gzclp_day1', week: 4, day: 1 },
            { templateId: 'gzclp_day2', week: 4, day: 2 },
            { templateId: 'gzclp_day3', week: 4, day: 4 },
            { templateId: 'gzclp_day4', week: 4, day: 5 },
            // Week 5
            { templateId: 'gzclp_day1', week: 5, day: 1 },
            { templateId: 'gzclp_day2', week: 5, day: 2 },
            { templateId: 'gzclp_day3', week: 5, day: 4 },
            { templateId: 'gzclp_day4', week: 5, day: 5 },
            // Week 6
            { templateId: 'gzclp_day1', week: 6, day: 1 },
            { templateId: 'gzclp_day2', week: 6, day: 2 },
            { templateId: 'gzclp_day3', week: 6, day: 4 },
            { templateId: 'gzclp_day4', week: 6, day: 5 },
            // Week 7
            { templateId: 'gzclp_day1', week: 7, day: 1 },
            { templateId: 'gzclp_day2', week: 7, day: 2 },
            { templateId: 'gzclp_day3', week: 7, day: 4 },
            { templateId: 'gzclp_day4', week: 7, day: 5 },
            // Week 8
            { templateId: 'gzclp_day1', week: 8, day: 1 },
            { templateId: 'gzclp_day2', week: 8, day: 2 },
            { templateId: 'gzclp_day3', week: 8, day: 4 },
            { templateId: 'gzclp_day4', week: 8, day: 5 },
            // Week 9
            { templateId: 'gzclp_day1', week: 9, day: 1 },
            { templateId: 'gzclp_day2', week: 9, day: 2 },
            { templateId: 'gzclp_day3', week: 9, day: 4 },
            { templateId: 'gzclp_day4', week: 9, day: 5 },
            // Week 10
            { templateId: 'gzclp_day1', week: 10, day: 1 },
            { templateId: 'gzclp_day2', week: 10, day: 2 },
            { templateId: 'gzclp_day3', week: 10, day: 4 },
            { templateId: 'gzclp_day4', week: 10, day: 5 },
            // Week 11
            { templateId: 'gzclp_day1', week: 11, day: 1 },
            { templateId: 'gzclp_day2', week: 11, day: 2 },
            { templateId: 'gzclp_day3', week: 11, day: 4 },
            { templateId: 'gzclp_day4', week: 11, day: 5 },
            // Week 12
            { templateId: 'gzclp_day1', week: 12, day: 1 },
            { templateId: 'gzclp_day2', week: 12, day: 2 },
            { templateId: 'gzclp_day3', week: 12, day: 4 },
            { templateId: 'gzclp_day4', week: 12, day: 5 },
        ]
    },
    {
        id: 'prog_phat',
        name: 'PHAT',
        description: 'Dr. Layne Norton\'s legendary powerbuilding program. Combines power days (3-5 reps) with hypertrophy days (8-20 reps) for maximum strength AND size. Natural bodybuilding champion proven. 5 days/week.',
        weeks: 12,
        sessions: [
            // Week 1
            { templateId: 'phat_upper_power', week: 1, day: 1 },
            { templateId: 'phat_lower_power', week: 1, day: 2 },
            { templateId: 'phat_back_shoulders', week: 1, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 1, day: 5 },
            { templateId: 'phat_chest_arms', week: 1, day: 6 },
            // Week 2
            { templateId: 'phat_upper_power', week: 2, day: 1 },
            { templateId: 'phat_lower_power', week: 2, day: 2 },
            { templateId: 'phat_back_shoulders', week: 2, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 2, day: 5 },
            { templateId: 'phat_chest_arms', week: 2, day: 6 },
            // Week 3
            { templateId: 'phat_upper_power', week: 3, day: 1 },
            { templateId: 'phat_lower_power', week: 3, day: 2 },
            { templateId: 'phat_back_shoulders', week: 3, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 3, day: 5 },
            { templateId: 'phat_chest_arms', week: 3, day: 6 },
            // Week 4
            { templateId: 'phat_upper_power', week: 4, day: 1 },
            { templateId: 'phat_lower_power', week: 4, day: 2 },
            { templateId: 'phat_back_shoulders', week: 4, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 4, day: 5 },
            { templateId: 'phat_chest_arms', week: 4, day: 6 },
            // Week 5
            { templateId: 'phat_upper_power', week: 5, day: 1 },
            { templateId: 'phat_lower_power', week: 5, day: 2 },
            { templateId: 'phat_back_shoulders', week: 5, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 5, day: 5 },
            { templateId: 'phat_chest_arms', week: 5, day: 6 },
            // Week 6
            { templateId: 'phat_upper_power', week: 6, day: 1 },
            { templateId: 'phat_lower_power', week: 6, day: 2 },
            { templateId: 'phat_back_shoulders', week: 6, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 6, day: 5 },
            { templateId: 'phat_chest_arms', week: 6, day: 6 },
            // Week 7
            { templateId: 'phat_upper_power', week: 7, day: 1 },
            { templateId: 'phat_lower_power', week: 7, day: 2 },
            { templateId: 'phat_back_shoulders', week: 7, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 7, day: 5 },
            { templateId: 'phat_chest_arms', week: 7, day: 6 },
            // Week 8
            { templateId: 'phat_upper_power', week: 8, day: 1 },
            { templateId: 'phat_lower_power', week: 8, day: 2 },
            { templateId: 'phat_back_shoulders', week: 8, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 8, day: 5 },
            { templateId: 'phat_chest_arms', week: 8, day: 6 },
            // Week 9
            { templateId: 'phat_upper_power', week: 9, day: 1 },
            { templateId: 'phat_lower_power', week: 9, day: 2 },
            { templateId: 'phat_back_shoulders', week: 9, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 9, day: 5 },
            { templateId: 'phat_chest_arms', week: 9, day: 6 },
            // Week 10
            { templateId: 'phat_upper_power', week: 10, day: 1 },
            { templateId: 'phat_lower_power', week: 10, day: 2 },
            { templateId: 'phat_back_shoulders', week: 10, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 10, day: 5 },
            { templateId: 'phat_chest_arms', week: 10, day: 6 },
            // Week 11
            { templateId: 'phat_upper_power', week: 11, day: 1 },
            { templateId: 'phat_lower_power', week: 11, day: 2 },
            { templateId: 'phat_back_shoulders', week: 11, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 11, day: 5 },
            { templateId: 'phat_chest_arms', week: 11, day: 6 },
            // Week 12
            { templateId: 'phat_upper_power', week: 12, day: 1 },
            { templateId: 'phat_lower_power', week: 12, day: 2 },
            { templateId: 'phat_back_shoulders', week: 12, day: 4 },
            { templateId: 'phat_lower_hypertrophy', week: 12, day: 5 },
            { templateId: 'phat_chest_arms', week: 12, day: 6 },
        ]
    },
    {
        id: 'prog_531_beginner',
        name: '5/3/1 for Beginners',
        description: 'Jim Wendler\'s most famous strength program. Wave loading with FSL (First Set Last) 5×5 supplemental work. Teaches submaximal training and long-term progression. Perfect for strength-focused beginners. 3 days/week.',
        weeks: 12,
        sessions: [
            // Week 1
            { templateId: '531_day1', week: 1, day: 1 },
            { templateId: '531_day2', week: 1, day: 3 },
            { templateId: '531_day3', week: 1, day: 5 },
            // Week 2
            { templateId: '531_day1', week: 2, day: 1 },
            { templateId: '531_day2', week: 2, day: 3 },
            { templateId: '531_day3', week: 2, day: 5 },
            // Week 3
            { templateId: '531_day1', week: 3, day: 1 },
            { templateId: '531_day2', week: 3, day: 3 },
            { templateId: '531_day3', week: 3, day: 5 },
            // Week 4
            { templateId: '531_day1', week: 4, day: 1 },
            { templateId: '531_day2', week: 4, day: 3 },
            { templateId: '531_day3', week: 4, day: 5 },
            // Week 5
            { templateId: '531_day1', week: 5, day: 1 },
            { templateId: '531_day2', week: 5, day: 3 },
            { templateId: '531_day3', week: 5, day: 5 },
            // Week 6
            { templateId: '531_day1', week: 6, day: 1 },
            { templateId: '531_day2', week: 6, day: 3 },
            { templateId: '531_day3', week: 6, day: 5 },
            // Week 7
            { templateId: '531_day1', week: 7, day: 1 },
            { templateId: '531_day2', week: 7, day: 3 },
            { templateId: '531_day3', week: 7, day: 5 },
            // Week 8
            { templateId: '531_day1', week: 8, day: 1 },
            { templateId: '531_day2', week: 8, day: 3 },
            { templateId: '531_day3', week: 8, day: 5 },
            // Week 9
            { templateId: '531_day1', week: 9, day: 1 },
            { templateId: '531_day2', week: 9, day: 3 },
            { templateId: '531_day3', week: 9, day: 5 },
            // Week 10
            { templateId: '531_day1', week: 10, day: 1 },
            { templateId: '531_day2', week: 10, day: 3 },
            { templateId: '531_day3', week: 10, day: 5 },
            // Week 11
            { templateId: '531_day1', week: 11, day: 1 },
            { templateId: '531_day2', week: 11, day: 3 },
            { templateId: '531_day3', week: 11, day: 5 },
            // Week 12
            { templateId: '531_day1', week: 12, day: 1 },
            { templateId: '531_day2', week: 12, day: 3 },
            { templateId: '531_day3', week: 12, day: 5 },
        ]
    }
];
