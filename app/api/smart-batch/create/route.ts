import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createBatchRun, createBatchItems } from "@/lib/data/batches";
import { getProfile } from "@/lib/data/profiles";
import { getPromptPack, listPromptItems } from "@/lib/data/prompts";
import { getClient } from "@/lib/data/clients";
import { buildMasterContextString } from "@/lib/data/brand-context";

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.details === "string") return `${obj.message ?? "error"}: ${obj.details}`;
    try { return JSON.stringify(e); } catch { /* fallback */ }
  }
  return String(e);
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
    clientId?: string; profileId?: string; promptPackId?: string;
    briefText?: string; additionalContext?: string; useBrandContext?: boolean;
    aspectRatio?: string; resolution?: string;
  };
  if (!body.clientId || !body.profileId || !body.promptPackId) {
    return NextResponse.json({ error: "Missing required fields: clientId, profileId, promptPackId" }, { status: 400 });
  }
  try {
    let client, profile, promptPack;
    try {
      [client, profile, promptPack] = await Promise.all([
        getClient(auth.tenant.id, body.clientId),
        getProfile(auth.tenant.id, body.profileId),
        getPromptPack(auth.tenant.id, body.promptPackId),
      ]);
    } catch (lookupErr) {
      console.error("[smart-batch] Resource lookup error:", lookupErr);
      return NextResponse.json({ error: `Resource lookup failed: ${errMsg(lookupErr)}` }, { status: 500 });
    }
    if (!client || !profile || !promptPack) {
      return NextResponse.json({ error: `Not found: ${!client ? "client" : ""} ${!profile ? "profile" : ""} ${!promptPack ? "prompt pack" : ""}`.trim() }, { status: 404 });
    }
    const contextParts: string[] = [];
    if (body.useBrandContext !== false) {
      try {
        const masterContext = await buildMasterContextString(auth.tenant.id, body.clientId);
        if (masterContext) contextParts.push(masterContext);
      } catch (ctxErr) {
        console.error("[smart-batch] Brand context error:", ctxErr);
      }
    }
    if (body.briefText?.trim()) {
      contextParts.push(`=== BRIEF ===\n\n${body.briefText.trim()}\n\n=== END BRIEF ===`);
    }
    if (body.additionalContext?.trim()) {
      contextParts.push(`=== ADDITIONAL CONTEXT ===\n\n${body.additionalContext.trim()}\n\n=== END ADDITIONAL CONTEXT ===`);
    }
    const contextPrefix = contextParts.length > 0 ? contextParts.join("\n\n") + "\n\n" : "";
    const promptItems = await listPromptItems(body.promptPackId);
    if (promptItems.length === 0) {
      return NextResponse.json({ error: "Prompt pack has no items" }, { status: 400 });
    }
    let batchRun;
    try {
      batchRun = await createBatchRun({
        tenantId: auth.tenant.id, clientId: body.clientId, profileId: body.profileId,
        promptPackId: body.promptPackId, totalItems: promptItems.length, createdBy: auth.user.id,
      });
    } catch (runErr) {
      console.error("[smart-batch] createBatchRun error:", runErr);
      return NextResponse.json({ error: `Failed to create batch run: ${errMsg(runErr)}` }, { status: 500 });
    }
    const batchItems = promptItems.map((item) => ({
      promptItemId: item.id, concept: item.concept,
      prompt: contextPrefix ? `${contextPrefix}Generate creative for:\n${item.prompt_text}` : item.prompt_text,
    }));
    try {
      await createBatchItems(batchRun.id, batchItems);
    } catch (itemErr) {
      console.error("[smart-batch] createBatchItems error:", itemErr);
      return NextResponse.json({ error: `Failed to create batch items: ${errMsg(itemErr)}` }, { status: 500 });
    }
    // Trigger batch processing in the background (fire-and-forget)
    const processUrl = new URL("/api/batch/process", request.url);
    fetch(processUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: batchRun.id, tenantId: auth.tenant.id,
        profileId: body.profileId, clientId: body.clientId,
        aspectRatio: body.aspectRatio, resolution: body.resolution,
      }),
    }).catch((err) => {
      console.error("[smart-batch] Failed to trigger batch processing:", err);
    });
    return NextResponse.json({ run: batchRun }, { status: 201 });
  } catch (error) {
    console.error("[smart-batch create] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Failed to create smart batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
