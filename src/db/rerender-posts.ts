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

  let skipped = 0;
  for (const row of rows) {
    const { html, headings } = await renderMarkdown(row.body_markdown);
    // Matched on the markdown this HTML was generated from, not on the id
    // alone. If the post was saved while the script was running, the row no
    // longer matches and is left alone rather than having output from the
    // older markdown written over the newer save.
    const updated = await sql`
      UPDATE posts
      SET body_html = ${html}, headings = ${JSON.stringify(headings)}::jsonb
      WHERE id = ${row.id} AND body_markdown = ${row.body_markdown}
      RETURNING id
    `;
    if (updated.length) {
      console.log(`re-rendered  ${row.title}`);
    } else {
      skipped += 1;
      console.log(`skipped      ${row.title} (saved while this was running)`);
    }
  }

  console.log(`\n${rows.length - skipped} post(s) brought up to date.`);
  if (skipped) {
    console.log(`${skipped} skipped — run again to pick them up.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
