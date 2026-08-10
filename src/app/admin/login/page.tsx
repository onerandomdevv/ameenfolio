import { AdminLogin } from "@/components/admin/admin-login";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="admin-theme grid min-h-dvh place-items-center bg-background px-5 py-10 text-foreground">
      <AdminLogin />
    </main>
  );
}
