import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

/**
 * Map user-facing resolution labels to fal.ai resolution values.
 * nano-banana-2 supports specific resolution strings.
 */
function mapResolution(res?: string): string {
  switch (res) {
    case "1K":
      return "1024x1024";
    case "2K":
      return "2048x2048";
    case "4K":
      return "4096x4096";
    default:
      return "1024x1024";
  }
}

export const generateImage = async (
  prompt: string,
  referenceImageUrl?: string,
  options?: { aspectRatio?: string; resolution?: string }
): Promise<{ url: string; width: number; height: number }> => {
  if (!env.falApiKey) throw new Error("Image generation is not configured.");

  const aspectRatio = options?.aspectRatio || "1:1";
  const resolution = mapResolution(options?.resolution);

  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
    input: {
      prompt,
      image_urls: referenceImageUrl ? [referenceImageUrl] : [],
      num_images: 1,
      output_format: "png",
      safety_tolerance: "4",
      aspect_ratio: aspectRatio,
    },
    logs: false,
  });

  // Handle both wrapped { data: { images: [...] } } and direct { images: [...] } responses
  const responseData = (result as any).data ?? result;
  const images = (responseData as any)?.images;
  const first = Array.isArray(images) ? images[0] : undefined;

  if (!first?.url || typeof first.url !== "string") {
    throw new Error("No image returned from fal.ai");
  }

  return {
    url: first.url,
    width: typeof first.width === "number" ? first.width : 1024,
    height: typeof first.height === "number" ? first.height : 1024,
  };
};
