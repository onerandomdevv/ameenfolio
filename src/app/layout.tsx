import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
const inter = Inter({ subsets: ["latin"] });

import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://onerandomdevv.pxxl.click"),
  title: {
    default: "Ameen's Portfolio",
    template: "%s | Ameen's Portfolio",
  },
  description: "A showcase of my work and skills",
  openGraph: {
    title: "Ameen's Portfolio",
    description: "A showcase of my work and skills",
    url: "https://onerandomdevv.pxxl.click",
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
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
