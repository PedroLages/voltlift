/**
 * Vercel Serverless Function - Gemini AI Proxy
 *
 * Securely proxies Gemini API requests from the client.
 * API key is stored in Vercel environment variables (not exposed to client).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers for frontend requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Restrict to your domain in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    // Validate request
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields: type, data' });
    }

    // Get API key from environment (secure - not exposed to client)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured in environment');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Route based on request type
    let prompt = '';
    switch (type) {
      case 'progressive_overload':
        prompt = generateProgressiveOverloadPrompt(data);
        break;
      case 'motivation':
        prompt = generateMotivationPrompt(data);
        break;
      case 'exercise_visual':
        prompt = generateExerciseVisualPrompt(data);
        break;
      case 'generic':
        // Generic prompt passed directly from client
        prompt = data.prompt || '';
        if (!prompt) {
          return res.status(400).json({ error: 'Missing prompt for generic request' });
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid request type' });
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Return response with CORS headers
    return res.status(200).json({
      success: true,
      result: text
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'Failed to get AI suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Prompt generators
function generateProgressiveOverloadPrompt(data: any): string {
  const { exercise, lastWeight, lastReps, lastSets } = data;

  return `You are a strength training coach. Based on the following workout data, provide ONE concise progressive overload tip (max 2 sentences):

Exercise: ${exercise}
Last workout: ${lastSets} sets of ${lastReps} reps at ${lastWeight}kg

Tip should be specific, actionable, and motivating.`;
}

function generateMotivationPrompt(data: any): string {
  const { workoutType, duration } = data;

  return `Generate a short, aggressive motivational quote (max 10 words) for someone who just completed:
- Workout type: ${workoutType || 'strength training'}
- Duration: ${duration || 'intense'} minutes

Make it energizing and hardcore.`;
}

function generateExerciseVisualPrompt(data: any): string {
  const { exerciseName, muscleGroups } = data;

  return `Describe the proper form for ${exerciseName} exercise targeting ${muscleGroups.join(', ')} in 2-3 concise bullet points. Focus on key cues and common mistakes to avoid.`;
}
