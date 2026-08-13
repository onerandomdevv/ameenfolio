import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getIdentitySettings, getPublishedPost } from "@/db/queries";
import { resolveIdentity } from "@/lib/identity";
import { formatPostDate } from "@/lib/writing/format";

export const alt = "Article preview card";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ImageProps = { params: Promise<{ slug: string }> };

export default async function ArticleOpenGraphImage({ params }: ImageProps) {
  const { slug } = await params;
  const [found, identitySettings] = await Promise.all([
    getPublishedPost(slug),
    getIdentitySettings(),
  ]);
  if (!found) notFound();
  const identity = resolveIdentity(identitySettings);

  const [serif, logo, illustration] = await Promise.all([
    readFile(
      join(process.cwd(), "src/app/og-assets/InstrumentSerif-Regular.ttf"),
    ),
    readFile(join(process.cwd(), "src/app/icon.png")),
    readFile(
      join(process.cwd(), "src/app/writing/[slug]/assets/bippy-writing.webp"),
    ),
  ]);

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        padding: "60px 68px",
        background: "#090909",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -170,
          right: -90,
          width: 560,
          height: 560,
          display: "flex",
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(182,255,56,0.18) 0%, rgba(182,255,56,0) 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#b4b4b8",
            fontSize: 25,
            letterSpacing: "0.02em",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            alt=""
            width={54}
            height={54}
          />
          <span>onerandomdevv / writing</span>
        </div>
        <span style={{ color: "#b6ff38", fontSize: 22 }}>ARTICLE</span>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 54,
        }}
      >
        <div
          style={{
            width: 650,
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              fontFamily: "Instrument Serif",
              fontSize: found.post.title.length > 72 ? 57 : 67,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
            }}
          >
            {found.post.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#a1a1aa",
              fontSize: 22,
            }}
          >
            <span>{formatPostDate(found.post.publishedAt)}</span>
            <span style={{ color: "#b6ff38" }}>■</span>
            <span>{identity.name}</span>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/webp;base64,${illustration.toString("base64")}`}
          alt=""
          width={370}
          height={370}
          style={{
            width: 370,
            height: 370,
            objectFit: "cover",
            border: "1px solid #27272a",
            borderRadius: 28,
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          height: 2,
          display: "flex",
          background:
            "linear-gradient(90deg, #b6ff38 0%, #b6ff38 18%, #27272a 18%, #27272a 100%)",
        }}
      />
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: serif,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
