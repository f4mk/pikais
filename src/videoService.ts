import { openaiClient } from './openaiClient';
import { generateStabilityVideo } from './stabilityVideoClient';

/**
 * Interface for video generation result
 */
export interface VideoGenerationResult {
  success: boolean;
  data: Buffer | string;
  description?: string;
}

/**
 * Generates a video using Stability AI
 * @param data - Object containing the image buffer, content type, and prompt
 * @returns An object containing the success status and either the video buffer or an error message
 */
export async function generateVideoFromService(data: {
  buffer: Buffer;
  contentType: string;
  prompt: string;
}): Promise<VideoGenerationResult> {
  try {
    // Generate the video using Stability AI
    const result = await generateStabilityVideo(data, openaiClient.client);

    return {
      ...result,
      description: 'Video generated using Stability AI',
    };
  } catch (error) {
    console.error('Error in video generation:', error);
    return {
      success: false,
      data: `Error generating video: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
