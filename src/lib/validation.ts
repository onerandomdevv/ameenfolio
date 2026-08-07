import { z } from "zod";

const optionalHttpsUrl = z
  .string()
  .trim()
  .refine((value) => !value || value.startsWith("https://"), "URL must use HTTPS.")
  .optional();

const optionalText = (max: number) =>
  z.string().trim().max(max).optional();

const iconObjectKey = z
  .string()
  .regex(/^icons\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
  .optional();

const iconFields = {
  iconKey: iconObjectKey,
  iconAlt: optionalText(180),
};

export const projectSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    shortDescription: z.string().trim().min(10).max(500),
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

export const recognitionSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    issuer: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(800),
    recognizedOn: z.union([z.literal(""), z.iso.date()]).optional(),
    verificationUrl: optionalHttpsUrl,
    ...iconFields,
    displayOrder: z.number().int().min(0).max(999),
    published: z.boolean(),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required when an icon is uploaded.",
  });

export const technologySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    category: z.string().trim().min(1).max(80),
    websiteUrl: optionalHttpsUrl,
    ...iconFields,
    displayOrder: z.number().int().min(0).max(999),
    visible: z.boolean(),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required when an icon is uploaded.",
  });

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  url: z.url().startsWith("https://"),
});

export const siteSettingsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(140),
  introduction: z.string().trim().min(20).max(1200),
  email: z.email(),
  socialLinks: z.array(socialLinkSchema).max(8),
  resumeKey: z
    .string()
    .regex(/^resumes\/\d{4}\/[a-f0-9]{48}\.pdf$/)
    .optional(),
  resumeFilename: optionalText(180),
  seoTitle: z.string().trim().min(10).max(70),
  seoDescription: z.string().trim().min(40).max(170),
});

export const uploadRequestSchema = z.object({
  resourceType: z.enum(["icon", "resume"]),
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim(),
  size: z.number().int().positive(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type RecognitionInput = z.infer<typeof recognitionSchema>;
export type TechnologyInput = z.infer<typeof technologySchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
