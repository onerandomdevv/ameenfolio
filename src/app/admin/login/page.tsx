import { AdminLogin } from "@/components/admin/admin-login";
import { safeAdminCallbackPath } from "@/lib/routing/safe-admin-callback";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const callbackPath = safeAdminCallbackPath((await searchParams).next);
  return (
    <main className="admin-theme grid min-h-dvh place-items-center bg-background px-5 py-10 text-foreground">
      <AdminLogin callbackPath={callbackPath} />
    </main>
  );
}
