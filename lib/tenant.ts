import { headers } from "next/headers";
import { createSupabaseService, createSupabaseServer } from "./supabase";
import type { Tenant } from "@/types/domain";

const normalizeHost = (host: string | null): string => {
  if (!host) return "";
  return host.split(":")[0].toLowerCase();
};

export const getHost = async (): Promise<string> => {
  const h = await headers();
  return normalizeHost(h.get("x-forwarded-host") || h.get("host"));
};

export const getTenantByHost = async (host?: string): Promise<Tenant | null> => {
  const svc = createSupabaseService();
  const hostname = normalizeHost(host ?? (await getHost()));
  if (!hostname) return null;

  const { data, error } = await svc
    .from("tenants")
    .select("id,name,hostname,is_active")
    .eq("hostname", hostname)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as Tenant;
};

export const requireTenantContext = async () => {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, tenant: null };
  }

  const tenant = await getTenantByHost();
  return { user, tenant };
};
