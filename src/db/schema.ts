import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { RecognitionIconName } from "@/config/recognition-icons";

export type ContactLinks = {
  github?: string;
  x?: string;
  instagram?: string;
  tiktok?: string;
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
    iconName: text("icon_name")
      .$type<RecognitionIconName>()
      .notNull()
      .default("trophy"),
    verificationUrl: text("verification_url"),
    displayOrder: integer("display_order").notNull().default(0),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("recognitions_public_idx").on(table.published, table.displayOrder),
    check(
      "recognitions_icon_name_valid",
      sql`${table.iconName} in ('trophy', 'award', 'medal', 'star', 'badge-check', 'crown', 'sparkles')`,
    ),
  ],
);

export const nowSection = pgTable(
  "now_section",
  {
    id: integer("id").primaryKey().default(1),
    description: text("description").notNull(),
    published: boolean("published").notNull().default(false),
    showLastUpdated: boolean("show_last_updated").notNull().default(true),
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
    profileImageKey: text("profile_image_key"),
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
export type NowSection = typeof nowSection.$inferSelect;
export type NowLink = typeof nowLinks.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
