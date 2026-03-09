import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { secret } = await req.json();
  if (secret !== "migrate2026") return NextResponse.json({ e: "no" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const svc = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const r: Record<string, unknown> = { url };
  const { data: p } = await svc.from("prompt_packs").select("*").limit(1);
  r.pack_cols = p?.[0] ? Object.keys(p[0]) : "empty";
  const { data: i } = await svc.from("prompt_items").select("*").limit(1);
  r.item_cols = i?.[0] ? Object.keys(i[0]) : "empty";
  r.ref = url.replace("https://", "").split(".")[0];
  return NextResponse.json(r);
}
