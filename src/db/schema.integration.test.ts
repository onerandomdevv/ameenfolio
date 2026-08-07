import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

const testUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!testUrl)("Drizzle migration integration", () => {
  it("has the application tables and homepage limit trigger", async () => {
    const sql = neon(testUrl!);
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('projects', 'recognitions', 'technologies', 'site_settings')
      order by table_name
    `;
    expect(tables.map((row) => row.table_name)).toEqual([
      "projects",
      "recognitions",
      "site_settings",
      "technologies",
    ]);
    const triggers = await sql`
      select trigger_name from information_schema.triggers
      where event_object_table = 'projects'
        and trigger_name = 'projects_homepage_limit'
    `;
    expect(triggers).toHaveLength(1);
  });
});
