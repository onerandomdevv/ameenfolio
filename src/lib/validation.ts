import { z } from "zod";
import { availabilityValues } from "@/config/availability";
import { recognitionIconNames } from "@/config/recognition-icons";
import { cardWordLimitMessage, withinCardWordLimit } from "@/lib/word-count";

const optionalHttpsUrl = z
  .string()
  .trim()
  .refine(
    (value) => !value || value.startsWith("https://"),
    "URL must use HTTPS.",
  )
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
    liveUrl: z.url().startsWith("https://"),
    githubUrl: optionalHttpsUrl,
    ...iconFields,
    showOnHomepage: z.boolean(),
    homepageOrder: z.number().int().min(0).max(999),
    published: z.boolean(),
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
  displayOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const nowSectionSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(600),
  published: z.boolean(),
  showLastUpdated: z.boolean(),
});

export const nowLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    url: z.url().startsWith("https://"),
    ...iconFields,
    displayOrder: z.number().int().min(0).max(999),
    visible: z.boolean(),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required when an icon is uploaded.",
  });

export const siteSettingsSchema = z.object({
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
  seoTitle: z.string().trim().min(10).max(70),
  seoDescription: z.string().trim().min(40).max(170),
});

export const bippyVisibilitySchema = z.object({
  enabled: z.boolean(),
});

export const uploadRequestSchema = z.object({
  resourceType: z.enum(["icon", "profile", "resume"]),
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim(),
  size: z.number().int().positive(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type RecognitionInput = z.infer<typeof recognitionSchema>;
export type NowSectionInput = z.infer<typeof nowSectionSchema>;
export type NowLinkInput = z.infer<typeof nowLinkSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type BippyVisibilityInput = z.infer<typeof bippyVisibilitySchema>;
