import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createSupabaseService } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString();

  const svc = createSupabaseService();
  const { data, error } = await svc
    .from("jobs")
    .select("id,brand_id,status,created_at,brands(name)")
    .eq("tenant_id", auth.tenant.id)
    .gte("created_at", from)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not fetch usage report" }, { status: 500 });

  return NextResponse.json({ report: data ?? [] });
}
