import { describe, expect, it } from "vitest";
import {
  techStackGroupLabel,
  techStackGroupValues,
  techStackGroups,
} from "@/config/tech-stack";
import { techStackItemSchema } from "@/lib/validation";

// The item list used to live here and was asserted verbatim. It is database
// content now, so what is worth pinning is the group contract the schema, the
// database check constraint and the public grouping all share.
describe("techStackGroups", () => {
  it("exposes exactly the two supported groups", () => {
    expect(techStackGroups.map((group) => group.value)).toEqual([
      "core",
      "tools",
    ]);
    expect(techStackGroups.map((group) => group.label)).toEqual([
      "Core Stack",
      "Tools & Infrastructure",
    ]);
  });

  it("derives its values list from the groups themselves", () => {
    expect([...techStackGroupValues]).toEqual(
      techStackGroups.map((group) => group.value),
    );
  });

  it("falls back to the first group for an unknown value", () => {
    expect(techStackGroupLabel("tools")).toBe("Tools & Infrastructure");
    expect(techStackGroupLabel("nonsense")).toBe("Core Stack");
  });
});

describe("techStackItemSchema", () => {
  const item = {
    name: "Rust",
    groupKey: "core",
    displayOrder: 0,
    visible: true,
  };

  it("accepts a technology in either group", () => {
    expect(techStackItemSchema.safeParse(item).success).toBe(true);
    expect(
      techStackItemSchema.safeParse({ ...item, groupKey: "tools" }).success,
    ).toBe(true);
  });

  it("rejects a group the database constraint would refuse", () => {
    expect(
      techStackItemSchema.safeParse({ ...item, groupKey: "languages" }).success,
    ).toBe(false);
  });

  it("requires a name", () => {
    expect(techStackItemSchema.safeParse({ ...item, name: "  " }).success).toBe(
      false,
    );
  });
});
