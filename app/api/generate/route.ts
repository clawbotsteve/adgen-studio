import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createSupabaseService } from "@/lib/supabase";
import { generateImage } from "@/lib/fal";
import { uploadImageFromUrlToDrive } from "@/lib/drive";
import { notifySlack } from "@/lib/slack";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as { brandId?: string; prompt?: string; referenceImageUrl?: string };
  if (!body.brandId || !body.prompt?.trim()) {
    return NextResponse.json({ error: "brandId and prompt are required" }, { status: 400 });
  }

  const svc = createSupabaseService();

  const { data: brand } = await svc
    .from("brands")
    .select("id,name,drive_folder_id")
    .eq("id", body.brandId)
    .eq("tenant_id", auth.tenant.id)
    .maybeSingle();

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const { data: job, error: jobError } = await svc
    .from("jobs")
    .insert({
      tenant_id: auth.tenant.id,
      brand_id: brand.id,
      prompt: body.prompt.trim(),
      status: "processing",
      created_by: auth.user.id,
    })
    .select("id")
    .single();

  if (jobError || !job) return NextResponse.json({ error: "Unable to create generation job" }, { status: 500 });

  try {
    const imageUrl = await generateImage(body.prompt.trim(), body.referenceImageUrl);
    const driveUrl = await uploadImageFromUrlToDrive({
      imageUrl,
      folderId: brand.drive_folder_id,
      filename: `${brand.name.replace(/\s+/g, "-").toLowerCase()}-${job.id}.png`,
    });

    await svc.from("jobs").update({ status: "completed", output_url: driveUrl }).eq("id", job.id).eq("tenant_id", auth.tenant.id);

    await notifySlack(`New ad creative generated for ${brand.name}. Job ID: ${job.id}`);

    return NextResponse.json({ jobId: job.id, outputUrl: driveUrl });
  } catch {
    await svc.from("jobs").update({ status: "failed" }).eq("id", job.id).eq("tenant_id", auth.tenant.id);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
