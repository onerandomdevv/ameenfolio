import { describe, expect, it } from "vitest";
import { createMcpToolResult } from "@/lib/mcp/result";

describe("createMcpToolResult", () => {
  it("makes read results available as structured data and model-readable text", () => {
    const result = createMcpToolResult(
      {
        profile: { name: "Aliameen Kareem" },
        projects: [{ title: "Ameenfolio" }],
      },
      "Portfolio overview loaded.",
    );

    expect(result.structuredContent).toEqual({
      profile: { name: "Aliameen Kareem" },
      projects: [{ title: "Ameenfolio" }],
    });
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining('"name": "Aliameen Kareem"'),
    });
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining('"title": "Ameenfolio"'),
    });
  });

  it("wraps array results in a protocol-valid structured object", () => {
    const result = createMcpToolResult(
      [{ name: "TypeScript" }, { name: "PostgreSQL" }],
      "Tech Stack loaded.",
    );

    expect(result.structuredContent).toEqual({
      data: [{ name: "TypeScript" }, { name: "PostgreSQL" }],
    });
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining('"name": "TypeScript"'),
    });
  });

  it("exposes write proposals and approval details through both channels", () => {
    const proposal = {
      approvalId: "approval-123",
      status: "pending",
      preview: { title: "A private draft" },
    };
    const result = createMcpToolResult(
      proposal,
      "Post draft prepared for admin approval.",
    );

    expect(result.structuredContent).toEqual(proposal);
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining('"approvalId": "approval-123"'),
    });
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining('"status": "pending"'),
    });
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining('"title": "A private draft"'),
    });
  });

  it("keeps image blocks separate from the JSON text response", () => {
    const image = {
      type: "image" as const,
      data: "base64-image-data",
      mimeType: "image/png",
    };
    const result = createMcpToolResult(
      { markdown: "![Diagram](/media/posts/example.png)" },
      "Article image stored.",
      [image],
    );

    expect(result.content).toHaveLength(2);
    expect(result.content[1]).toEqual(image);
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.not.stringContaining(image.data),
    });
  });
});
