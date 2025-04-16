import OpenAI from 'openai';

// Create a factory function to initialize the OpenAI client
export function createOpenAIClient() {
  return new OpenAI({
    baseURL: process.env.DEEPSEEK_API_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

// Export a lazy-loaded client
export const openaiClient = {
  get chat() {
    const client = createOpenAIClient();
    return client.chat;
  },
};
