import FormData from 'form-data';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';

import { STABILITY_API_KEY } from './consts';
import { extractSubjectFromPrompt, resizeImage, translatePrompt } from './utils';

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
 * Generates an image using Stability AI's API based on the provided prompt
 * @param prompt - The text prompt to generate an image from
 * @param baseImage - Optional base image to use for modifications
 * @param openaiClient - The OpenAI client instance for translations and subject extraction
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateStabilityImage(
  prompt: string,
  baseImage?: File,
  openaiClient?: OpenAI
): Promise<{ success: boolean; data: Buffer | string }> {
  try {
    // Get the Stability AI client (reuses existing instance if available)
    const client = getStabilityClient();

    // Translate the prompt to English if OpenAI client is provided
    const translatedPrompt = openaiClient ? await translatePrompt(openaiClient, prompt) : prompt;
    console.log('Translated prompt:', translatedPrompt);

    let response;
    if (baseImage) {
      // Convert File to Buffer and resize if needed
      const arrayBuffer = await baseImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const resizedBuffer = await resizeImage(buffer);

      // Extract the subject from the translated prompt for search-and-replace
      const subject = openaiClient
        ? await extractSubjectFromPrompt(openaiClient, translatedPrompt)
        : translatedPrompt;
      console.log('Extracted subject for search:', subject);

      // Image-to-image generation using search-and-replace
      const formData = new FormData();
      formData.append('image', resizedBuffer, {
        filename: 'image.png',
        contentType: baseImage.type,
      });

      // Add search and replace parameters
      formData.append('search_prompt', subject);
      formData.append('prompt', translatedPrompt);
      formData.append('cfg_scale', '7');
      formData.append('steps', '30');
      formData.append('seed', '0');

      response = await fetch(`${client.baseUrl}/v2beta/stable-image/edit/search-and-replace`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${client.apiKey}`,
          Accept: 'application/json',
          ...formData.getHeaders(),
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
    } else {
      // Text-to-image generation
      const requestBody = {
        text_prompts: [
          {
            text: translatedPrompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        steps: 30,
        samples: 1,
      };

      response = await fetch(
        `${client.baseUrl}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${client.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );
    }

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

    if (!result.image) {
      console.error('No image in response. Full response:', result);
      return {
        success: false,
        data: `Failed to ${baseImage ? 'modify' : 'generate'} image. No image was returned from the API.`,
      };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(result.image, 'base64');

    return {
      success: true,
      data: buffer,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
