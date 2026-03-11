import { requireUserTenantPage } from "@/lib/auth";
import { BriefGeneratorPage } from "@/components/brief-generator/BriefGeneratorPage";

export const metadata = { title: "Brief Generator – AdGen Studio" };

export default async function Page() {
  const { tenantId } = await requireUserTenantPage();
  return <BriefGeneratorPage tenantId={tenantId} />;
}
