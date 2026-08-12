import { getAdminSettings } from "@/db/queries";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function ProfilePage() {
  const settings = await getAdminSettings();
  return <ProfileForm settings={settings} />;
}
