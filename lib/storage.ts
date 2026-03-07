import { createSupabaseService } from "./supabase";

/**
 * Upload an image to Supabase Storage "creatives" bucket.
 * Returns the public URL.
 */
export async function uploadCreativeImage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  tenantId: string,
  clientId: string
): Promise<{ url: string; fileSize: number }> {
  const svc = createSupabaseService();

  // Generate a unique path
  const ext = fileName.split(".").pop() || "png";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const path = `${tenantId}/${clientId}/${uniqueName}`;

  const { error } = await svc.storage
    .from("creatives")
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = svc.storage
    .from("creatives")
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    fileSize: fileBuffer.byteLength,
  };
}
