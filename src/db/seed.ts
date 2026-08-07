import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { nowSection, siteSettings } from "@/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to seed the database.");

const db = drizzle(neon(url));

await db.batch([
  db
    .insert(siteSettings)
    .values({
      id: 1,
      email: "hello@example.com",
      contactLinks: {},
      seoTitle: "Aliameen Kareem — Full-Stack Engineer",
      seoDescription:
        "Selected projects, recognition, and the technologies behind Aliameen Kareem's work.",
    })
    .onConflictDoNothing({ target: siteSettings.id }),
  db
    .insert(nowSection)
    .values({
      id: 1,
      description: "Add a current focus update from the admin.",
      published: false,
      showLastUpdated: true,
    })
    .onConflictDoNothing({ target: nowSection.id }),
]);

console.info("Seeded the site settings and Now section singletons.");
