import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listPresets, createPreset } from "@/lib/data/ugc-presets";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const url = new URL(request.url);
    const brandId = url.searchParams.get("brandId") ?? undefined;
    const presets = await listPresets(auth.tenant.id, brandId);
    return NextResponse.json({ presets });
  } catch (error) {
    console.error("[ugc/presets GET]", error);
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await request.json();
  if (!body.brand_id || !body.name?.trim()) {
    return NextResponse.json({ error: "brand_id and name are required" }, { status: 400 });
  }
  try {
    const preset = await createPreset(auth.tenant.id, { ...body, name: body.name.trim() });
    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error("[ugc/presets POST]", error);
    return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
  }
}
