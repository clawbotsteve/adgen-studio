import { redirect } from "next/navigation";
import { requireTenantContext } from "./tenant";

export const requireUserTenantPage = async () => {
  const { user, tenant, host } = await requireTenantContext();
  // No session → middleware should catch this, but belt-and-suspenders
  if (!user) redirect("/login");
  // Authenticated but no tenant for this hostname → error page (NOT /login!)
  if (!tenant) {
    console.error(
      "[auth] Tenant not found for host:",
      host,
      "user:",
      user.id,
    );
    redirect("/error?code=tenant&host=" + encodeURIComponent(host));
  }
  return { user, tenant };
};

export const requireUserTenantApi = async () => {
  const { user, tenant, host } = await requireTenantContext();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  if (!tenant) {
    console.error(
      "[auth-api] Tenant not found for host:",
      host,
      "user:",
      user.id,
    );
    return { error: "Tenant not found", status: 404 as const };
  }
  return { user, tenant };
};
