import { Inter } from "next/font/google";
import "./globals.css";
import { PixelBackground } from "@/components/layout/pixel-background";
import { Toaster } from "@/components/ui/sonner";
const inter = Inter({ subsets: ["latin"] });

import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.CANONICAL_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Ameen's Portfolio",
    template: "%s | Ameen's Portfolio",
  },
  description: "Selected projects, recognition, and the technologies behind Ameen's work.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ameen's Portfolio",
    description: "Selected projects, recognition, and the technologies behind Ameen's work.",
    url: "/",
    siteName: "Ameen's Portfolio",
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
    title: "Ameen",
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
        <PixelBackground />
        <div className="relative z-10 min-h-screen">{children}</div>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
