import { 
  Client, 
  Events, 
  GatewayIntentBits, 
  Message, 
  TextChannel 
} from 'discord.js';
import dotenv from 'dotenv';
import OpenAI from "openai";
import { splitIntoChunks } from './utils';

// Load environment variables
dotenv.config();

// Global instance check
let isInstanceRunning = false;

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_API_URL,
  apiKey: process.env.DEEPSEEK_API_KEY
});

const MAX_MESSAGES = 20;
const CONVERSATION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CLEAR_COMMAND = '!clear';

// Store conversation history for each user
const conversationHistory = new Map<string, Array<OpenAI.Chat.ChatCompletionMessageParam>>();

// Store timeouts for each user's conversation
const conversationTimeouts = new Map<string, NodeJS.Timeout>();

// Track messages being processed
const processingMessages = new Set<string>();

// Function to get or initialize conversation history
const getConversationHistory = (userId: string): Array<OpenAI.Chat.ChatCompletionMessageParam> => {
  if (!conversationHistory.has(userId)) {
    // Initialize with empty conversation history
    conversationHistory.set(userId, []);
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

// Function to clean up timeouts on shutdown
const cleanupTimeouts = () => {
  for (const timeout of conversationTimeouts.values()) {
    clearTimeout(timeout);
  }
  conversationTimeouts.clear();
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
  if (isInstanceRunning) {
    console.error('Another instance is already running. Shutting down...');
    client.destroy();
    process.exit(1);
    return;
  }
  
  isInstanceRunning = true;
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Handle disconnect event
client.on('disconnect', () => {
  isInstanceRunning = false;
  console.log('Bot disconnected');
});

// Handle message creation
client.on(Events.MessageCreate, async (message: Message): Promise<void> => {
  // Log every message we receive
  
  // Ignore messages from bots
  if (message.author.bot) {
    return;
  }

  // Check if the bot is mentioned at the start of the message
  const botMention = `<@${client.user!.id}>`;
  if (!message.content.startsWith(botMention)) {
    return;
  }

  // Check if we're already processing this message
  if (processingMessages.has(message.id)) {
    return;
  }

  // Mark message as being processed
  processingMessages.add(message.id);

  try {
    // Remove mention and trim the message
    let content = message.content
      .slice(botMention.length)
      .trim();

    if (!content) {
      await message.reply({
        content: 'Please provide a message along with the mention.',
        allowedMentions: { repliedUser: true },
      });
      return;
    }

    // Initialize messages variable
    let messages = getConversationHistory(message.author.id);

    // Check if message starts with clear command
    if (content.slice(0, CLEAR_COMMAND.length).toLowerCase().startsWith(CLEAR_COMMAND)) {
      const userId = message.author.id;
      
      // Clear any existing timeout first
      const existingTimeout = conversationTimeouts.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        conversationTimeouts.delete(userId);
      }

      // Clear the conversation history
      conversationHistory.delete(userId);

      // Get the actual prompt after !clear
      const newPrompt = content.slice(CLEAR_COMMAND.length).trim();
      
      // If there's no prompt after !clear, just acknowledge the clear
      if (!newPrompt) {
        await message.reply({
          content: 'Your conversation history has been cleared. Starting fresh!',
          allowedMentions: { repliedUser: true },
        });
        return;
      }

      // Initialize new conversation history and use it
      messages = getConversationHistory(userId);
      content = newPrompt;
    }

    if (message.channel instanceof TextChannel) {
      try {
        // Show typing indicator
        const typingMessage = await message.channel.send({ content: '...' });
        
        // Add user's message to history
        messages.push({ role: "user", content });

        // Limit history to last MAX_MESSAGES messages
        if (messages.length > MAX_MESSAGES) {
          // Remove oldest messages to maintain the limit
          const excessMessages = messages.length - MAX_MESSAGES;
          messages.splice(0, excessMessages);
        }

        // Make request to Deepseek API with full conversation history
        const completion = await openai.chat.completions.create({
          messages,
          model: "deepseek-chat",
          n: 1,
          stream: false
        });

        const responseText = completion.choices[0].message.content?.trim();

        if (!responseText) {
          await typingMessage.edit({
            content: 'Sorry, I couldn\'t process that request.',
          });
          return;
        }

        // Add assistant's response to history
        messages.push({ 
          role: "assistant", 
          content: responseText 
        });

        // Split response into chunks if it's too long
        const chunks = splitIntoChunks(responseText);

        if (chunks.length === 0) {
          await typingMessage.edit({
            content: 'Sorry, I received an empty response.',
          });
          return;
        }

        // Edit the typing message with the first chunk
        await typingMessage.edit({
          content: chunks[0],
        });

        // Send remaining chunks as regular messages
        for (let i = 1; i < chunks.length; i++) {
          if (chunks[i].trim()) { // Only send non-empty chunks
            await message.channel.send({
              content: chunks[i],
              allowedMentions: { repliedUser: false },
            });
          }
        }

      } catch (error) {
        console.error(`Error in API request or response handling for message ${message.id}:`, error);
        await message.reply({
          content: 'Sorry, something went wrong while processing your request.',
          allowedMentions: { repliedUser: true },
        });
      }
    } else {
      await message.reply({
        content: 'I can only respond in text channels.',
        allowedMentions: { repliedUser: true },
      });
    }
  } catch (error) {
    console.error(`Error in message processing for message ${message.id}:`, error);
    await message.reply({
      content: 'Sorry, something went wrong while processing your request.',
      allowedMentions: { repliedUser: true },
    });
  } finally {
    // Remove message from processing set
    processingMessages.delete(message.id);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  isInstanceRunning = false;
  cleanupTimeouts();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  isInstanceRunning = false;
  cleanupTimeouts();
  client.destroy();
  process.exit(0);
});

// Log in to Discord
void client.login(process.env.DISCORD_TOKEN)
  .catch((error): void => {
    console.error('Error logging in:', error);
    process.exit(1);
  });
