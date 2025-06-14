import { generateDalleImage } from './dalleClient';
import { generateGeminiImage } from './geminiClient';
import { openaiClient } from './openaiClient';
import { generateStabilityImage } from './stabilityClient';

export type ImageGenerator = 'dalle' | 'gemini' | 'stability';

/**
 * Interface for image generation result
 */
export interface ImageGenerationResult {
  success: boolean;
  data: Buffer | string;
  description?: string;
}

/**
 * Generates an image using the specified service
 * @param prompt - The text prompt to generate an image from
 * @param service - The service to use ('dalle' or 'gemini')
 * @param baseImage - Optional base image to use for variations (only supported by DALL-E)
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateImageFromService(
  prompt: string,
  service: 'dalle' | 'gemini' | 'stability',
  baseImage?: File
): Promise<ImageGenerationResult> {
  try {
    // If using Gemini and a base image is provided, return an error
    if (service === 'gemini' && baseImage) {
      return {
        success: false,
        data: 'Image modifications are not supported by Google Gemini. Please use DALL-E 3 instead.',
      };
    }

    // Generate the image using the selected service
    const result = await (service === 'gemini'
      ? generateGeminiImage(prompt)
      : service === 'stability'
        ? generateStabilityImage(prompt, baseImage, openaiClient.client)
        : generateDalleImage(prompt));

    return {
      ...result,
      description: `Image ${baseImage ? 'modified' : 'generated'} using ${service === 'dalle' ? 'DALL-E 3' : service === 'stability' ? 'Stability AI' : 'Google Gemini'}`,
    };
  } catch (error) {
    console.error(`Error in ${service} image generation:`, error);
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
