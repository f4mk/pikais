import { OpenAI } from 'openai';
import sharp from 'sharp';
import { Readable } from 'stream';

import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  MIN_ALLOWED_TOKENS,
  MIN_TEMPERATURE,
  TEMP_COMMAND,
  TOKENS_COMMAND,
} from './consts';

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
export async function translatePrompt(openaiClient: OpenAI, prompt: string): Promise<string> {
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
      model: 'deepseek-chat',
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
  openaiClient: OpenAI,
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
      model: 'deepseek-chat',
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
