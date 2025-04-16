import OpenAI from 'openai';

// Module-level variable to cache the client instance (singleton pattern)
let openaiClientInstance: OpenAI | null = null;

/**
 * Gets or creates an OpenAI client instance (implements singleton pattern)
 * This ensures the client is only created once and reused for all subsequent calls
 * @returns The OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  // Only create a new client if one doesn't already exist
  if (!openaiClientInstance) {
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Check if the OPENAI_API_KEY is set
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set in the environment variables.'
      );
    }

    // Initialize the OpenAI client and store it in the module-level variable
    openaiClientInstance = new OpenAI({
      apiKey: apiKey,
    });
  }

  // Return the existing instance
  return openaiClientInstance;
}

/**
 * Generates an image using OpenAI's DALL-E 3 model based on the provided prompt
 * @param prompt - The text prompt to generate an image from
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateImage(
  prompt: string
): Promise<{ success: boolean; data: Buffer | string; url?: string }> {
  try {
    // Get the OpenAI client (reuses existing instance if available)
    const openaiClient = getOpenAIClient();

    // Generate the image using DALL-E 3
    const response = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1, // Generate just one image
      size: "1024x1024", // Standard size
      quality: "standard",
      response_format: "b64_json", // Get base64 encoded image
    });

    if (!response.data || response.data.length === 0) {
      return {
        success: false,
        data: 'Failed to generate an image. No images were returned from the API.',
      };
    }

    // Get the image data
    const imageData = response.data[0];
    const imageBase64 = imageData.b64_json;
    
    if (!imageBase64) {
      return {
        success: false,
        data: 'Failed to retrieve image data from the API response.',
        url: imageData.url,
      };
    }

    // Convert base64 image data to buffer
    const buffer = Buffer.from(imageBase64, 'base64');

    return {
      success: true,
      data: buffer,
      url: imageData.url,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
} 