import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

/**
 * Map aspect ratio string to FLUX image_size format.
 */
function getImageSize(aspectRatio?: string): { width: number; height: number } {
  switch (aspectRatio) {
    case "9:16":
      return { width: 768, height: 1344 };
    case "16:9":
      return { width: 1344, height: 768 };
    case "4:3":
      return { width: 1152, height: 896 };
    case "3:4":
      return { width: 896, height: 1152 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}

export const generateImage = async (
  prompt: string,
  _referenceImageUrl?: string,
  options?: { aspectRatio?: string; resolution?: string }
): Promise<string> => {
  if (!env.falApiKey) throw new Error("Image generation is not configured.");

  const imageSize = getImageSize(options?.aspectRatio);

  // Use FLUX Schnell for fast, reliable image generation
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: imageSize,
      num_images: 1,
      num_inference_steps: 4,
    },
    logs: false,
  });

  const first = (result.data as { images?: Array<{ url?: string }> })?.images?.[0]?.url;
  if (!first) throw new Error("Image generation returned no output.");
  return first;
};

/**
 * Generate video using Kling 2.6 Pro (image-to-video).
 */
export const generateVideo = async (params: {
  prompt: string;
  imageUrl?: string;
  duration: number;
  aspectRatio: string;
}): Promise<{ videoUrl: string; durationSec: number }> => {
  if (!env.falApiKey) throw new Error("Video generation is not configured.");

  const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/image-to-video", {
    input: {
      prompt: params.prompt,
      ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      duration: String(params.duration),
      aspect_ratio: params.aspectRatio,
    },
    logs: false,
  });

  const video = (result.data as { video?: { url?: string } })?.video?.url;
  if (!video) throw new Error("Video generation returned no output.");
  return { videoUrl: video, durationSec: params.duration };
};
