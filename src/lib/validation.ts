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

export const iconObjectKeySchema = z
  .string()
  .regex(/^icons\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
  .optional();

export const profileImageObjectKeySchema = z
  .string()
  .regex(/^profiles\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
  .optional();

const iconFields = {
  iconKey: iconObjectKeySchema,
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

export const recognitionImageKeySchema = z
  .string()
  .regex(/^recognitions\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/);

export const recognitionImageSchema = z.object({
  objectKey: recognitionImageKeySchema,
  // Optional: the form does not ask for one. What a screen reader hears is
  // derived from the recognition's title and the image's position by
  // recognitionImageAlt, and a description written here still wins over that.
  alt: optionalText(160),
  displayOrder: z.number().int().min(0).max(999),
});

export const MAX_RECOGNITION_IMAGES = 6;

export const recognitionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .refine(withinCardWordLimit, cardWordLimitMessage),
  iconName: z.enum(recognitionIconNames),
  verificationUrl: optionalHttpsUrl,
  // The article on this site covering the recognition. Reachable by the
  // copilot: it can read posts, so it can legitimately attach one.
  articlePostId: z.uuid().optional(),
});

/**
 * The admin form's version, which additionally carries the images.
 *
 * Split from `recognitionSchema` because that one is handed to the MCP and
 * chatbot tools as their input contract, and recognitions are deliberately
 * text-only there: neither copilot can produce an R2 object key, so exposing
 * the field would only invite a tool call that cannot succeed.
 *
 * `images` is optional and never `.default([])`. saveRecognition rewrites the
 * image rows wholesale, the same way savePost rewrites post links — so a
 * default of `[]` would make every caller that says nothing about images
 * silently delete all of them. Left undefined, "no images field" means "leave
 * the images alone", and only this form, which always sends the full list,
 * can change them.
 */
export const recognitionFormSchema = recognitionSchema.extend({
  // The picker says "none" with an empty string, and the form holds exactly
  // that rather than writing `undefined` back into form state. saveRecognition
  // already stores a falsy value as null, so "" needs no conversion on the way
  // out; it only has to be a legal value on the way in.
  //
  // The AI-facing schema keeps its plain uuid, since no picker is involved.
  articlePostId: z.union([z.uuid(), z.literal("")]).optional(),
  images: z
    .array(recognitionImageSchema)
    .max(MAX_RECOGNITION_IMAGES)
    .optional(),
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
export const contactLinksSchema = z.object({
  github: optionalHttpsUrl,
  x: optionalHttpsUrl,
  instagram: optionalHttpsUrl,
  tiktok: optionalHttpsUrl,
  youtube: optionalHttpsUrl,
  linkedin: optionalHttpsUrl,
  whatsapp: optionalHttpsUrl,
});

export const resumeObjectKeySchema = z
  .string()
  .regex(/^resumes\/\d{4}\/[a-f0-9]{48}\.pdf$/)
  .optional();

export const profileSchema = z.object({
  // What the homepage shows under the photo. The introduction keeps its own
  // line breaks and carries its emphasis inline as **double asterisks**, so the
  // field holds exactly what is rendered.
  displayName: z.string().trim().min(1, "A name is required.").max(80),
  role: z.string().trim().min(1, "A role is required.").max(80),
  introduction: z
    .string()
    .trim()
    .min(1, "An introduction is required.")
    .max(600),
  email: z.email(),
  contactLinks: contactLinksSchema,
  profileImageKey: profileImageObjectKeySchema,
  resumeKey: resumeObjectKeySchema,
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
  resourceType: z.enum(["icon", "profile", "resume", "post", "recognition"]),
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim(),
  size: z.number().int().positive(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type RecognitionInput = z.infer<typeof recognitionSchema>;
export type RecognitionFormInput = z.infer<typeof recognitionFormSchema>;
export type RecognitionImageInput = z.infer<typeof recognitionImageSchema>;
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
