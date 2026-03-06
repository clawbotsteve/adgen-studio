import { redirect } from "next/navigation";
import { requireTenantContext } from "./tenant";

export const requireUserTenantPage = async () => {
  const { user, tenant } = await requireTenantContext();
  if (!user) redirect("/login");
  if (!tenant) redirect("/login?error=tenant");
  return { user, tenant };
};

export const requireUserTenantApi = async () => {
  const { user, tenant } = await requireTenantContext();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  if (!tenant) return { error: "Tenant not found", status: 404 as const };
  return { user, tenant };
};
