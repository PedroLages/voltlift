import { GoogleGenAI } from "@google/genai";
import { ExerciseLog, Exercise, UserSettings } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getProgressiveOverloadTip = async (
  exerciseId: string,
  history: ExerciseLog[],
  userSettings: UserSettings
): Promise<string | null> => {
  const client = getClient();
  if (!client) return "Simulated AI: Increase weight by 2.5kg if you hit all reps last time.";

  const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
  if (!exercise) return null;

  // Flatten last 3 sessions for this exercise
  const recentLogs = history.slice(0, 3).map(log => ({
    date: 'Previous Session',
    sets: log.sets.map(s => `${s.weight}${userSettings.units} x ${s.reps} reps`).join(', ')
  }));

  const prompt = `
    Context: User is doing ${exercise.name}.
    Goal: ${userSettings.goal.type}.
    Recent History: ${JSON.stringify(recentLogs)}.
    
    Task: Provide a ONE SENTENCE tip for progressive overload for the next set.
    Example output: "Increase weight to 140lbs for 6 reps to push strength." or "Keep weight same, aim for slower eccentric."
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const getWorkoutMotivation = async (name: string): Promise<string> => {
    const client = getClient();
    if (!client) return "Let's crush this workout!";

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Give me a short, intense motivational quote for a workout. Maximum 10 words. Add an emoji.`,
        });
        return response.text;
    } catch (e) {
        return "Time to grind! 💪";
    }
}

export const generateExerciseVisual = async (exerciseName: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
  const client = getClient();
  if (!client) {
     // Return null to indicate no API key or simulated environment (handled by UI)
     return null; 
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `Create a high-contrast, technical schematic line drawing of a person performing the exercise: ${exerciseName}. Style: Cyberpunk blueprint, white lines on black background, neon yellow highlights on the primary muscle group being worked. Minimalist and clean.` }]
      },
      config: {
          imageConfig: {
              imageSize: size
          }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("Gemini Image Gen Error:", e);
    return null;
  }
}