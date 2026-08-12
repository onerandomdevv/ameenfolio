"use client";

import { useRef, useState, useTransition } from "react";
import { GripVertical, LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteTechStackItem,
  reorderTechStack,
  saveTechStackItem,
} from "@/app/admin/actions/tech-stack";
import {
  AdminPage,
  FieldNote,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LineInput } from "@/components/admin/line-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { techStackGroups } from "@/config/tech-stack";
import type { TechStackGroupValue } from "@/config/tech-stack";
import type { TechStackItem } from "@/db/schema";
import { cn } from "@/lib/utils";

// Order is the list itself, so it is changed by moving things rather than by
// typing a number. Dragging across groups is also how a technology changes
// group — one gesture, not two fields.
export function TechStackManager({ items }: { items: TechStackItem[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<TechStackGroupValue | null>(null);
  const [adding, setAdding] = useState<TechStackGroupValue | null>(null);
  const [name, setName] = useState("");
  const [busy, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement | null>(null);

  // Server state wins whenever it changes underneath us — a save elsewhere, or
  // the refresh after our own write. Adjusted during render rather than in an
  // effect: an effect would paint the stale order first and then correct it.
  const [seen, setSeen] = useState(items);
  if (seen !== items) {
    setSeen(items);
    setRows(items);
  }

  function grouped(group: TechStackGroupValue) {
    return rows.filter((row) => row.groupKey === group);
  }

  function commit(next: TechStackItem[]) {
    setRows(next);
    startTransition(async () => {
      const result = await reorderTechStack(
        next.map((row, index) => ({
          id: row.id,
          groupKey: row.groupKey,
          displayOrder: index,
        })),
      );
      if (!result.ok) {
        toast.error(result.message);
        setRows(items);
        return;
      }
      router.refresh();
    });
  }

  function drop(group: TechStackGroupValue, beforeId: string | null) {
    if (!dragging) return;
    const moving = rows.find((row) => row.id === dragging);
    if (!moving) return;

    const without = rows.filter((row) => row.id !== dragging);
    const moved = { ...moving, groupKey: group };
    const at = beforeId
      ? without.findIndex((row) => row.id === beforeId)
      : without.length;
    const next = [...without];
    next.splice(at === -1 ? without.length : at, 0, moved);

    setDragging(null);
    setOver(null);
    commit(next);
  }

  // Dragging is mouse-only, so the same move is reachable from the keyboard.
  function nudge(item: TechStackItem, direction: -1 | 1) {
    const siblings = grouped(item.groupKey);
    const at = siblings.indexOf(item);
    const to = at + direction;
    if (to < 0 || to >= siblings.length) return;
    const target = siblings[to];
    const without = rows.filter((row) => row.id !== item.id);
    const insertAt = without.indexOf(target) + (direction === 1 ? 1 : 0);
    const next = [...without];
    next.splice(insertAt, 0, item);
    commit(next);
  }

  function add() {
    if (!adding || !name.trim()) return;
    startTransition(async () => {
      const result = await saveTechStackItem({
        name: name.trim(),
        groupKey: adding,
        displayOrder: grouped(adding).length,
        visible: true,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Added.");
      setAdding(null);
      setName("");
      router.refresh();
    });
  }

  function remove(item: TechStackItem) {
    startTransition(async () => {
      const result = await deleteTechStackItem(item.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Removed." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <AdminPage title="Tech Stack">
      <div className="max-w-[720px]">
        {techStackGroups.map((group, index) => (
          <div key={group.value} className={cn(index > 0 && "mt-8")}>
            <SectionHeading
              meta={
                <span className="font-mono tabular-nums">
                  {grouped(group.value).length}
                </span>
              }
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdding(group.value)}
                >
                  <Plus data-icon="inline-start" />
                  Add
                </Button>
              }
            >
              {group.label}
            </SectionHeading>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setOver(group.value);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={() => drop(group.value, null)}
              className={cn(
                "flex min-h-[46px] flex-wrap gap-2 rounded-lg py-1 transition-colors",
                over === group.value &&
                  "outline outline-1 outline-dashed outline-border",
              )}
            >
              {grouped(group.value).map((item) => (
                <span
                  key={item.id}
                  draggable
                  tabIndex={0}
                  onDragStart={() => setDragging(item.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation();
                    drop(group.value, item.id);
                  }}
                  onKeyDown={(event) => {
                    if (!event.altKey) return;
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      nudge(item, -1);
                    } else if (event.key === "ArrowRight") {
                      event.preventDefault();
                      nudge(item, 1);
                    }
                  }}
                  className={cn(
                    "inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] select-none active:cursor-grabbing",
                    dragging === item.id && "opacity-40",
                  )}
                >
                  <GripVertical
                    className="size-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {item.name}
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {!grouped(group.value).length ? (
                <span className="py-1 text-[12.5px] text-muted-foreground">
                  Nothing here yet.
                </span>
              ) : null}
            </div>
          </div>
        ))}

        <FieldNote>
          Keyboard: focus a chip and hold Alt with the arrow keys to move it.
          {busy ? " Saving…" : ""}
        </FieldNote>
      </div>

      <Dialog
        open={adding !== null}
        onOpenChange={(next) => {
          if (!next) {
            setAdding(null);
            setName("");
          }
        }}
      >
        <DialogContent className="admin-theme sm:max-w-sm">
          <DialogHeader>
            {/* Which group is not a question — it is the button that was
                pressed. The heading says where it is going. */}
            <DialogTitle>
              Add to{" "}
              {techStackGroups.find((group) => group.value === adding)?.label}
            </DialogTitle>
            <DialogDescription>
              It joins the end of the group. Drag it wherever you want
              afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 border-b border-border/60 py-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center sm:gap-4">
            <span className="text-[13px] text-muted-foreground">Name</span>
            <LineInput
              ref={nameRef}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
              placeholder="e.g. Bun"
            />
          </div>
          <DialogFooter>
            <Button onClick={add} disabled={busy || !name.trim()}>
              {busy ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
