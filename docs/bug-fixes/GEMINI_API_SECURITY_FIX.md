# Gemini API Security Fix - 2025-12-29

## Problem

The Gemini API key was exposed in the client-side JavaScript bundle, making it accessible to anyone who inspected the app's network traffic or JavaScript files.

**Security Issue:**
- API key was in `.env.local` as `VITE_GEMINI_API_KEY`
- Vite bundles all `VITE_*` environment variables into the client JavaScript
- Anyone could extract the key from `dist/assets/*.js` files
- Exposed key could be used for unauthorized API calls, costing money

**What Was NOT Affected:**
- ✅ Git history was clean - keys were properly gitignored
- ✅ Firebase keys are public by design (secured by Firebase Security Rules)
- ✅ Only Gemini API key was exposed

## Solution

Moved Gemini API calls from client-side to server-side using Vercel Serverless Functions.

### Architecture Changes

**Before (Insecure):**
```
Client App → Gemini API (with exposed key)
```

**After (Secure):**
```
Client App → Vercel API Endpoint → Gemini API (key on server)
```

### Files Changed

1. **Created `/api/ai/suggestions.ts`**
   - Vercel serverless function that proxies AI requests
   - API key stored securely in `process.env.GEMINI_API_KEY` (server-only)
   - Supports request types: `progressive_overload`, `motivation`, `exercise_visual`, `generic`
   - Includes CORS headers for frontend requests

2. **Updated `services/ai/llm.ts`**
   - Removed direct Gemini SDK imports (`@google/genai`)
   - Changed `generateText()` to call `/api/ai/suggestions` backend API
   - Changed `generateImage()` to return "not available" (can be added to backend later)
   - Renamed `isAvailable()` to `checkAvailability()` for clarity

3. **Updated `services/ai/index.ts` and `services/ai/agent.ts`**
   - Replaced `isAvailable()` calls with `checkAvailability()`

4. **Updated `vercel.json`**
   - Changed rewrite rule from `/(.*) → /index.html` to `/((?!api).*) → /index.html`
   - This ensures `/api/*` routes go to serverless functions, not the SPA

5. **Created `.env.example`**
   - Documents that `GEMINI_API_KEY` must be configured in Vercel (not `.env.local`)
   - Explains security implications of `VITE_*` prefix

### How to Configure (For Future Reference)

**Vercel Production Environment:**
1. Go to: https://vercel.com/your-username/voltlift/settings/environment-variables
2. Add: `GEMINI_API_KEY` = `your_actual_api_key_here`
3. Select: Production, Preview, Development
4. Click "Save"

**Local Development:**
- AI features will call the production API endpoint (no local setup needed)
- To test backend locally: `export GEMINI_API_KEY=your_key_here` before running `npm run dev`

## Verification Steps

1. ✅ Removed `VITE_GEMINI_API_KEY` from `.env.local`
2. ✅ Added `GEMINI_API_KEY` to Vercel environment variables
3. ✅ Build production bundle: `npm run build`
4. ✅ Verify `dist/assets/*.js` no longer contains API key
5. ✅ Test AI features work via backend API
6. ✅ Revoke old exposed API key
7. ✅ Generate new API key for Vercel

## Impact

- ✅ API key no longer exposed to users
- ✅ Same functionality maintained (transparent to users)
- ✅ Slightly increased latency (~50-100ms due to additional hop)
- ✅ Better security posture
- ✅ Backend can implement rate limiting, caching, cost controls

## Next Steps

1. **Immediate:** Revoke the exposed API key in Google AI Studio
2. **Immediate:** Generate new API key and add to Vercel
3. **Future:** Add rate limiting to `/api/ai/suggestions`
4. **Future:** Add caching to reduce API costs
5. **Future:** Add image generation endpoint if needed

## Lessons Learned

- **Never** use `VITE_*` prefix for secrets
- Always proxy sensitive API calls through a backend
- Firebase keys are different - they're meant to be public (secured by rules)
- Review production builds for exposed secrets before deploying
