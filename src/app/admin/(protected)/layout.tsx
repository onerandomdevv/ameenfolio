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
    // min-h-dvh so the grey reaches the bottom of short pages: the body itself
    // is painted black for the public site and would show through otherwise.
    <div className="admin-theme min-h-dvh bg-background text-foreground">
      <AdminNav />
      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
