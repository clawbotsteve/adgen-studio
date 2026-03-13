import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { addTopCreative, countTopCreatives } from "@/lib/data/top-creatives";
import { uploadCreativeImage } from "@/lib/storage";

const MAX_TOP_CREATIVES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/**
 * POST /api/top-creatives/upload
 * Upload a top-creative reference image for a client.
 * Accepts multipart FormData with: file, clientId
 */
export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;

    if (!file || !clientId) {
      return NextResponse.json(
        { error: "Missing file or clientId" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only PNG, JPEG, and WebP are allowed.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max 10MB.` },
        { status: 400 }
      );
    }

    // Check count limit
    const currentCount = await countTopCreatives(auth.tenant.id, clientId);
    if (currentCount >= MAX_TOP_CREATIVES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TOP_CREATIVES} top creatives reached. Remove some before adding more.` },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, fileSize } = await uploadCreativeImage(
      buffer,
      file.name,
      file.type,
      auth.tenant.id,
      clientId
    );

    // Save to reference_images table
    const creative = await addTopCreative(auth.tenant.id, clientId, {
      url,
      file_size_bytes: fileSize,
    });

    return NextResponse.json(creative, { status: 201 });
  } catch (error) {
    console.error("[top-creatives upload]", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
