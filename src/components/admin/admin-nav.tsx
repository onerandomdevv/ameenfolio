"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, ExternalLink, FolderKanban, Menu, Settings, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SignOutButton } from "@/components/admin/sign-out-button";

const links = [
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/recognitions", label: "Recognitions", icon: Award },
  { href: "/admin/technologies", label: "Technologies", icon: Wrench },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

function NavLinks() {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" className="flex flex-col gap-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white", pathname.startsWith(href) && "bg-accent-lime text-black hover:bg-accent-lime hover:text-black")}><Icon className="size-4" />{label}</Link>)}</nav>;
}

export function DesktopAdminNav() {
  return <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-black/90 p-5 lg:block"><p className="mb-8 text-lg font-black uppercase tracking-tight">Ameen<span className="text-accent-lime">folio</span></p><NavLinks /><div className="absolute bottom-5 left-5 right-5 grid gap-1"><a href="/" target="_blank" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:text-white">View portfolio <ExternalLink className="size-4" /></a><SignOutButton /></div></aside>;
}

export function MobileAdminNav() {
  return <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/90 px-5 backdrop-blur lg:hidden"><p className="font-black uppercase">Ameen<span className="text-accent-lime">folio</span></p><Sheet><SheetTrigger asChild><Button size="icon" variant="outline" aria-label="Open admin navigation"><Menu className="size-5" /></Button></SheetTrigger><SheetContent side="left" className="w-72 border-white/10 bg-black"><SheetHeader><SheetTitle>Admin navigation</SheetTitle><SheetDescription>Manage portfolio content.</SheetDescription></SheetHeader><div className="px-4"><NavLinks /></div></SheetContent></Sheet></header>;
}
