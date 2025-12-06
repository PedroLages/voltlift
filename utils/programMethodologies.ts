/**
 * Program-Specific Training Methodologies
 *
 * Each program has unique philosophy, approach, goals, and principles
 * based on research from leading strength training sources (2025)
 */

export interface ProgramMethodology {
  approach: string;
  goals: string[];
  guidelines: string[];
  principles: { name: string; description: string }[];
}

export const PROGRAM_METHODOLOGIES: Record<string, ProgramMethodology> = {
  // Reddit PPL (Push/Pull/Legs)
  'prog_ppl': {
    approach: 'Movement-based training that categorizes exercises by fundamental human movement patterns rather than isolated muscles. PPL optimizes training frequency by hitting each muscle group twice per week with 48-72 hours recovery between sessions, maximizing protein synthesis while reducing overuse injury risk.',
    goals: [
      'Build muscular hypertrophy through optimal twice-weekly frequency',
      'Develop balanced pushing, pulling, and lower body strength',
      'Maximize muscle protein synthesis with strategic recovery windows',
      'Create sustainable high-volume training without overtraining',
    ],
    guidelines: [
      'Train 6 days per week following the Push-Pull-Legs-Push-Pull-Legs rotation',
      'Each muscle group recovers 48-72 hours before next stimulus',
      'Transition from compound multi-joint to isolation single-joint exercises',
      'Progress by adding weight, reps, or sets when form remains perfect',
      'Listen to your body - PPL requires consistency over sporadic intensity',
    ],
    principles: [
      { name: 'Movement Synergy', description: 'Group exercises by movement patterns for optimal recovery' },
      { name: 'High Frequency', description: 'Twice-weekly stimulation per muscle drives superior hypertrophy' },
      { name: 'Functional Transfer', description: 'Aligns with natural human movement for better coordination' },
      { name: 'Sustainable Volume', description: 'Balanced workload prevents burnout in high-frequency training' },
    ],
  },

  // StrongLifts 5x5
  'prog_sl5x5': {
    approach: 'Simple linear progression focused on five fundamental compound movements. Designed for absolute beginners to build a strength foundation through frequent practice of the squat, bench press, overhead press, deadlift, and barbell row. Emphasizes perfect form and incremental weight increases.',
    goals: [
      'Master technique on five essential barbell compound movements',
      'Build absolute strength through consistent linear progression',
      'Develop work capacity and mental discipline for long-term training',
      'Establish foundational movement patterns for advanced programming',
    ],
    guidelines: [
      'Train 3 days per week alternating Workout A and Workout B',
      'Add 5lbs (2.5kg) to lifts every successful session - small jumps compound rapidly',
      'Squat every session to build leg strength and overall power base',
      'Deload only when you fail the same weight three sessions in a row',
      'Film your lifts to ensure form stays perfect as weight increases',
    ],
    principles: [
      { name: 'Linear Progression', description: 'Consistent small weight increases drive rapid beginner gains' },
      { name: 'Compound Focus', description: 'Multi-joint movements build total-body strength efficiently' },
      { name: 'Frequency Over Volume', description: 'Practice movements often rather than grinding high reps' },
      { name: 'Simplicity', description: 'Minimal exercise selection prevents analysis paralysis' },
    ],
  },

  // Arnold Golden Six
  'prog_arnold': {
    approach: 'Full-body training three times per week emphasizing compound movements for overall mass development. Based on Arnold Schwarzenegger\'s foundation routine, this program combines strength-building compounds with targeted isolation work. Functional training philosophy focusing on multi-muscle engagement and real-world movement patterns.',
    goals: [
      'Build total-body muscle mass and functional strength simultaneously',
      'Develop mind-muscle connection through focused execution',
      'Create balanced physique with proportional muscle development',
      'Establish training discipline through consistent full-body stimulus',
    ],
    guidelines: [
      'Train Monday-Wednesday-Friday with full rest days between sessions',
      'Focus on controlling the weight - every rep should be deliberate',
      'Engage multiple muscle groups simultaneously for efficient training',
      'Progress gradually - add weight only when rep quality remains perfect',
      'Prioritize recovery - full-body training demands adequate rest',
    ],
    principles: [
      { name: 'Full-Body Stimulus', description: 'Train entire body each session for balanced development' },
      { name: 'Time Efficiency', description: 'Multi-muscle exercises maximize results in minimal time' },
      { name: 'Mental Focus', description: 'Each rep requires concentration and intentional execution' },
      { name: 'Classic Fundamentals', description: 'Time-tested movements that build real muscle mass' },
    ],
  },

  // nSuns 5/3/1 LP (Linear Progression)
  'prog_nsuns': {
    approach: 'High-volume power-building program based on Wendler\'s 5/3/1 methodology adapted for linear progression. Famous for rapid bench press and squat gains through strategic volume accumulation and intelligent fatigue management. Not a beginner program - requires solid work capacity and recovery ability.',
    goals: [
      'Rapidly increase maximal strength on squat, bench, deadlift, overhead press',
      'Build work capacity through graduated volume sets',
      'Develop mental toughness via challenging rep schemes',
      'Master percentage-based progression for long-term strength gains',
    ],
    guidelines: [
      'Train 4-5 days per week with programmed main lifts and accessories',
      'Follow prescribed percentages exactly - they create optimal stimulus',
      'Add 5-10lbs per week to training max when all sets completed successfully',
      'Accessories are optional but recommended for balanced development',
      'Eat and sleep enough - high volume demands serious recovery',
    ],
    principles: [
      { name: 'Volume Accumulation', description: 'Strategic high-volume builds strength and size simultaneously' },
      { name: 'Percentage-Based', description: 'Scientific loading creates predictable progressive overload' },
      { name: 'Main Lift Focus', description: 'Prioritize compound barbell movements for maximum transfer' },
      { name: 'Linear Intensity', description: 'Consistent weight increases week-to-week drive rapid gains' },
    ],
  },

  // Evidence-Based Hypertrophy (Upper/Lower Split)
  'prog_evidence_hypertrophy': {
    approach: 'Science-backed periodized program designed for lifters 35-50 returning to training or seeking optimized hypertrophy. Features strategic volume progression from Minimum Effective Volume (MEV) to Maximum Adaptive Volume (MAV) with built-in deloads. Upper/Lower split allows twice-weekly frequency while managing recovery demands.',
    goals: [
      'Maximize muscle hypertrophy through evidence-based volume landmarks',
      'Optimize recovery for masters-age athletes (35-50 years old)',
      'Prevent overtraining through strategic deload implementation',
      'Build sustainable long-term training capacity with periodization',
    ],
    guidelines: [
      'Train 4 days per week in Upper/Lower/Upper/Lower rotation',
      'Follow the mesocycle structure: MEV → MAV → MAV+ → Deload',
      'Each muscle group trained twice per week with 72+ hours between sessions',
      'Deload weeks are mandatory - adaptation happens during recovery',
      'Track volume landmarks (MEV/MAV) to find your personal sweet spot',
    ],
    principles: [
      { name: 'Periodization', description: 'Structured phases optimize adaptation while preventing burnout' },
      { name: 'Volume Landmarks', description: 'Scientific approach to finding optimal training dose' },
      { name: 'Recovery Optimization', description: 'Designed for masters athletes with longer recovery needs' },
      { name: 'Evidence-Based', description: 'Every principle backed by hypertrophy research literature' },
    ],
  },

  // Greg Nuckols Beginner - Percentage-Based Strength
  'prog_gn_beginner': {
    approach: 'Scientific percentage-based training using AMAP (As Many As Possible) sets for individualized progression. Developed by powerlifting coach and researcher Greg Nuckols, this program uses your Training Max (90% of 1RM) to calculate working weights. Each 4-week cycle builds intensity, tests performance with AMAP sets, and includes strategic deload for recovery.',
    goals: [
      'Build absolute strength on squat, bench press, and deadlift',
      'Master percentage-based training and autoregulation principles',
      'Develop technical proficiency through high-frequency practice (3x/week)',
      'Learn to gauge and manage training intensity using AMAP feedback',
    ],
    guidelines: [
      'Calculate your Training Max (TM) = 90% of your estimated 1RM before starting',
      'Week 1-2: Build intensity with controlled percentage increases (70-85%)',
      'Week 3: Test performance with AMAP sets - hit as many quality reps as possible',
      'Week 4: Mandatory deload at 60% to recover and prepare for next cycle',
      'Increase TM based on AMAP performance: 10+ reps = +10lbs, 7-9 reps = +5lbs, 5-6 reps = maintain',
    ],
    principles: [
      { name: 'Percentage-Based Loading', description: 'Precise intensity control using % of Training Max' },
      { name: 'AMAP Progression', description: 'Performance-based advancement ensures sustainable growth' },
      { name: 'Autoregulation', description: 'AMAP sets adapt to your daily readiness and recovery' },
      { name: 'Cyclical Periodization', description: '4-week waves prevent stagnation and overtraining' },
    ],
  },
};

/**
 * Get program-specific methodology
 * Falls back to generic content if program not found
 */
export function getProgramMethodology(programId: string): ProgramMethodology {
  return PROGRAM_METHODOLOGIES[programId] || {
    approach: 'This program emphasizes progressive overload through structured volume and intensity manipulation. Each week builds upon the previous, systematically increasing demand to drive adaptation and growth.',
    goals: [
      'Build strength across major compound movements',
      'Develop muscular hypertrophy through optimal volume',
      'Improve work capacity and training density',
      'Establish consistent progressive overload patterns',
    ],
    guidelines: [
      'Follow the prescribed session order - do not skip days',
      'Rest 48-72 hours between sessions targeting the same muscle groups',
      'Track every set with accurate weights and reps for progression analysis',
      'Increase weight when you hit the top of the rep range for all sets',
      'Maintain 1-2 reps in reserve (RIR) unless specified otherwise',
    ],
    principles: [
      { name: 'Progressive Overload', description: 'Gradually increase training stress over time' },
      { name: 'Specificity', description: 'Train movements and rep ranges aligned with your goals' },
      { name: 'Recovery', description: 'Adaptation happens during rest, not just training' },
      { name: 'Consistency', description: 'Regular training trumps sporadic perfection' },
    ],
  };
}
