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

## Commands

The bot supports several commands that can be used to customize its behavior. All commands should be placed at the beginning of your message after mentioning the bot.

### System Command

**Syntax**: `!system [your system prompt]`

**Description**: Sets a custom system message for the AI model, which guides how the AI responds to your queries. This affects all future interactions until cleared or reset.

**Example**:

```
@BotName !system You are a helpful assistant that specializes in TypeScript programming.
```

### Clear Command

**Syntax**: `!clear [optional new message]`

**Description**: Clears the conversation history and resets the system message to the default. If you include text after `!clear`, it will be treated as a new message.

**Example**:

```
@BotName !clear
```

or

```
@BotName !clear What is TypeScript?
```

### Tokens Command

**Syntax**: `!tokens=[number]`

**Description**: Sets the maximum number of tokens (roughly words) the AI can use in its response. Valid range is 1-8192, with a default of 4096.

**Example**:

```
@BotName !tokens=2000 Write a short story about a robot.
```

### Temperature Command

**Syntax**: `!temp=[number]`

**Description**: Controls the creativity/randomness of the AI's responses. Lower values (e.g., 0.2) make responses more focused and deterministic, while higher values (e.g., 1.8) make them more creative and diverse. Valid range is 0-2, with a default of 1.0.

**Example**:

```
@BotName !temp=1.8 Generate a creative poem about technology.
```

### Combined Commands

You can combine multiple commands at the beginning of your message:

**Example**:

```
@BotName !tokens=3000 !temp=0.7 Explain quantum computing.
```

## Notes on Command Usage

- Commands must be at the beginning of your message after mentioning the bot
- Commands are processed in the order they appear
- System prompt changes persist across conversations until explicitly cleared or until the conversation times out (2 hours of inactivity)
- Command parameters (!tokens, !temp) are applied only to the current message
- If a command value is invalid, the bot will use the default value instead

## Features

- Processes messages that mention the bot
- Integrates with Deepseek API
- Customizable system prompts for specialized AI behavior
- Adjustable response parameters (tokens, temperature)
- Conversation history management
- Error handling and user-friendly responses
- TypeScript support
