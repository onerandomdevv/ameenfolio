import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { portfolioIdentity } from "@/config/portfolio";
import { inter } from "@/app/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.CANONICAL_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${portfolioIdentity.name} — ${portfolioIdentity.role}`,
    template: `%s | ${portfolioIdentity.name}`,
  },
  description:
    "Selected projects, recognition, and the technologies behind Ameen's work.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${portfolioIdentity.name} — ${portfolioIdentity.role}`,
    description:
      "Selected projects, recognition, and the technologies behind Ameen's work.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">{children}</div>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
