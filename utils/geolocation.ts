/**
 * Geolocation utilities for detecting user's region and setting appropriate defaults
 */

/**
 * Countries that use imperial units (LBS)
 * Source: https://en.wikipedia.org/wiki/Imperial_units
 */
const IMPERIAL_COUNTRIES = [
  'US', // United States
  'LR', // Liberia
  'MM', // Myanmar
  'GB', // United Kingdom (mixed usage, but imperial for body weight)
];

/**
 * Detect the user's country code from browser language settings
 * Returns 2-letter ISO country code (e.g., 'US', 'NL', 'GB')
 */
export const detectCountryCode = (): string | null => {
  // Try to get country from browser language (e.g., "en-US" → "US")
  const language = navigator.language || (navigator as any).userLanguage;

  if (!language) return null;

  // Extract country code from language tag (e.g., "en-US" → "US", "nl-NL" → "NL")
  const parts = language.split('-');
  if (parts.length === 2) {
    return parts[1].toUpperCase();
  }

  // Handle single language codes (e.g., "en" → assume US)
  const languageCode = parts[0].toLowerCase();
  const languageToCountry: Record<string, string> = {
    'en': 'US', // Default English to US
    'nl': 'NL', // Dutch to Netherlands
    'de': 'DE', // German to Germany
    'fr': 'FR', // French to France
    'es': 'ES', // Spanish to Spain
    'it': 'IT', // Italian to Italy
    'pt': 'BR', // Portuguese to Brazil
    'ja': 'JP', // Japanese to Japan
    'zh': 'CN', // Chinese to China
    'ko': 'KR', // Korean to South Korea
    'ru': 'RU', // Russian to Russia
  };

  return languageToCountry[languageCode] || null;
};

/**
 * Determine if a country uses imperial units (LBS) or metric (KG)
 * @param countryCode 2-letter ISO country code
 * @returns 'lbs' or 'kg'
 */
export const getDefaultUnits = (countryCode: string | null): 'lbs' | 'kg' => {
  if (!countryCode) {
    // Default to metric (used by ~95% of world population)
    return 'kg';
  }

  return IMPERIAL_COUNTRIES.includes(countryCode.toUpperCase()) ? 'lbs' : 'kg';
};

/**
 * Auto-detect user's default units based on browser location
 * @returns 'lbs' or 'kg'
 */
export const detectDefaultUnits = (): 'lbs' | 'kg' => {
  const countryCode = detectCountryCode();
  return getDefaultUnits(countryCode);
};

/**
 * Get default bar weight based on units
 * Standard Olympic barbell: 45 lbs (20 kg)
 * Women's barbell: 35 lbs (15 kg)
 */
export const getDefaultBarWeight = (units: 'lbs' | 'kg'): number => {
  return units === 'lbs' ? 45 : 20;
};
