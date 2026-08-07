import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { siteSettings } from "@/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to seed the database.");

const db = drizzle(neon(url));

await db
  .insert(siteSettings)
  .values({
    id: 1,
    email: "hello@example.com",
    contactLinks: {},
    seoTitle: "Aliameen Kareem — Full-Stack Engineer",
    seoDescription:
      "Selected projects, recognition, and the technologies behind Aliameen Kareem's work.",
  })
  .onConflictDoNothing({ target: siteSettings.id });

console.info("Seeded the site settings singleton.");
