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
  const [serif, logo] = await Promise.all([
    readFile(
      join(process.cwd(), "src/app/og-assets/InstrumentSerif-Regular.ttf"),
    ),
    readFile(join(process.cwd(), "src/app/icon.png")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "0 96px",
        background: "#000000",
        color: "#ffffff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${logo.toString("base64")}`}
        alt=""
        width={220}
        height={220}
        style={{ borderRadius: 48 }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {portfolioIdentity.name}
        </div>
        <div
          style={{
            fontSize: 38,
            marginTop: 20,
            letterSpacing: "0.01em",
            color: "#a1a1aa",
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
