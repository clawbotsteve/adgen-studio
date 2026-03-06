import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { updateClient, archiveClient, getClient } from "@/lib/data/clients";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const clientId = params.id;
  const body = (await request.json()) as Partial<{ name: string; description: string }>;

  try {
    const client = await updateClient(auth.tenant.id, clientId, body);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (error) {
    console.error("[clients PATCH]", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const clientId = params.id;

  try {
    // Verify client exists and belongs to tenant
    const client = await getClient(auth.tenant.id, clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const success = await archiveClient(auth.tenant.id, clientId);
    if (!success) {
      return NextResponse.json({ error: "Failed to archive client" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[clients DELETE]", error);
    return NextResponse.json({ error: "Failed to archive client" }, { status: 500 });
  }
}
