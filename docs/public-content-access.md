# Public content access

This document describes how the public portfolio is exposed to browsers,
search crawlers, retrieval agents, and plain HTTP clients without changing the
security boundary around the admin application, MCP, drafts, or private media.

## Delivery audit

The production audit on 22 August 2026 found:

| Layer                  | Result                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DNS                    | `onerandomdev.cv` resolves to Vercel (`216.198.79.1`); `www` uses a Vercel DNS target. Cloudflare is authoritative DNS but is not proxying the request path.                                                                                                                                                 |
| TLS                    | The production certificate validates successfully for HTTPS clients.                                                                                                                                                                                                                                         |
| Redirects              | HTTP redirects once to HTTPS. `www` redirects once to the canonical apex domain. No redirect loop was found.                                                                                                                                                                                                 |
| Origin/CDN             | Responses are served by Vercel. There is no Cloudflare challenge page in front of the current origin.                                                                                                                                                                                                        |
| Middleware             | Public portfolio, writing, discovery, and media routes are not sent through admin authentication. Admin-host discovery routes are blocked separately.                                                                                                                                                        |
| Bot handling           | Mozilla, curl, Googlebot, OAI-SearchBot, Claude-SearchBot, and Claude-User requests all received HTTP 200 from a published article. A twelve-request burst was not rate limited.                                                                                                                             |
| Rendering              | The complete published title and article body are present in the initial HTML response. JavaScript is not required to read an article.                                                                                                                                                                       |
| External fetch symptom | One external OpenAI fetch environment rejected the domain as unsafe before making an HTTP request, while direct HTTP requests reached the origin successfully. This points to an external safety/reputation/index-discovery decision rather than DNS, TLS, robots, WAF, authentication, or server rendering. |

The application changes in this work improve machine discovery and provide
stable non-HTML representations. They cannot force a third-party fetch host to
allowlist a domain immediately; its safety/index reputation may update only
after the new discovery surfaces are recrawled.

## Public interfaces

- `/writing/[slug]` — canonical, server-rendered article HTML.
- `/writing/[slug].md` — clean Markdown with `text/markdown` content type.
- `/api/public/writing` — published article summaries only.
- `/api/public/writing/[slug]` — one complete published article as JSON.
- `/sitemap.xml` — canonical portfolio pages and published HTML articles only.
- `/llms.txt` — a compact portfolio summary and links to public pages and
  Markdown articles.
- `/robots.txt` — retrieval/search and training policies kept separate.

The internal route used to produce Markdown is deliberately not advertised.
The clean `.md` URL is the public contract.

## Crawler policy

Retrieval and search agents (`OAI-SearchBot`, `ChatGPT-User`,
`Claude-SearchBot`, and `Claude-User`) may read public pages and the read-only
public API. `GPTBot` and `ClaudeBot` are separately disallowed, so granting
search/retrieval access does not automatically grant model-training access.
Other crawlers may read public content but not admin, private API, or MCP
metadata paths.

If Cloudflare proxying or Vercel bot protection is enabled later, public
`GET`/`HEAD` requests to the interfaces above should bypass interactive
CAPTCHA/JavaScript challenges. Do not create a broad WAF bypass for `/api`,
`/admin`, `/mcp`, or media. Keep rate limits high enough for normal crawling
but retain abuse controls.

## Privacy boundary

Every writing discovery query filters `published = true` in PostgreSQL. The
public serializers use an explicit allowlist and omit internal database IDs,
publication controls, storage keys, admin data, MCP proposals, audit events,
and credentials. Unknown, draft, or unpublished slugs return 404 from HTML,
Markdown, and JSON routes.

The sitemap and `llms.txt` are generated from the same published-only query.
The sitemap deliberately excludes Markdown duplicates, APIs, media routes,
admin pages, MCP routes, and drafts. Private R2 objects remain protected by the
existing database-reference check: only media attached to published records is
publicly readable.

The admin hostname returns `Disallow: /` from its own `robots.txt`; its
`sitemap.xml` and `llms.txt` return 404. All `/admin` routes also emit no-index
metadata.

## Verification commands

Run these after deployment:

```bash
curl -I https://onerandomdev.cv/writing/building-bippy
curl -L -A "OAI-SearchBot/1.0" https://onerandomdev.cv/writing/building-bippy
curl -L -A "Claude-SearchBot/1.0" https://onerandomdev.cv/writing/building-bippy
curl -L -A "Claude-User/1.0" https://onerandomdev.cv/writing/building-bippy

curl -i https://onerandomdev.cv/writing/building-bippy.md
curl -sS https://onerandomdev.cv/api/public/writing
curl -sS https://onerandomdev.cv/api/public/writing/building-bippy
curl -sS https://onerandomdev.cv/robots.txt
curl -sS https://onerandomdev.cv/sitemap.xml
curl -sS https://onerandomdev.cv/llms.txt

curl -i https://onerandomdev.cv/writing/not-a-public-article.md
curl -i https://onerandomdev.cv/api/public/writing/not-a-public-article
curl -sS https://admin.onerandomdev.cv/robots.txt
curl -i https://admin.onerandomdev.cv/sitemap.xml
```

For an HTML-body check that does not execute JavaScript:

```bash
curl -sS -A "Claude-User/1.0" \
  https://onerandomdev.cv/writing/building-bippy \
  | grep -F "Managing a portfolio"
```
