import { STABILITY_API_KEY } from './consts';

// Module-level variable to cache the client instance (singleton pattern)
let stabilityClientInstance: any = null;

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
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateStabilityImage(
  prompt: string,
  baseImage?: File
): Promise<{ success: boolean; data: Buffer | string }> {
  try {
    // Get the Stability AI client (reuses existing instance if available)
    const client = getStabilityClient();

    let response;
    // If we have a base image, use the edit endpoint
    if (baseImage) {
      const formData = new FormData();
      formData.append('init_image', baseImage);
      formData.append('text_prompts[0][text]', prompt);
      formData.append('text_prompts[0][weight]', '1');
      formData.append('image_strength', '0.35'); // How much to preserve of the original image
      formData.append('cfg_scale', '7');
      formData.append('steps', '30');
      formData.append('samples', '1');

      // Use the erase-and-replace endpoint for image modifications
      response = await fetch(
        `${client.baseUrl}/v1/generation/stable-diffusion-xl-1024-v1-0/erase-and-replace`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${client.apiKey}`,
          },
          body: formData,
        }
      );
    } else {
      // Regular image generation without base image
      const requestBody = {
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        steps: 30,
        samples: 1,
        style_preset: 'photographic',
      };

      response = await fetch(
        `${client.baseUrl}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${client.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || response.statusText;
      } catch {
        errorMessage = errorText || response.statusText;
      }
      throw new Error(`Stability AI API error: ${errorMessage}`);
    }

    const result = await response.json();

    if (!result.artifacts || result.artifacts.length === 0) {
      return {
        success: false,
        data: `Failed to ${baseImage ? 'modify' : 'generate'} image. No images were returned from the API.`,
      };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(result.artifacts[0].base64, 'base64');

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
