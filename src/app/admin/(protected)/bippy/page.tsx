import { redirect } from "next/navigation";
import { adminHref } from "@/lib/admin-path";

export default async function LegacyBippyPage() {
  redirect(await adminHref("/assistant/analytics"));
}
