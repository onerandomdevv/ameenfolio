import "client-only";

import type { Area } from "react-easy-crop";

const PROFILE_IMAGE_SIZE = 512;
// Recognition images are the artefact itself — a certificate, an award photo —
// shown as the largest thing in the modal and often the only reason to open it.
// 1080 is the ceiling worth storing: it stays sharp on a 2× screen at the size
// the carousel draws it, and a square webp at this size lands well under the
// upload rule's 4 MB.
export const RECOGNITION_IMAGE_SIZE = 1080;
// An icon is drawn at 26px in the admin and never much larger on the site, so
// 128 is already generous on a 2× screen and keeps the upload small.
const ICON_IMAGE_SIZE = 128;

async function loadImage(source: string) {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

async function cropToSquare(source: string, area: Area, size: number) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot crop the image.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Image crop failed.")),
      "image/webp",
      0.9,
    );
  });
}

export async function cropProfileImage(source: string, area: Area) {
  const blob = await cropToSquare(source, area, PROFILE_IMAGE_SIZE);
  return new File([blob], "profile.webp", { type: "image/webp" });
}

export async function cropIconImage(source: string, area: Area) {
  const blob = await cropToSquare(source, area, ICON_IMAGE_SIZE);
  return new File([blob], "icon.webp", { type: "image/webp" });
}

export async function cropRecognitionImage(source: string, area: Area) {
  const blob = await cropToSquare(source, area, RECOGNITION_IMAGE_SIZE);
  return new File([blob], "recognition.webp", { type: "image/webp" });
}

/**
 * Whether the chosen crop is smaller than what will be stored, meaning the
 * canvas will scale it up and the result will look soft.
 *
 * Reported rather than enforced: an undersized source is still the image the
 * owner has, and refusing it would leave the recognition with none at all.
 */
export function cropIsUpscaled(area: Area, size = RECOGNITION_IMAGE_SIZE) {
  return area.width < size;
}
