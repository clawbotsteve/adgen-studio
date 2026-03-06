import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { requireServiceRole, requireSupabasePublic } from "./env";

export const createSupabaseBrowser = () => {
  const cfg = requireSupabasePublic();
  return createBrowserClient(cfg.url, cfg.anonKey);
};

export const createSupabaseServer = async () => {
  const cfg = requireSupabasePublic();
  const cookieStore = await cookies();
  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
};

export const createSupabaseService = () => {
  const cfg = requireSupabasePublic();
  return createClient(cfg.url, requireServiceRole(), { auth: { autoRefreshToken: false, persistSession: false } });
};
