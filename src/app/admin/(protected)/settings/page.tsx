import { getAdminSettings } from "@/db/queries";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const settings = await getAdminSettings();
  return <SettingsForm settings={settings} />;
}
