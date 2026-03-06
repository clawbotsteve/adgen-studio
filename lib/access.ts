import { createSupabaseService } from "./supabase";

export const assertTenantUser = async (tenantId: string, userId: string): Promise<boolean> => {
  const svc = createSupabaseService();
  const { data, error } = await svc
    .from("tenant_users")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
};
