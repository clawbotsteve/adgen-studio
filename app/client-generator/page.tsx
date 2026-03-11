import { requireUserTenantPage } from "@/lib/auth";
import { ClientGeneratorPage } from "@/components/client-generator/ClientGeneratorPage";

export const metadata = { title: "Client Generator – AdGen Studio" };

export default async function Page() {
  const { tenantId } = await requireUserTenantPage();
  return <ClientGeneratorPage tenantId={tenantId} />;
}
