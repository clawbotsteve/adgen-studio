import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { uploadCreativeImage } from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brandId = (formData.get("brandId") as string) || "ugc";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadCreativeImage(
      buffer,
      file.name,
      file.type,
      auth.tenant.id,
      brandId
    );

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("[ugc/upload POST]", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
