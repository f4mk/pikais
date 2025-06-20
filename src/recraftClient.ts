import FormData from 'form-data';
import fetch from 'node-fetch';
import OpenAI from 'openai';

import { RECRAFT_API_KEY } from './consts';
import { extractStyleFromPrompt, fileToBuffer } from './utils';

// Module-level variable to cache the client instance (singleton pattern)
let recraftClientInstance: {
  apiKey: string;
  baseUrl: string;
} | null = null;

/**
 * Gets or creates a Recraft.ai client instance (implements singleton pattern)
 * This ensures the client is only created once and reused for all subsequent calls
 * @returns The Recraft.ai client instance
 */
function getRecraftClient() {
  // Only create a new client if one doesn't already exist
  if (!recraftClientInstance) {
    if (!RECRAFT_API_KEY) {
      throw new Error('RECRAFT_API_KEY is not set in the environment variables.');
    }

    // Initialize the Recraft.ai client and store it in the module-level variable
    recraftClientInstance = {
      apiKey: RECRAFT_API_KEY,
      baseUrl: 'https://external.api.recraft.ai/v1',
    };
  }

  // Return the existing instance
  return recraftClientInstance;
}

/**
 * Generates an image using Recraft.ai's image generation model based on the provided prompt
 * @param prompt - The text prompt to generate an image from
 * @param baseImage - Optional reference image (File) for image-to-image editing
 * @param openaiClient - The OpenAI client instance for style extraction
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateRecraftImage(
  prompt: string,
  baseImage?: File,
  openaiClient?: OpenAI
): Promise<{ success: boolean; data: Buffer | string; url?: string }> {
  try {
    // Get the Recraft.ai client (reuses existing instance if available)
    const client = getRecraftClient();

    // Extract style from prompt if OpenAI client is provided
    let style = 'digital_illustration'; // Default style
    if (openaiClient) {
      try {
        style = await extractStyleFromPrompt(openaiClient, prompt);
      } catch (error) {
        console.error('Error extracting style from prompt:', error);
        // Keep default style if extraction fails
      }
    }

    let response;
    if (baseImage) {
      // Image-to-image generation using fetch with FormData
      const imageBuffer = await fileToBuffer(baseImage);

      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('strength', '0.2');
      formData.append('image', imageBuffer, {
        filename: 'image.png',
        contentType: baseImage.type,
      });

      response = await fetch(`${client?.baseUrl}/images/imageToImage`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${client?.apiKey}`,
          Accept: 'application/json',
          ...formData.getHeaders(),
        },
        body: formData,
      });
    } else {
      // Text-to-image generation using JSON
      const requestBody = {
        prompt: prompt,
        style: style,
        size: '1024x1024',
        n: 1,
        response_format: 'b64_json',
      };

      response = await fetch(`${client?.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${client?.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
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
      throw new Error(`Recraft.ai API error: ${errorMessage}`);
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      console.error('🔧 Recraft: No data in response');
      return {
        success: false,
        data: 'Failed to generate an image. No images were returned from the API.',
      };
    }

    // Get the image data
    const imageData = result.data[0];

    // Check if we have a URL (Recraft.ai returns URLs, not base64)
    if (imageData.url) {
      // Download the image from the URL
      const imageResponse = await fetch(imageData.url);
      if (!imageResponse.ok) {
        console.error('🔧 Recraft: Failed to download image from URL');
        return {
          success: false,
          data: 'Failed to download the generated image from the provided URL.',
          url: imageData.url,
        };
      }

      // Convert the image to buffer
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        data: buffer,
        url: imageData.url,
      };
    }

    // Fallback: check for base64 data (in case API changes)
    const imageBase64 = imageData.b64_json;
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, 'base64');
      return {
        success: true,
        data: buffer,
        url: imageData.url,
      };
    }
    return {
      success: false,
      data: 'Failed to retrieve image data from the API response.',
      url: imageData.url,
    };
  } catch (error) {
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
