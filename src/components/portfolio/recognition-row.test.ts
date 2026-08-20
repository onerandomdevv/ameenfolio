import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecognitionRow } from "@/components/portfolio/recognition-row";

const image = { objectKey: "recognitions/2026/abc.webp", alt: "Certificate" };

describe("RecognitionRow", () => {
  it("links straight out when there are no images", () => {
    // No modal for something a link already carries: a panel holding one button
    // would be a step for its own sake. This is also exactly how the row behaved
    // before the modal existed, for a recognition with only a verification URL.
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
    expect(html).not.toContain("<button");
    expect(html).toContain("lucide-arrow-up-right");
  });

  it("prefers the article over the outward link", () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionRow, {
        title: "Spoke at a local meetup",
        iconName: "award",
        verificationUrl: "https://example.com/proof",
        articleSlug: "speaking-at-a-meetup",
      }),
    );

    expect(html).toContain('href="/writing/speaking-at-a-meetup"');
    expect(html).not.toContain("https://example.com/proof");
  });

  it("opens the modal only once images are attached", () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionRow, {
        title: "Winner of AWS Hackathon 2025",
        iconName: "trophy",
        verificationUrl: "https://example.com/award",
        images: [image],
      }),
    );

    expect(html).toContain("<button");
    // The link moves inside the dialog, so the row itself no longer navigates.
    expect(html).not.toContain("<a");
  });

  it("stays static when there is nothing to open or follow", () => {
    const html = renderToStaticMarkup(
      createElement(RecognitionRow, {
        title: "Selected as a community mentor",
        iconName: "award",
        verificationUrl: null,
      }),
    );

    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("lucide-arrow-up-right");
    expect(html).toContain("Selected as a community mentor");
  });
});
