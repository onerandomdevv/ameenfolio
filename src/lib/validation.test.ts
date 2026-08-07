import { describe, expect, it } from "vitest";
import {
  nowLinkSchema,
  nowSectionSchema,
  projectSchema,
  recognitionSchema,
  siteSettingsSchema,
} from "@/lib/validation";

describe("portfolio validation", () => {
  it("accepts a concise recognition without long-form fields", () => {
    expect(
      recognitionSchema.safeParse({
        title: "Winner of AWS Hackathon 2025",
        iconName: "trophy",
        verificationUrl: "https://example.com/award",
        displayOrder: 0,
        published: true,
      }).success,
    ).toBe(true);
  });

  it("rejects recognition icons outside the curated set", () => {
    expect(
      recognitionSchema.safeParse({
        title: "Winner of AWS Hackathon 2025",
        iconName: "uploaded-logo",
        displayOrder: 0,
        published: true,
      }).success,
    ).toBe(false);
  });

  it("rejects non-HTTPS project URLs", () => {
    const result = projectSchema.safeParse({
      title: "A project",
      shortDescription: "A sufficiently descriptive summary.",
      liveUrl: "http://example.com",
      homepageOrder: 0,
      showOnHomepage: false,
      published: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires icon alt text", () => {
    const result = projectSchema.safeParse({
      title: "A project",
      shortDescription: "A sufficiently descriptive summary.",
      liveUrl: "https://example.com",
      iconKey: "icons/2026/example.webp",
      homepageOrder: 0,
      showOnHomepage: false,
      published: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts only HTTPS contact links", () => {
    const result = siteSettingsSchema.safeParse({
      email: "ameen@example.com",
      contactLinks: { github: "javascript:alert(1)" },
      seoTitle: "Ameen — Product Engineer",
      seoDescription:
        "Selected software projects, recognition, and the tools used by Ameen.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts configurable footer social links", () => {
    const result = siteSettingsSchema.safeParse({
      email: "ameen@example.com",
      contactLinks: {
        instagram: "https://instagram.com/onerandomdevv",
        tiktok: "https://tiktok.com/@onerandomdevv",
        linkedin: "https://linkedin.com/in/onerandomdevv",
        whatsapp: "https://wa.me/2348000000000",
      },
      seoTitle: "Aliameen Kareem — Full-Stack Engineer",
      seoDescription:
        "Selected software projects, recognition, and the tools used by Aliameen.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts only generated profile image keys", () => {
    const result = siteSettingsSchema.safeParse({
      email: "ameen@example.com",
      contactLinks: {},
      profileImageKey: "profiles/2026/my-photo.webp",
      seoTitle: "Aliameen Kareem — Full-Stack Engineer",
      seoDescription:
        "Selected software projects, recognition, and the tools used by Aliameen.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a concise Now section description", () => {
    expect(
      nowSectionSchema.safeParse({
        description: "Building useful tools for people on the web.",
        published: true,
        showLastUpdated: true,
      }).success,
    ).toBe(true);
  });

  it("limits the Now section description to 600 characters", () => {
    expect(
      nowSectionSchema.safeParse({
        description: "a".repeat(601),
        published: true,
        showLastUpdated: true,
      }).success,
    ).toBe(false);
  });

  it("requires HTTPS for Now links", () => {
    expect(
      nowLinkSchema.safeParse({
        label: "Current product",
        url: "http://example.com",
        displayOrder: 0,
        visible: true,
      }).success,
    ).toBe(false);
  });

  it("requires alt text for a Now link icon", () => {
    expect(
      nowLinkSchema.safeParse({
        label: "Current product",
        url: "https://example.com",
        iconKey: `icons/2026/${"a".repeat(48)}.webp`,
        displayOrder: 0,
        visible: true,
      }).success,
    ).toBe(false);
  });
});
