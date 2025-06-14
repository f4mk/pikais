import OpenAI from 'openai';

import { DEEPSEEK_API_KEY, DEEPSEEK_API_URL } from './consts';

// Create a factory function to initialize the OpenAI client
export function createOpenAIClient() {
  return new OpenAI({
    baseURL: DEEPSEEK_API_URL,
    apiKey: DEEPSEEK_API_KEY,
  });
}

// Export a lazy-loaded client
let clientInstance: OpenAI | null = null;
export const openaiClient = {
  get client() {
    if (!clientInstance) {
      clientInstance = createOpenAIClient();
    }
    return clientInstance;
  },
};
