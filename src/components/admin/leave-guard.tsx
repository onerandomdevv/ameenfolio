"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Leaving unpublished work is the only place a draft is offered. Something
// already on the site has nowhere to be drafted back to, so editing it and
// pressing Cancel just leaves — the caller decides by not opening this.
export function LeaveGuard({
  open,
  noun,
  onOpenChange,
  onDiscard,
  onSaveDraft,
  saving,
}: {
  open: boolean;
  noun: string;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
  saving?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save this {noun} as a draft?</AlertDialogTitle>
          <AlertDialogDescription>
            You have written something but not published it. Keep it as a draft
            to come back to, or delete it and start over.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Cancel closes and returns to the form. A modal with only two
              destructive-ish choices would trap someone who hit Cancel by
              mistake. */}
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/40 px-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete
          </button>
          <AlertDialogAction onClick={onSaveDraft} disabled={saving}>
            Save draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
