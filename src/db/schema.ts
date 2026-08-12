import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Availability } from "@/config/availability";
import type { PostLinkIconName } from "@/config/post-link-icons";
import type { ProjectIconName } from "@/config/project-icons";
import type { RecognitionIconName } from "@/config/recognition-icons";
import type { TechStackGroupValue } from "@/config/tech-stack";

export type ContactLinks = {
  github?: string;
  x?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    shortDescription: text("short_description").notNull(),
    contribution: text("contribution"),
    statusLabel: text("status_label"),
    // One destination per project: clicking the card follows this. The
    // physical column keeps its old name so the rename costs no migration,
    // the same trade already made for contactLinks/social_links below.
    url: text("live_url").notNull(),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    iconName: text("icon_name")
      .$type<ProjectIconName>()
      .notNull()
      .default("custom"),
    // Pinning is the only placement control. A timestamp rather than a
    // boolean plus an integer: what the homepage needs is an order, and the
    // moment something was pinned already is one. Null means not pinned.
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("projects_published_idx").on(table.published),
    index("projects_pinned_idx").on(table.published, table.pinnedAt),
    check(
      "projects_icon_name_valid",
      sql`${table.iconName} in ('custom', 'github', 'web')`,
    ),
    check(
      "projects_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
  ],
);

export const recognitions = pgTable(
  "recognitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    iconName: text("icon_name")
      .$type<RecognitionIconName>()
      .notNull()
      .default("trophy"),
    verificationUrl: text("verification_url"),
    // Same as projects: pinned ones show on the homepage, newest pin first,
    // capped at twelve by the recognitions_pinned_limit trigger. The full list
    // lives on the writing page.
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("recognitions_public_idx").on(table.published, table.pinnedAt),
    check(
      "recognitions_icon_name_valid",
      sql`${table.iconName} in ('trophy', 'award', 'medal', 'star', 'badge-check', 'crown', 'sparkles', 'github', 'x', 'instagram', 'tiktok', 'linkedin', 'whatsapp', 'youtube', 'globe')`,
    ),
  ],
);

export const techStackItems = pgTable(
  "tech_stack_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    groupKey: text("group_key").$type<TechStackGroupValue>().notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("tech_stack_public_idx").on(
      table.visible,
      table.groupKey,
      table.displayOrder,
    ),
    check(
      "tech_stack_group_key_valid",
      sql`${table.groupKey} in ('core', 'tools')`,
    ),
  ],
);

export const nowSection = pgTable(
  "now_section",
  {
    id: integer("id").primaryKey().default(1),
    description: text("description").notNull(),
    published: boolean("published").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("now_section_singleton", sql`${table.id} = 1`)],
);

export const nowLinks = pgTable(
  "now_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    // The brand mark shown when no image is uploaded. 'web' is the globe.
    iconName: text("icon_name").notNull().default("web"),
    displayOrder: integer("display_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("now_links_visible_order_idx").on(table.visible, table.displayOrder),
    check(
      "now_links_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
    check(
      "now_links_icon_name_known",
      sql`${table.iconName} in ('web', 'github', 'x', 'instagram', 'youtube')`,
    ),
  ],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer("id").primaryKey().default(1),
    email: text("email").notNull(),
    // Keep the legacy physical column name so existing deployments retain data.
    contactLinks: jsonb("social_links")
      .$type<ContactLinks>()
      .notNull()
      .default({}),
    // NULL means never edited, so the copy in src/config/portfolio.ts keeps
    // supplying it and the wording lives in one place until then.
    displayName: text("display_name"),
    role: text("role"),
    introduction: text("introduction"),
    profileImageKey: text("profile_image_key"),
    resumeKey: text("resume_key"),
    resumeFilename: text("resume_filename"),
    publicBippyEnabled: boolean("public_bippy_enabled").notNull().default(true),
    hackathonWins: integer("hackathon_wins").notNull().default(0),
    availability: text("availability")
      .$type<Availability>()
      .notNull()
      .default("open"),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("site_settings_singleton", sql`${table.id} = 1`),
    check(
      "site_settings_availability_valid",
      sql`${table.availability} in ('open', 'booked')`,
    ),
  ],
);

// A single cached row rather than a live fetch on render. The public pages are
// force-dynamic, so calling GitHub per request would put the homepage's speed
// at the mercy of api.github.com and burn the hourly rate limit under any real
// traffic. Readers serve whatever is here and refresh it out of band.
export const statsSnapshot = pgTable(
  "stats_snapshot",
  {
    id: integer("id").primaryKey().default(1),
    contributions: integer("contributions").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    currentStreakStart: timestamp("current_streak_start", {
      withTimezone: true,
    }),
    currentStreakEnd: timestamp("current_streak_end", { withTimezone: true }),
    longestStreak: integer("longest_streak").notNull().default(0),
    longestStreakStart: timestamp("longest_streak_start", {
      withTimezone: true,
    }),
    longestStreakEnd: timestamp("longest_streak_end", { withTimezone: true }),
    firstContributionAt: timestamp("first_contribution_at", {
      withTimezone: true,
    }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("stats_snapshot_singleton", sql`${table.id} = 1`)],
);

// A heading lifted out of the rendered body so the post page can build its
// contents list without re-parsing the markup on every request.
export type PostHeading = {
  id: string;
  text: string;
  level: number;
};

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    // Both forms are stored: the markdown is what the owner edits, the HTML is
    // what the page serves. Public pages are force-dynamic, so rendering on
    // read would re-parse the same post on every visit for a result that only
    // changes when it is saved.
    bodyMarkdown: text("body_markdown").notNull(),
    bodyHtml: text("body_html").notNull(),
    headings: jsonb("headings").$type<PostHeading[]>().notNull().default([]),
    // Separate from createdAt because the date on the post is editorial — a
    // piece written over a week is dated when it went out, not when the row
    // first appeared.
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    published: boolean("published").notNull().default(false),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("posts_slug_idx").on(table.slug),
    index("posts_published_idx").on(table.published, table.publishedAt),
    index("posts_pinned_idx").on(table.published, table.pinnedAt),
    check(
      "posts_slug_shape",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
  ],
);

// Where a post points when it is finished — the repository, the video, the
// thread. Cascades, because a link has no meaning without the post it closes.
export const postLinks = pgTable(
  "post_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    iconName: text("icon_name")
      .$type<PostLinkIconName>()
      .notNull()
      .default("link"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("post_links_post_order_idx").on(table.postId, table.displayOrder),
  ],
);

export type Project = typeof projects.$inferSelect;
export type Recognition = typeof recognitions.$inferSelect;
export type NowSection = typeof nowSection.$inferSelect;
export type NowLink = typeof nowLinks.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type StatsSnapshot = typeof statsSnapshot.$inferSelect;
export type TechStackItem = typeof techStackItems.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostLink = typeof postLinks.$inferSelect;
