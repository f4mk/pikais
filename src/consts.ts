import * as dotenv from 'dotenv';

// Initialize dotenv at the beginning
dotenv.config();

// Environment variables
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
export const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
export const RECRAFT_API_KEY = process.env.RECRAFT_API_KEY;
export const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
export const PERPLEXITY_API_URL = process.env.PERPLEXITY_API_URL;
export const GROK_API_KEY = process.env.GROK_API_KEY;
export const GROK_API_URL = process.env.GROK_API_URL;

// Check for required environment variables
if (!DISCORD_TOKEN) {
  throw new Error('DISCORD_TOKEN is required');
}

if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is required');
}

if (!DEEPSEEK_API_URL) {
  throw new Error('DEEPSEEK_API_URL is required');
}

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

if (!STABILITY_API_KEY) {
  throw new Error('STABILITY_API_KEY is required');
}

if (!RECRAFT_API_KEY) {
  throw new Error('RECRAFT_API_KEY is required');
}

if (!PERPLEXITY_API_KEY) {
  throw new Error('PERPLEXITY_API_KEY is required');
}

if (!PERPLEXITY_API_URL) {
  throw new Error('PERPLEXITY_API_URL is required');
}

if (!GROK_API_KEY) {
  throw new Error('GROK_API_KEY is required');
}

if (!GROK_API_URL) {
  throw new Error('GROK_API_URL is required');
}

// Constants
export const MAX_MESSAGES = 20;
export const CONVERSATION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
export const CLEAR_COMMAND = '!clear';
export const TOKENS_COMMAND = '!tokens';
export const TEMP_COMMAND = '!temp';
export const SYSTEM_COMMAND = '!system';
export const IMG_COMMAND = '!img';
export const GIMG_COMMAND = '!gimg';
export const EDIT_COMMAND = '!edit';
export const RIMG_COMMAND = '!rimg';
export const VIDEO_COMMAND = '!video';
export const HELP_COMMAND = '!help';
export const SEARCH_COMMAND = '!search';

export const HELP_TEXT = `🤖 **Available Commands**

**Basic Commands:**
\`!help\` - Shows this help message
\`!clear\` - Clears conversation history and resets system prompt
\`!system [prompt]\` - Sets a custom system prompt for the AI (only affects text generation)
\`!search [query]\` - Search the web using Perplexity AI

**Image Generation:**
\`!img [prompt]\` - Generate an image using DALL-E 3 (prompt can be in message or replied message)
\`!gimg [prompt]\` - Generate an image using Google Gemini (prompt can be in message or replied message)
\`!rimg [prompt]\` - Generate an image using Recraft.ai (prompt can be in message or replied message)
\`!edit [prompt]\` - Edit an image using Recraft.ai (requires image attachment or reply to image)

**Video Generation:**
\`!video [prompt]\` - Generate a video using Stability AI (requires image attachment or reply to image)

**Response Control (only affects text generation):**
\`!tokens=[number]\` - Set max tokens (1-8192, default: 4096)
\`!temp=[number]\` - Set temperature (0-2, default: 1.0)

**Usage Examples:**
• \`@BotName !img a cute cat playing with yarn\`
• \`@BotName !rimg a beautiful sunset in digital art style\`
• \`@BotName !edit make this more vibrant (with image attachment)\`
• \`@BotName !system You are a helpful coding assistant\`
• \`@BotName !tokens=2000 !temp=0.7 Explain quantum computing\`
• \`@BotName !search latest news about AI\`

**Notes:**
• Commands must be at the start of your message after mentioning the bot
• You can combine multiple commands (e.g., !tokens and !temp)
• System prompt changes persist until cleared or timeout (2 hours)
• For image/video generation, you can either attach an image or reply to a message containing an image
• Response control commands (!tokens, !temp) and system prompt only affect text generation
• Recraft.ai automatically detects and applies the best style for your prompt (no need to specify style manually)`;

export const DEFAULT_MAX_TOKENS = 4096;
export const MAX_ALLOWED_TOKENS = 8192;
export const MIN_ALLOWED_TOKENS = 1;
export const DEFAULT_TEMPERATURE = 1.0;
export const MAX_TEMPERATURE = 2.0;
export const MIN_TEMPERATURE = 0.0;

export const DEFAULT_SYSTEM_MESSAGE = `You are a helpful assistant runnig as a discord bot.When providing 
  information from sources, include actual URLs in markdown format 
  like [link text](https://example.com) rather than just reference numbers. 
  If you cannot provide actual URLs, avoid using reference-style links. 
  You MUST follow the instructions very precisely. 
  If a user asks you to use realtime search, 
  you MUST do it, no excuses.`;
