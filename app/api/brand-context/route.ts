import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import {
  getBrandContext,
  upsertBrandContext,
} from "@/lib/data/brand-context";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing clientId parameter" },
      { status: 400 }
    );
  }

  try {
    const context = await getBrandContext(auth.tenant.id, clientId);
    return NextResponse.json({ context });
  } catch (error) {
    console.error("[brand-context GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch brand context" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    clientId?: string;
    brand_guidelines?: string;
    products?: string;
    competitive_landscape?: string;
    customer_personas?: string;
    founder_story?: string;
    marketing_calendar?: string;
    compliance_legal?: string;
    testing_priorities?: string;
    ad_format_preferences?: string;
    creative_ops_constraints?: string;
    naming_conventions?: string;
    goals?: string;
  };

  if (!body.clientId) {
    return NextResponse.json(
      { error: "Missing clientId" },
      { status: 400 }
    );
  }

  try {
    const { clientId, ...fields } = body;
    const context = await upsertBrandContext(
      auth.tenant.id,
      clientId,
      fields
    );
    return NextResponse.json({ context }, { status: 200 });
  } catch (error) {
    console.error("[brand-context POST]", error);
    return NextResponse.json(
      { error: "Failed to save brand context" },
      { status: 500 }
    );
  }
}
