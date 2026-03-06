import { requireUserTenantPage } from "@/lib/auth";
import BrandForm from "@/components/BrandForm";
import { listBrands } from "@/lib/data";

export default async function BrandsPage() {
  const { tenant } = await requireUserTenantPage();
  const brands = await listBrands(tenant.id);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <BrandForm />
      <section className="card">
        <h3>Brands</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Voice</th><th>Created</th></tr></thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td>{brand.name}</td>
                <td>{brand.voice || "-"}</td>
                <td>{new Date(brand.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
