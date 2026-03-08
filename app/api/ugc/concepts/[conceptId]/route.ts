import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getConcept, updateConcept } from "@/lib/data/ugc-concepts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { conceptId } = await params;
    const concept = await getConcept(auth.tenant.id, conceptId);
    if (!concept) return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    return NextResponse.json({ concept });
  } catch (error) {
    console.error("[ugc/concepts/:id GET]", error);
    return NextResponse.json({ error: "Failed to fetch concept" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { conceptId } = await params;
    const body = await request.json();
    const concept = await updateConcept(auth.tenant.id, conceptId, body);
    if (!concept) return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    return NextResponse.json({ concept });
  } catch (error) {
    console.error("[ugc/concepts/:id PATCH]", error);
    return NextResponse.json({ error: "Failed to update concept" }, { status: 500 });
  }
}
