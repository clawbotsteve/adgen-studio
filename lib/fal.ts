import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

export const generateImage = async (
  prompt: string,
  referenceImageUrl?: string,
  options?: { aspectRatio?: string; resolution?: string }
): Promise<{ url: string; width: number; height: number }> => {
  if (!env.falApiKey) throw new Error("Image generation is not configured.");

  let result;

  if (referenceImageUrl) {
    // Use edit endpoint when we have a reference image
    result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
      input: {
        prompt,
        image_url: referenceImageUrl,
        num_images: 1,
        output_format: "png",
        safety_tolerance: "4",
        strength: 0.75,
        ...(options?.aspectRatio ? { aspect_ratio: options.aspectRatio } : {}),
      },
      logs: false,
    });
  } else {
    // Use text-to-image endpoint when no reference image
    result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        num_images: 1,
        output_format: "png",
        safety_tolerance: "4",
        ...(options?.aspectRatio ? { image_size: options.aspectRatio === "9:16" ? "portrait_16_9" : "square" } : {}),
      },
      logs: false,
    });
  }

  const first = (result.data as { images?: Array<{ url?: string }> })?.images?.[0];
  if (!first?.url) throw new Error("No image returned from fal.ai");

  return {
    url: first.url,
    width: (first as any).width || 1024,
    height: (first as any).height || 1024,
  };
};
