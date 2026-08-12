import { z } from "zod";
import { availabilityValues } from "@/config/availability";
import { nowLinkIconValues } from "@/config/now-link-icons";
import { postLinkIconValues } from "@/config/post-link-icons";
import { projectIconValues } from "@/config/project-icons";
import { recognitionIconNames } from "@/config/recognition-icons";
import { techStackGroupValues } from "@/config/tech-stack";
import { cardWordLimitMessage, withinCardWordLimit } from "@/lib/word-count";

// A prefix check alone accepts the bare string "https://", which passes
// validation, saves, and renders as a link to nowhere. Parsing it means the
// scheme and a real host both have to be there.
const optionalHttpsUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.includes(".");
    } catch {
      return false;
    }
  }, "Enter a full HTTPS URL, for example https://example.com/you.")
  .optional();

const optionalText = (max: number) => z.string().trim().max(max).optional();

const iconObjectKey = z
  .string()
  .regex(/^icons\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
  .optional();

const profileImageObjectKey = z
  .string()
  .regex(/^profiles\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
  .optional();

const iconFields = {
  iconKey: iconObjectKey,
  iconAlt: optionalText(180),
};

export const projectSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    shortDescription: z
      .string()
      .trim()
      .min(10)
      .max(500)
      .refine(withinCardWordLimit, cardWordLimitMessage),
    contribution: optionalText(500),
    statusLabel: optionalText(60),
    url: z.url().startsWith("https://"),
    ...iconFields,
    iconName: z.enum(projectIconValues),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required when an icon is uploaded.",
  });

export const recognitionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .refine(withinCardWordLimit, cardWordLimitMessage),
  iconName: z.enum(recognitionIconNames),
  verificationUrl: optionalHttpsUrl,
});

export const techStackItemSchema = z.object({
  name: z.string().trim().min(1).max(40),
  groupKey: z.enum(techStackGroupValues),
  displayOrder: z.number().int().min(0).max(999),
  visible: z.boolean(),
});

export const postLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.url().startsWith("https://"),
  iconName: z.enum(postLinkIconValues),
  displayOrder: z.number().int().min(0).max(999),
});

// The slug is the post's address. Shape-checked here as well as by the column
// constraint, so a bad one is a field error on the form rather than a database
// exception surfacing as a failed save.
const postSlug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Lowercase letters, numbers and single hyphens only.",
  );

export const postSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: postSlug,
  bodyMarkdown: z.string().trim().min(1, "The post needs a body."),
  // A real Date, not a coerced one: coercion widens the input side to unknown
  // and the form resolver can no longer line up with it.
  publishedAt: z.date(),
  links: z.array(postLinkSchema).max(6),
});

// Dragging sends the whole list back, so the order is validated as a list.
export const techStackOrderSchema = z.array(
  z.object({
    id: z.uuid(),
    groupKey: z.enum(techStackGroupValues),
    displayOrder: z.number().int().min(0).max(999),
  }),
);

export const nowSectionSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(600),
  published: z.boolean(),
});

export const nowLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    url: z.url().startsWith("https://"),
    ...iconFields,
    iconName: z.enum(nowLinkIconValues),
    displayOrder: z.number().int().min(0).max(999),
    visible: z.boolean(),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required when an icon is uploaded.",
  });

// Who you are and how to reach you. Split from the SEO pair because they are
// two screens now, and each writes only its own columns — a shared schema would
// make either save wipe the other's fields.
export const profileSchema = z.object({
  email: z.email(),
  contactLinks: z.object({
    github: optionalHttpsUrl,
    x: optionalHttpsUrl,
    instagram: optionalHttpsUrl,
    tiktok: optionalHttpsUrl,
    youtube: optionalHttpsUrl,
    linkedin: optionalHttpsUrl,
    whatsapp: optionalHttpsUrl,
  }),
  profileImageKey: profileImageObjectKey,
  resumeKey: z
    .string()
    .regex(/^resumes\/\d{4}\/[a-f0-9]{48}\.pdf$/)
    .optional(),
  resumeFilename: optionalText(180),
  // Not derivable from anything the site stores, so the owner types it. Capped
  // at two digits because the strip gives the value one short line.
  hackathonWins: z.number().int().min(0).max(99),
  availability: z.enum(availabilityValues),
});

// What search engines and link previews show. All that is left on Settings.
export const seoSchema = z.object({
  seoTitle: z.string().trim().min(10).max(70),
  seoDescription: z.string().trim().min(40).max(170),
});

// Publishing and pinning are their own actions rather than fields on a form:
// the button decides, and a live item comes down by being deleted.
export const publishSchema = z.object({
  id: z.uuid(),
  published: z.boolean(),
});

export const pinSchema = z.object({
  id: z.uuid(),
  pinned: z.boolean(),
});

export const bippyVisibilitySchema = z.object({
  enabled: z.boolean(),
});

export const uploadRequestSchema = z.object({
  resourceType: z.enum(["icon", "profile", "resume", "post"]),
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim(),
  size: z.number().int().positive(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type RecognitionInput = z.infer<typeof recognitionSchema>;
export type TechStackItemInput = z.infer<typeof techStackItemSchema>;
export type NowSectionInput = z.infer<typeof nowSectionSchema>;
export type NowLinkInput = z.infer<typeof nowLinkSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SeoInput = z.infer<typeof seoSchema>;
export type BippyVisibilityInput = z.infer<typeof bippyVisibilitySchema>;
export type PublishInput = z.infer<typeof publishSchema>;
export type PinInput = z.infer<typeof pinSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type PostLinkInput = z.infer<typeof postLinkSchema>;
