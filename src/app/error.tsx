"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="font-mono text-xs text-accent-lime">CONTENT UNAVAILABLE</p><h1 className="mt-3 text-3xl font-black uppercase">Something went wrong</h1><p className="mt-4 text-text-secondary">The portfolio could not be loaded. Please try again.</p><Button className="mt-6 bg-accent-lime text-black hover:bg-white" onClick={reset}>Try again</Button></div></main>; }
