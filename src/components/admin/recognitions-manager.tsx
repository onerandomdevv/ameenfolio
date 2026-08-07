"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Recognition } from "@/db/schema";
import { deleteRecognition, saveRecognition } from "@/app/admin/actions";
import { recognitionSchema, type RecognitionInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadField } from "@/components/admin/upload-field";
import { cleanupUpload } from "@/lib/cleanup-upload";

const empty: RecognitionInput = { title: "", issuer: "", description: "", displayOrder: 0, published: false };

export function RecognitionsManager({ items }: { items: Recognition[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recognition>();
  function launch(item?: Recognition) { setEditing(item); setOpen(true); }
  return <div><div className="mb-6 flex justify-end"><Button onClick={() => launch()} className="bg-accent-lime text-black hover:bg-white"><Plus className="size-4" />Add recognition</Button></div><div className="grid gap-3">{items.length ? items.map((item) => <article key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-card p-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><span className="text-xs text-muted-foreground">{item.published ? "Published" : "Draft"}</span></div><p className="mt-1 text-sm text-accent-lime">{item.issuer}</p><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p></div><div className="flex shrink-0 gap-1"><Button size="icon-sm" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => launch(item)}><Pencil className="size-4" /></Button><DeleteRecognition item={item} /></div></article>) : <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-muted-foreground">No recognitions yet.</p>}</div><RecognitionDialog key={editing?.id ?? "new"} open={open} onOpenChange={setOpen} item={editing} /></div>;
}

function RecognitionDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (open: boolean) => void; item?: Recognition }) {
  const form = useForm<RecognitionInput>({ resolver: zodResolver(recognitionSchema), defaultValues: item ? { title: item.title, issuer: item.issuer, description: item.description, recognizedOn: item.recognizedOn ?? undefined, verificationUrl: item.verificationUrl ?? undefined, iconKey: item.iconKey ?? undefined, iconAlt: item.iconAlt ?? undefined, displayOrder: item.displayOrder, published: item.published } : empty });
  const { register, control, setValue, setError, handleSubmit, formState: { errors, isSubmitting } } = form;
  const iconKey = useWatch({ control, name: "iconKey" });
  async function submit(values: RecognitionInput) { const result = await saveRecognition(values, item?.id); if (!result.ok) { if (values.iconKey && values.iconKey !== item?.iconKey) { await cleanupUpload(values.iconKey); setValue("iconKey", undefined); } Object.entries(result.fields ?? {}).forEach(([name, messages]) => setError(name as keyof RecognitionInput, { message: messages[0] })); toast.error(result.message); return; } toast.success(item ? "Recognition updated." : "Recognition created."); onOpenChange(false); window.location.reload(); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{item ? "Edit recognition" : "Add recognition"}</DialogTitle><DialogDescription>Capture the issuer, evidence, and display order.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(submit)}><FieldGroup className="gap-5"><RField label="Title" error={errors.title?.message} props={register("title")} /><RField label="Issuer" error={errors.issuer?.message} props={register("issuer")} /><Field data-invalid={Boolean(errors.description)}><FieldLabel htmlFor="recognition-description">Description</FieldLabel><Textarea id="recognition-description" rows={4} {...register("description")} /><FieldError>{errors.description?.message}</FieldError></Field><div className="grid gap-5 sm:grid-cols-2"><RField label="Date" type="date" error={errors.recognizedOn?.message} props={register("recognizedOn")} /><RField label="Display order" type="number" error={errors.displayOrder?.message} props={register("displayOrder", { valueAsNumber: true })} /></div><RField label="Verification URL" type="url" error={errors.verificationUrl?.message} props={register("verificationUrl")} /><div className="grid gap-5 sm:grid-cols-2"><UploadField resourceType="icon" value={iconKey} onChange={(key) => setValue("iconKey", key)} /><RField label="Icon alt text" error={errors.iconAlt?.message} props={register("iconAlt")} /></div><Controller control={control} name="published" render={({ field }) => <Field orientation="horizontal" className="rounded-xl border border-white/10 p-4"><FieldLabel className="flex-1" htmlFor="recognition-published">Published</FieldLabel><Switch id="recognition-published" checked={field.value} onCheckedChange={field.onChange} /></Field>} /></FieldGroup><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting} className="bg-accent-lime text-black hover:bg-white">Save recognition</Button></DialogFooter></form></DialogContent></Dialog>;
}

function RField({ label, type = "text", error, props }: { label: string; type?: string; error?: string; props: React.InputHTMLAttributes<HTMLInputElement> }) { return <Field data-invalid={Boolean(error)}><FieldLabel htmlFor={props.name}>{label}</FieldLabel><Input id={props.name} type={type} {...props} /><FieldError>{error}</FieldError></Field>; }

function DeleteRecognition({ item }: { item: Recognition }) { const [pending, start] = useTransition(); return <AlertDialog><AlertDialogTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={`Delete ${item.title}`}><Trash2 className="size-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete “{item.title}”?</AlertDialogTitle><AlertDialogDescription>This permanently removes the recognition and its managed icon.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={pending} className="bg-destructive text-white" onClick={() => start(async () => { const result = await deleteRecognition(item.id); if (result.ok) { toast.success("Recognition deleted."); window.location.reload(); } else { toast.error(result.message); } })}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>; }
