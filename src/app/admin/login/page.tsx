import { AdminLogin } from "@/components/admin/admin-login";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string | string[] }> };

function safeCallbackPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate?.startsWith("/") || candidate.startsWith("//"))
    return undefined;
  return candidate;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const callbackPath = safeCallbackPath((await searchParams).next);
  return (
    <main className="admin-theme grid min-h-dvh place-items-center bg-background px-5 py-10 text-foreground">
      <AdminLogin callbackPath={callbackPath} />
    </main>
  );
}
