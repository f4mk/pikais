# Discord Deepseek Bot

A Discord bot that integrates with the Deepseek API to process messages and generate responses.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DEEPSEEK_API_URL=https://api.deepseek.com/v1
   ```

4. Replace the placeholder values in `.env` with your actual tokens:
   - Get your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
   - Get your Deepseek API key from your Deepseek account

## Running the Bot

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Usage

1. Invite the bot to your Discord server
2. Mention the bot (@BotName) in any channel it has access to
3. The bot will process your message through the Deepseek API and reply with the response

## Features

- Processes messages that mention the bot
- Integrates with Deepseek API
- Error handling and user-friendly responses
- TypeScript support 