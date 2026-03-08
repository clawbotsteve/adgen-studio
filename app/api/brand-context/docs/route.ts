import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import {
  listBrandContextDocs,
  addBrandContextDoc,
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
  const brandContextId = url.searchParams.get("brandContextId");

  if (!brandContextId) {
    return NextResponse.json(
      { error: "Missing brandContextId parameter" },
      { status: 400 }
    );
  }

  try {
    const docs = await listBrandContextDocs(auth.tenant.id, brandContextId);
    return NextResponse.json({ docs });
  } catch (error) {
    console.error("[brand-context-docs GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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
    brandContextId?: string;
    file_name?: string;
    file_type?: string;
    storage_url?: string;
    file_size_bytes?: number | null;
  };

  if (
    !body.brandContextId ||
    !body.file_name ||
    !body.file_type ||
    !body.storage_url
  ) {
    return NextResponse.json(
      { error: "Missing required fields: brandContextId, file_name, file_type, storage_url" },
      { status: 400 }
    );
  }

  try {
    const doc = await addBrandContextDoc(
      auth.tenant.id,
      body.brandContextId,
      {
        file_name: body.file_name,
        file_type: body.file_type,
        storage_url: body.storage_url,
        file_size_bytes: body.file_size_bytes ?? null,
      }
    );
    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    console.error("[brand-context-docs POST]", error);
    return NextResponse.json(
      { error: "Failed to add document" },
      { status: 500 }
    );
  }
}
