import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

export const generateImage = async (
  prompt: string,
  referenceImageUrl?: string,
  options?: { aspectRatio?: string; resolution?: string }
): Promise<string> => {
  if (!env.falApiKey) throw new Error("FAL_API_KEY not configured \u2014 cannot generate images.");

  // Preflight: validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("VALIDATION: prompt is empty or missing.");
  }
  // Preflight: validate reference URL if provided
  if (referenceImageUrl) {
    try {
      const u = new URL(referenceImageUrl);
      if (!["http:", "https:"].includes(u.protocol)) {
        throw new Error("VALIDATION: reference image URL has invalid protocol.");
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("VALIDATION:")) throw e;
      throw new Error(`VALIDATION: reference image URL is malformed \u2014 ${referenceImageUrl}`);
    }
  }

  // Preflight: require at least one reference image (nano-banana-2/edit requires image_urls)
  if (!referenceImageUrl) {
    throw new Error("VALIDATION: reference image is required \u2014 the nano-banana-2/edit endpoint needs at least one image_url.");
  }

  // Build input for nano-banana-2/edit
  const input: Record<string, unknown> = {
    prompt: prompt.trim(),
    num_images: 1,
    image_urls: [referenceImageUrl],
  };

  if (options?.aspectRatio) {
    input.aspect_ratio = options.aspectRatio;
  }

  try {
    const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
      input,
      logs: false,
    });

    const first = (result.data as { images?: Array<{ url?: string }> })?.images?.[0]?.url;
    if (!first) throw new Error("FAL_EMPTY: Image generation returned no output images.");
    return first;
  } catch (falErr) {
    const msg = falErr instanceof Error ? falErr.message : String(falErr);
    // Classify the error for better observability
    if (msg.includes("FAL_EMPTY") || msg.includes("VALIDATION:")) throw falErr;
    if (msg.includes("422") || msg.includes("Unprocessable")) {
      throw new Error(`FAL_INVALID_INPUT: ${msg}`);
    }
    if (msg.includes("401") || msg.includes("Unauthorized")) {
      throw new Error(`FAL_AUTH: API key invalid or expired \u2014 ${msg}`);
    }
    if (msg.includes("429") || msg.includes("rate")) {
      throw new Error(`FAL_RATE_LIMIT: ${msg}`);
    }
    if (msg.includes("timeout") || msg.includes("TIMEOUT")) {
      throw new Error(`FAL_TIMEOUT: ${msg}`);
    }
    throw new Error(`FAL_ERROR: ${msg}`);
  }
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
