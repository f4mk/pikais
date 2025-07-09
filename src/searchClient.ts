import { OpenAI } from 'openai';

import { PERPLEXITY_API_KEY, PERPLEXITY_API_URL } from './consts';

export function createSearchClient() {
  return new OpenAI({
    baseURL: PERPLEXITY_API_URL,
    apiKey: PERPLEXITY_API_KEY,
  });
}

let clientInstance: OpenAI | null = null;
export const searchClient = {
  get client() {
    if (!clientInstance) {
      clientInstance = createSearchClient();
    }
    return clientInstance;
  },
};
