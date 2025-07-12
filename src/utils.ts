import { AttachmentBuilder, Message } from 'discord.js';
import sharp from 'sharp';
import { Readable } from 'stream';

import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  EDIT_COMMAND,
  GIMG_COMMAND,
  HELP_TEXT,
  IMG_COMMAND,
  MIN_ALLOWED_TOKENS,
  MIN_TEMPERATURE,
  RIMG_COMMAND,
  TEMP_COMMAND,
  TOKENS_COMMAND,
  VIDEO_COMMAND,
} from './consts';
import { generateImageFromService } from './imageService';
import { OpenAIClient } from './openaiClient';
import { generateVideoFromService } from './videoService';

// Function to split text into chunks of maximum size
export const splitIntoChunks = (text: string, maxLength: number = 1500): string[] => {
  if (!text) return [];

  const chunks: string[] = [];
  let currentChunk = '';

  // Split by newlines first to preserve formatting
  const lines = text.split('\n');

  for (const line of lines) {
    // If adding this line would exceed maxLength
    if ((currentChunk + (currentChunk ? '\n' : '') + line).length > maxLength) {
      // If we have content in currentChunk, save it
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If the line itself is too long, split it by words
      if (line.length > maxLength) {
        const words = line.split(' ');
        for (const word of words) {
          // If adding this word would exceed maxLength
          if ((currentChunk + (currentChunk ? ' ' : '') + word).length > maxLength) {
            // Save current chunk if not empty
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            // Start new chunk with this word
            currentChunk = word;
          } else {
            // Add word to current chunk
            currentChunk += (currentChunk ? ' ' : '') + word;
          }
        }
      } else {
        // Line fits in a new chunk
        currentChunk = line;
      }
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

// Function to parse commands into an object
export const parseCommandsIntoObject = (
  content: string
): { commands: { [key: string]: string }; endCursor: number } => {
  const commands: { [key: string]: string } = {};
  let cursor = 0;

  while (cursor < content.length) {
    // Check for command start
    if (content[cursor] === '!') {
      // Include ! in command name
      let commandName = '!';
      cursor++; // skip !

      // Read rest of command name
      while (cursor < content.length && content[cursor] !== '=' && content[cursor] !== ' ') {
        commandName += content[cursor];
        cursor++;
      }

      // If we found equals sign, read the value
      if (cursor < content.length && content[cursor] === '=') {
        cursor++; // skip =
        let value = '';
        while (cursor < content.length && content[cursor] !== ' ' && content[cursor] !== '!') {
          value += content[cursor];
          cursor++;
        }

        commands[commandName] = value;
      }

      // Skip any spaces between commands
      while (cursor < content.length && content[cursor] === ' ') {
        cursor++;
      }

      // If next character is not !, we're done with commands
      if (cursor < content.length && content[cursor] !== '!') {
        break;
      }
    } else {
      break;
    }
  }

  return { commands, endCursor: cursor };
};

// Function to parse commands and return settings and content
export const parseCommands = (
  content: string
): {
  content: string;
  maxTokens: number;
  temperature: number;
} => {
  const { commands, endCursor } = parseCommandsIntoObject(content);

  // Parse values with proper validation using command constants as keys
  const maxTokens = commands[TOKENS_COMMAND]
    ? Math.min(
        Math.max(MIN_ALLOWED_TOKENS, parseInt(commands[TOKENS_COMMAND]) || DEFAULT_MAX_TOKENS),
        8192
      )
    : DEFAULT_MAX_TOKENS;

  const parsedTemp = commands[TEMP_COMMAND]
    ? parseFloat(commands[TEMP_COMMAND])
    : DEFAULT_TEMPERATURE;
  const temperature = commands[TEMP_COMMAND]
    ? Math.min(
        Math.max(MIN_TEMPERATURE, Number.isNaN(parsedTemp) ? DEFAULT_TEMPERATURE : parsedTemp),
        2
      )
    : DEFAULT_TEMPERATURE;

  return {
    content: content.slice(endCursor).trim(),
    maxTokens,
    temperature,
  };
};

export async function fetchImageFromAttachment(attachment: {
  url: string;
  contentType?: string | null;
}): Promise<File> {
  if (!attachment.contentType?.startsWith('image/')) {
    throw new Error('Attachment is not an image');
  }

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    return new File([blob], 'image.png', { type: attachment.contentType });
  } catch (error) {
    console.error('Error fetching image attachment:', error);
    throw error;
  }
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function fetchReadableFromAttachment(attachment: {
  url: string;
  contentType?: string | null;
}): Promise<{ stream: Readable; contentType: string }> {
  if (!attachment.contentType?.startsWith('image/')) {
    throw new Error('Attachment is not an image');
  }

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error('Failed to fetch image');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      stream: bufferToStream(buffer),
      contentType: attachment.contentType,
    };
  } catch (error) {
    console.error('Error fetching image attachment:', error);
    throw error;
  }
}

export async function fetchBufferFromAttachment(attachment: {
  url: string;
  contentType?: string | null;
}): Promise<{ buffer: Buffer; contentType: string }> {
  if (!attachment.contentType?.startsWith('image/')) {
    throw new Error('Attachment is not an image');
  }

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error('Failed to fetch image');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      buffer,
      contentType: attachment.contentType,
    };
  } catch (error) {
    console.error('Error fetching image attachment:', error);
    throw error;
  }
}

