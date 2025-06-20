import { generateDalleImage } from './dalleClient';
import { generateGeminiImage } from './geminiClient';
import { openaiClient } from './openaiClient';
import { generateRecraftImage } from './recraftClient';
import { generateStabilityImage } from './stabilityClient';

export type ImageGenerator = 'dalle' | 'gemini' | 'stability' | 'recraft';

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
 * @param service - The service to use ('dalle', 'gemini', 'stability', or 'recraft')
 * @param baseImage - Optional base image to use for variations
 * @returns An object containing the success status and either the image buffer or an error message
 */
export async function generateImageFromService(
  prompt: string,
  service: 'dalle' | 'gemini' | 'stability' | 'recraft',
  baseImage?: File
): Promise<ImageGenerationResult> {
  try {
    // If using Gemini and a base image is provided, return an error
    if (service === 'gemini' && baseImage) {
      return {
        success: false,
        data: 'Image modifications are not supported by Google Gemini. Please use DALL-E 3, Stability AI, or Recraft.ai instead.',
      };
    }

    let result: ImageGenerationResult;
    // Generate the image using the selected service
    if (service === 'gemini') {
      result = await generateGeminiImage(prompt);
    } else if (service === 'stability') {
      result = await generateStabilityImage(prompt, baseImage, openaiClient.client);
    } else if (service === 'recraft') {
      result = await generateRecraftImage(prompt, baseImage, openaiClient.client);
    } else {
      result = await generateDalleImage(prompt);
    }

    const serviceNames = {
      dalle: 'DALL-E 3',
      gemini: 'Google Gemini',
      stability: 'Stability AI',
      recraft: 'Recraft.ai',
    };

    return {
      ...result,
      description: `Image ${baseImage ? 'modified' : 'generated'} using ${serviceNames[service]}`,
    };
  } catch (error) {
    console.error(`Error in ${service} image generation:`, error);
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
