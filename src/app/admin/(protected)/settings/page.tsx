import { getAdminSettings } from "@/db/queries";
import { BippyVisibilitySetting } from "@/components/admin/bippy-visibility-setting";
import { SettingsForm } from "@/components/admin/settings-form";
import { SystemStatus } from "@/components/admin/system-status";

export default async function SettingsPage() {
  const settings = await getAdminSettings();
  return (
    <>
      <SettingsForm settings={settings} />
      <SystemStatus />
      {/* Showing him publicly is a site-wide switch, so it sits with the other
          site settings rather than on the page used to test him. */}
      <BippyVisibilitySetting enabled={settings.publicBippyEnabled} />
    </>
  );
}
