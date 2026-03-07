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

  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
    input: {
      prompt,
      ...(referenceImageUrl ? { image_url: referenceImageUrl } : {}),
    },
    logs: false,
  });

  const first = (result.data as { images?: Array<{ url?: string }> })?.images?.[0]?.url;
  if (!first) throw new Error("Image generation returned no output.");
  return first;
};
