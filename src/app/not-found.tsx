import Link from "next/link";
import { GlitchText } from "@/components/ui/glitch-text";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center p-4">
      <div className="space-y-8 relative z-10">
        {/* Large Glitched 404 */}
        <h1 className="text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-accent-lime opacity-90 select-none">
          <GlitchText text="404" />
        </h1>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-white">
            System Error
          </h2>
          <p className="text-white/50 font-mono text-sm md:text-base">
            Coordinates invalid. The requested sector does not exist.
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-lime text-black font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all duration-300 rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Base
          </Link>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-lime/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
