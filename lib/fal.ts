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

  const aspectRatio = options?.aspectRatio || "1:1";

  let model: string;
  let input: Record<string, unknown>;

  if (referenceImageUrl) {
    model = "fal-ai/nano-banana-2/edit";
    input = {
      prompt,
      image_urls: [referenceImageUrl],
      num_images: 1,
      output_format: "png",
      safety_tolerance: "4",
      aspect_ratio: aspectRatio,
    };
  } else {
    model = "fal-ai/nano-banana-2";
    input = {
      prompt,
      num_images: 1,
      output_format: "png",
      safety_tolerance: "4",
      aspect_ratio: aspectRatio,
    };
  }

  const result = await fal.subscribe(model, { input, logs: false });

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