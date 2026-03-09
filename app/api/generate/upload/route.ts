import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { uploadCreativeImage } from "@/lib/storage";
import { createReference } from "@/lib/data/references";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;
    const label = (formData.get("label") as string) || "identity";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!clientId?.trim()) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadCreativeImage(
      buffer,
      file.name,
      file.type,
      auth.tenant.id,
      clientId.trim()
    );

    // Insert reference_images record
    const reference = await createReference(auth.tenant.id, {
      client_id: clientId.trim(),
      label: label as "identity" | "outfit" | "product" | "background",
      url,
      tags: [],
      is_primary: false,
    });

    return NextResponse.json({ image: reference }, { status: 201 });
  } catch (error) {
    console.error("[generate/upload POST]", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
