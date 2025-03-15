import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  MAX_ALLOWED_TOKENS,
  MAX_TEMPERATURE,
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
