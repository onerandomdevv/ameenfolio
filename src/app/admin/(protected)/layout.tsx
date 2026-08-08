import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      <AdminNav />
      <main className="mt-8">{children}</main>
    </div>
  );
}
