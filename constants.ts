
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
  }
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
    }
];
