import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PixelBackground } from "@/components/layout/pixel-background";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Portfolio",
  description: "A showcase of my work and skills",
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
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
