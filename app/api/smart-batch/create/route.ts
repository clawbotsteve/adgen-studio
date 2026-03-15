import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createBatchRun, createBatchItems } from "@/lib/data/batches";
import { getProfile } from "@/lib/data/profiles";
import { getClient } from "@/lib/data/clients";
import { DEFAULT_PROMPTS } from "@/lib/constants/defaultPrompts";

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.details === "string")
      return `${obj.message ?? "error"}: ${obj.details}`;
    try {
      return JSON.stringify(e);
    } catch {
      /* fallback */
    }
  }
  return String(e);
}

interface SavedPrompt {
  angle: string;
  label: string;
  prompt_text: string;
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
    profileId?: string;
    aspectRatio?: string;
    resolution?: string;
    quantity?: number;
    selectedAngles?: string[];
    lockAngles?: boolean;
  };

  if (!body.clientId || !body.profileId) {
    return NextResponse.json(
      { error: "Missing required fields: clientId, profileId" },
      { status: 400 }
    );
  }

  const selectedAngles: string[] = Array.isArray(body.selectedAngles)
    ? body.selectedAngles
    : [];
  const lockAngles: boolean = body.lockAngles === true;

  try {
    let client, profile;
    try {
      [client, profile] = await Promise.all([
        getClient(auth.tenant.id, body.clientId),
        getProfile(auth.tenant.id, body.profileId),
      ]);
    } catch (lookupErr) {
      console.error("[smart-batch] Resource lookup error:", lookupErr);
      return NextResponse.json(
        { error: `Resource lookup failed: ${errMsg(lookupErr)}` },
        { status: 500 }
      );
    }

    if (!client || !profile) {
      return NextResponse.json(
        {
          error: `Not found: ${!client ? "client" : ""} ${!profile ? "profile" : ""}`.trim(),
        },
        { status: 404 }
      );
    }

    const quantity = Math.min(Math.max(body.quantity || 5, 1), 20);

    let prompts: { concept: string; prompt: string }[] = [];

    // ── Always use curated default prompts ──
    const sourcePrompts: SavedPrompt[] = DEFAULT_PROMPTS;

    // Filter by selected angles if any
    let filtered = sourcePrompts;
    if (selectedAngles.length > 0) {
      if (lockAngles) {
        // Only use prompts from selected angles
        filtered = sourcePrompts.filter((p) =>
          selectedAngles.includes(p.angle)
        );
      } else {
        // Bias toward selected angles: put them first
        const selected = sourcePrompts.filter((p) =>
          selectedAngles.includes(p.angle)
        );
        const others = sourcePrompts.filter(
          (p) => !selectedAngles.includes(p.angle)
        );
        filtered = [...selected, ...others];
      }
    }

    if (filtered.length === 0) filtered = sourcePrompts;

    // Pick prompts up to quantity, cycling if needed
    for (let i = 0; i < quantity; i++) {
      const p = filtered[i % filtered.length];
      prompts.push({
        concept: p.label || p.angle || "creative",
        prompt: p.prompt_text,
      });
    }

    console.log(
      `[smart-batch] Using ${prompts.length} curated default prompts`
    );

    if (prompts.length === 0) {
      return NextResponse.json(
        {
          error:
            "No prompts available. Generate prompts in the Client Generator first.",
        },
        { status: 400 }
      );
    }

    // Build metadata — include promptSource so the process route
    // knows to skip the prompt engine for curated prompts
    const metadata: Record<string, unknown> = {
      promptSource: "client_generator",
    };
    if (selectedAngles.length > 0) {
      metadata.selectedAngles = selectedAngles;
      metadata.lockAngles = lockAngles;
    }

    // Create batch run
    let batchRun;
    try {
      batchRun = await createBatchRun({
        tenantId: auth.tenant.id,
        clientId: body.clientId,
        profileId: body.profileId,
        totalItems: prompts.length,
        createdBy: auth.user.id,
        ...(Object.keys(metadata).length > 0
          ? { metadata: JSON.stringify(metadata) }
          : {}),
      });
    } catch (runErr) {
      console.error("[smart-batch] createBatchRun error:", runErr);
      return NextResponse.json(
        { error: `Failed to create batch run: ${errMsg(runErr)}` },
        { status: 500 }
      );
    }

    // Create batch items
    const batchItems = prompts.map((item) => ({
      concept: item.concept,
      prompt: item.prompt,
    }));

    try {
      await createBatchItems(batchRun.id, batchItems);
    } catch (itemErr) {
      console.error("[smart-batch] createBatchItems error:", itemErr);
      return NextResponse.json(
        { error: `Failed to create batch items: ${errMsg(itemErr)}` },
        { status: 500 }
      );
    }

    // Trigger batch processing (fire-and-forget)
    const processUrl = new URL("/api/batch/process", request.url);
    fetch(processUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: batchRun.id,
        tenantId: auth.tenant.id,
        profileId: body.profileId,
        clientId: body.clientId,
        aspectRatio: body.aspectRatio,
        resolution: body.resolution,
      }),
    }).catch((err) => {
      console.error(
        "[smart-batch] Failed to trigger batch processing:",
        err
      );
    });

    return NextResponse.json({ run: batchRun }, { status: 201 });
  } catch (error) {
    console.error("[smart-batch create] Unhandled error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create smart batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
