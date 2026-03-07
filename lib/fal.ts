import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

export const generateImage = async (
  prompt: string,
  referenceImageUrl?: string
): Promise<string> => {
  if (!env.falApiKey) throw new Error("Image generation is not configured.");

  const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
    input: {
      prompt,
      image_url: referenceImageUrl || "",
      strength: 0.85,
      num_inference_steps: 30,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: "jpeg",
    },
    logs: false,
  });

  const first = (result.data as { images?: Array<{ url?: string }> })?.images?.[0]?.url;
  if (!first) throw new Error("Image generation returned no output.");
  return first;
};
