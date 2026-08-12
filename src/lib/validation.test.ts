import { describe, expect, it } from "vitest";
import {
  bippyVisibilitySchema,
  nowLinkSchema,
  nowSectionSchema,
  projectSchema,
  recognitionSchema,
  profileSchema,
  seoSchema,
} from "@/lib/validation";

describe("portfolio validation", () => {
  it("accepts only a boolean public Bippy visibility setting", () => {
    expect(bippyVisibilitySchema.safeParse({ enabled: true }).success).toBe(
      true,
    );
    expect(bippyVisibilitySchema.safeParse({ enabled: "true" }).success).toBe(
      false,
    );
  });

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
      url: "http://example.com",
      iconName: "custom",
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
      url: "https://example.com",
      iconName: "custom",
      iconKey: "icons/2026/example.webp",
      homepageOrder: 0,
      showOnHomepage: false,
      published: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts only HTTPS contact links", () => {
    const result = profileSchema.safeParse({
      email: "ameen@example.com",
      contactLinks: { github: "javascript:alert(1)" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts configurable footer social links", () => {
    const result = profileSchema.safeParse({
      email: "ameen@example.com",
      contactLinks: {
        instagram: "https://instagram.com/onerandomdevv",
        tiktok: "https://tiktok.com/@onerandomdevv",
        linkedin: "https://linkedin.com/in/onerandomdevv",
        whatsapp: "https://wa.me/2348000000000",
      },
      hackathonWins: 3,
      availability: "open",
    });

    expect(result.success).toBe(true);
  });

  it("accepts only generated profile image keys", () => {
    const result = profileSchema.safeParse({
      email: "ameen@example.com",
      contactLinks: {},
      profileImageKey: "profiles/2026/my-photo.webp",
    });
    expect(result.success).toBe(false);
  });

  it("accepts only the two availability states", () => {
    const settings = {
      email: "ameen@example.com",
      contactLinks: {},
      hackathonWins: 0,
    };

    expect(
      profileSchema.safeParse({ ...settings, availability: "open" }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...settings, availability: "booked" }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...settings, availability: "maybe" }).success,
    ).toBe(false);
  });

  it("rejects a hackathon win count outside the strip's one-line budget", () => {
    const settings = {
      email: "ameen@example.com",
      contactLinks: {},
      availability: "open",
    };

    expect(
      profileSchema.safeParse({ ...settings, hackathonWins: 100 }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...settings, hackathonWins: -1 }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...settings, hackathonWins: 2.5 }).success,
    ).toBe(false);
  });

  // Profile and Settings are separate screens writing one row. Each schema has
  // to stand alone, or a save from one would be rejected for missing the
  // other's fields — or worse, accept and blank them.
  it("validates the profile without any SEO fields present", () => {
    expect(
      profileSchema.safeParse({
        email: "ameen@example.com",
        contactLinks: {},
        hackathonWins: 0,
        availability: "open",
      }).success,
    ).toBe(true);
  });

  it("validates SEO without any profile fields present", () => {
    expect(
      seoSchema.safeParse({
        seoTitle: "Aliameen Kareem — Full-Stack Engineer",
        seoDescription:
          "Selected software projects, recognition, and the tools used by Aliameen.",
      }).success,
    ).toBe(true);
  });

  it("keeps the SEO length limits on the settings half", () => {
    expect(
      seoSchema.safeParse({
        seoTitle: "Too short",
        seoDescription: "x".repeat(60),
      }).success,
    ).toBe(false);
    expect(
      seoSchema.safeParse({
        seoTitle: "A perfectly reasonable title",
        seoDescription: "x".repeat(171),
      }).success,
    ).toBe(false);
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

  it("accepts any non-empty Now section description", () => {
    expect(
      nowSectionSchema.safeParse({
        description: "Shipping.",
        published: true,
        showLastUpdated: false,
      }).success,
    ).toBe(true);
  });

  it("rejects a whitespace-only Now section description", () => {
    expect(
      nowSectionSchema.safeParse({
        description: "   ",
        published: true,
        showLastUpdated: false,
      }).success,
    ).toBe(false);
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
