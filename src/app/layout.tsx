import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BippyCompanion } from "@/components/bippy/bippy-companion";
import { Toaster } from "@/components/ui/sonner";
import { portfolioIdentity } from "@/config/portfolio";
import { getPublicBippyEnabled } from "@/db/queries";
import { inter } from "@/app/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.CANONICAL_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${portfolioIdentity.name} — ${portfolioIdentity.role}`,
    template: `%s | ${portfolioIdentity.name}`,
  },
  description: `Selected projects, recognition, and the technologies behind ${portfolioIdentity.name}'s work.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${portfolioIdentity.name} — ${portfolioIdentity.role}`,
    description: `Selected projects, recognition, and the technologies behind ${portfolioIdentity.name}'s work.`,
    url: "/",
    siteName: portfolioIdentity.name,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: portfolioIdentity.name,
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicBippyEnabled = await getPublicBippyEnabled();

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">{children}</div>
        <Suspense fallback={null}>
          <BippyCompanion enabled={publicBippyEnabled} />
        </Suspense>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
