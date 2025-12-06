/**
 * Greg Nuckols AI Coaching Service
 *
 * Uses Gemini AI to provide intelligent coaching for percentage-based programming:
 * - Training Max adjustment suggestions
 * - Deload timing recommendations
 * - Exercise substitutions
 * - Performance pattern analysis
 */

import { TrainingMax, WorkoutSession, DailyLog } from '../types';
import { getAMAPProgression, getAMAPDescription } from '../utils/percentageCalculator';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface TMSuggestion {
  recommended: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  alternative?: number;
}

interface DeloadRecommendation {
  shouldDeload: boolean;
  urgency: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestedWeeks: number;
}

interface PerformanceInsight {
  trend: 'improving' | 'plateauing' | 'declining';
  keyFactors: string[];
  recommendations: string[];
}

// ============================================
// Training Max Adjustment Suggestions
// ============================================

/**
 * Get AI-enhanced Training Max suggestion
 * Falls back to standard AMAP progression if API unavailable
 */
export async function getTrainingMaxSuggestion(
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
    sleep?: number; // hours per night (last 7 days avg)
    stress?: number; // 1-10 scale
    soreness?: number; // 1-10 scale
    bodyweight?: number; // current bodyweight
    bodyweightChange?: number; // lbs change over last 2 weeks
  }
): Promise<TMSuggestion> {

  // Get standard AMAP progression as baseline
  const standardProgression = getAMAPProgression(
    exerciseId === 'e4' ? 'squat' : exerciseId === 'e1' ? 'bench' : 'deadlift',
    amapReps
  );
  const standardRecommended = currentTM + standardProgression;
  const standardDescription = getAMAPDescription(
    exerciseId === 'e4' ? 'squat' : exerciseId === 'e1' ? 'bench' : 'deadlift',
    amapReps
  );

  // Fallback if no API key
  if (!GEMINI_API_KEY) {
    return {
      recommended: standardRecommended,
      reasoning: standardDescription,
      confidence: 'medium'
    };
  }

  try {
    // Build context for AI
    const prompt = `You are an expert strength coach analyzing Training Max progression for ${exerciseName}.

CURRENT SITUATION:
- Current Training Max: ${currentTM} lbs
- AMAP Set Performance: ${amapReps} reps at 85% (target: 5-6 good, 7-9 great, 10+ excellent)
- Set Completion: ${recentPerformance.completedSets}/${recentPerformance.totalSets} sets completed
- Missed Reps: ${recentPerformance.missedReps} total
${recentPerformance.averageRPE ? `- Average RPE: ${recentPerformance.averageRPE}/10` : ''}

RECOVERY METRICS (last 7 days):
${recoveryMetrics?.sleep ? `- Average Sleep: ${recoveryMetrics.sleep} hrs/night` : '- Sleep: Not tracked'}
${recoveryMetrics?.stress ? `- Stress Level: ${recoveryMetrics.stress}/10` : '- Stress: Not tracked'}
${recoveryMetrics?.soreness ? `- Muscle Soreness: ${recoveryMetrics.soreness}/10` : '- Soreness: Not tracked'}
${recoveryMetrics?.bodyweightChange ? `- Bodyweight Change: ${recoveryMetrics.bodyweightChange > 0 ? '+' : ''}${recoveryMetrics.bodyweightChange} lbs` : ''}

STANDARD RECOMMENDATION:
Based on AMAP performance alone, the standard increase would be: +${standardProgression} lbs (New TM: ${standardRecommended} lbs)

YOUR TASK:
Analyze the complete picture (AMAP reps + set completion + RPE + recovery metrics) and recommend:
1. New Training Max (consider recovery context)
2. Clear reasoning (2-3 sentences max)
3. Confidence level (high/medium/low)
4. Optional alternative TM if uncertain

Respond in this EXACT JSON format:
{
  "recommended": <number>,
  "reasoning": "<string>",
  "confidence": "high|medium|low",
  "alternative": <number or null>
}

Be conservative with poor recovery. Be aggressive with excellent performance + good recovery.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for consistent recommendations
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      console.warn('Gemini API error, using standard progression');
      return {
        recommended: standardRecommended,
        reasoning: standardDescription,
        confidence: 'medium'
      };
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const suggestion = JSON.parse(jsonMatch[0]) as TMSuggestion;

    // Validate suggestion is reasonable (within ±20 lbs of standard)
    if (Math.abs(suggestion.recommended - standardRecommended) > 20) {
      console.warn('AI suggestion too far from standard, using standard');
      suggestion.recommended = standardRecommended;
      suggestion.confidence = 'low';
      suggestion.reasoning += ' (Adjusted to standard progression for safety)';
    }

    return suggestion;

  } catch (error) {
    console.error('Error getting AI TM suggestion:', error);
    return {
      recommended: standardRecommended,
      reasoning: standardDescription,
      confidence: 'medium'
    };
  }
}

// ============================================
// Deload Recommendations
// ============================================

/**
 * Determine if user should deload based on performance and recovery
 */
export async function getDeloadRecommendation(
  cyclesCompleted: number,
  recentSessions: WorkoutSession[],
  recoveryMetrics?: {
    avgSleep: number;
    avgStress: number;
    avgSoreness: number;
    bodyweightChange: number;
  }
): Promise<DeloadRecommendation> {

  // Standard rule: deload every 4 weeks (1 cycle)
  const shouldDeloadBySchedule = cyclesCompleted > 0 && cyclesCompleted % 1 === 0;

  if (!GEMINI_API_KEY) {
    return {
      shouldDeload: shouldDeloadBySchedule,
      urgency: shouldDeloadBySchedule ? 'high' : 'low',
      reasoning: shouldDeloadBySchedule
        ? 'Cycle complete - scheduled deload week'
        : 'Continue current cycle',
      suggestedWeeks: 1
    };
  }

  try {
    // Analyze recent performance
    const totalSets = recentSessions.reduce((sum, s) =>
      sum + s.logs.reduce((sets, log) => sets + log.sets.length, 0), 0
    );
    const completedSets = recentSessions.reduce((sum, s) =>
      sum + s.logs.reduce((sets, log) =>
        sets + log.sets.filter(set => set.completed).length, 0
      ), 0
    );
    const completionRate = totalSets > 0 ? (completedSets / totalSets) * 100 : 100;

    const prompt = `You are an expert strength coach analyzing whether an athlete needs a deload week.

TRAINING DATA:
- Cycles Completed: ${cyclesCompleted}
- Recent Sessions: ${recentSessions.length} workouts in last 2 weeks
- Set Completion Rate: ${completionRate.toFixed(1)}%
- Scheduled Deload: ${shouldDeloadBySchedule ? 'YES (cycle complete)' : 'NO'}

RECOVERY METRICS:
${recoveryMetrics ? `
- Average Sleep: ${recoveryMetrics.avgSleep.toFixed(1)} hrs/night (target: 7-9)
- Average Stress: ${recoveryMetrics.avgStress.toFixed(1)}/10 (lower is better)
- Average Soreness: ${recoveryMetrics.avgSoreness.toFixed(1)}/10 (lower is better)
- Bodyweight Change: ${recoveryMetrics.bodyweightChange > 0 ? '+' : ''}${recoveryMetrics.bodyweightChange.toFixed(1)} lbs
` : '- Not tracked'}

DELOAD CRITERIA:
- Scheduled deload every 4 weeks (1 cycle)
- Poor sleep (<6 hrs) suggests need for deload
- High stress (>7) or soreness (>7) suggests overtraining
- Set completion <85% suggests accumulated fatigue
- Rapid weight loss (>3 lbs/week) suggests insufficient recovery

YOUR TASK:
Decide if athlete should deload NOW, and provide:
1. shouldDeload: true/false
2. urgency: high/medium/low
3. reasoning: Why or why not (2-3 sentences)
4. suggestedWeeks: How many weeks to deload (1-2)

Respond in EXACT JSON format:
{
  "shouldDeload": <boolean>,
  "urgency": "high|medium|low",
  "reasoning": "<string>",
  "suggestedWeeks": <number>
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error getting deload recommendation:', error);
    return {
      shouldDeload: shouldDeloadBySchedule,
      urgency: shouldDeloadBySchedule ? 'high' : 'low',
      reasoning: shouldDeloadBySchedule
        ? 'Cycle complete - scheduled deload week'
        : 'Continue training',
      suggestedWeeks: 1
    };
  }
}

// ============================================
// Exercise Substitutions
// ============================================

/**
 * Get exercise substitution recommendations
 */
export async function getExerciseSubstitution(
  exerciseName: string,
  reason: 'injury' | 'equipment' | 'preference' | 'variation',
  details?: string
): Promise<{ substitutes: string[]; reasoning: string }> {

  if (!GEMINI_API_KEY) {
    // Simple fallback substitutions
    const fallbacks: Record<string, string[]> = {
      'Squat': ['Front Squat', 'Goblet Squat', 'Leg Press', 'Bulgarian Split Squat'],
      'Bench Press': ['Dumbbell Bench Press', 'Floor Press', 'Push-ups', 'Incline Bench'],
      'Deadlift': ['Trap Bar Deadlift', 'Romanian Deadlift', 'Rack Pulls', 'Sumo Deadlift']
    };

    return {
      substitutes: fallbacks[exerciseName] || ['Consult a coach'],
      reasoning: 'Standard substitutions for this movement pattern'
    };
  }

  try {
    const prompt = `You are an expert strength coach recommending exercise substitutions.

ORIGINAL EXERCISE: ${exerciseName}
REASON FOR SUBSTITUTION: ${reason}
${details ? `ADDITIONAL CONTEXT: ${details}` : ''}

REQUIREMENTS:
- Maintain similar movement pattern if possible
- Consider ${reason === 'injury' ? 'reduced stress on injured area' :
                reason === 'equipment' ? 'available equipment alternatives' :
                reason === 'variation' ? 'similar stimulus with different mechanics' :
                'athlete preference while maintaining effectiveness'}
- Suggest 3-4 viable alternatives
- Prioritize safety and effectiveness

Respond in EXACT JSON format:
{
  "substitutes": ["<exercise 1>", "<exercise 2>", "<exercise 3>"],
  "reasoning": "<brief explanation>"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 300 }
      })
    });

    if (!response.ok) throw new Error('API failed');

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('No JSON');

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error getting substitution:', error);
    return {
      substitutes: ['Consult a coach for alternatives'],
      reasoning: 'Unable to generate AI recommendations'
    };
  }
}

// ============================================
// Performance Pattern Analysis
// ============================================

/**
 * Analyze long-term performance trends
 */
export async function analyzePerformanceTrend(
  exerciseName: string,
  tmHistory: { value: number; date: number }[],
  recentSessions: WorkoutSession[]
): Promise<PerformanceInsight> {

  if (!GEMINI_API_KEY || tmHistory.length < 2) {
    return {
      trend: 'improving',
      keyFactors: ['Not enough data for analysis'],
      recommendations: ['Complete at least 2 cycles for trend analysis']
    };
  }

  try {
    // Calculate TM changes
    const tmChanges = tmHistory.slice(1).map((tm, i) =>
      tm.value - tmHistory[i].value
    );
    const avgChange = tmChanges.reduce((a, b) => a + b, 0) / tmChanges.length;

    // Calculate volume trend
    const volumeBySession = recentSessions.map(session =>
      session.logs.reduce((vol, log) =>
        vol + log.sets.reduce((setVol, set) =>
          setVol + (set.weight * set.reps), 0
        ), 0
      )
    );

    const prompt = `You are analyzing ${exerciseName} performance trends.

TRAINING MAX HISTORY (last ${tmHistory.length} cycles):
${tmHistory.map((tm, i) => `Cycle ${i + 1}: ${tm.value} lbs`).join('\n')}
- Average TM increase: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)} lbs/cycle

RECENT VOLUME TREND:
${volumeBySession.map((vol, i) => `Session ${i + 1}: ${vol.toFixed(0)} lbs`).join('\n')}

Analyze the trend and provide:
1. trend: "improving" | "plateauing" | "declining"
2. keyFactors: [list 2-3 key observations]
3. recommendations: [list 2-3 actionable next steps]

Respond in EXACT JSON format:
{
  "trend": "improving|plateauing|declining",
  "keyFactors": ["<factor 1>", "<factor 2>"],
  "recommendations": ["<rec 1>", "<rec 2>"]
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
      })
    });

    if (!response.ok) throw new Error('API failed');

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('No JSON');

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error analyzing performance:', error);
    return {
      trend: 'improving',
      keyFactors: ['Analysis unavailable'],
      recommendations: ['Continue with current program']
    };
  }
}
