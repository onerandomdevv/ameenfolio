import { getAdminRecognitions } from "@/db/queries";
import { RecognitionsManager } from "@/components/admin/recognitions-manager";

export default async function RecognitionsPage() {
  const items = await getAdminRecognitions();
  return <RecognitionsManager items={items} />;
}
