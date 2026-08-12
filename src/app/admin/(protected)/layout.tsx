import { count, eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getDb } from "@/db/client";
import { posts, projects, recognitions, techStackItems } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// The counts beside each section are the point of having them: the sidebar
// says how much is in each area without opening it.
async function sectionCounts() {
  const db = getDb();
  const [projectRows, postRows, recognitionRows, techRows] = await Promise.all([
    db.select({ value: count() }).from(projects),
    db.select({ value: count() }).from(posts),
    db.select({ value: count() }).from(recognitions),
    db
      .select({ value: count() })
      .from(techStackItems)
      .where(eq(techStackItems.visible, true)),
  ]);

  return {
    "/projects": Number(projectRows[0]?.value ?? 0),
    "/writing": Number(postRows[0]?.value ?? 0),
    "/recognitions": Number(recognitionRows[0]?.value ?? 0),
    "/tech-stack": Number(techRows[0]?.value ?? 0),
  };
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const counts = await sectionCounts();

  return (
    // min-h-dvh so the grey reaches the bottom of short pages: the body itself
    // is painted black for the public site and would show through otherwise.
    <div className="admin-theme min-h-dvh bg-background text-foreground">
      <AdminSidebar counts={counts} />
      {/* Padded rather than gridded, because the sidebar is fixed — a grid
          column would scroll away with the content. */}
      <div className="pl-[62px] lg:pl-[216px]">
        <main className="w-full max-w-[940px] px-5 pb-24 pt-7 sm:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}
