import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/profiles/ProfileForm";
import { ProfileTable } from "@/components/profiles/ProfileTable";
import { listProfiles } from "@/lib/data/profiles";

export default async function ProfilesPage() {
  const { tenant } = await requireUserTenantPage();
  const profiles = await listProfiles(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Profiles"
        description="Create and manage image and video generation profiles"
      />
      <div style={{ display: "grid", gap: 24 }}>
        <ProfileForm />
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Profiles List</h3>
          <ProfileTable profiles={profiles} />
        </div>
      </div>
    </div>
  );
}
