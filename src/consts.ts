import * as dotenv from 'dotenv';

// Initialize dotenv at the beginning
dotenv.config();

// Environment variables
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
export const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Check for required environment variables
if (!DISCORD_TOKEN) {
  throw new Error('DISCORD_TOKEN is required');
}

if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is required');
}

// Note: GEMINI_API_KEY is checked at usage time
// Note: OPENAI_API_KEY is checked at usage time

// Constants
export const MAX_MESSAGES = 20;
export const CONVERSATION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
export const CLEAR_COMMAND = '!clear';
export const TOKENS_COMMAND = '!tokens';
export const TEMP_COMMAND = '!temp';
export const SYSTEM_COMMAND = '!system';
export const IMG_COMMAND = '!img';

export const DEFAULT_MAX_TOKENS = 4096;
export const MAX_ALLOWED_TOKENS = 8192;
export const MIN_ALLOWED_TOKENS = 1;
export const DEFAULT_TEMPERATURE = 1.0;
export const MAX_TEMPERATURE = 2.0;
export const MIN_TEMPERATURE = 0.0;

export const DEFAULT_SYSTEM_MESSAGE =
  'You are a helpful assistant runnig as a discord bot. When you see a @user mention (e.g. @JohnDoe) in your prompt, you must reference this user in your output message in appropriate way, as a user would expect you to do';
