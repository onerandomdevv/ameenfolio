import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BippyCompanion } from "@/components/bippy/bippy-companion";
import { Toaster } from "@/components/ui/sonner";
import { getIdentitySettings, getPublicBippyEnabled } from "@/db/queries";
import { resolveIdentity } from "@/lib/identity";
import { inter } from "@/app/fonts";

// Async, because the name and role are editable now. Static metadata would
// keep naming whoever was hardcoded at build time, so a shared link could
// introduce someone by a title they had already changed.
export async function generateMetadata(): Promise<Metadata> {
  const { name, role } = resolveIdentity(await getIdentitySettings());
  const description = `Selected projects, recognition, and the technologies behind ${name}'s work.`;

  return {
    metadataBase: new URL(
      process.env.CANONICAL_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: `${name} — ${role}`,
      template: `%s | ${name}`,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: `${name} — ${role}`,
      description,
      url: "/",
      siteName: name,
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
      title: name,
      card: "summary_large_image",
    },
  };
}

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
