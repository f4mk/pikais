import {
  AttachmentBuilder,
  Client,
  Events,
  GatewayIntentBits,
  Message,
  TextChannel,
} from 'discord.js';

import {
  CLEAR_COMMAND,
  DEFAULT_SYSTEM_MESSAGE,
  DISCORD_TOKEN,
  IMG_COMMAND,
  MAX_MESSAGES,
  SYSTEM_COMMAND,
} from './consts';
import { generateImage } from './geminiClient';
import {
  cleanupTimeouts,
  conversationHistory,
  conversationTimeouts,
  getConversationHistory,
} from './history';
import { openaiClient } from './openaiClient';
import { parseCommands, splitIntoChunks } from './utils';

// Global instance check
let isInstanceRunning = false;

// Track messages being processed
const processingMessages = new Set<string>();

export async function main() {
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
    console.warn(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  // Handle disconnect event
  client.on('disconnect', () => {
    isInstanceRunning = false;
    console.warn('Bot disconnected');
  });

  // Handle message creation
  client.on(Events.MessageCreate, async (message: Message): Promise<void> => {
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
      let content = message.content.slice(botMention.length).trim();

      if (!content) {
        await message.reply({
          content: 'Please provide a message along with the mention.',
          allowedMentions: { repliedUser: true },
        });
        return;
      }

      // Initialize messages variable
      let messages = getConversationHistory(message.author.id);

      // If this is a reply to another message, add that message's content to history
      if (message.reference && message.reference.messageId) {
        try {
          const repliedTo = await message.channel.messages.fetch(
            message.reference.messageId
          );
          // Add the replied-to message as context
          messages.push({
            role: 'user',
            content: `Previous message: ${repliedTo.content}`,
          });
        } catch (error) {
          console.error('Error fetching replied message:', error);
          // Continue without the context if we can't fetch it
        }
      }

      // Check if message starts with system command
      if (
        content
          .slice(0, SYSTEM_COMMAND.length)
          .toLowerCase()
          .startsWith(SYSTEM_COMMAND)
      ) {
        const userId = message.author.id;

        // Get the text after the !system command
        const systemPrompt = content.slice(SYSTEM_COMMAND.length).trim();

        if (!systemPrompt) {
          await message.reply({
            content:
              'Please provide a system prompt after the !system command.',
            allowedMentions: { repliedUser: true },
          });
          return;
        }

        // Update the system message at index 0 (which is always present)
        messages[0] = { role: 'system', content: systemPrompt };

        // Save the updated messages back to the conversation history
        conversationHistory.set(userId, messages);

        await message.reply({
          content: 'System prompt updated successfully!',
          allowedMentions: { repliedUser: true },
        });
        return;
      }

      // Check if message starts with clear command
      if (
        content
          .slice(0, CLEAR_COMMAND.length)
          .toLowerCase()
          .startsWith(CLEAR_COMMAND)
      ) {
        const userId = message.author.id;

        // Clear any existing timeout first
        const existingTimeout = conversationTimeouts.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          conversationTimeouts.delete(userId);
        }

        // Reset the conversation with a fresh system message
        conversationHistory.set(userId, [
          { role: 'system' as const, content: DEFAULT_SYSTEM_MESSAGE },
        ]);

        // Get the actual prompt after !clear
        const newPrompt = content.slice(CLEAR_COMMAND.length).trim();

        // If there's no prompt after !clear, just acknowledge the clear
        if (!newPrompt) {
          await message.reply({
            content:
              'Your conversation history has been cleared and system prompt reset to default. Starting fresh!',
            allowedMentions: { repliedUser: true },
          });
          return;
        }

        // Initialize new conversation history and use it
        messages = getConversationHistory(userId);
        content = newPrompt;
      }

      // Check if message starts with image generation command
      if (
        content
          .slice(0, IMG_COMMAND.length)
          .toLowerCase()
          .startsWith(IMG_COMMAND)
      ) {
        const imagePrompt = content.slice(IMG_COMMAND.length).trim();

        if (!imagePrompt) {
          await message.reply({
            content:
              'Please provide a description of the image you want to generate after the !img command.',
            allowedMentions: { repliedUser: true },
          });
          return;
        }

        // Show a "generating" message
        const generatingMessage = await message.reply({
          content: '🎨 Generating your image, please wait...',
          allowedMentions: { repliedUser: true },
        });

        try {
          // Call the Gemini API to generate the image
          const result = await generateImage(imagePrompt);

          if (result.success && Buffer.isBuffer(result.data)) {
            // Create an attachment directly from the buffer
            const attachment = new AttachmentBuilder(result.data, {
              name: 'generated-image.png',
              description: `Image generated from prompt: ${imagePrompt}`,
            });

            // Update the message with the generated image
            await generatingMessage.edit({
              files: [attachment],
              allowedMentions: { repliedUser: true },
            });
          } else {
            await generatingMessage.edit({
              content: `Failed to generate image: ${result.data}`,
              allowedMentions: { repliedUser: true },
            });
          }
        } catch (error) {
          console.error('Error in image generation:', error);
          await generatingMessage.edit({
            content:
              'Sorry, something went wrong while generating your image. Please try again later.',
            allowedMentions: { repliedUser: true },
          });
        }
        return;
      }

      // Parse commands and return settings and content
      const {
        content: updatedContent,
        maxTokens,
        temperature,
      } = parseCommands(content);

      if (message.channel instanceof TextChannel) {
        try {
          // Show typing indicator
          const typingMessage = await message.channel.send({ content: '...' });

          // Add user's message to history
          messages.push({ role: 'user', content: updatedContent });

          // Limit history to last MAX_MESSAGES messages while preserving system message at index 0
          if (messages.length > MAX_MESSAGES) {
            // Keep the system message at index 0 and only the most recent (MAX_MESSAGES - 1) messages
            messages = [messages[0], ...messages.slice(-(MAX_MESSAGES - 1))];
          }

          // Make request to Deepseek API with full conversation history
          const completion = await openaiClient.chat.completions.create({
            messages,
            model: 'deepseek-chat',
            n: 1,
            stream: false,
            max_tokens: maxTokens,
            temperature: temperature,
          });

          const responseText = completion.choices[0].message.content?.trim();

          if (!responseText) {
            await typingMessage.edit({
              content: "Sorry, I couldn't process that request.",
            });
            return;
          }

          // Add assistant's response to history
          messages.push({
            role: 'assistant',
            content: responseText,
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
            if (chunks[i].trim()) {
              // Only send non-empty chunks
              await message.channel.send({
                content: chunks[i],
                allowedMentions: { repliedUser: false },
              });
            }
          }
        } catch (error) {
          console.error(
            `Error in API request or response handling for message ${message.id}:`,
            error
          );
          await message.reply({
            content:
              'Sorry, something went wrong while processing your request.',
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
      console.error(
        `Error in message processing for message ${message.id}:`,
        error
      );
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
  try {
    await client.login(DISCORD_TOKEN);
  } catch (error) {
    console.error('Error logging in:', error);
    process.exit(1);
  }
}
