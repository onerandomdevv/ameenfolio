import { describe, expect, it } from "vitest";
import { projectSchema, siteSettingsSchema } from "@/lib/validation";

describe("portfolio validation", () => {
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

  it("accepts only HTTPS social links", () => {
    const result = siteSettingsSchema.safeParse({
      name: "Ameen",
      role: "Product engineer",
      introduction: "I design and build focused software products for the web.",
      email: "ameen@example.com",
      socialLinks: [{ label: "GitHub", url: "javascript:alert(1)" }],
      seoTitle: "Ameen — Product Engineer",
      seoDescription:
        "Selected software projects, recognition, and the tools used by Ameen.",
    });
    expect(result.success).toBe(false);
  });
});
