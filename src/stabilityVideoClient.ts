import FormData from 'form-data';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';

import { STABILITY_API_KEY } from './consts';
import { resizeImage, translatePrompt } from './utils';

// Module-level variable to cache the client instance (singleton pattern)
let stabilityClientInstance: {
  apiKey: string;
  baseUrl: string;
} | null = null;

/**
 * Gets or creates a Stability AI client instance (implements singleton pattern)
 * This ensures the client is only created once and reused for all subsequent calls
 * @returns The Stability AI client instance
 */
function getStabilityClient() {
  // Only create a new client if one doesn't already exist
  if (!stabilityClientInstance) {
    // Check if the STABILITY_API_KEY is set
    if (!STABILITY_API_KEY) {
      throw new Error('STABILITY_API_KEY is not set in the environment variables.');
    }

    // Initialize the Stability AI client and store it in the module-level variable
    stabilityClientInstance = {
      apiKey: STABILITY_API_KEY,
      baseUrl: 'https://api.stability.ai',
    };
  }

  // Return the existing instance
  return stabilityClientInstance;
}

/**
 * Polls the video generation status until it's complete
 * @param client - The Stability AI client instance
 * @param generationId - The ID of the video generation
 * @returns A Promise that resolves when the video is ready
 */
async function pollVideoStatus(
  client: { apiKey: string; baseUrl: string },
  generationId: string
): Promise<Buffer> {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  const interval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${client.baseUrl}/v2beta/image-to-video/result/${generationId}`, {
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        Accept: 'video/*',
      },
    });

    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      continue;
    }

    if (response.status === 200) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // If we get here, something went wrong
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`Stability AI API error: ${response.status} - ${errorText}`);
  }

  throw new Error('Video generation timed out after 5 minutes');
}

/**
 * Generates a video using Stability AI's API based on the provided image
 * @param data - Object containing the image buffer, content type, and prompt
 * @param openaiClient - The OpenAI client instance for translation
 * @returns An object containing the success status and either the video buffer or an error message
 */
export async function generateStabilityVideo(
  data: {
    buffer: Buffer;
    contentType: string;
    prompt: string;
  },
  openaiClient: OpenAI
): Promise<{ success: boolean; data: Buffer | string }> {
  try {
    // Get the Stability AI client (reuses existing instance if available)
    const client = getStabilityClient();

    // Translate the prompt to English
    const translatedPrompt = await translatePrompt(openaiClient, data.prompt);

    // Resize the image to meet API requirements
    const resizedBuffer = await resizeImage(data.buffer);

    // Create form data for the request
    const formData = new FormData();
    formData.append('image', resizedBuffer, {
      filename: 'image.png',
      contentType: data.contentType,
    });

    // Optional parameters with default values
    formData.append('motion_bucket_id', '240'); // Controls the amount of motion (0-255)
    formData.append('cfg_scale', '2.5'); // Controls how closely the video follows the prompt
    formData.append('seed', '0'); // Random seed for reproducibility
    formData.append('steps', '25'); // Number of diffusion steps
    formData.append('duration', '5');
    formData.append('prompt', translatedPrompt);

    // Submit the image for video generation
    const response = await fetch(`${client.baseUrl}/v2beta/image-to-video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || response.statusText;
        console.error('API Error Details:', errorJson);
      } catch {
        errorMessage = errorText || response.statusText;
      }
      throw new Error(`Stability AI API error: ${errorMessage}`);
    }

    const result = await response.json();

    if (!result.id) {
      return {
        success: false,
        data: 'Failed to start video generation. No generation ID was returned from the API.',
      };
    }

    // Poll for status and get video data
    const videoBuffer = await pollVideoStatus(client, result.id);

    return {
      success: true,
      data: videoBuffer,
    };
  } catch (error) {
    console.error('Error generating video:', error);
    return {
      success: false,
      data: `Error generating video: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
