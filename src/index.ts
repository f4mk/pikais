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

        const data =  completion.choices[0].message.content

        // Edit the message with the response
        await typingMessage.edit({
          content: data || 'Sorry, I couldn\'t process that request.',
        });
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
