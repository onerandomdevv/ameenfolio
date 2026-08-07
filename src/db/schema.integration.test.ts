import { neon } from "@neondatabase/serverless";
import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { nowLinks, nowSection, recognitions } from "@/db/schema";

const testUrl = process.env.TEST_DATABASE_URL;

describe("Now section schema", () => {
  it("defines dedicated section and link tables", () => {
    expect(getTableName(nowSection)).toBe("now_section");
    expect(getTableName(nowLinks)).toBe("now_links");
  });
});

describe("active application schema", () => {
  it("does not define a technologies table", () => {
    expect(schema).not.toHaveProperty("technologies");
  });

  it("keeps recognitions concise and icon-led", () => {
    expect(recognitions).toHaveProperty("iconName");
    expect(recognitions).not.toHaveProperty("issuer");
    expect(recognitions).not.toHaveProperty("description");
    expect(recognitions).not.toHaveProperty("recognizedOn");
    expect(recognitions).not.toHaveProperty("iconKey");
    expect(recognitions).not.toHaveProperty("iconAlt");
  });
});

describe.skipIf(!testUrl)("Drizzle migration integration", () => {
  it("has the application tables and homepage limit trigger", async () => {
    const sql = neon(testUrl!);
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('now_links', 'now_section', 'projects', 'recognitions', 'site_settings')
      order by table_name
    `;
    expect(tables.map((row) => row.table_name)).toEqual([
      "now_links",
      "now_section",
      "projects",
      "recognitions",
      "site_settings",
    ]);
    const triggers = await sql`
      select tgname
      from pg_trigger
      where tgrelid = 'projects'::regclass
        and tgname = 'projects_homepage_limit'
        and not tgisinternal
    `;
    expect(triggers).toHaveLength(1);
  });
});
