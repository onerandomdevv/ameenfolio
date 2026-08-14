import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { getPublishedPost } from "@/db/queries";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ slug: string; version: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug, version } = await params;
  const found = await getPublishedPost(slug);
  if (!found) notFound();

  const currentVersion = found.post.updatedAt.getTime().toString(36);
  if (version !== `${currentVersion}.jpg`) notFound();

  const image = await readFile(
    join(process.cwd(), "src/app/og-assets/bippy-writing-social.jpg"),
  );

  return new Response(image, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": image.byteLength.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
