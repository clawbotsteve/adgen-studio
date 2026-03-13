import { fal } from "@fal-ai/client";
import { env } from "./env";

if (env.falApiKey) {
  fal.config({ credentials: env.falApiKey });
}

/**
 * Submit an image generation job to the fal queue (non-blocking).
 * Returns a requestId that can be polled for results.
 */
export async function submitImage(
  prompt: string,
  referenceImageUrl?: string,
  options?: { aspectRatio?: string; resolution?: string }
): Promise<{ requestId: string; model: string }> {
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

  const { request_id } = await fal.queue.submit(model, { input });
  return { requestId: request_id, model };
}

/**
 * Check the status of a submitted fal job.
 * Returns "pending" | "completed" | "failed" and the result if completed.
 */
export async function checkImageStatus(
  model: string,
  requestId: string
): Promise<{
  status: "pending" | "completed" | "failed";
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}> {
  try {
    const statusResp = await fal.queue.status(model, {
      requestId,
      logs: false,
    });

    const s = (statusResp as any).status;
    if (s === "COMPLETED") {
      // Fetch the result
      const result = await fal.queue.result(model, { requestId });
      const responseData = (result as any).data ?? result;
      const images = (responseData as any)?.images;
      const first = Array.isArray(images) ? images[0] : undefined;

      if (!first?.url || typeof first.url !== "string") {
        return { status: "failed", error: "No image in response" };
      }

      return {
        status: "completed",
        url: first.url,
        width: typeof first.width === "number" ? first.width : 1024,
        height: typeof first.height === "number" ? first.height : 1024,
      };
    } else if (s === "FAILED") {
      return { status: "failed", error: "Image generation failed on fal.ai" };
    } else {
      // IN_QUEUE or IN_PROGRESS
      return { status: "pending" };
    }
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Legacy blocking call — kept for single-image generation.
 */
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
    input = { prompt, image_urls: [referenceImageUrl], num_images: 1, output_format: "png", safety_tolerance: "4", aspect_ratio: aspectRatio };
  } else {
    model = "fal-ai/nano-banana-2";
    input = { prompt, num_images: 1, output_format: "png", safety_tolerance: "4", aspect_ratio: aspectRatio };
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