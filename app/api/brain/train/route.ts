import { NextResponse } from "next/server";
import { requireUserTenant } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { tenant } = await requireUserTenant();
    const supabase = await createServerClient();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploaded: { file_name: string; file_type: string; storage_url: string; file_size_bytes: number }[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const storagePath = `brain/${tenant.id}/${Date.now()}-${file.name}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(storagePath);

      uploaded.push({
        file_name: file.name,
        file_type: ext === "pdf" ? "pdf" : "image",
        storage_url: urlData.publicUrl,
        file_size_bytes: file.size,
      });
    }

    // Insert file records into brain_files table
    if (uploaded.length > 0) {
      const { error: insertError } = await supabase.from("brain_files").insert(
        uploaded.map((f) => ({
          tenant_id: tenant.id,
          ...f,
        }))
      );

      if (insertError) {
        console.error("Insert error:", insertError);
        // Non-fatal — files are uploaded even if DB insert fails
      }
    }

    // Update brain status
    await supabase
      .from("brain_status")
      .upsert(
        {
          tenant_id: tenant.id,
          status: "complete",
          last_trained_at: new Date().toISOString(),
          file_count: uploaded.length,
        },
        { onConflict: "tenant_id" }
      );

    return NextResponse.json({
      success: true,
      uploaded: uploaded.length,
      total: files.length,
    });
  } catch (error: unknown) {
    console.error("Brain train error:", error);
    return NextResponse.json(
      { error: "Failed to process brain training" },
      { status: 500 }
    );
  }
}