/**
 * Translates a prompt to English using OpenAI
 * @param openaiClient - The OpenAI client instance
 * @param prompt - The prompt to translate
 * @returns A promise that resolves to the translated prompt
 */
export async function translatePrompt(openaiClient: OpenAIClient, prompt: string): Promise<string> {
  try {
    const completion = await openaiClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a translator. Translate the following text to English. Keep the translation concise and natural. Only return the translated text, nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: openaiClient.model,
      temperature: 0.3,
    });

    const translatedPrompt = completion.choices[0].message.content?.trim();
    if (!translatedPrompt) {
      throw new Error('Failed to translate prompt');
    }

    return translatedPrompt;
  } catch (error) {
    console.error('Error translating prompt:', error);
    // If translation fails, return the original prompt
    return prompt;
  }
}

/**
 * Extracts the main subject from a prompt using OpenAI
 * @param openaiClient - The OpenAI client instance
 * @param prompt - The prompt to analyze
 * @returns A promise that resolves to the extracted subject
 */
export async function extractSubjectFromPrompt(
  openaiClient: OpenAIClient,
  prompt: string
): Promise<string> {
  try {
    const completion = await openaiClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a prompt analyzer. Extract the main subject or object that should be modified from the given prompt. Return only the subject, nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: openaiClient.model,
      temperature: 0.3,
    });

    const subject = completion.choices[0].message.content?.trim();
    if (!subject) {
      throw new Error('Failed to extract subject from prompt');
    }

    return subject;
  } catch (error) {
    console.error('Error extracting subject from prompt:', error);
    throw error;
  }
}

/**
 * Extracts the style from a prompt using AI analysis
 * @param openaiClient - The OpenAI client instance
 * @param prompt - The prompt to analyze
 * @returns A promise that resolves to the extracted style (realistic_image, digital_illustration, vector_illustration, icon, or any)
 */
export async function extractStyleFromPrompt(
  openaiClient: OpenAIClient,
  prompt: string
): Promise<string> {
  try {
    const completion = await openaiClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a style analyzer for Recraft.ai image generation. Analyze the given prompt and determine the most appropriate style from these options:

- realistic_image: For photographs, real-life images, or anything that should look like a real photo
- digital_illustration: For drawings, paintings, cartoons, 3D renders, or stylized artwork
- vector_illustration: For flat designs, logos, icons, or simple geometric artwork
- icon: For small symbols, app icons, or simple graphical elements
- any: When the style is unclear or could be any of the above

Return only the style name, nothing else. Default to 'digital_illustration' if unsure. 
Is the promt contains a direct style name, return the style name that fits the best from the list above.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: openaiClient.model,
      temperature: 0.3,
    });

    const style = completion.choices[0].message.content?.trim();
    if (!style) {
      return 'digital_illustration'; // Default fallback
    }

    // Validate the style is one of the allowed values
    const validStyles = [
      'realistic_image',
      'digital_illustration',
      'vector_illustration',
      'icon',
      'any',
    ];
    if (validStyles.includes(style)) {
      return style;
    }

    return 'digital_illustration'; // Default fallback
  } catch (error) {
    console.error('Error extracting style from prompt:', error);
    return 'digital_illustration'; // Default fallback
  }
}

/**
 * Converts a File to Buffer
 * @param file - The file to convert
 * @returns A promise that resolves to a buffer
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Resizes an image to meet Stability AI's requirements
 * @param buffer - The image buffer to resize
 * @returns A promise that resolves to a resized image buffer
 */
export async function resizeImage(buffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine image dimensions');
  }

  // Determine target dimensions based on aspect ratio
  let targetWidth: number;
  let targetHeight: number;

  const aspectRatio = metadata.width / metadata.height;
  if (aspectRatio > 1) {
    // Landscape
    targetWidth = 1024;
    targetHeight = 576;
  } else if (aspectRatio < 1) {
    // Portrait
    targetWidth = 576;
    targetHeight = 1024;
  } else {
    // Square
    targetWidth = 768;
    targetHeight = 768;
  }

  // Resize the image
  return sharp(buffer)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();
}

