import { DesktopAdminNav, MobileAdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <DesktopAdminNav />
      <MobileAdminNav />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
