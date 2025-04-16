import OpenAI from 'openai';

import { CONVERSATION_TIMEOUT_MS, DEFAULT_SYSTEM_MESSAGE } from './consts';

// Store conversation history for each user
export const conversationHistory = new Map<
  string,
  Array<OpenAI.Chat.ChatCompletionMessageParam>
>();

// Store timeouts for each user's conversation
export const conversationTimeouts = new Map<string, NodeJS.Timeout>();

// Function to get or initialize conversation history
export const getConversationHistory = (
  userId: string
): Array<OpenAI.Chat.ChatCompletionMessageParam> => {
  if (!conversationHistory.has(userId)) {
    // Initialize with the default system message
    conversationHistory.set(userId, [
      { role: 'system', content: DEFAULT_SYSTEM_MESSAGE },
    ]);
  }

  // Clear any existing timeout
  const existingTimeout = conversationTimeouts.get(userId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set new timeout
  const timeout = setTimeout(() => {
    conversationHistory.delete(userId);
    conversationTimeouts.delete(userId);
  }, CONVERSATION_TIMEOUT_MS);

  conversationTimeouts.set(userId, timeout);

  return conversationHistory.get(userId)!;
};

export const cleanupTimeouts = () => {
  for (const timeout of conversationTimeouts.values()) {
    clearTimeout(timeout);
  }
  conversationTimeouts.clear();
};
