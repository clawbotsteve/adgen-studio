import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { requireSupabasePublic } from "@/lib/env";
import { createSupabaseService } from "@/lib/supabase";

/**
 * POST /api/auth/ensure-tenant
 * Called after password-based login to auto-join the user to the tenant.
 * The auth callback handles this for magic-link flows, but password login
 * bypasses the callback, so we need this endpoint.
 */
export async function POST() {
  try {
    const cfg = requireSupabasePublic();
    const cookieStore = await cookies();

    const supabase = createServerClient(cfg.url, cfg.anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const h = await headers();
    const host = (h.get("x-forwarded-host") || h.get("host") || "")
      .split(":")[0]
      .toLowerCase();

    if (!host) {
      return NextResponse.json({ ok: true, joined: false });
    }

    const svc = createSupabaseService();

    const { data: tenant } = await svc
      .from("tenants")
      .select("id")
      .eq("domain", host)
      .single();

    if (!tenant) {
      return NextResponse.json({ ok: true, joined: false });
    }

    const { data: existing } = await svc
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      await svc.from("tenant_users").insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: "member",
      });
      console.log("[ensure-tenant] Auto-joined user", user.id, "to tenant", tenant.id);
      return NextResponse.json({ ok: true, joined: true });
    }

    return NextResponse.json({ ok: true, joined: false, existing: true });
  } catch (err) {
    console.error("[ensure-tenant] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
