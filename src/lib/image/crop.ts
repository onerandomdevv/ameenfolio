import "client-only";

import type { Area } from "react-easy-crop";

const PROFILE_IMAGE_SIZE = 512;
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
