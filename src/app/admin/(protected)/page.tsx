import { redirect } from "next/navigation";
import { adminHref } from "@/lib/admin-path";

export default async function AdminPage() {
  redirect(await adminHref("/assistant"));
}
