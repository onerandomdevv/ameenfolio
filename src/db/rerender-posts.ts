import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { renderMarkdown } from "@/lib/writing/markdown";

// Posts store their rendered HTML, which is what makes the public pages cheap.
// The cost is that a change to the markdown pipeline does not reach anything
// already written: new plugins, new sanitising rules and new prose classes all
// apply from the next save onwards. Run this after changing lib/writing to
// bring existing posts up to the current pipeline.
//
//   npm run posts:rerender
//
// Reads the markdown, which is the source of truth, and rewrites the HTML and
// the headings beside it. Safe to run repeatedly.
async function main() {
  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");

  const sql = neon(url);
  const rows = (await sql`
    SELECT id, title, body_markdown FROM posts ORDER BY created_at
  `) as { id: string; title: string; body_markdown: string }[];

  for (const row of rows) {
    const { html, headings } = await renderMarkdown(row.body_markdown);
    await sql`
      UPDATE posts
      SET body_html = ${html}, headings = ${JSON.stringify(headings)}::jsonb
      WHERE id = ${row.id}
    `;
    console.log(`re-rendered  ${row.title}`);
  }

  console.log(`\n${rows.length} post(s) brought up to date.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
