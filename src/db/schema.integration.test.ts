import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";
import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { recognitionIconNames } from "@/config/recognition-icons";
import { MAX_NOW_LINKS } from "@/lib/ordering";
import * as schema from "@/db/schema";
import { nowLinks, nowSection, recognitions, siteSettings } from "@/db/schema";

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

  it("stores the public Bippy visibility in site settings", () => {
    expect(siteSettings).toHaveProperty("publicBippyEnabled");
  });

  it("keeps recognitions concise and icon-led", () => {
    expect(recognitions).toHaveProperty("iconName");
    expect(recognitions).not.toHaveProperty("issuer");
    expect(recognitions).not.toHaveProperty("description");
    expect(recognitions).not.toHaveProperty("recognizedOn");
    expect(recognitions).not.toHaveProperty("iconKey");
    expect(recognitions).not.toHaveProperty("iconAlt");
  });

  it("keeps the schema and migration icon constraints aligned with the registry", () => {
    const extractConstraintIcons = (source: string) => {
      const constraint = source.match(
        /recognitions_icon_name_valid[\s\S]*?in \(([^)]+)\)/,
      );
      expect(constraint).not.toBeNull();
      return Array.from(
        constraint![1].matchAll(/'([^']+)'/g),
        ([, name]) => name,
      );
    };
    const schemaSource = readFileSync(
      new URL("./schema.ts", import.meta.url),
      "utf8",
    );
    // The newest migration that touches the constraint is the one the database
    // actually ends up with. Naming a specific file here would pass forever
    // while a later migration quietly narrowed it back.
    const migrationsDir = new URL("../../drizzle/", import.meta.url);
    const latestConstraintMigration = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .reverse()
      .map((file) => readFileSync(new URL(file, migrationsDir), "utf8"))
      .find((source) => source.includes("recognitions_icon_name_valid"));

    expect(latestConstraintMigration).toBeDefined();
    const migrationSource = latestConstraintMigration!;

    expect(extractConstraintIcons(schemaSource)).toEqual(recognitionIconNames);
    expect(extractConstraintIcons(migrationSource)).toEqual(
      recognitionIconNames,
    );
  });
});

describe.skipIf(!testUrl)("Drizzle migration integration", () => {
  it("has the application tables and homepage limit trigger", async () => {
    const sql = neon(testUrl!);
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
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
    const nowTriggers = await sql`
      select tgname
      from pg_trigger
      where tgrelid = 'now_links'::regclass
        and tgname = 'now_links_limit'
        and not tgisinternal
    `;
    expect(nowTriggers).toHaveLength(1);
  });

  it("serializes concurrent Now-link inserts at the four-row limit", async () => {
    const sql = neon(testUrl!);
    await sql`delete from now_links`;
    await sql`
      insert into now_links (label, url, display_order, visible)
      select
        'Limit test ' || value,
        'https://example.com/' || value,
        value,
        true
      from generate_series(1, 3) as value
    `;

    const attempts = await Promise.allSettled([
      sql`insert into now_links (label, url) values ('Concurrent A', 'https://example.com/a')`,
      sql`insert into now_links (label, url) values ('Concurrent B', 'https://example.com/b')`,
    ]);
    const rows = await sql`select count(*)::int as count from now_links`;

    expect(
      attempts.filter((attempt) => attempt.status === "fulfilled"),
    ).toHaveLength(1);
    expect(rows[0].count).toBe(MAX_NOW_LINKS);
    await sql`delete from now_links`;
  });
});
