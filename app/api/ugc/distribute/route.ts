import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getVariant, updateVariant } from "A/lib/data/ugc-variants";
import { notifySlack } from "@/lib/slack";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { variant_ids } = body;

  if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
    return NextResponse.json({ error: "variant_ids array is required" }, { status: 400 });
  }

  try {
    const results: Array<{ id: string; distributed: boolean; error?: string }> = [];

    for (const variantId of variant_ids) {
      const variant = await getVariant(auth.tenant.id, variantId);
      if (!variant || variant.status !== "approved") {
        results.push({ id: variantId, distributed: false, error: "Not found or not approved" });
        continue;
      }

      // Update status to launched
      await updateVariant(auth.tenant.id, variantId, { status: "launched" });

      // Notify Slack
      try {
        await notifySlack(
          `🎬 UGC variant launched: ${variant.kind} (${variant.aspect_ratio ?? "N/A"}) — ${variant.prompt.slice(0, 100)}${variant.prompt.length > 100 ? "..." : ""}`
        );
      } catch {
        // Slack notification is best-effort
      }

      results.push({ id: variantId, distributed: true });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[ugc/distribute POST]", error);
    return NextResponse.json({ error: "Distribution failed" }, { status: 500 });
  }
}
