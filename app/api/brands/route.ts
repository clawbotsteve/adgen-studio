import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createSupabaseService } from "@/lib/supabase";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as { name?: string; voice?: string; driveFolderId?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

  const svc = createSupabaseService();
  const { data, error } = await svc
    .from("brands")
    .insert({
      tenant_id: auth.tenant.id,
      name: body.name.trim(),
      voice: body.voice?.trim() || null,
      drive_folder_id: body.driveFolderId?.trim() || null,
    })
    .select("id,name,voice,drive_folder_id,created_at")
    .single();

  if (error) return NextResponse.json({ error: "Could not create brand" }, { status: 500 });
  return NextResponse.json({ brand: data });
}
