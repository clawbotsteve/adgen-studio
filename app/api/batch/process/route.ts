import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { generateImage } from "@/lib/fal";

/**
 * POST /api/batch/process
 * Processes queued batch items for a given batch run.
 * Called internally after batch creation (no auth needed for internal calls,
 * but we validate the runId exists).
 *
 * This processes items sequentially to avoid overwhelming FAL API,
 * with concurrency of up to 3 items at a time.
 */

const CONCURRENCY = 3;

export const maxDuration = 300; // 5 min max for Vercel

export async function POST(request: Request) {
  const body = (await request.json()) as {
    runId?