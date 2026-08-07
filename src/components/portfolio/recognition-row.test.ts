import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecognitionRow } from "@/components/portfolio/recognition-row";

describe("RecognitionRow", () => {
  it("makes the full row an external link when evidence is available", () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionRow, {
        title: "Winner of AWS Hackathon 2025",
        iconName: "trophy",
        verificationUrl: "https://example.com/award",
      }),
    );

    expect(html).toContain(
      '<a href="https://example.com/award" target="_blank" rel="noreferrer"',
    );
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain("lucide-arrow-up-right");
  });

  it("keeps an unlinked recognition static and omits the arrow", () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionRow, {
        title: "Selected as a community mentor",
        iconName: "award",
        verificationUrl: null,
      }),
    );

    expect(html).not.toContain("<a");
    expect(html).not.toContain("lucide-arrow-up-right");
    expect(html).toContain("Selected as a community mentor");
  });
});
