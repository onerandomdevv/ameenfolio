"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  ExternalLink,
  FolderKanban,
  Menu,
  Settings,
  Wrench,
} from "lucide-react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/recognitions", label: "Recognitions", icon: Award },
  { href: "/admin/technologies", label: "Technologies", icon: Wrench },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

function Brand() {
  return (
    <p className="font-black uppercase tracking-tight">
      Ameen<span className="text-primary">folio</span>
    </p>
  );
}

function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => (
        <Button
          asChild
          key={href}
          variant={pathname.startsWith(href) ? "default" : "ghost"}
          className="justify-start"
        >
          <Link href={href}>
            <Icon data-icon="inline-start" />
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

export function DesktopAdminNav() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background p-5 lg:block">
      <div className="mb-8 text-lg">
        <Brand />
      </div>
      <NavLinks />
      <div className="absolute right-5 bottom-5 left-5 grid gap-1">
        <Button asChild variant="ghost" className="justify-start">
          <a href="/" target="_blank" rel="noreferrer">
            View portfolio
            <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
        <SignOutButton />
      </div>
    </aside>
  );
}

export function MobileAdminNav() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur lg:hidden">
      <Brand />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Open admin navigation"
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>Manage portfolio content.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <NavLinks />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
