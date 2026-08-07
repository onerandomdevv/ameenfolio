import { getAdminSettings } from "@/db/queries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const settings = await getAdminSettings();
  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="Manage the combined hero, contact links, résumé, and SEO defaults."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
