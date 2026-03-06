import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublic } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const next = url.searchParams.get("next") ?? "/dashboard";

  // If Supabase sent an error (e.g. expired link), redirect to login with message
  if (errorParam) {
    console.error("[auth/callback] Supabase error:", errorParam, errorDescription);
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth");
    loginUrl.searchParams.set(
      "message",
      errorDescription || "Authentication failed. Please try again.",
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    console.error("[auth/callback] No code param in callback URL");
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth");
    loginUrl.searchParams.set(
      "message",
      "Invalid sign-in link. Please request a new one.",
    );
    return NextResponse.redirect(loginUrl);
  }

  // Exchange the code for a session, writing cookies directly via cookieStore
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

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      "[auth/callback] Code exchange failed:",
      exchangeError.message,
    );
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth");
    loginUrl.searchParams.set(
      "message",
      "Sign-in link expired or already used. Please request a new one.",
    );
    return NextResponse.redirect(loginUrl);
  }

  // Verify we actually have a session now
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[auth/callback] Code exchanged but no user in session");
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth");
    loginUrl.searchParams.set(
      "message",
      "Session could not be established. Please try again.",
    );
    return NextResponse.redirect(loginUrl);
  }

  console.log("[auth/callback] Session established for user:", user.id);
  return NextResponse.redirect(new URL(next, url.origin));
}
