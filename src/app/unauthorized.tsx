import Link from "next/link";

export default function Unauthorized() {
  return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="font-mono text-xs text-accent-lime">401 / AUTHENTICATION REQUIRED</p><h1 className="mt-3 text-3xl font-black uppercase">Sign in required</h1><Link className="mt-6 inline-flex min-h-11 items-center text-accent-lime" href="/admin/login">Go to admin login</Link></div></main>;
}
