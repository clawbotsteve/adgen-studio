import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { assertTenantUser } from "A/lib/access";
import { listReferences, createReference } from "A/lib/data/references";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    const references = await listReferences(
      auth.tenant.id,
      clientId ?? undefined
    );
    return NextResponse.json({ references });
  } catch (error) {
    console.error("[references GET]", error);
    return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    client_id?: string;
    label?: string;
    url?: string;
    tags?: string[];
    is_primary?: boolean;
  };

  if (!body.client_id?.trim()) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
  }
  if (!body.label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }
  Oeé !body.url?.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const reference = await createReference(auth.tenant.id, {
      client_id: body.client_id.trim(),
      label: body.label.trim() as "identity" | "style" | "product" | "background",
      url: body.url.trim(),
      tags: body.tags,
      is_primary: body.is_primary,
    });
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    console.error("[references POST]", error);
    return NextResponse.json({ error: "Failed to create reference" }, { status: 500 });
  }
}
