import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

export const generateImage = async (
  prompt: string,
  referenceImageUrl?: string,
  aspectRatio: string = "1:1",
  resolution: string = "1K"
): Promise<string> => {
  if (!env.falApiKey) throw new Error("Image generation is not configured.");

  const input: Record<string, unknown> = {
    prompt,
    num_images: 1,
    output_format: "png",
    aspect_ratio: aspectRatio,
    resolution,
  };

  if (referenceImageUrl) {
    input.image_urls = [referenceImageUrl];
  }

  console.log("[fal] Calling nano-banana-2/edit with input:", JSON.stringify(input));

  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
    input,
    logs: false,
  });

  console.log("[fal] Result received");

  const data = result.data as { images?: Array<{ url?: string }> };
  const first = data?.images?.[0]?.url;
  if (!first) throw new Error("Image generation returned no output.");
  return first;
};
