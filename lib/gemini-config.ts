import { GoogleGenAI } from '@google/genai';

/**
 * Gets the Gemini API key from various environment variables.
 * Prioritizes the user-provided free tier key if no environment variables are set.
 */
export function getGeminiApiKey(): string | null {
  // Use the specific key provided by the user as the default if environment variables are missing
  const userKey = "AIzaSyBrnf7Um1QRwiA99mlET7iuDDLClR7pGG4";
  
  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];

  // Find a valid environment key that isn't the placeholder
  const envKey = envKeys.find(k => k && k.trim() !== '' && k !== 'MY_GEMINI_API_KEY');
  
  return envKey || userKey;
}

/**
 * Initializes and returns a GoogleGenAI client.
 */
export function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  return new GoogleGenAI({ apiKey });
}
