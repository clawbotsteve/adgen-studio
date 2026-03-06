import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listClients, createClient } from "@/lib/data/clients";

export async function GET() {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const clients = await listClients(auth.tenant.id);
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("[clients GET]", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as { name?: string; description?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  try {
    const client = await createClient(auth.tenant.id, {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("[clients POST]", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
