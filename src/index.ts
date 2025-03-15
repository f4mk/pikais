import { 
  Client, 
  Events, 
  GatewayIntentBits, 
  Message, 
  TextChannel 
} from 'discord.js';
import dotenv from 'dotenv';
import OpenAI from "openai";

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_API_URL,
  apiKey: process.env.DEEPSEEK_API_KEY
});

interface DeepseekResponse {
  response: string;
}

// Function to split text into chunks of maximum size
const splitIntoChunks = (text: string, maxLength: number = 1500): string[] => {
  const chunks: string[] = [];
  let currentChunk = '';

  // Split by newlines first to preserve formatting
  const lines = text.split('\n');

  for (const line of lines) {
    // If the current line alone is longer than maxLength, split it by spaces
    if (line.length > maxLength) {
      const words = line.split(' ');
      for (const word of words) {
        if ((currentChunk + word).length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
        }
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    } else if ((currentChunk + '\n' + line).length > maxLength) {
      // If adding this line would exceed maxLength, start a new chunk
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      // Add the line to the current chunk
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

// Create Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Handle ready event
client.once(Events.ClientReady, (readyClient): void => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Handle message creation
client.on(Events.MessageCreate, async (message: Message): Promise<void> => {
  // Ignore messages from bots and messages that don't mention the bot
  if (message.author.bot || !message.mentions.has(client.user!)) {
    return;
  }

  try {
    // Remove the bot mention and trim the message
    const content = message.content
      .replace(`<@${client.user!.id}>`, '')
      .trim();

    // Show typing indicator
    if (message.channel instanceof TextChannel) {
      const typingMessage = await message.channel.send({ content: '...' });

      try {
        // Make request to Deepseek API
        const completion = await openai.chat.completions.create({
          messages: [{ role: "system", content }],
          model: "deepseek-chat",
        });

        const responseText = completion.choices[0].message.content;

        if (!responseText) {
          await typingMessage.edit({
            content: 'Sorry, I couldn\'t process that request.',
          });
          return;
        }

        // Split response into chunks if it's too long
        const chunks = splitIntoChunks(responseText);

        // Edit the first message with the first chunk
        await typingMessage.edit({
          content: chunks[0],
        });

        // Send remaining chunks as new messages
        for (let i = 1; i < chunks.length; i++) {
          await message.channel.send({
            content: chunks[i],
            allowedMentions: { repliedUser: false },
          });
        }

      } catch (error) {
        await typingMessage.edit({
          content: 'Sorry, something went wrong while processing your request.',
        });
        console.error('Error:', error);
      }
    } else {
      await message.reply({
        content: 'I can only respond in text channels.',
        allowedMentions: { repliedUser: true },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    await message.reply({
      content: 'Sorry, something went wrong while processing your request.',
      allowedMentions: { repliedUser: true },
    });
  }
});

// Log in to Discord
void client.login(process.env.DISCORD_TOKEN)
  .catch((error): void => {
    console.error('Error logging in:', error);
    process.exit(1);
  });
