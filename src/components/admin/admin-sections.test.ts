import { describe, expect, it } from "vitest";
import {
  adminSections,
  isCurrentSection,
} from "@/components/admin/admin-sections";

describe("isCurrentSection", () => {
  it("marks the section a nested route belongs to", () => {
    expect(isCurrentSection("/admin/writing/new", "/admin", "/writing")).toBe(
      true,
    );
    expect(
      isCurrentSection("/admin/projects/abc/edit", "/admin", "/projects"),
    ).toBe(true);
  });

  it("marks the section's own page", () => {
    expect(isCurrentSection("/admin/now", "/admin", "/now")).toBe(true);
  });

  it("does not match a longer name that merely shares a prefix", () => {
    expect(isCurrentSection("/admin/nowhere", "/admin", "/now")).toBe(false);
  });

  it("works on the admin host, where the base is empty", () => {
    expect(isCurrentSection("/writing", "", "/writing")).toBe(true);
    expect(isCurrentSection("/writing/some-post", "", "/writing")).toBe(true);
    expect(isCurrentSection("/projects", "", "/writing")).toBe(false);
  });

  it("selects exactly one section for every section's own path", () => {
    for (const section of adminSections) {
      const matched = adminSections.filter((candidate) =>
        isCurrentSection(`/admin${section.href}`, "/admin", candidate.href),
      );
      expect(matched).toHaveLength(1);
      expect(matched[0].href).toBe(section.href);
    }
  });
});
