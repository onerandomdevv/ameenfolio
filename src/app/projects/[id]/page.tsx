"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { GlitchText } from "@/components/ui/glitch-text";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

function ProjectDetailsContent() {
  const params = useParams();
  const id = params?.id;

  // Placeholder for data fetching logic
  // const project = await fetchProject(id);
  const project = null; // Currently null as database is empty

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-accent-lime/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl w-full border border-accent-lime/30 bg-bg-glass backdrop-blur-xl p-8 lg:p-12 rounded-2xl lg:rounded-3xl text-center space-y-6 lg:space-y-8 shadow-[0_0_50px_-10px_rgba(204,255,0,0.1)]">
          <div className="w-20 h-20 bg-accent-lime/10 rounded-full flex items-center justify-center mx-auto border border-accent-lime/20">
            <AlertTriangle className="w-10 h-10 text-accent-lime animate-pulse" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">
              <span className="text-accent-lime">SYSTEM</span> ERROR
            </h1>
            <p className="text-text-secondary font-mono text-sm uppercase tracking-widest">
              // ID: {id} NOT_FOUND
              <br />
              // SECTOR: PUBLIC_DATABASE
              <br />
              // ACTION: RETRY_OR_ABORT
            </p>
          </div>

          <p className="text-text-muted leading-relaxed max-w-md mx-auto">
            The project coordinates you are attempting to access do not
            currently exist in the active registry. This may be due to a pending
            data injection or a restricted sector.
          </p>

          <div className="pt-4 flex justify-center">
            <Link href="/projects">
              <Button className="rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-accent-lime hover:scale-105 transition-all duration-300 h-14 px-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Database
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // NOTE: This section is unreachable until data is connected
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Future Project Layout Implementation */}
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ProjectDetailsContent />
    </Suspense>
  );
}
