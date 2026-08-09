import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { portfolioIdentity } from "@/config/portfolio";

export const alt = `${portfolioIdentity.name} — ${portfolioIdentity.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated rather than committed as a PNG so the card cannot drift from
// src/config/portfolio.ts. The font is read from disk rather than fetched, so a
// build never depends on the network.
export default async function OpengraphImage() {
  const [serif, logo, portrait] = await Promise.all([
    readFile(
      join(process.cwd(), "src/app/og-assets/InstrumentSerif-Regular.ttf"),
    ),
    readFile(join(process.cwd(), "src/app/icon.png")),
    readFile(join(process.cwd(), "src/app/og-assets/aliameen-portrait.jpg")),
  ]);

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 84px",
        background: "#0b0b0b",
        color: "#ffffff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/jpeg;base64,${portrait.toString("base64")}`}
        alt=""
        width={690}
        height={630}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 690,
          height: 630,
          objectFit: "cover",
          objectPosition: "center top",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(90deg, #0b0b0b 0%, #0b0b0b 38%, rgba(11,11,11,0.92) 48%, rgba(11,11,11,0.28) 70%, rgba(11,11,11,0) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: 620,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          alt=""
          width={70}
          height={70}
          style={{ marginBottom: 32 }}
        />
        <div style={{ fontSize: 80, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {portfolioIdentity.name}
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: 22,
            letterSpacing: "0.01em",
            color: "#b4b4b8",
          }}
        >
          {portfolioIdentity.role}
        </div>
      </div>
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
