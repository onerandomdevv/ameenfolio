import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminRecognitions } from "@/db/queries";
import { AdminPage } from "@/components/admin/admin-primitives";
import { AdminRecognitionList } from "@/components/admin/recognition-list";
import { StatusFilter } from "@/components/admin/status-filter";
import { Button } from "@/components/ui/button";
import { adminBasePath } from "@/lib/admin-path";

export default async function RecognitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [items, base, params] = await Promise.all([
    getAdminRecognitions(),
    adminBasePath(),
    searchParams,
  ]);

  const showing = params.status === "draft" ? "draft" : "live";
  const live = items.filter((item) => item.published);
  const drafts = items.filter((item) => !item.published);

  return (
    <AdminPage
      title="Recognitions"
      description="Hackathon placings and anything else worth showing. Pinned ones appear on the homepage, newest first."
      actions={
        <>
          <StatusFilter live={live.length} drafts={drafts.length} />
          <Button asChild size="sm">
            <Link href={`${base}/recognitions/new`}>
              <Plus data-icon="inline-start" />
              Add recognition
            </Link>
          </Button>
        </>
      }
    >
      <AdminRecognitionList
        recognitions={showing === "draft" ? drafts : live}
        all={live}
        showing={showing}
      />
    </AdminPage>
  );
}
