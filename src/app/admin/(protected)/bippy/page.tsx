import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/admin-primitives";
import { BippyVisibilitySetting } from "@/components/admin/bippy-visibility-setting";
import { BippyPlayground } from "@/components/bippy/bippy-playground";
import { getAdminSettings } from "@/db/queries";

export const metadata: Metadata = {
  title: "Bippy Playground",
  description: "Private controls for testing the Bippy companion.",
  robots: { index: false, follow: false },
};

export default async function AdminBippyPage() {
  const settings = await getAdminSettings();

  return (
    <AdminPage title="Bippy">
      <BippyPlayground />
      <BippyVisibilitySetting enabled={settings.publicBippyEnabled} />
    </AdminPage>
  );
}
