import OpenAI from 'openai';

import { GROK_API_KEY, GROK_API_URL } from './consts';
import { customFetch } from './utils';

export type OpenAIClient = OpenAI & { model: string };

export function createOpenAIClient() {
  const client = new OpenAI({
    baseURL: GROK_API_URL,
    apiKey: GROK_API_KEY,
    fetch: customFetch,
  }) as OpenAIClient;

  client.model = 'grok-4';

  return client;
}

// Export a lazy-loaded client
let clientInstance: OpenAIClient | null = null;
export const openaiClient = {
  get client() {
    if (!clientInstance) {
      clientInstance = createOpenAIClient();
    }
    return clientInstance;
  },
};
