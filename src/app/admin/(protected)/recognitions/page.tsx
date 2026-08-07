import { getAdminRecognitions } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RecognitionsManager } from "@/components/admin/recognitions-manager";

export default async function RecognitionsPage() {
  const items = await getAdminRecognitions();
  return (
    <>
      <AdminPageHeader
        title="Recognitions"
        description="Publish concise icon-led recognition rows with optional supporting links."
      />
      <RecognitionsManager items={items} />
    </>
  );
}
