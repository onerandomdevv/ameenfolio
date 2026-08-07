"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6"><h1 className="text-xl font-semibold">Admin request failed</h1><p className="mt-2 text-sm text-muted-foreground">The operation was logged on the server. Try the request again.</p><Button className="mt-5" onClick={reset}>Retry</Button></div>; }
