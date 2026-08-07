import { NowManager } from "@/components/admin/now-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getAdminNow } from "@/db/queries";

export default async function NowPage() {
  const { section, links } = await getAdminNow();

  return (
    <>
      <AdminPageHeader
        title="Now"
        description="Share what you are currently focused on and optionally link to active work."
      />
      <NowManager section={section} links={links} />
    </>
  );
}
