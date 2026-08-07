import Link from "next/link";

export default function Forbidden() {
  return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="font-mono text-xs text-accent-lime">403 / OWNER ONLY</p><h1 className="mt-3 text-3xl font-black uppercase">Access denied</h1><p className="mt-4 text-text-secondary">This admin is restricted to the configured GitHub owner.</p><Link className="mt-6 inline-flex min-h-11 items-center text-accent-lime" href="/">Return to portfolio</Link></div></main>;
}
