import { generateImage } from './dalleClient';
import { generateGeminiImage } from './geminiClient';

/**
 * Interface for image generation result
 */
export interface ImageGenerationResult {
  success: boolean;
  data: Buffer | string;
  description?: string;
}

/**
 * Handles image generation using the specified service
 * @param prompt The image generation prompt
 * @param service The service to use ('dalle' or 'gemini')
 * @returns Promise with the result containing success status and data
 */
export async function generateImageFromService(
  prompt: string,
  service: 'dalle' | 'gemini'
): Promise<ImageGenerationResult> {
  try {
    // Call the appropriate generation service
    const result = service === 'dalle' 
      ? await generateImage(prompt)
      : await generateGeminiImage(prompt);

    if (result.success && Buffer.isBuffer(result.data)) {
      return {
        success: true,
        data: result.data,
        description: `Image generated from prompt: ${prompt}${service === 'gemini' ? ' (Google Gemini)' : ''}`,
      };
    } else {
      return {
        success: false,
        data: typeof result.data === 'string' ? result.data : 'Failed to generate image',
      };
    }
  } catch (error) {
    console.error(`Error in ${service} image generation:`, error);
    return {
      success: false,
      data: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
} 