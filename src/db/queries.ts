import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  nowLinks,
  nowSection,
  projects,
  recognitions,
  siteSettings,
  statsSnapshot,
  type SiteSettings,
} from "@/db/schema";
import { toPublicNow } from "@/lib/now";
import { logServer } from "@/lib/logger";

const defaultSiteSettings: SiteSettings = {
  id: 1,
  email: "hello@example.com",
  contactLinks: {},
  profileImageKey: null,
  resumeKey: null,
  resumeFilename: null,
  publicBippyEnabled: true,
  hackathonWins: 0,
  seoTitle: "Aliameen Kareem — Full-Stack Engineer",
  seoDescription:
    "Selected projects, recognition, and the technologies behind Aliameen Kareem's work.",
  updatedAt: new Date(0),
};

export const defaultNowSection = {
  id: 1,
  description: "",
  published: false,
  showLastUpdated: true,
  updatedAt: new Date(0),
} satisfies typeof nowSection.$inferSelect;

function canQueryDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

// Uncached, for the same reason as getAllPublishedProjects below. The version
// suffix this key carried ("public-portfolio-v8") is the tell: bumping it is
// how the cache was being busted, because tag invalidation was not reaching it.
// The homepage is force-dynamic, so the wrapper only ever risked serving
// content the owner had just changed.
export async function getPublicPortfolio() {
  if (!canQueryDatabase()) {
    return {
      settings: defaultSiteSettings,
      now: null,
      projects: [],
      recognitions: [],
      publishedProjectCount: 0,
      statsSnapshot: null,
    };
  }

  const db = getDb();
  const [
    settingsRows,
    nowSectionRows,
    nowLinkRows,
    projectRows,
    recognitionRows,
    publishedProjectRows,
    snapshotRows,
  ] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1),
    db.select().from(nowSection).where(eq(nowSection.id, 1)).limit(1),
    db
      .select()
      .from(nowLinks)
      .where(eq(nowLinks.visible, true))
      .orderBy(asc(nowLinks.displayOrder), asc(nowLinks.createdAt)),
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
    // Every project row counts, not just the eight the homepage shows.
    db
      .select({ value: count() })
      .from(projects)
      .where(eq(projects.published, true)),
    db.select().from(statsSnapshot).where(eq(statsSnapshot.id, 1)).limit(1),
  ]);

  return {
    settings: settingsRows[0] ?? defaultSiteSettings,
    now: toPublicNow(nowSectionRows[0], nowLinkRows),
    projects: projectRows,
    recognitions: recognitionRows,
    publishedProjectCount: publishedProjectRows[0]?.value ?? 0,
    statsSnapshot: snapshotRows[0] ?? null,
  };
}

// Deliberately uncached. /projects is force-dynamic, so the unstable_cache
// wrapper this used to have bought nothing, and its entry outlived tag
// invalidation — a published project kept rendering as an empty list while the
// same query returned the row.
export async function getAllPublishedProjects() {
  if (!canQueryDatabase()) return [];
  return getDb()
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(asc(projects.homepageOrder), desc(projects.createdAt));
}

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

export async function getAdminNow() {
  const [sectionRows, links] = await Promise.all([
    getDb().select().from(nowSection).where(eq(nowSection.id, 1)).limit(1),
    getDb()
      .select()
      .from(nowLinks)
      .orderBy(asc(nowLinks.displayOrder), asc(nowLinks.createdAt)),
  ]);
  return { section: sectionRows[0] ?? defaultNowSection, links };
}

export async function getAdminSettings() {
  const rows = await getDb()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1));
  return rows[0] ?? defaultSiteSettings;
}

export async function getPublicBippyEnabled() {
  if (!canQueryDatabase()) return true;

  try {
    const rows = await getDb()
      .select({ enabled: siteSettings.publicBippyEnabled })
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1);
    return rows[0]?.enabled ?? true;
  } catch (error) {
    logServer("error", "query.bippy_visibility_failed", {
      error: String(error),
    });
    return true;
  }
}

export async function isReferencedPublicMedia(key: string) {
  if (!canQueryDatabase()) return false;
  const db = getDb();
  const [project, nowLink, publishedNow, settings] = await Promise.all([
    db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.iconKey, key), eq(projects.published, true)))
      .limit(1),
    db
      .select({ id: nowLinks.id })
      .from(nowLinks)
      .where(and(eq(nowLinks.iconKey, key), eq(nowLinks.visible, true)))
      .limit(1),
    db
      .select({ id: nowSection.id })
      .from(nowSection)
      .where(and(eq(nowSection.id, 1), eq(nowSection.published, true)))
      .limit(1),
    db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .where(eq(siteSettings.profileImageKey, key))
      .limit(1),
  ]);
  return Boolean(project[0] || (nowLink[0] && publishedNow[0]) || settings[0]);
}
