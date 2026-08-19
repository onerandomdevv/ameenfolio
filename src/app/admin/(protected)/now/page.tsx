import { NowManager } from "@/components/admin/now-manager";
import { getAdminNow } from "@/db/queries";

export default async function NowPage() {
  const { section, links } = await getAdminNow();
  return <NowManager section={section} links={links} />;
}
