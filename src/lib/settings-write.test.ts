import { describe, expect, it } from "vitest";
import type { SiteSettings } from "@/db/schema";
import { buildSettingsWrite } from "@/lib/settings-write";

const now = new Date("2026-01-01T00:00:00.000Z");

const stored: SiteSettings = {
  id: 1,
  displayName: "Aliameen Kareem",
  role: "Full-Stack Engineer",
  introduction: "I am a **Software Engineer**.",
  email: "ameen@example.com",
  contactLinks: { github: "https://github.com/onerandomdevv" },
  profileImageKey: null,
  resumeKey: null,
  resumeFilename: null,
  publicBippyEnabled: true,
  hackathonWins: 4,
  availability: "open",
  seoTitle: "Aliameen Kareem — Full-Stack Engineer",
  seoDescription:
    "Selected software projects, recognition, and the tools used by Aliameen.",
  updatedAt: new Date(0),
};

describe("buildSettingsWrite", () => {
  it("inserts every non-null column, so the row can be created from nothing", () => {
    const { insert } = buildSettingsWrite(stored, { seoTitle: "New" }, now);

    // The three that are NOT NULL with no default are the ones that would make
    // a partial insert fail outright.
    expect(insert.email).toBe(stored.email);
    expect(insert.seoDescription).toBe(stored.seoDescription);
    expect(insert.seoTitle).toBe("New");
    expect(insert.id).toBe(1);
  });

  it("updates only what was submitted", () => {
    const { update } = buildSettingsWrite(stored, { seoTitle: "New" }, now);

    expect(Object.keys(update).sort()).toEqual(["seoTitle", "updatedAt"]);
  });

  it("leaves the Bippy toggle out of both halves", () => {
    const { insert, update } = buildSettingsWrite(
      stored,
      { role: "Founder" },
      now,
    );

    expect(insert).not.toHaveProperty("publicBippyEnabled");
    expect(update).not.toHaveProperty("publicBippyEnabled");
  });

  // The reason the update is narrow. Both screens read the row, then write.
  // If either wrote the whole row back, the second one to land would carry the
  // other's columns from a snapshot taken before that save happened.
  it("keeps overlapping profile and SEO saves from undoing each other", () => {
    // Both read the same starting row.
    const snapshot = stored;

    const profileSave = buildSettingsWrite(
      snapshot,
      { displayName: "New Name", role: "Founder" },
      now,
    );
    const seoSave = buildSettingsWrite(
      snapshot,
      { seoTitle: "A brand new title" },
      now,
    );

    // Apply them in either order against the stored row.
    const applied = {
      ...snapshot,
      ...seoSave.update,
      ...profileSave.update,
    };
    const reversed = {
      ...snapshot,
      ...profileSave.update,
      ...seoSave.update,
    };

    for (const result of [applied, reversed]) {
      expect(result.displayName).toBe("New Name");
      expect(result.role).toBe("Founder");
      expect(result.seoTitle).toBe("A brand new title");
    }
  });

  it("would have lost an edit if the update carried the whole row", () => {
    // Guards the property rather than the implementation: this is the shape the
    // update used to have, and it demonstrates the loss the narrow one avoids.
    const snapshot = stored;
    const wholeRowUpdate = { ...snapshot, displayName: "New Name" };
    const seoSave = buildSettingsWrite(snapshot, { seoTitle: "Newer" }, now);

    const lost = { ...snapshot, ...seoSave.update, ...wholeRowUpdate };
    expect(lost.seoTitle).toBe(stored.seoTitle);
    expect(lost.seoTitle).not.toBe("Newer");
  });
});
