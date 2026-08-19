import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getIdentitySettings } from "@/db/queries";
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
  return (
    // suppressHydrationWarning because the script below edits this element's
    // class before React sees it, so the server's markup and the client's
    // first read of it legitimately differ.
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Runs before first paint, which is the whole point: applying the
            class after hydration means a white flash on every navigation.

            Dark unless "light" was explicitly chosen — the site is dark by
            design, so a visitor whose laptop happens to be in light mode still
            arrives at the version it was built as. The OS preference is not
            consulted; only the stored choice is.

            Only the storage read is wrapped. With the whole block in the try,
            a browser that blocks storage threw before the class was applied
            and the page stayed on the light base — the opposite of the
            default. The class is also rendered on the server, so the default
            survives with no JavaScript at all; this script only has to take
            it off for someone who chose light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{var s=null;try{s=localStorage.getItem("theme")}catch(e){}var d=s!=="light";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";})();`,
          }}
        />
      </head>
      {/* Extensions inject attributes on body before React hydrates (ColorZilla
          adds cz-shortcut-listen, password managers add their own), which
          React reports as a mismatch the page cannot fix. Suppression applies
          to this element only, so a real mismatch inside still surfaces. */}
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen">{children}</div>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
