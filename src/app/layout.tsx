import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BippyCompanion } from "@/components/bippy/bippy-companion";
import { ThemeToggle } from "@/components/portfolio/theme-toggle";
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
    // suppressHydrationWarning because the script below edits this element's
    // class before React sees it, so the server's markup and the client's
    // first read of it legitimately differ.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint, which is the whole point: applying the
            class after hydration means a dark-mode reader gets a white flash
            on every navigation. Reads the stored choice, falls back to the
            system preference, and is wrapped because localStorage throws in
            some privacy modes — unguarded, the theme would never apply at
            all. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{var s=localStorage.getItem("theme");var d=s==="dark"||(!s&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Here rather than in PortfolioNav, which only the homepage and the
            projects page render — the writing pages had no toggle at all.
            Fixed to the corner so its position is the same on every page. */}
        <ThemeToggle />
        <div className="min-h-screen">{children}</div>
        <Suspense fallback={null}>
          <BippyCompanion enabled={publicBippyEnabled} />
        </Suspense>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
