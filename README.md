# Discord Bot with AI Capabilities

A Discord bot that integrates with various AI services for text, image, and video generation.

## Features

- **Text Generation**: Powered by Deepseek API
- **Image Generation**:
  - DALL-E 3 via `!img` command
  - Google Gemini via `!gimg` command
  - Image editing via Stability AI via `!edit` command
- **Video Generation**: Stability AI video generation via `!video` command
- **Conversation Management**: Maintains context and allows system prompt customization
- **Response Control**: Adjustable tokens and temperature for text generation

## Commands

### Basic Commands

- `!help` - Shows all available commands and usage instructions
- `!clear` - Clears conversation history and resets system prompt
- `!system [prompt]` - Sets a custom system prompt for the AI (only affects text generation)

### Image Generation

- `!img [prompt]` - Generate an image using DALL-E 3
  - Prompt can be in the message or in a replied message
- `!gimg [prompt]` - Generate an image using Google Gemini
  - Prompt can be in the message or in a replied message
- `!edit [prompt]` - Edit an image using Stability AI
  - Requires image attachment or reply to a message containing an image

### Video Generation

- `!video [prompt]` - Generate a video using Stability AI
  - Requires image attachment or reply to a message containing an image
  - Prompt can be in the message or in a replied message

### Response Control (only affects text generation)

- `!tokens=[number]` - Set maximum tokens (1-8192, default: 4096)
- `!temp=[number]` - Set temperature (0-2, default: 1.0)

## Usage Examples

```
@BotName !img a cute cat playing with yarn
@BotName !system You are a helpful coding assistant
@BotName !tokens=2000 !temp=0.7 Explain quantum computing
```

## Code Structure

- `src/main.ts` - Main bot setup and message handling
- `src/utils.ts` - Utility functions for message processing and command handling
- `src/consts.ts` - Constants and configuration
- `src/history.ts` - Conversation history management
- `src/imageService.ts` - Image generation service integration
- `src/videoService.ts` - Video generation service integration
- `src/openaiClient.ts` - Deepseek API client setup

## Notes

- Commands must be at the start of your message after mentioning the bot
- You can combine multiple commands (e.g., !tokens and !temp)
- System prompt changes persist until cleared or timeout (2 hours)
- For image/video generation, you can either attach an image or reply to a message containing an image
- Response control commands (!tokens, !temp) and system prompt only affect text generation

## Environment Variables

Required environment variables:

- `DISCORD_TOKEN` - Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- `DEEPSEEK_API_KEY` - Your Deepseek API key for text generation
- `DEEPSEEK_API_URL` - Deepseek API endpoint URL (default: https://api.deepseek.com/v1)
- `OPENAI_API_KEY` - Your OpenAI API key for DALL-E 3 image generation
- `GEMINI_API_KEY` - Your Google Gemini API key for image generation
- `STABILITY_API_KEY` - Your Stability AI API key for image editing and video generation

Create a `.env` file in the root directory with these variables:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
```

## Development

The bot is written in TypeScript and uses:

- discord.js for Discord API interaction
- Deepseek API for text generation
- DALL-E 3 and Google Gemini for image generation
- Stability AI for image editing and video generation
