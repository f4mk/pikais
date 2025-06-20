# Discord Bot with AI Capabilities

A Discord bot that integrates with various AI services for text, image, and video generation.

## Features

- **Text Generation**: Powered by Deepseek API
- **Image Generation**:
  - DALL-E 3 via `!img` command
  - Google Gemini via `!gimg` command
  - Recraft.ai via `!rimg` command
  - Image editing via Recraft.ai via `!edit` command
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
- `!rimg [prompt]` - Generate an image using Recraft.ai
  - Prompt can be in the message or in a replied message
  - Automatically detects and applies appropriate styles based on your prompt
- `!edit [prompt]` - Edit an image using Recraft.ai
  - Requires image attachment or reply to a message containing an image

### Video Generation

- `!video [prompt]` - Generate a video using Stability AI
  - Requires image attachment or reply to a message containing an image
  - Prompt can be in the message or in a replied message

### Response Control (only affects text generation)

- `!tokens=[number]` - Set maximum tokens (1-8192, default: 4096)
- `!temp=[number]` - Set temperature (0-2, default: 1.0)

## Recraft.ai Styles

The `!rimg` command automatically detects and applies the most appropriate style based on your prompt. Available styles include:

- **digital_illustration** - Digital art and illustrations
- **photographic** - Realistic photographic style
- **cinematic** - Movie-like cinematic scenes
- **anime** - Japanese anime and manga style
- **fantasy_art** - Fantasy and magical artwork
- **neon_punk** - Cyberpunk and neon aesthetics
- **isometric** - 3D isometric designs
- **low_poly** - Low polygon 3D art
- **origami** - Paper folding art style
- **line_art** - Clean line drawings
- **watercolor** - Watercolor painting style
- **oil_painting** - Oil painting style
- **cartoon** - Cartoon and comic style
- **3d_model** - 3D rendered models
- **pixel_art** - Retro pixel art
- **fractal_art** - Mathematical fractal patterns

The bot analyzes your prompt and selects the most suitable style automatically. For example:

- "a cute cat" → `cartoon` style
- "a futuristic city" → `neon_punk` style
- "a fantasy dragon" → `fantasy_art` style
- "a portrait photo" → `photographic` style

## Usage Examples

```
@BotName !img a cute cat playing with yarn
@BotName !rimg a futuristic cyberpunk city at night
@BotName !edit make this cat look like a robot
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
- `src/recraftClient.ts` - Recraft.ai API client for image generation and editing

## Notes

- Commands must be at the start of your message after mentioning the bot
- You can combine multiple commands (e.g., !tokens and !temp)
- System prompt changes persist until cleared or timeout (2 hours)
- For image/video generation, you can either attach an image or reply to a message containing an image
- Response control commands (!tokens, !temp) and system prompt only affect text generation
- Recraft.ai automatically applies the best style for your prompt - no need to specify style manually

## Environment Variables

Required environment variables:

- `DISCORD_TOKEN` - Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- `DEEPSEEK_API_KEY` - Your Deepseek API key for text generation
- `DEEPSEEK_API_URL` - Deepseek API endpoint URL (default: https://api.deepseek.com/v1)
- `OPENAI_API_KEY` - Your OpenAI API key for DALL-E 3 image generation
- `GEMINI_API_KEY` - Your Google Gemini API key for image generation
- `RECRAFT_API_KEY` - Your Recraft.ai API key for image generation and editing
- `STABILITY_API_KEY` - Your Stability AI API key for video generation

Create a `.env` file in the root directory with these variables:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
RECRAFT_API_KEY=your_recraft_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
```

## Development

The bot is written in TypeScript and uses:

- discord.js for Discord API interaction
- Deepseek API for text generation
- DALL-E 3, Google Gemini, and Recraft.ai for image generation
- Recraft.ai for image editing
- Stability AI for video generation
