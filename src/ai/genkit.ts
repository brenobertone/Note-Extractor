import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // Allow model override via env var for fast/accurate switching
  model: process.env.AI_MODEL || 'googleai/gemini-2.5-flash',
});
