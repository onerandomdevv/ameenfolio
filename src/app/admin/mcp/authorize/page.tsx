import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { McpAuthorizationForm } from "@/components/admin/mcp-authorization-form";
import { getAuthorizedAdmin } from "@/lib/auth/server";
import { adminHref } from "@/lib/admin-path";
import { isMcpEnabled } from "@/lib/mcp/config";
import { validateAuthorizationRequest } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function McpAuthorizePage({ searchParams }: Props) {
  if (!isMcpEnabled()) redirect(await adminHref("/assistant"));
  const raw = await searchParams;
  const params = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, first(value)]),
  );
  const user = await getAuthorizedAdmin();
  if (!user) {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const returnPath = `${await adminHref("/mcp/authorize")}?${query}`;
    redirect(
      `${await adminHref("/login")}?next=${encodeURIComponent(returnPath)}`,
    );
  }
  const validated = await validateAuthorizationRequest(params);

  return (
    <main className="admin-theme grid min-h-dvh place-items-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-7">
        <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold">
          Connect {validated.client.clientName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This gives the client access to Bippy&apos;s controlled portfolio
          tools. Drafts and proposed public changes still require review in the
          admin.
        </p>
        <p className="mt-3 break-all rounded-md border border-border px-3 py-2 font-mono text-xs text-muted-foreground">
          Return to: {validated.input.redirect_uri}
        </p>
        <ul className="mt-5 space-y-2 text-sm text-foreground">
          {validated.scopes.map((scope) => (
            <li
              key={scope}
              className="rounded-md border border-border px-3 py-2 font-mono text-xs"
            >
              {scope}
            </li>
          ))}
        </ul>
        <McpAuthorizationForm
          fields={Object.entries(validated.input).map(([name, value]) => ({
            name,
            value: String(value),
          }))}
        />
      </section>
    </main>
  );
}
