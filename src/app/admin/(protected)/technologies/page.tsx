import { getAdminTechnologies } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TechnologiesManager } from "@/components/admin/technologies-manager";

export default async function TechnologiesPage() {
  const items = await getAdminTechnologies();
  return (
    <>
      <AdminPageHeader
        title="Technologies"
        description="Group the tools you use without proficiency scores."
      />
      <TechnologiesManager items={items} />
    </>
  );
}
