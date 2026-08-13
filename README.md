# Ameenfolio

A mobile-first portfolio and owner-only content admin built with Next.js 16, Tailwind CSS 4, shadcn/ui, Neon PostgreSQL/Auth, Drizzle ORM, and private Cloudflare R2 storage.

The admin includes Bippy, an approval-gated assistant, plus a private
OAuth-protected MCP resource that lets compatible ChatGPT, Claude, and Codex
clients use the same controlled portfolio tools.

## Commands

```text
npm run dev
npm run lint
npm run format
npm run format:check
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
```

Start with [docs/setup.md](docs/setup.md). System boundaries are documented in [docs/architecture.md](docs/architecture.md), the private assistant is documented in [docs/portfolio-copilot.md](docs/portfolio-copilot.md), and the deployment checklist is in [docs/deployment.md](docs/deployment.md).

Public routes are `/` and `/projects`. The résumé is an attachment at `/resume`; there are no project detail, résumé viewer, Studio, or public mutation routes.
