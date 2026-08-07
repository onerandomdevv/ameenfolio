import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/db/client";
import {
  projects,
  recognitions,
  siteSettings,
  technologies,
  type SiteSettings,
} from "@/db/schema";

export const defaultSiteSettings: SiteSettings = {
  id: 1,
  name: "Ameen",
  role: "Product Engineer",
  introduction:
    "I design and build focused digital products, turning thoughtful ideas into reliable software people enjoy using.",
  email: "hello@example.com",
  socialLinks: [],
  resumeKey: null,
  resumeFilename: null,
  seoTitle: "Ameen — Product Engineer",
  seoDescription:
    "Selected projects, recognition, and the technologies behind Ameen's work.",
  updatedAt: new Date(0),
};

function canQueryDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

const cachedPublicPortfolio = unstable_cache(
  async () => {
    if (!canQueryDatabase()) {
      return {
        settings: defaultSiteSettings,
        projects: [],
        recognitions: [],
        technologies: [],
      };
    }
    const db = getDb();
    const [settingsRows, projectRows, recognitionRows, technologyRows] =
      await Promise.all([
        db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1),
        db
          .select()
          .from(projects)
          .where(
            and(eq(projects.published, true), eq(projects.showOnHomepage, true)),
          )
          .orderBy(asc(projects.homepageOrder), desc(projects.createdAt))
          .limit(8),
        db
          .select()
          .from(recognitions)
          .where(eq(recognitions.published, true))
          .orderBy(asc(recognitions.displayOrder), desc(recognitions.createdAt)),
        db
          .select()
          .from(technologies)
          .where(eq(technologies.visible, true))
          .orderBy(asc(technologies.category), asc(technologies.displayOrder)),
      ]);
    return {
      settings: settingsRows[0] ?? defaultSiteSettings,
      projects: projectRows,
      recognitions: recognitionRows,
      technologies: technologyRows,
    };
  },
  ["public-portfolio"],
  { tags: ["portfolio"] },
);

export async function getPublicPortfolio() {
  return cachedPublicPortfolio();
}

export const getAllPublishedProjects = unstable_cache(
  async () => {
    if (!canQueryDatabase()) return [];
    return getDb()
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.homepageOrder), desc(projects.createdAt));
  },
  ["published-projects"],
  { tags: ["portfolio", "projects"] },
);

export async function getAdminProjects() {
  return getDb().select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function getAdminProject(id: string) {
  const rows = await getDb().select().from(projects).where(eq(projects.id, id));
  return rows[0] ?? null;
}

export async function getAdminRecognitions() {
  return getDb()
    .select()
    .from(recognitions)
    .orderBy(asc(recognitions.displayOrder), desc(recognitions.updatedAt));
}

export async function getAdminTechnologies() {
  return getDb()
    .select()
    .from(technologies)
    .orderBy(asc(technologies.category), asc(technologies.displayOrder));
}

export async function getAdminSettings() {
  const rows = await getDb()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1));
  return rows[0] ?? defaultSiteSettings;
}

export async function isReferencedPublicIcon(key: string) {
  if (!canQueryDatabase()) return false;
  const db = getDb();
  const [project, recognition, technology] = await Promise.all([
    db.select({ id: projects.id }).from(projects).where(and(eq(projects.iconKey, key), eq(projects.published, true))).limit(1),
    db.select({ id: recognitions.id }).from(recognitions).where(and(eq(recognitions.iconKey, key), eq(recognitions.published, true))).limit(1),
    db.select({ id: technologies.id }).from(technologies).where(and(eq(technologies.iconKey, key), eq(technologies.visible, true))).limit(1),
  ]);
  return Boolean(project[0] || recognition[0] || technology[0]);
}
