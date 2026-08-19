import { getAdminSettings } from "@/db/queries";
import { ActiveSessions } from "@/components/admin/active-sessions";
import { BippyVisibilitySetting } from "@/components/admin/bippy-visibility-setting";
import { SettingsForm } from "@/components/admin/settings-form";
import { SystemStatus } from "@/components/admin/system-status";
import { getAdminSessions } from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, sessions] = await Promise.all([
    getAdminSettings(),
    getAdminSessions(),
  ]);
  return (
    <>
      <SettingsForm settings={settings} />
      <ActiveSessions result={sessions} />
      <SystemStatus />
      {/* Showing him publicly is a site-wide switch, so it sits with the other
          site settings rather than on the page used to test him. */}
      <BippyVisibilitySetting enabled={settings.publicBippyEnabled} />
    </>
  );
}
