import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

export const generateImage = async (prompt: string, referenceImageUrl?: string): Promise<string> => {
  if (!env.falApiKey) throw new Error("Image generation is not configured.");

  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
    input: {
      prompt,
      ...(referenceImageUrl ? { image_urls: [referenceImageUrl] } : {}),
      num_images: 1,
      output_format: "png",
      safety_tolerance: "4",
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
