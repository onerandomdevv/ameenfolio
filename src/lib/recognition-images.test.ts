import { describe, expect, it, vi } from "vitest";

vi.mock("client-only", () => ({}));

import { cropIsUpscaled, RECOGNITION_IMAGE_SIZE } from "@/lib/image/crop";
import { isPublicRecognitionImageKey } from "@/lib/storage/rules";
import {
  MAX_RECOGNITION_IMAGES,
  recognitionFormSchema,
  recognitionSchema,
} from "@/lib/validation";

const key = `recognitions/2026/${"a".repeat(48)}.webp`;
const base = { title: "Winner of a hackathon", iconName: "trophy" } as const;
const image = { objectKey: key, alt: "Certificate", displayOrder: 0 };

describe("recognition images", () => {
  it("stores at 1080 square", () => {
    expect(RECOGNITION_IMAGE_SIZE).toBe(1080);
  });

  it("reports an undersized crop without rejecting it", () => {
    // Warned about, never blocked: an undersized source is still the image the
    // owner has, and refusing it would leave the recognition with none at all.
    expect(cropIsUpscaled({ x: 0, y: 0, width: 640, height: 640 })).toBe(true);
    expect(cropIsUpscaled({ x: 0, y: 0, width: 1080, height: 1080 })).toBe(
      false,
    );
    expect(cropIsUpscaled({ x: 0, y: 0, width: 2000, height: 2000 })).toBe(
      false,
    );
  });

  it("accepts its own object keys and rejects traversal", () => {
    expect(isPublicRecognitionImageKey(key)).toBe(true);
    expect(isPublicRecognitionImageKey("recognitions/2026/../../secret")).toBe(
      false,
    );
    expect(isPublicRecognitionImageKey("posts/2026/whatever.webp")).toBe(false);
  });
});

describe("recognitionSchema", () => {
  it("distinguishes 'no images given' from 'no images'", () => {
    // The distinction the save path depends on. saveRecognition rewrites image
    // rows wholesale, so an update that omits the field must leave them alone
    // — otherwise every copilot edit, which cannot produce object keys, would
    // silently delete every image on the recognition.
    expect(recognitionFormSchema.parse(base).images).toBeUndefined();
    expect(recognitionFormSchema.parse({ ...base, images: [] }).images).toEqual(
      [],
    );
  });

  it("caps the number of images", () => {
    const tooMany = Array.from(
      { length: MAX_RECOGNITION_IMAGES + 1 },
      (_unused, index) => ({ ...image, displayOrder: index }),
    );

    expect(
      recognitionFormSchema.safeParse({ ...base, images: tooMany }).success,
    ).toBe(false);
  });

  it("no longer demands a description per image", () => {
    // The form asks for one caption for the set instead. Alt is derived from
    // the title and position, so an image with none is still announced.
    const result = recognitionFormSchema.safeParse({
      ...base,
      images: [{ objectKey: key, displayOrder: 0 }],
    });

    expect(result.success).toBe(true);
  });

  it("refuses an object key from another prefix", () => {
    const result = recognitionFormSchema.safeParse({
      ...base,
      images: [{ ...image, objectKey: `profiles/2026/${"a".repeat(48)}.webp` }],
    });

    expect(result.success).toBe(false);
  });

  it("keeps images off the schema the copilots are given", () => {
    // Recognitions are text-only for MCP and the chatbot: neither can produce
    // an R2 object key, so an images field would only invite a tool call that
    // cannot succeed. This is the assertion that keeps the split honest.
    expect("images" in recognitionSchema.shape).toBe(false);
    expect("images" in recognitionFormSchema.shape).toBe(true);
  });

  it("keeps the article optional and validated", () => {
    expect(recognitionSchema.safeParse(base).success).toBe(true);
    expect(
      recognitionSchema.safeParse({ ...base, articlePostId: "not-a-uuid" })
        .success,
    ).toBe(false);
  });
});
