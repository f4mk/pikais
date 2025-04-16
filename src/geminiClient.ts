import { GoogleGenAI } from '@google/genai';

import { GEMINI_API_KEY } from './consts';

// Module-level variable to cache the client instance (singleton pattern)
let geminiClientInstance: GoogleGenAI | null = null;

/**
 * Gets or creates a Gemini client instance (implements singleton pattern)
 * This ensures the client is only created once and reused for all subsequent calls
 * @returns The Gemini client instance
 */
function getGeminiClient(): GoogleGenAI {
  // Only create a new client if one doesn't already exist
  if (!geminiClientInstance) {
    // Check if the GEMINI_API_KEY is set
    if (!GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not set in the environment variables.'
      );
    }

    // Initialize the Gemini client and store it in the module-level variable
    geminiClientInstance = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });
  }

  // Return the existing instance
  return geminiClientInstance;
}

/**
 * Generates an image using Google's Imagen model based on the provided prompt
 * @param prompt - The text prompt to generate an image from
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateImage(
  prompt: string
): Promise<{ success: boolean; data: Buffer | string }> {
  try {
    // Get the Gemini client (reuses existing instance if available)
    const geminiClient = getGeminiClient();

    // Use Imagen 3.0 for higher quality images
    const model = 'imagen-3.0-generate-002';

    // Generate the image
    const response = await geminiClient.models.generateImages({
      model: model,
      prompt: prompt,
      config: {
        numberOfImages: 1, // Generate just one image
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      return {
        success: false,
        data: 'Failed to generate an image. No images were returned from the API.',
      };
    }

    // Get the image data
    const imageBytes = response.generatedImages[0].image?.imageBytes;
    if (!imageBytes) {
      return {
        success: false,
        data: 'Failed to retrieve image data from the API response.',
      };
    }

    // Convert base64 image data to buffer
    const buffer = Buffer.from(imageBytes, 'base64');

    return {
      success: true,
      data: buffer,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
