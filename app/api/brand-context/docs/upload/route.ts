import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createSupabaseService } from "@/lib/supabase";
import { addBrandContextDoc } from "@/lib/data/brand-context";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "png", "jpg", "jpeg", "webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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
    const brandContextId = formData.get("brandContextId") as string | null;
    const clientId = formData.get("clientId") as string | null;

    if (!file)
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    if (!brandContextId?.trim())
      return NextResponse.json(
        { error: "brandContextId is required" },
        { status: 400 }
      );
    if (!clientId?.trim())
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );

    // Validate file size
    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext))
      return NextResponse.json(
        {
          error: `Unsupported file type (.${ext}). Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );

    // Upload to Supabase Storage using service role (bypasses bucket MIME restrictions)
    const svc = createSupabaseService();
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const path = `brand-context/${clientId.trim()}/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await svc.storage
      .from("creatives")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    const { data: urlData } = svc.storage
      .from("creatives")
      .getPublicUrl(path);

    // Register doc metadata
    const doc = await addBrandContextDoc(auth.tenant.id, brandContextId.trim(), {
      file_name: file.name,
      file_type: ext,
      storage_url: urlData.publicUrl,
      file_size_bytes: file.size,
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    console.error("[brand-context/docs/upload POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
