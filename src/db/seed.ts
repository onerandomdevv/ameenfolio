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
    name: "Ameen",
    role: "Product Engineer",
    introduction:
      "I design and build focused digital products, turning thoughtful ideas into reliable software people enjoy using.",
    email: "hello@example.com",
    socialLinks: [],
    seoTitle: "Ameen — Product Engineer",
    seoDescription:
      "Selected projects, recognition, and the technologies behind Ameen's work.",
  })
  .onConflictDoNothing({ target: siteSettings.id });

console.info("Seeded the site settings singleton.");
