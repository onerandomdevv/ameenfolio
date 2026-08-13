import "server-only";

import {
  Activity,
  Cable,
  Cloud,
  Database,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  ListRow,
  RowMeta,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { Badge } from "@/components/ui/badge";
import { getServerEnv } from "@/lib/env";

export function SystemStatus() {
  const env = getServerEnv();
  const statuses = [
    {
      label: "Database",
      description: "Portfolio content and assistant history",
      ready: Boolean(env.DATABASE_URL),
      optional: false,
      icon: Database,
    },
    {
      label: "Authentication",
      description: "Protected administrator access",
      ready: Boolean(env.NEON_AUTH_BASE_URL && env.NEON_AUTH_COOKIE_SECRET),
      optional: false,
      icon: LockKeyhole,
    },
    {
      label: "Media storage",
      description: "Project images, profile photo, and résumé",
      ready: Boolean(
        env.R2_ACCOUNT_ID &&
        env.R2_ACCESS_KEY_ID &&
        env.R2_SECRET_ACCESS_KEY &&
        env.R2_BUCKET_NAME,
      ),
      optional: false,
      icon: Cloud,
    },
    {
      label: "OpenAI",
      description: "Portfolio assistant conversations and actions",
      ready: Boolean(env.OPENAI_API_KEY),
      optional: false,
      icon: Sparkles,
    },
    {
      label: "Bippy MCP",
      description: "Private ChatGPT, Claude, and Codex connections",
      ready: Boolean(
        env.MCP_ENABLED &&
        env.MCP_RESOURCE_URL &&
        env.MCP_AUTH_ISSUER &&
        env.MCP_AUTHORIZATION_URL,
      ),
      optional: true,
      icon: Cable,
    },
    {
      label: "MCP cleanup",
      description: "Scheduled removal of expired OAuth credentials",
      ready: Boolean(env.MCP_MAINTENANCE_SECRET),
      optional: true,
      icon: RefreshCw,
    },
    {
      label: "WakaTime",
      description: "Public coding activity and working-hours data",
      ready: Boolean(env.WAKATIME_API_KEY),
      optional: true,
      icon: Activity,
    },
  ];

  return (
    <section className="mt-8 max-w-[720px]" aria-label="System status">
      <SectionHeading meta="Server configuration">System status</SectionHeading>
      {statuses.map((status) => {
        const Icon = status.icon;
        return (
          <ListRow
            key={status.label}
            icon={<Icon aria-hidden="true" />}
            title={status.label}
            meta={<RowMeta>{status.description}</RowMeta>}
            badge={
              <Badge variant={status.ready ? "outline" : "secondary"}>
                {status.ready
                  ? "Configured"
                  : status.optional
                    ? "Optional"
                    : "Needs setup"}
              </Badge>
            }
          />
        );
      })}
    </section>
  );
}
