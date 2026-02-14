import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { client } from "@/lib/sanity";

// Force dynamic rendering so we always get the latest Sanity data
export const dynamic = "force-dynamic";

async function getResumeSettings() {
  try {
    const settings = await client.fetch(
      '*[_type == "settings"][0]{ "resumeUrl": resume.asset->url }',
    );
    return settings;
  } catch (error) {
    console.error("Error fetching resume settings:", error);
    return null;
  }
}

export default async function ResumePage() {
  const settings = await getResumeSettings();
  const resumeImage = settings?.resumeUrl || "/resume/resume-image.png";

  return (
    <div className="min-h-screen bg-bg-base text-white flex flex-col items-center py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-lime/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-lime/5 rounded-full blur-[120px]" />
      </div>

      {/* Header / Nav */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 relative z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-accent-lime transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <a
          href={resumeImage}
          download="Ameen_Resume"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-accent-lime text-bg-base px-4 py-2 rounded-full font-bold text-sm hover:bg-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Download / Open
        </a>
      </div>

      {/* Resume Image Container */}
      <div className="w-full max-w-4xl relative z-10 shadow-2xl rounded-xl overflow-hidden border border-border-subtle bg-bg-surface">
        <Image
          src={resumeImage}
          alt="Ameen's Resume"
          width={1200}
          height={1600}
          className="w-full h-auto object-cover"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
