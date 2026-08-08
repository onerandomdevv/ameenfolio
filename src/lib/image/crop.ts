import "client-only";

import type { Area } from "react-easy-crop";

const PROFILE_IMAGE_SIZE = 512;

async function loadImage(source: string) {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

export async function cropProfileImage(source: string, area: Area) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_IMAGE_SIZE;
  canvas.height = PROFILE_IMAGE_SIZE;

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
    PROFILE_IMAGE_SIZE,
    PROFILE_IMAGE_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Image crop failed.")),
      "image/webp",
      0.9,
    );
  });

  return new File([blob], "profile.webp", { type: "image/webp" });
}