// Helper function to handle help command
export async function handleHelpCommand(message: Message): Promise<void> {
  await message.reply({
    content: HELP_TEXT,
    allowedMentions: { repliedUser: true },
  });
}

// Helper function to handle image generation
export async function handleImageGeneration(
  message: Message,
  prompt: string,
  command: typeof IMG_COMMAND | typeof GIMG_COMMAND | typeof EDIT_COMMAND | typeof RIMG_COMMAND
): Promise<void> {
  let service: 'dalle' | 'gemini' | 'stability' | 'recraft' = 'dalle';
  let serviceName = 'DALL-E 3';
  if (command === GIMG_COMMAND) {
    service = 'gemini';
    serviceName = 'Google Gemini';
  } else if (command === EDIT_COMMAND) {
    service = 'recraft';
    serviceName = 'Recraft.ai';
  } else if (command === RIMG_COMMAND) {
    service = 'recraft';
    serviceName = 'Recraft.ai';
  }

  // If prompt is empty, try to get it from the replied message
  if (!prompt && message.reference?.messageId) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
    prompt = repliedTo.content;
  }

  // Return early if still no prompt
  if (!prompt) {
    await message.reply({
      content: `Please provide a description of the image you want to generate after the !${command} command.`,
      allowedMentions: { repliedUser: true },
    });
    return;
  }

  // Check for image attachments in the original message
  let baseImage: File | undefined;
  if (message.attachments.size > 0) {
    baseImage = await fetchImageFromAttachment(message.attachments.first()!);
  }

  // If no image in original message but there's a reply, check the replied message for images
  if (!baseImage && message.reference?.messageId) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
    const attachment = repliedTo.attachments.first();
    if (attachment) {
      baseImage = await fetchImageFromAttachment(attachment);
    }
  }

  // Show a "generating" message
  const generatingMessage = await message.reply({
    content: `🎨 ${baseImage ? 'Modifying' : 'Generating'} your image with ${serviceName}, please wait...`,
    allowedMentions: { repliedUser: true },
  });

  // Generate the image
  const result = await generateImageFromService(prompt, service, baseImage);

  if (result.success && Buffer.isBuffer(result.data)) {
    // Create an attachment from the buffer
    const attachment = new AttachmentBuilder(result.data, {
      name: `${service}-generated-image.png`,
      description: `Image from prompt`,
    });

    // Update the message with only the generated image
    await generatingMessage.edit({
      content: '',
      files: [attachment],
      allowedMentions: { repliedUser: true },
    });
  } else {
    await generatingMessage.edit({
      content: `Failed to ${baseImage ? 'modify' : 'generate'} image: ${result.data}`,
      allowedMentions: { repliedUser: true },
    });
  }
}

// Helper function to handle video generation
export async function handleVideoGeneration(message: Message): Promise<void> {
  // Get the prompt from the command text
  let prompt = message.content.slice(VIDEO_COMMAND.length).trim();

  // If prompt is empty, try to get it from the replied message
  if (!prompt && message.reference?.messageId) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
    prompt = repliedTo.content;
  }

  // Check for image attachments in the original message
  let data: { buffer: Buffer; contentType: string } | undefined;
  if (message.attachments.size > 0) {
    data = await fetchBufferFromAttachment(message.attachments.first()!);
  }

  // If no image in original message but there's a reply, check the replied message for images
  if (!data && message.reference?.messageId) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
    const attachment = repliedTo.attachments.first();
    if (attachment) {
      data = await fetchBufferFromAttachment(attachment);
    }
  }

  // Return early if no base image is provided
  if (!data) {
    await message.reply({
      content:
        'Please provide an image to generate a video from. You can either attach an image or reply to a message containing an image.',
      allowedMentions: { repliedUser: true },
    });
    return;
  }

  // Show a "generating" message
  const generatingMessage = await message.reply({
    content: '🎬 Generating your video with Stability AI, please wait...',
    allowedMentions: { repliedUser: true },
  });

  // Generate the video
  const result = await generateVideoFromService({
    ...data,
    prompt,
  });

  if (result.success && Buffer.isBuffer(result.data)) {
    // Create an attachment from the buffer
    const attachment = new AttachmentBuilder(result.data, {
      name: 'stability-generated-video.mp4',
      description: 'Video from prompt',
    });

    // Update the message with only the generated video
    await generatingMessage.edit({
      content: '',
      files: [attachment],
      allowedMentions: { repliedUser: true },
    });
  } else {
    await generatingMessage.edit({
      content: `Failed to generate video: ${result.data}`,
      allowedMentions: { repliedUser: true },
    });
  }
}
