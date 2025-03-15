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