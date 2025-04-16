export const MAX_MESSAGES = 20;
export const CONVERSATION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
export const CLEAR_COMMAND = '!clear';
export const TOKENS_COMMAND = '!tokens';
export const TEMP_COMMAND = '!temp';
export const SYSTEM_COMMAND = '!system';

export const DEFAULT_MAX_TOKENS = 4096;
export const MAX_ALLOWED_TOKENS = 8192;
export const MIN_ALLOWED_TOKENS = 1;
export const DEFAULT_TEMPERATURE = 1.0;
export const MAX_TEMPERATURE = 2.0;
export const MIN_TEMPERATURE = 0.0;

export const DEFAULT_SYSTEM_MESSAGE =
  'You are a helpful assistant runnig as a discord bot. When you see a user mention in your prompt, you must reference this user in your output message in appropriate way, as a user would expect you to do';
