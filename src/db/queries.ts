import "server-only";

import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  nowLinks,
  nowSection,
  postCategories,
  postLinks,
  posts,
  projects,
  recognitions,
  siteSettings,
  statsSnapshot,
  techStackItems,
  type SiteSettings,
  type TechStackItem,
} from "@/db/schema";
import { defaultAvailability } from "@/config/availability";
import { toPublicNow } from "@/lib/now";
import { logServer } from "@/lib/logger";
import { MAX_HOMEPAGE_PROJECTS, MAX_PINNED_POSTS } from "@/lib/ordering";

const defaultSiteSettings: SiteSettings = {
  id: 1,
  email: "hello@example.com",
  contactLinks: {},
  profileImageKey: null,
  resumeKey: null,
  resumeFilename: null,
  publicBippyEnabled: true,
  hackathonWins: 0,
  availability: defaultAvailability,
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
      techStack: [] as TechStackItem[],
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
    techStackRows,
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
      // The page splits this list into cards and rows by position, so it has
      // to arrive whole rather than clipped to the card tier.
      .limit(MAX_HOMEPAGE_PROJECTS),
    db
      .select()
      .from(recognitions)
      .where(eq(recognitions.published, true))
      .orderBy(asc(recognitions.displayOrder), desc(recognitions.createdAt)),
    db
      .select()
      .from(techStackItems)
      .where(eq(techStackItems.visible, true))
      .orderBy(asc(techStackItems.displayOrder), asc(techStackItems.createdAt)),
    // Every project row counts, not just the twelve the homepage shows.
    db
      .select({ value: count() })
      .from(projects)
      .where(eq(projects.published, true)),
    // Tolerated rather than awaited plainly: if the build ships before the
    // migration runs, this table does not exist yet, and a rejected query in
    // this Promise.all would take the entire homepage down with it. The strip
    // is decoration; the page is not.
    db
      .select()
      .from(statsSnapshot)
      .where(eq(statsSnapshot.id, 1))
      .limit(1)
      .catch((error) => {
        logServer("error", "query.stats_snapshot_failed", {
          error: String(error),
        });
        return [];
      }),
  ]);

  return {
    settings: settingsRows[0] ?? defaultSiteSettings,
    now: toPublicNow(nowSectionRows[0], nowLinkRows),
    projects: projectRows,
    recognitions: recognitionRows,
    techStack: techStackRows,
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

export async function getAdminTechStack() {
  return getDb()
    .select()
    .from(techStackItems)
    .orderBy(asc(techStackItems.displayOrder), asc(techStackItems.createdAt));
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
  const [project, nowLink, publishedNow, settings, post] = await Promise.all([
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
    // A post image is referenced from inside the body rather than by a column
    // of its own, so the body is what has to be searched. The key is a 48-char
    // hex name from createObjectKey, not anything a reader supplies, and it is
    // shape-checked by isPublicMediaKey before this runs — but it still goes
    // in as a bound parameter rather than interpolated text.
    db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.published, true),
          sql`position(${key} in ${posts.bodyMarkdown}) > 0`,
        ),
      )
      .limit(1),
  ]);
  return Boolean(
    project[0] || (nowLink[0] && publishedNow[0]) || settings[0] || post[0],
  );
}

// --- Writing -------------------------------------------------------------

// Pinned rather than newest: an older post stays reachable from the homepage
// after a run of new ones.
export async function getPinnedPosts() {
  if (!canQueryDatabase()) return [];
  return getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.published, true), eq(posts.pinned, true)))
    .orderBy(asc(posts.pinnedOrder), desc(posts.publishedAt))
    .limit(MAX_PINNED_POSTS);
}

export type PublishedPostSummary = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date;
  categoryId: string | null;
};

// The index page needs headlines, not bodies. Selecting the columns keeps a
// page of twenty posts from carrying twenty rendered articles with it.
export async function getPublishedPostSummaries(): Promise<
  PublishedPostSummary[]
> {
  if (!canQueryDatabase()) return [];
  return getDb()
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

export async function getPostCategories() {
  if (!canQueryDatabase()) return [];
  return getDb()
    .select()
    .from(postCategories)
    .orderBy(asc(postCategories.displayOrder), asc(postCategories.name));
}

export async function getPublishedPost(slug: string) {
  if (!canQueryDatabase()) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.published, true)))
    .limit(1);
  const post = rows[0];
  if (!post) return null;

  const [links, category] = await Promise.all([
    db
      .select()
      .from(postLinks)
      .where(eq(postLinks.postId, post.id))
      .orderBy(asc(postLinks.displayOrder), asc(postLinks.createdAt)),
    post.categoryId
      ? db
          .select()
          .from(postCategories)
          .where(eq(postCategories.id, post.categoryId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return { post, links, category: category[0] ?? null };
}

export async function getAdminPosts() {
  return getDb().select().from(posts).orderBy(desc(posts.updatedAt));
}

export async function getAdminPost(id: string) {
  const db = getDb();
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const post = rows[0];
  if (!post) return null;
  const links = await db
    .select()
    .from(postLinks)
    .where(eq(postLinks.postId, post.id))
    .orderBy(asc(postLinks.displayOrder), asc(postLinks.createdAt));
  return { post, links };
}

export async function getTakenSlugs(excludeId?: string) {
  const rows = await getDb()
    .select({ slug: posts.slug, id: posts.id })
    .from(posts);
  return rows.filter((row) => row.id !== excludeId).map((row) => row.slug);
}
