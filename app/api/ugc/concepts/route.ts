import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listConcepts, createConcept } from "@/lib/data/ugc-concepts";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const url = new URL(request.url);
    const brandId = url.searchParams.get("brandId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const concepts = await listConcepts(auth.tenant.id, brandId, status);
    return NextResponse.json({ concepts });
  } catch (error) {
    console.error("[ugc/concepts GET]", error);
    return NextResponse.json({ error: "Failed to fetch concepts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  if (!body.brand_id || !body.title?.trim()) {
    return NextResponse.json({ error: "brand_id and title are required" }, { status: 400 });
  }

  try {
    const concept = await createConcept(auth.tenant.id, {
      ...body,
      title: body.title.trim(),
      created_by: auth.user.id,
    });
    return NextResponse.json({ concept }, { status: 201 });
  } catch (error) {
    console.error("[ugc/concepts POST]", error);
    return NextResponse.json({ error: "Failed to create concept" }, { status: 500 });
  }
}
