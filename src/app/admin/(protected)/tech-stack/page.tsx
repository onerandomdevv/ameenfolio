import { getAdminTechStack } from "@/db/queries";
import { TechStackManager } from "@/components/admin/tech-stack-manager";

export default async function AdminTechStackPage() {
  const items = await getAdminTechStack();
  return <TechStackManager items={items} />;
}
