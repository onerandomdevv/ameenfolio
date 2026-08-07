"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteProjectButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Delete ${title}`}><Trash2 className="size-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete “{title}”?</AlertDialogTitle><AlertDialogDescription>This removes the project and its managed icon. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={pending} className="bg-destructive text-white" onClick={() => startTransition(async () => { const result = await deleteProject(id); if (result.ok) { toast.success("Project deleted."); router.refresh(); } else toast.error(result.message); })}>Delete project</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
