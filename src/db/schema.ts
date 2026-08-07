import {
  boolean,
  check,
  date,
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

export type SocialLink = { label: string; url: string };

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
    liveUrl: text("live_url").notNull(),
    githubUrl: text("github_url"),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    showOnHomepage: boolean("show_on_homepage").notNull().default(false),
    homepageOrder: integer("homepage_order").notNull().default(0),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("projects_published_idx").on(table.published),
    index("projects_homepage_idx").on(
      table.published,
      table.showOnHomepage,
      table.homepageOrder,
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
    issuer: text("issuer").notNull(),
    description: text("description").notNull(),
    recognizedOn: date("recognized_on"),
    verificationUrl: text("verification_url"),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    displayOrder: integer("display_order").notNull().default(0),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("recognitions_public_idx").on(table.published, table.displayOrder),
    check(
      "recognitions_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
  ],
);

export const technologies = pgTable(
  "technologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    websiteUrl: text("website_url"),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    displayOrder: integer("display_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("technologies_name_unique").on(sql`lower(${table.name})`),
    index("technologies_visible_order_idx").on(
      table.visible,
      table.category,
      table.displayOrder,
    ),
    check(
      "technologies_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
  ],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer("id").primaryKey().default(1),
    name: text("name").notNull(),
    role: text("role").notNull(),
    introduction: text("introduction").notNull(),
    email: text("email").notNull(),
    socialLinks: jsonb("social_links")
      .$type<SocialLink[]>()
      .notNull()
      .default([]),
    resumeKey: text("resume_key"),
    resumeFilename: text("resume_filename"),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("site_settings_singleton", sql`${table.id} = 1`)],
);

export type Project = typeof projects.$inferSelect;
export type Recognition = typeof recognitions.$inferSelect;
export type Technology = typeof technologies.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
