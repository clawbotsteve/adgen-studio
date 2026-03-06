import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import {
  createBatchRun,
  createBatchItems,
} from "@/lib/data/batches";
import { getPromptPack, listPromptItems } from "@/lib/data/prompts";
import { getClient } from "@/lib/data/clients";
import { getProfile } from "@/lib/data/profiles";
import { validateBatchCreate } from "@/lib/validation/batch";
import { listReferences } from "@/lib/data/references";

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
    promptPackId?: string;
    referenceImageIds?: string[];
  };

  // Validate input
  if (!body.clientId || !body.profileId || !body.promptPackId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Verify resources exist
    const [client, profile, promptPack, references] = await Promise.all([
      getClient(auth.tenant.id, body.clientId),
      getProfile(auth.tenant.id, body.profileId),
      getPromptPack(auth.tenant.id, body.promptPackId),
      listReferences(auth.tenant.id, body.clientId),
    ]);

    if (!client || !profile || !promptPack) {
      return NextResponse.json(
        { error: "Client, profile, or prompt pack not found" },
        { status: 404 }
      );
    }

    // Validate batch
    const validation = validateBatchCreate({
      clientId: body.clientId,
      profileId: body.profileId,
      promptPackId: body.promptPackId,
      promptItemCount: promptPack.item_count,
      hasReferenceImage:
        (body.referenceImageIds?.length ?? 0) > 0,
      profileMode: profile.mode,
      audioEnabled: profile.audio_enabled,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Batch validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Check for primary identity
    const hasPrimaryIdentity = references.some(
      (r) =>
        r.label === "identity" &&
        r.is_primary &&
        (body.referenceImageIds?.includes(r.id) ?? false)
    );

    if (!hasPrimaryIdentity) {
      return NextResponse.json(
        {
          error:
            "At least one primary identity image must be selected",
        },
        { status: 400 }
      );
    }

    // Get prompt items
    const promptItems = await listPromptItems(body.promptPackId);

    // Create batch run
    const batchRun = await createBatchRun(auth.tenant.id, {
      client_id: body.clientId,
      profile_id: body.profileId,
      prompt_pack_id: body.promptPackId,
      total_items: promptItems.length,
      created_by: auth.user.id,
    });

    // Create batch items
    const batchItems = promptItems.map((item) => ({
      prompt_item_id: item.id,
      concept: item.concept,
      prompt: item.prompt_text,
    }));

    await createBatchItems(batchRun.id, batchItems);

    return NextResponse.json({ run: batchRun }, { status: 201 });
  } catch (error) {
    console.error("[batch create]", error);
    return NextResponse.json(
      { error: "Failed to create batch run" },
      { status: 500 }
    );
  }
}
